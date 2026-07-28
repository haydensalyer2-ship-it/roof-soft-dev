const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// 1. Remove the offscreen div at the end
content = content.replace(
  /    <\/div>\n    <div className="absolute top-0 left-0 w-\[816px\] overflow-visible" style=\{\{ zIndex: -100 \}\}>\n       \{renderDocument\(true\)\}\n    <\/div>\n    <\/>/,
  '    </div>'
);

// 2. Remove the fragment we added previously.
content = content.replace(
  '  return (\n    <>\n    <div className="min-h-full lg:h-full flex flex-col max-w-[1600px] mx-auto w-full relative z-10">',
  '  return (\n    <div className="min-h-full lg:h-full flex flex-col max-w-[1600px] mx-auto w-full relative z-10">'
);

// 3. Make the main scale container conditional on isGenerating
content = content.replace(
  '             <div className="transform origin-top transition-none scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100 pb-[100px]">',
  '             <div className={`transform origin-top transition-none ${isGenerating ? "scale-100 pb-0" : "scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100 pb-[100px]"}`}>'
);

// 4. Update renderDocument definition and ref
content = content.replace(
  /const renderDocument = \(isPrintVersion: boolean = false\) => \(\n    <div \n      className=\{`bg-\[#ffffff\] text-\[#18181b\] font-sans relative w-\[816px\] min-h-\[1056px\] mx-auto block \$\{isGenerating \? '' : 'shadow-\[0_25px_50px_rgba\(0,0,0,0\.25\)\]'\}`\}\n      ref=\{isPrintVersion \? printRef : null\}\n    >/,
  'const renderDocument = () => (\n    <div \n      className={`bg-[#ffffff] text-[#18181b] font-sans relative w-[816px] min-h-[1056px] mx-auto block ${isGenerating ? \'\' : \'shadow-[0_25px_50px_rgba(0,0,0,0.25)]\'}`}\n      ref={printRef}\n    >'
);

// We need to also rename renderDocument(false)
content = content.replace(
  '{renderDocument(false)}',
  '{renderDocument()}'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
