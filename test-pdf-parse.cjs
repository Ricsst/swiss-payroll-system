const pdfModule = require('pdf-parse');
console.log('Type:', typeof pdfModule);
console.log('Default type:', typeof pdfModule.default);
console.log('Keys:', Object.keys(pdfModule));

// Check if there's a function we can use directly
if (typeof pdfModule.default === 'function') {
  console.log('\nDefault is a function - use this!');
} else {
  console.log('\nLooking for the actual parser function...');
  // Check each exported item
  for (const key of Object.keys(pdfModule)) {
    console.log(`  ${key}: ${typeof pdfModule[key]}`);
  }
}

// Test if there's a default export at the module level
const fs = require('fs');
const path = require('path');
console.log('\nModule itself callable?', typeof pdfModule === 'function');
