const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Fix Cover Photo
content = content.replace(
  /<img src=\{coverPhoto\} alt="Cover" className="w-full h-full object-cover" \/>/,
  '<img src={coverPhoto} alt="Cover" className="w-full h-full object-contain" />'
);

// Fix Overview Photos
content = content.replace(
  /<img src=\{img\} alt="Photo" className="w-full h-full object-cover" \/>/g,
  '<img src={img} alt="Photo" className="w-full h-full object-contain" />'
);

// Fix Damage Photos
content = content.replace(
  /<img src=\{img\} alt="Damage" className="w-full h-full object-cover relative z-0" \/>/g,
  '<img src={img} alt="Damage" className="w-full h-full object-contain relative z-0" />'
);

// Fix Logo (make slightly bigger, ensure valid aspect ratio)
content = content.replace(
  /<img src=\{logoImage\} alt="Logo" className="mb-4 object-contain object-left" style=\{\{ height: "100px", maxWidth: "320px", width: "100%" \}\} \/>/,
  '<img src={logoImage} alt="Logo" className="mb-4 object-contain object-left" style={{ height: "130px", maxWidth: "350px", width: "100%" }} />'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
