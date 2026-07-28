const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Use crossOrigin="anonymous" and standard tailwind classes
content = content.replace(
  /<img src=\{logoImage\} alt="Logo" className="mb-4" style=\{\{ maxHeight: "100px", maxWidth: "280px", width: "auto", height: "auto", display: "block" \}\} \/>/,
  '<img src={logoImage} crossOrigin="anonymous" alt="Logo" className="mb-4 object-contain object-left" style={{ height: "100px", maxWidth: "280px", width: "100%", display: "block" }} />'
);

content = content.replace(
  /<img src=\{coverPhoto\} alt="Cover" style=\{\{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block" \}\} \/>/,
  '<img src={coverPhoto} crossOrigin="anonymous" alt="Cover" className="w-full h-full object-cover block" />'
);

content = content.replace(
  /<img src=\{img\} alt="Photo" style=\{\{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block" \}\} \/>/g,
  '<img src={img} crossOrigin="anonymous" alt="Photo" className="w-full h-full object-cover block" />'
);

content = content.replace(
  /<img src=\{img\} alt="Damage" style=\{\{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block" \}\} \/>/g,
  '<img src={img} crossOrigin="anonymous" alt="Damage" className="w-full h-full object-cover block" />'
);

// We should also replace the container flex centering with blocks to prevent flex-box nesting bugs in html2canvas
content = content.replace(
  /<div className="absolute inset-0 bg-\[#e4e4e7\] border border-\[#d4d4d8\] shadow-\[0_4px_20px_rgba\(0,0,0,0.08\)\] overflow-hidden flex items-center justify-center">/g,
  '<div className="absolute inset-0 bg-[#e4e4e7] border border-[#d4d4d8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden block">'
);

content = content.replace(
  /<div className="w-full h-full flex items-center justify-center bg-\[#ffffff\]">/g,
  '<div className="w-full h-full block bg-[#ffffff]">'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
