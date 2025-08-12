# Log Analyzer Web UI

## Project Objective

The Log Analyzer Web is a web-based application designed to analyze and visualize Nginx and Apache HTTPD log files. It helps users to gain insights into web traffic, detect anomalies, and monitor server performance in real-time.

## Features

- Upload and parse Nginx and Apache HTTPD log files
- Real-time log streaming via WebSocket
- Visualize traffic data with interactive charts and graphs
- Filter logs by date, IP address, request type, and more
- Generate reports on server performance and traffic patterns
- User-friendly web interface
- Secure WebSocket (WSS) support 

## Live Monitoring with WebSocket

The application supports real-time log monitoring through WebSocket. You can connect to a WebSocket server that streams log entries as they're generated.

### WebSocket Server Setup

1. **Using the provided Node.js server**:
   ```bash
   # Navigate to the websocket-server directory
   cd websocket-server
   
   # Install dependencies
   npm install
   
   # Start the server (with SSL)
   WS_PORT=1234 \
   LOG_FILE_PATH=/var/log/nginx/access.log \
   SSL_CERT_PATH=/path/to/ssl/cert.pem \
   SSL_KEY_PATH=/path/to/ssl/privkey.pem \
   node server.js
   
   # Or without SSL
   # WS_PORT=1234 LOG_FILE_PATH=/var/log/nginx/access.log node server.js
   ```

2. **Using Docker**:
   ```bash
   cd websocket-server
   
   # Build the image
   docker build -t log-watcher .
   
   # Run the container
   docker run -d \
     --name log-watcher \
     -e WS_PORT=1234 \
     -e LOG_FILE_PATH=/var/log/nginx/access.log \
     -e SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem \
     -e SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem \
     -v /var/log/nginx:/var/log/nginx:ro \
     -v /etc/letsencrypt:/etc/letsencrypt:ro \
     -p 1234:1234 \
     log-watcher
   ```

### Connection Details

- **Unencrypted (WS)**: `ws://your-server-ip:1234`
- **Encrypted (WSS)**: `wss://your-domain.com:1234`

> **Note**: For production use, always use WSS (WebSocket Secure) with valid SSL certificates.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/aldotobing/log-analyzer-web-ui.git
   ```
2. Navigate to the project directory:
   ```sh
   cd log-analyzer-web-ui
   ```
3. Install dependencies:
   ```sh
   npm install
   ```

## Usage

### Development Mode

1. Start the development server:
   ```sh
   npm run dev
   ```
2. Open your web browser and go to `http://localhost:3000`
3. Upload your Nginx log file or connect to a WebSocket server for real-time monitoring

### Production Build

1. Build the application:
   ```sh
   npm run build
   ```
2. Start the production server:
   ```sh
   npm run start
   ```
3. Access the application at `http://your-server-ip:3000`

## Security Considerations

- Always use WSS (WebSocket Secure) in production environments
- Ensure proper file permissions for log files
- Run the WebSocket server with minimal privileges
- Regularly update dependencies to address security vulnerabilities

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
