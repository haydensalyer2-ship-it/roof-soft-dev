const fs = require('fs');
const path = require('path');

const findReplace = [
    { from: /#0f172a/g, to: '#0a0a0a' }, // base background
    { from: /#1e293b/g, to: '#171717' }, // elevated components
    { from: /#334155/g, to: '#262626' }, // borders
    { from: /#475569/g, to: '#404040' }, // hover/light borders
    { from: /#f8fafc/g, to: '#ffffff' }, // high contrast text
    { from: /#94a3b8/g, to: '#a3a3a3' }, // medium contrast text
    { from: /#64748b/g, to: '#737373' }, // low contrast text
    { from: /#38bdf8/g, to: '#ffffff' }, // sky blue -> crisp white
    { from: /#34d399/g, to: '#d4d4d4' }, // emerald green -> gray
    { from: /#a78bfa/g, to: '#d4d4d4' }, // violet -> gray
    { from: /#fbbf24/g, to: '#d4d4d4' }, // amber -> gray
    { from: /#0ea5e9/g, to: '#737373' }, // dark sky -> gray
    { from: /#2563eb/g, to: '#404040' }, // deep blue -> gray
    { from: /#8b5cf6/g, to: '#404040' }, // deep violet -> gray
    { from: /bg-sky-400/g, to: 'bg-neutral-300' },
    { from: /hover:bg-sky-400/g, to: 'hover:bg-neutral-300' },
    { from: /text-green-400/g, to: 'text-neutral-400' },
    { from: /text-blue-900/g, to: 'text-slate-900' },
    { from: /bg-blue-50/g, to: 'bg-slate-100' },
    { from: /border-blue-500/g, to: 'border-slate-800' },
    { from: /border-blue-400/g, to: 'border-slate-800' },
    { from: /text-blue-600/g, to: 'text-slate-900' },
    { from: /bg-\[#ffffff\](\/10|\/20|\/5)?/g, to: 'bg-white$1' },
    { from: /border-\[#ffffff\](\/20|\/30|\/40)?/g, to: 'border-white$1' },
    { from: /text-\[#ffffff\]/g, to: 'text-white' },
    { from: /text-\[#0a0a0a\]/g, to: 'text-black' }
];

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            processDir(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.css') || p.endsWith('.ts')) {
            let content = fs.readFileSync(p, 'utf8');
            let orig = content;
            
            findReplace.forEach(rule => {
                content = content.replace(rule.from, rule.to);
            });
            
            // Clean up overlapping rules making impossible tailwind classes
            content = content.replace(/text-white hover:text-white/g, 'text-neutral-400 hover:text-white');
            content = content.replace(/shadow-\[0_0_15px_rgba\(56,189,248,0\.2\)\]/g, 'shadow-[0_0_15px_rgba(255,255,255,0.15)]');
            
            if (content !== orig) {
                fs.writeFileSync(p, content);
                console.log(`Updated ${p}`);
            }
        }
    });
}

processDir(path.join(__dirname, 'src'));
