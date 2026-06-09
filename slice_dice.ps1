Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Rushi\Desktop\Ludo_v2\assets\CuteDice - AssetPack_v1.0\UpscaledDice_Pink.png"
$outputDir = "C:\Users\Rushi\Desktop\Ludo_v2\assets\CuteDice - AssetPack_v1.0"

$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

# The image is a 6x6 grid, so divide by 6
$cellW = [math]::Floor($bmp.Width / 6)
$cellH = [math]::Floor($bmp.Height / 6)

Write-Host "Original image size: $($bmp.Width)x$($bmp.Height). Slicing 6 faces..."

for ($i = 0; $i -lt 6; $i++) {
    $rect = New-Object System.Drawing.Rectangle(($i * $cellW), 0, $cellW, $cellH)
    $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
    
    $outPath = Join-Path $outputDir "Pink_Dice_Face_$($i+1).png"
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    
    Write-Host "Saved $outPath"
}

$bmp.Dispose()
Write-Host "Successfully sliced the top 6 faces!"
