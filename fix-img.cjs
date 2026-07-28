const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  '<div className="w-full h-full" style={{ backgroundImage: `url(${coverPhoto})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />',
  '<div className="w-full h-full relative overflow-hidden flex items-center justify-center"><img src={coverPhoto} className="min-w-full min-h-full max-w-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" alt="Cover" /></div>'
);

content = content.replace(
  '<div className="w-full h-full" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />',
  '<div className="w-full h-full relative overflow-hidden flex items-center justify-center"><img src={img} className="min-w-full min-h-full max-w-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" alt="Photo" /></div>'
);

content = content.replace(
  '<div className="w-full h-full relative z-0" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />',
  '<div className="w-full h-full relative z-0 overflow-hidden flex items-center justify-center"><img src={img} className="min-w-full min-h-full max-w-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" alt="Damage" /></div>'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
