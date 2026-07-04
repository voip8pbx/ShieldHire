const fs = require('fs');
const path = require('path');

const targets = [
  'frontend/android/.gradle',
  'frontend/android/build',
  'frontend/android/app/build',
  'frontend/node_modules',
  'node_modules'
];

targets.forEach(target => {
  const fullPath = path.resolve(__dirname, target);
  if (fs.existsSync(fullPath)) {
    console.log(`Deleting ${fullPath}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});
