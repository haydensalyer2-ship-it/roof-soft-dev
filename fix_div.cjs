const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  '              <button \n          onClick={() => onNavigate(project ? \'project_detail\' : \'projects\', project?.id)}',
  '      <div className="mb-6 shrink-0">\n        <button \n          onClick={() => onNavigate(project ? \'project_detail\' : \'projects\', project?.id)}'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
