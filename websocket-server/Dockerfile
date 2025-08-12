FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install required tools for tail
RUN apk add --no-cache procps

# Copy source code
COPY . .

# Expose the port (will be overridden by docker-compose)
EXPOSE 1234

# Start the application
CMD ["node", "server.js"]
