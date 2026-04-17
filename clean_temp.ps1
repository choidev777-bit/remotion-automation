$tempPath = $env:TEMP
Write-Host "Cleaning $tempPath ..."
Get-ChildItem -Path $tempPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddMinutes(-30) } | Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "Done!"
