const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

const replacementBlock = `        <button 
          onClick={() => onNavigate(project ? 'project_detail' : 'projects', project?.id)}
          className="flex items-center text-xs font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] hover:text-[#ffffff] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {project ? \`Back to \${project.customer.lastName} Project\` : 'Back to Projects'}
        </button>
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif tracking-tight text-[#ffffff] flex items-center">
              <FileText className="mr-3 h-6 w-6 text-[#10b981]" />
              Inspection Report Builder
            </h1>
            <p className="text-[13px] text-[#a3a3a3] mt-1">Configure and export a PDF damage report for the property owner.</p>
          </div>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating || !selectedProjectId}
            className="bg-[#ffffff] text-[#000000] hover:bg-[#e4e4e7] px-6 py-2 rounded-full font-semibold transition-colors flex items-center shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 text-sm"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isGenerating ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className={\`grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 \${isGenerating ? "" : "min-h-0"}\`}>
        {/* Left Col: Setup Zone */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:h-full overflow-visible lg:overflow-y-auto pr-0 lg:pr-2 pb-10 scrollbar-hide">
          
          {!project && (
            <div className="bg-[#000000]/40 border border-[#262626] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
               <label className="block text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-bold mb-2">
                 Target Lead / Project <span className="text-[#f87171]">*</span>
               </label>
               <div className="relative">
                 <select
                   className="w-full bg-[#18181b] border border-[#262626] rounded-xl p-3 text-[#ffffff] text-sm appearance-none focus:outline-none focus:border-[#ffffff]"
                   value={selectedProjectId || ''}
                   onChange={(e) => setSelectedProjectId(e.target.value)}
                 >
                   <option value="">-- Select a Project --</option>
                   {projects.map(p => (
                     <option key={p.id} value={p.id}>{p.customer.firstName} {p.customer.lastName} - {p.customer.address}</option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-[#737373] pointer-events-none" />
               </div>
            </div>
          )}

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-4 flex items-start text-[#ef4444]">
              <AlertTriangle className="h-5 w-5 mr-3 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* HERO PHOTO */}
            <div className={\`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md \${coverPhoto ? 'border-[#10b981]/30' : 'border-[#262626]'}\`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={\`h-6 w-6 rounded-full flex items-center justify-center mr-3 \${coverPhoto ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}\`}><CheckCircle2 className="h-4 w-4" /></div>
                   <h2 className="text-sm font-semibold text-[#f4f4f5]">Cover Photo</h2>
                 </div>
               </div>
               <div className="p-5">
                 <div className="text-[13px] text-[#a1a1aa] mb-4 leading-relaxed">Upload a clean, wide shot of the front of the property. This acts as the hero image for the report.</div>
                 {coverPhoto ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#262626] group bg-[#0a0a0a]">
                      <img src={coverPhoto} crossOrigin="anonymous" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Cover" />
                      <button onClick={() => removeImage('cover')} className="absolute top-2 right-2 bg-[#ef4444]/90 hover:bg-[#ef4444] text-[#ffffff] p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-[0_10px_15px_rgba(0,0,0,0.1)]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                 ) : (
                    <div onClick={() => coverInputRef.current?.click()} className="border-2 border-dashed border-[#404040] hover:border-[#ffffff]/50 bg-[#18181b]/50 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center aspect-video">
                      <Home className="h-6 w-6 text-[#737373] mb-2" />
                      <span className="text-[11px] uppercase tracking-wider font-bold text-[#e4e4e7]">Add Front Property Photo</span>
                      <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} />
                    </div>
                 )}
               </div>
            </div>

            {/* OVERVIEW PHOTOS */}
            <div className={\`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md \${overviewPhotos.length > 0 ? 'border-[#10b981]/30' : 'border-[#262626]'}\`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={\`h-6 w-6 rounded-full flex items-center justify-center mr-3 \${overviewPhotos.length > 0 ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}\`}><CheckCircle2 className="h-4 w-4" /></div>
                   <h2 className="text-sm font-semibold text-[#f4f4f5]">Roof & Elevations</h2>
                 </div>
                 <div className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">{overviewPhotos.length} / 4</div>
               </div>
               <div className="p-5">
                 <div className="text-[13px] text-[#a1a1aa] mb-4 leading-relaxed">Upload wide-angle shots showing the roof slopes and overall condition.</div>
                 
                 <div className="grid grid-cols-3 gap-3">
                   {overviewPhotos.map((img, idx) => (
                     <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#262626] group bg-[#0a0a0a]">
                       <img src={img} crossOrigin="anonymous" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Overview" />
                       <button onClick={() => removeImage('overview', idx)} className="absolute top-1 right-1 bg-[#ef4444]/90 text-[#ffffff] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                         <X className="h-3 w-3" />
                       </button>
                     </div>
                   ))}
                   <div onClick={() => overviewInputRef.current?.click()} className="aspect-square border-2 border-dashed border-[#404040] hover:border-[#ffffff]/50 bg-[#18181b]/50 backdrop-blur-md rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                     <UploadCloud className="h-5 w-5 text-[#737373] mb-1" />
                     <span className="text-[10px] font-bold text-[#ffffff] px-2">Add Overview</span>
                     <input type="file" multiple accept="image/*" className="hidden" ref={overviewInputRef} onChange={(e) => handleFileChange(e, 'overview')} />
                   </div>
                 </div>
               </div>
            </div>

            {/* DAMAGE PHOTOS */}
            <div className={\`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md \${damagePhotos.length > 0 ? 'border-[#10b981]/30' : 'border-[#262626]'}\`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={\`h-6 w-6 rounded-full flex items-center justify-center mr-3 \${damagePhotos.length > 0 ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}\`}><CheckCircle2 className="h-4 w-4" /></div>
                   <h2 className="text-sm font-semibold text-[#f4f4f5]">Damage Highlights</h2>
                 </div>
                 <div className="text-[10px] uppercase font-bold tracking-wider text-[#737373]">{damagePhotos.length} / 4</div>
               </div>
               <div className="p-5">
                 <div className="text-[13px] text-[#a1a1aa] mb-4 leading-relaxed">Upload clear, zoomed-in photos of hail hits, creased shingles, or collateral damage.</div>
                 
                 <div className="grid grid-cols-3 gap-3">
                   {damagePhotos.map((img, idx) => (
                     <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#262626] group bg-[#0a0a0a]">
                       <img src={img} crossOrigin="anonymous" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" alt="Overview" />
                       <button onClick={() => removeImage('damage', idx)} className="absolute top-1 right-1 bg-[#ef4444]/90 text-[#ffffff] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                         <X className="h-3 w-3" />
                       </button>
                     </div>
                   ))}
                   <div onClick={() => damageInputRef.current?.click()} className="aspect-square border-2 border-dashed border-[#404040] hover:border-[#ffffff]/50 bg-[#18181b]/50 backdrop-blur-md rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                     <AlertTriangle className="h-5 w-5 text-[#ef4444]/50 mb-1" />
                     <span className="text-[10px] font-bold text-[#ffffff] px-2">Add Damage</span>
                     <input type="file" multiple accept="image/*" className="hidden" ref={damageInputRef} onChange={(e) => handleFileChange(e, 'damage')} />
                   </div>
                 </div>
               </div>
            </div>

            {/* NARRATIVE & RECOMMENDATIONS */}
            <div className={\`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md \${(reportInfo && recommendation) ? 'border-[#10b981]/30' : 'border-[#262626]'}\`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={\`h-6 w-6 rounded-full flex items-center justify-center mr-3 \${(reportInfo && recommendation) ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}\`}><CheckCircle2 className="h-4 w-4" /></div>
                   <h2 className="text-sm font-semibold text-[#f4f4f5]">Summary & Strategy</h2>
                 </div>
               </div>
               <div className="p-5 space-y-6">
                 <div>
                   <label className="block text-[11px] uppercase tracking-wider font-bold text-[#e4e4e7] mb-2">Detailed Observations</label>
                   <textarea 
                     value={reportInfo}
                     onChange={(e) => setReportInfo(e.target.value)}
                     placeholder="e.g. Roof shows significant hail impact across the back slope..."
                     className="w-full bg-[#18181b] border border-[#262626] rounded-xl p-3 text-[#ffffff] text-sm focus:outline-none focus:border-[#ffffff] min-h-[140px] scrollbar-hide"
                   />
                 </div>

                 <div>
                   <label className="block text-[11px] uppercase tracking-wider font-bold text-[#e4e4e7] mb-2">Homeowner Action Plan</label>
                   <textarea`;

// Since what's left is `      <div className="mb-6 shrink-0">\n        \n                   </div>\n                   <textarea` 
content = content.replace(
  /<div className="mb-6 shrink-0">[\s\S]*?<textarea/,
  replacementBlock
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
