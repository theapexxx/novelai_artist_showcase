#!/bin/bash

# MacOS equivalent of update_artists.bat
# Double-click this file to update the artist list from images/V4.5 folder

# Navigate to the script's directory
cd "$(dirname "$0")"

echo "Updating artist list from images/V4.5 folder..."
echo ""

# Run the shell script
./generate_artist_list.sh

echo ""
echo "Done! Refresh the HTML page to see new artists."
echo ""
echo "Press any key to close..."
read -n 1
