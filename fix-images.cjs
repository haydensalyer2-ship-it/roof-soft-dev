const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Replace cover photo img
content = content.replace(
  '<img src={coverPhoto} className="w-full h-full object-cover" alt="Cover" />',
  '<div className="w-full h-full" style={{ backgroundImage: `url(${coverPhoto})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />'
);

// Replace overview photos img
content = content.replace(
  '<img src={img} className="w-full h-full object-cover" alt="Photo" />',
  '<div className="w-full h-full" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />'
);

// Replace damage photos img
content = content.replace(
  '<img src={img} className="w-full h-full object-cover relative z-0" alt="Damage" />',
  '<div className="w-full h-full relative z-0" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
