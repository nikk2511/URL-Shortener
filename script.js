// URL Shortener Frontend JavaScript
class URLShortener {
    constructor() {
        this.baseUrl = window.location.origin;
        this.storageKey = 'urlShortenerData';
        this.useBackend = true; // Set to false for frontend-only mode
        this.disableQR = localStorage.getItem('urlShortenerDisableQR') === 'true';
        this.isVercel = window.location.hostname.includes('vercel.app');
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHistory();
        this.checkForRedirect();
        this.checkBackendHealth();
        this.checkQRCodeLibrary();
        this.updateQRToggleButton();
    }

    bindEvents() {
        const form = document.getElementById('urlForm');
        const copyBtn = document.getElementById('copyBtn');
        const urlHistory = document.getElementById('urlHistory');
        const modeToggle = document.getElementById('modeToggle');
        const toggleQR = document.getElementById('toggleQR');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        copyBtn.addEventListener('click', () => this.copyToClipboard());
        urlHistory.addEventListener('click', (e) => this.handleHistoryClick(e));
        modeToggle.addEventListener('click', () => this.toggleMode());
        toggleQR.addEventListener('click', () => this.toggleQR());
    }

    // Generate a random 6-character alphanumeric string
    generateShortCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Validate URL format
    validateURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Normalize URL (add https if no protocol)
    normalizeURL(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    // Handle form submission
    async handleSubmit(e) {
        e.preventDefault();
        
        const longUrlInput = document.getElementById('longUrl');
        const shortenBtn = document.getElementById('shortenBtn');
        const errorMessage = document.getElementById('errorMessage');
        
        const longUrl = longUrlInput.value.trim();
        
        // Clear previous errors
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
        
        // Validate URL
        if (!longUrl) {
            this.showError('Please enter a URL');
            return;
        }

        const normalizedUrl = this.normalizeURL(longUrl);
        
        if (!this.validateURL(normalizedUrl)) {
            this.showError('Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            let result;
            
            if (this.useBackend) {
                try {
                    // Use backend API
                    result = await this.shortenWithBackend(normalizedUrl);
                } catch (backendError) {
                    console.warn('Backend unavailable, falling back to frontend mode:', backendError);
                    this.useBackend = false;
                    result = await this.shortenWithFrontend(normalizedUrl);
                }
            } else {
                // Use frontend-only mode
                result = await this.shortenWithFrontend(normalizedUrl);
            }

            // Display result
            this.displayResult(result.shortCode, result);
            
            // Clear form
            longUrlInput.value = '';
            
            // Reload history
            this.loadHistory();

        } catch (error) {
            console.error('Error shortening URL:', error);
            this.showError(`Error: ${error.message}. Please try again or check the console for details.`);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Shorten URL using backend API
    async shortenWithBackend(longUrl) {
        try {
            console.log('Attempting to shorten URL:', longUrl);
            
            const apiUrl = this.isVercel ? '/api/shorten' : '/api/shorten';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ longUrl })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to shorten URL');
            }

            return {
                shortCode: data.shortCode,
                longUrl: data.longUrl,
                createdAt: data.createdAt,
                clickCount: data.clickCount
            };
        } catch (error) {
            console.error('Backend API error:', error);
            throw error;
        }
    }

    // Shorten URL using frontend-only mode
    async shortenWithFrontend(longUrl) {
        // Check if URL already exists
        const existingData = this.getStoredData();
        const existingShortCode = this.findExistingShortCode(existingData, longUrl);
        
        let shortCode;
        if (existingShortCode) {
            shortCode = existingShortCode;
        } else {
            // Generate new short code
            shortCode = this.generateShortCode();
            
            // Ensure uniqueness
            while (existingData[shortCode]) {
                shortCode = this.generateShortCode();
            }
        }

        // Store the mapping
        const urlData = {
            longUrl: longUrl,
            shortCode: shortCode,
            createdAt: new Date().toISOString(),
            clickCount: existingData[shortCode]?.clickCount || 0
        };

        existingData[shortCode] = urlData;
        this.saveData(existingData);

        return urlData;
    }

    // Find existing short code for a URL
    findExistingShortCode(data, longUrl) {
        for (const [shortCode, urlData] of Object.entries(data)) {
            if (urlData.longUrl === longUrl) {
                return shortCode;
            }
        }
        return null;
    }

    // Show error message
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    }

