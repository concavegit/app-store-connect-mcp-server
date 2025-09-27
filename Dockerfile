# Production stage - using pre-built dist files and local node_modules
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files, pre-built application, and production dependencies
COPY package*.json ./
COPY dist ./dist
COPY node_modules ./node_modules

# Remove dev dependencies to keep only production ones
RUN npm prune --omit=dev

# Switch to non-root user for security
USER node

# Run the application
CMD ["node", "/app/dist/src/index.js"]