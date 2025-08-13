// lib/log-aggregator.ts

interface StatusCodeStats {
  "2xx": number;
  "3xx": number;
  "4xx": number;
  "5xx": number;
  [key: string]: number;
}

interface SuspiciousIpInfo {
  attackCount: number;
  requestCount: number;
  lastSeen: string;
  uniquePaths: number;
  uniqueUserAgents: number;
  bandwidthUsage: number;
  methods: { [method: string]: number };
  statusCodes: StatusCodeStats;
}

export const aggregateLogData = (parsedLines: any[], filters: Record<string, any> = {}) => {
  // console.log('Aggregating log data, parsedLines:', parsedLines.length);
  
  const stats = {
    requestStats: {
      totalRequests: 0,
      uniqueIPs: new Set<string>(),
      totalAttackAttempts: 0,
      parseErrors: 0,
    },
    httpMethods: {} as { [method: string]: number },
    statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 } as StatusCodeStats,
    attackDistribution: {
      "SQL Injection": 0,
      XSS: 0,
      "Command Injection": 0,
      "Directory Traversal": 0,
      "Brute Force": 0,
    } as { [attack: string]: number },
    trafficOverTime: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 })),
    recentAttacks: [] as any[],
    ipStats: {
      requestCounts: {} as { [ip: string]: number },
      attackCounts: {} as { [ip: string]: number },
      statusCodes: {} as { [ip: string]: StatusCodeStats },
      methods: {} as { [ip: string]: { [method: string]: number } },
      bandwidthUsage: {} as { [ip: string]: number },
      lastSeen: {} as { [ip: string]: string },
      userAgents: {} as { [ip: string]: Set<string> },
      paths: {} as { [ip: string]: Set<string> },
    },
    referrerCounts: {} as { [referrer: string]: number },
    requestedUrlCounts: {} as { [url: string]: number },
  };

  const initIpStats = (ip: string) => {
    if (!stats.ipStats.requestCounts[ip]) {
      stats.ipStats.requestCounts[ip] = 0;
      stats.ipStats.attackCounts[ip] = 0;
      stats.ipStats.statusCodes[ip] = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
      stats.ipStats.methods[ip] = {};
      stats.ipStats.bandwidthUsage[ip] = 0;
      stats.ipStats.userAgents[ip] = new Set();
      stats.ipStats.paths[ip] = new Set();
    }
  };

  //console.log('=== Starting to process', parsedLines.length, 'log entries with filters:', filters);
  
  parsedLines.forEach((parsedLine, index) => {
    // console.log(`Processing line ${index}:`, parsedLine);
    
    // Apply filters if any
    let filterMatch = true;
    
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      
      if (key === 'status') {
        const statusStr = parsedLine.status?.toString() || '';
        let matches = false;
        
        if (typeof value === 'string' && value.endsWith('xx')) {
          const statusPrefix = value.slice(0, 1);
          matches = statusStr.startsWith(statusPrefix);
          if (!matches) {
            //console.log(`[${index}] Filtered out - status ${statusStr} doesn't match ${value}`);
            filterMatch = false;
            break;
          }
        } else {
          matches = statusStr === value.toString();
          if (!matches) {
            //console.log(`[${index}] Filtered out - status ${statusStr} doesn't equal ${value}`);
            filterMatch = false;
            break;
          }
        }
      }
      else if (key === 'ipAddress') {
        if (parsedLine.ipAddress !== value) {
          //console.log(`[${index}] Filtered out - IP ${parsedLine.ipAddress} doesn't match ${value}`);
          filterMatch = false;
          break;
        }
      }
      else if (key === 'method') {
        if (!parsedLine.method || parsedLine.method.toLowerCase() !== value.toLowerCase()) {
          //console.log(`[${index}] Filtered out - method ${parsedLine.method} doesn't match ${value}`);
          filterMatch = false;
          break;
        }
      }
      else if (parsedLine[key] !== value) {
        //console.log(`[${index}] Filtered out - ${key} ${parsedLine[key]} doesn't match ${value}`);
        filterMatch = false;
        break;
      }
    }

    if (!filterMatch) {
        // console.log(`Line ${index} filtered out`);
      return;
    }
    
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
      attackType,
    } = parsedLine;

    // console.log(`Line ${index} details:`, {
    //   ipAddress,
    //   method,
    //   path,
    //   status,
    //   attackType
    // });

    if (!ipAddress || !method || !status) {
      // console.log(`Line ${index} missing required fields, skipping`);
      return;
    }

    initIpStats(ipAddress);
    const bytes = parseInt(bodyBytesSent, 10) || 0;
    
    // Log the first few lines to see what we're working with
    // if (index < 3) {
    //   console.log(`Processing log entry ${index}:`, {
    //     ipAddress,
    //     method,
    //     status,
    //     path,
    //     timestamp,
    //     attackType: attackType || 'none'
    //   });
    // }

    stats.ipStats.requestCounts[ipAddress]++;
    stats.ipStats.bandwidthUsage[ipAddress] += bytes;
    stats.ipStats.lastSeen[ipAddress] = timestamp;
    stats.ipStats.paths[ipAddress].add(path);
    stats.ipStats.methods[ipAddress][method] = (stats.ipStats.methods[ipAddress][method] || 0) + 1;
    
    const statusCodeKey = `${status[0]}xx` as keyof StatusCodeStats;
    if (stats.ipStats.statusCodes[ipAddress] && stats.ipStats.statusCodes[ipAddress][statusCodeKey] !== undefined) {
      stats.ipStats.statusCodes[ipAddress][statusCodeKey]++;
    }

    if (userAgent) {
      stats.ipStats.userAgents[ipAddress].add(userAgent);
    }
    if (referer && referer !== "-") {
        stats.referrerCounts[referer] = (stats.referrerCounts[referer] || 0) + 1;
    }

    stats.requestStats.totalRequests++;
    stats.requestStats.uniqueIPs.add(ipAddress);
    stats.httpMethods[method] = (stats.httpMethods[method] || 0) + 1;
    if (stats.statusCodes[statusCodeKey] !== undefined) {
      stats.statusCodes[statusCodeKey]++;
    }
    stats.requestedUrlCounts[path] = (stats.requestedUrlCounts[path] || 0) + 1;

    try {
      // Parse the timestamp in format: 11/Aug/2025:03:30:00 +0700
      const dateParts = timestamp.replace(/\[|\]/g, "").split(/[\/: ]+/);
      if (dateParts.length >= 4) {
        const [day, monthStr, year, hourStr] = dateParts;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = months.findIndex(m => m === monthStr);
        
        if (monthIndex !== -1) {
          const hour = parseInt(hourStr, 10);
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            stats.trafficOverTime[hour].count++;
            // Removed the return statement that was preventing attack counting
          }
        }
      }
      // console.warn('Could not parse timestamp:', timestamp);
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
    }

    if (attackType) {
      // console.log('ATTACK COUNTING SECTION REACHED for:', attackType);
      console.log('Aggregator found attack:', attackType, 'for line:', {
        ipAddress,
        method,
        path,
        attackType
      });
      
      stats.attackDistribution[attackType]++;
      stats.requestStats.totalAttackAttempts++;
      stats.ipStats.attackCounts[ipAddress]++;
      
      stats.recentAttacks.push({
        timestamp,
        ipAddress,
        remoteUser,
        attackType: attackType,
        requestPath: path,
      });
    } else {
      // console.log('No attack type found for line:', {
      //   ipAddress,
      //   method,
      //   path,
      //   attackType
      // });
    }
  });

  // Convert the traffic data to the expected format
  const processedTrafficData = stats.trafficOverTime.map((entry, index) => ({
    hour: index, // Use the array index as the hour
    count: entry.count,
  }));
  
  //console.log('Processed traffic data:', processedTrafficData.filter(x => x.count > 0));
  
  return {
    requestStats: {
      ...stats.requestStats,
      uniqueIPs: stats.requestStats.uniqueIPs.size,
    },
    httpMethods: stats.httpMethods,
    statusCodes: stats.statusCodes,
    attackDistribution: stats.attackDistribution,
    trafficOverTime: processedTrafficData,
    topIp: Object.fromEntries(
      Object.entries(stats.ipStats.requestCounts).sort(([, a], [, b]) => b - a).slice(0, 10)
    ),
    topReferrers: Object.fromEntries(
      Object.entries(stats.referrerCounts).sort(([, a], [, b]) => b - a).slice(0, 10)
    ),
    topRequestedUrls: Object.fromEntries(
      Object.entries(stats.requestedUrlCounts).sort(([, a], [, b]) => b - a).slice(0, 10)
    ),
    suspiciousIps: Object.entries(stats.ipStats.attackCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [ip, count]) => {
        acc[ip] = {
          attackCount: count,
          requestCount: stats.ipStats.requestCounts[ip],
          lastSeen: stats.ipStats.lastSeen[ip],
          uniquePaths: stats.ipStats.paths[ip]?.size || 0,
          uniqueUserAgents: stats.ipStats.userAgents[ip]?.size || 0,
          bandwidthUsage: stats.ipStats.bandwidthUsage[ip],
          methods: stats.ipStats.methods[ip],
          statusCodes: stats.ipStats.statusCodes[ip],
        };
        return acc;
      }, {} as { [ip: string]: SuspiciousIpInfo }),
    recentAttacks: stats.recentAttacks.slice(-100).reverse(),
  };
};