    // Set loading state
    setLoadingState(loading) {
        const shortenBtn = document.getElementById('shortenBtn');
        const longUrlInput = document.getElementById('longUrl');
        
        if (loading) {
            shortenBtn.disabled = true;
            shortenBtn.innerHTML = '<span class="loading"></span> Shortening...';
            longUrlInput.disabled = true;
        } else {
            shortenBtn.disabled = false;
            shortenBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Shorten URL';
            longUrlInput.disabled = false;
        }
    }

    // Display the shortened URL result
    displayResult(shortCode, urlData) {
        const resultsSection = document.getElementById('resultsSection');
        const shortUrlInput = document.getElementById('shortUrl');
        const clickCount = document.getElementById('clickCount');
        const createdAt = document.getElementById('createdAt');
        const qrCode = document.getElementById('qrCode');

        const shortUrl = `${this.baseUrl}/${shortCode}`;
        
        shortUrlInput.value = shortUrl;
        clickCount.textContent = `Clicks: ${urlData.clickCount}`;
        createdAt.textContent = `Created: ${new Date(urlData.createdAt).toLocaleDateString()}`;
        
        // Generate QR code
        this.generateQRCode(shortUrl, qrCode);
        
        // Show results with animation
        resultsSection.style.display = 'block';
        resultsSection.classList.add('success-animation');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Generate QR code
    generateQRCode(text, container) {
        console.log('Generating QR code for:', text);
        container.innerHTML = '';
        
        // Check if QR code is disabled
        if (this.disableQR) {
            container.innerHTML = `
                <div style="width: 120px; height: 120px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: #666;">
                    QR Code<br>disabled
                </div>
            `;
            return;
        }
        
        // Always try simple QR first for reliability
        this.generateSimpleQR(text, container);
        
        // Also try to load CDN library in background
        if (typeof QRCode === 'undefined') {
            this.loadQRCodeLibrary();
        }
    }

    // Generate simple QR code using local fallback
    generateSimpleQR(text, container) {
        console.log('Attempting to generate simple QR code...');
        console.log('SimpleQRGenerator available:', typeof SimpleQRGenerator !== 'undefined');
        
        if (typeof SimpleQRGenerator !== 'undefined') {
            try {
                const generator = new SimpleQRGenerator();
                generator.generate(text, container);
                console.log('Simple QR code generation completed');
            } catch (error) {
                console.error('Error in simple QR generation:', error);
                this.showQRCodeUnavailable(container);
            }
        } else {
            console.warn('SimpleQRGenerator not available, showing fallback');
            this.showQRCodeUnavailable(container);
        }
    }

    // Show QR code unavailable message
    showQRCodeUnavailable(container) {
        container.innerHTML = `
            <div style="width: 120px; height: 120px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: #666; background: #f8f9fa;">
                <div>
                    QR Code<br>
                    <small>unavailable</small><br>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('shortUrl').value)" style="font-size: 10px; padding: 2px 6px; margin-top: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">Copy URL</button>
                </div>
            </div>
        `;
    }

    // Copy to clipboard
    async copyToClipboard() {
        const shortUrlInput = document.getElementById('shortUrl');
        const copyBtn = document.getElementById('copyBtn');
        
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);
            
            // Visual feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy:', error);
            
            // Fallback for older browsers
            shortUrlInput.select();
            shortUrlInput.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            } catch (fallbackError) {
                this.showError('Failed to copy to clipboard');
            }
        }
    }

    // Load and display URL history
    async loadHistory() {
        const urlHistory = document.getElementById('urlHistory');
        
        try {
            let urls = [];
            
            if (this.useBackend) {
                // Load from backend API
                const apiUrl = this.isVercel ? '/api/urls' : '/api/urls';
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if (data.success) {
                    urls = data.urls.map(url => [url.shortCode, url]);
                }
            } else {
                // Load from localStorage
                const data = this.getStoredData();
                urls = Object.entries(data).sort((a, b) => 
                    new Date(b[1].createdAt) - new Date(a[1].createdAt)
                );
            }

            if (urls.length === 0) {
                urlHistory.innerHTML = '<p class="no-urls">No URLs shortened yet. Create your first short URL above!</p>';
                return;
            }

            urlHistory.innerHTML = urls.map(([shortCode, urlData]) => `
                <div class="url-item" data-short-code="${shortCode}">
                    <div class="url-info">
                        <a href="${this.baseUrl}/${shortCode}" class="short-url" target="_blank">
                            ${this.baseUrl}/${shortCode}
                        </a>
                        <div class="long-url">${urlData.longUrl}</div>
                    </div>
                    <div class="url-stats">
                        <span>Clicks: ${urlData.clickCount || 0}</span>
                        <span>${new Date(urlData.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="url-actions">
                        <button class="action-btn copy-action" data-url="${this.baseUrl}/${shortCode}">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn delete-action" data-short-code="${shortCode}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
            urlHistory.innerHTML = '<p class="no-urls">Error loading URL history. Please refresh the page.</p>';
        }
    }

    // Handle clicks in history section
    async handleHistoryClick(e) {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('copy-action')) {
            const url = target.dataset.url;
            try {
                await navigator.clipboard.writeText(url);
                this.showTemporaryMessage('URL copied to clipboard!');
            } catch (error) {
                this.showError('Failed to copy URL');
            }
        } else if (target.classList.contains('delete-action')) {
            const shortCode = target.dataset.shortCode;
            if (confirm('Are you sure you want to delete this URL?')) {
                this.deleteURL(shortCode);
            }
        }
    }

    // Delete a URL from storage
    async deleteURL(shortCode) {
        try {
            if (this.useBackend) {
                // Delete via backend API
                const response = await fetch(`/api/urls/${shortCode}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Failed to delete URL');
                }
            } else {
                // Delete from localStorage
                const data = this.getStoredData();
                delete data[shortCode];
                this.saveData(data);
            }
            
            this.loadHistory();
            this.showTemporaryMessage('URL deleted successfully');
        } catch (error) {
            console.error('Error deleting URL:', error);
            this.showError('Failed to delete URL. Please try again.');
        }
    }

    // Show temporary message
    showTemporaryMessage(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        errorMessage.style.background = '#d4edda';
        errorMessage.style.borderColor = '#c3e6cb';
        errorMessage.style.color = '#155724';
        
        setTimeout(() => {
            errorMessage.classList.remove('show');
            errorMessage.style.background = '';
            errorMessage.style.borderColor = '';
            errorMessage.style.color = '';
        }, 3000);
    }

    // Check if we need to redirect (for short URL access)
    checkForRedirect() {
        const path = window.location.pathname;
        const shortCode = path.substring(1); // Remove leading slash
        
        if (shortCode && shortCode.length === 6) {
            this.redirectToLongURL(shortCode);
        }
    }

    // Check if backend is available
    async checkBackendHealth() {
        const modeStatus = document.getElementById('modeStatus');
        const modeToggle = document.getElementById('modeToggle');
        
        if (!this.useBackend) {
            modeStatus.textContent = 'Frontend-only mode (localStorage)';
            modeToggle.style.display = 'inline-block';
            modeToggle.textContent = 'Switch to Backend';
            return;
        }
        
        try {
            const apiUrl = this.isVercel ? '/api/health' : '/api/health';
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Backend health check failed');
            }
            console.log('Backend is available');
            modeStatus.textContent = this.isVercel ? 'Backend mode (Vercel)' : 'Backend mode (server)';
            modeToggle.style.display = 'inline-block';
            modeToggle.textContent = 'Switch to Frontend';
        } catch (error) {
            console.warn('Backend unavailable, switching to frontend mode:', error);
            this.useBackend = false;
            modeStatus.textContent = 'Backend unavailable - using Frontend mode';
            modeToggle.style.display = 'inline-block';
            modeToggle.textContent = 'Retry Backend';
        }
    }

    // Toggle between backend and frontend modes
    toggleMode() {
        this.useBackend = !this.useBackend;
        this.checkBackendHealth();
        this.loadHistory();
        
        if (this.useBackend) {
            this.showTemporaryMessage('Switched to Backend mode');
        } else {
            this.showTemporaryMessage('Switched to Frontend mode');
        }
    }

    // Check if QRCode library is loaded
    checkQRCodeLibrary() {
        console.log('Checking QR code libraries...');
        console.log('QRCode library available:', typeof QRCode !== 'undefined');
        console.log('SimpleQRGenerator available:', typeof SimpleQRGenerator !== 'undefined');
        
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not loaded, attempting to load...');
            this.loadQRCodeLibrary();
        } else {
            console.log('QRCode library loaded successfully');
        }
    }

    // Load QRCode library dynamically
    loadQRCodeLibrary() {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = () => {
            console.log('QRCode library loaded successfully');
        };
        script.onerror = () => {
            console.error('Failed to load QRCode library from CDN, trying alternative CDN...');
            this.loadQRCodeLibraryAlternative();
        };
        document.head.appendChild(script);
    }

    // Try alternative CDN for QRCode library
    loadQRCodeLibraryAlternative() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = () => {
            console.log('QRCode library loaded successfully from alternative CDN');
        };
        script.onerror = () => {
            console.error('Failed to load QRCode library from all CDNs');
            this.showQRCodeUnavailable();
        };
        document.head.appendChild(script);
    }


    // Update QR toggle button text
    updateQRToggleButton() {
        const toggleBtn = document.getElementById('toggleQR');
        if (toggleBtn) {
            toggleBtn.textContent = this.disableQR ? 'Enable QR' : 'Disable QR';
        }
    }

    // Toggle QR code generation
    toggleQR() {
        this.disableQR = !this.disableQR;
        localStorage.setItem('urlShortenerDisableQR', this.disableQR.toString());
        
        this.updateQRToggleButton();
        
        // Regenerate QR code if there's a current result
        const qrCode = document.getElementById('qrCode');
        if (qrCode && qrCode.innerHTML.trim()) {
            const shortUrl = document.getElementById('shortUrl').value;
            if (shortUrl) {
                this.generateQRCode(shortUrl, qrCode);
            }
        }
        
        this.showTemporaryMessage(this.disableQR ? 'QR Code disabled' : 'QR Code enabled');
    }

    // Redirect to the original long URL
    redirectToLongURL(shortCode) {
        const data = this.getStoredData();
        const urlData = data[shortCode];
        
        if (urlData) {
            // Increment click count
            urlData.clickCount = (urlData.clickCount || 0) + 1;
            this.saveData(data);
            
            // Redirect to the long URL
            window.location.href = urlData.longUrl;
        } else {
            // Show 404 page
            document.body.innerHTML = `
                <div class="container" style="text-align: center; padding-top: 100px;">
                    <h1 style="color: white; font-size: 3rem; margin-bottom: 20px;">404</h1>
                    <p style="color: white; font-size: 1.2rem; margin-bottom: 30px;">Short URL not found</p>
                    <a href="/" style="color: white; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 10px;">
                        Go to Homepage
                    </a>
                </div>
            `;
        }
    }

    // Get data from localStorage
    getStoredData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            return {};
        }
    }

    // Save data to localStorage
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }
}

// Initialize the URL Shortener when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new URLShortener();
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    // Reload the page to handle navigation properly
    window.location.reload();
});
