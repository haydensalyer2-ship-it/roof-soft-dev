const fs = require('fs');

const file = 'src/views/ReportGenerator.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'zinc-900': '#18181b',
  'zinc-800': '#27272a',
  'zinc-700': '#3f3f46',
  'zinc-600': '#52525b',
  'zinc-500': '#71717a',
  'zinc-400': '#a1a1aa',
  'zinc-300': '#d4d4d8',
  'zinc-200/80': 'rgba(228, 228, 231, 0.8)',
  'zinc-200/60': 'rgba(228, 228, 231, 0.6)',
  'zinc-200': '#e4e4e7',
  'zinc-100/50': 'rgba(244, 244, 245, 0.5)',
  'zinc-100': '#f4f4f5',
  'zinc-50': '#fafafa',
  'emerald-600': '#059669',
  'emerald-50': '#ecfdf5',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-800': '#991b1b',
  'red-900/80': 'rgba(127, 29, 29, 0.8)',
  'red-900': '#7f1d1d',
  'emerald-500/30': 'rgba(16, 185, 129, 0.3)',
  'emerald-500': '#10b981',
  'emerald-400': '#34d399',
  'indigo-500/40': 'rgba(99, 102, 241, 0.4)',
  'indigo-500/30': 'rgba(99, 102, 241, 0.3)',
  'indigo-500/20': 'rgba(99, 102, 241, 0.2)',
  'indigo-300': '#a5b4fc',
  'red-500/90': 'rgba(239, 68, 68, 0.9)',
  'red-500/50': 'rgba(239, 68, 68, 0.5)',
  'red-500/30': 'rgba(239, 68, 68, 0.3)',
  'red-500/10': 'rgba(239, 68, 68, 0.1)',
  'red-400': '#f87171',
  'neutral-300': '#d4d4d4',
  'blue-400': '#60a5fa',
  'yellow-400': '#facc15'
};

const regexOptions = ['text', 'bg', 'border'];

for (const opt of regexOptions) {
  for (const [key, val] of Object.entries(replacements)) {
      // Need to replace the class names
      // e.g. text-zinc-900 -> text-[#18181b]
      const targetClass = `${opt}-${key}`;
      let replacementClass = `${opt}-[${val}]`;
      // remove spaces in rgba otherwise tailwind parser doesn't like it
      replacementClass = replacementClass.replace(/ /g, '');
      
      const parts = content.split(targetClass);
      content = parts.join(replacementClass);
  }
}

content = content.replace(/border-l-\[3px\] border-\[#e4e4e7\]/g, 'border-l-[3px] border-[#e4e4e7]');

fs.writeFileSync(file, content);
console.log("Replaced colors.");
