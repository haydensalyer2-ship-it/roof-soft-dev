const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  '<div id="print-version-container" className="absolute top-0 left-0 w-[816px] h-auto overflow-visible pointer-events-none shadow-none opacity-0" style={{ zIndex: -100 }}>',
  '<div id="print-version-container" className="absolute top-[-9999px] left-[-9999px] w-[816px] h-auto overflow-visible pointer-events-none shadow-none" style={{ zIndex: -9999, visibility: "visible" }}>'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
