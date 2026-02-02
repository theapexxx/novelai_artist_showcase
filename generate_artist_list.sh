#!/bin/bash

# Artist List Generator for NovelAI Artist Showcase (MacOS/Linux)
# This script scans the images folder and generates a JavaScript file with the artist list
# Run this script whenever you add new images to the folder
#
# Usage: ./generate_artist_list.sh [image_folder] [output_file]
# Example: ./generate_artist_list.sh V4.5 artists_data.js

IMAGE_FOLDER="${1:-V4.5}"
OUTPUT_FILE="${2:-artists_data.js}"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE_PATH="$SCRIPT_DIR/images/$IMAGE_FOLDER"
OUTPUT_PATH="$SCRIPT_DIR/$OUTPUT_FILE"

echo -e "\033[36mScanning folder: $IMAGE_PATH\033[0m"

# Check if image folder exists
if [ ! -d "$IMAGE_PATH" ]; then
    echo -e "\033[31mError: Image folder not found: $IMAGE_PATH\033[0m"
    exit 1
fi

# Get all PNG files and count them
IMAGE_FILES=($(ls -1 "$IMAGE_PATH"/*.png 2>/dev/null | sort))
IMAGE_COUNT=${#IMAGE_FILES[@]}

if [ $IMAGE_COUNT -eq 0 ]; then
    echo -e "\033[33mWarning: No PNG images found in $IMAGE_PATH\033[0m"
    exit 1
fi

echo -e "\033[32mFound $IMAGE_COUNT images\033[0m"

# Generate the JavaScript content
CURRENT_DATE=$(date "+%Y-%m-%d %H:%M:%S")

cat > "$OUTPUT_PATH" << EOF
// Auto-generated artist list - DO NOT EDIT MANUALLY
// Generated on: $CURRENT_DATE
// Source folder: images/$IMAGE_FOLDER
// Total artists: $IMAGE_COUNT

let artistsV4 = [
EOF

# Process each image file
FIRST=true
for FILE_PATH in "${IMAGE_FILES[@]}"; do
    FILENAME=$(basename "$FILE_PATH")
    # Remove .png extension to get artist name
    ARTIST_NAME="${FILENAME%.png}"
    
    # Escape quotes in the name
    ESCAPED_NAME=$(echo "$ARTIST_NAME" | sed 's/"/\\"/g')
    
    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$OUTPUT_PATH"
    fi
    
    # Write the artist entry (without trailing newline)
    printf '    { name: "%s", image: "images/%s/%s", rank: 0 }' "$ESCAPED_NAME" "$IMAGE_FOLDER" "$FILENAME" >> "$OUTPUT_PATH"
done

# Close the array
echo "" >> "$OUTPUT_PATH"
echo "];" >> "$OUTPUT_PATH"

echo -e "\n\033[32mGenerated: $OUTPUT_PATH\033[0m"
echo -e "\033[32mArtist count: $IMAGE_COUNT\033[0m"
echo -e "\n\033[33mRefresh the HTML page to see the new artists!\033[0m"
