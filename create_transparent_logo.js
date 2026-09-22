const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG base64
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const buffer = Buffer.from(transparentPngBase64, 'base64');

const resDir = path.join(__dirname, 'frontend', 'android', 'app', 'src', 'main', 'res');

const folders = ['drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'];

folders.forEach(folder => {
    const targetFile = path.join(resDir, folder, 'bootsplash_logo.png');
    if (fs.existsSync(targetFile)) {
        fs.writeFileSync(targetFile, buffer);
        console.log(`Overwrote ${targetFile} with transparent pixel.`);
    }
});
