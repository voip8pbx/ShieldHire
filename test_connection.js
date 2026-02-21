const http = require('http');

const options = {
    hostname: '10.59.243.154',
    port: 5000,
    path: '/',
    method: 'GET',
    timeout: 5000
};

console.log('Testing connection to backend at http://10.59.243.154:5000...');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('Backend is reachable locally!');
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
    console.log('Make sure the backend server (npm run dev) is running!');
});

req.on('timeout', () => {
    req.destroy();
    console.log('Timeout reached');
});

req.end();
