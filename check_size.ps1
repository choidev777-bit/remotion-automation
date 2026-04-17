$dirs = @(
    "remotion\public\audio",
    "remotion\public\media",
    "output",
    "node_modules",
    "remotion\node_modules",
    ".next"
)

foreach ($d in $dirs) {
    $path = Join-Path "c:\Users\thisi\Documents\youtube_generator" $d
    if (Test-Path $path) {
        $items = Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue
        $sum = ($items | Measure-Object -Property Length -Sum).Sum
        $mb = [math]::Round($sum / 1MB, 1)
        $count = $items.Count
        Write-Host "$d : ${mb} MB ($count files)"
    } else {
        Write-Host "$d : NOT FOUND"
    }
}

# Check Windows temp
$tempPath = $env:TEMP
$tempItems = Get-ChildItem $tempPath -Recurse -File -ErrorAction SilentlyContinue
$tempSum = ($tempItems | Measure-Object -Property Length -Sum).Sum
$tempMB = [math]::Round($tempSum / 1MB, 1)
Write-Host "Windows TEMP : ${tempMB} MB ($($tempItems.Count) files)"
