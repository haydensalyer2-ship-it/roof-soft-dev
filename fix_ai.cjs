const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Replace the AI writing button header
const aiHeaderOld = `<div className="flex justify-between items-end mb-2">
                     <label className="block text-[11px] uppercase tracking-wider font-bold text-[#e4e4e7]">Homeowner Action Plan</label>
                     <button
                       onClick={handleGenerateSummary}
                       disabled={isGeneratingSummary || (overviewPhotos.length === 0 && damagePhotos.length === 0 && !reportInfo)}
                       className="text-[10px] uppercase tracking-wide font-bold bg-[#ffffff] text-[#000000] hover:bg-[#d4d4d4] px-4 py-2 rounded-full transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(255,255,255,0.1)]"
                     >
                       {isGeneratingSummary ? (
                         <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Drafting...</>
                       ) : (
                         <><Sparkles className="h-3 w-3 mr-1.5" /> Auto-write</>
                       )}
                     </button>
                   </div>`;

const aiHeaderNew = `<label className="block text-[11px] uppercase tracking-wider font-bold text-[#e4e4e7] mb-2">Homeowner Action Plan</label>`;

content = content.replace(aiHeaderOld, aiHeaderNew);

// Remove the `handleGenerateSummary` function handling.
content = content.replace(/const handleGenerateSummary = async \(\) => \{[\s\S]*?finally \{\s*setIsGeneratingSummary\(false\);\s*\}\s*\};/g, "");

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
