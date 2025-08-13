const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');

// Get configuration from environment variables
const PORT = process.env.WS_PORT;
const LOG_FILE_PATH = process.env.LOG_FILE_PATH;
const TAIL_LINES = process.env.TAIL_LINES;

// SSL configuration
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;

// Validate required environment variables
if (!PORT || !LOG_FILE_PATH || !TAIL_LINES) {
  console.error('Error: WS_PORT, LOG_FILE_PATH, and TAIL_LINES environment variables are required');
  process.exit(1);
}

// Check if SSL files exist
let sslOptions = {};
if (SSL_CERT_PATH && SSL_KEY_PATH) {
  try {
    sslOptions = {
      cert: fs.readFileSync(SSL_CERT_PATH),
      key: fs.readFileSync(SSL_KEY_PATH)
    };
    console.log('SSL certificate and key loaded successfully');
  } catch (error) {
    console.error('Error loading SSL certificate or key:', error.message);
    process.exit(1);
  }
}

// Create HTTPS server if SSL is available, otherwise HTTP
const server = Object.keys(sslOptions).length > 0 
  ? https.createServer(sslOptions)
  : null;

const wss = new WebSocketServer(
  server 
    ? { server } 
    : { port: PORT }
);

// Start the server
if (server) {
  server.listen(PORT, () => {
    console.log(`Secure WebSocket server started on wss://0.0.0.0:${PORT}`);
  });
} else {
  console.log(`WebSocket server started on ws://0.0.0.0:${PORT}`);
}

console.log(`Watching for changes in: ${LOG_FILE_PATH}`);

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const protocol = req.socket.encrypted ? 'wss' : 'ws';
  console.log(`Client connected from ${clientIp} via ${protocol}`);

  // Handle ping messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        // Respond with pong
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
    } catch (e) {
      // Not a JSON message, continue with normal processing
    }
    
    // For any other messages, we don't need to do anything
  });

  // Start tailing the Nginx access log file
  const tail = spawn('tail', ['-f', '-n', TAIL_LINES, LOG_FILE_PATH]);

  // Stream data from tail to the WebSocket client
  tail.stdout.on('data', (data) => {
    const lines = data.toString('utf-8').split('\n').filter(line => line.length > 0);
    lines.forEach(line => {
      console.log(`Sending log line to ${clientIp}: ${line}`);
      ws.send(line);
    });
  });

  tail.stderr.on('data', (data) => {
    console.error(`tail stderr for ${clientIp}: ${data}`);
  });

  tail.on('close', (code) => {
    console.log(`tail process for ${clientIp} exited with code ${code}`);
  });

  ws.on('close', () => {
    console.log(`Client ${clientIp} disconnected`);
    tail.kill();
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error from ${clientIp}:`, error);
    tail.kill();
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    if (server) {
      server.close();
    }
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
