const fs = require('fs');
const { createCanvas } = require('canvas');

function createLogo(filename, bgColor, textColor, letter, name) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 200, 200);
  
  // Draw letter
  ctx.fillStyle = textColor;
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 100, 80);
  
  // Draw name
  ctx.font = 'bold 20px Arial';
  ctx.fillText(name, 100, 140);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Create logos
createLogo('uber.png', '#000000', '#FFFFFF', 'U', 'UBER');
createLogo('rapido.png', '#FFC107', '#000000', 'R', 'RAPIDO');
createLogo('namma_yatri.png', '#7C3AED', '#FFFFFF', 'NY', 'NAMMA YATRI');

console.log('All logos created successfully!');
