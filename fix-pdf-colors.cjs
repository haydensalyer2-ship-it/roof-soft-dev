const fs = require('fs');
let file = 'src/views/ReportGenerator.tsx';
let content = fs.readFileSync(file, 'utf8');

// The renderDocument function starts around 170 and goes until the end of the return statement
content = content.replace(/bg-white/g, 'bg-[#ffffff]');
content = content.replace(/text-white/g, 'text-[#ffffff]');
content = content.replace(/border-white/g, 'border-[#ffffff]');
content = content.replace(/text-black/g, 'text-[#000000]');
content = content.replace(/border-black/g, 'border-[#000000]');
content = content.replace(/bg-zinc-100/g, 'bg-[#f4f4f5]');

// Also ensure html2pdf options have a white background so transparencies don't turn black
content = content.replace(
  /html2canvas:\s*\{([^}]+)\}/,
  'html2canvas: { $1, backgroundColor: "#ffffff" }'
);

fs.writeFileSync(file, content);
console.log("Replaced tailwind named colors with HEX");
