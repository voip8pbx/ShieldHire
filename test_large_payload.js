const http = require('http');

// Create a large 12MB string to simulate image upload
const largeData = 'a'.repeat(12 * 1024 * 1024);

const postData = JSON.stringify({
    data: largeData
});

const options = {
    hostname: '10.59.243.154',
    port: 5000,
    path: '/api/test-upload', // This endpoint doesn't exist, but we just want to see if it reaches the server without timeout
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('Testing large payload (12MB) upload to http://10.59.243.154:5000...');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('Upload completed (server responded)!');
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.write(postData);
req.end();
