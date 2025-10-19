# Smithery Configuration Guide

This document explains the Smithery configuration for the App Store Connect MCP Server.

## Overview

This MCP server is configured to be published and deployed via [Smithery](https://smithery.ai), using the **TypeScript runtime** instead of Docker for better compatibility and ease of deployment.

## Configuration Files

### smithery.yaml
- **Runtime**: `typescript` - Uses Node.js/TypeScript runtime instead of Docker
- **Name**: `appstore-connect-mcp-server` - Package name for Smithery
- **Config**: Defines all environment variables needed by the server (API keys, paths, etc.)

### package.json
Key configurations:
- **bin**: Points to `.smithery/stdio/index.cjs` - the Smithery-built executable
- **files**: Includes `.smithery` directory in npm package (built at publish time)
- **scripts**: 
  - `build`: Builds both stdio and shttp transports
  - `prepare`: Runs before publishing to ensure build is ready
  - `dev`: Runs the Smithery dev server

### .gitignore
- `.smithery/` is ignored in git (built during npm prepare/publish)
- `node_modules/` is ignored as standard

## Build Process

The server uses [@smithery/cli](https://www.npmjs.com/package/@smithery/cli) to create optimized bundles:

```bash
npm run build
```

This creates:
- `.smithery/stdio/index.cjs` (647KB) - For standard stdio transport
- `.smithery/shttp/index.cjs` (1.93MB) - For streamable HTTP transport

## Installation Methods

### Via Smithery (Recommended)
```bash
npx @smithery/cli install appstore-connect-mcp-server --client claude
```

### Via NPM
```bash
npm install -g appstore-connect-mcp-server
```

### Via npx (Direct execution)
```bash
npx -y appstore-connect-mcp-server
```

## Publishing to Smithery

When this package is published to npm, Smithery will automatically:
1. Detect the `smithery.yaml` configuration
2. Use the TypeScript runtime to run the server
3. Pass environment variables defined in the config section
4. Execute the bin file (`.smithery/stdio/index.cjs`)

## Why TypeScript Runtime Instead of Docker?

The original configuration used Docker (`runtime: docker`), which caused silent failures in Smithery. The TypeScript runtime provides:

✅ **Simpler deployment** - No Docker container management
✅ **Better compatibility** - Works across all Smithery deployment targets
✅ **Faster startup** - No container initialization overhead
✅ **Easier debugging** - Direct access to logs and errors
✅ **Standard npm workflow** - Familiar to Node.js developers

## Development

To work on this server locally:

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Run in development mode with hot reload
npm run dev
```

## Verification Checklist

Before publishing to Smithery, verify:

- [ ] `smithery.yaml` uses `runtime: typescript`
- [ ] `package.json` bin points to `.smithery/stdio/index.cjs`
- [ ] `npm run build` completes without errors
- [ ] `.smithery/` directory is in `.gitignore`
- [ ] `.smithery/` directory is in `files` array of package.json
- [ ] All environment variables are documented in `smithery.yaml` config section
- [ ] README.md has correct installation instructions

## Troubleshooting

### Build fails
- Ensure `@smithery/cli` is installed: `npm install`
- Check that `src/index.ts` exists and is valid
- Verify TypeScript and dependencies are up to date

### Server doesn't start
- Check that required environment variables are set
- Verify the `.smithery/stdio/index.cjs` file exists and is executable
- Review error logs for missing dependencies

### Package not found on Smithery
- Ensure package is published to npm
- Verify `smithery.yaml` exists in the published package
- Check that package name in `smithery.yaml` matches npm package name

## References

- [Smithery Documentation](https://smithery.ai/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
