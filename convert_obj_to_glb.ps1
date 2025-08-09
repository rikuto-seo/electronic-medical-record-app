$inputDir = ".\public\models\bp3d\obj"
$outputDir = ".\public\models\bp3d\glb"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$objs = Get-ChildItem -Path $inputDir -Filter *.obj -Recurse

foreach ($obj in $objs) {
    $inputPath = $obj.FullName
    $outputPath = Join-Path $outputDir ($obj.BaseName + ".glb")

    if (Test-Path $outputPath) {
        Write-Host "Skipping: $outputPath already exists."
        continue
    }

    Write-Host "Converting: $inputPath to $outputPath"
    obj2gltf -i $inputPath -o $outputPath -b
}
