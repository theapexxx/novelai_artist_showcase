# Setup Instructions

## Prerequisites

**⚠️ IMPORTANT: You MUST have Node.js installed!**

### Check if Node.js is installed:
1. Open Command Prompt (Windows key + R, type `cmd`, press Enter)
2. Type: `node --version`
3. Press Enter

**If you see a version number** (like `v18.17.0`): ✅ You're ready!

**If you get an error** (`'node' is not recognized...`): ❌ Install Node.js first!

### Install Node.js:
1. Go to https://nodejs.org/
2. Download the **LTS version** (green button)
3. Run the installer (use all default settings)
4. **Restart your computer**
5. Verify installation: `node --version` in Command Prompt

---

## Step-by-Step Setup

### 1. Create Project Folder
Create a new folder anywhere on your computer, for example:
- `C:\Users\YourName\Documents\artist-gallery`

### 2. Extract All Files
Place all these files in that folder:
- package.json
- server.js
- gallery.html
- styles.css
- app.js
- start-gallery.bat
- README.md

### 3. Create Artists Folder
Create a folder named `artists` (lowercase) in the same directory:

```
artist-gallery/
├── package.json
├── server.js
├── gallery.html
├── styles.css
├── app.js
├── start-gallery.bat
├── README.md
└── artists/          ← Create this folder
    └── (your .png images go here)
```

### 4. Add Your Images
Copy your PNG images into the `artists` folder.

**Required filename format:**
- Must contain: `__artist_ARTISTNAME__` (double underscores!)
- Parser extracts everything between `__artist_` and the next `__`
- Artist names CAN contain single underscores
- Examples:
  - `1.10__artist_ztdlb __,_1girl.png` → extracts "ztdlb"
  - `__artist_pic_artist__,_landscape.png` → extracts "pic_artist"

### 5. Run the Gallery
Double-click `start-gallery.bat`

The first time you run it:
- It will install dependencies (takes 10-20 seconds)
- Server will start
- Browser will open automatically

### 6. Start Using!
- Browse your artists
- Add favorites (⭐ icon)
- Create tags (🏷️ icon)
- Search and filter
- Acknowledge new artists

## Next Steps

See `README.md` for:
- Full feature documentation
- Troubleshooting guide
- Advanced usage
- Keyboard shortcuts

## Quick Tips

✅ **DO:**
- Install Node.js before running
- Keep all files in the same folder
- Name your images with `__artist_NAME__` pattern (double underscores)
- Use only `.png` files
- Click "Acknowledge All New" after first scan
- Artist names can have underscores (e.g., `pic_artist`)

❌ **DON'T:**
- Try to run without Node.js installed
- Rename the `artists` folder
- Move files to different locations
- Delete `config.json` (unless resetting)

## Need Help?

Check README.md or:
1. Verify Node.js is installed: `node --version` in Command Prompt
2. Check filename format matches the pattern
3. Make sure files are in `artists` folder
4. Look for error messages in the browser console (F12)

---

**Ready? Double-click start-gallery.bat to begin!**
