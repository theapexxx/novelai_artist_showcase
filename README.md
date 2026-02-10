# 🎨 NovelAI Artist Showcase Tool

A comprehensive tool for managing, ranking, and organizing artist styles for use with NovelAI's image generation. Compare artists head-to-head, assign letter grades, and quickly copy artist names to your prompts.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Adding & Removing Images](#adding--removing-images)
4. [Artist Showcase Tab](#artist-showcase-tab)
5. [Rank Helper Tab](#rank-helper-tab)
6. [Tag Selector Tab](#tag-selector-tab)
7. [Artist Mixes Tab](#artist-mixes-tab)
8. [Data Storage](#data-storage)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Customization](#customization)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This tool helps you:
- **Browse** a collection of artist style samples
- **Rank** artists using an ELO-based tournament system
- **Grade** artists from SS (best) to F (lowest)
- **Filter & Sort** artists by grade, favorites, or name
- **Copy** artist names quickly for use in prompts
- **Compare** two artists side-by-side
- **Select tags** from a comprehensive Danbooru tag library
- **Save artist mixes** - store your favorite prompt combinations with sample images

---

## Getting Started

### Requirements
- A modern web browser (Chrome, Firefox, Edge)
- The tool files in a local folder

### Files Structure
```
artist_showcase/
├── index.html               # Main application
├── artists_data.js          # Auto-generated artist list
├── generate_artist_list.ps1 # PowerShell script (Windows)
├── generate_artist_list.sh  # Shell script (MacOS/Linux)
├── update_artists.bat       # Double-click to update artists (Windows)
├── update_artists.command   # Double-click to update artists (MacOS)
├── README.md                # This file
└── images/
    ├── V4.5/                # Your artist images go here
    │   ├── artist_name.png
    │   ├── another_artist.png
    │   └── ...
    └── placeholder.png      # Fallback image
```

### First Time Setup

**Option A: Download Pre-made Artist Collection (Recommended)**
1. Download/clone this repository
2. Download the artist images from Google Drive:
   
   ### 📁 [Download 896 Artist Samples (Google Drive)](https://drive.google.com/drive/folders/1zQV7ysyy96VEjUQMnfpSFV3e1GLszaCM?usp=sharing)
   ### 📁 [Or use this link (Mega.nz)](https://mega.nz/folder/HiA0AbbK#nEuW7WHLWYC1Os0CLdm2oQ)
   
3. Place the downloaded `V4.5` folder in the `images/...` folder. It should be `images/V4.5/` in the tool directory.
4. Copy all downloaded images into `images/V4.5/`
5. Open `index.html` in your browser - done! ✨

> **Tip**: The `artists_data.js` file is already included and matches the Google Drive images. No need to run any scripts!

**Option B: Start Fresh with Your Own Images**
1. Download/clone this repository
2. Create the folder `images/V4.5/`
3. Add your own artist sample images (filename = artist name)
4. Double-click `update_artists.bat` to generate the artist list
5. Open `index.html` in your browser

> **Note**: The Google Drive folder contains 896 artist style samples I collected. Each image is named after the artist, ready to use with NovelAI prompts.

### Adding Your Own Images
1. Add new images to the `images/V4.5/` folder
2. Double-click `update_artists.bat` to regenerate the artist list
3. Refresh the browser

---

## Adding & Removing Images

### Adding New Artist Images
1. **Name your image file** with the artist's name (e.g., `asanagi.png`, `sakimichan.png`)
2. **Copy the image** to the `images/V4.5/` folder
3. **Run the update script**: Double-click `update_artists.bat`
4. **Refresh** the browser page

> **Tip**: The filename becomes the artist name, so use the exact name you want to copy to your prompts.

### Removing Artist Images
1. **Delete the image** from the `images/V4.5/` folder
2. **Run the update script**: Double-click `update_artists.bat`
3. **Refresh** the browser page

> **Note**: Removing an image doesn't delete its ranking data. If you re-add the same artist later, their rankings will still be there.

### Supported Image Formats
- PNG (recommended)
- JPG / JPEG
- GIF
- WebP

---

<img width="1876" height="1171" alt="Screenshot 2026-01-07 034928" src="https://github.com/user-attachments/assets/dffb6ae1-f979-4cbb-84a4-ddb63e71b494" />

## Artist Showcase Tab

The main tab for browsing and managing your artist collection.

### Layout
- **Left Panel**: Artist list with filters and controls
- **Right Panel**: Large image preview with ranking controls

### Features

#### View Modes
- **☰ List View**: Shows artist names with thumbnails, grades, and copy buttons
- **⊞ Grid View**: Shows larger thumbnails in a 3-column grid

#### Filtering
- **Search**: Type to filter artists by name
- **Unranked**: Show only artists without a grade
- **★ Favorites**: Show only favorited artists
- **Grade Filter**: Filter by specific grade (SS, S, A, B, C, D, E, F)

#### Sorting
- **A→Z / Z→A**: Sort alphabetically
- **Rank↓ / Rank↑**: Sort by grade (best to worst or vice versa)
- **📋↓**: Sort by copy count (most copied first)

#### Artist Actions
- **Click an artist** to view their full image
- **★ Star** to add/remove from favorites
- **Copy** to copy the artist name to clipboard
- **Grade buttons** (SS through F) to assign a grade

#### Comparison Mode
1. Click the **⚖️ Compare** button
2. Click two artists to compare them side-by-side
3. Click **✕ Exit** to leave comparison mode

### Floating Menu (Bottom Right)
Click the **☰** button to access:
- 📊 **Statistics**: View total artists, rated count, favorites, copy counts
- 📋 **Recently Copied**: Quick access to recently copied artists
- 💾 **Export Data**: Save all your rankings to a JSON file
- 📂 **Import Data**: Restore rankings from a JSON file

---

<img width="1875" height="1178" alt="Screenshot 2026-01-07 035018" src="https://github.com/user-attachments/assets/a9ef574c-be07-43f2-b718-609dfa2f7db5" />

## Rank Helper Tab

A tournament-style ranking system that helps you accurately rank artists through head-to-head comparisons.

### How It Works

1. **Swiss Tournament System**: Artists with similar ELO ratings are paired together
2. **ELO Rating**: Each artist starts at 1500 ELO
   - Winners gain points, losers lose points
   - Beating a higher-rated artist gives more points
3. **Smart Matchmaking**: Artists with fewer comparisons are prioritized

### Using the Rank Helper

1. Click **▶ Start Ranking**
2. Two artist images appear - click the one you prefer
3. Continue comparing until you're satisfied with the rankings
4. Click **✓ Apply Rankings** to convert ELO scores to letter grades

### Controls

| Button | Action |
|--------|--------|
| Click Image | Pick that artist as the winner |
| ↑ Skip | Skip this comparison (can't decide) |
| ↓ Undo | Undo your last choice |
| ✓ Apply Rankings | Convert ELO to letter grades |
| ↺ Restart | Reset all ELO data and start over |

### Keyboard Shortcuts
- **← Left Arrow**: Pick left image
- **→ Right Arrow**: Pick right image
- **↑ Up Arrow**: Skip
- **↓ Down Arrow**: Undo

### Progress Indicator
- **Comparisons**: Number of comparisons made
- **Confidence**: Low → Medium → Good → High → Very High
- Target: ~4 comparisons per artist for good accuracy

### Grade Distribution
When you apply rankings, artists are assigned grades based on percentile:
| Grade | Percentile |
|-------|------------|
| SS | Top 5% |
| S | Top 15% |
| A | Top 30% |
| B | Top 50% |
| C | Top 70% |
| D | Top 85% |
| E | Top 95% |
| F | Bottom 5% |

NOTE: All ELO data will be saved locally. That means that you can continue with the full tournament at a later time. All tiers and ELO will be always be saved, until you "restart" the tournament.

---

<img width="1871" height="1169" alt="Screenshot 2026-01-07 035116" src="https://github.com/user-attachments/assets/ace73bb1-cf3b-44f2-b922-1985edfe2545" />

## Tag Selector Tab

A comprehensive library of Danbooru tags organized by category.

### Using Tags
1. **Click a tag** to add it to your selection
2. **Click again** to remove it
3. **Copy Tags** to copy all selected tags to clipboard
4. **Clear All** to deselect everything

### Categories Include
- Quality Tags
- Artistic License
- Image Composition
- Character Features
- Clothing & Accessories
- Actions & Poses
- And many more...

---

<img width="1753" height="1127" alt="Screenshot 2026-02-02 192351" src="https://github.com/user-attachments/assets/ecf7d3bd-239d-402b-899c-4a83e7b43a50" />

## Artist Mixes Tab

A personal library for saving and organizing your custom artist mixes and prompts. Store your favorite prompt combinations along with sample images to quickly reference and reuse them.

### What is an Artist Mix?

An "artist mix" is a combination of multiple artist names or style tags that you've found works well together. For example: `artist:asanagi, artist:sakimichan, detailed lighting` - this tab lets you save these combinations with preview images so you can remember what they produce.

### Layout
- **Left Panel**: Gallery of saved mixes with search and controls
- **Right Panel**: Detailed view of the selected mix with image preview and copyable text

### Features

#### Adding a New Mix
1. Click **➕ Add New Mix**
2. Fill in the form:
   - **Title** (optional): A name to identify this mix
   - **Prompt / Artist Mix** (required): The actual prompt text or artist combination
   - **Images** (required): Drag & drop or browse to add one or more sample images
3. Click **Save Mix**

> **Tip**: Add multiple images to show different results from the same prompt!

#### Viewing Mixes
- Click any mix in the gallery to view its details
- Use the **◀ ▶ arrows** or **dots** to cycle through multiple images
- Click **📋 Copy** to copy the prompt text to your clipboard

#### Managing Mixes
- **✏️ Edit**: Modify the title, text, or images of a mix
- **🗑️ Delete**: Remove a mix permanently
- **🔍 Search**: Filter mixes by title or prompt content

#### Backup & Restore
- **📤 Export**: Save all your mixes to a JSON backup file
- **📥 Import**: Restore mixes from a backup file

> **Note**: Importing merges with existing mixes rather than replacing them.

### Data Storage

Artist Mixes are stored in **IndexedDB** (not localStorage) because they can contain large image data. This means:
- Mixes are stored separately from artist rankings
- They have their own export/import buttons within the Artist Mixes tab
- The main "Export Data" button in the floating menu does NOT include mixes

---

## Data Storage

Most data is stored in your browser's **localStorage**:

| Data | Storage Key |
|------|-------------|
| Artist Rankings (grades) | `artistRankingsv4` |
| Favorites | `artistFavoritesV4` |
| Copy History | `artistCopyHistoryV4` |
| Recently Copied | `artistRecentCopiesV4` |
| ELO Ratings | `rankHelperEloData` |
| View Mode | `artistViewMode` |

Artist Mixes are stored separately in **IndexedDB** (database: `ArtistMixesDB`) because they contain large image data. Use the export/import buttons within the Artist Mixes tab to back up this data.

### Backing Up Your Data
1. Click the floating menu (☰) in the Showcase tab
2. Click **💾 Export Data**
3. Save the JSON file somewhere safe

### Restoring Your Data
1. Click the floating menu (☰)
2. Click **📂 Import Data**
3. Select your backup JSON file

> **Important**: Data is stored per-browser. If you use a different browser or clear browser data, your rankings will be lost unless you've exported them.

---

## Keyboard Shortcuts

### Artist Showcase Tab
| Key | Action |
|-----|--------|
| ↑/↓ | Navigate through artist list |
| Enter | Select highlighted artist |

### Rank Helper Tab
| Key | Action |
|-----|--------|
| ← | Pick left image |
| → | Pick right image |
| ↑ | Skip comparison |
| ↓ | Undo last choice |

---

## Customization

### Changing the Image Folder
Edit `generate_artist_list.ps1` line 6:
```powershell
[string]$ImageFolder = "V4.5",  # Change to your folder name
```

### Adding More Image Formats
Edit `generate_artist_list.ps1` line 22:
```powershell
$imageFiles = Get-ChildItem -Path $imagePath -Filter "*.png" | Sort-Object Name
```
Change to include more formats:
```powershell
$imageFiles = Get-ChildItem -Path $imagePath -Include "*.png","*.jpg","*.jpeg","*.webp" -Recurse | Sort-Object Name
```

### Modifying Grade Thresholds
In `index.html`, find and edit `RH_GRADE_PERCENTILES`:
```javascript
const RH_GRADE_PERCENTILES = [0.05, 0.15, 0.30, 0.50, 0.70, 0.85, 0.95, 1.0];
```

---

## Troubleshooting

### Images Not Showing
1. Check that images are in `images/V4.5/` folder
2. Run `update_artists.bat`
3. Refresh the browser
4. Check browser console (F12) for errors

### Rankings Not Saving
- Make sure you're not in private/incognito mode
- Check that localStorage isn't full or disabled
- Try exporting and re-importing your data

### Script Won't Run
If `update_artists.bat` fails:
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Try running the bat file again

### Grid View Shows Overlapping Images
- Try refreshing the page
- Clear browser cache (Ctrl+Shift+R)

---

## Note for MacOS/Linux Users

The web tool (`index.html`) works on any operating system - just open it in your browser!

However, the helper scripts for updating the artist list are platform-specific:

| Platform | Double-click | Terminal |
|----------|--------------|----------|
| Windows | `update_artists.bat` | `generate_artist_list.ps1` |
| MacOS | `update_artists.command` | `generate_artist_list.sh` |
| Linux | — | `generate_artist_list.sh` |

### Using the Tool on MacOS/Linux

**If you're using the pre-made artist images:**
- Just download the images from Google Drive and place them in `images/V4.5/`
- The included `artists_data.js` already matches these images
- No scripts needed - just open `index.html`!

**If you're adding your own images:**

**Option A: Double-click (MacOS only)**
1. First time setup - right-click `update_artists.command` → Open → Click "Open" in the dialog
2. After that, you can double-click `update_artists.command` to run it
3. Refresh the browser

> **Note**: MacOS may block the script the first time. Go to System Preferences → Security & Privacy → Click "Open Anyway"

**Option B: Terminal (MacOS/Linux)**
1. Open Terminal and navigate to the tool folder:
   ```bash
   cd /path/to/artist_showcase
   ```

2. Make the scripts executable (first time only):
   ```bash
   chmod +x generate_artist_list.sh update_artists.command
   ```

3. Run the script:
   ```bash
   ./generate_artist_list.sh
   ```

4. Refresh the browser

The script accepts optional parameters:
```bash
./generate_artist_list.sh [image_folder] [output_file]
# Example: ./generate_artist_list.sh V4.5 artists_data.js
```

---

## Credits

Vibe coded with Claude Opus 4.5 fueld Cursor by:

Reddit: 	ApexPredatorTH
Patreon:	TheApexxx
Deviantart:	TheApexxx

Built for use with [NovelAI](https://novelai.net/) image generation.

---

## License

Feel free to modify and share this tool. Attribution appreciated but not required.

Happy genning!
