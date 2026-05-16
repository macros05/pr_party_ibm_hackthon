# Script para reiniciar el backend limpiando caché de Python
# Uso: .\restart_backend.ps1

Write-Host "🧹 Limpiando caché de Python..." -ForegroundColor Yellow

# Limpiar __pycache__ directories
Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Write-Host "✅ Caché limpiada" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""

# Iniciar uvicorn
uvicorn app.main:app --reload

# Made with Bob
