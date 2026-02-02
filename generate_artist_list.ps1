# Artist List Generator for NovelAI Artist Showcase
# This script scans the images folder and generates a JavaScript file with the artist list
# Run this script whenever you add new images to the folder

param(
    [string]$ImageFolder = "V4.5",  # Change to "V4.5" when ready
    [string]$OutputFile = "artists_data.js"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$imagePath = Join-Path $scriptDir "images\$ImageFolder"
$outputPath = Join-Path $scriptDir $OutputFile

Write-Host "Scanning folder: $imagePath" -ForegroundColor Cyan

if (-not (Test-Path $imagePath)) {
    Write-Host "Error: Image folder not found: $imagePath" -ForegroundColor Red
    exit 1
}

# Get all PNG files in the folder
$imageFiles = Get-ChildItem -Path $imagePath -Filter "*.png" | Sort-Object Name

if ($imageFiles.Count -eq 0) {
    Write-Host "Warning: No PNG images found in $imagePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($imageFiles.Count) images" -ForegroundColor Green

# Generate the JavaScript content
$jsContent = @"
// Auto-generated artist list - DO NOT EDIT MANUALLY
// Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// Source folder: images/$ImageFolder
// Total artists: $($imageFiles.Count)

let artistsV4 = [
"@

foreach ($file in $imageFiles) {
    # Extract artist name from filename (remove .png extension)
    $artistName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    
    # Escape any quotes in the name
    $escapedName = $artistName.Replace('"', '\"')
    
    # Add the artist entry
    $jsContent += "`n    { name: `"$escapedName`", image: `"images/$ImageFolder/$($file.Name)`", rank: 0 },"
}

# Remove the trailing comma from the last entry and close the array
$jsContent = $jsContent.TrimEnd(',')
$jsContent += "`n];"

# Write the file
$jsContent | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "`nGenerated: $outputPath" -ForegroundColor Green
Write-Host "Artist count: $($imageFiles.Count)" -ForegroundColor Green
Write-Host "`nRefresh the HTML page to see the new artists!" -ForegroundColor Yellow

