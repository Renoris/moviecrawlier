const fs = require('fs');

const file = fs.readFileSync('/Users/applet/desktop/hangulFinish.txt', 'utf8');

console.log(file.length)