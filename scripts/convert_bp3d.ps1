param (
    [string]$BlenderPath = "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
    [string]$ObjDir = "..\public\models\bp3d\obj",
    [string]$GlbDir = "..\public\models\bp3d\glb"
)

# GLB出力先を作成
if (-not (Test-Path $GlbDir)) {
    New-Item -ItemType Directory -Force -Path $GlbDir | Out-Null
}

# OBJファイル一覧を取得
$objs = Get-ChildItem -Path $ObjDir -Filter *.obj -Recurse
Write-Host "OBJファイル数: $($objs.Count)"

foreach ($obj in $objs) {
    $outputGlb = Join-Path $GlbDir ($obj.BaseName + ".glb")
    if (Test-Path $outputGlb) {
        Write-Host "スキップ: $outputGlb"
        continue
    }

    Write-Host "変換中: $($obj.Name)"
    & $BlenderPath --background --python-expr "
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.obj(filepath=r'$($obj.FullName)')
bpy.ops.export_scene.gltf(filepath=r'$outputGlb', export_format='GLB')
" | Out-Null
}
