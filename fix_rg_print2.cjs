const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  '<div className="absolute top-[-9999px] left-[-9999px] w-[816px] overflow-visible">',
  '<div className="absolute top-0 left-0 w-[816px] overflow-visible" style={{ zIndex: -100 }}>'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
