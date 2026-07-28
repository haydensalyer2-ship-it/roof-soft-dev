const fs = require('fs');
const file = 'src/views/ProjectDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// The first replacement is inside the edit mode:
// Remove "Test Squares (10x10)" which is lines ~492 to ~519
// Remove "Inspector Notes" which is lines ~549 to ~554

content = content.replace(/<div className="border-b border-\[#262626\] pb-4">\s*<h3 className="text-white font-bold mb-4">Test Squares \(10x10\)<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*(<div>)/, '$1');

content = content.replace(/<label className="block text-\[11px\] text-\[#a3a3a3\] mb-1">Inspector Notes<\/label>\s*<textarea[\s\S]*?<\/textarea>/, '');

const viewModeHtml = 
`              ) : project.damageReport ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626]">
                      <div className="text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold mb-4">Property Specs</div>
                      <dl className="space-y-3 text-[13px]">
                        <div className="flex justify-between">
                          <dt className="text-[#a3a3a3]">Roof Type</dt>
                          <dd className="font-medium text-white">{project.damageReport.roofType}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#a3a3a3]">Est. Age</dt>
                          <dd className="font-medium text-white">{project.damageReport.roofAgeEstimate} years</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626]">
                      <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-red-400 font-semibold mb-4">
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Collateral Damage
                      </div>
                      <ul className="space-y-3">
                        {['gutters', 'downspouts', 'window_screens', 'ac_unit', 'siding', 'fence'].map((item) => {
                          const hasDamage = project.damageReport!.collateralDamage?.includes(item as any);
                          return (
                            <li key={item} className={\`flex items-center text-[13px] \${hasDamage ? 'text-white font-medium' : 'text-[#a3a3a3]'}\`}>
                              {hasDamage ? (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-red-400" />
                              ) : (
                                <Circle className="h-4 w-4 mr-2 opacity-30" />
                              )}
                              <span className="capitalize">{item.replace('_', ' ')}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] h-full flex flex-col">
                      <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold mb-4">
                        <Camera className="h-4 w-4 mr-2" />
                        Photo Documentation
                      </div>
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        {[1,2,3,4].map(idx => (
                          <div key={idx} className="aspect-square bg-[#0a0a0a] rounded-lg flex justify-center items-center overflow-hidden border border-[#262626] relative group cursor-pointer">
                             <img src={\`https://picsum.photos/seed/\${project.id}\${idx}/200/200?blur=4\`} alt="Damage Proof" referrerPolicy="no-referrer" className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                               <Upload className="h-5 w-5 text-white" />
                             </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4 flex-col">
                        <button onClick={() => onNavigate('generate_report', project.id)} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors flex justify-center items-center shadow-sm">
                          <FileText className="h-4 w-4 mr-1.5" />
                          Build Homeowner PDF Report
                        </button>
                        <button className="w-full bg-[#0a0a0a] text-white hover:bg-[#262626] border border-[#262626] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center">
                          <Upload className="h-3 w-3 mr-1.5" /> Upload More Photos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (`;

const fullViewRegex = /\s*\) : project\.damageReport \? \([\s\S]*?\) : \(/;
content = content.replace(fullViewRegex, '\n' + viewModeHtml);

fs.writeFileSync(file, content);
