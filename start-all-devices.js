const { execSync } = require('child_process');

function getDevices() {
    const output = execSync('adb devices').toString();
    const lines = output.split('\n');
    const devices = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && line.includes('\tdevice')) {
            devices.push(line.split('\t')[0]);
        }
    }
    return devices;
}

function runOnDevice(deviceId) {
    console.log(`\n>>> Starting build and install on device: ${deviceId}`);
    try {
        // Reverse ports for each device
        execSync(`adb -s ${deviceId} reverse tcp:8081 tcp:8081`);
        execSync(`adb -s ${deviceId} reverse tcp:5000 tcp:5000`);

        // Run the app on the specific device
        // We use the --deviceId flag which is supported by the RN CLI
        execSync(`npx react-native run-android --deviceId ${deviceId}`, {
            cwd: './frontend',
            stdio: 'inherit'
        });
    } catch (error) {
        console.error(`Failed to start on device ${deviceId}:`, error.message);
    }
}

const devices = getDevices();
if (devices.length === 0) {
    console.log('No devices found!');
    process.exit(1);
}

console.log(`Found ${devices.length} devices: ${devices.join(', ')}`);

// Run sequentially to avoid gradle lock issues
for (const deviceId of devices) {
    runOnDevice(deviceId);
}
