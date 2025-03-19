/**
 * Image optimization script
 * This script optimizes PNG images in the images directory to reduce their file size
 * while maintaining acceptable quality.
 * 
 * Enhanced version: 
 * - Adds ability to resize large images
 * - Adds WebP conversion option
 * - Adds more aggressive compression for large files
 * - Optimizes all image types (PNG, JPG, JPEG)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  imagesDir: path.join(__dirname, 'images'),
  outputDir: path.join(__dirname, 'images'), // Same directory by default
  maxWidth: 300, // Maximum width for food images
  maxHeight: 300, // Maximum height for food images
  resizeMethod: 'inside', // 'cover', 'contain', 'fill', 'inside' or 'outside'
  quality: 70, // Default quality for compression
  convertToWebP: false, // Set to true if WebP conversion is needed
  backupOriginals: true, // Whether to backup original images
  backupDir: path.join(__dirname, 'images_backup')
};

// Create backup directory if it doesn't exist and backups are enabled
if (config.backupOriginals) {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    console.log(`Created backup directory: ${config.backupDir}`);
  }
}

// Get all image files in the images directory
const imageFiles = fs.readdirSync(config.imagesDir)
  .filter(file => /\.(png|jpe?g)$/i.test(file));

console.log(`Found ${imageFiles.length} images to optimize`);

// Process each image
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

const backupImage = (file) => {
  if (!config.backupOriginals) return;
  
  const filePath = path.join(config.imagesDir, file);
  const backupPath = path.join(config.backupDir, file);
  
  // Only backup if not already backed up
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`  Backup created: ${backupPath}`);
  }
};

const processImage = async (file) => {
  const filePath = path.join(config.imagesDir, file);
  const outputPath = path.join(config.outputDir, file);
  const stats = fs.statSync(filePath);
  const originalSize = stats.size;
  totalOriginalSize += originalSize;
  
  console.log(`Processing: ${file} (${(originalSize / 1024).toFixed(2)} KB)`);
  
  // Backup original image
  backupImage(file);
  
  try {
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    
    // Determine if image needs resizing (ignore small icons)
    const needsResize = 
      (metadata.width > config.maxWidth || metadata.height > config.maxHeight) && 
      metadata.width > 50 && // Don't resize small icons
      metadata.height > 50;
    
    // Determine compression level based on file size
    let quality = config.quality;
    if (originalSize > 300000) { // > 300KB
      quality = 40; // More aggressive for very large files
    } else if (originalSize > 100000) { // > 100KB
      quality = 50; // Somewhat aggressive for large files
    }
    
    // Start processing pipeline
    let pipeline = sharp(filePath);
    
    // Resize if needed
    if (needsResize) {
      console.log(`  Resizing from ${metadata.width}x${metadata.height} to fit within ${config.maxWidth}x${config.maxHeight}`);
      pipeline = pipeline.resize({
        width: config.maxWidth,
        height: config.maxHeight,
        fit: config.resizeMethod,
        withoutEnlargement: true
      });
    }
    
    // Convert to WebP if configured
    if (config.convertToWebP) {
      const webpOutputPath = outputPath.replace(/\.(png|jpe?g)$/i, '.webp');
      await pipeline
        .webp({ quality })
        .toFile(webpOutputPath);
      
      const webpStats = fs.statSync(webpOutputPath);
      console.log(`  ✓ Converted to WebP: ${path.basename(webpOutputPath)} (${(webpStats.size / 1024).toFixed(2)} KB, saved ${((originalSize - webpStats.size) / 1024).toFixed(2)} KB)`);
      
      // Still create optimized original format if WebP reduced size significantly
      if (webpStats.size < originalSize * 0.7) {
        console.log(`  WebP format saved over 30%, continuing with original format optimization...`);
      } else {
        // If WebP didn't help much, skip further optimization
        totalOptimizedSize += webpStats.size;
        return;
      }
    }
    
    // Format specific optimizations
    if (file.toLowerCase().endsWith('.png')) {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }
    
    // Save optimized image
    const data = await pipeline.toBuffer();
    
    // Only save if the optimized version is smaller
    if (data.length < originalSize) {
      fs.writeFileSync(outputPath, data);
      console.log(`  ✓ Optimized: ${file} (${(data.length / 1024).toFixed(2)} KB, saved ${((originalSize - data.length) / 1024).toFixed(2)} KB)`);
      totalOptimizedSize += data.length;
    } else {
      console.log(`  ✓ Skipped: ${file} (optimization didn't reduce size)`);
      totalOptimizedSize += originalSize;
    }
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

// Run the optimization
optimizeAll().catch(err => console.error('Error during optimization:', err));