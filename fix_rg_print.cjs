const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// 1. Rebind printRef to ONLY apply to the print version
content = content.replace(
  /ref=\{printRef\}/,
  'ref={isPrintVersion ? printRef : null}'
);

// 2. Change the return statement to wrap everything in a Fragment and append the print container
// First, find the return
const returnStart = content.indexOf('return (');
content = content.replace(
  '  return (\n    <div className="min-h-full lg:h-full flex flex-col max-w-[1600px] mx-auto w-full">',
  '  return (\n    <>\n    <div className="min-h-full lg:h-full flex flex-col max-w-[1600px] mx-auto w-full relative z-10">'
);

// Find the last closing tag
content = content.replace(
  '    </div>\n  );\n}',
  '    </div>\n    <div className="absolute top-[-9999px] left-[-9999px] w-[816px] overflow-visible">\n       {renderDocument(true)}\n    </div>\n    </>\n  );\n}'
);

// 3. Remove the scaling logic from the wrapper entirely, because we are using the off-screen one!
content = content.replace(
  /className=\{`transform origin-top transition-none \$\{isGenerating \? "scale-\[1.0\] overflow-visible max-h-\[none\]" : "scale-\[0.4\] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100"\} pb-\[100px\]`\}/,
  'className="transform origin-top transition-none scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100 pb-[100px]"'
);

// 4. Update html2canvas configuration for maximum compatibility
content = content.replace(
  /const canvas = await html2canvas\(element, \{[\s\S]*?\}\);/,
  `const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        windowWidth: 816,
        scrollX: 0,
        scrollY: 0,
     });`
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
