self.onmessage = (e) => {
  const logContent = e.data;
  const lines = logContent.split("\n");
  const totalLines = lines.length;

  const requestStats = {
    totalRequests: 0,
    uniqueIPs: new Set(),
    totalAttackAttempts: 0,
  };
  const httpMethods = {};
  const statusCodes = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
  const attackDistribution = {
    "SQL Injection": 0,
    XSS: 0,
    "Command Injection": 0,
    "Directory Traversal": 0,
    "Brute Force": 0,
  };
  const trafficOverTime = Array(24)
    .fill(0)
    .map((_, i) => ({ hour: i, count: 0 }));
  let recentAttacks = [];

  // New IP tracking objects
  const ipStats = {
    requestCounts: {}, // Track requests per IP
    attackCounts: {}, // Track attacks per IP
    statusCodes: {}, // Track status codes per IP
    methods: {}, // Track HTTP methods per IP
    bandwidthUsage: {}, // Track bandwidth usage per IP
    lastSeen: {}, // Track last seen timestamp per IP
    userAgents: {}, // Track unique user agents per IP
    paths: {}, // Track unique paths accessed per IP
  };

  // New Referrer tracking object
  const referrerCounts = {}; // Track referring URLs

  const attackPatterns = {
    "SQL Injection": new RegExp(
      "(--|;|\\bUNION\\b|\\bSELECT\\b|\\bINSERT\\b|\\bDELETE\\b|\\bUPDATE\\b|\\bDROP\\b|\\bTABLE\\b|\\bFROM\\b|\\bWHERE\\b|\\bOR\\b|\\bAND\\b|'|\"|\\bEXEC\\b|\\bCONCAT\\b|\\bINTO\\b|\\bOUTFILE\\b|\\bLOAD_FILE\\b|\\bSELECT\\b.*\\bINTO\\b|\\bLOAD_FILE\\b|%27|%2D%2D|%3B|\\bDBMS_PIPE\\b|\\bSLEEP\\b|\\bBENCHMARK\\b)",
      "i"
    ),
    XSS: new RegExp(
      "<script[^>]*>|javascript:|onerror\\s*=|onload\\s*=|eval\\(|alert\\(|document\\.cookie|document\\.location|<img[^>]+onerror|<svg[^>]+onload|<iframe|<object|<embed|document\\.write",
      "i"
    ),
    "Command Injection": new RegExp(
      "\\b(cat|ls|id|uname|whoami|pwd|rm|touch|wget|curl|scp|rsync|ftp|nc|nmap|ping|traceroute|telnet|ssh|sh|bash|zsh)\\b(\\s+|$)|\\b(sh|bash|zsh)\\b(\\s+|$)",
      "i"
    ),
    "Directory Traversal": new RegExp(
      "(\\.\\./){2,}|%2e{2,}|\\b(?:/|\\\\)(?:\\S+)?\\b(?:\\.{2,}|\\../){2,}",
      "i"
    ),
    "Brute Force": new RegExp(
      "login|signin|authenticate|password|user|checkin|auth|account|register|confirm|reset|forgot|login\\.php|login\\.aspx|signin\\.php|signin\\.aspx|auth\\.php|user_checkin_activity|reset_password",
      "i"
    ),
  };

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

  // Helper function to initialize IP stats
  const initializeIpStats = (ip) => {
    if (!ipStats.requestCounts[ip]) {
      ipStats.requestCounts[ip] = 0;
      ipStats.attackCounts[ip] = 0;
      ipStats.statusCodes[ip] = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
      ipStats.methods[ip] = {};
      ipStats.bandwidthUsage[ip] = 0;
      ipStats.userAgents[ip] = new Set();
      ipStats.paths[ip] = new Set();
    }
  };

  lines.forEach((line, index) => {
    if (index % 1000 === 0) {
      self.postMessage({ progress: Math.round((index / totalLines) * 100) });
    }

    const match = line.match(
      /^(\S+) - (\S+) \[(.*?)\] "(\S+) ([^"]*) HTTP\/\d+\.\d+" (\d+) (\d+) "([^"]*)" "([^"]*)" "([^"]*)"$/
    );
    if (match) {
      const [
        ,
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
      ] = match;

      if (!validHttpMethods.includes(method)) {
        return;
      }

      // Initialize and update IP stats
      initializeIpStats(ipAddress);
      ipStats.requestCounts[ipAddress]++;
      ipStats.bandwidthUsage[ipAddress] += parseInt(bodyBytesSent, 10);
      ipStats.lastSeen[ipAddress] = timestamp;
      ipStats.userAgents[ipAddress].add(userAgent);
      ipStats.paths[ipAddress].add(path);
      ipStats.methods[ipAddress][method] =
        (ipStats.methods[ipAddress][method] || 0) + 1;
      ipStats.statusCodes[ipAddress][status[0] + "xx"]++;

      // Track referrer counts
      if (referer) {
        referrerCounts[referer] = (referrerCounts[referer] || 0) + 1;
      }

      // Regular stats tracking
      requestStats.totalRequests++;
      requestStats.uniqueIPs.add(ipAddress);

      httpMethods[method] = (httpMethods[method] || 0) + 1;

      const statusGroup = status[0] + "xx";
      statusCodes[statusGroup]++;

      const hour = new Date(timestamp.replace(":", " ")).getHours();
      trafficOverTime[hour].count++;

      let attackType = null;
      for (const [type, pattern] of Object.entries(attackPatterns)) {
        if (
          pattern.test(path) ||
          pattern.test(referer) ||
          pattern.test(userAgent)
        ) {
          attackType = type;
          break;
        }
      }

      if (attackType) {
        attackDistribution[attackType]++;
        requestStats.totalAttackAttempts++;
        ipStats.attackCounts[ipAddress]++;
        recentAttacks.push({
          timestamp,
          ipAddress,
          remoteUser,
          xForwardedFor,
          attackType,
          requestPath: path,
        });
      }
    }
  });

  // Process IP statistics for the dashboard
  const topIp = Object.fromEntries(
    Object.entries(ipStats.requestCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );

  // Process Referrer statistics for the dashboard (Top 10)
  const topReferrers = Object.fromEntries(
    Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );

  // Additional IP analysis
  const suspiciousIps = Object.entries(ipStats.attackCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [ip, count]) => {
      acc[ip] = {
        attackCount: count,
        requestCount: ipStats.requestCounts[ip],
        lastSeen: ipStats.lastSeen[ip],
        uniquePaths: ipStats.paths[ip].size,
        uniqueUserAgents: ipStats.userAgents[ip].size,
        bandwidthUsage: ipStats.bandwidthUsage[ip],
        methods: ipStats.methods[ip],
        statusCodes: ipStats.statusCodes[ip],
      };
      return acc;
    }, {});

  requestStats.uniqueIPs = requestStats.uniqueIPs.size;
  recentAttacks = recentAttacks.slice(-100).reverse();

  self.postMessage({
    requestStats,
    httpMethods,
    statusCodes,
    attackDistribution,
    trafficOverTime,
    topIp,
    topReferrers, // Send the top referrers
    suspiciousIps,
    recentAttacks,
  });
};
