const fs = require('fs');

// Read the nginx log file
const logContent = fs.readFileSync('E:/projectE/nginx-log-analyzer-web-ui/nginx-logs.txt', 'utf8');

// Split into lines
const lines = logContent.split('\n');

// Object to store hour counts
const hourCounts = {};

// Process each line
lines.forEach(line => {
  // Extract timestamp (format: [10/Aug/2025:12:47:01 +0700])
  const timestampMatch = line.match(/\[(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):\d{2}:\d{2}/);
  if (timestampMatch) {
    const hour = parseInt(timestampMatch[4]);
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
});

// Print results
console.log('Hourly traffic distribution:');
for (let i = 0; i < 24; i++) {
  console.log(`${i.toString().padStart(2, '0')}:00 - ${hourCounts[i] || 0} requests`);
}

// Find peak hour
let peakHour = 0;
let peakCount = 0;
for (let i = 0; i < 24; i++) {
  if ((hourCounts[i] || 0) > peakCount) {
    peakCount = hourCounts[i] || 0;
    peakHour = i;
  }
}

console.log(`\nPeak traffic hour: ${peakHour.toString().padStart(2, '0')}:00 with ${peakCount} requests`);