import { useEffect, useRef, useState } from 'react';
import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  AlertCircle, ArrowLeft, Building2, Check, ChevronDown, Download, FileText,
  ImagePlus, Loader2, Save, Sparkles, Trash2, UploadCloud
} from 'lucide-react';
import { db } from '../lib/firebase';
import { CollateralItem, DamageReport, Project, TestSquare } from '../types';

interface ReportGeneratorProps {
  project?: Project;
  projects?: Project[];
  onNavigate: (view: string, id?: string) => void;
  companyName: string;
  companyWebsite: string;
  companyPhone: string;
  companyAddress: string;
  logoImage: string | null;
  repName: string;
  repPhone: string;
  repEmail: string;
  repRole: string;
}

type AiResult = {
  roofType?: string;
  roofAgeEstimate?: number;
  damageSummary?: string;
  damageTypes?: string[];
  testSquares?: Omit<TestSquare, 'id'>[];
  collateralDamage?: CollateralItem[];
  recommendation?: string;
  notes?: string;
};

const emptyReport = (repName: string): DamageReport => ({
  id: crypto.randomUUID(),
  inspectionDate: new Date().toISOString(),
  inspectorName: repName,
  roofAgeEstimate: 0,
  roofType: '',
  testSquares: [],
  collateralDamage: [],
  notes: '',
  photosUploaded: 0,
  damageSummary: '',
  recommendation: '',
  damageTypes: [],
  status: 'draft',
});

