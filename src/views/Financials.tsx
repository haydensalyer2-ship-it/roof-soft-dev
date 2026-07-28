import { useState } from 'react';
import { Project } from '../types';
import { Search, Filter, DollarSign, Wallet, CreditCard, X, CheckCircle2, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FinancialsProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

export function Financials({ projects, onNavigate }: FinancialsProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'50_upfront' | '50_backend' | 'full' | 'custom'>('50_upfront');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProjects = projects.filter(p => p.claim && (p.claim.rcv > 0 || p.claim.status === 'contract_signed' || p.claim.status === 'completed'));
  
  const totalRCV = activeProjects.reduce((sum, p) => sum + (p.claim?.rcv || 0), 0);
  const totalCollected = activeProjects.reduce((sum, p) => sum + (p.claim?.totalCollected || 0), 0);
  const pendingBalance = totalRCV - totalCollected;

  const handleOpenPayment = (e?: React.MouseEvent, projectId?: string) => {
    if (e) e.stopPropagation();
    setSelectedProjectId(projectId || '');
    setPaymentOption('50_upfront');
    setCustomAmount('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedProjectId) return;
    const project = activeProjects.find(p => p.id === selectedProjectId);
    if (!project || !project.claim) return;

    setIsSubmitting(true);
    try {
      const rcv = project.claim.rcv || 0;
      const currentCollected = project.claim.totalCollected || 0;
      let amountToAdd = 0;

      if (paymentOption === '50_upfront' || paymentOption === '50_backend') {
        amountToAdd = rcv * 0.5;
      } else if (paymentOption === 'full') {
        amountToAdd = Math.max(0, rcv - currentCollected);
      } else {
        amountToAdd = Number(customAmount) || 0;
      }

      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        'claim.totalCollected': currentCollected + amountToAdd,
        updatedAt: serverTimestamp()
      });

      setIsPaymentModalOpen(false);
      setSelectedProjectId('');
    } catch (error) {
      console.error('Failed to register payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProjectObj = activeProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-4 max-w-7xl mx-auto w-full space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Payments & Finances</h1>
          <p className="text-[13px] text-[#a3a3a3] mt-1">Track check pickups and receive digital payments directly.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <button 
            onClick={() => handleOpenPayment()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Receive Payment
          </button>
          <button className="bg-[#171717] hover:bg-[#262626] text-white border border-[#262626] px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
            Export Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626]">
          <div className="flex items-center text-[#a3a3a3] mb-2">
            <Wallet className="h-4 w-4 mr-2" />
            <div className="text-[11px] uppercase tracking-[0.05em] font-semibold">Total Job Value (Pipeline)</div>
          </div>
          <div className="text-3xl font-bold text-white">${totalRCV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        
        <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626]">
          <div className="flex items-center text-emerald-500 mb-2">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <div className="text-[11px] uppercase tracking-[0.05em] font-semibold">Total Liquid Collected</div>
          </div>
          <div className="text-3xl font-bold text-white">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[11px] font-medium text-[#a3a3a3] mt-2">Physical Checks & Digital</div>
        </div>
        
        <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626]">
          <div className="flex items-center text-rose-400 mb-2">
            <DollarSign className="h-4 w-4 mr-2" />
            <div className="text-[11px] uppercase tracking-[0.05em] font-semibold">Outstanding AR Balance</div>
          </div>
          <div className="text-3xl font-bold text-white">${pendingBalance > 0 ? pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
          <div className="text-[11px] font-medium text-[#a3a3a3] mt-2">Remaining payments needed</div>
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
              placeholder="Search by customer or address..."
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-[#262626] rounded-lg text-sm font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#0a0a0a] bg-[#171717] shadow-sm transition-colors">
            <Filter className="h-4 w-4 mr-2 opacity-70" />
            Filter Status
          </button>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-[#262626]">
            <thead className="bg-[#0a0a0a]/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Customer / Property
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Job Total (RCV)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Collected Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Balance Due
                </th>
                <th scope="col" className="px-6 py-3 text-left text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">
                  Next Payment Step
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#171717] divide-y divide-[#262626]">
              {activeProjects.map((project) => {
                const claim = project.claim!;
                const rcv = claim.rcv || 0;
                const collected = claim.totalCollected || 0;
                const balance = Math.max(0, rcv - collected);
                const isPaidInFull = rcv > 0 && balance === 0;

                return (
                  <tr 
                    key={project.id} 
                    className="hover:bg-[#0a0a0a]/50 cursor-pointer transition-colors group"
                    onClick={() => onNavigate('project_detail', project.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[13px] font-bold text-white">
                        {project.customer.firstName} {project.customer.lastName}
                      </div>
                      <div className="text-[11px] text-[#a3a3a3] mt-0.5">
                        {project.customer.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-white">
                      {rcv > 0 ? `$${rcv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="text-[#737373] font-normal">TBD</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-emerald-400">
                      {collected > 0 ? `$${collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <span className="text-[#a3a3a3] font-normal">--</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-rose-400">
                      {isPaidInFull ? (
                        <span className="text-[#a3a3a3] font-normal">Paid</span>
                      ) : (
                        `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPaidInFull ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Paid in Full
                        </span>
                      ) : (
                        <button 
                          onClick={(e) => handleOpenPayment(e, project.id)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            collected === 0 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {collected === 0 ? <Wallet className="h-3 w-3 mr-1.5" /> : <DollarSign className="h-3 w-3 mr-1.5" />}
                          {collected === 0 ? 'Receive 50% Upfront' : 'Collect Backend / Final'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#171717] rounded-2xl border border-[#262626] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0a0a0a]">
              <h2 className="text-lg font-bold text-white flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
                Record Payment
              </h2>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#a3a3a3] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-2">
                  Select Project
                </label>
                <select 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-white appearance-none focus:outline-none focus:border-white transition-colors"
                >
                  <option value="" disabled>Choose a project...</option>
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.customer.firstName} {p.customer.lastName} - {p.customer.address}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProjectObj && selectedProjectObj.claim && (
                <div className="bg-[#0a0a0a] border border-[#262626] p-4 rounded-xl flex justify-between text-sm">
                  <div>
                    <div className="text-[#a3a3a3] mb-1">Total Job RCV</div>
                    <div className="text-white font-bold">${selectedProjectObj.claim.rcv?.toLocaleString() || '0'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#a3a3a3] mb-1">Outstanding Balance</div>
                    <div className="text-rose-400 font-bold">
                      ${Math.max(0, (selectedProjectObj.claim.rcv || 0) - (selectedProjectObj.claim.totalCollected || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-3">
                  Payment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentOption('50_upfront')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      paymentOption === '50_upfront' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
                    }`}
                  >
                    <div className="font-bold text-[13px] mb-1">50% Upfront</div>
                    <div className="text-[11px] opacity-70">Initial Check / ACV</div>
                  </button>
                  <button
                    onClick={() => setPaymentOption('50_backend')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      paymentOption === '50_backend' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
                    }`}
                  >
                    <div className="font-bold text-[13px] mb-1">50% Backend</div>
                    <div className="text-[11px] opacity-70">Depreciation / Final</div>
                  </button>
                  <button
                    onClick={() => setPaymentOption('full')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      paymentOption === 'full' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
                    }`}
                  >
                    <div className="font-bold text-[13px] mb-1">Paid in Full</div>
                    <div className="text-[11px] opacity-70">Collect all renaming</div>
                  </button>
                  <button
                    onClick={() => setPaymentOption('custom')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      paymentOption === 'custom' 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-[#0a0a0a] border-[#262626] text-[#a3a3a3] hover:border-[#404040]'
                    }`}
                  >
                    <div className="font-bold text-[13px] mb-1">Custom Amount</div>
                    <div className="text-[11px] opacity-70">Partial / specific checks</div>
                  </button>
                </div>
              </div>

              {paymentOption === 'custom' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-2">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3a3a3]">$</span>
                    <input 
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0.00"
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#262626] bg-[#0a0a0a] flex justify-end gap-3">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 border border-[#262626] text-white font-bold text-sm rounded-lg hover:bg-[#171717] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPayment}
                disabled={!selectedProjectId || isSubmitting || (paymentOption === 'custom' && !customAmount)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors flex items-center shadow-sm shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing</>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
