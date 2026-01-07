const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;
const ARTISTS_DIR = './artists';
const CONFIG_FILE = './config.json';

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased for large artist collections
app.use(express.static(__dirname));

// Redirect root to gallery
app.get('/', (req, res) => {
  res.redirect('/gallery.html');
});

// API: Get all images from artists folder
app.get('/api/images', (req, res) => {
  try {
    if (!fs.existsSync(ARTISTS_DIR)) {
      return res.status(404).json({ 
        error: 'artists folder not found',
        message: 'Please create an "artists" folder next to server.js and add your images.'
      });
    }
    
    const files = fs.readdirSync(ARTISTS_DIR)
      .filter(f => f.toLowerCase().endsWith('.png'))
      .sort();
    
    res.json({ files, count: files.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Load config
app.get('/api/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      // Return default config structure
      const defaultConfig = {
        artists: {},
        uiState: {
          expandedGalleries: [],
          sortOrder: 'alphabetical'
        },
        globalTags: []
      };
      res.json(defaultConfig);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Save config (atomic write)
app.post('/api/config', (req, res) => {
  const tempFile = CONFIG_FILE + '.tmp';
  
  try {
    // Write to temporary file first
    fs.writeFileSync(tempFile, JSON.stringify(req.body, null, 2), 'utf8');
    
    // Atomic rename (cannot corrupt existing file)
    fs.renameSync(tempFile, CONFIG_FILE);
    
    res.json({ success: true });
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Artist Gallery Server Running       ║
║   http://localhost:${PORT}              ║
╚═══════════════════════════════════════╝

Press Ctrl+C to stop the server.
  `);
});
