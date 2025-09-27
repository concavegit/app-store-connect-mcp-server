# Deployment Guide

This document provides information about deploying the App Store Connect MCP Server.

## Smithery Deployment

The server is configured for deployment via [Smithery](https://smithery.ai/), which provides easy installation for Claude Desktop users.

### Configuration Files

- `smithery.yaml` - Smithery deployment configuration
- `Dockerfile` - Docker container configuration  
- `.dockerignore` - Files to exclude from Docker build context

### Build Process

The deployment uses a Docker-based build process:

1. **Local Build**: TypeScript is compiled locally to the `dist/` directory
2. **Docker Build**: The container copies pre-built files and production dependencies
3. **Runtime**: Container runs the compiled JavaScript with proper environment validation

### Build Requirements

- Node.js 18+ (for local development and building)
- Docker (for containerized deployment)
- All npm dependencies must be installed locally before Docker build

### Testing Deployment

Run the deployment test script to validate everything is working:

```bash
./test-deployment.sh
```

This script validates:
- Required files exist
- Local TypeScript build works
- Docker build succeeds
- Container runs with proper configuration validation

### Deployment Workarounds

Due to npm registry SSL issues in some Docker environments, this deployment:
- Builds TypeScript locally before Docker build
- Copies local `node_modules` to container and prunes dev dependencies
- Avoids npm install/ci operations inside Docker container

### Environment Variables

The application requires these environment variables at runtime:
- `APP_STORE_CONNECT_KEY_ID` (required)
- `APP_STORE_CONNECT_ISSUER_ID` (required)
- `APP_STORE_CONNECT_P8_PATH` or `APP_STORE_CONNECT_P8_B64_STRING` (one required)
- `APP_STORE_CONNECT_VENDOR_NUMBER` (optional, enables sales/finance reporting)

See `smithery.yaml` for detailed configuration descriptions.