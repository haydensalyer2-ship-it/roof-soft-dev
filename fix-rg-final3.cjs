const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Reverse the DIV backgroundImages back to IMG tags for maximum compatibility in modern html2canvas
content = content.replace(
  /<div className="mb-4" style=\{\{ backgroundImage: `url\(\$\{logoImage\}\)`, backgroundSize: "contain", backgroundPosition: "left", backgroundRepeat: "no-repeat", height: "90px", maxWidth: "280px", width: "100%" \}\} \/>/g,
  '<img src={logoImage} crossOrigin="anonymous" alt="Logo" className="mb-4 object-contain object-left" style={{ height: "90px", maxWidth: "280px", width: "100%", display: "block" }} />'
);

content = content.replace(
  /<div style=\{\{ backgroundImage: `url\(\$\{coverPhoto\}\)`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", width: "100%", height: "100%" \}\} \/>/g,
  '<img src={coverPhoto} crossOrigin="anonymous" alt="Cover" className="w-full h-full object-cover block" />'
);

content = content.replace(
  /<div className="w-full h-full block bg-\[#ffffff\]" style=\{\{ backgroundImage: `url\(\$\{img\}\)`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" \}\}><\/div>/g,
  '<div className="w-full h-full block bg-[#ffffff]"><img src={img} crossOrigin="anonymous" alt="Photo" className="w-full h-full object-cover block" /></div>'
);

content = content.replace(
  /<div className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" style=\{\{ backgroundImage: `url\(\$\{img\}\)`, backgroundSize: "cover", backgroundPosition: "center" \}\} \/>/g,
  '<img src={img} crossOrigin="anonymous" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Overview" />'
);

content = content.replace(
  /<div className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" style=\{\{ backgroundImage: `url\(\$\{coverPhoto\}\)`, backgroundSize: "cover", backgroundPosition: "center" \}\} \/>/g,
  '<img src={coverPhoto} crossOrigin="anonymous" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Cover" />'
);

// Remove the `renderDocument(true)` entirely
content = content.replace(
  /<div id="print-version-container" className="absolute top-0 left-0 w-\[816px\] h-auto overflow-visible pointer-events-none shadow-none" style=\{\{ zIndex: -9999, opacity: 0\.01 \}\}>\s*\{renderDocument\(true\)\}\s*<\/div>/,
  ''
);

// Apply ref directly to renderDocument regardless of isPrintVersion
content = content.replace(
  /ref=\{isPrintVersion \? printRef : null\}/,
  'ref={printRef}'
);

// Remove the shadow if isGenerating
content = content.replace(
  /className=\{`bg-\[#ffffff\] text-\[#18181b\] font-sans relative w-\[816px\] min-h-\[1056px\] mx-auto block \$\{isPrintVersion \? '' : 'shadow-\[0_25px_50px_rgba\(0,0,0,0\.25\)\]'\}`\}/,
  'className={`bg-[#ffffff] text-[#18181b] font-sans relative w-[816px] min-h-[1056px] mx-auto block ${isGenerating ? \'\' : \'shadow-[0_25px_50px_rgba(0,0,0,0.25)]\'}`}'
);

// Put scale logic back
content = content.replace(
  /className=\{`transform origin-top transition-none \$\{"scale-\[0\.4\] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100"\} pb-\[100px\]`\}/,
  'className={`transform origin-top transition-none ${isGenerating ? "scale-[1.0] overflow-visible max-h-[none]" : "scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100"} pb-[100px]`}'
);

content = content.replace(
  /onclone: \(clonedDoc\) => \{[\s\S]*?\}\n        \}/,
  'onclone: (clonedDoc) => {}'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
