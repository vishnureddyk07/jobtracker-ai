# GitHub Setup Script

Write-Host "🚀 JobTracker - GitHub Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not installed. Please install from https://git-scm.com" -ForegroundColor Red
    exit 1
}

# Check current status
Write-Host ""
Write-Host "📊 Current Git Status:" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: jobtracker" -ForegroundColor White
Write-Host "3. Make it Public or Private" -ForegroundColor White
Write-Host "4. DO NOT initialize with README (we already have one)" -ForegroundColor Yellow
Write-Host "5. Click 'Create repository'" -ForegroundColor White
Write-Host ""
Write-Host "Then run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "git branch -M main" -ForegroundColor Magenta
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/jobtracker.git" -ForegroundColor Magenta
Write-Host "git push -u origin main" -ForegroundColor Magenta
Write-Host ""
Write-Host "Replace YOUR_USERNAME with your actual GitHub username!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Need help? Check: DEPLOYMENT-CHECKLIST.md" -ForegroundColor Cyan
