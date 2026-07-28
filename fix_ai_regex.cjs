const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  /<button[\s\S]*?onClick=\{handleGenerateSummary\}[\s\S]*?<\/button>/,
  ''
);

content = content.replace(
  /const handleGenerateSummary = async \(\) => \{[\s\S]*?finally \{\s*setIsGeneratingSummary\(false\);\s*\}\s*\};/,
  ''
);

content = content.replace(
  /const \[isGeneratingSummary, setIsGeneratingSummary\] = useState\(false\);/,
  ''
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
