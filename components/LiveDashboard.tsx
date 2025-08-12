"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { aggregateLogData } from '../lib/log-aggregator';
import { Dashboard } from './Dashboard';
import { Eye, EyeOff } from 'lucide-react';

// A more robust parser for common Nginx log formats.
const parseLogLine = (line: string) => {
  try {
    // This regex handles cases where the request field might be empty ("") or malformed.
    const match = line.match(/^(?<ip>[\d.]+) - - \[(?<timestamp>.+?)\] "(?<request>.*?)" (?<code>\d{3}) (?<size>\d+) "(?<referrer>.*?)" "(?<agent>.*?)"/);

    if (!match || !match.groups) {
      console.warn("Could not parse log line:", line);
      return null;
    }

    const { ip, timestamp, request, code, size, referrer, agent } = match.groups;
    
    // Split the request into method and URL, handling empty requests.
    const requestParts = request.split(' ');
    const method = requestParts[0] || 'N/A';
    const url = requestParts[1] || 'N/A';

    return {
      ipAddress: ip,
      timestamp,
      method,
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
const RECONNECT_DELAY = 2000; // 2 seconds

export function LiveDashboard({ wsUrl }: { wsUrl: string }) {
  const [logData, setLogData] = useState<LogData | null>(null);
  const [parsedLines, setParsedLines] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWsUrl, setShowWsUrl] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  const handleNewLogLine = useCallback((line: string) => {
    const parsedLog = parseLogLine(line);
    if (parsedLog) {
      console.log('New log line parsed:', parsedLog);
      setParsedLines(prevLines => {
        const updatedLines = [parsedLog, ...prevLines].slice(0, 500);
        const aggregatedData = aggregateLogData(updatedLines);
        // Create a new object reference to ensure proper re-rendering
        const newData = {
          ...aggregatedData,
          // Preserve any existing data that might not be in the current aggregation
          // But ensure we're creating a new object reference
        };
        console.log('Updated log data:', newData);
        setLogData(newData);
        return updatedLines;
      });
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (!wsUrl) {
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          handleNewLogLine(event.data);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        
        // Only attempt to reconnect if the closure was unexpected
        if (event.code !== 1000 && event.code !== 1005) {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS - 1) {
            // Schedule a reconnection attempt
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
            }, RECONNECT_DELAY);
          } else {
            setError(`Connection lost. Reached maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}).`);
          }
        }
      };

      ws.onerror = (error) => {
        setError('Connection error.');
      };
    } catch (error) {
      setError('Failed to create WebSocket connection.');
    }
  }, [wsUrl, reconnectAttempts, handleNewLogLine]);

  // Effect to handle connection and reconnection
  useEffect(() => {
    if (wsUrl) {
      connectWebSocket();
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wsUrl, connectWebSocket]);

  // Reset reconnection attempts when URL changes
  useEffect(() => {
    setReconnectAttempts(0);
  }, [wsUrl]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Connection Status Card */}
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {isConnected ? 'Live Connection' : 'Disconnected'}
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
              {reconnectAttempts > 0 && !isConnected && (
                <div className="text-sm text-orange-500 dark:text-orange-400 mt-1">
                  Attempt {reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS}
                </div>
              )}
            </div>
          </div>
          
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
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {logData && parsedLines.length > 0 && (
        <Dashboard stats={logData} parsedLines={parsedLines} />
      )}
    </div>
  );
}
