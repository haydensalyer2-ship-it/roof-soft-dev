const fs = require('fs');
let file = 'src/views/ReportGenerator.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert PageSeparator component definition
const pageSepCode = `
const PageSeparator = ({ label }: { label: string }) => (
  <div data-html2canvas-ignore="true" className="w-[850px] h-12 bg-[#27272a] flex items-center justify-center border-y border-black/20 my-0 shadow-inner">
     <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#a1a1aa] bg-[#18181b] px-4 py-1.5 rounded-full border border-[#3f3f46]">
        {label}
     </span>
  </div>
);
`;

content = content.replace('const renderDocument = () => (', pageSepCode + '\n  const renderDocument = () => (');

const replace1 = `
      </div> {/* End of Page 1 Content */}
      <PageSeparator label="Page Break: Diagnostics & Action Plan" />
      <div className="html2pdf__page-break"></div>
      
      <div className="px-12 py-12 relative overflow-hidden">
        <div className="space-y-12 md:space-y-16">
`;
content = content.replace(/<div className="space-y-12 md:space-y-16">/, replace1);

const replace2 = `
        </div> {/* End of space-y-12 */}
      </div> {/* End of Page 2 Content */}
      
      {(overviewPhotos.length > 0 || damagePhotos.length > 0) && (
        <>
          <PageSeparator label="Page Break: Photographic Evidence" />
          <div className="html2pdf__page-break"></div>
          
          <div className="px-12 py-12 relative overflow-hidden">
            {/* Photo Evidence */}
`;

content = content.replace(/\{\/\* Photo Evidence \*\/\}\s*\{\(overviewPhotos\.length > 0 \|\| damagePhotos\.length > 0\) && \(/, replace2);

// Close tags properly
const replace3 = `
            </section>
          </div>
        </>
      )}
    </div>
  );
`;
content = content.replace(/<\/section>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/, replace3 + '  }\n');
fs.writeFileSync(file, content);
