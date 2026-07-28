const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  'const height = element.offsetHeight || 1056;',
  'const height = Math.max(element.offsetHeight, element.scrollHeight) || 1056;'
);

content = content.replace(
  'const pdfHeight = height;',
  'const pdfHeight = (canvas.height * pdfWidth) / canvas.width;'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
