self.onmessage = (e) => {
  const data = e.data;
  const line = data.line || data;
  const format = data.format || "nginx";
  
  // console.log('Worker received line:', line);
  // console.log('Format:', format);

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
      "(?:^|/|\\\\)(?:\\.{1,2}[/\\\\\\\\]){2,}",
      // Match encoded traversal sequences
      "(?:^|/|\\\\)(?:%2e%2e|%252e%252e|%c0%ae%c0%ae|%u002e%u002e)[/\\\\\\\\]",
      // Match absolute paths to sensitive files
      "/(?:etc/(?:passwd|shadow|group|hosts)|proc/self/environ|windows/win\\.ini|boot\\.ini|php\\.ini|my\\.cnf)(?:/|$|\\x00)",
      // Match Windows-style absolute paths
      "^[a-zA-Z]:\\\\\\\\[^/]+",
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

  const trimmedLine = line.trim();
  if (!trimmedLine) {
    // console.log('Empty line received');
    self.postMessage({ error: "Empty line" });
    return;
  }

  const parsedLine = parseLine(trimmedLine, format);
  if (!parsedLine) {
    // console.log('Failed to parse line:', line);
    self.postMessage({ error: "Failed to parse line" });
    return;
  }

  if (!validHttpMethods.includes(parsedLine.method)) {
    // console.log('Invalid HTTP method:', parsedLine.method);
    self.postMessage({ error: "Invalid HTTP method" });
    return;
  }

  // console.log('Successfully parsed line:', parsedLine);

  // Check for attacks in both path and query parameters
  let attackType = null;
  const fullPath = parsedLine.fullPath || parsedLine.path;
  
  // console.log('Checking for attacks in fullPath:', fullPath);
  
  // Check for attacks
  for (const [type, pattern] of Object.entries(attackPatterns)) {
    if (pattern.test(fullPath)) {
      attackType = type;
      console.log('ATTACK DETECTED:', type, 'Pattern matched:', pattern);
      break; // Stop at first match
    }
  }

  const result = {
    ...parsedLine,
    attackType,
  };

  // console.log('Sending result to main thread:', result);
  self.postMessage({ parsedLine: result });
};