const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// CORS middleware for API requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Data management functions
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty object
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error('Error loading data:', error);
        return {};
    }
}

async function saveData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
}

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
function findExistingShortCode(data, longUrl) {
    for (const [shortCode, urlData] of Object.entries(data)) {
        if (urlData.longUrl === longUrl) {
            return shortCode;
        }
    }
    return null;
}

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to shorten a URL
app.post('/api/shorten', async (req, res) => {
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

        // Load existing data
        const data = await loadData();
        
        // Check if URL already exists
        const existingShortCode = findExistingShortCode(data, normalizedUrl);
        
        let shortCode;
        if (existingShortCode) {
            shortCode = existingShortCode;
        } else {
            // Generate new short code
            shortCode = generateShortCode();
            
            // Ensure uniqueness
            while (data[shortCode]) {
                shortCode = generateShortCode();
            }
        }

        // Create URL data
        const urlData = {
            id: uuidv4(),
            longUrl: normalizedUrl,
            shortCode: shortCode,
            createdAt: new Date().toISOString(),
            clickCount: data[shortCode]?.clickCount || 0,
            lastAccessed: null
        };

        // Store the mapping
        data[shortCode] = urlData;
        await saveData(data);

        // Return success response
        res.json({
            success: true,
            shortCode: shortCode,
            shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
            longUrl: normalizedUrl,
            clickCount: urlData.clickCount,
            createdAt: urlData.createdAt
        });

    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false 
        });
    }
});

// API endpoint to get URL statistics
app.get('/api/stats/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const data = await loadData();
        const urlData = data[shortCode];
        
        if (!urlData) {
            return res.status(404).json({ 
                error: 'Short URL not found',
                success: false 
            });
        }

        res.json({
            success: true,
            shortCode: shortCode,
            longUrl: urlData.longUrl,
            clickCount: urlData.clickCount,
            createdAt: urlData.createdAt,
            lastAccessed: urlData.lastAccessed
        });

    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false 
        });
    }
});

// API endpoint to get all URLs
app.get('/api/urls', async (req, res) => {
    try {
        const data = await loadData();
        const urls = Object.entries(data).map(([shortCode, urlData]) => ({
            shortCode,
            shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
            longUrl: urlData.longUrl,
            clickCount: urlData.clickCount,
            createdAt: urlData.createdAt,
            lastAccessed: urlData.lastAccessed
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            urls: urls,
            total: urls.length
        });

    } catch (error) {
        console.error('Error getting URLs:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false 
        });
    }
});

// API endpoint to delete a URL
app.delete('/api/urls/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        const data = await loadData();
        
        if (!data[shortCode]) {
            return res.status(404).json({ 
                error: 'Short URL not found',
                success: false 
            });
        }

        delete data[shortCode];
        await saveData(data);

        res.json({
            success: true,
            message: 'URL deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting URL:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false 
        });
    }
});

// Redirect route for short URLs
app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // Validate short code format (6 alphanumeric characters)
        if (!/^[A-Za-z0-9]{6}$/.test(shortCode)) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - URL Not Found</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0;
                        }
                        .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; }
                        h1 { font-size: 3rem; margin-bottom: 20px; }
                        p { font-size: 1.2rem; margin-bottom: 30px; }
                        a { color: white; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>404</h1>
                        <p>Short URL not found</p>
                        <a href="/">Go to Homepage</a>
                    </div>
                </body>
                </html>
            `);
        }

        const data = await loadData();
        const urlData = data[shortCode];
        
        if (!urlData) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - URL Not Found</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0;
                        }
                        .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; }
                        h1 { font-size: 3rem; margin-bottom: 20px; }
                        p { font-size: 1.2rem; margin-bottom: 30px; }
                        a { color: white; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>404</h1>
                        <p>Short URL not found</p>
                        <a href="/">Go to Homepage</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Increment click count and update last accessed
        urlData.clickCount = (urlData.clickCount || 0) + 1;
        urlData.lastAccessed = new Date().toISOString();
        
        // Save updated data
        data[shortCode] = urlData;
        await saveData(data);

        // Redirect to the long URL
        res.redirect(302, urlData.longUrl);

    } catch (error) {
        console.error('Error redirecting URL:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>500 - Server Error</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                    }
                    .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; }
                    h1 { font-size: 3rem; margin-bottom: 20px; }
                    p { font-size: 1.2rem; margin-bottom: 30px; }
                    a { color: white; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>500</h1>
                    <p>Server error occurred</p>
                    <a href="/">Go to Homepage</a>
                </div>
            </body>
            </html>
        `);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        success: false 
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        success: false 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 URL Shortener server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
