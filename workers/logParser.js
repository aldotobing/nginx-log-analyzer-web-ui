self.onmessage = (e) => {
  const data = e.data;
  const logContent = data.logContent || data;
  const format = data.format || "nginx";

  // Initialize stats
  const stats = {
    requestStats: {
      totalRequests: 0,
      uniqueIPs: new Set(),
      totalAttackAttempts: 0,
      parseErrors: 0,
    },
    httpMethods: {},
    statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
    attackDistribution: {
      "SQL Injection": 0,
      XSS: 0,
      "Command Injection": 0,
      "Directory Traversal": 0,
      "Brute Force": 0,
    },
    trafficOverTime: Array(24)
      .fill(0)
      .map((_, i) => ({
        hour: i,
        count: 0,
      })),
    recentAttacks: [],
    ipStats: {
      requestCounts: {},
      attackCounts: {},
      statusCodes: {},
      methods: {},
      bandwidthUsage: {},
      lastSeen: {},
      userAgents: {},
      paths: {},
    },
    referrerCounts: {},
    requestedUrlCounts: {},
  };

  // Valid HTTP methods
  const validHttpMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "PATCH",
    "CONNECT",
    "TRACE",
  ];

  // Enhanced attack patterns with comprehensive security checks
  const attackPatterns = {
    "SQL Injection": new RegExp([
      // Basic SQLi indicators
      "(?:%27|'|--|;|--\\s|/\\*.*?\\*/|#|%23|%2527)",
      // SQL commands and patterns
      "\\b(?:UNION\\s+(?:ALL\\s+)?SELECT|SELECT\\s+.*?\\bFROM|INSERT\\s+INTO|DELETE\\s+FROM|UPDATE\\s+\\w+\\s+SET|DROP\\s+(?:TABLE|DATABASE)|CREATE\\s+(?:TABLE|DATABASE)|ALTER\\s+TABLE)\\b",
      // Logical operators and comparisons (both in query params and general)
      "(?:[?&][^=]*=(?:%27|'|%2527).*?(?:OR|AND|X?OR|NOT).*?=|\\b(?:OR|AND|X?OR|NOT)\\s+['\\d]\\s*[=<>~!]?=)",
      // Database functions and procedures
      "\\b(?:EXEC(?:UTE)?(?:\\(|\\s)|EXEC\\s+SP_|XP_|sp_|xp_|WAITFOR\\s+DELAY|SLEEP\\s*\\(|BENCHMARK\\s*\\(|PG_SLEEP\\s*\\(|UPDATEXML\\s*\\(|EXTRACTVALUE\\s*\\()",
      // String operations
      "\\b(?:CHAR\\(|CONCAT\\(|GROUP_CONCAT\\()",
      // Common SQLi in parameters
      "[?&][^=]+=(?:%27|'|%2527).*?(?:OR|AND|X?OR|NOT).*?=",
      "[?&][^=]+=.*?(?:--|#|%23|;)"
    ].join('|'), 'i'),

    "XSS": new RegExp([
      // More comprehensive XSS patterns
      "<script[^>]*>",                // Script tags
      "javascript:",                  // JavaScript URIs
      "(?:on(?:load|error|click|mouse(?:over|out|move)|key(?:down|up|press)|submit|focus|blur|change))\\s*=",
      "eval\\s*\\(",                  // eval()
      "document\\.(?:cookie|location|write|URL|referrer)",
      "<(?:iframe|img|svg|object|embed|frame|frameset|meta|link|form|input|button|textarea|select|option|style|base|body|html)",
      "expression\\s*\\(",            // CSS expressions
      "data:text(?:html|javascript)",  // Data URIs (fixed missing pipe)
      "vbscript:"                     // VBScript
    ].join('|'), 'i'),

    "Command Injection": new RegExp([
      // More comprehensive command injection patterns
      "\\b(?:cat|ls|uname|whoami|pwd|rm|touch|wget|curl|scp|rsync|ftp|nc|ncat|nmap|ping|traceroute|telnet|ssh|bash|sh|zsh|dash|powershell|cmd\\.exe|cmd\\/c|\\|\\||&&|;)\\b",
      "\\$\\s*\\(.*\\)",              // $(command)
      "`.*`",                         // `command`
      "\\|\\|\\s*\\w+",               // || command
      "&&\\s*\\w+",                   // && command
      "\\|\\s*\\w+",                  // | command
      ">\\s*\\w+",                    // > file
      "<\\s*\\w+",                    // < file
      "\\b(?:exec|system|passthru|shell_exec|popen|proc_open|pcntl_exec)\\s*\\("
    ].join('|'), 'i'),

    "Directory Traversal": new RegExp([
      // Match directory traversal sequences with at least two levels up
      "(?:^|/|\\\\)(?:\\.{1,2}[\\./\\\\]){2,}",
      // Match encoded traversal sequences
      "(?:^|/|\\\\)(?:%2e%2e|%252e%252e|%c0%ae%c0%ae|%u002e%u002e)[/\\\\]",
      // Match absolute paths to sensitive files
      "/(?:etc/(?:passwd|shadow|group|hosts)|proc/self/environ|windows/win\\.ini|boot\\.ini|php\\.ini|my\\.cnf)(?:/|$|\\x00)",
      // Match Windows-style absolute paths
      "^[a-zA-Z]:\\\\[^/]+",
      // Match common path traversal patterns
      "\\.\\.\\.(?:%2f|%252f|%5c|%255c)",
      // Match null byte injection
      "\\\\x00|%00|\\\\0",
      // Match double encoding
      "%25(?:2e|25|5c|2f|5f|3d|3f|26|3a|3b)"
    ].join('|'), 'i'),

    "Brute Force": new RegExp([
      // More specific brute force patterns - focusing on common attack paths
      "\\b(?:wp-|wp_|xmlrpc\\.php|admin-ajax\\.php|wp-login\\.php|wp-admin/)\\b",
      "\\b(?:/admin/|/wp-admin/|/administrator/|/backend/|/control/|/cp/|/cpanel/|/manager/|/admincp/|/admin[1-9]|/admin10/)\\b",
      "\\b(?:/login\\.(?:php|asp|aspx|jsp|do|pl|cgi|cfm|phtml|shtml|rb|py))\\b",
      // Common brute force paths (more specific than just keywords)
      "(?:/wp-login\\.php|/administrator/login|/admin/login|/user/login|/auth/login|/api/login|/v\\d+/login)"
    ].join('|'), 'i')
  };

  // Initialize IP stats
  const initIpStats = (ip) => {
    if (!stats.ipStats.requestCounts[ip]) {
      stats.ipStats.requestCounts[ip] = 0;
      stats.ipStats.attackCounts[ip] = 0;
      stats.ipStats.statusCodes[ip] = {
        "2xx": 0,
        "3xx": 0,
        "4xx": 0,
        "5xx": 0,
      };
      stats.ipStats.methods[ip] = {};
      stats.ipStats.bandwidthUsage[ip] = 0;
      stats.ipStats.userAgents[ip] = new Set();
      stats.ipStats.paths[ip] = new Set();
    }
  };

  // Parse log line
  const parseLine = (line, format) => {
    try {
      let match;

      if (format === "nginx") {
        // Nginx pattern remains the same
        match = line.match(
          /^(\S+) - (\S+) \[(.*?)\] "(\S+) ([^"]*) HTTP\/\d+\.\d+" (\d+) (\d+) "([^"]*)" "([^"]*)" "([^"]*)"$/
        );
        if (!match) return null;

        // Split path and query parameters
        const fullPath = match[5];
        const [path, query] = fullPath.split('?');

        return {
          ipAddress: match[1],
          remoteUser: match[2],
          timestamp: match[3],
          method: match[4],
          path: path,
          query: query || '',
          fullPath: fullPath,
          status: match[6],
          bodyBytesSent: match[7],
          referer: match[8],
          userAgent: match[9],
          xForwardedFor: match[10],
        };
      } else if (format === "apache") {
        // Updated Apache pattern to be more flexible
        match = line.match(
          /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"(\S+)\s+([^\s"]+)(?:\s+HTTP\/[\d.]+)?"\s+(\d{3})\s+(\d+|-)/
        );
        if (!match) return null;

        // Split path and query parameters for Apache
        const fullPath = match[5];
        const [path, query] = fullPath.split('?');

        return {
          ipAddress: match[1],
          remoteUser: match[2],
          timestamp: match[3],
          method: match[4],
          path: path,
          query: query || '',
          fullPath: fullPath,
          status: match[6],
          bodyBytesSent: match[7] === "-" ? "0" : match[7],
          referer: "-",
          userAgent: "-",
          xForwardedFor: "-",
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Process log file
  const lines = logContent.split("\n");
  const totalLines = lines.length;
  let validLines = 0;

  const parsedLines = [];
  lines.forEach((line, index) => {
    if (index % 1000 === 0) {
      self.postMessage({ progress: Math.round((index / totalLines) * 100) });
    }

    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const parsedLine = parseLine(trimmedLine, format);
    if (!parsedLine) {
      stats.requestStats.parseErrors++;
      return;
    }

    validLines++;
    const {
      ipAddress,
      remoteUser,
      timestamp,
      method,
      path,
      status,
      bodyBytesSent,
      referer,
      userAgent,
      xForwardedFor,
    } = parsedLine;

    if (!validHttpMethods.includes(method)) return;

    // Update IP stats
    initIpStats(ipAddress);
    const bytes = parseInt(bodyBytesSent, 10) || 0;

    stats.ipStats.requestCounts[ipAddress]++;
    stats.ipStats.bandwidthUsage[ipAddress] += bytes;
    stats.ipStats.lastSeen[ipAddress] = timestamp;
    stats.ipStats.paths[ipAddress].add(path);
    stats.ipStats.methods[ipAddress][method] =
      (stats.ipStats.methods[ipAddress][method] || 0) + 1;
    stats.ipStats.statusCodes[ipAddress][`${status[0]}xx`]++;

    if (format === "nginx") {
      stats.ipStats.userAgents[ipAddress].add(userAgent);
      if (referer && referer !== "-") {
        stats.referrerCounts[referer] =
          (stats.referrerCounts[referer] || 0) + 1;
      }
    }

    // Update global stats
    stats.requestStats.totalRequests++;
    stats.requestStats.uniqueIPs.add(ipAddress);
    stats.httpMethods[method] = (stats.httpMethods[method] || 0) + 1;
    stats.statusCodes[`${status[0]}xx`]++;
    stats.requestedUrlCounts[path] = (stats.requestedUrlCounts[path] || 0) + 1;

    // Process timestamp
    try {
      const date = new Date(timestamp.replace(/\[|\]/g, ""));
      const hour = date.getHours();
      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        stats.trafficOverTime[hour].count++;
      }
    } catch (error) {
      // Skip invalid timestamps
    }

    let attackType = null;
    // Use the full path with query parameters for attack detection
    const fullPath = parsedLine.fullPath || path;
    
    // Check for attacks in both path and query parameters
    for (const [type, pattern] of Object.entries(attackPatterns)) {
      if (pattern.test(fullPath)) {
        console.log(`[ATTACK DETECTED] Type: ${type}, Path: ${fullPath}`);
        
        // Initialize attack type counter if it doesn't exist
        if (!stats.attackDistribution[type]) {
          stats.attackDistribution[type] = 0;
        }
        
        stats.attackDistribution[type]++;
        stats.requestStats.totalAttackAttempts++;
        stats.ipStats.attackCounts[ipAddress] = (stats.ipStats.attackCounts[ipAddress] || 0) + 1;
        attackType = type;
        
        // Add to recent attacks if not already there (to avoid duplicates)
        const attackKey = `${ipAddress}:${type}:${path}`;
        const attackExists = stats.recentAttacks.some(attack => 
          `${attack.ipAddress}:${attack.attackType}:${attack.requestPath}` === attackKey
        );
        
        if (!attackExists) {
          stats.recentAttacks.push({
            timestamp,
            ipAddress,
            remoteUser,
            attackType: type,
            requestPath: path,
            fullPath: fullPath, // Store full path for reference
            method: method     // Include HTTP method
          });
          
          // Keep only the 100 most recent attacks
          if (stats.recentAttacks.length > 100) {
            stats.recentAttacks.shift();
          }
          
          console.log(`[NEW ATTACK] ${type} from ${ipAddress} at ${timestamp}: ${method} ${fullPath}`);
        }
        
        // Don't break here to check for multiple attack types
      }
    }

    parsedLines.push({
      ...parsedLine,
      attackType,
    });

    try {
      const timestampStr = timestamp.replace(/\[|\]/g, "");
      // Handle common log formats
      const date = new Date(
        timestampStr.replace(
          /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})/,
          "$2 $1 $3 $4"
        )
      );

      if (date instanceof Date && !isNaN(date)) {
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          stats.trafficOverTime[hour].count++;
        }
      } else {
        console.warn("Invalid timestamp format:", timestampStr);
      }
    } catch (error) {
      console.warn("Error processing timestamp:", error);
    }
  });

  const processedTrafficData = stats.trafficOverTime.map((entry) => ({
    hour: entry.hour,
    count: entry.count,
  }));

  // Abort if no valid lines were parsed
  if (validLines === 0) {
    self.postMessage({
      error:
        "This file doesn't appear to be a valid Nginx or Apache Http log. Please check the format and try again.",
    });
    return;
  }

  // Prepare final stats
  const finalStats = {
    requestStats: {
      ...stats.requestStats,
      uniqueIPs: stats.requestStats.uniqueIPs.size,
    },
    httpMethods: stats.httpMethods,
    statusCodes: stats.statusCodes,
    attackDistribution: stats.attackDistribution,
    trafficOverTime: processedTrafficData,
    topIp: Object.fromEntries(
      Object.entries(stats.ipStats.requestCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    ),
    topReferrers:
      format === "nginx"
        ? Object.fromEntries(
            Object.entries(stats.referrerCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
          )
        : {},
    topRequestedUrls: Object.fromEntries(
      Object.entries(stats.requestedUrlCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    ),
    suspiciousIps: Object.entries(stats.ipStats.attackCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [ip, count]) => {
        acc[ip] = {
          attackCount: count,
          requestCount: stats.ipStats.requestCounts[ip],
          lastSeen: stats.ipStats.lastSeen[ip],
          uniquePaths: stats.ipStats.paths[ip].size,
          uniqueUserAgents: stats.ipStats.userAgents[ip].size,
          bandwidthUsage: stats.ipStats.bandwidthUsage[ip],
          methods: stats.ipStats.methods[ip],
          statusCodes: stats.ipStats.statusCodes[ip],
        };
        return acc;
      }, {}),
    recentAttacks: stats.recentAttacks.slice(-100).reverse(),
  };

  self.postMessage({ stats: finalStats, parsedLines });
};