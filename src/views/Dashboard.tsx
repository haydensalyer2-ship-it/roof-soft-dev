import { Project } from '../types';
import {
  ArrowRight, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign,
  FilePlus2, MapPin, Sparkles, Target, TrendingUp, Trophy, Zap
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
  repRole?: string;
  repName?: string;
}

type Appointment = {
  type: 'inspection' | 'adjustment';
  date: Date;
  customer: string;
  address: string;
  id: string;
};

const wonStatuses = ['approved_or_denied', 'contract_signed', 'completed'];
const statusLabels: Record<string, string> = {
  new: 'New lead', inspection: 'Inspection', claim_filed: 'Claim filed', adjustment: 'Adjusting',
  approved_or_denied: 'Approved', contract_signed: 'Contract signed', completed: 'Completed'
};

const money = (value: number, compact = false) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  notation: compact ? 'compact' : 'standard'
}).format(value);

export function Dashboard({ projects, onNavigate, repRole = 'Manager', repName = '' }: DashboardProps) {
  const isManager = repRole === 'Manager';
  const viewProjects = isManager ? projects : projects.filter(project => project.repName === repName);
  const wonProjects = viewProjects.filter(project => wonStatuses.includes(project.status));
  const totalPipeline = viewProjects.reduce((sum, project) => sum + (project.claim?.rcv || 0), 0);
  const totalCollected = viewProjects.reduce((sum, project) => sum + (project.claim?.totalCollected || 0), 0);
  const winRate = viewProjects.length ? Math.round((wonProjects.length / viewProjects.length) * 100) : 0;
  const averageJob = wonProjects.length ? totalPipeline / wonProjects.length : 0;

  const appointments: Appointment[] = [];
  viewProjects.forEach(project => {
    const base = { customer: `${project.customer.firstName} ${project.customer.lastName}`, address: project.customer.address, id: project.id };
    if (project.damageReport?.inspectionDate && new Date(project.damageReport.inspectionDate) >= new Date()) {
      appointments.push({ ...base, type: 'inspection', date: new Date(project.damageReport.inspectionDate) });
    }
    if (project.claim?.adjustmentDate && new Date(project.claim.adjustmentDate) >= new Date()) {
      appointments.push({ ...base, type: 'adjustment', date: new Date(project.claim.adjustmentDate) });
    }
  });
  appointments.sort((a, b) => a.date.getTime() - b.date.getTime());

  const reps = Array.from(new Set(projects.map(project => project.repName).filter(Boolean) as string[])).map(name => {
    const repProjects = projects.filter(project => project.repName === name);
    const sold = repProjects.filter(project => wonStatuses.includes(project.status));
    return {
      name,
      leads: repProjects.length,
      wins: sold.length,
      revenue: sold.reduce((sum, project) => sum + (project.claim?.rcv || 0), 0)
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const pipeline = [
    { label: 'New leads', statuses: ['new'], color: '#60a5fa' },
    { label: 'Inspections', statuses: ['inspection'], color: '#a78bfa' },
    { label: 'Claims', statuses: ['claim_filed', 'adjustment'], color: '#f59e0b' },
    { label: 'Won', statuses: wonStatuses, color: '#34d399' }
  ].map(stage => ({ ...stage, count: viewProjects.filter(project => stage.statuses.includes(project.status)).length }));
  const pipelineMax = Math.max(1, ...pipeline.map(stage => stage.count));
  const firstName = repName.split(' ')[0] || (isManager ? 'team' : 'there');

  return (
    <div className="team-dashboard">
      <section className="team-hero">
        <div className="team-hero-copy">
          <div className="team-live"><span /> Live workspace · {isManager ? 'Team overview' : 'Personal overview'}</div>
          <h1>Good morning, <em>{firstName}.</em></h1>
          <p>{isManager ? 'Your team is moving deals forward. Here’s everything that needs your attention today.' : 'Here’s your book of business and what needs your attention today.'}</p>
        </div>
        <div className="team-hero-actions">
          <button className="team-secondary-button" onClick={() => onNavigate('reports')}><FilePlus2 /> Create report</button>
          <button className="team-primary-button" onClick={() => onNavigate('new_lead')}><Zap /> Add new lead</button>
        </div>
      </section>

      <section className="team-metrics">
        <Metric icon={<TrendingUp />} label="Total pipeline" value={money(totalPipeline, true)} note={`${viewProjects.length} active opportunities`} trend="+12.4%" tone="blue" />
        <Metric icon={<CircleDollarSign />} label="Cash collected" value={money(totalCollected, true)} note="Across all closed work" trend="+8.7%" tone="green" />
        <Metric icon={<Target />} label="Close rate" value={`${winRate}%`} note={`${wonProjects.length} deals moved to won`} trend="+4.2%" tone="purple" />
        <Metric icon={<BriefcaseBusiness />} label="Average job" value={money(averageJob, true)} note="Based on won projects" trend="On track" tone="orange" />
      </section>

      <section className="team-main-grid">
        <div className="team-stack">
          <div className="team-panel pipeline-panel">
            <PanelHeader eyebrow="Sales performance" title="Pipeline health" action="Open pipeline" onClick={() => onNavigate('projects')} />
            <div className="pipeline-body">
              <div className="pipeline-total">
                <span>Open pipeline value</span><strong>{money(totalPipeline)}</strong>
                <small><TrendingUp /> Healthy momentum this month</small>
              </div>
              <div className="pipeline-bars">
                {pipeline.map(stage => (
                  <div className="pipeline-row" key={stage.label}>
                    <div><span>{stage.label}</span><strong>{stage.count}</strong></div>
                    <div className="pipeline-track"><i style={{ width: `${Math.max(5, stage.count / pipelineMax * 100)}%`, background: stage.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="team-panel activity-panel">
            <PanelHeader eyebrow="Work in motion" title="Recent opportunities" action="View all" onClick={() => onNavigate('projects')} />
            <div className="opportunity-list">
              {viewProjects.length === 0 ? <EmptyState text="No opportunities assigned yet." /> : viewProjects.slice(0, 5).map(project => (
                <button key={project.id} className="opportunity-row" onClick={() => onNavigate('project_detail', project.id)}>
                  <span className="opportunity-avatar">{project.customer.firstName[0]}{project.customer.lastName[0]}</span>
                  <span className="opportunity-person"><strong>{project.customer.firstName} {project.customer.lastName}</strong><small><MapPin /> {project.customer.address}, {project.customer.city}</small></span>
                  <span className="opportunity-rep"><small>Owner</small><strong>{project.repName || 'Unassigned'}</strong></span>
                  <span className="opportunity-value"><small>Claim value</small><strong>{money(project.claim?.rcv || 0)}</strong></span>
                  <span className={`status-pill status-${project.status}`}><i />{statusLabels[project.status] || project.status}</span>
                  <ChevronRight className="row-chevron" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="team-side-stack">
          <div className="team-panel schedule-panel">
            <PanelHeader eyebrow="Up next" title="Today & upcoming" action="View projects" onClick={() => onNavigate('projects')} />
            <div className="schedule-list">
              {appointments.length === 0 ? <EmptyState text="Your schedule is clear." /> : appointments.slice(0, 3).map((appointment, index) => (
                <button key={`${appointment.id}-${appointment.type}`} onClick={() => onNavigate('project_detail', appointment.id)} className="schedule-row">
                  <span className={`schedule-date ${index === 0 ? 'is-next' : ''}`}><strong>{appointment.date.getDate()}</strong><small>{appointment.date.toLocaleString('en-US', { month: 'short' })}</small></span>
                  <span className="schedule-copy"><small>{appointment.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {appointment.type}</small><strong>{appointment.customer}</strong><span>{appointment.address}</span></span>
                  <ArrowRight />
                </button>
              ))}
            </div>
          </div>

          <div className="team-panel leaderboard-panel">
            <PanelHeader eyebrow="This month" title="Team leaderboard" action="Manage team" onClick={() => onNavigate('admin_dashboard')} />
            <div className="leaderboard-list">
              {reps.length === 0 ? <EmptyState text="No team activity yet." /> : reps.slice(0, 5).map((rep, index) => (
                <div className="leader-row" key={rep.name}>
                  <span className={`leader-rank rank-${index + 1}`}>{index === 0 ? <Trophy /> : index + 1}</span>
                  <span className="leader-avatar">{rep.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
                  <span className="leader-person"><strong>{rep.name}</strong><small>{rep.wins} wins · {rep.leads} leads</small></span>
                  <strong className="leader-revenue">{money(rep.revenue, true)}</strong>
                </div>
              ))}
            </div>
            <div className="team-pulse"><span><Sparkles /></span><div><strong>Team pulse</strong><p>{reps.length ? `${reps[0].name} is leading the board. Keep the momentum going.` : 'Add your team to start tracking performance.'}</p></div></div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note, trend, tone }: { icon: React.ReactNode; label: string; value: string; note: string; trend: string; tone: string }) {
  return <article className={`team-metric metric-${tone}`}><div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-trend">{trend}</span></div><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function PanelHeader({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action: string; onClick: () => void }) {
  return <header className="team-panel-header"><div><span>{eyebrow}</span><h2>{title}</h2></div><button onClick={onClick}>{action}<ArrowRight /></button></header>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="team-empty"><span><Check /></span><strong>All caught up</strong><small>{text}</small></div>;
}
