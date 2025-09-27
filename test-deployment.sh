#!/bin/bash

# Test script for validating deployment configuration

echo "🔍 Testing App Store Connect MCP Server Deployment..."
echo "=================================================="

# Check if required files exist
echo "📁 Checking required files..."
FILES=("package.json" "smithery.yaml" "Dockerfile" ".dockerignore" "dist/src/index.js")
for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file missing"
    exit 1
  fi
done

# Test local build
echo ""
echo "🔨 Testing local build..."
if npm run build > /dev/null 2>&1; then
  echo "  ✅ Local build successful"
else
  echo "  ❌ Local build failed"
  exit 1
fi

# Test Docker build
echo ""
echo "🐳 Testing Docker build..."
if docker build -t app-store-connect-mcp-test . > /dev/null 2>&1; then
  echo "  ✅ Docker build successful"
else
  echo "  ❌ Docker build failed"
  exit 1
fi

# Test Docker run (expect configuration error, which means it's working)
echo ""
echo "🚀 Testing Docker run..."
output=$(timeout 5s docker run --rm app-store-connect-mcp-test 2>&1 || true)
if echo "$output" | grep -q "Missing required environment variables"; then
  echo "  ✅ Docker run successful (proper configuration validation)"
else
  echo "  ❌ Docker run failed or unexpected output"
  echo "  Output: $output"
  exit 1
fi

echo ""
echo "🎉 All deployment tests passed!"
echo ""
echo "📋 Summary:"
echo "  - Local TypeScript build: ✅"
echo "  - Docker image build: ✅"
echo "  - Docker container run: ✅"
echo "  - Configuration validation: ✅"
echo ""
echo "🚀 Ready for Smithery deployment!"