# Build script for production deployment (Windows)

Write-Host "🚀 Building JobTracker for production..." -ForegroundColor Cyan

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build

Set-Location ..
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "📁 Frontend build: frontend/dist" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set environment variables on your hosting platform"
Write-Host "2. Deploy backend with: node server.js"
Write-Host "3. Serve frontend/dist as static files"
