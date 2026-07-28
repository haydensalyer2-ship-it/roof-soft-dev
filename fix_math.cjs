const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Fix width math for 2 columns to fit inside 720px available width (816 - 48*2).
// 2 * 348 + 24 (gap) = 720
content = content.replace(
  /w-\[360px\] h-\[280px\] break-inside-avoid inline-block mb-12 mr-\[24px\]/g,
  'w-[348px] h-[280px] break-inside-avoid inline-block mb-12 mr-[24px]'
);

// We need to also double check logo sizes
// And the background image for html2canvas compatibility
content = content.replace(
  /<div className="w-full h-full block bg-\[#ffffff\]"><img src=\{img\} crossOrigin="anonymous" alt="Photo" className="w-full h-full object-cover block" \/><\/div>/g,
  '<div className="w-full h-full block bg-[#ffffff] relative"><img src={img} crossOrigin="anonymous" alt="Photo" className="w-full h-full object-cover block absolute inset-0" /></div>'
);

content = content.replace(
  /<div className="absolute inset-0 bg-\[#e4e4e7\] border border-\[#d4d4d8\] shadow-\[0_4px_20px_rgba\(0,0,0,0\.08\)\] overflow-hidden\">\s*<img src=\{coverPhoto\} crossOrigin="anonymous" alt="Cover" className="w-full h-full object-cover block" \/>\s*<\/div>/,
  '<div className="absolute inset-0 bg-[#e4e4e7] border border-[#d4d4d8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">\n               <img src={coverPhoto} crossOrigin="anonymous" alt="Cover" className="w-full h-full object-cover block absolute inset-0" />\n            </div>'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
