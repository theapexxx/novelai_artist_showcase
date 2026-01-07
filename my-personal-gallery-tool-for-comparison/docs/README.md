# 🎨 AI Artist Gallery

A local web application for managing and browsing your AI art generation reference images by artist.

## Features

- 📋 **Browse 900+ artists** with smooth performance
- ⭐ **Favorite artists** for quick access
- 🏷️ **Tag system** with custom categories
- 🔍 **Search** by artist name, tags, or favorite status
- 🆕 **Auto-detect new images** and tag them
- 💾 **Persistent storage** - all preferences saved
- 🎨 **Color-coded tags** for easy visual identification
- 📱 **Responsive design** works on all screen sizes

## Quick Start

### Prerequisites

- **Node.js** (version 14 or higher) - **REQUIRED** - [Download here](https://nodejs.org/)
  - Check if installed: Open Command Prompt and type `node --version`
  - If you see a version number, you're good!
  - If not, download and install the LTS version from nodejs.org
- **Windows 11** (or Windows 10)

### Installation

1. **Extract all files** to a folder on your computer
2. **Place your images** in the `artists` folder
   - Images must be `.png` format
   - Filenames must contain `__artist_ARTISTNAME__`
   - Example: `1.10__artist_ztdlb __,_1girl, solo,_cowboy shot s-1387635440.png`

### Running the Gallery

**Double-click `start-gallery.bat`**

That's it! The server will start automatically and your browser will open to the gallery.

## Usage Guide

### First Time Setup

1. Launch the gallery using `start-gallery.bat`
2. The gallery will scan your `artists` folder
3. New artists will be automatically tagged with "new"
4. Click "Acknowledge All New" to remove the "new" tag

### Browsing Artists

- **Expand/Collapse Galleries:** Click gallery headers
- **Search:** Type in the search bar to filter by name, tags, or "favorite"
- **Favorite:** Hover over an artist card and click the ⭐ icon
- **Manage Tags:** Hover over an artist card and click the 🏷️ icon

### Tag System

**Adding Tags:**
1. Click the 🏷️ icon on any artist card
2. Type a tag name in the input field
3. Press Enter or click "Add"
4. Or click a tag from the "Quick Add" section

**Removing Tags:**
- In the tag modal, click the × button next to any tag

**Managing Tags Globally:**
1. Click the ⚙️ Settings button
2. View all tags and their usage
3. Delete tags (removes from all artists)

### Keyboard Shortcuts

- **Esc** - Close any open modal
- **Enter** - Add tag (when in tag input field)

### Adding New Images

1. Add new `.png` files to the `artists` folder
2. Click the 🔄 Refresh button
3. New artists will be auto-tagged with "new"

## File Structure

```
gallery-project/
├── server.js              # Express server
├── start-gallery.bat      # Launcher script
├── gallery.html           # Main UI
├── styles.css             # Styling
├── app.js                 # Frontend logic
├── package.json           # Dependencies
├── config.json            # Your data (auto-generated)
└── artists/               # Your images
    └── *.png files
```

## Configuration

All your preferences are saved in `config.json`:
- Favorites
- Tags
- UI state (which galleries are expanded)

**Backup:** Simply copy `config.json` to save your data.

## Troubleshooting

### Server won't start
- **Check if Node.js is installed:** Open Command Prompt and type `node --version`
- **Check if port 3456 is available:** Close other applications using that port

### Images not appearing
- **Check filename format:** Must contain `__artist_NAME__`
- **Check file extension:** Only `.png` files are supported
- **Check artists folder:** Must be in the same folder as `server.js`

### Gallery is slow
- The app is optimized for 900+ images
- If you have 5000+ images, consider splitting them into multiple folders

### Lost all data
- Check if `config.json` exists
- If corrupted, delete it - the app will create a new one (but you'll lose favorites/tags)

## Port Configuration

Default port: `3456`

**To change the port:**
1. Edit `server.js`
2. Change `const PORT = 3456;` to your desired port
3. Update the URL in `start-gallery.bat` (line with `start http://localhost:3456`)

## Stopping the Server

**Option 1:** Close the minimized "Artist Gallery Server" window

**Option 2:** Press `Ctrl+C` in the server window

## Advanced Usage

### Running Manually

```bash
# Install dependencies (first time only)
npm install

# Start server
node server.js

# Open browser to http://localhost:3456
```

### Resetting All Data

1. Click ⚙️ Settings
2. Click "Reset All Data"
3. Confirm twice

This removes all favorites and tags but keeps your images.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript (no frameworks)
- **Storage:** JSON file (atomic writes)
- **Styling:** Pure CSS with CSS Grid

## File Naming Convention

Your image files must follow this pattern:

```
[anything]__artist_ARTISTNAME__[anything].png
```

**The parser extracts everything between `__artist_` and the next `__` (double underscore).**

**Examples:**
- ✅ `1.10__artist_ztdlb __,_1girl, solo,_cowboy shot s-1387635440.png`
  - Extracts: "ztdlb" (spaces trimmed)
- ✅ `__artist_john__portrait.png`
  - Extracts: "john"
- ✅ `2__artist_pic_artist__,_landscape s-999.png`
  - Extracts: "pic_artist" (underscores within the name are OK!)
- ❌ `artist_john.png` (missing double underscores)
- ❌ `__artist_john.jpg` (wrong file extension)

**Important:** Artist names CAN contain single underscores! The parser looks for the double underscore `__` to know where the name ends.

## Performance

- Tested with 900+ unique artists
- Smooth scrolling and interactions
- Low memory footprint (~50MB)
- Fast startup (~2 seconds)

## Future Enhancements

Potential features for future versions:
- Batch tagging (select multiple artists)
- Export/import tags
- Dark/light theme toggle
- Grid size customization
- Keyboard navigation
- Tag categories with nesting

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify your filename format is correct
3. Check the browser console (F12) for errors

## License

Personal use. Modify as needed.

---

**Enjoy browsing your AI artist collection! 🎨**
