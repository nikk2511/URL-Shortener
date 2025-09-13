const { v4: uuidv4 } = require('uuid');

// In-memory storage for Vercel (in production, use a database)
let urlData = {};

// Generate a random 6-character alphanumeric string
function generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Validate URL format
function validateURL(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

// Normalize URL (add https if no protocol)
function normalizeURL(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

// Find existing short code for a URL
function findExistingShortCode(longUrl) {
    for (const [shortCode, data] of Object.entries(urlData)) {
        if (data.longUrl === longUrl) {
            return shortCode;
        }
    }
    return null;
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            success: false 
        });
    }

    try {
        const { longUrl } = req.body;
        
        if (!longUrl) {
            return res.status(400).json({ 
                error: 'URL is required',
                success: false 
            });
        }

        const normalizedUrl = normalizeURL(longUrl.trim());
        
        if (!validateURL(normalizedUrl)) {
            return res.status(400).json({ 
                error: 'Invalid URL format',
                success: false 
            });
        }

        // Check if URL already exists
        const existingShortCode = findExistingShortCode(normalizedUrl);
        
        let shortCode;
        if (existingShortCode) {
            shortCode = existingShortCode;
        } else {
            // Generate new short code
            shortCode = generateShortCode();
            
            // Ensure uniqueness
            while (urlData[shortCode]) {
                shortCode = generateShortCode();
            }
        }

        // Create URL data
        const urlInfo = {
            id: uuidv4(),
            longUrl: normalizedUrl,
            shortCode: shortCode,
            createdAt: new Date().toISOString(),
            clickCount: urlData[shortCode]?.clickCount || 0,
            lastAccessed: null
        };

        // Store the mapping
        urlData[shortCode] = urlInfo;

        // Return success response
        res.json({
            success: true,
            shortCode: shortCode,
            shortUrl: `${req.headers.host ? 'https://' + req.headers.host : 'https://your-app.vercel.app'}/${shortCode}`,
            longUrl: normalizedUrl,
            clickCount: urlInfo.clickCount,
            createdAt: urlInfo.createdAt
        });

    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false 
        });
    }
};
