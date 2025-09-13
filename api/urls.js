// In-memory storage (in production, use a database)
let urlData = {};

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

    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            success: false 
        });
    }

    try {
        const urls = Object.entries(urlData).map(([shortCode, urlInfo]) => ({
            shortCode,
            shortUrl: `${req.headers.host ? 'https://' + req.headers.host : 'https://your-app.vercel.app'}/${shortCode}`,
            longUrl: urlInfo.longUrl,
            clickCount: urlInfo.clickCount,
            createdAt: urlInfo.createdAt,
            lastAccessed: urlInfo.lastAccessed
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
};
