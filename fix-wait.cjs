const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  'await new Promise(resolve => setTimeout(resolve, 100));',
  `// Scroll to top to ensure capturing works flawlessly
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));`
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
