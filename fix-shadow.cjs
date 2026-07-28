const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  'className="bg-[#ffffff] text-[#18181b] font-sans relative w-[816px] min-h-[1056px] shadow-[0_25px_50px_rgba(0,0,0,0.25)] mx-auto block"',
  'className={`bg-[#ffffff] text-[#18181b] font-sans relative w-[816px] min-h-[1056px] mx-auto block ${isPrintVersion ? \'\' : \'shadow-[0_25px_50px_rgba(0,0,0,0.25)]\'}`}'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
