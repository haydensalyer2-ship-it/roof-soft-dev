import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Filter,
  MapPin,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Knock, Project, TeamMember } from '../types';

interface AdminDashboardProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

type AdminTab = 'overview' | 'team' | 'performance';
type Role = TeamMember['role'];

interface RepPerformance {
  name: string;
  member?: TeamMember;
  projects: Project[];
  leads: number;
  won: number;
  active: number;
  winRate: number;
  pipeline: number;
  collected: number;
  knocks: number;
  conversations: number;
  inspections: number;
}

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const memberName = (member: TeamMember) => `${member.firstName} ${member.lastName}`.trim();

const roleLabel: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  sales_rep: 'Sales rep',
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-[#111816] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#63706b] focus:border-[#83f3bd]/60 focus:ring-2 focus:ring-[#83f3bd]/10';

export function AdminDashboard({ projects, onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Role>('owner');
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [orgOwnerId, setOrgOwnerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [invite, setInvite] = useState({ firstName: '', lastName: '', email: '', role: 'sales_rep' as Exclude<Role, 'owner'>, managerId: '' });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'sales_rep' as Role, status: 'active' as TeamMember['status'], managerId: '' });

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'knocks')), (snapshot) => {
      setKnocks(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as Knock)));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let unsubscribeTeam = () => undefined;
    const selfQuery = query(collection(db, 'team'), where('email', '==', user.email));
    const unsubscribeSelf = onSnapshot(selfQuery, (snapshot) => {
      unsubscribeTeam();
      const self = snapshot.docs[0];
      const selfData = self?.data() as TeamMember | undefined;
      const ownerId = selfData?.userId || user.uid;
      setCurrentUserRole(selfData?.role || 'owner');
      setCurrentMemberId(self?.id || null);
      setOrgOwnerId(ownerId);

      const teamQuery = query(collection(db, 'team'), where('userId', '==', ownerId));
      unsubscribeTeam = onSnapshot(teamQuery, (teamSnapshot) => {
        setTeamMembers(teamSnapshot.docs.map((teamDoc) => ({ id: teamDoc.id, ...teamDoc.data() } as TeamMember)));
      });
    });

    return () => {
      unsubscribeSelf();
      unsubscribeTeam();
    };
  }, []);

  const visibleMembers = useMemo(() => teamMembers.filter((member) =>
    currentUserRole === 'owner' || member.id === currentMemberId || member.managerId === currentMemberId
  ), [currentMemberId, currentUserRole, teamMembers]);

  const performance = useMemo<RepPerformance[]>(() => {
    const names = new Set(projects.map((project) => project.repName).filter(Boolean) as string[]);
    visibleMembers.forEach((member) => names.add(memberName(member)));
    const wonStatuses = ['contract_signed', 'completed'];

    return Array.from(names).map((name) => {
      const repProjects = projects.filter((project) => project.repName === name);
      const repKnocks = knocks.filter((knock) => knock.repName?.toLowerCase() === name.toLowerCase());
      const won = repProjects.filter((project) => wonStatuses.includes(project.status)).length;
      return {
        name,
        member: visibleMembers.find((member) => memberName(member) === name),
        projects: repProjects,
        leads: repProjects.length,
        won,
        active: repProjects.length - won,
        winRate: repProjects.length ? Math.round((won / repProjects.length) * 100) : 0,
        pipeline: repProjects.reduce((sum, project) => sum + (project.claim?.rcv || 0), 0),
        collected: repProjects.reduce((sum, project) => sum + (project.claim?.totalCollected || 0), 0),
        knocks: repKnocks.length,
        conversations: repKnocks.filter((knock) => knock.status === 'conversation').length,
        inspections: repKnocks.filter((knock) => knock.status === 'inspection').length,
      };
    }).sort((a, b) => b.pipeline - a.pipeline || b.won - a.won);
  }, [knocks, projects, visibleMembers]);

  const wonProjects = projects.filter((project) => ['contract_signed', 'completed'].includes(project.status));
  const pipeline = projects.reduce((sum, project) => sum + (project.claim?.rcv || 0), 0);
  const collected = projects.reduce((sum, project) => sum + (project.claim?.totalCollected || 0), 0);
  const winRate = projects.length ? Math.round((wonProjects.length / projects.length) * 100) : 0;
  const activeMembers = visibleMembers.filter((member) => member.status === 'active').length || performance.length;
  const totalKnocks = performance.reduce((sum, rep) => sum + rep.knocks, 0);
  const managers = visibleMembers.filter((member) => member.role === 'manager');

  const directoryRows = useMemo(() => {
    const realRows = visibleMembers.map((member) => ({
      name: memberName(member), member, role: member.role, status: member.status,
    }));
    const knownNames = new Set(realRows.map((row) => row.name));
    const projectOnlyRows = performance
      .filter((rep) => !knownNames.has(rep.name))
      .map((rep) => ({ name: rep.name, member: undefined, role: 'sales_rep' as Role, status: 'active' as const }));
    return [...realRows, ...projectOnlyRows].filter((row) => {
      const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase()) || row.member?.email.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && (roleFilter === 'all' || row.role === roleFilter);
    });
  }, [performance, roleFilter, search, visibleMembers]);

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone,
      role: member.role, status: member.status, managerId: member.managerId || '',
    });
  };

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (!orgOwnerId) return notify('Your organization is still loading. Try again in a moment.');
    try {
      await addDoc(collection(db, 'team'), {
        userId: orgOwnerId,
        firstName: invite.firstName.trim(),
        lastName: invite.lastName.trim(),
        email: invite.email.trim().toLowerCase(),
        phone: '',
        role: currentUserRole === 'manager' ? 'sales_rep' : invite.role,
        managerId: currentUserRole === 'manager' ? currentMemberId : invite.managerId,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      notify(`Invitation prepared for ${invite.email}.`);
      setInvite({ firstName: '', lastName: '', email: '', role: 'sales_rep', managerId: '' });
      setInviteOpen(false);
    } catch (error) {
      console.error('Unable to add team member', error);
      notify('We could not add that team member. Please try again.');
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingMember) return;
    try {
      await updateDoc(doc(db, 'team', editingMember.id), editForm);
      notify(`${editForm.firstName}'s profile was updated.`);
      setEditingMember(null);
    } catch (error) {
      console.error('Unable to update team member', error);
      notify('We could not save those changes. Please try again.');
    }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Team directory' },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101815] px-5 py-6 shadow-2xl shadow-black/20 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#7ff2ba]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#83f3bd]">
              <ShieldCheck className="h-4 w-4" /> Company command center
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Team &amp; Admin</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#91a09a]">Manage access, coach your sales team, and keep the entire roofing operation moving from one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveTab('performance')} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              View leaderboard
            </button>
            <button onClick={() => setInviteOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#83f3bd] px-4 py-2.5 text-sm font-bold text-[#07120d] transition hover:bg-[#a0f7cc]">
              <UserPlus className="h-4 w-4" /> Add team member
            </button>
          </div>
        </div>
        <div className="relative mt-8 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/20 p-1 sm:w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-[#0d1512] shadow-sm' : 'text-[#91a09a] hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'overview' && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={CircleDollarSign} label="Pipeline value" value={money(pipeline)} note={`${projects.length} opportunities`} tone="mint" />
            <MetricCard icon={TrendingUp} label="Cash collected" value={money(collected)} note={`${pipeline ? Math.round((collected / pipeline) * 100) : 0}% of pipeline`} tone="blue" />
            <MetricCard icon={Target} label="Company win rate" value={`${winRate}%`} note={`${wonProjects.length} signed jobs`} tone="amber" />
            <MetricCard icon={Users} label="Active teammates" value={String(activeMembers)} note={`${managers.length} managers`} tone="purple" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101412]">
              <SectionHeader eyebrow="Sales performance" title="Team leaderboard" action="See full report" onAction={() => setActiveTab('performance')} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="border-y border-white/[0.06] bg-white/[0.018] text-[11px] uppercase tracking-[0.12em] text-[#718079]">
                    <tr><th className="px-6 py-3 font-semibold">Team member</th><th className="px-4 py-3 font-semibold">Active jobs</th><th className="px-4 py-3 font-semibold">Win rate</th><th className="px-4 py-3 font-semibold">Pipeline</th><th className="px-6 py-3 text-right font-semibold">Performance</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {performance.slice(0, 5).map((rep, index) => <PerformanceRow key={rep.name} rep={rep} rank={index + 1} />)}
                    {!performance.length && <EmptyRow colSpan={5} message="Your leaderboard will populate as projects are assigned." />}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/[0.08] bg-[#101412] p-6">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#718079]">Field activity</p><h2 className="mt-1 text-lg font-semibold text-white">Knock summary</h2></div><div className="rounded-xl bg-[#83f3bd]/10 p-2.5 text-[#83f3bd]"><MapPin className="h-5 w-5" /></div></div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <MiniStat label="Doors" value={totalKnocks} />
                  <MiniStat label="Talks" value={performance.reduce((sum, rep) => sum + rep.conversations, 0)} />
                  <MiniStat label="Inspections" value={performance.reduce((sum, rep) => sum + rep.inspections, 0)} />
                </div>
                <button onClick={() => onNavigate('knock_manager')} className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]">Open field analytics <ArrowRight className="h-4 w-4 text-[#83f3bd]" /></button>
              </section>
              <section className="rounded-2xl border border-[#83f3bd]/20 bg-gradient-to-br from-[#15241d] to-[#101412] p-6">
                <Sparkles className="h-5 w-5 text-[#83f3bd]" />
                <h3 className="mt-4 text-lg font-semibold text-white">Weekly coaching focus</h3>
                <p className="mt-2 text-sm leading-6 text-[#91a09a]">Review the highest-value open claims with your lowest-converting rep and set one clear follow-up target.</p>
              </section>
            </aside>
          </div>

          <section className="rounded-2xl border border-white/[0.08] bg-[#101412]">
            <SectionHeader eyebrow="Access & ownership" title="Team snapshot" action="Manage team" onAction={() => setActiveTab('team')} />
            <TeamTable rows={directoryRows.slice(0, 5)} performance={performance} managers={managers} onEdit={openEdit} currentUserRole={currentUserRole} />
          </section>
        </div>
      )}

      {activeTab === 'team' && (
        <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101412]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#83f3bd]">Organization</p><h2 className="mt-1 text-xl font-semibold text-white">Team directory</h2><p className="mt-1 text-sm text-[#718079]">Manage roles, reporting lines, and account status.</p></div>
            <button onClick={() => setInviteOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#83f3bd] px-4 py-2.5 text-sm font-bold text-[#07120d]"><UserPlus className="h-4 w-4" /> Add member</button>
          </div>
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row">
            <label className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#63706b]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className={`${inputClass} pl-10`} /></label>
            <label className="relative sm:w-48"><Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#63706b]" /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | Role)} className={`${inputClass} appearance-none pl-10`}><option value="all">All roles</option><option value="owner">Owners</option><option value="manager">Managers</option><option value="sales_rep">Sales reps</option></select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#63706b]" /></label>
          </div>
          <TeamTable rows={directoryRows} performance={performance} managers={managers} onEdit={openEdit} currentUserRole={currentUserRole} />
        </section>
      )}

      {activeTab === 'performance' && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.7fr]">
          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101412]">
            <SectionHeader eyebrow="Live scoreboard" title="Sales performance" />
            <div className="divide-y divide-white/[0.06]">
              {performance.map((rep, index) => (
                <div key={rep.name} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4"><span className="w-6 text-center text-sm font-bold text-[#63706b]">{index + 1}</span><Avatar name={rep.name} /><div className="min-w-0"><h3 className="truncate font-semibold text-white">{rep.name}</h3><p className="mt-0.5 text-xs text-[#718079]">{rep.member ? roleLabel[rep.member.role] : 'Sales rep'} · {rep.active} active jobs</p></div></div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 lg:min-w-[520px]"><Stat label="Pipeline" value={money(rep.pipeline)} /><Stat label="Collected" value={money(rep.collected)} /><Stat label="Win rate" value={`${rep.winRate}%`} /><Stat label="Doors knocked" value={String(rep.knocks)} /></div>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-[#66d9a0] to-[#98f5c7]" style={{ width: `${Math.max(3, rep.winRate)}%` }} /></div>
                </div>
              ))}
              {!performance.length && <div className="p-12 text-center text-sm text-[#718079]">Assign projects to team members to begin tracking performance.</div>}
            </div>
          </section>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#101412] p-6"><Award className="h-6 w-6 text-[#f3c983]" /><p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#718079]">Top performer</p><h3 className="mt-1 text-2xl font-semibold text-white">{performance[0]?.name || 'No data yet'}</h3><p className="mt-2 text-sm text-[#91a09a]">{performance[0] ? `${money(performance[0].pipeline)} in total pipeline with a ${performance[0].winRate}% close rate.` : 'Performance insights will appear here.'}</p></section>
            <section className="rounded-2xl border border-white/[0.08] bg-[#101412] p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#718079]">Company conversion</p><div className="mt-5 flex items-end justify-between"><strong className="text-4xl font-semibold tracking-tight text-white">{winRate}%</strong><span className="mb-1 text-xs font-semibold text-[#83f3bd]">{wonProjects.length} wins</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[#83f3bd]" style={{ width: `${winRate}%` }} /></div></section>
          </aside>
        </div>
      )}

      {inviteOpen && <MemberModal title="Add a team member" subtitle="Create their profile and assign the right level of access." onClose={() => setInviteOpen(false)}><form onSubmit={submitInvite} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="First name"><input required value={invite.firstName} onChange={(e) => setInvite({ ...invite, firstName: e.target.value })} className={inputClass} placeholder="Jordan" /></Field><Field label="Last name"><input required value={invite.lastName} onChange={(e) => setInvite({ ...invite, lastName: e.target.value })} className={inputClass} placeholder="Taylor" /></Field></div><Field label="Work email"><input required type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} className={inputClass} placeholder="jordan@company.com" /></Field>{currentUserRole === 'owner' && <Field label="Role"><select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as Exclude<Role, 'owner'> })} className={inputClass}><option value="sales_rep">Sales rep</option><option value="manager">Manager</option></select></Field>}{invite.role === 'sales_rep' && currentUserRole === 'owner' && <Field label="Reports to"><select value={invite.managerId} onChange={(e) => setInvite({ ...invite, managerId: e.target.value })} className={inputClass}><option value="">Organization owner</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{memberName(manager)}</option>)}</select></Field>}<ModalActions onCancel={() => setInviteOpen(false)} submitLabel="Add member" /></form></MemberModal>}

      {editingMember && <MemberModal title="Edit team member" subtitle="Update contact details, access, and reporting structure." onClose={() => setEditingMember(null)}><form onSubmit={submitEdit} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="First name"><input required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className={inputClass} /></Field><Field label="Last name"><input required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className={inputClass} /></Field></div><Field label="Email"><input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} /></Field><Field label="Phone"><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass} placeholder="(555) 555-0142" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Role"><select disabled={currentUserRole !== 'owner'} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })} className={inputClass}><option value="sales_rep">Sales rep</option><option value="manager">Manager</option><option value="owner">Owner</option></select></Field><Field label="Status"><select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TeamMember['status'] })} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>{editForm.role === 'sales_rep' && currentUserRole === 'owner' && <Field label="Reports to"><select value={editForm.managerId} onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })} className={inputClass}><option value="">Organization owner</option>{managers.map((manager) => <option key={manager.id} value={manager.id}>{memberName(manager)}</option>)}</select></Field>}<ModalActions onCancel={() => setEditingMember(null)} submitLabel="Save changes" /></form></MemberModal>}

      {toast && <div className="fixed bottom-6 right-6 z-[10002] flex max-w-sm items-center gap-3 rounded-xl border border-[#83f3bd]/20 bg-[#17231e] px-4 py-3 text-sm font-medium text-white shadow-2xl"><span className="rounded-full bg-[#83f3bd] p-1 text-[#07120d]"><Check className="h-3 w-3" /></span>{toast}</div>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone }: { icon: typeof Users; label: string; value: string; note: string; tone: 'mint' | 'blue' | 'amber' | 'purple' }) {
  const tones = { mint: 'bg-[#83f3bd]/10 text-[#83f3bd]', blue: 'bg-[#81b7ff]/10 text-[#81b7ff]', amber: 'bg-[#f3c983]/10 text-[#f3c983]', purple: 'bg-[#c1a5ff]/10 text-[#c1a5ff]' };
  return <article className="rounded-2xl border border-white/[0.08] bg-[#101412] p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-[#91a09a]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p></div><div className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" /></div></div><p className="mt-4 text-xs font-medium text-[#63706b]">{note}</p></article>;
}

