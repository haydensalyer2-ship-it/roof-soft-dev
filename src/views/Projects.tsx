import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  FilePlus2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import { ClaimStatus, Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

type PipelineFilter = 'all' | 'pre_claim' | 'active_claim' | 'won' | 'complete';
type SortOption = 'updated' | 'newest' | 'name' | 'value';

const statusMeta: Record<string, { label: string; dot: string; badge: string }> = {
  new: { label: 'New lead', dot: 'bg-slate-400', badge: 'border-slate-700 bg-slate-800/60 text-slate-300' },
  inspection: { label: 'Inspection', dot: 'bg-blue-400', badge: 'border-blue-500/25 bg-blue-500/10 text-blue-300' },
  claim_filed: { label: 'Claim filed', dot: 'bg-violet-400', badge: 'border-violet-500/25 bg-violet-500/10 text-violet-300' },
  adjustment: { label: 'In adjustment', dot: 'bg-amber-400', badge: 'border-amber-500/25 bg-amber-500/10 text-amber-300' },
  approved_or_denied: { label: 'Decision', dot: 'bg-cyan-400', badge: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300' },
  contract_signed: { label: 'Contract signed', dot: 'bg-emerald-400', badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' },
  completed: { label: 'Completed', dot: 'bg-green-400', badge: 'border-green-500/25 bg-green-500/10 text-green-300' },
};

const filterOptions: { id: PipelineFilter; label: string }[] = [
  { id: 'all', label: 'All projects' },
  { id: 'pre_claim', label: 'Pre-claim' },
  { id: 'active_claim', label: 'Active claims' },
  { id: 'won', label: 'Signed' },
  { id: 'complete', label: 'Completed' },
];

const getTime = (value: unknown) => {
  if (!value) return 0;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  const time = new Date(value as string | number | Date).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDate = (value: unknown) => {
  const time = getTime(value);
  return time ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(time) : 'Not available';
};

const money = (value = 0) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(value);

function matchesFilter(status: ClaimStatus, filter: PipelineFilter) {
  if (filter === 'pre_claim') return ['new', 'inspection'].includes(status);
  if (filter === 'active_claim') return ['claim_filed', 'adjustment', 'approved_or_denied'].includes(status);
  if (filter === 'won') return status === 'contract_signed';
  if (filter === 'complete') return status === 'completed';
  return true;
}

export function Projects({ projects, onNavigate }: ProjectsProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PipelineFilter>('all');
  const [sort, setSort] = useState<SortOption>('updated');

  const metrics = useMemo(() => {
    const claims = projects.filter(project => project.claim);
    const pipelineValue = projects.reduce((total, project) => total + (project.claim?.rcv || 0), 0);
    return {
      total: projects.length,
      activeClaims: projects.filter(project => matchesFilter(project.status, 'active_claim')).length,
      signed: projects.filter(project => project.status === 'contract_signed').length,
      pipelineValue,
      claimRate: projects.length ? Math.round((claims.length / projects.length) * 100) : 0,
    };
  }, [projects]);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects
      .filter(project => {
        const customer = project.customer;
        const haystack = [
          customer.firstName,
          customer.lastName,
          customer.address,
          customer.city,
          customer.state,
          project.claim?.insuranceCompany,
          project.claim?.claimNumber,
          project.repName,
        ].filter(Boolean).join(' ').toLowerCase();
        return matchesFilter(project.status, filter) && (!query || haystack.includes(query));
      })
      .sort((a, b) => {
        if (sort === 'name') return `${a.customer.lastName} ${a.customer.firstName}`.localeCompare(`${b.customer.lastName} ${b.customer.firstName}`);
        if (sort === 'value') return (b.claim?.rcv || 0) - (a.claim?.rcv || 0);
        if (sort === 'newest') return getTime(b.createdAt) - getTime(a.createdAt);
        return getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt);
      });
  }, [filter, projects, search, sort]);

  const openProject = (project: Project) => onNavigate('project_detail', project.id);

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-10">
      <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            Sales pipeline
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Projects &amp; Claims</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">Track every property from first inspection through carrier approval, contract, and closeout.</p>
        </div>
        <button
          onClick={() => onNavigate('new_lead')}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-black shadow-lg shadow-black/20 transition hover:bg-zinc-200"
        >
          <FilePlus2 className="h-4 w-4" /> New project
        </button>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon={BriefcaseBusiness} label="Total projects" value={String(metrics.total)} note={`${metrics.claimRate}% have a claim`} tone="blue" />
        <MetricCard icon={ShieldCheck} label="Active claims" value={String(metrics.activeClaims)} note="Filed through decision" tone="violet" />
        <MetricCard icon={ClipboardCheck} label="Contracts signed" value={String(metrics.signed)} note="Ready for production" tone="emerald" />
        <MetricCard icon={CircleDollarSign} label="Pipeline value" value={money(metrics.pipelineValue)} note="Total replacement cost" tone="amber" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] shadow-2xl shadow-black/20">
        <div className="border-b border-zinc-800 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-700 bg-[#09090b] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-white/5"
                placeholder="Search customer, property, carrier, or claim #"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-[#09090b] p-1 scrollbar-hide">
                {filterOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setFilter(option.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${filter === option.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="relative shrink-0">
                <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <select
                  value={sort}
                  onChange={event => setSort(event.target.value as SortOption)}
                  className="h-11 appearance-none rounded-xl border border-zinc-700 bg-[#09090b] pl-9 pr-9 text-xs font-bold text-zinc-300 outline-none focus:border-zinc-500"
                  aria-label="Sort projects"
                >
                  <option value="updated">Recently updated</option>
                  <option value="newest">Newest first</option>
                  <option value="name">Customer name</option>
                  <option value="value">Highest value</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
            <span><strong className="text-zinc-300">{visibleProjects.length}</strong> {visibleProjects.length === 1 ? 'project' : 'projects'} shown</span>
            {(search || filter !== 'all') && (
              <button onClick={() => { setSearch(''); setFilter('all'); }} className="font-bold text-zinc-300 hover:text-white">Clear filters</button>
            )}
          </div>
        </div>

        {visibleProjects.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#0c0c0e] text-left text-[9px] font-extrabold uppercase tracking-[0.14em] text-zinc-600">
                    <th className="px-5 py-3.5">Customer &amp; property</th>
                    <th className="px-5 py-3.5">Claim</th>
                    <th className="px-5 py-3.5">Stage</th>
                    <th className="px-5 py-3.5">Project value</th>
                    <th className="px-5 py-3.5">Owner</th>
                    <th className="px-5 py-3.5">Last activity</th>
                    <th className="w-12 px-3 py-3.5"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {visibleProjects.map(project => <ProjectRow key={project.id} project={project} onOpen={() => openProject(project)} />)}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-zinc-800 md:hidden">
              {visibleProjects.map(project => <ProjectCard key={project.id} project={project} onOpen={() => openProject(project)} />)}
            </div>
          </>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500"><SlidersHorizontal className="h-5 w-5" /></div>
            <h2 className="text-sm font-bold text-white">No matching projects</h2>
            <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">Try a different search or clear your pipeline filters to see more results.</p>
            <button onClick={() => { setSearch(''); setFilter('all'); }} className="mt-4 text-xs font-bold text-zinc-300 hover:text-white">Reset filters</button>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone }: { icon: typeof BriefcaseBusiness; label: string; value: string; note: string; tone: 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const tones = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <article className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#151517] to-[#0e0e10] p-4 sm:p-5">
      <div className={`mb-5 grid h-8 w-8 place-items-center rounded-lg border ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      <strong className="block truncate text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">{value}</strong>
      <div className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-400">{label}</div>
      <p className="mt-1 hidden text-[10px] text-zinc-600 sm:block">{note}</p>
    </article>
  );
}

function ProjectRow({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const meta = statusMeta[project.status] || statusMeta.new;
  const fullAddress = [project.customer.address, project.customer.city, project.customer.state].filter(Boolean).join(', ');
  return (
    <tr onClick={onOpen} className="group cursor-pointer bg-[#111113] transition hover:bg-[#18181b]">
      <td className="px-5 py-4">
        <div className="font-bold text-sm text-zinc-100">{project.customer.firstName} {project.customer.lastName}</div>
        <div className="mt-1 max-w-[260px] truncate text-[11px] text-zinc-500">{fullAddress || 'Address not added'}</div>
      </td>
      <td className="px-5 py-4">
        <div className="text-xs font-semibold text-zinc-300">{project.claim?.insuranceCompany || 'Not filed'}</div>
        <div className="mt-1 font-mono text-[10px] text-zinc-600">{project.claim?.claimNumber ? `#${project.claim.claimNumber}` : 'No claim number'}</div>
      </td>
      <td className="px-5 py-4"><StatusBadge meta={meta} /></td>
      <td className="px-5 py-4">
        <div className="text-xs font-bold text-zinc-200">{project.claim?.rcv ? money(project.claim.rcv) : '—'}</div>
        <div className="mt-1 text-[9px] uppercase tracking-wider text-zinc-600">RCV</div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400"><UserRound className="h-3.5 w-3.5 text-zinc-600" />{project.repName || 'Unassigned'}</div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500"><CalendarDays className="h-3.5 w-3.5 text-zinc-600" />{formatDate(project.updatedAt || project.createdAt)}</div>
      </td>
      <td className="px-3 py-4"><ArrowRight className="h-4 w-4 text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-white" /></td>
    </tr>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const meta = statusMeta[project.status] || statusMeta.new;
  return (
    <button onClick={onOpen} className="w-full p-4 text-left transition hover:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{project.customer.firstName} {project.customer.lastName}</div>
          <div className="mt-1 truncate text-[11px] text-zinc-500">{project.customer.address || 'Address not added'}</div>
        </div>
        <StatusBadge meta={meta} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-3">
        <CardDetail label="Carrier" value={project.claim?.insuranceCompany || 'Not filed'} />
        <CardDetail label="RCV" value={project.claim?.rcv ? money(project.claim.rcv) : '—'} />
        <CardDetail label="Updated" value={formatDate(project.updatedAt || project.createdAt)} />
      </div>
    </button>
  );
}

function StatusBadge({ meta }: { meta: { label: string; dot: string; badge: string } }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${meta.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span>;
}

function CardDetail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-600">{label}</span><strong className="mt-1 block truncate text-[10px] font-semibold text-zinc-300">{value}</strong></div>;
}
