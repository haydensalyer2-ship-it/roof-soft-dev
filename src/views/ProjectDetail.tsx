import { useState } from 'react';
import { Project, DamageReport } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldAlert, 
  FileText, 
  Camera, 
  CheckCircle2, 
  Circle,
  FileBox,
  DollarSign,
  Upload,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProjectDetailProps {
  project: Project;
  onNavigate: (view: string, id?: string) => void;
}

type TabType = 'overview' | 'damage_report' | 'insurance_claim' | 'documents';

export function ProjectDetail({ project, onNavigate }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isStartingClaim, setIsStartingClaim] = useState(false);
  
  // Edit State
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [reportForm, setReportForm] = useState<Partial<DamageReport>>(() => {
    if (project.damageReport) return { ...project.damageReport };
    return {
      inspectorName: '',
      inspectionDate: new Date().toISOString(),
      roofType: 'Asphalt Shingle',
      roofAgeEstimate: 10,
      notes: '',
      testSquares: [
        { id: '1', slope: 'Front', hailHits: 0, windDamagedShingles: 0 },
        { id: '2', slope: 'Back', hailHits: 0, windDamagedShingles: 0 },
        { id: '3', slope: 'Left', hailHits: 0, windDamagedShingles: 0 },
        { id: '4', slope: 'Right', hailHits: 0, windDamagedShingles: 0 }
      ],
      collateralDamage: [],
      photosUploaded: 0
    };
  });
  
  // Customer Edit State
  const [customerForm, setCustomerForm] = useState({
    firstName: project.customer.firstName,
    lastName: project.customer.lastName,
    phone: project.customer.phone,
    email: project.customer.email,
    address: project.customer.address,
  });

  // Claim Edit State
  const [isEditingClaim, setIsEditingClaim] = useState(false);
  const [claimForm, setClaimForm] = useState<any>(() => {
    if (project.claim) return { ...project.claim };
    return {
      insuranceCompany: '',
      claimNumber: '',
      dateOfLoss: new Date().toISOString().split('T')[0],
      policyNumber: '',
      adjusterName: '',
      adjusterPhone: '',
      adjusterEmail: '',
      rcv: 0,
      acv: 0,
      depreciation: 0,
      deductible: 0
    };
  });

  const handleSaveReportAndCustomer = async () => {
    try {
      const projectRef = doc(db, 'projects', project.id);
      const updatedCustomer = {
        ...project.customer,
        ...customerForm
      };
      
      const payload = {
        customer: updatedCustomer,
        damageReport: reportForm,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(projectRef, payload).catch(async (err) => {
        if (err.code === 'not-found') {
          await setDoc(projectRef, {
            ...project,
            ...payload
          });
        } else {
          throw err;
        }
      });
      setIsEditingReport(false);
    } catch (e) {
      console.error('Failed to save damage report:', e);
    }
  };

  const handleSaveClaim = async () => {
    try {
      const projectRef = doc(db, 'projects', project.id);
      const updatedClaim = {
        ...(project.claim || { status: 'claim_filed' }),
        ...claimForm
      };
      
      const payload = {
        claim: updatedClaim,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(projectRef, payload).catch(async (err) => {
        if (err.code === 'not-found') {
          await setDoc(projectRef, {
            ...project,
            ...payload
          });
        } else {
          throw err;
        }
      });
      setIsEditingClaim(false);
    } catch (e) {
      console.error('Failed to save claim:', e);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'damage_report', label: 'Damage Report' },
    { id: 'insurance_claim', label: 'Insurance Claim' },
    { id: 'documents', label: 'Documents' },
  ];

  const handleStartClaim = async () => {
    // keeping handleStartClaim logic unchanged
    setIsStartingClaim(true);
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        status: 'claim_filed',
        claim: {
          insuranceCompany: 'Unknown Carrier',
          claimNumber: `CLM-${Math.floor(Math.random() * 100000)}`,
          dateOfLoss: new Date().toISOString(),
          policyNumber: 'TBD',
          rcv: 0,
          acv: 0,
          depreciation: 0,
          deductible: 0,
          totalCollected: 0,
          status: 'claim_filed'
        },
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        // If the document doesn't exist (e.g. mock project), create it completely
        if (err.code === 'not-found') {
          await setDoc(projectRef, {
            ...project,
            status: 'claim_filed',
            claim: {
              insuranceCompany: 'Unknown Carrier',
              claimNumber: `CLM-${Math.floor(Math.random() * 100000)}`,
              dateOfLoss: new Date().toISOString(),
              policyNumber: 'TBD',
              rcv: 0,
              acv: 0,
              depreciation: 0,
              deductible: 0,
              totalCollected: 0,
              status: 'claim_filed'
            },
            updatedAt: serverTimestamp()
          });
        } else {
          throw err;
        }
      });
      // Optionally could add a toast here
    } catch (error) {
      console.error('Failed to start claim:', error);
    } finally {
      setIsStartingClaim(false);
    }
  };

  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvancePipeline = async (nextStatus: string) => {
    setIsAdvancing(true);
    try {
      if (nextStatus === 'claim_filed' && !project.claim) {
        await handleStartClaim();
        setIsAdvancing(false);
        return;
      }
      
      const projectRef = doc(db, 'projects', project.id);
      
      const updates: any = {
        status: nextStatus,
        updatedAt: serverTimestamp()
      };
      
      if (project.claim && ['claim_filed', 'adjustment', 'approved_or_denied', 'contract_signed', 'completed'].includes(nextStatus)) {
        updates.claim = {
          ...project.claim,
          status: nextStatus as any
        };
      }
      
      await updateDoc(projectRef, updates).catch(async (err) => {
        if (err.code === 'not-found') {
          await setDoc(projectRef, {
            ...project,
            ...updates
          });
        } else {
          throw err;
        }
      });
    } catch (error) {
      console.error('Failed to advance pipeline:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header Section */}
      <div className="bg-[#171717] border-b border-[#262626] px-6 py-4 shrink-0">
        <button 
          onClick={() => onNavigate('projects')}
          className="flex items-center text-xs font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
              {project.customer.firstName} {project.customer.lastName}
            </h1>
            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-y-2 gap-x-6 text-[13px] text-[#a3a3a3]">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 opacity-60 shrink-0" />
                <span className="break-words line-clamp-2">{project.customer.address}, {project.customer.city}, {project.customer.state} {project.customer.zip}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1.5 opacity-60 shrink-0" />
                <span className="break-words">{project.customer.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-1.5 opacity-60 shrink-0" />
                <span className="break-all">{project.customer.email}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                ${project.status === 'contract_signed' || project.status === 'completed' ? 'bg-white text-black border-transparent shadow-sm' : 
                  project.status === 'adjustment' || project.status === 'approved_or_denied' ? 'bg-[#0a0a0a] text-white border-[#404040]' : 
                  'bg-[#171717] text-[#a3a3a3] border-[#262626]'}`}>
                {project.status.replace('_', ' ')}
              </span>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-6 sm:space-x-8 mt-8 border-b border-[#262626] overflow-x-auto whitespace-nowrap scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 text-sm font-semibold relative transition-colors ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border-b lg:border-b-0 border-[#262626] pb-6 lg:pb-0">
                  <div className="bg-[#171717] rounded-2xl border border-[#262626] p-6 shadow-sm sticky top-0">
                     <div className="text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold mb-4">Project Summary</div>
                     <p className="text-white text-[13px]">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
                     <p className="text-[#a3a3a3] text-[13px] mt-2 leading-relaxed">
                       This project is currently in the <strong className="text-white">{project.status.replace('_', ' ')}</strong> phase.
                       {project.damageReport ? " A damage report has been logged." : " Inspection is pending."}
                       {project.claim ? ` Claim filed with ${project.claim.insuranceCompany}.` : " No claim filed yet."}
                     </p>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-[#171717] rounded-2xl border border-[#262626] p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffffff] to-[#a3a3a3]"></div>
                    <div className="text-[11px] uppercase tracking-[0.05em] text-white font-bold mb-8 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Project Milestones
                    </div>
                    
                    <div className="relative pl-2">
                      <div className="absolute left-[24px] top-4 bottom-6 w-px bg-[#262626]"></div>
                      
                      {[
                        { key: 'inspection', label: 'Inspection Complete', desc: 'Initial exterior & roof inspection' },
                        { key: 'claim_filed', label: 'Claim Filed', desc: 'Documentation submitted to carrier' },
                        { key: 'adjustment', label: 'Adjustment', desc: 'Field adjuster review and estimate' },
                        { key: 'approved_or_denied', label: 'Approved or Denied', desc: 'Carrier decision received' },
                        { key: 'contract_signed', label: 'Contract Signed', desc: 'Agreement via homeowner' },
                        { key: 'completed', label: 'Job Closed', desc: 'Roof complete & final payment received' }
                      ].map((milestone) => {
                        const statusOrder = ['new', 'inspection', 'claim_filed', 'adjustment', 'approved_or_denied', 'contract_signed', 'completed'];
                        const currentStatusIndex = Math.max(0, statusOrder.indexOf(project.status));
                        const milestoneIndex = statusOrder.indexOf(milestone.key);
                        
                        const isCompleted = milestoneIndex < currentStatusIndex || (milestoneIndex === currentStatusIndex && project.status === 'completed');
                        const isCurrent = milestoneIndex === currentStatusIndex && project.status !== 'completed';
                        
                        // We also want to show a button for the "next" logical step
                        const isNextStep = milestoneIndex === currentStatusIndex + 1 || (project.status === 'new' && milestone.key === 'inspection');

                        return (
                          <div key={milestone.key} className={`relative flex items-start mb-8 last:mb-0 group ${isNextStep ? 'opacity-100' : isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 relative bg-[#171717] ring-8 ring-[#171717] border-2 ${isCompleted ? 'border-transparent text-white' : isCurrent ? 'border-white text-white' : 'border-[#262626] text-[#404040]'}`}>
                               {isCompleted ? <div className="absolute inset-0 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.4)]"><CheckCircle2 className="h-4 w-4 text-black" /></div> : <Circle className="h-2 w-2 fill-current" />}
                            </div>
                            <div className="ml-5 flex-1 pt-1.5 flex flex-col xl:flex-row xl:justify-between xl:items-start gap-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <div>
                                  <h4 className={`text-[14px] font-bold tracking-wide transition-colors ${isCompleted ? 'text-white' : isCurrent ? 'text-white' : 'text-[#a3a3a3]'}`}>
                                    {milestone.label}
                                  </h4>
                                  <p className="text-[12px] text-[#737373] mt-1">{milestone.desc}</p>
                                </div>
                                {isCurrent && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap mt-1 sm:mt-0 shadow-sm sm:ml-2">
                                    Current Stage
                                  </span>
                                )}
                              </div>
                              
                              {isNextStep && (
                                <button
                                  onClick={() => handleAdvancePipeline(milestone.key)}
                                  disabled={isAdvancing}
                                  className="w-full xl:w-auto bg-white text-black hover:bg-neutral-200 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center disabled:opacity-50"
                                >
                                  {isAdvancing ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                  Advance Stage
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'damage_report' && (
            <motion.div
              key="damage_report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center bg-[#171717] p-5 rounded-2xl border border-[#262626] shadow-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">Official Damage Report</div>
                  <p className="text-[13px] text-white mt-1 font-medium">
                    Inspected by {project.damageReport?.inspectorName || 'N/A'} on {project.damageReport ? new Date(project.damageReport.inspectionDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isEditingReport ? (
                    <>
                      <button onClick={() => setIsEditingReport(false)} className="bg-[#171717] text-white border border-[#262626] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#262626] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleSaveReportAndCustomer} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors">
                        Save Report
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setIsEditingReport(true)} className="bg-[#171717] text-white border border-[#262626] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#262626] transition-colors">
                        Edit Data
                      </button>
                      <button onClick={() => onNavigate('generate_report', project.id)} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-300 transition-colors">
                        PDF Report
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditingReport ? (
                <div className="bg-[#171717] rounded-2xl border border-[#262626] p-6 space-y-6">
                   

                   <div className="border-b border-[#262626] pb-4">
                     <h3 className="text-white font-bold mb-4">Inspection Details</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[11px] text-[#a3a3a3] mb-1">Roof Type</label>
                           <input type="text" value={reportForm.roofType || ''} onChange={e => setReportForm({...reportForm, roofType: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] text-white text-sm rounded-lg px-3 py-2" />
                        </div>
                        <div>
                           <label className="block text-[11px] text-[#a3a3a3] mb-1">Roof Age Est. (Years)</label>
                           <input type="number" value={reportForm.roofAgeEstimate || ''} onChange={e => setReportForm({...reportForm, roofAgeEstimate: parseInt(e.target.value) || 0})} className="w-full bg-[#0a0a0a] border border-[#262626] text-white text-sm rounded-lg px-3 py-2" />
                        </div>
                     </div>
                   </div>

                   <div>
                     <h3 className="text-white font-bold mb-4">Collateral Damage</h3>
                     <div className="flex flex-wrap gap-2 mb-4">
                        {['gutters', 'downspouts', 'window_screens', 'ac_unit', 'siding', 'fence'].map((item) => {
                          const isSelected = reportForm.collateralDamage?.includes(item as any);
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                const current = reportForm.collateralDamage || [];
                                setReportForm({
                                  ...reportForm,
                                  collateralDamage: isSelected 
                                    ? current.filter(c => c !== item)
                                    : [...current, item as any]
                                });
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors border ${
                                isSelected 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                  : 'bg-[#0a0a0a] text-[#a3a3a3] border-[#262626] hover:bg-[#262626]'
                              }`}
                            >
                              {item.replace('_', ' ')}
                            </button>
                          );
                        })}
                     </div>

                   </div>
                </div>
              ) : project.damageReport ? (
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
                            <li key={item} className={`flex items-center text-[13px] ${hasDamage ? 'text-white font-medium' : 'text-[#a3a3a3]'}`}>
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
                             <img src={`https://picsum.photos/seed/${project.id}${idx}/200/200?blur=4`} alt="Damage Proof" referrerPolicy="no-referrer" className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
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
              ) : (

                <div className="text-center py-12 bg-[#171717] rounded-2xl border border-dashed border-[#262626]">
                  <ShieldAlert className="h-10 w-10 text-[#262626] mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-white">No Damage Report Found</h3>
                  <p className="text-[#a3a3a3] text-xs mt-1">Schedule an inspection to create a report.</p>
                  <button onClick={() => setIsEditingReport(true)} className="mt-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">Start Inspection</button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insurance_claim' && (
            <motion.div
               key="insurance_claim"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.15 }}
               className="space-y-4"
             >
               {project.claim ? (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                   {/* Left Column: Claim Info & Adjuster */}
                   <div className="lg:col-span-2 space-y-4">
                     <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626]">
                       <div className="flex justify-between items-start mb-6">
                         {isEditingClaim ? (
                           <div className="flex-1 mr-4 grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Carrier</label>
                               <input type="text" value={claimForm.insuranceCompany} onChange={e => setClaimForm({...claimForm, insuranceCompany: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Claim #</label>
                               <input type="text" value={claimForm.claimNumber} onChange={e => setClaimForm({...claimForm, claimNumber: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Date of Loss</label>
                               <input type="date" value={claimForm.dateOfLoss} onChange={e => setClaimForm({...claimForm, dateOfLoss: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Policy #</label>
                               <input type="text" value={claimForm.policyNumber} onChange={e => setClaimForm({...claimForm, policyNumber: e.target.value})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                             </div>
                           </div>
                         ) : (
                           <>
                             <div>
                               <h3 className="text-2xl font-bold text-white">{project.claim.insuranceCompany}</h3>
                               <p className="text-white font-mono text-sm mt-1">Claim #{project.claim.claimNumber}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-[13px] font-medium text-white">Date of Loss: {new Date(project.claim.dateOfLoss || Date.now()).toLocaleDateString()}</p>
                               <p className="text-[11px] text-[#a3a3a3] mt-1">Policy: {project.claim.policyNumber}</p>
                             </div>
                           </>
                         )}
                       </div>
                       
                       <div className="bg-[#0a0a0a] p-5 rounded-xl border border-[#262626] mt-6 relative">
                         <div className="text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold mb-4">Adjuster Information</div>
                         {isEditingClaim ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div>
                               <label className="block text-[11px] uppercase text-[#a3a3a3] mb-1">Name</label>
                               <input type="text" value={claimForm.adjusterName} onChange={e => setClaimForm({...claimForm, adjusterName: e.target.value})} className="w-full bg-[#171717] border border-[#262626] rounded-lg p-2 text-white text-sm" placeholder="John Doe" />
                             </div>
                             <div>
                               <label className="block text-[11px] uppercase text-[#a3a3a3] mb-1">Phone</label>
                               <input type="tel" value={claimForm.adjusterPhone} onChange={e => setClaimForm({...claimForm, adjusterPhone: e.target.value})} className="w-full bg-[#171717] border border-[#262626] rounded-lg p-2 text-white text-sm" placeholder="555-123-4567" />
                             </div>
                             <div>
                               <label className="block text-[11px] uppercase text-[#a3a3a3] mb-1">Email</label>
                               <input type="email" value={claimForm.adjusterEmail} onChange={e => setClaimForm({...claimForm, adjusterEmail: e.target.value})} className="w-full bg-[#171717] border border-[#262626] rounded-lg p-2 text-white text-sm" placeholder="adjuster@carrier.com" />
                             </div>
                             <div>
                               <label className="block text-[11px] uppercase text-[#a3a3a3] mb-1">Adjustment Appt</label>
                               <input type="datetime-local" value={claimForm.adjustmentDate ? new Date(claimForm.adjustmentDate).toISOString().slice(0, 16) : ''} onChange={e => setClaimForm({...claimForm, adjustmentDate: e.target.value ? new Date(e.target.value).toISOString() : ''})} className="w-full bg-[#171717] border border-[#262626] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-white transition-colors" />
                             </div>
                           </div>
                         ) : project.claim.adjusterName ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
                             <div>
                               <span className="block text-[#a3a3a3] mb-1 text-[11px] uppercase">Name</span>
                               <span className="font-medium text-white">{project.claim.adjusterName}</span>
                             </div>
                             <div>
                               <span className="block text-[#a3a3a3] mb-1 text-[11px] uppercase">Phone</span>
                               <span className="font-medium text-white">{project.claim.adjusterPhone || 'N/A'}</span>
                             </div>
                             <div>
                               <span className="block text-[#a3a3a3] mb-1 text-[11px] uppercase">Email</span>
                               <span className="font-medium text-white">{project.claim.adjusterEmail || 'N/A'}</span>
                             </div>
                             <div>
                               <span className="block text-[#a3a3a3] mb-1 text-[11px] uppercase">Adjustment Time</span>
                               <span className="font-medium text-white">{project.claim.adjustmentDate ? new Date(project.claim.adjustmentDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}</span>
                             </div>
                           </div>
                         ) : (
                           <p className="text-[13px] text-[#a3a3a3] italic">Adjuster not assigned yet.</p>
                         )}
                       </div>
                       
                       <div className="mt-6 flex justify-end">
                         {isEditingClaim ? (
                           <div className="flex gap-2">
                             <button onClick={() => setIsEditingClaim(false)} className="bg-[#0a0a0a] text-white border border-[#262626] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#262626] transition-colors">Cancel</button>
                             <button onClick={handleSaveClaim} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors">Save Claim Info</button>
                           </div>
                         ) : (
                           <button onClick={() => setIsEditingClaim(true)} className="bg-[#0a0a0a] text-white border border-[#262626] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#262626] transition-colors">Edit Claim Info</button>
                         )}
                       </div>
                     </div>

                     {/* Financial Breakdown */}
                     <div className="border border-[#262626] rounded-2xl overflow-hidden bg-[#171717]">
                        <div className="bg-[#0a0a0a] px-6 py-4 border-b border-[#262626]">
                           <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-[#d4d4d4] font-semibold">
                             <DollarSign className="h-4 w-4 mr-2" />
                             Claim Financials
                           </div>
                        </div>
                        <div className="p-6">
                          {isEditingClaim ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                              <div>
                                <label className="block text-xs font-bold text-[#a3a3a3] mb-1">RCV ($)</label>
                                <input type="number" value={claimForm.rcv} onChange={e => setClaimForm({...claimForm, rcv: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Depreciation ($)</label>
                                <input type="number" value={claimForm.depreciation} onChange={e => setClaimForm({...claimForm, depreciation: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[#a3a3a3] mb-1">ACV ($)</label>
                                <input type="number" value={claimForm.acv} onChange={e => setClaimForm({...claimForm, acv: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Deductible ($)</label>
                                <input type="number" value={claimForm.deductible} onChange={e => setClaimForm({...claimForm, deductible: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-[#a3a3a3] mb-1">Total Liquid Collected ($)</label>
                                <input type="number" value={claimForm.totalCollected || 0} onChange={e => setClaimForm({...claimForm, totalCollected: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-2 text-white text-sm" />
                              </div>
                            </div>
                          ) : project.claim.rcv > 0 ? (
                            <div className="space-y-4 max-w-md text-[13px]">
                              <div className="flex justify-between items-center py-2 border-b border-[#262626]">
                                <span className="text-[#a3a3a3] tracking-wide">RCV (Replacement Cost Value)</span>
                                <span className="text-white font-bold">${project.claim.rcv.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-[#262626]">
                                <span className="text-[#a3a3a3] tracking-wide">Less Depreciation</span>
                                <span className="text-[#f87171] font-medium">-${project.claim.depreciation.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-[#262626] bg-[#0a0a0a] px-3 rounded-lg -mx-3">
                                <span className="text-white font-semibold tracking-wide">ACV (Actual Cash Value)</span>
                                <span className="text-white font-bold">${project.claim.acv.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-[#262626]">
                                <span className="text-[#a3a3a3] tracking-wide">Less Deductible (Homeowner)</span>
                                <span className="text-[#a3a3a3]">-${project.claim.deductible.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 pb-2 border-b border-[#262626]">
                                <span className="text-white font-bold uppercase tracking-wider text-[11px]">Net Claim Payment (ACV)</span>
                                <span className="text-[#d4d4d4] font-bold text-lg">${(project.claim.acv - project.claim.deductible).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center pt-4">
                                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Total Liquid Collected</span>
                                <span className="text-emerald-400 font-bold text-lg">${(project.claim.totalCollected || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-center text-[#a3a3a3] py-6 text-[13px]">Financials have not been imported from the insurance estimate yet.</p>
                          )}
                          <div className="mt-6 flex justify-end">
                            {!isEditingClaim && (
                              <button onClick={() => setIsEditingClaim(true)} className="text-black bg-white hover:bg-neutral-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                Update Estimate
                              </button>
                            )}
                          </div>
                        </div>
                     </div>
                   </div>

                   {/* Right Column: Status Pipeline */}
                   <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] relative overflow-hidden">
                     <div className="text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold mb-6 flex justify-between">
                       Claim Status
                     </div>
                     <div className="relative">
                       {/* Line connector */}
                       <div className="absolute left-3 top-2 bottom-6 w-px bg-[#262626]"></div>
                       
                       {/* Steps */}
                       {['claim_filed', 'adjustment', 'approved_or_denied', 'contract_signed', 'completed'].map((step, idx, arr) => {
                         const statuses = ['new', 'inspection', ...arr];
                         const currentIndex = statuses.indexOf(project.status);
                         const stepIndex = statuses.indexOf(step);
                         
                         const isCompleted = stepIndex < currentIndex || (project.status === 'completed' && step === 'completed');
                         const isCurrent = stepIndex === currentIndex && project.status !== 'completed';
                         const isPending = stepIndex > currentIndex;

                         return (
                           <div 
                              key={step} 
                              className={`relative flex items-start mb-6 last:mb-0 group ${!isCurrent && !isCompleted ? 'cursor-pointer hover:opacity-80' : ''}`}
                              onClick={() => { if (!isCurrent && !isCompleted) handleAdvancePipeline(step); }}
                            >
                             <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                               isCompleted ? 'bg-[#0a0a0a] border border-[#404040]' : isCurrent ? 'bg-white ring-4 ring-[#ffffff]/20' : 'bg-[#0a0a0a] border border-[#262626] group-hover:border-[#404040]'
                             }`}>
                               {isCompleted ? (
                                 <CheckCircle2 className="h-4 w-4 text-white" />
                               ) : isCurrent ? (
                                 <Circle className="h-2 w-2 text-black fill-current" />
                               ) : (
                                 <Circle className="h-2 w-2 text-[#262626] fill-current group-hover:text-[#404040]" />
                               )}
                             </div>
                             <div className="ml-4 flex-1 flex flex-col justify-center">
                               <h5 className={`text-[13px] font-semibold capitalize tracking-wide ${
                                 isCompleted || isCurrent ? 'text-white' : 'text-[#a3a3a3] group-hover:text-[#d4d4d4]'
                               }`}>
                                 {step.replace('_', ' ')}
                               </h5>
                               {isCurrent ? (
                                 <p className="text-[11px] text-white font-semibold mt-1 uppercase tracking-wider">Action Required</p>
                               ) : (!isCurrent && !isCompleted) && (
                                 <p className="text-[11px] text-[#404040] font-semibold mt-1 uppercase tracking-wider group-hover:text-[#a3a3a3] transition-colors flex items-center">
                                   {isAdvancing ? '...' : 'Mark Active'}
                                 </p>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-12 bg-[#171717] rounded-2xl border border-dashed border-[#262626]">
                   <FileText className="h-10 w-10 text-[#262626] mx-auto mb-3" />
                   <h3 className="text-sm font-semibold text-white">No Claim Filed</h3>
                   <p className="text-[#a3a3a3] text-xs mt-1">Start the insurance process by filing a claim.</p>
                   <button 
                     onClick={handleStartClaim} 
                     disabled={isStartingClaim}
                     className="mt-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold transition flex items-center mx-auto hover:bg-neutral-300 disabled:opacity-50"
                   >
                     {isStartingClaim ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                     Start Claim Process
                   </button>
                 </div>
               )}
             </motion.div>
          )}
          {activeTab === 'documents' && (
            <motion.div
               key="documents"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
             >
               <div className="bg-[#171717] rounded-3xl border border-[#262626] overflow-hidden">
                 <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0a0a0a]/50">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Project Documents</h3>
                      <p className="text-sm text-[#737373] mt-1">Upload and manage photos, insurance forms, and contracts.</p>
                    </div>
                    <button className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-neutral-200 transition flex items-center">
                       Upload File
                    </button>
                 </div>
                 
                 <div className="p-6">
                    {project.documents && project.documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {project.documents.map(doc => (
                          <div key={doc.id} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-4 flex items-start space-x-4">
                            <div className="bg-[#262626] p-3 rounded-lg flex-shrink-0">
                               <FileText className="w-6 h-6 text-[#d4d4d4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-semibold text-white truncate">{doc.name}</h4>
                               <p className="text-xs text-[#737373] capitalize">{doc.type}</p>
                               <div className="text-[10px] text-[#737373] mt-2">
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-[#262626] rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-[#737373]" />
                        </div>
                        <h3 className="text-white font-semibold text-lg">No documents yet</h3>
                        <p className="text-[#a3a3a3] text-sm mt-2 max-w-sm mx-auto">
                          Upload inspection photos, measurement reports, EagleView PDFs, and signed contracts here.
                        </p>
                        <div className="mt-6 flex justify-center">
                          <div className="border-2 border-dashed border-[#404040] rounded-2xl px-8 py-10 bg-[#0a0a0a] max-w-lg w-full">
                            <Upload className="w-8 h-8 text-[#a3a3a3] mx-auto mb-3" />
                            <p className="text-sm font-semibold text-white mb-1">Click or drag files to upload</p>
                            <p className="text-xs text-[#737373]">Supports PDF, JPG, PNG (Max 50MB)</p>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
