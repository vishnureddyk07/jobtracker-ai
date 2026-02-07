#!/bin/bash
# Build script for production deployment

echo "🚀 Building JobTracker for production..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

cd ..
echo "✅ Build complete!"
echo "📁 Frontend build: frontend/dist"
echo ""
echo "🔧 Next steps:"
echo "1. Set environment variables on your hosting platform"
echo "2. Deploy backend with: node server.js"
echo "3. Serve frontend/dist as static files"
