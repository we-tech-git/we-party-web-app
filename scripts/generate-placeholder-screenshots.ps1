# Script para gerar screenshots placeholder temporários
# Execute: .\scripts\generate-placeholder-screenshots.ps1

Write-Host "🎨 Gerando screenshots placeholder..." -ForegroundColor Cyan

$outputDir = "..\public\screenshots"

# Criar diretório se não existir
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Array de screenshots
$files = @(
    @("feed.png", "ff6b6b", "Feed+de+Eventos"),
    @("profile.png", "8b5cf6", "Perfil+Interativo"),
    @("event-details.png", "3b82f6", "Detalhes+do+Evento"),
    @("chat.png", "10b981", "Chat+e+Interacoes"),
    @("create-event.png", "f59e0b", "Criar+Evento"),
    @("categories.png", "ec4899", "Explorar+Categorias")
)

foreach ($file in $files) {
    $name = $file[0]
    $color = $file[1]
    $text = $file[2]
    
    $url = "https://via.placeholder.com/1400x900/$color/ffffff?text=$text"
    $outputPath = Join-Path $outputDir $name
    
    Write-Host "  📥 Baixando $name..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop
        Write-Host "  ✅ $name criado!" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Erro ao baixar ${name}: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Placeholders criados em '$outputDir'!" -ForegroundColor Green
Write-Host "📝 Agora descomente a linha da imagem no LandingPageV2.vue (linha ~356)" -ForegroundColor Cyan
