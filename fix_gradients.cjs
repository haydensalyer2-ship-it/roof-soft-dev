const fs = require('fs');
const path = require('path');

const rules = [
    { from: /#818cf8/g, to: '#a3a3a3' },
    { from: /#10b981/g, to: '#a3a3a3' },
    { from: /from-blue-50/g, to: 'from-slate-100' }
];

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            processDir(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.css')) {
            let content = fs.readFileSync(p, 'utf8');
            let orig = content;
            
            rules.forEach(r => content = content.replace(r.from, r.to));
            
            if (content !== orig) {
                fs.writeFileSync(p, content);
            }
        }
    });
}

processDir(path.join(__dirname, 'src'));
