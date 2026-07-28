const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  'isGenerating ? "scale-[1.0] overflow-visible max-h-[none]" : "scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100"',
  '"scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100"'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