function SectionHeader({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="flex items-center justify-between p-5 sm:p-6"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#83f3bd]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold text-white">{title}</h2></div>{action && <button onClick={onAction} className="flex items-center gap-2 text-sm font-semibold text-[#91a09a] transition hover:text-white">{action}<ArrowRight className="h-4 w-4" /></button>}</div>;
}

function Avatar({ name }: { name: string }) { return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#83f3bd]/20 bg-[#83f3bd]/10 text-xs font-bold text-[#a0f7cc]">{initials(name)}</div>; }
function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white/[0.035] p-3 text-center"><strong className="block text-xl text-white">{value}</strong><span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-[#63706b]">{label}</span></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#63706b]">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>; }
function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) { return <tr><td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-[#718079]">{message}</td></tr>; }

function PerformanceRow({ rep, rank }: { rep: RepPerformance; rank: number }) {
  return <tr className="transition hover:bg-white/[0.018]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="w-4 text-xs font-bold text-[#63706b]">{rank}</span><Avatar name={rep.name} /><div><p className="font-medium text-white">{rep.name}</p><p className="text-xs text-[#63706b]">{rep.member ? roleLabel[rep.member.role] : 'Sales rep'}</p></div></div></td><td className="px-4 py-4 text-sm font-medium text-white">{rep.active}</td><td className="px-4 py-4 text-sm font-medium text-white">{rep.winRate}%</td><td className="px-4 py-4 text-sm font-semibold text-white">{money(rep.pipeline)}</td><td className="px-6 py-4"><div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[#83f3bd]" style={{ width: `${Math.max(4, rep.winRate)}%` }} /></div></td></tr>;
}

function TeamTable({ rows, performance, managers, onEdit, currentUserRole }: { rows: { name: string; member?: TeamMember; role: Role; status: TeamMember['status'] }[]; performance: RepPerformance[]; managers: TeamMember[]; onEdit: (member: TeamMember) => void; currentUserRole: Role }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.018] text-[11px] uppercase tracking-[0.12em] text-[#718079]"><tr><th className="px-6 py-3 font-semibold">Member</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Reports to</th><th className="px-4 py-3 font-semibold">Pipeline</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-6 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-white/[0.05]">{rows.map((row) => { const stats = performance.find((rep) => rep.name === row.name); const manager = managers.find((item) => item.id === row.member?.managerId); return <tr key={row.member?.id || row.name} className="transition hover:bg-white/[0.018]"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={row.name} /><div><p className="font-medium text-white">{row.name}</p><p className="text-xs text-[#718079]">{row.member?.email || 'Project-assigned teammate'}</p></div></div></td><td className="px-4 py-4"><span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-xs font-medium text-[#b0bcb7]">{roleLabel[row.role]}</span></td><td className="px-4 py-4 text-sm text-[#91a09a]">{manager ? memberName(manager) : row.role === 'owner' ? '—' : 'Organization owner'}</td><td className="px-4 py-4 text-sm font-semibold text-white">{money(stats?.pipeline || 0)}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${row.status === 'active' ? 'text-[#83f3bd]' : 'text-[#718079]'}`}><span className={`h-1.5 w-1.5 rounded-full ${row.status === 'active' ? 'bg-[#83f3bd]' : 'bg-[#63706b]'}`} />{row.status === 'active' ? 'Active' : 'Inactive'}</span></td><td className="px-6 py-4 text-right">{row.member && currentUserRole !== 'sales_rep' ? <button onClick={() => onEdit(row.member!)} aria-label={`Edit ${row.name}`} className="rounded-lg p-2 text-[#718079] transition hover:bg-white/[0.06] hover:text-white"><Edit3 className="h-4 w-4" /></button> : <button className="rounded-lg p-2 text-[#4e5955]" disabled><MoreHorizontal className="h-4 w-4" /></button>}</td></tr>; })}{!rows.length && <EmptyRow colSpan={6} message="No team members match your filters." />}</tbody></table></div>;
}

function MemberModal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1512] shadow-2xl"><div className="flex items-start justify-between border-b border-white/[0.07] p-6"><div><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-[#718079]">{subtitle}</p></div><button onClick={onClose} className="rounded-lg p-2 text-[#718079] hover:bg-white/[0.05] hover:text-white"><X className="h-5 w-5" /></button></div><div className="p-6">{children}</div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-[#91a09a]">{label}</span>{children}</label>; }
function ModalActions({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) { return <div className="flex justify-end gap-3 border-t border-white/[0.07] pt-5"><button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#b0bcb7] hover:bg-white/[0.04]">Cancel</button><button type="submit" className="rounded-xl bg-[#83f3bd] px-4 py-2.5 text-sm font-bold text-[#07120d] hover:bg-[#a0f7cc]">{submitLabel}</button></div>; }
