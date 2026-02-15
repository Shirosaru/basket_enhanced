FROM node:18-alpine

WORKDIR /app

# Install Foundry dependencies
RUN apk add --no-cache curl build-essential

# Copy workspace files
COPY package*.json ./
COPY backend ./backend
COPY contracts ./contracts
COPY workflow ./workflow

# Install dependencies
RUN npm ci

# Build everything
RUN npm run build

# Expose ports
EXPOSE 3001

# Start backend
CMD ["npm", "start"]
