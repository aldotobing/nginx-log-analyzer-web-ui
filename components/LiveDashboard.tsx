"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { aggregateLogData } from '../lib/log-aggregator';
import { Dashboard } from './Dashboard';
import { Eye, EyeOff, XCircle } from 'lucide-react';

// A more robust parser for common Nginx log formats.
const parseLogLine = (line: string) => {
  try {
    // This regex handles cases where the request field might be empty ("") or malformed.
    // It also handles extra fields at the end (like the "-" at the end of some Nginx logs)
    const match = line.match(/^(?<ip>[\d.]+) - (?<user>\S+) \[(?<timestamp>.+?)\] "(?<method>\S+) (?<path>[^"]*) HTTP\/\d+\.\d+" (?<code>\d+) (?<size>\d+) "(?<referrer>[^"]*)" "(?<agent>[^"]*)" "(?<xForwardedFor>[^"]*)"$/);
    
    if (!match || !match.groups) {
      console.warn("Could not parse log line:", line);
      return null;
    }

    const { ip, user, timestamp, method, path, code, size, referrer, agent, xForwardedFor } = match.groups;
    
    // Define valid HTTP methods
    const validHttpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];
    
    // Initialize method and url
    let finalMethod = 'N/A';
    let url = 'N/A';
    
    // Only parse method and URL if request is not empty
    if (method && path) {
      // Check if the method is a valid HTTP method
      if (validHttpMethods.includes(method)) {
        finalMethod = method;
        url = path || 'N/A';
      } else {
        // Check for known attack patterns or clearly malformed requests
        const isAttackPattern = method.includes('%') || 
                               method.includes(';') || 
                               method.includes('wget') || 
                               method.includes('curl') ||
                               method.length > 100;
        
        // Check for clearly non-HTTP method patterns
        const isNonHttpPattern = method.includes('_DUPLEX_') || 
                                method.startsWith('SSTP_') ||
                                method.includes('Mozi') ||
                                method.includes('->');
        
        if (isAttackPattern || isNonHttpPattern) {
          finalMethod = 'MALFORMED';
        } else if (method.length <= 25) {
          // Short, non-attack patterns are classified as OTHER
          finalMethod = 'OTHER';
        } else {
          // Long patterns are classified as MALFORMED
          finalMethod = 'MALFORMED';
        }
        
        url = `${method} ${path}`; // Keep the full request for analysis
      }
    }

    return {
      ipAddress: ip,
      timestamp,
      method: finalMethod,
      path: url,
      status: code,
      bodyBytesSent: size,
      referer: referrer,
      userAgent: agent,
    };
  } catch (error) {
    console.error('Error parsing log line:', error);
    return null;
  }
};

export interface LogData {
  requestStats: {
    uniqueIPs: number;
    totalRequests: number;
    totalAttackAttempts: number;
    parseErrors: number;
  };
  httpMethods: { [method: string]: number };
  statusCodes: { "2xx": number; "3xx": number; "4xx": number; "5xx": number; [key: string]: number };
  attackDistribution: { [attack: string]: number };
  trafficOverTime: { hour: number; count: number }[];
  topIp: { [ip: string]: number };
  topReferrers: { [referrer: string]: number };
  topRequestedUrls: { [url: string]: number };
  suspiciousIps: { 
    [ip: string]: {
      attackCount: number;
      requestCount: number;
      lastSeen: string;
      uniquePaths: number;
      uniqueUserAgents: number;
      bandwidthUsage: number;
      methods: { [method: string]: number };
      statusCodes: { "2xx": number; "3xx": number; "4xx": number; "5xx": number; [key: string]: number };
    } 
  };
  recentAttacks: any[];
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 2000; // 2 seconds
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const PING_INTERVAL = 30000; // 30 seconds
const PONG_TIMEOUT = 10000; // 10 seconds

export function LiveDashboard({ wsUrl: initialWsUrl }: { wsUrl: string }) {
  const [logData, setLogData] = useState<LogData | null>(null);
  const [parsedLines, setParsedLines] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWsUrl, setShowWsUrl] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('connecting');
  const [wsUrl, setWsUrl] = useState(initialWsUrl);
  const [newWsUrl, setNewWsUrl] = useState(initialWsUrl);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pongTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTime = useRef<number>(Date.now());
  const reconnectDelay = useRef(BASE_RECONNECT_DELAY);

  // Update wsUrl and newWsUrl when initialWsUrl changes
  useEffect(() => {
    setWsUrl(initialWsUrl);
    setNewWsUrl(initialWsUrl);
  }, [initialWsUrl]);

