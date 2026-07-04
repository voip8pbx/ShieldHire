const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.resolve(__dirname, 'SOS!.png');
const androidResPath = path.resolve(__dirname, 'frontend/android/app/src/main/res');

const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

async function generateAssets() {
  try {
    for (const [density, size] of Object.entries(sizes)) {
      const folderPath = path.join(androidResPath, `mipmap-${density}`);
      
      if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
      }

      await sharp(svgPath)
        .resize(size, size, { fit: 'contain', background: '#1E1E1E' })
        .toFile(path.join(folderPath, 'ic_launcher.png'));
        
      await sharp(svgPath)
        .resize(size, size, { fit: 'contain', background: '#1E1E1E' })
        .toFile(path.join(folderPath, 'ic_launcher_round.png'));

      console.log(`Generated ic_launcher.png and ic_launcher_round.png for ${density}`);
    }

    // Generate splash screen logo (e.g. 288x288)
    const drawablePath = path.join(androidResPath, 'drawable');
    if (!fs.existsSync(drawablePath)) {
        fs.mkdirSync(drawablePath, { recursive: true });
    }
    
    await sharp(svgPath)
      .resize(288, 288, { fit: 'contain', background: '#1E1E1E' })
      .toFile(path.join(drawablePath, 'splash_logo.png'));
      
    console.log('Generated splash_logo.png');

  } catch (err) {
    console.error('Error generating assets:', err);
  }
}

generateAssets();
