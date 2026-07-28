const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  '<div className="absolute top-0 left-0 w-[816px] h-auto overflow-visible pointer-events-none" style={{ zIndex: -100, opacity: 0 }}>',
  '<div className="fixed top-0 left-0 w-[816px] h-auto overflow-visible pointer-events-none shadow-none" style={{ zIndex: -100 }}>'
);
content = content.replace(
  '<div className="fixed top-0 left-[-9999px] pointer-events-none w-[816px] h-auto overflow-visible z-[-1]">',
  '<div className="fixed top-0 left-0 w-[816px] h-auto overflow-visible pointer-events-none shadow-none" style={{ zIndex: -100 }}>'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
