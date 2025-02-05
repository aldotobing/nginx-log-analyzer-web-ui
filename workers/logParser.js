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

  lines.forEach((line, index) => {
    if (index % 1000 === 0) {
      self.postMessage({ progress: Math.round((index / totalLines) * 100) });
    }

    const match = line.match(
      /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) ([^"]*)" (\d+) (\d+) "([^"]*)" "([^"]*)"/
    );
    if (match) {
      const [
        ,
        ipAddress,
        ,
        ,
        timestamp,
        method,
        path,
        status,
        ,
        referer,
        userAgent,
      ] = match;

      if (!validHttpMethods.includes(method)) {
        return;
      }

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
        recentAttacks.push({
          timestamp,
          ipAddress,
          attackType,
          requestPath: path,
        });
      }
    }
  });

  requestStats.uniqueIPs = requestStats.uniqueIPs.size;
  recentAttacks = recentAttacks.slice(-100).reverse();

  self.postMessage({
    requestStats,
    httpMethods,
    statusCodes,
    attackDistribution,
    trafficOverTime,
    recentAttacks,
  });
};
