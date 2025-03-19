/**
 * Image optimization script
 * This script optimizes PNG images in the images directory to reduce their file size
 * while maintaining acceptable quality.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Directory containing images
const imagesDir = path.join(__dirname, 'images');

// Get all PNG files in the images directory
const imageFiles = fs.readdirSync(imagesDir)
  .filter(file => file.toLowerCase().endsWith('.png'));

console.log(`Found ${imageFiles.length} PNG images to optimize`);

// Process each image
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

const processImage = async (file) => {
  const filePath = path.join(imagesDir, file);
  const stats = fs.statSync(filePath);
  const originalSize = stats.size;
  totalOriginalSize += originalSize;
  
  console.log(`Processing: ${file} (${(originalSize / 1024).toFixed(2)} KB)`);
  
  try {
    // Determine compression level based on file size
    // Larger files get more aggressive compression
    let quality = 70; // Default quality
    if (originalSize > 300000) { // > 300KB
      quality = 50; // More aggressive for very large files
    } else if (originalSize > 100000) { // > 100KB
      quality = 60; // Somewhat aggressive for large files
    }
    
    // Optimize the image
    await sharp(filePath)
      .png({ quality, compressionLevel: 9 })
      .toBuffer()
      .then(data => {
        // Only save if the optimized version is smaller
        if (data.length < originalSize) {
          fs.writeFileSync(filePath, data);
          console.log(`  ✓ Optimized: ${file} (${(data.length / 1024).toFixed(2)} KB, saved ${((originalSize - data.length) / 1024).toFixed(2)} KB)`);
          totalOptimizedSize += data.length;
        } else {
          console.log(`  ✓ Skipped: ${file} (optimization didn't reduce size)`);
          totalOptimizedSize += originalSize;
        }
      });
  } catch (error) {
    console.error(`  ✗ Error optimizing ${file}:`, error.message);
    totalOptimizedSize += originalSize; // Count original size for failed optimizations
  }
};

// Process all images sequentially
const optimizeAll = async () => {
  for (const file of imageFiles) {
    await processImage(file);
  }
  
  // Print summary
  console.log('\nOptimization complete!');
  console.log(`Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)} MB (${(100 * (totalOriginalSize - totalOptimizedSize) / totalOriginalSize).toFixed(2)}%)`);
};

optimizeAll().catch(err => console.error('Error during optimization:', err));