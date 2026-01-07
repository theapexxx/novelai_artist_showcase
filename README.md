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
7. [Data Storage](#data-storage)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Customization](#customization)
10. [Troubleshooting](#troubleshooting)

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

---

## Getting Started

### Requirements
- A modern web browser (Chrome, Firefox, Edge)
- The tool files in a local folder

### Files Structure
```
artist_showcase/
├── index.html    # Main application
├── artists_data.js          # Auto-generated artist list
├── generate_artist_list.ps1 # PowerShell script to update artist list
├── update_artists.bat       # Easy double-click to update artists
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
   
3. Place the downloaded `V4.5` folder in the `images/...` folder. It should be `images/V4.5/*all image files*` in the tool directory.
4. Open `index.html` in your browser - done! ✨

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

## Data Storage

All your data is stored in your browser's **localStorage**:

| Data | Storage Key |
|------|-------------|
| Artist Rankings (grades) | `artistRankingsv4` |
| Favorites | `artistFavoritesV4` |
| Copy History | `artistCopyHistoryV4` |
| Recently Copied | `artistRecentCopiesV4` |
| ELO Ratings | `rankHelperEloData` |
| View Mode | `artistViewMode` |

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
