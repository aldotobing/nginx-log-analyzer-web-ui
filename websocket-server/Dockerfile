FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY server.js ./

# Expose the WebSocket port
EXPOSE 1234

# Run
CMD ["node", "server.js"]
