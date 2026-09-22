const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '..', 'SOS Guard.png');
const ANDROID_RES_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const IOS_APP_ICON_DIR = path.join(__dirname, 'ios', 'ShieldHire', 'Images.xcassets', 'AppIcon.appiconset');

const BACKGROUND_COLOR = '#FFFFFF';

// Helper to ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Android icon sizes
const androidSizes = {
  mdpi: { legacy: 48, adaptive: 108 },
  hdpi: { legacy: 72, adaptive: 162 },
  xhdpi: { legacy: 96, adaptive: 216 },
  xxhdpi: { legacy: 144, adaptive: 324 },
  xxxhdpi: { legacy: 192, adaptive: 432 }
};

// iOS icon sizes (width = height)
const iosIcons = [
  { size: 20, scale: 1 }, { size: 20, scale: 2 }, { size: 20, scale: 3 },
  { size: 29, scale: 1 }, { size: 29, scale: 2 }, { size: 29, scale: 3 },
  { size: 40, scale: 1 }, { size: 40, scale: 2 }, { size: 40, scale: 3 },
  { size: 60, scale: 2 }, { size: 60, scale: 3 },
  { size: 76, scale: 1 }, { size: 76, scale: 2 },
  { size: 83.5, scale: 2 },
  { size: 1024, scale: 1 }
];

async function generateAndroidIcons() {
  for (const [density, sizes] of Object.entries(androidSizes)) {
    const dir = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
    ensureDir(dir);

    // Legacy and Round (with background)
    await sharp(SOURCE_IMAGE)
      .resize(sizes.legacy, sizes.legacy, { fit: 'contain', background: BACKGROUND_COLOR })
      .flatten({ background: BACKGROUND_COLOR })
      .toFile(path.join(dir, 'ic_launcher.png'));

    await sharp(SOURCE_IMAGE)
      .resize(sizes.legacy, sizes.legacy, { fit: 'contain', background: BACKGROUND_COLOR })
      .flatten({ background: BACKGROUND_COLOR })
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // Adaptive Foreground (scaled down so it fits in the safe zone)
    // The safe zone is 66/108 = 61% of the total size, so we scale the logo to ~60% of the adaptive size
    const foregroundImageSize = Math.round(sizes.adaptive * 0.65);
    const foreground = await sharp(SOURCE_IMAGE)
      .resize(foregroundImageSize, foregroundImageSize, { fit: 'contain', background: {r:0,g:0,b:0,alpha:0} })
      .toBuffer();

    await sharp({
      create: {
        width: sizes.adaptive,
        height: sizes.adaptive,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: foreground, gravity: 'center' }])
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
}

async function generateIosIcons() {
  ensureDir(IOS_APP_ICON_DIR);
  
  const contentsJson = {
    images: [],
    info: { author: "xcode", version: 1 }
  };

  for (const icon of iosIcons) {
    const filename = `icon-${icon.size}x${icon.size}@${icon.scale}x.png`;
    const actualSize = Math.round(icon.size * icon.scale);

    await sharp(SOURCE_IMAGE)
      .resize(actualSize, actualSize, { fit: 'contain', background: BACKGROUND_COLOR })
      .flatten({ background: BACKGROUND_COLOR })
      .toFile(path.join(IOS_APP_ICON_DIR, filename));

    contentsJson.images.push({
      size: `${icon.size}x${icon.size}`,
      idiom: icon.size === 1024 ? "ios-marketing" : (icon.size === 83.5 || icon.size === 76) ? "ipad" : "universal",
      filename: filename,
      scale: `${icon.scale}x`
    });
  }

  // Also push some specific iPhone / iPad idioms if needed for a complete file
  // For simplicity, we just created universal ones which work for RN.
  // We'll write the Contents.json
  fs.writeFileSync(path.join(IOS_APP_ICON_DIR, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
}

async function main() {
  try {
    console.log('Generating Android Icons...');
    await generateAndroidIcons();
    console.log('Generating iOS Icons...');
    await generateIosIcons();
    console.log('Icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

main();
