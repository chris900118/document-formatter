Add-Type -AssemblyName System.Drawing
$sourcePath = "C:/Users/qw261/.gemini/antigravity/brain/e7b8ee52-56ca-4e76-8d22-8cd2289f982f/uploaded_image_1768189741711.jpg"
$destPath = "D:\DEV\document-formatter\build\icon.png"

if (Test-Path $sourcePath) {
    echo "Converting $sourcePath to $destPath"
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $img.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    echo "Success!"
} else {
    echo "Source file not found!"
    exit 1
}
