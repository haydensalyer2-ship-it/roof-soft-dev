import { Project } from '../types';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Users,
  Briefcase,
  Timer,
  TrendingUp,
  Target,
  PieChart
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
  repRole?: string;
  repName?: string;
}

export function Dashboard({ projects, onNavigate, repRole = 'Manager', repName = '' }: DashboardProps) {
  const isManager = repRole === 'Manager';
  const viewProjects = isManager ? projects : projects.filter(p => p.repName === repName);

  const activeProjects = viewProjects.filter(p => !['completed', 'closed', 'final_invoice'].includes(p.status));
  const completedProjects = viewProjects.filter(p => ['completed', 'closed', 'final_invoice'].includes(p.status));
  
  // Total Revenue (Completed & Approved RCV)
  const revenueGeneratingProjects = viewProjects.filter(p => ['approved', 'completed', 'final_invoice', 'production', 'contract_signed'].includes(p.status));
  const totalRevenue = revenueGeneratingProjects.reduce((sum, p) => sum + (p.claim?.rcv || 0), 0);
  const totalCollected = revenueGeneratingProjects.reduce((sum, p) => sum + (p.claim?.totalCollected || 0), 0);

  // Appointments extraction
  const upcomingAppointments: any[] = [];
  viewProjects.forEach(p => {
    if (p.damageReport?.inspectionDate) {
      if (new Date(p.damageReport.inspectionDate) >= new Date()) {
        upcomingAppointments.push({
          type: 'inspection',
          date: new Date(p.damageReport.inspectionDate),
          address: p.customer.address,
          customer: `${p.customer.firstName} ${p.customer.lastName}`,
          id: p.id
        });
      }
    }
    if (p.claim?.adjustmentDate) {
      if (new Date(p.claim.adjustmentDate) >= new Date()) {
        upcomingAppointments.push({
          type: 'adjustment',
          date: new Date(p.claim.adjustmentDate),
          address: p.customer.address,
          customer: `${p.customer.firstName} ${p.customer.lastName}`,
          id: p.id
        });
      }
    }
  });
  
  upcomingAppointments.sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextAppointments = upcomingAppointments.slice(0, 3);

  // Leaderboard (calculated across ALL projects, so reps can see team ranks)
  const allRepsSet = new Set(projects.map(p => p.repName).filter(Boolean)) as Set<string>;
  const allReps = Array.from(allRepsSet).sort();
  
  const repStats = allReps.map(name => {
    const repProjects = projects.filter(p => p.repName === name);
    const won = repProjects.filter(p => ['contract_signed', 'completed', 'final_invoice', 'production'].includes(p.status));
    const winRate = repProjects.length > 0 ? Math.round((won.length / repProjects.length) * 100) : 0;
    const collected = repProjects.reduce((sum, p) => sum + (p.claim?.totalCollected || 0), 0);
    return { name, leads: repProjects.length, winRate, collected };
  }).sort((a, b) => b.collected - a.collected);

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'contract_signed':
      case 'approved_or_denied':
      case 'completed':
        return 'bg-white text-black font-extrabold shadow-sm';
      case 'adjustment':
      case 'claim_filed':
        return 'bg-[#0a0a0a] text-white border border-[#404040]';
      default:
        return 'bg-[#171717] text-[#a3a3a3] border border-[#262626]';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col pt-4">
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            {isManager ? 'Team Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-[13px] text-[#a3a3a3] mt-1 font-mono tracking-tight">
            {isManager ? 'Global sales metrics and active pipeline.' : 'Personal KPIs and recent activity.'}
          </p>
        </div>
        <div className="px-3 py-1 bg-[#171717] border border-[#262626] rounded-md text-[#a3a3a3] text-[10px] font-mono uppercase tracking-widest">
          View: <span className="text-white font-bold">{repRole}</span>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isManager ? 'md:grid-cols-4' : 'md:grid-cols-3 lg:grid-cols-4'} gap-4 mb-4`}>
        {/* Stat Item 1 */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 border-l-[3px] border-l-blue-500">
          <div className="text-[10px] font-mono tracking-widest uppercase text-blue-400 font-bold mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" /> Pipeline (RCV)
          </div>
          <div className="text-3xl font-black text-white tracking-tighter">
            ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-[#737373] mt-2 font-bold uppercase tracking-wider">{viewProjects.length} Total Leads</div>
        </div>

        {/* Stat Item 2 */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 border-l-[3px] border-l-emerald-500">
          <div className="text-[10px] font-mono tracking-widest uppercase text-emerald-500 font-bold mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2" /> Collected Cash
          </div>
          <div className="text-3xl font-black text-white tracking-tighter">
            ${totalCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-[#737373] mt-2 font-bold uppercase tracking-wider">From {revenueGeneratingProjects.length} Deals</div>
        </div>

        {/* Stat Item 3 */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 border-l-[3px] border-l-purple-500">
          <div className="text-[10px] font-mono tracking-widest uppercase text-purple-400 font-bold mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2" /> Win Rate
          </div>
          <div className="text-3xl font-black text-white tracking-tighter">
            {viewProjects.length ? Math.round((revenueGeneratingProjects.length / viewProjects.length) * 100) : 0}%
          </div>
          <div className="text-[10px] text-[#737373] mt-2 font-bold uppercase tracking-wider">Conversion to Signed</div>
        </div>

        {/* Stat Item 4 (Manager only) */}
        {isManager && (
          <div className="bg-[#171717] border border-[#262626] rounded-xl p-5 border-l-[3px] border-l-orange-500">
            <div className="text-[10px] font-mono tracking-widest uppercase text-orange-400 font-bold mb-3 flex items-center">
              <PieChart className="w-4 h-4 mr-2" /> Avg Job Size
            </div>
            <div className="text-3xl font-black text-white tracking-tighter">
              ${revenueGeneratingProjects.length ? Math.round(totalRevenue / revenueGeneratingProjects.length).toLocaleString() : 0}
            </div>
            <div className="text-[10px] text-[#737373] mt-2 font-bold uppercase tracking-wider">Across Won Deals</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#262626] bg-[#0a0a0a]">
              <div className="text-sm font-black uppercase text-white font-mono flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-[#a3a3a3]" />
                Recent Activity
              </div>
              <button 
                onClick={() => onNavigate('projects')}
                className="text-[10px] uppercase font-bold tracking-widest text-[#a3a3a3] hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-[#262626]">
              {viewProjects.length === 0 ? (
                <div className="text-center py-10 text-[13px] text-[#737373] font-mono uppercase tracking-widest">No assigned projects.</div>
              ) : (
                viewProjects.slice(0, 6).map((project) => (
                  <div 
                    key={project.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#111111] transition-colors cursor-pointer gap-3" 
                    onClick={() => onNavigate('project_detail', project.id)}
                  >
                    <div className="min-w-0 pr-2">
                       <div className="font-bold text-[14px] text-white truncate text-ellipsis w-full">
                        {project.customer.firstName} {project.customer.lastName}
                      </div>
                      <div className="text-[11px] font-mono text-[#737373] mt-1 truncate w-full uppercase tracking-widest">
                        {project.customer.address}
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <div className="text-right mr-4 hidden sm:block">
                        <div className="text-white font-black text-[13px]">${project.claim?.rcv ? project.claim.rcv.toLocaleString() : '0'}</div>
                        <div className="text-[#a3a3a3] text-[9px] uppercase tracking-widest font-bold font-mono">RCV</div>
                      </div>
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${getBadgeStyle(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {!isManager && (
            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
               <div className="text-sm font-black uppercase text-white font-mono flex items-center p-4 border-b border-[#262626] bg-[#0a0a0a]">
                 <Timer className="h-4 w-4 mr-2 text-[#a3a3a3]" />
                 My Appointments
               </div>
               <div className="divide-y divide-[#262626]">
                 {nextAppointments.length === 0 ? (
                   <div className="text-center py-8 text-[13px] text-[#737373] font-mono uppercase tracking-widest">No upcoming appointments.</div>
                 ) : (
                   nextAppointments.map((appt, idx) => (
                     <div key={idx} className="flex flex-col sm:flex-row justify-between p-4 bg-[#0a0a0a] gap-3">
                       <div className="flex items-center gap-4 w-full sm:w-auto">
                         <div className={`w-12 h-12 flex flex-col items-center justify-center border font-mono ${appt.type === 'inspection' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                           <span className="text-[9px] uppercase tracking-widest font-black leading-none">{appt.date.toLocaleString('en-US', { month: 'short' })}</span>
                           <span className="text-lg font-black leading-none mt-1">{appt.date.getDate()}</span>
                         </div>
                         <div>
                           <div className="text-sm font-bold text-white flex items-center">
                             {appt.customer} <span className="ml-2 text-[10px] text-[#a3a3a3] font-normal uppercase tracking-widest">{appt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <div className="text-[11px] font-mono text-[#737373] mt-1">{appt.address}</div>
                         </div>
                       </div>
                       <button 
                         onClick={() => onNavigate('project_detail', appt.id)}
                         className="border border-[#262626] bg-[#171717] hover:bg-white hover:text-black transition-colors rounded px-3 py-1.5 text-[10px] font-bold text-white uppercase tracking-widest shrink-0 self-start sm:self-center"
                       >
                         View Lead
                       </button>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Dynamic logic */}
        <div className="space-y-6">
          {!isManager ? (
            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#262626] bg-[#0a0a0a]">
                <h2 className="text-sm uppercase tracking-widest font-black text-white flex items-center font-mono">
                  <span className="text-lg mr-2">🏆</span> Team Leaderboard
                </h2>
              </div>
              <div className="divide-y divide-[#262626]">
                {repStats.slice(0, 8).map((rep, idx) => (
                  <div key={rep.name} className={`flex justify-between items-center p-3 ${rep.name === repName ? 'bg-white/5 border-l-2 border-l-white' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-black font-mono ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                        idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : 
                        idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' : 
                        'bg-[#262626] text-[#737373]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="text-[12px] font-bold text-white uppercase tracking-wide">
                        {rep.name}
                        {rep.name === repName && <span className="ml-2 text-[8px] bg-white text-black px-1 py-0.5 rounded-sm">YOU</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-black text-emerald-400">${rep.collected.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {repStats.length === 0 && (
                  <div className="p-6 text-center text-[#737373] text-[11px] uppercase tracking-widest font-mono">No data</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#171717] border border-[#262626] rounded-xl overflow-hidden">
               <div className="text-sm font-black uppercase text-white font-mono flex items-center p-4 border-b border-[#262626] bg-[#0a0a0a]">
                 <Timer className="h-4 w-4 mr-2 text-[#a3a3a3]" />
                 Team Appointments
               </div>
               <div className="divide-y divide-[#262626]">
                 {nextAppointments.length === 0 ? (
                   <div className="text-center py-8 text-[13px] text-[#737373] font-mono uppercase tracking-widest">No upcoming appointments.</div>
                 ) : (
                   nextAppointments.map((appt, idx) => (
                     <div key={idx} className="flex flex-col sm:flex-row justify-between p-4 bg-[#0a0a0a] gap-3">
                       <div className="flex items-center gap-4 w-full sm:w-auto">
                         <div className={`w-12 h-12 flex flex-col items-center justify-center border font-mono ${appt.type === 'inspection' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                           <span className="text-[9px] uppercase tracking-widest font-black leading-none">{appt.date.toLocaleString('en-US', { month: 'short' })}</span>
                           <span className="text-lg font-black leading-none mt-1">{appt.date.getDate()}</span>
                         </div>
                         <div>
                           <div className="text-sm font-bold text-white flex items-center">
                             {appt.customer} <span className="ml-2 text-[10px] text-[#a3a3a3] font-normal uppercase tracking-widest">{appt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <div className="text-[11px] font-mono text-[#737373] mt-1">{appt.address}</div>
                         </div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
