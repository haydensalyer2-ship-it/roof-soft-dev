const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// The main flex layout wrapper that has h-full / overflow
content = content.replace(
  '    <div className="min-h-full lg:h-full flex flex-col max-w-[1600px] mx-auto w-full relative z-10">',
  '    <div className={`min-h-full flex flex-col max-w-[1600px] mx-auto w-full relative z-10 ${isGenerating ? "h-auto" : "lg:h-full"}`}>'
);

// The grid layout that also restricts height
content = content.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">',
  '<div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 ${isGenerating ? "" : "min-h-0"}`}>'
);

// The preview pane wrapper
content = content.replace(
  '          <div className="p-4 md:p-8 flex-1 overflow-auto bg-[#52525b] flex justify-center relative">',
  '          <div className={`p-4 md:p-8 flex-1 bg-[#52525b] flex justify-center relative ${isGenerating ? "overflow-visible" : "overflow-auto"}`}>'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
