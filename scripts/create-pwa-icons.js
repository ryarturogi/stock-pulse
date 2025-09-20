#!/usr/bin/env node

/**
 * Create PWA Icons Script
 * =======================
 * 
 * Creates placeholder PWA icons for the StockPulse application.
 * In a real application, these would be designed by a graphic designer.
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required by the manifest
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG icon template
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" text-anchor="middle" dy="0.35em" fill="white">📈</text>
</svg>`;

// Create each icon
iconSizes.forEach(size => {
  const svgContent = createIconSVG(size);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  // For now, we'll create SVG files instead of PNG
  // In production, you'd convert these to PNG using a tool like sharp
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created icon: icon-${size}x${size}.svg`);
});

// Create additional icons for shortcuts
const createShortcutIcon = (name, size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#047857;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad-${name})"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" text-anchor="middle" dy="0.35em" fill="white">${name === 'portfolio' ? '💼' : '👁️'}</text>
</svg>`;

// Create shortcut icons
['portfolio', 'watchlist'].forEach(name => {
  const svgContent = createShortcutIcon(name, 96);
  const svgPath = path.join(iconsDir, `${name}-96x96.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created shortcut icon: ${name}-96x96.svg`);
});

// Create action icons for notifications
const createActionIcon = (name, size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="white" stroke="#E5E7EB" stroke-width="2"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" text-anchor="middle" dy="0.35em" fill="#374151">${name === 'view' ? '👁️' : '✕'}</text>
</svg>`;

['action-view', 'action-close'].forEach(name => {
  const svgContent = createActionIcon(name, 24);
  const svgPath = path.join(iconsDir, `${name}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created action icon: ${name}.svg`);
});

console.log('\n✅ PWA icons created successfully!');
console.log('📝 Note: These are SVG placeholders. In production, convert to PNG format.');
console.log('🔧 You can use tools like sharp or imagemagick to convert SVG to PNG.');

