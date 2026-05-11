const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const inputFile = path.join(__dirname, '../public/images/favicon_enhanced.png');
const outputDir = path.join(__dirname, '../public/images');

const sizes = [16, 32, 96, 192, 512];

async function generateFavicons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate different sizes
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `favicon-${size}x${size}.png`);
      await sharp(inputFile)
        .resize(size, size)
        .toFile(outputFile);
      console.log(`Generated: ${outputFile}`);
    }

    // Generate apple touch icon (180x180)
    await sharp(inputFile)
      .resize(180, 180)
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Generated: apple-touch-icon.png');

    // Generate favicon.ico with multiple sizes
    await sharp(inputFile)
      .resize(64, 64)
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('Generated: favicon.ico');

    console.log('\n✅ All favicons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
