import { useMemo, useState } from 'react';
import { Calendar, ChevronRight, Download, FileText, Plus, Search, Sparkles } from 'lucide-react';
import { DamageReport, Project } from '../types';

interface DamageReportsProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

type ReportRow = { project: Project; report: DamageReport };

export function DamageReports({ projects, onNavigate }: DamageReportsProps) {
  const [query, setQuery] = useState('');
  const reports = useMemo(() => projects.flatMap(project => {
    const history = project.damageReports?.length ? project.damageReports : (project.damageReport ? [project.damageReport] : []);
    return history.map(report => ({ project, report }));
  }).sort((a, b) => new Date(b.report.createdAt || b.report.inspectionDate).getTime() - new Date(a.report.createdAt || a.report.inspectionDate).getTime()), [projects]);
  const visible = reports.filter(({ project }) => `${project.customer.firstName} ${project.customer.lastName} ${project.customer.address}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="rounded-3xl border border-[#262626] bg-gradient-to-br from-emerald-400/10 via-[#111] to-[#111] p-6 md:p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-[11px] font-bold uppercase tracking-widest mb-3"><Sparkles className="h-4 w-4" /> AI-powered reporting</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Damage reports, instantly.</h1>
          <p className="text-sm text-[#a3a3a3] mt-2 max-w-xl">Upload inspection photos and AI creates a polished, lead-linked report your homeowner can understand.</p>
        </div>
        <button onClick={() => onNavigate('generate_report')} className="shrink-0 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black h-12 px-5 font-bold text-sm flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> New instant report</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-4"><div className="text-2xl font-semibold text-white">{reports.length}</div><div className="text-xs text-[#777] mt-1">Reports saved</div></div>
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-4"><div className="text-2xl font-semibold text-white">{new Set(reports.map(item => item.project.id)).size}</div><div className="text-xs text-[#777] mt-1">Leads with reports</div></div>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#111] overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center gap-3">
          <Search className="h-4 w-4 text-[#777]" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search homeowner or property…" className="w-full bg-transparent text-sm text-white placeholder:text-[#666] outline-none" />
        </div>
        {visible.length === 0 ? (
          <div className="py-16 px-6 text-center"><div className="h-12 w-12 rounded-2xl bg-emerald-400/10 grid place-items-center mx-auto mb-4"><FileText className="h-6 w-6 text-emerald-400" /></div><h2 className="text-white font-semibold">{reports.length ? 'No matching reports' : 'Your reports will show up here'}</h2><p className="text-xs text-[#777] mt-2">Create one from photos in just a few clicks.</p></div>
        ) : visible.map(({ project, report }, index) => (
          <button key={`${project.id}-${report.id}-${index}`} onClick={() => onNavigate('generate_report', project.id)} className="w-full p-4 md:p-5 border-b last:border-0 border-[#262626] hover:bg-white/[.03] text-left flex items-center gap-4 transition-colors">
            <div className="h-11 w-11 rounded-xl bg-emerald-400/10 grid place-items-center shrink-0"><FileText className="h-5 w-5 text-emerald-400" /></div>
            <div className="min-w-0 flex-1"><div className="font-semibold text-sm text-white truncate">{project.customer.firstName} {project.customer.lastName}</div><div className="text-xs text-[#888] truncate mt-1">{project.customer.address}</div></div>
            <div className="hidden sm:block text-right"><div className="flex items-center justify-end gap-1.5 text-xs text-[#aaa]"><Calendar className="h-3.5 w-3.5" /> {new Date(report.createdAt || report.inspectionDate).toLocaleDateString()}</div><div className="text-[10px] text-[#666] mt-1">{report.photosUploaded} photos · {report.inspectorName}</div></div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white"><Download className="h-4 w-4" /><span className="hidden md:inline">Open & download</span><ChevronRight className="h-4 w-4 text-[#666]" /></div>
          </button>
        ))}
      </div>
    </div>
  );
}
