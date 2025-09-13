// Vercel entry point - serves static files
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Determine the file to serve
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query parameters
    filePath = filePath.split('?')[0];
    
    // Security check - prevent directory traversal
    if (filePath.includes('..')) {
        res.status(403).send('Forbidden');
        return;
    }
    
    // Map file extensions to MIME types
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml'
    };
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Set content type
    res.setHeader('Content-Type', contentType);
    
    // Try to read the file
    try {
        const fullPath = path.join(__dirname, filePath);
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        res.status(200).send(fileContent);
    } catch (error) {
        // If file not found, serve index.html for SPA routing
        if (error.code === 'ENOENT') {
            try {
                const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.status(200).send(indexContent);
            } catch (indexError) {
                res.status(404).send('File not found');
            }
        } else {
            res.status(500).send('Internal server error');
        }
    }
};
