# Script para automatizar el proceso de release en GitHub (Windows)
# Uso: .\release.ps1

# Colores
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"

Write-Host "=== DataWell Pro - Release Helper ===" -ForegroundColor $SuccessColor
Write-Host ""

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json no encontrado. Ejecuta desde la raíz del proyecto." -ForegroundColor $ErrorColor
    exit 1
}

# Obtener versión actual
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$CurrentVersion = $packageJson.version
Write-Host "Versión actual: $CurrentVersion" -ForegroundColor $WarningColor

# Pedir nueva versión
$NewVersion = Read-Host "Nueva versión (ej: 1.0.1)"

if ([string]::IsNullOrWhiteSpace($NewVersion)) {
    Write-Host "Error: Versión no puede estar vacía" -ForegroundColor $ErrorColor
    exit 1
}

Write-Host ""
Write-Host "Preparando release v$NewVersion..." -ForegroundColor $WarningColor
Write-Host ""

# 1. Actualizar package.json
Write-Host "1. Actualizando package.json..."
$packageJson.version = $NewVersion
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✓ Versión actualizada" -ForegroundColor $SuccessColor

# 2. Compilar
Write-Host ""
Write-Host "2. Compilando aplicación..."
Write-Host "   Esto puede tomar algunos minutos..." -ForegroundColor $WarningColor
npm run electron:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en compilación. Revirtiendo cambios..." -ForegroundColor $ErrorColor
    git checkout package.json
    exit 1
}
Write-Host "✓ Compilación exitosa" -ForegroundColor $SuccessColor

# 3. Commit y tag
Write-Host ""
Write-Host "3. Creando commit y tag..."
git add .
git commit -m "Release v$NewVersion"
git tag -a "v$NewVersion" -m "Release version $NewVersion"
Write-Host "✓ Commit y tag creados" -ForegroundColor $SuccessColor

# 4. Instrucciones para push
Write-Host ""
Write-Host "=== Siguiente Paso ===" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Para publicar el release:"
Write-Host ""
Write-Host "  git push origin main" -ForegroundColor $WarningColor
Write-Host "  git push origin v$NewVersion" -ForegroundColor $WarningColor
Write-Host ""
Write-Host "Luego en GitHub (https://github.com/tu-usuario/datawell-import-pro):"
Write-Host "  1. Ve a Releases → Draft New Release"
Write-Host "  2. Tag: v$NewVersion"
Write-Host "  3. Release title: DataWell Pro v$NewVersion"
Write-Host "  4. Description: (Describe los cambios)"
Write-Host "  5. Sube los archivos .exe de la carpeta 'release/'"
Write-Host "     - DataWell Pro Setup $NewVersion.exe"
Write-Host "     - DataWell Pro Setup $NewVersion.exe.blockmap"
Write-Host "     - DataWell Pro $NewVersion.exe"
Write-Host "     - DataWell Pro $NewVersion.exe.blockmap"
Write-Host ""
Write-Host "Luego click en 'Publish release'" -ForegroundColor $WarningColor
Write-Host ""
Write-Host "✓ Release preparado" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Los usuarios recibirán notificación de actualización automáticamente." -ForegroundColor $SuccessColor
