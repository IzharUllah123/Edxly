// Check for specific line 306 in library.ts
const fs = require('fs');
try {
  const content = fs.readFileSync('../packages/excalidraw/data/library.ts', 'utf8');
  const lines = content.split('\n');
  console.log('Total lines:', lines.length);
  console.log('Line 306:', lines[305]); // 0-indexed
  console.log('Lines around 306:');
  for (let i = 300; i < 310 && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} catch (error) {
  console.error('Error reading file:', error);
}
