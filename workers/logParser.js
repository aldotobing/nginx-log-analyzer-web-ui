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

  // Attack patterns
  const attackPatterns = {
    "SQL Injection":
      /(?:--|;|\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b|\bTABLE\b|%27|%2D%2D)/i,
    XSS: /<script|javascript:|onerror=|onload=|eval\(|alert\(|document\.cookie/i,
    "Command Injection": /\b(?:cat|ls|pwd|rm|wget|curl|bash)\b/i,
    "Directory Traversal": /(?:\.\.\/){2,}|%2e{2,}/i,
    "Brute Force": /login|signin|authenticate|password|admin/i,
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

        return {
          ipAddress: match[1],
          remoteUser: match[2],
          timestamp: match[3],
          method: match[4],
          path: match[5],
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

        return {
          ipAddress: match[1],
          remoteUser: match[2],
          timestamp: match[3],
          method: match[4],
          path: match[5],
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

    // Check for attacks
    for (const [type, pattern] of Object.entries(attackPatterns)) {
      if (pattern.test(path)) {
        stats.attackDistribution[type]++;
        stats.requestStats.totalAttackAttempts++;
        stats.ipStats.attackCounts[ipAddress]++;
        stats.recentAttacks.push({
          timestamp,
          ipAddress,
          remoteUser,
          attackType: type,
          requestPath: path,
        });
        break;
      }
    }

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

  self.postMessage(finalStats);
};
