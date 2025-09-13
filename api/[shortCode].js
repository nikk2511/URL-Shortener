// In-memory storage (in production, use a database)
let urlData = {};

module.exports = async (req, res) => {
    const { shortCode } = req.query;
    
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

    const urlInfo = urlData[shortCode];
    
    if (!urlInfo) {
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
    urlInfo.clickCount = (urlInfo.clickCount || 0) + 1;
    urlInfo.lastAccessed = new Date().toISOString();
    
    // Update stored data
    urlData[shortCode] = urlInfo;

    // Redirect to the long URL
    res.redirect(302, urlInfo.longUrl);
};
