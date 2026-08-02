import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle2, ShieldAlert, X, Sparkles, Loader2, 
  ImagePlus, ChevronDown, Download, Building2, Home, Activity, Target, Camera,
  AlertTriangle, Info, MoveUpRight, CircleDashed
} from 'lucide-react';

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

export function ReportGenerator({ 
  project, projects = [], onNavigate, companyName, companyWebsite, companyPhone, companyAddress, logoImage,
  repName, repPhone, repEmail, repRole 
}: ReportGeneratorProps) {
  // Gamified Photo Slots
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [overviewPhotos, setOverviewPhotos] = useState<string[]>([]);
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(project?.id || '');
  
  // PDF Text Content
  const [reportInfo, setReportInfo] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const overviewInputRef = useRef<HTMLInputElement>(null);
  const damageInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedProjectData = project || projects.find(p => p.id === selectedProjectId);
  const damageReport = selectedProjectData?.damageReport;

  useEffect(() => {
    if (damageReport?.notes && !reportInfo) {
      setReportInfo(damageReport.notes);
    }
  }, [damageReport, selectedProjectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'overview' | 'damage') => {
    if (e.target.files && e.target.files.length > 0) {
      if (!selectedProjectId) {
        setError("Please select a lead before uploading images.");
        return;
      }
      setError(null);
      Array.from(e.target.files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'cover') {
            setCoverPhoto(reader.result as string); // Only take latest for cover
          } else if (type === 'overview') {
            setOverviewPhotos(prev => [...prev, reader.result as string]);
          } else if (type === 'damage') {
            setDamagePhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (type: 'cover' | 'overview' | 'damage', index?: number) => {
    if (type === 'cover') setCoverPhoto(null);
    else if (type === 'overview' && index !== undefined) setOverviewPhotos(prev => prev.filter((_, i) => i !== index));
    else if (type === 'damage' && index !== undefined) setDamagePhotos(prev => prev.filter((_, i) => i !== index));
  };

  

  const handleGeneratePDF = async () => {
    if (!selectedProjectId) {
      setError("You must select a lead before generating the report.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    // Wait for React state to flush and transform to be removed
    // Scroll to top to ensure capturing works flawlessly
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = printRef.current;
    if (!element) {
      setIsGenerating(false);
      return;
    }

    const height = Math.max(element.offsetHeight, element.scrollHeight) || 1056;
    
    try {
            document.body.style.overflow = 'visible';
      const mainEl = document.querySelector('main');
      const layoutEl = document.querySelector<HTMLElement>('.flex.h-screen');
      if (mainEl) mainEl.style.overflow = 'visible';
      if (layoutEl) layoutEl.style.overflow = 'visible';
      if (layoutEl) layoutEl.style.height = 'auto';
      
      await new Promise(resolve => setTimeout(resolve, 300));
      // Temporarily ensure scrolled to top to avoid clipping
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        windowWidth: 816,
        scrollX: 0,
        scrollY: 0,
     });
      
      window.scrollTo(0, originalScrollY);
      document.body.style.overflow = '';
      if (mainEl) mainEl.style.overflow = '';
      if (layoutEl) layoutEl.style.overflow = '';
      if (layoutEl) layoutEl.style.height = '100vh';
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdfWidth = 816;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        unit: 'px',
        format: [pdfWidth, pdfHeight],
        orientation: 'portrait'
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Inspection_Report_${selectedProjectData?.customer?.lastName || 'Client'}.pdf`);

      // Save damage report photo stats back to lead
      if (project?.id) {
        try {
          const projectRef = doc(db, 'projects', project.id);
          const damageReportData = project.damageReport || {};
          await updateDoc(projectRef, {
            damageReport: {
              ...damageReportData,
              photosUploaded: overviewPhotos.length + damagePhotos.length,
            },
            updatedAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.log('Unable to save to firestore:', dbErr);
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      setError(`PDF Generation Error: ${errMsg}`);
      console.error("PDF Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // GAMIFICATION LOGIC
  let score = 0;
  if (coverPhoto) score += 20;
  if (overviewPhotos.length > 0) score += 20;
  if (damagePhotos.length > 0) score += 20;
  if (reportInfo && reportInfo.length > 10) score += 20;
  if (recommendation && recommendation.length > 10) score += 20;

  let tier = 'Incomplete';
  let tierColor = 'text-[#f87171]';
  let tierBg = 'bg-[#f87171]';
  if (score >= 40) { tier = 'Basic'; tierColor = 'text-[#facc15]'; tierBg = 'bg-[#facc15]'; }
  if (score >= 80) { tier = 'Professional'; tierColor = 'text-[#60a5fa]'; tierBg = 'bg-[#60a5fa]'; }
  if (score === 100) { tier = 'Elite Report'; tierColor = 'text-[#34d399]'; tierBg = 'bg-[#34d399]'; }

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const renderDocument = () => (
    <div 
      className={`bg-[#ffffff] text-[#18181b] font-sans relative w-[816px] min-h-[1056px] mx-auto block ${isGenerating ? '' : 'shadow-[0_25px_50px_rgba(0,0,0,0.25)]'}`}
      ref={printRef}
    >
      {/* PAGE 1 CONTENT */}
      <div className="bg-[#ffffff] px-12 pt-14 pb-10 flex flex-row justify-between items-start border-b border-[rgba(228,228,231,0.6)]">
        <div className="flex flex-col">
          {logoImage ? (
            <img src={logoImage} crossOrigin="anonymous" alt="Logo" className="mb-4 object-contain object-left" style={{ height: "90px", maxWidth: "280px", width: "100%", display: "block" }} />
          ) : (
            <div className="text-4xl font-serif tracking-tight text-[#18181b] flex items-center mb-4">
              <Building2 className="mr-3 h-10 w-10 text-[#18181b]" /> {companyName}
            </div>
          )}
          <div className="text-[11px] text-[#52525b] space-y-0.5 mt-2 font-mono">
             <div className="font-bold text-[#18181b] text[12px] uppercase tracking-wider mb-1">{companyName}</div>
             <div className="whitespace-pre-wrap">{companyAddress}</div>
             <div className="pt-1">{companyPhone}</div>
             <div className="text-[#18181b] font-semibold">{companyWebsite}</div>
          </div>
        </div>
        <div className="text-right pt-2">
          <div className="text-[22px] uppercase tracking-[0.2em] font-bold text-[#18181b] mb-1">Damage Assessment</div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#a1a1aa] mb-4">Official Inspection Report</div>
          <div className="text-sm font-serif text-[#52525b] border-t border-[#e4e4e7] pt-3 block">{today}</div>
        </div>
      </div>

      <div className="bg-[#ffffff] px-12 py-10 relative pb-24">
        <h1 className="text-6xl font-serif text-[#18181b] mb-12 leading-tight tracking-tight relative">
           <div className="absolute -left-12 top-2 bottom-2 w-2 bg-[#18181b]"></div>
           Property Inspection <br className="block"/><span className="text-[#a1a1aa] italic font-light">Report</span>
        </h1>

        <div className="grid grid-cols-2 gap-12 mb-14 border-y border-[rgba(228,228,231,0.6)] py-10">
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] font-bold mb-3 flex items-center">
              <span className="w-4 h-[1px] bg-[#a1a1aa] mr-2"></span> Homeowner Info
            </div>
            <div className="text-3xl font-serif text-[#18181b] mb-3">{selectedProjectData ? `${selectedProjectData.customer.firstName} ${selectedProjectData.customer.lastName}` : 'Client Name'}</div>
            <div className="text-sm text-[#52525b] font-mono leading-relaxed mb-1">{selectedProjectData?.customer.address || 'Property Address'}</div>
            <div className="text-sm text-[#52525b] font-mono leading-relaxed mb-1">{selectedProjectData?.customer.phone || 'Phone Number'}</div>
            <div className="text-sm text-[#52525b] font-mono leading-relaxed">{selectedProjectData?.customer.email || 'Email Address'}</div>
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] font-bold mb-3 flex items-center">
              <span className="w-4 h-[1px] bg-[#a1a1aa] mr-2"></span> Project Manager
            </div>
            <div className="text-3xl font-serif text-[#18181b] mb-3">{repName || 'Inspector Name'}</div>
            <div className="text-[11px] text-[#18181b] uppercase tracking-[0.15em] font-bold mb-3">{repRole || 'Field Representative'}</div>
            <div className="text-sm text-[#52525b] font-mono leading-relaxed mb-1">{repPhone || 'Inspector Phone'}</div>
            <div className="text-sm text-[#52525b] font-mono leading-relaxed">{repEmail || 'Inspector Email'}</div>
          </div>
        </div>

        {/* HERO IMAGE */}
        {coverPhoto && (
          <div className="mb-4 w-full h-[450px] relative break-inside-avoid" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div className="absolute inset-0 bg-[#e4e4e7] border border-[#d4d4d8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
               <img src={coverPhoto} crossOrigin="anonymous" alt="Cover" className="w-full h-full object-cover block absolute inset-0" />
            </div>
            <div className="absolute bottom-4 right-4 bg-[#ffffff] px-4 py-2 text-[10px] uppercase tracking-widest font-bold shadow-md">Main Structure</div>
          </div>
        )}
      </div>

      {/* PAGE 2 CONTENT */}
      <div className="bg-[#ffffff] px-12 py-10 relative">
        <div className="space-y-12">
          {/* Executive Summary */}
          <section className="relative mt-4">
            <div className="block absolute -left-10 top-0 text-[#f4f4f5] font-serif text-7xl font-bold rounded-full w-20 text-right select-none opacity-50 z-0 tracking-tighter" style={{ left: '-40px', top: '-10px' }}>01</div>
            <div className="relative z-10 border-b border-[#e4e4e7] pb-3 mb-6">
              <h3 className="text-2xl font-serif text-[#18181b]">Executive Summary</h3>
            </div>
            <div className="text-[15px] leading-[1.8] text-[#3f3f46] font-sans z-10 relative">
              {reportInfo ? reportInfo.split('\n').map((p, i) => <p key={i} className="break-inside-avoid block w-full mb-3">{p}</p>) : <span className="italic opacity-60 break-inside-avoid">Detailed observations will populate here...</span>}
            </div>
          </section>

          {/* Roof Diagnostics */}
          <section className="relative mt-16 pt-8">
            <div className="block absolute -left-10 top-0 text-[#f4f4f5] font-serif text-7xl font-bold rounded-full w-20 text-right select-none opacity-50 z-0 tracking-tighter" style={{ left: '-40px', top: '10px' }}>02</div>
            <div className="relative z-10 border-b border-[#e4e4e7] pb-3 mb-6">
               <h3 className="text-2xl font-serif text-[#18181b]">Roof Diagnostics</h3>
            </div>
            <div className="block w-full mb-8 relative z-10">
               <div className="break-inside-avoid inline-block w-[360px] bg-[#ffffff] p-6 rounded-md border border-[#e4e4e7] shadow-[0_1px_2px_rgba(0,0,0,0.05)] mr-[24px] [&:nth-child(even)]:mr-0 align-top">
                 <div className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-[0.1em] mb-2">System Type</div>
                 <div className="text-xl font-serif text-[#18181b]">{damageReport?.roofType || 'Not Documented'}</div>
               </div>
               <div className="break-inside-avoid inline-block w-[360px] bg-[#ffffff] p-6 rounded-md border border-[#e4e4e7] shadow-[0_1px_2px_rgba(0,0,0,0.05)] mr-[24px] [&:nth-child(even)]:mr-0 align-top">
                 <div className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-[0.1em] mb-2">Estimated Age</div>
                 <div className="text-xl font-serif text-[#18181b]">{damageReport?.roofAgeEstimate ? `${damageReport.roofAgeEstimate} Years` : 'Not Documented'}</div>
               </div>
            </div>
            {damageReport && damageReport.collateralDamage.length > 0 && (
              <div className="break-inside-avoid flex items-start bg-[#fff9f9] border border-[#ffcccc] p-6 rounded-md shadow-[inset_4px_0_0_#ef4444] relative z-10">
                 <AlertTriangle className="h-5 w-5 text-[#ef4444] mr-4 mt-0.5 shrink-0" />
                 <div>
                   <div className="text-[11px] font-bold text-[#991b1b] uppercase tracking-widest mb-1.5">Collateral Damage Identified</div>
                   <div className="text-[14px] text-[rgba(127,29,29,0.8)] capitalize font-medium">
                     {damageReport.collateralDamage.map(item => item.replace('_', ' ')).join(', ')}
                   </div>
                 </div>
              </div>
            )}
          </section>

          {/* Action Plan */}
          <section className="relative mt-16 pt-8">
            <div className="block absolute -left-10 top-0 text-[#f4f4f5] font-serif text-7xl font-bold rounded-full w-20 text-right select-none opacity-50 z-0 tracking-tighter" style={{ left: '-40px', top: '10px' }}>03</div>
            <div className="relative z-10 border-b border-[#e4e4e7] pb-3 mb-6">
              <h3 className="text-2xl font-serif text-[#18181b]">Action Plan & Recommendation</h3>
            </div>
            <div className="bg-[#18181b] text-[#fbfaf8] p-8 rounded-md shadow-[0_4px_6px_rgba(0,0,0,0.1)] relative z-10 break-inside-avoid block">
               <div className="text-[15px] leading-[1.8] opacity-90 font-sans">
                 {recommendation ? recommendation.split('\n').map((p, i) => <p key={i} className="break-inside-avoid block w-full mb-3">{p}</p>) : <span className="break-inside-avoid">No action plan provided.</span>}
               </div>
            </div>
          </section>
        </div>
      </div>

      {/* Photo Evidence */}
      {(overviewPhotos.length > 0 || damagePhotos.length > 0) && (
        <div>
          <div className="bg-[#ffffff] px-12 py-10 relative mt-4">
          <section className="relative">
            <div className="block absolute -left-10 top-0 text-[#f4f4f5] font-serif text-7xl font-bold rounded-full w-20 text-right select-none opacity-50 z-0 tracking-tighter" style={{ left: '-40px', top: '10px' }}>04</div>
            <div className="relative z-10 border-b border-[#e4e4e7] pb-3 mb-8 break-inside-avoid">
              <h3 className="text-2xl font-serif text-[#18181b]">Photographic Evidence</h3>
            </div>
            
            {overviewPhotos.length > 0 && (
              <div className="mb-14 relative z-10 w-full flex flex-col break-inside-auto">
                <div className="text-[10px] font-bold uppercase text-[#a1a1aa] tracking-[0.15em] mb-5 break-inside-avoid">Property Overviews</div>
                <div className="block w-full pb-4">
                  {overviewPhotos.map((img, idx) => (
                    <div key={`overview_${idx}`} className="bg-[#e4e4e7] p-2 border border-[#d4d4d8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] w-[348px] h-[280px] break-inside-avoid inline-block mb-12 mr-[24px] [&:nth-child(even)]:mr-0 align-top" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                      <div className="w-full h-full block bg-[#ffffff] relative"><img src={img} crossOrigin="anonymous" alt="Photo" className="w-full h-full object-cover block absolute inset-0" /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {damagePhotos.length > 0 && (
              <div className="relative z-10 mt-8 w-full flex flex-col break-inside-auto">
                <div className="text-[10px] font-bold uppercase text-[#a1a1aa] tracking-[0.15em] mb-5 break-inside-avoid">Damage Highlights</div>
                <div className="block w-full pb-4">
                  {damagePhotos.map((img, idx) => (
                    <div key={`damage_${idx}`} className="bg-[#e4e4e7] p-2 border border-[#fca5a5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] relative w-[348px] h-[280px] break-inside-avoid inline-block mb-12 mr-[24px] [&:nth-child(even)]:mr-0 align-top" style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                       <div className="absolute top-4 left-4 bg-[#dc2626] text-[#ffffff] text-[10px] font-bold px-3 py-1 uppercase tracking-wider shadow-[0_4px_6px_rgba(0,0,0,0.1)] z-10">Damage</div>
                      <div className="w-full h-full block bg-[#ffffff] relative"><img src={img} crossOrigin="anonymous" alt="Photo" className="w-full h-full object-cover block absolute inset-0" /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-auto text-center text-[9px] text-[#a1a1aa] font-bold py-10 border-t border-[rgba(228,228,231,0.8)] bg-[rgba(244,244,245,0.5)] uppercase tracking-[0.3em]">
         <div className="mb-2">{companyName}</div>
         <div className="opacity-70">Confidential Inspection Report</div>
         {companyWebsite && <div className="mt-2 text-[#a1a1aa] opacity-80">{companyWebsite}</div>}
      </div>
    </div>
  );

  return (
    <div className={`min-h-full flex flex-col max-w-[1600px] mx-auto w-full relative z-10 ${isGenerating ? "h-auto" : "lg:h-full"}`}>
      <div className="mb-6 shrink-0">
        <button 
          onClick={() => onNavigate(project ? 'project_detail' : 'projects', project?.id)}
          className="flex items-center text-xs font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] hover:text-[#ffffff] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {project ? `Back to ${project.customer.lastName} Project` : 'Back to Projects'}
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

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 ${isGenerating ? "" : "min-h-0"}`}>
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
            <div className={`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md ${coverPhoto ? 'border-[#10b981]/30' : 'border-[#262626]'}`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${coverPhoto ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}`}><CheckCircle2 className="h-4 w-4" /></div>
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
            <div className={`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md ${overviewPhotos.length > 0 ? 'border-[#10b981]/30' : 'border-[#262626]'}`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${overviewPhotos.length > 0 ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}`}><CheckCircle2 className="h-4 w-4" /></div>
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
            <div className={`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md ${damagePhotos.length > 0 ? 'border-[#10b981]/30' : 'border-[#262626]'}`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${damagePhotos.length > 0 ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}`}><CheckCircle2 className="h-4 w-4" /></div>
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
            <div className={`bg-[#ffffff]/5 rounded-2xl border transition-colors overflow-hidden backdrop-blur-md ${(reportInfo && recommendation) ? 'border-[#10b981]/30' : 'border-[#262626]'}`}>
               <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#18181b]/50 backdrop-blur-md">
                 <div className="flex items-center">
                   <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${(reportInfo && recommendation) ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#262626] text-[#737373]'}`}><CheckCircle2 className="h-4 w-4" /></div>
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
                   <textarea 
                     value={recommendation}
                     onChange={(e) => setRecommendation(e.target.value)}
                     placeholder="e.g. Recommend filing a claim and scheduling a full roof replacement..."
                     className="w-full bg-[#18181b] border border-[#262626] rounded-xl p-3 text-[#ffffff] text-sm focus:outline-none focus:border-[#ffffff] min-h-[140px] scrollbar-hide"
                   />
                 </div>
               </div>
            </div>

          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={!selectedProjectId || isGenerating}
            className={`w-full py-4 mt-2 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
              !selectedProjectId || isGenerating
                ? 'bg-[#000000]/40 text-[#404040] border border-[#262626] cursor-not-allowed'
                : 'bg-[#ffffff] text-[#000000] hover:bg-[#d4d4d4] shadow-[0_0_15px_rgba(255,255,255,0.15)]'
            }`}
          >
            {isGenerating ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Packaging PDF...</>
            ) : score < 40 ? (
              <><Download className="h-5 w-5 mr-2" /> Download Basic Report</>
            ) : (
              <><Download className="h-5 w-5 mr-2" /> Download Professional Report</>
            )}
          </button>
          
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] p-3 rounded-lg text-sm flex items-start mt-2">
              <ShieldAlert className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Right Col: High End Web Preview */}
        <div className="lg:col-span-7 bg-[#000000]/40 border border-[#262626] rounded-2xl overflow-hidden shadow-[0_10px_15px_rgba(0,0,0,0.1)] relative flex flex-col min-h-[500px] lg:h-full ring-1 ring-white/5 mt-6 lg:mt-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
          <div className="p-4 border-b border-[#262626] bg-[#18181b]/50 backdrop-blur-md flex justify-between items-center z-10">
            <div className="text-[11px] uppercase tracking-[0.05em] text-[#ffffff] font-bold flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Document Preview
            </div>
            <div className="text-[10px] text-[#737373] bg-[#000000]/40 px-2 py-1 rounded border border-[#262626]">
              Auto-Scaling 8.5" x 11"
            </div>
          </div>
          
          <div className={`p-4 md:p-8 flex-1 bg-[#52525b] flex justify-center relative ${isGenerating ? "overflow-visible" : "overflow-auto"}`}>
             <div className={`transform origin-top transition-none ${isGenerating ? "scale-100 pb-0" : "scale-[0.4] sm:scale-50 md:scale-75 xl:scale-90 2xl:scale-100 pb-[100px]"}`}>
                 {/* PDF boundaries visualization wrapper */}
                <div className="relative shadow-[0_0_40px_rgba(0,0,0,0.1)]">
                    {renderDocument()}
                </div>
             </div>
          </div>
        </div>
      </div>
      

      
    </div>
  );
}
