const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  'allowTaint: true,',
  'allowTaint: false,'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
