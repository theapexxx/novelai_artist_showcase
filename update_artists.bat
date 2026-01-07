@echo off
echo Updating artist list from images/V4.5 folder...
powershell -ExecutionPolicy Bypass -File "%~dp0generate_artist_list.ps1"
echo.
echo Done! Refresh the HTML page to see new artists.
pause

