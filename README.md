# 🔗 URL Shortener

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A modern, full-featured URL shortener web application built with HTML, CSS, JavaScript, and Node.js. Transform your long URLs into short, shareable links with QR code generation, click tracking, and a beautiful responsive interface.

## ✨ Features

### 🎯 Core Functionality
- **URL Shortening**: Convert long URLs to short 6-character alphanumeric codes
- **URL Validation**: Comprehensive input validation and error handling
- **Automatic Redirect**: Seamless redirection from short URLs to original URLs
- **Click Tracking**: Monitor usage statistics for each shortened URL
- **Duplicate Detection**: Reuses existing short codes for identical URLs

### 🎨 User Interface
- **Modern Design**: Clean, gradient-based interface with smooth animations
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Real-time Feedback**: Loading states, success animations, and error messages
- **Copy to Clipboard**: One-click copying of shortened URLs
- **QR Code Generation**: Automatic QR code creation with fallback support

### 📊 Advanced Features
- **URL History**: View and manage all previously shortened URLs
- **Statistics Dashboard**: Track click counts, creation dates, and usage patterns
- **URL Management**: Delete unwanted short URLs
- **Custom 404 Pages**: User-friendly error handling for invalid URLs
- **RESTful API**: Complete API for programmatic access
- **Dual Mode Support**: Works with or without backend server

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (v6 or higher) - Comes with Node.js

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nikk2511/URL-Shortener.git
   cd URL-Shortener
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## 📁 Project Structure

```
URL-Shortener/
├── index.html              # Main application page
├── styles.css              # CSS styling and responsive design
├── script.js               # Frontend JavaScript with dual mode support
├── server.js               # Node.js Express backend server
├── qr-generator.js         # Local QR code generator fallback
├── package.json            # Dependencies and npm scripts
├── .gitignore              # Git ignore rules
├── data.json               # Backend data storage (auto-created)
└── README.md               # Project documentation
```

## 🔧 API Endpoints

### Shorten URL
```http
POST /api/shorten
Content-Type: application/json

{
  "longUrl": "https://example.com/very/long/url"
}
```

**Response:**
```json
{
  "success": true,
  "shortCode": "abc123",
  "shortUrl": "http://localhost:3000/abc123",
  "longUrl": "https://example.com/very/long/url",
  "clickCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get URL Statistics
```http
GET /api/stats/:shortCode
```

**Response:**
```json
{
  "success": true,
  "shortCode": "abc123",
  "longUrl": "https://example.com/very/long/url",
  "clickCount": 42,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastAccessed": "2024-01-02T12:30:00.000Z"
}
```

### Get All URLs
```http
GET /api/urls
```

### Delete URL
```http
DELETE /api/urls/:shortCode
```

### Health Check
```http
GET /api/health
```

## 🎯 Usage Examples

### Frontend Only Mode
The application automatically falls back to frontend-only mode if the backend is unavailable:
- Uses browser localStorage for data persistence
- Perfect for personal use and offline functionality
- No server required

### Full Stack Mode
With the Node.js backend running:
- Server-side URL storage in JSON file
- Complete API endpoints
- Advanced click tracking
- Data persistence across sessions

## 🛠️ Customization

### Change Base URL
Update the base URL in `script.js`:
```javascript
this.baseUrl = 'https://yourdomain.com';
```

### Modify Short Code Length
Change the length in both `script.js` and `server.js`:
```javascript
// Change from 6 to desired length
for (let i = 0; i < 6; i++) {
    // ...
}
```

### Styling Customization
Modify `styles.css` to customize:
- Color schemes and gradients
- Typography and fonts
- Layout and spacing
- Responsive breakpoints
- Animation effects

### QR Code Settings
- Toggle QR code generation on/off
- Customize QR code appearance
- Configure fallback behavior

## 🔒 Security Features

- **URL Validation**: Comprehensive input validation prevents malicious URLs
- **Input Sanitization**: All user inputs are properly sanitized
- **CORS Support**: Configurable cross-origin request handling
- **Error Handling**: Graceful error management with user-friendly messages
- **Rate Limiting**: Built-in protection against abuse (configurable)

## 📱 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 65+ | ✅ Full |
| Firefox | 55+ | ✅ Full |
| Safari | 12+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Mobile Browsers | Latest | ✅ Full |

## 🚀 Deployment

### Vercel
1. Connect your GitHub repository
2. Deploy automatically on push
3. Environment variables: `PORT=3000`

### Netlify
1. Connect your GitHub repository
2. Build command: `npm install && npm start`
3. Publish directory: `/`

### Heroku
1. Create a `Procfile`:
   ```
   web: node server.js
   ```
2. Deploy via GitHub integration

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure mobile responsiveness

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process using port 3000
npx kill-port 3000
# Or use a different port
PORT=3001 npm start
```

**QR Code not working:**
- Check browser console for errors
- Try disabling QR codes temporarily
- Ensure internet connection for CDN libraries

**Backend not starting:**
- Verify Node.js version (14+)
- Check if port 3000 is available
- Review error messages in terminal

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) - QR code generation
- [Font Awesome](https://fontawesome.com/) - Icons
- [UUID](https://www.npmjs.com/package/uuid) - Unique identifier generation

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nikk2511/URL-Shortener/issues)
- **Documentation**: Check this README for common solutions
- **Email**: Contact the development team

## 📈 Roadmap

- [ ] User authentication and accounts
- [ ] Custom short code support
- [ ] Bulk URL shortening
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] URL expiration dates
- [ ] Password-protected URLs

---

**Made with ❤️ by [nikk2511](https://github.com/nikk2511)**

⭐ **Star this repository if you found it helpful!**
