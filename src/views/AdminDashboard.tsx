import { useState, useEffect, Fragment } from 'react';
import { Project, TeamMember, Knock } from '../types';
import { Users, TrendingUp, DollarSign, Target, UserPlus, X, Database, ChevronDown, ChevronUp, Briefcase, Activity, CalendarDays, CircleDollarSign, PieChart, Edit2, ShieldAlert } from 'lucide-react';
import { collection, doc, addDoc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface AdminDashboardProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

export function AdminDashboard({ projects, onNavigate }: AdminDashboardProps) {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [expandedRep, setExpandedRep] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'manager' | 'sales_rep'>('owner');
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [orgOwnerId, setOrgOwnerId] = useState<string | null>(null);
  
  // Invite State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'sales_rep'>('sales_rep');
  const [inviteManagerId, setInviteManagerId] = useState<string>('');

  // Edit Rep State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'sales_rep', status: 'active', managerId: '' });

  useEffect(() => {
    const q = query(collection(db, 'knocks'));
    const unsub = onSnapshot(q, (snap) => {
      const data: Knock[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as Knock));
      setKnocks(data);
    });
    return () => unsub();
  }, []);

  // 1. Fetch live editable team roster from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    // First check if the current user is an invited team member
    const qSelf = query(collection(db, 'team'), where('email', '==', auth.currentUser.email));
    const unsubSelf = onSnapshot(qSelf, (snapSelf) => {
      let isOwner = true;
      let ownerId = auth.currentUser!.uid;
      let memberId = null;

      if (!snapSelf.empty) {
        const selfDoc = snapSelf.docs[0];
        const selfData = selfDoc.data() as TeamMember;
        setCurrentUserRole(selfData.role as 'owner'|'manager'|'sales_rep');
        ownerId = selfData.userId;
        memberId = selfDoc.id;
        isOwner = false;
      } else {
        setCurrentUserRole('owner');
      }

      setOrgOwnerId(ownerId);
      setCurrentMemberId(memberId);

      // Now fetch the team roster for this organization
      const qTeam = query(collection(db, 'team'), where('userId', '==', ownerId));
      const unsubscribeTeam = onSnapshot(qTeam, async (snapshot) => {
        const loadedTeam = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
        setTeamMembers(loadedTeam);
      });

      return () => unsubscribeTeam();
    });

    return () => unsubSelf();
  }, []);

  const openEditModal = (rep: TeamMember) => {
    setEditingRep(rep);
    setEditForm({
      firstName: rep.firstName,
      lastName: rep.lastName,
      email: rep.email,
      phone: rep.phone,
      role: rep.role,
      status: rep.status,
      managerId: rep.managerId || ''
    });
    setIsEditModalOpen(true);
  };

  const saveRep = async () => {
    if (!editingRep || !auth.currentUser) return;
    try {
       await updateDoc(doc(db, 'team', editingRep.id), {
         ...editForm
       });
       setIsEditModalOpen(false);
       setEditingRep(null);
    } catch (err) {
       console.error("Error saving rep", err);
       showToast("Failed to save changes.");
    }
  };

  // 2. Roll-up overall metrics
  const totalLeads = projects.length;
  const activeDamageReports = projects.filter(p => !!p.damageReport).length;
  const wonProjects = projects.filter(p => ['contract_signed', 'completed'].includes(p.status));
  const companyWinRate = totalLeads ? Math.round((wonProjects.length / totalLeads) * 100) : 0;
  
  const pipelineProjects = projects.filter(p => p.claim && p.claim.rcv > 0);
  const companyPipelineRCV = pipelineProjects.reduce((sum, p) => sum + (p.claim?.rcv || 0), 0);
  const companyTotalCollected = pipelineProjects.reduce((sum, p) => sum + (p.claim?.totalCollected || 0), 0);
  
  const averageJobSize = wonProjects.length ? (companyPipelineRCV / wonProjects.length) : 0;
  const estimatedCompanyProfit = companyTotalCollected * 0.35; // Rough 35% margin assumed

  // 3. Generate Sales Rep stats using projects list (combining all distinct reps)
  const allRepsSet = new Set(projects.map(p => p.repName).filter(Boolean)) as Set<string>;
  teamMembers.forEach(t => allRepsSet.add(`${t.firstName} ${t.lastName}`)); // ensure empty reps show up
  
  // Filter for Manager visibility
  const visibleRepsList = currentUserRole === 'owner' 
    ? Array.from(allRepsSet)
    : Array.from(allRepsSet).filter(repName => {
        // keep if it's the manager themselves or someone on their team
        const tm = teamMembers.find(m => `${m.firstName} ${m.lastName}` === repName);
        return !tm || tm.id === currentMemberId || tm.managerId === currentMemberId;
      });

  const allReps = visibleRepsList.sort();
  
  const repStats = allReps.map(repName => {
    const repProjects = projects.filter(p => p.repName === repName);
    const rcvBase = repProjects.reduce((sum, p) => sum + (p.claim?.rcv || 0), 0);
    const collectedBase = repProjects.reduce((sum, p) => sum + (p.claim?.totalCollected || 0), 0);
    
    // Knock Metrics
    const repKnocks = knocks.filter(k => k.repName === repName || (k.repName?.toLowerCase() === repName.toLowerCase()));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();
    
    const knocksToday = repKnocks.filter(k => {
      let knockTime = 0;
      if (k.createdAt && (k.createdAt as any).seconds) knockTime = (k.createdAt as any).seconds * 1000;
      else if (k.createdAt && typeof k.createdAt === 'string') knockTime = new Date(k.createdAt).getTime();
      return knockTime >= startOfToday;
    });

    const totalKnocks = repKnocks.length;
    const conversations = repKnocks.filter(k => k.status === 'conversation').length;
    const inspections = repKnocks.filter(k => k.status === 'inspection').length;
    
    const knocksTodayCount = knocksToday.length;
    const convToday = knocksToday.filter(k => k.status === 'conversation').length;
    const inspToday = knocksToday.filter(k => k.status === 'inspection').length;

    const wonStatuses = ['contract_signed', 'production', 'final_invoice', 'completed'];
    const signedProjects = repProjects.filter(p => wonStatuses.includes(p.status));
    const activeProjects = repProjects.filter(p => !wonStatuses.includes(p.status));
    
    const winRate = repProjects.length > 0 ? Math.round((signedProjects.length / repProjects.length) * 100) : 0;
    
    // Deep Analytics: Pipeline Health Score
    let healthScore = 0;
    if (repProjects.length > 0) {
      healthScore += Math.min(50, (winRate / 40) * 50); // Win Rate Contribution (Max 50)
      healthScore += Math.min(25, (activeProjects.length / 5) * 25); // Activity Contribution (Max 25)
      healthScore += Math.min(25, (signedProjects.length / 3) * 25); // Closing Contribution (Max 25)
    }
    healthScore = Math.round(healthScore);
    
    let health = { score: 0, label: 'No Data', color: 'text-[#737373]', bg: 'bg-[#1a1a1a]', border: 'border-[#262626]' };
    if (repProjects.length > 0) {
       if (healthScore >= 80) health = { score: healthScore, label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
       else if (healthScore >= 50) health = { score: healthScore, label: 'Healthy', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
       else if (healthScore >= 25) health = { score: healthScore, label: 'At Risk', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
       else health = { score: healthScore, label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    }

    // Deep Analytics: Pipeline Stages
    const stages = {
       leads: repProjects.filter(p => ['lead', 'inspection'].includes(p.status)).length,
       claims: repProjects.filter(p => ['claim_filed', 'adjustment', 'approved_or_denied'].includes(p.status)).length,
       won: signedProjects.length
    };
    
    const stageRcvs = {
       leads: repProjects.filter(p => ['lead', 'inspection'].includes(p.status)).reduce((acc, p) => acc + (p.claim?.rcv || 0), 0),
       claims: repProjects.filter(p => ['claim_filed', 'adjustment', 'approved_or_denied'].includes(p.status)).reduce((acc, p) => acc + (p.claim?.rcv || 0), 0),
       won: signedProjects.reduce((acc, p) => acc + (p.claim?.rcv || 0), 0)
    };

    return {
      name: repName,
      leadCount: repProjects.length,
      signedCount: signedProjects.length,
      activeCount: activeProjects.length,
      winRate,
      totalRCV: rcvBase,
      totalCollected: collectedBase,
      avgJobSize: signedProjects.length ? (rcvBase / signedProjects.length) : 0,
      estimatedProfit: collectedBase * 0.35,
      health,
      stages,
      stageRcvs,
      knockStats: {
        totalKnocks,
        conversations,
        inspections,
        knocksTodayCount,
        convToday,
        inspToday
      }
    };
  }).sort((a, b) => b.totalRCV - a.totalRCV);

  return (
    <div className="p-4 max-w-7xl mx-auto w-full space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Organization Overview</h1>
          <p className="text-[13px] text-[#a3a3a3] mt-1 font-mono tracking-tight">Global sales metrics, active pipeline, and drill-down team analytics.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          {/* Removed the Seed Demo Data button entirely based on request */}
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-[#171717] hover:bg-[#262626] border border-[#262626] text-white px-4 py-2 text-[11px] uppercase tracking-widest font-bold transition-colors shadow-sm flex items-center break-words"
          >
            <UserPlus className="h-4 w-4 mr-2 shrink-0" />
            Invite Sales Rep
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Metrics */}
        <div className="bg-[#171717] p-6 border-l-[4px] border-l-blue-500 border border-[#262626]">
          <div className="flex items-center text-blue-400 mb-4">
            <TrendingUp className="h-5 w-5 mr-2" />
            <div className="text-[10px] uppercase tracking-widest font-bold font-mono">Gross Pipeline (RCV)</div>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">${companyPipelineRCV.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] font-bold text-[#a3a3a3] mt-2 uppercase tracking-wide">Total potential revenue</div>
        </div>
        
        <div className="bg-[#171717] p-6 border-l-[4px] border-l-emerald-500 border border-[#262626]">
          <div className="flex items-center text-emerald-500 mb-4">
            <DollarSign className="h-5 w-5 mr-2" />
            <div className="text-[10px] uppercase tracking-widest font-bold font-mono">Liquid Cash Collected</div>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">${companyTotalCollected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] font-bold text-emerald-400 mt-2 uppercase tracking-wide">Est. Profit: ${estimatedCompanyProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
        </div>

        <div className="bg-[#171717] p-6 border-l-[4px] border-l-purple-500 border border-[#262626]">
          <div className="flex items-center text-purple-400 mb-4">
            <Target className="h-5 w-5 mr-2" />
            <div className="text-[10px] uppercase tracking-widest font-bold font-mono">Company Win Rate</div>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">{companyWinRate}%</div>
          <div className="text-[11px] font-bold text-[#a3a3a3] mt-2 uppercase tracking-wide">{wonProjects.length} Won / {totalLeads} Total</div>
        </div>

        <div className="bg-[#171717] p-6 border-l-[4px] border-l-orange-500 border border-[#262626]">
          <div className="flex items-center text-orange-400 mb-4">
            <PieChart className="h-5 w-5 mr-2" />
            <div className="text-[10px] uppercase tracking-widest font-bold font-mono">Average Job Size</div>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">${averageJobSize.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] font-bold text-[#a3a3a3] mt-2 uppercase tracking-wide">Based on won contracts</div>
        </div>
      </div>

      {/* NEW EDITABLE TEAM ROSTER */}
      <div className="bg-[#171717] border border-[#262626]">
        <div className="p-5 border-b border-[#262626] bg-[#0a0a0a] flex justify-between items-center">
          <h2 className="text-sm uppercase tracking-widest font-black text-white flex items-center font-mono">
            <Briefcase className="h-4 w-4 mr-3 text-purple-400" />
            Team Directory & Settings
          </h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-[#262626]">
            <thead className="bg-[#111111]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Rep Name
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Contact
                </th>
                <th scope="col" className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Role
                </th>
                <th scope="col" className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#0a0a0a] divide-y divide-[#262626]">
              {teamMembers
                .filter(m => currentUserRole === 'owner' || m.managerId === currentMemberId || m.id === currentMemberId)
                .map((member) => (
                <tr key={member.id} className="hover:bg-[#171717] transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-black text-white uppercase tracking-tight flex items-center">
                      <div className="w-8 h-8 rounded bg-[#262626] flex items-center justify-center mr-3 font-mono text-[11px] text-[#a3a3a3]">
                         {member.firstName[0]}{member.lastName[0]}
                      </div>
                      {member.firstName} {member.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{member.email}</div>
                    <div className="text-xs text-[#a3a3a3] mt-1 font-mono">{member.phone}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest font-black border ${member.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : member.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-[#262626] text-[#a3a3a3] border-[#404040]'}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                        {member.status === 'inactive' && (
                           <span className="ml-2 inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest font-black bg-red-500/10 text-red-500 border border-red-500/20">
                             Inactive
                           </span>
                        )}
                      </div>
                      {member.role === 'sales_rep' && member.managerId && (
                        <span className="text-[10px] text-[#737373] uppercase tracking-widest font-bold">
                          Mgr: {teamMembers.find(m => m.id === member.managerId)?.firstName || 'Unknown'} {teamMembers.find(m => m.id === member.managerId)?.lastName || ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    {(currentUserRole === 'owner' || (currentUserRole === 'manager' && member.managerId === currentMemberId)) && (
                      <button 
                         onClick={() => openEditModal(member)}
                         className="text-[#a3a3a3] hover:text-white transition-colors bg-[#262626] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold flex items-center inline-flex"
                      >
                        <Edit2 className="h-3 w-3 mr-2" /> Edit Profile
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {teamMembers.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-[13px] text-[#737373]">
                      Initializing fake reps...
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#171717] border border-[#262626]">
        <div className="p-5 border-b border-[#262626] bg-[#0a0a0a]">
          <h2 className="text-sm uppercase tracking-widest font-black text-white flex items-center font-mono">
            <Users className="h-4 w-4 mr-3 text-[#a3a3a3]" />
            Sales Rep Leaderboard
          </h2>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-[#262626]">
            <thead className="bg-[#111111]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Rank / Rep Name
                </th>
                <th scope="col" className="px-6 py-4 text-center text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Total Leads
                </th>
                <th scope="col" className="px-6 py-4 text-center text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Knocking (Today)
                </th>
                <th scope="col" className="px-6 py-4 text-center text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Win Rate
                </th>
                <th scope="col" className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Total Collected
                </th>
                <th scope="col" className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold font-mono">
                  Managed Pipeline
                </th>
                <th scope="col" className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="bg-[#0a0a0a] divide-y divide-[#262626]">
              {repStats.map((rep, index) => (
                <Fragment key={rep.name}>
                  <tr 
                    onClick={() => setExpandedRep(expandedRep === rep.name ? null : rep.name)}
                    className="hover:bg-[#171717] transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-black text-white uppercase flex items-center tracking-tight">
                        <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 font-mono text-[10px] ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : index === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' : 'bg-[#262626] text-[#737373]'}`}>
                          #{index + 1}
                        </div>
                        {rep.name}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-bold text-white">
                      {rep.leadCount}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black">{rep.knockStats.knocksTodayCount} <span className="text-[10px] text-[#a3a3a3] font-normal uppercase">Knocks</span></span>
                        <div className="text-[10px] text-blue-400 mt-1">{rep.knockStats.convToday} Conv • <span className="text-emerald-400">{rep.knockStats.inspToday} Insp</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest font-black border ${rep.winRate >= 30 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#262626] text-[#a3a3a3] border-[#404040]'}`}>
                        {rep.winRate}%
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-emerald-400 tracking-tight">
                      ${rep.totalCollected.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-white tracking-tight">
                      ${rep.totalRCV.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-[#a3a3a3]">
                      {expandedRep === rep.name ? <ChevronUp className="h-5 w-5 inline" /> : <ChevronDown className="h-5 w-5 inline" />}
                    </td>
                  </tr>
                  
                  {/* Expanded Deep Data Row */}
                  {expandedRep === rep.name && (
                    <tr className="bg-[#111111]">
                      <td colSpan={7} className="px-0 py-0 border-t-0">
                        <div className="p-8 border-l-[4px] border-l-blue-500 bg-[#0f0f0f] shadow-inner space-y-8">
                           
                           <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#262626] gap-4">
                              <div>
                                 <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center">
                                   <Activity className="h-5 w-5 mr-3 text-blue-500" />
                                   Pipeline Dossier: {rep.name}
                                 </h3>
                                 <p className="text-[#a3a3a3] text-[11px] font-mono mt-1 uppercase tracking-wider">Comprehensive conversion & health metrics</p>
                              </div>
                              <div className="flex items-center space-x-4 bg-[#1a1a1a] p-3 border border-[#262626]">
                                 <div className="text-right">
                                    <div className="text-[10px] uppercase font-mono tracking-widest text-[#a3a3a3] font-bold">Health Score</div>
                                    <div className={`text-base font-black tracking-tight ${rep.health.color}`}>{rep.health.label}</div>
                                 </div>
                                 <div className={`w-14 h-14 flex items-center justify-center border-[3px] font-black text-xl tracking-tighter ${rep.health.color} ${rep.health.bg} ${rep.health.border}`}>
                                   {rep.health.score}
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Pipeline Funnel Stage Blocks */}
                              <div className="lg:col-span-2 space-y-4">
                                 <div className="text-[10px] uppercase font-mono tracking-widest text-[#737373] font-bold">Pipeline Stage Funnel</div>
                                 <div className="flex w-full h-8 overflow-hidden bg-[#1a1a1a] border border-[#262626]">
                                    {rep.leadCount === 0 ? (
                                       <div className="w-full flex items-center justify-center text-[10px] font-mono text-[#404040]">NO DATA</div>
                                    ) : (
                                       <>
                                          <div className="h-full bg-slate-600 border-r border-[#111]" style={{ width: `${(rep.stages.leads / rep.leadCount) * 100}%` }}></div>
                                          <div className="h-full bg-blue-600 border-r border-[#111]" style={{ width: `${(rep.stages.claims / rep.leadCount) * 100}%` }}></div>
                                          <div className="h-full bg-emerald-500" style={{ width: `${(rep.stages.won / rep.leadCount) * 100}%` }}></div>
                                       </>
                                    )}
                                 </div>
                                 <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#171717] border-t-2 border-t-slate-500 p-4 border border-[#262626]">
                                       <div className="text-[10px] text-[#a3a3a3] uppercase tracking-widest font-bold">Leads & Inspects</div>
                                       <div className="text-2xl font-black text-white mt-1">{rep.stages.leads}</div>
                                       <div className="text-xs text-slate-400 font-mono mt-1">${rep.stageRcvs.leads.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-[#171717] border-t-2 border-t-blue-500 p-4 border border-[#262626]">
                                       <div className="text-[10px] text-[#a3a3a3] uppercase tracking-widest font-bold">Active Claims</div>
                                       <div className="text-2xl font-black text-white mt-1">{rep.stages.claims}</div>
                                       <div className="text-xs text-blue-400 font-mono mt-1">${rep.stageRcvs.claims.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-[#171717] border-t-2 border-t-emerald-500 p-4 border border-[#262626]">
                                       <div className="text-[10px] text-[#a3a3a3] uppercase tracking-widest font-bold">Closed Deals</div>
                                       <div className="text-2xl font-black text-white mt-1">{rep.stages.won}</div>
                                       <div className="text-xs text-emerald-400 font-mono mt-1">${rep.stageRcvs.won.toLocaleString()}</div>
                                    </div>
                                 </div>
                                 <div className="text-[10px] uppercase font-mono tracking-widest text-[#737373] font-bold mt-8">All-Time Door Knocking Activity</div>
                                 <div className="grid grid-cols-4 gap-4 mt-2">
                                    <div className="bg-[#171717] border border-[#262626] p-4 text-center">
                                       <div className="text-[10px] text-[#a3a3a3] uppercase tracking-widest font-bold">Total Knocks</div>
                                       <div className="text-2xl font-black text-white mt-1">{rep.knockStats.totalKnocks}</div>
                                    </div>
                                    <div className="bg-[#171717] border border-[#262626] p-4 text-center">
                                       <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Conversations</div>
                                       <div className="text-2xl font-black text-white mt-1">{rep.knockStats.conversations}</div>
                                    </div>
                                    <div className="bg-[#171717] border border-[#262626] p-4 text-center">
                                       <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Inspections</div>
                                       <div className="text-2xl font-black text-white mt-1">{rep.knockStats.inspections}</div>
                                    </div>
                                    <div className="bg-[#171717] border border-[#262626] p-4 text-center">
                                       <div className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold">Conv. to Insp. %</div>
                                       <div className="text-2xl font-black text-white mt-1">
                                         {rep.knockStats.conversations > 0 ? Math.round((rep.knockStats.inspections / rep.knockStats.conversations) * 100) : 0}%
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <div className="text-[10px] uppercase font-mono tracking-widest text-[#737373] font-bold">Performance Projections</div>
                                 <div className="bg-[#171717] p-5 border border-[#262626] space-y-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-[#a3a3a3]">Win Rate:</span>
                                      <span className="text-lg font-black text-white">{rep.winRate}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-[#a3a3a3]">Gross Pipeline:</span>
                                      <span className="text-lg font-black text-white tracking-tight">${rep.totalRCV.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#262626] pt-4">
                                      <span className="text-sm font-bold text-[#a3a3a3]">Est. Profit Value:</span>
                                      <span className="text-lg font-black text-emerald-400 tracking-tight">${rep.estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-[#737373]">Avg Job Size:</span>
                                      <span className="text-xs text-[#a3a3a3] font-mono">${rep.avgJobSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4 pt-4 border-t border-[#262626]">
                             <div className="text-[10px] uppercase font-mono tracking-widest text-[#737373] font-bold flex items-center">
                                <Activity className="h-3 w-3 mr-2" /> Top Active Deals Feed
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                               {projects
                                 .filter(p => p.repName === rep.name && p.claim && p.claim.rcv > 0)
                                 .sort((a, b) => (b.claim?.rcv || 0) - (a.claim?.rcv || 0))
                                 .slice(0, 3)
                                 .map(p => (
                                   <div key={p.id} className="flex justify-between items-center bg-[#1a1a1a] p-4 border-l-2 border-emerald-500 border border-[#262626] hover:bg-[#262626] transition-colors cursor-pointer" onClick={() => onNavigate('project_detail', p.id)}>
                                      <div>
                                         <div className="text-sm font-bold text-white truncate">{p.customer.firstName} {p.customer.lastName}</div>
                                         <div className="text-[10px] uppercase font-mono text-[#a3a3a3] mt-1">{p.status.replace(/_/g, ' ')}</div>
                                      </div>
                                      <div className="text-emerald-400 font-black font-mono tracking-tight shrink-0">${p.claim?.rcv.toLocaleString()}</div>
                                   </div>
                                 ))}
                               {projects.filter(p => p.repName === rep.name && p.claim && p.claim.rcv > 0).length === 0 && (
                                 <div className="text-xs text-[#737373] italic md:col-span-3 py-4 text-center border border-dashed border-[#262626]">No revenue-generating pipeline detected for this rep.</div>
                               )}
                             </div>
                           </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {repStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-[#171717] mb-3">
                      <Users className="h-5 w-5 text-[#404040]" />
                    </div>
                    <div className="text-sm font-bold text-white uppercase tracking-wide">No Active Sales Reps</div>
                    <div className="text-xs text-[#737373] mt-1">Invite team members to populate leaderboards.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#171717] border-[3px] border-black w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
            <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0a0a0a]">
              <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center font-mono">
                <UserPlus className="h-4 w-4 mr-3 text-emerald-400" />
                Invite Team Member
              </h2>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-[#a3a3a3] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-[13px] text-[#a3a3a3] font-medium leading-relaxed">
                Add a new team member to your organization. They will be required to configure their profile upon login.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">First Name</label>
                   <input type="text" value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} placeholder="Jane" className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Last Name</label>
                   <input type="text" value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} placeholder="Doe" className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold" />
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">
                  Email Address
                </label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rep@roofingco.com"
                  className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold placeholder:text-[#404040]"
                />
              </div>

              {currentUserRole === 'owner' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Role</label>
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value as 'manager' | 'sales_rep')}
                    className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold"
                  >
                    <option value="manager">Production Manager</option>
                    <option value="sales_rep">Sales Rep</option>
                  </select>
                </div>
              )}

              {inviteRole === 'sales_rep' && currentUserRole === 'owner' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Assign Manager</label>
                  <select 
                    value={inviteManagerId} 
                    onChange={(e) => setInviteManagerId(e.target.value)}
                    className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold"
                  >
                    <option value="">None (Org Owner)</option>
                    {teamMembers.filter(m => m.role === 'manager').map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#262626] bg-[#0a0a0a] flex justify-end gap-3">
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="px-5 py-2.5 text-[#a3a3a3] font-bold text-[11px] uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await addDoc(collection(db, 'team'), {
                      userId: orgOwnerId, // Always bind to the org owner
                      firstName: inviteFirstName,
                      lastName: inviteLastName,
                      email: inviteEmail,
                      phone: '',
                      role: currentUserRole === 'manager' ? 'sales_rep' : inviteRole, // managers can only invite reps
                      managerId: currentUserRole === 'manager' ? currentMemberId : (inviteRole === 'sales_rep' ? inviteManagerId : ''),
                      status: 'active',
                      createdAt: new Date().toISOString()
                    });
                    showToast(`Invite sent to ${inviteEmail}!`);
                    setIsInviteModalOpen(false);
                    setInviteEmail('');
                    setInviteFirstName('');
                    setInviteLastName('');
                  } catch (e) {
                    console.error('Error adding team member:', e);
                  }
                }}
                disabled={!inviteEmail || !inviteFirstName || !inviteLastName}
                className="px-6 py-2.5 bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-black text-[11px] uppercase tracking-widest transition-colors flex items-center shadow-lg"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL FOR REPS */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#171717] border-[3px] border-black w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
            <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0a0a0a]">
              <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center font-mono">
                <Edit2 className="h-4 w-4 mr-3 text-purple-400" />
                Edit Rep Profile
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#a3a3a3] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">First Name</label>
                   <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Last Name</label>
                   <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Email</label>
                   <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Phone</label>
                   <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">System Role</label>
                   <select 
                     value={editForm.role} 
                     onChange={(e) => setEditForm({...editForm, role: e.target.value})} 
                     className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold uppercase"
                     disabled={currentUserRole === 'manager'}
                   >
                      <option value="sales_rep">Sales Rep</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Status</label>
                   <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold uppercase">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                   </select>
                 </div>
              </div>
              {editForm.role === 'sales_rep' && currentUserRole === 'owner' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-2 font-mono">Assign Manager</label>
                  <select 
                    value={editForm.managerId} 
                    onChange={(e) => setEditForm({...editForm, managerId: e.target.value})}
                    className="w-full bg-black border-2 border-[#262626] px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors font-bold uppercase"
                  >
                    <option value="">None (Org Owner)</option>
                    {teamMembers.filter(m => m.role === 'manager').map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 flex items-start">
                 <ShieldAlert className="h-5 w-5 text-orange-400 mr-3 shrink-0" />
                 <p className="text-xs text-orange-200/80 leading-relaxed font-medium">Changing a rep's name will NOT retroactively update their historical projects. Pipeline stats are tied directly to the strict name matching of the rep.</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#262626] bg-[#0a0a0a] flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 text-[#a3a3a3] font-bold text-[11px] uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveRep}
                className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-black text-[11px] uppercase tracking-widest transition-colors flex items-center shadow-lg"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
