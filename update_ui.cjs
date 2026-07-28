const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Replace UI styles for builder steps to look more clear and transparent
content = content.replace(/bg-\[#171717\] rounded-2xl border transition-colors overflow-hidden \$\{/g, 'bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md ${');
content = content.replace(/bg-\[#171717\]/g, 'bg-[#000000]/40');
content = content.replace(/bg-\[#0a0a0a\]\/50/g, 'bg-[#18181b]/50 backdrop-blur-md');
content = content.replace(/text-xs font-bold text-\[#ffffff\]/g, 'text-[11px] uppercase tracking-wider font-bold text-[#e4e4e7]');
content = content.replace(/text-\[11px\] text-\[#a3a3a3\] mb-3/g, 'text-[13px] text-[#a1a1aa] mb-4 leading-relaxed');

// Buttons / Textareas updates
content = content.replace(/const textareaClass = ".*?";/g, ''); // just in case
content = content.replace(/className="w-full bg-\[#0a0a0a\] border border-\[#262626\]/g, 'className="w-full bg-[#18181b] border border-[#262626]');

// The right column is the web preview
// Let's improve the button for generate
content = content.replace(/text-\[10px\] uppercase tracking-wider font-bold bg-\[rgba\(99,102,241,0\.2\)\] text-\[#a5b4fc\] hover:bg-\[rgba\(99,102,241,0\.4\)\] border border-\[rgba\(99,102,241,0\.3\)\] px-3 py-1\.5 rounded transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed/g, 
'text-[10px] uppercase tracking-wide font-bold bg-[#ffffff] text-[#000000] hover:bg-[#d4d4d4] px-4 py-2 rounded-full transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(255,255,255,0.1)]');

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
