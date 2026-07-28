const fs = require('fs');
let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

content = content.replace(
  '{renderDocument(true)}',
  '{renderDocument(false)}'
);

content = content.replace(
  '    </div>\n  );\n}\n',
  '      <div className="absolute top-0 left-[-9999px] pointer-events-none w-[816px] h-0 overflow-visible">\n        {renderDocument(true)}\n      </div>\n    </div>\n  );\n}\n'
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
