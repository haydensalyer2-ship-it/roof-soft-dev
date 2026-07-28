const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  'className="absolute inset-0 bg-[#e4e4e7] border border-[#d4d4d8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden block relative"',
  'className="absolute inset-0 bg-[#e4e4e7] border border-[#d4d4d8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden"'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
