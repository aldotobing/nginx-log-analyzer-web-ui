const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocketServer({ port: 1234 });

// The path to the log file *inside the container*, which we'll map from the host.
const logFilePath = '/var/log/nginx/access.log';

console.log('WebSocket server started on port 1234');
console.log(`Watching for changes in: ${logFilePath}`);

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Start tailing the Nginx access log file.
  // The '-f' flag means 'follow', so it will output new lines as they are added.
  const tail = spawn('tail', ['-f', '-n', '5', logFilePath]);

  // Stream data from tail to the WebSocket client
  tail.stdout.on('data', (data) => {
    // The data buffer might contain multiple lines
    const lines = data.toString('utf-8').split('\n').filter(line => line.length > 0);
    lines.forEach(line => {
      console.log(`Sending log line: ${line}`);
      ws.send(line);
    });
  });

  tail.stderr.on('data', (data) => {
    console.error(`tail stderr: ${data}`);
  });

  tail.on('close', (code) => {
    console.log(`tail process exited with code ${code}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Kill the tail process when the client disconnects to save resources
    tail.kill();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    tail.kill();
  });
});
