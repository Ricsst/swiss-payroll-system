const pdf = require('pdf-parse');
console.log('Type:', typeof pdf);
console.log('Default type:', typeof pdf.default);
console.log('Keys:', Object.keys(pdf).slice(0, 10));
if (pdf.default) {
  console.log('Default is function:', typeof pdf.default === 'function');
  console.log('Default keys:', Object.keys(pdf.default).slice(0, 10));
}
console.log('pdf is function:', typeof pdf === 'function');
