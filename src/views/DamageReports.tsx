import { Project } from '../types';
import { Search, Filter, ShieldAlert, ChevronRight, FileBox, Camera } from 'lucide-react';

interface DamageReportsProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

export function DamageReports({ projects, onNavigate }: DamageReportsProps) {
  const projectsWithReports = projects.filter(p => p.damageReport);

  return (
    <div className="p-4 max-w-7xl mx-auto w-full">
      <div className="sm:flex sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Damage Reports</h1>
          <p className="text-[13px] text-[#a3a3a3] mt-1">Review inspection data, test squares, and collateral damage.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button className="bg-[#171717] hover:bg-[#262626] text-white border border-[#262626] px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
            Export All
          </button>
          <button onClick={() => onNavigate('generate_report')} className="bg-white text-black hover:bg-neutral-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
            Create PDF Report
          </button>
        </div>
      </div>

      <div className="bg-[#171717] shadow-sm rounded-2xl border border-[#262626] overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex flex-col sm:flex-row gap-4 justify-between bg-[#171717]">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#a3a3a3]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-[#262626] rounded-lg text-sm placeholder-[#a3a3a3] text-white bg-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#ffffff] focus:border-white"
              placeholder="Search reports by customer or inspector..."
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-[#262626] rounded-lg text-sm font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#0a0a0a] bg-[#171717] shadow-sm transition-colors">
            <Filter className="h-4 w-4 mr-2 opacity-70" />
            Filter Date
          </button>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-[#262626]">
            <thead className="bg-[#0a0a0a]/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Property
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Inspection Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Damage Summary
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Media
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#171717] divide-y divide-[#262626]">
              {projectsWithReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#a3a3a3]">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-[13px] font-medium">No damage reports found.</p>
                  </td>
                </tr>
              ) : (
                projectsWithReports.map((project) => {
                  const report = project.damageReport!;
                  const totalHail = report.testSquares.reduce((sum, ts) => sum + ts.hailHits, 0);
                  const totalWind = report.testSquares.reduce((sum, ts) => sum + ts.windDamagedShingles, 0);

                  return (
                    <tr 
                      key={project.id} 
                      className="hover:bg-[#0a0a0a]/50 cursor-pointer transition-colors"
                      onClick={() => onNavigate('project_detail', project.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[13px] font-medium text-white">
                          {project.customer.address}
                        </div>
                        <div className="text-[11px] text-[#a3a3a3] mt-0.5">
                          {project.customer.firstName} {project.customer.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[13px] text-white">{new Date(report.inspectionDate).toLocaleDateString()}</div>
                        <div className="text-[11px] text-[#a3a3a3] mt-0.5">By {report.inspectorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {totalHail > 0 && (
                            <span className="inline-flex items-center text-[11px] font-medium text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                              <FileBox className="h-3 w-3 mr-1" />
                              {totalHail} Hail
                            </span>
                          )}
                          {totalWind > 0 && (
                            <span className="inline-flex items-center text-[11px] font-medium text-[#d4d4d4] bg-[#d4d4d4]/10 px-2 py-0.5 rounded border border-[#d4d4d4]/20">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              {totalWind} Wind
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[13px] text-[#a3a3a3]">
                        <div className="flex items-center">
                          <Camera className="h-4 w-4 mr-1.5 opacity-70" />
                          {report.photosUploaded} Photos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ChevronRight className="h-5 w-5 text-[#262626] ml-auto" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