  const calculateReconnectDelay = (attempt: number) => {
    return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  };

  const handleNewLogLine = useCallback((line: string) => {
    const parsedLog = parseLogLine(line);
    if (parsedLog) {
      setParsedLines(prevLines => {
        // Keep all logs, just prepend the new one
        const updatedLines = [parsedLog, ...prevLines];
        const aggregatedData = aggregateLogData(updatedLines);
        setLogData(aggregatedData);
        return updatedLines;
      });
    }
  }, []);

  const setupPingPong = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
          
          pongTimeoutRef.current = setTimeout(() => {
            if (wsRef.current) {
              console.warn('No pong received, closing connection');
              wsRef.current.close(4000, 'Pong timeout');
            }
          }, PONG_TIMEOUT);
        } catch (error) {
          console.error('Error sending ping:', error);
        }
      }
    }, PING_INTERVAL);
  }, []);

  const connectWebSocket = useCallback((url: string = wsUrl) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (!url) {
      setError(
        <div>
          <p className="font-medium">WebSocket URL is not configured.</p>
          <p className="mt-2 font-medium">Please:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Enter a valid WebSocket URL in the input field</li>
            <li>Ensure the URL starts with ws:// or wss://</li>
            <li>Verify the server is accessible</li>
          </ul>
          <p className="mt-2 font-medium">Example URLs:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>ws://localhost:8080</li>
            <li>wss://your-server.com/websocket</li>
          </ul>
        </div>
      );
      return;
    }

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      setConnectionStatus('connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Check if component is still mounted before updating state
        if (!wsRef.current) return;
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        setReconnectAttempts(0);
        reconnectDelay.current = BASE_RECONNECT_DELAY;
        lastMessageTime.current = Date.now();
        setupPingPong();
        // Update the wsUrl state to reflect the currently connected URL
        setWsUrl(url);
      };

      ws.onmessage = (event) => {
        // Check if component is still mounted before handling messages
        if (!wsRef.current) return;
        
        if (typeof event.data === 'string') {
          lastMessageTime.current = Date.now();
          
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              if (pongTimeoutRef.current) {
                clearTimeout(pongTimeoutRef.current);
                pongTimeoutRef.current = null;
              }
              return;
            }
          } catch (e) {
            // Not a JSON message, treat as log line
            handleNewLogLine(event.data);
          }
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        // Don't update state if component is unmounting
        if (!wsRef.current) return;
        
        setIsConnected(false);
        
        // Clear any existing ping/pong timeouts
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        if (pongTimeoutRef.current) {
          clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }
        
        // Special handling for our forced reconnection
        if (event.code === 4001) { // Our custom code for visibility change
          console.log('Reconnecting after visibility change...');
          connectWebSocket();
          return;
        }
        
        // Only attempt to reconnect if the closure was unexpected
        if (event.code !== 1000 && event.code !== 1005) {
          const nextAttempt = reconnectAttempts + 1;
          if (nextAttempt < MAX_RECONNECT_ATTEMPTS) {
            setConnectionStatus('reconnecting');
            setReconnectAttempts(nextAttempt);
            reconnectDelay.current = calculateReconnectDelay(nextAttempt);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect (${nextAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
              connectWebSocket();
            }, reconnectDelay.current);
            
            setError(
              <div>
                <p>Connection lost. Reconnecting in {reconnectDelay.current / 1000} seconds... (Attempt {nextAttempt + 1}/{MAX_RECONNECT_ATTEMPTS})</p>
              </div>
            );
          } else {
          setConnectionStatus('disconnected');
          setError(
            <div>
              <p className="font-medium">Connection lost. Reached maximum reconnection attempts ({MAX_RECONNECT_ATTEMPTS}).</p>
              <p className="mt-2 font-medium">Please check:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your network connection</li>
                <li>The WebSocket server URL is correct</li>
                <li>The server is running and accessible</li>
                <li>Firewall or proxy settings are not blocking the connection</li>
              </ul>
              <p className="mt-2 font-medium">You can try:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Verifying the URL and connecting again</li>
                <li>Checking your network connection</li>
                <li>Contacting your system administrator if the issue persists</li>
              </ul>
            </div>
          );
        }
        } else {
          setConnectionStatus('disconnected');
          setError(
            <div>
              <p className="font-medium">Connection closed by the server.</p>
              <p className="mt-2 font-medium">Possible reasons:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Server intentionally closed the connection</li>
                <li>Network interruption</li>
                <li>Server maintenance or restart</li>
              </ul>
              <p className="mt-2 font-medium">Please check:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your network connection</li>
                <li>The WebSocket server status</li>
                <li>Firewall or proxy settings</li>
              </ul>
              <p className="mt-2">You can try reconnecting or verifying the server status.</p>
            </div>
          );
        }
      };

      ws.onerror = (error) => {
        // Check if component is still mounted before handling errors
        if (!wsRef.current) return;
        
        console.error('WebSocket error:', error);
        setError(
          <div>
            <p className="font-medium">Connection error occurred.</p>
            <p className="mt-2 font-medium">Please check:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>The WebSocket server URL is correct</li>
              <li>The server is running and accessible</li>
              <li>Your network connection is stable</li>
            </ul>
            <p className="mt-2 font-medium">You can try:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verifying the URL and connecting again</li>
              <li>Checking your network connection</li>
              <li>Contacting your system administrator if the issue persists</li>
            </ul>
          </div>
        );
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [wsUrl, reconnectAttempts, handleNewLogLine, setupPingPong]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Handle visibility changes and wake from sleep
  const visibilityChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (visibilityChangeTimeout.current) {
        clearTimeout(visibilityChangeTimeout.current);
      }

      visibilityChangeTimeout.current = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          console.log('Tab became visible, checking connection...');
          
          // Check if connection is still alive before forcing reconnection
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Connection is still open, check if we've received messages recently
            const timeSinceLastMessage = Date.now() - lastMessageTime.current;
            // If we haven't received a message in over 60 seconds, force reconnection
            if (timeSinceLastMessage > 60000) {
              console.log('Forcing WebSocket reconnection due to inactivity...');
              // Close with a custom code that indicates we want to reconnect
              wsRef.current.close(4001, 'Tab became visible after inactivity');
            }
          } else if (wsRef.current) {
            console.log('Forcing WebSocket reconnection...');
            // Close with a custom code that indicates we want to reconnect
            wsRef.current.close(4001, 'Tab became visible');
          } else {
            connectWebSocket();
          }
        }
      }, 1000); // 1 second debounce
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (visibilityChangeTimeout.current) {
        clearTimeout(visibilityChangeTimeout.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectWebSocket]);

  // Initial connection
  useEffect(() => {
    // Only reset log data when connecting to a new URL (not on reconnections)
    if (wsUrl !== wsRef.current?.url) {
      setLogData(null);
      setParsedLines([]);
    }
    connectWebSocket(wsUrl);
    
    return () => {
      if (wsRef.current) {
        // Clear event handlers to prevent state updates after unmount
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (pongTimeoutRef.current) {
        clearTimeout(pongTimeoutRef.current);
      }
    };
  }, [connectWebSocket, wsUrl]);

  return (
    <div className="space-y-4">
      {/* Connection Status Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Connection Status Card */}
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              connectionStatus === 'reconnecting' ? 'bg-orange-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {connectionStatus === 'connected' ? 'Live Connection' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' : 
                 'Disconnected'}
              </div>
              {wsUrl && (
                <div className="flex items-center space-x-2 mt-1">
                  {showWsUrl ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate" title={wsUrl}>
                      {wsUrl}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">
                      ••••••••••••••••••••••
                    </div>
                  )}
                  <button 
                    onClick={() => setShowWsUrl(!showWsUrl)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                    aria-label={showWsUrl ? "Hide URL" : "Show URL"}
                  >
                    {showWsUrl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              {connectionStatus === 'reconnecting' && (
                <div className="text-sm text-orange-500 dark:text-orange-400 mt-1">
                  Attempt {reconnectAttempts + 1}/{MAX_RECONNECT_ATTEMPTS}
                </div>
              )}
            </div>
          </div>
          
          {/* Connection Controls */}
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' || connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
              <button
                onClick={() => {
                  if (wsRef.current) {
                    wsRef.current.close(1000, 'User disconnected');
                  }
                }}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => {
                  setWsUrl(newWsUrl);
                  connectWebSocket(newWsUrl);
                }}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                Connect
              </button>
            )}
            
            {/* Clock Card */}
            <div className="bg-gray-100/50 dark:bg-gray-700/50 rounded-xl px-3 py-2 min-w-[180px]">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                  {currentTime.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* URL Input when disconnected */}
        {connectionStatus !== 'connected' && connectionStatus !== 'connecting' && connectionStatus !== 'reconnecting' && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={newWsUrl}
              onChange={(e) => setNewWsUrl(e.target.value)}
              placeholder="Enter WebSocket URL"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          </div>
        </div>
      )}
      
      {logData && parsedLines.length > 0 ? (
        <Dashboard stats={logData} parsedLines={parsedLines} />
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Waiting for log data...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveDashboard;