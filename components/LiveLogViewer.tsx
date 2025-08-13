"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Download, Pause, Play, Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  content: string;
  level?: 'info' | 'warn' | 'error' | 'attack';
}

export function LiveLogViewer({ 
  logLines = [] as string[],
  className = ""
}: { 
  logLines?: string[];
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Process incoming log lines
  useEffect(() => {
    if (isPaused || logLines.length === 0) return;
    
    const newLogs = logLines.map((line, index) => {
      // Check if this looks like an attack log
      let level: 'info' | 'warn' | 'error' | 'attack' = 'info';
      
      // Simple heuristic for attack detection in log lines
      if (
        line.includes('SQL Injection') || 
        line.includes('XSS') || 
        line.includes('OR ') || 
        line.includes('AND ') ||
        line.includes('UNION') ||
        line.includes('SELECT') ||
        line.includes('DROP') ||
        line.includes('DELETE') ||
        line.includes('INSERT') ||
        line.includes('UPDATE') ||
        line.includes('cmd=') ||
        line.includes('exec') ||
        line.includes('eval') ||
        line.includes('script') ||
        line.includes('alert(') ||
        line.includes("' OR '") ||
        line.includes('%27 OR %27') ||
        line.includes('--') ||
        line.includes('SLEEP(') ||
        line.includes('BENCHMARK(') ||
        line.includes("'=')") ||
        line.includes('1=1') ||
        line.includes('xp_') ||
        line.includes('sp_')
      ) {
        level = 'attack';
      } else if (
        line.includes(' 500 ') || 
        line.includes(' 502 ') || 
        line.includes(' 503 ') ||
        line.includes(' 504 ') ||
        line.includes('ERROR') ||
        line.includes('error') ||
        line.includes('CRITICAL') ||
        line.includes('FATAL')
      ) {
        level = 'error';
      } else if (
        line.includes(' 400 ') || 
        line.includes(' 401 ') || 
        line.includes(' 403 ') || 
        line.includes(' 404 ') ||
        line.includes(' 429 ') ||
        line.includes('WARN') ||
        line.includes('warn')
      ) {
        level = 'warn';
      }
      
      // Extract timestamp if possible
      const timestampMatch = line.match(/\[(.*?)\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      
      return {
        id: `${Date.now()}-${index}`,
        timestamp,
        content: line,
        level
      };
    });
    
    setVisibleLogs(prev => {
      const updated = [...newLogs, ...prev]; // New logs at the beginning
      // Keep only the last 1000 logs to prevent memory issues
      return updated.slice(0, 1000);
    });
  }, [logLines, isPaused]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isExpanded && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleLogs, isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const clearLogs = () => {
    setVisibleLogs([]);
  };

  const downloadLogs = () => {
    const logContent = visibleLogs.map(log => `[${log.timestamp}] ${log.content}`).join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nginx-logs-${new Date().toISOString().split('T')[0]}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      // Try to parse the timestamp
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // If it's not a valid date, try to parse nginx format
        const parts = timestamp.split(/[:\s\/]+/);
        if (parts.length >= 4) {
          const [day, month, year, hour, minute, second] = parts;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = months.findIndex(m => m.toLowerCase() === month?.toLowerCase());
          if (monthIndex !== -1 && year && hour && minute && second) {
            return `${hour}:${minute}:${second}`;
          }
        }
        return timestamp;
      }
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800/80 px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h3 className="text-sm font-mono font-medium text-gray-200">Live Nginx Logs</h3>
          <div className="flex items-center space-x-1">
            <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-400">
              {visibleLogs.length} lines
            </span>
            {isPaused && (
              <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                PAUSED
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePause}
            className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            title={isPaused ? "Resume logs" : "Pause logs"}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          <button
            onClick={clearLogs}
            className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadLogs}
            className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            title="Download logs"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleExpand}
            className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Log Content */}
      {isExpanded && (
        <div 
          ref={logContainerRef}
          className="h-64 overflow-y-auto font-mono text-sm bg-gray-900/50 custom-scrollbar"
        >
          {visibleLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="animate-pulse mb-2">Waiting for log data...</div>
                <div className="text-xs">Logs will appear here in real-time</div>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {visibleLogs.map((log) => (
                <div 
                  key={log.id}
                  className={`flex hover:bg-gray-800/30 transition-colors group ${
                    log.level === 'attack' ? 'bg-red-900/20 border-l-2 border-red-500' :
                    log.level === 'error' ? 'bg-red-900/10' :
                    log.level === 'warn' ? 'bg-yellow-900/10' :
                    'hover:bg-gray-800/20'
                  }`}
                >
                  <div className="w-20 text-gray-500 text-xs flex-shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`${
                      log.level === 'attack' ? 'text-red-400' :
                      log.level === 'error' ? 'text-red-300' :
                      log.level === 'warn' ? 'text-yellow-300' :
                      'text-gray-300'
                    } break-all`}>
                      {log.content}
                    </span>
                  </div>
                  <div className="w-16 text-right text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {log.level === 'attack' && (
                      <span className="px-1 py-0.5 bg-red-500/20 text-red-400 rounded">
                        ATTACK
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      )}
      
      {/* Collapsed state indicator */}
      {!isExpanded && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-700/50 flex items-center justify-between">
          <div>
            {visibleLogs.length > 0 ? (
              <span className="truncate">
                Last: {visibleLogs[visibleLogs.length - 1]?.content.substring(0, 80)}...
              </span>
            ) : (
              <span>Waiting for log data...</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {visibleLogs.some(log => log.level === 'attack') && (
              <span className="flex items-center text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                Attacks detected
              </span>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(75, 85, 99, 0.8);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.5) rgba(31, 41, 55, 0.5);
        }
      `}</style>
    </div>
  );
}