export function ReportGenerator({
  project, projects = [], onNavigate, companyName, companyWebsite, companyPhone,
  companyAddress, logoImage, repName, repPhone, repEmail, repRole,
}: ReportGeneratorProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(project?.id || '');
  const selectedProject = project || projects.find(item => item.id === selectedProjectId);
  const [photos, setPhotos] = useState<string[]>([]);
  const [fieldNotes, setFieldNotes] = useState('');
  const [report, setReport] = useState<DamageReport>(() => project?.damageReport || emptyReport(repName));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedProject) return;
    const saved = selectedProject.damageReport;
    setReport(saved ? { ...saved } : emptyReport(repName));
    setFieldNotes(saved?.notes || '');
    setPhotos([]);
    setMessage(null);
  }, [selectedProject?.id, repName]);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setMessage(null);
    Array.from(files).slice(0, Math.max(0, 12 - photos.length)).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(current => [...current, String(reader.result)]);
      reader.readAsDataURL(file);
    });
  };

  const saveReport = async (nextReport: DamageReport, addToHistory = false) => {
    if (!selectedProject) throw new Error('Select a lead first.');
    const payload: Record<string, unknown> = {
      damageReport: nextReport,
      updatedAt: serverTimestamp(),
    };
    if (addToHistory) payload.damageReports = arrayUnion(nextReport);
    await updateDoc(doc(db, 'projects', selectedProject.id), payload);
  };

  const generateWithAi = async () => {
    if (!selectedProject) {
      setMessage({ type: 'error', text: 'Choose a lead before generating a report.' });
      return;
    }
    if (!photos.length && !fieldNotes.trim()) {
      setMessage({ type: 'error', text: 'Add at least one photo or a quick field note for AI to review.' });
      return;
    }
    setIsAnalyzing(true);
    setMessage(null);
    try {
      const images = photos.map(photo => {
        const [header, data] = photo.split(',');
        return { inlineData: { data, mimeType: header.match(/data:(.*?);/)?.[1] || 'image/jpeg' } };
      });
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          context: `${fieldNotes || 'No additional notes.'}\nProperty: ${selectedProject.customer.address}, ${selectedProject.customer.city}, ${selectedProject.customer.state}`,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'AI could not generate the report.');
      const parsed: AiResult = typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
      const next: DamageReport = {
        ...report,
        id: crypto.randomUUID(),
        inspectionDate: new Date().toISOString(),
        inspectorName: repName,
        roofType: parsed.roofType || 'Not determined',
        roofAgeEstimate: Number(parsed.roofAgeEstimate) || 0,
        damageSummary: parsed.damageSummary || parsed.notes || '',
        notes: fieldNotes,
        recommendation: parsed.recommendation || '',
        damageTypes: parsed.damageTypes || [],
        testSquares: (parsed.testSquares || []).map((square, index) => ({ ...square, id: `square-${index + 1}` })),
        collateralDamage: parsed.collateralDamage || [],
        photosUploaded: photos.length,
        createdAt: new Date().toISOString(),
        status: 'ready',
      };
      setReport(next);
      await saveReport(next, true);
      setMessage({ type: 'success', text: 'AI report generated and saved to this lead.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveEdits = async () => {
    if (!selectedProject) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await saveReport({ ...report, notes: fieldNotes, status: 'ready' });
      setMessage({ type: 'success', text: 'Edits saved to the lead.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save edits.' });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!selectedProject || !printRef.current) return;
    setIsDownloading(true);
    setMessage(null);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'pt', 'letter');
      const width = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = canvas.height * width / canvas.width;
      const image = canvas.toDataURL('image/jpeg', 0.94);
      let remaining = imageHeight;
      let y = 0;
      pdf.addImage(image, 'JPEG', 0, y, width, imageHeight);
      remaining -= pageHeight;
      while (remaining > 0) {
        y = remaining - imageHeight;
        pdf.addPage();
        pdf.addImage(image, 'JPEG', 0, y, width, imageHeight);
        remaining -= pageHeight;
      }
      pdf.save(`${selectedProject.customer.lastName}-damage-report.pdf`);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to download PDF.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const totalHail = report.testSquares.reduce((sum, square) => sum + Number(square.hailHits || 0), 0);
  const totalWind = report.testSquares.reduce((sum, square) => sum + Number(square.windDamagedShingles || 0), 0);
  const canDownload = Boolean(selectedProject && report.status === 'ready');

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-6">
      <button onClick={() => onNavigate(project ? 'project_detail' : 'reports', project?.id)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a3a3a3] hover:text-white mb-5">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> AI damage reports
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Photos in. Report out.</h1>
          <p className="text-sm text-[#a3a3a3] mt-2">Pick a lead, add inspection photos, and let AI write the report.</p>
        </div>
        <button onClick={downloadPdf} disabled={!canDownload || isDownloading} className="h-11 px-5 rounded-xl bg-white text-black text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-neutral-200">
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PDF
        </button>
      </div>

      <div className="grid lg:grid-cols-[420px_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-4 lg:sticky lg:top-4">
          <section className="rounded-2xl border border-[#262626] bg-[#111] p-5">
            <div className="flex items-center gap-3 mb-4"><span className="h-7 w-7 rounded-full bg-white text-black grid place-items-center text-xs font-bold">1</span><h2 className="text-sm font-bold text-white">Choose the lead</h2></div>
            <div className="relative">
              <select value={selectedProject?.id || ''} disabled={Boolean(project)} onChange={event => setSelectedProjectId(event.target.value)} className="w-full appearance-none rounded-xl border border-[#333] bg-[#191919] p-3 pr-10 text-sm text-white outline-none focus:border-white disabled:opacity-70">
                <option value="">Select a lead…</option>
                {projects.map(item => <option value={item.id} key={item.id}>{item.customer.firstName} {item.customer.lastName} · {item.customer.address}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-[#777] pointer-events-none" />
            </div>
            {selectedProject && <div className="mt-3 rounded-lg bg-black/40 px-3 py-2 text-xs text-[#aaa]">This report will be saved under <span className="text-white font-semibold">{selectedProject.customer.firstName} {selectedProject.customer.lastName}</span>.</div>}
          </section>

          <section className="rounded-2xl border border-[#262626] bg-[#111] p-5">
            <div className="flex items-center gap-3 mb-4"><span className="h-7 w-7 rounded-full bg-white text-black grid place-items-center text-xs font-bold">2</span><h2 className="text-sm font-bold text-white">Add photos + a quick note</h2></div>
            <button onClick={() => fileRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addPhotos(event.dataTransfer.files); }} className="w-full rounded-xl border border-dashed border-[#444] bg-[#181818] p-7 text-center hover:border-emerald-400/60 hover:bg-emerald-400/5 transition-colors">
              <UploadCloud className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-white">Upload inspection photos</div>
              <div className="text-xs text-[#777] mt-1">Tap or drop up to 12 photos</div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={event => addPhotos(event.target.files)} />
            {photos.length > 0 && <div className="grid grid-cols-4 gap-2 mt-3">{photos.map((photo, index) => <div className="relative aspect-square group" key={`${photo.slice(-16)}-${index}`}><img src={photo} className="h-full w-full object-cover rounded-lg" /><button onClick={() => setPhotos(current => current.filter((_, i) => i !== index))} className="absolute top-1 right-1 rounded-md bg-black/80 p-1 text-white"><Trash2 className="h-3 w-3" /></button></div>)}</div>}
            <textarea value={fieldNotes} onChange={event => setFieldNotes(event.target.value)} placeholder="Optional: Back slope took the most hail. Homeowner noticed a ceiling stain…" className="mt-3 min-h-24 w-full resize-none rounded-xl border border-[#333] bg-[#191919] p-3 text-sm text-white placeholder:text-[#666] outline-none focus:border-white" />
          </section>

          <section className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 to-transparent p-5">
            <div className="flex items-center gap-3 mb-3"><span className="h-7 w-7 rounded-full bg-emerald-400 text-black grid place-items-center text-xs font-bold">3</span><h2 className="text-sm font-bold text-white">Let AI build it</h2></div>
            <p className="text-xs leading-5 text-[#aaa] mb-4">AI reviews the evidence, drafts the findings and recommendation, then saves the finished report to the selected lead.</p>
            <button onClick={generateWithAi} disabled={isAnalyzing || !selectedProject} className="w-full h-12 rounded-xl bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-300 disabled:opacity-40">
              {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing photos…</> : <><Sparkles className="h-4 w-4" /> Generate instant report</>}
            </button>
          </section>

          {message && <div className={`rounded-xl border p-3 text-sm flex gap-2 ${message.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'}`}>{message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}{message.text}</div>}
        </div>

        <div className="rounded-2xl border border-[#292929] bg-[#141414] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#292929] flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white"><FileText className="h-4 w-4" /> Live report</div><button onClick={saveEdits} disabled={!canDownload || isSaving} className="flex items-center gap-2 rounded-lg border border-[#333] px-3 py-2 text-xs font-semibold text-white disabled:opacity-30 hover:bg-[#222]">{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save edits</button></div>
          <div className="overflow-auto bg-[#303030] p-4 md:p-8">
            <article ref={printRef} className="mx-auto min-h-[1056px] w-full max-w-[816px] bg-white text-[#18181b] shadow-2xl">
              <header className="border-b border-neutral-200 px-8 md:px-12 py-10 flex justify-between gap-6">
                <div>{logoImage ? <img src={logoImage} className="max-h-16 max-w-48 object-contain object-left" /> : <div className="flex items-center gap-2 text-2xl font-bold"><Building2 className="h-7 w-7" /> {companyName}</div>}<div className="mt-3 text-[10px] leading-4 text-neutral-500">{companyAddress}<br />{companyPhone} · {companyWebsite}</div></div>
                <div className="text-right"><div className="text-xs font-bold uppercase tracking-[.2em]">Damage report</div><div className="text-[10px] text-neutral-400 mt-2">{new Date(report.inspectionDate).toLocaleDateString()}</div></div>
              </header>
              <main className="px-8 md:px-12 py-10">
                <div className="border-l-4 border-emerald-500 pl-5 mb-9"><div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Prepared for</div><h1 className="text-3xl font-bold mt-1">{selectedProject ? `${selectedProject.customer.firstName} ${selectedProject.customer.lastName}` : 'Select a lead'}</h1><p className="text-sm text-neutral-500 mt-1">{selectedProject?.customer.address || 'Property address'}, {selectedProject?.customer.city} {selectedProject?.customer.state}</p></div>
                {photos[0] && <img src={photos[0]} className="w-full h-72 object-cover rounded-sm mb-9" />}
                <section className="mb-9"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700 mb-2">Executive summary</div><textarea value={report.damageSummary || ''} onChange={event => setReport({ ...report, damageSummary: event.target.value })} placeholder="AI-generated findings will appear here." className="w-full min-h-32 resize-none border-0 p-0 text-sm leading-6 text-neutral-700 outline-none placeholder:text-neutral-300" /></section>
                <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-9">{[['Roof system', report.roofType || '—'], ['Est. age', report.roofAgeEstimate ? `${report.roofAgeEstimate} years` : '—'], ['Hail indicators', String(totalHail)], ['Wind indicators', String(totalWind)]].map(([label, value]) => <div className="border border-neutral-200 p-3" key={label}><div className="text-[9px] uppercase tracking-wider text-neutral-400">{label}</div><div className="text-sm font-bold mt-1">{value}</div></div>)}</section>
                {report.damageTypes && report.damageTypes.length > 0 && <section className="mb-9"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400 mb-3">Observed indicators</div><div className="flex flex-wrap gap-2">{report.damageTypes.map(type => <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold" key={type}>{type}</span>)}</div></section>}
                <section className="mb-9 rounded-sm bg-neutral-900 p-6 text-white"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300 mb-2">Recommended next step</div><textarea value={report.recommendation || ''} onChange={event => setReport({ ...report, recommendation: event.target.value })} placeholder="AI-generated recommendation will appear here." className="w-full min-h-28 resize-none border-0 bg-transparent p-0 text-sm leading-6 text-neutral-200 outline-none placeholder:text-neutral-500" /></section>
                {photos.length > 1 && <section><div className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400 mb-3">Photo evidence</div><div className="grid grid-cols-2 gap-3">{photos.slice(1).map((photo, index) => <img src={photo} className="h-48 w-full object-cover" key={index} />)}</div></section>}
              </main>
              <footer className="border-t border-neutral-200 px-12 py-6 text-[9px] text-neutral-400 flex justify-between"><span>Prepared by {repName}, {repRole}</span><span>{repPhone} · {repEmail}</span></footer>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
