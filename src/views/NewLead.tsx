import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Save, 
  User, 
  MapPin, 
  Building, 
  ShieldAlert, 
  Phone, 
  Mail, 
  Clock, 
  Map, 
  Hash, 
  FileText,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface NewLeadProps {
  onNavigate: (view: string) => void;
}

export function NewLead({ onNavigate }: NewLeadProps) {
  const [urgency, setUrgency] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    source: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveLead = async () => {
    if (!auth.currentUser) return;
    if (!formData.firstName || !formData.lastName || !formData.address) {
      setError('Please fill in required fields (Name and Address).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'projects'), {
        userId: auth.currentUser.uid,
        customer: {
          id: crypto.randomUUID(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },
        status: 'new',
        urgency: urgency,
        source: formData.source,
        notes: formData.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      onNavigate('projects');
    } catch (err: any) {
      console.error("Error adding document: ", err);
      setError(err.message || "Failed to save lead.");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button 
          onClick={() => onNavigate('projects')}
          className="flex items-center text-xs font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Cancel & Return
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Create New Lead</h1>
            <p className="text-[14px] text-[#a3a3a3] mt-1">Capture intake details to generate a new customer pipeline.</p>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm flex items-center">
          <ShieldAlert className="h-5 w-5 mr-3 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#171717] rounded-2xl border border-[#262626] shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffffff] to-[#a3a3a3]"></div>
            <div className="p-6 md:p-8">
              <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-white font-bold mb-6">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">First Name *</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#404040] group-focus-within:text-white transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    <input 
                      type="text" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-all" 
                      placeholder="e.g. John" 
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Last Name *</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#404040] group-focus-within:text-white transition-colors">
                      <User className="h-4 w-4" />
                    </div>
                    <input 
                      type="text" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-all" 
                      placeholder="e.g. Doe" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#404040] group-focus-within:text-white transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-all" 
                      placeholder="(555) 000-0000" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#404040] group-focus-within:text-white transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-all" 
                      placeholder="john@example.com" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Property Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#171717] rounded-2xl border border-[#262626] shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4d4d4] to-[#a3a3a3]"></div>
            <div className="p-6 md:p-8">
              <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-[#d4d4d4] font-bold mb-6">
                <MapPin className="h-4 w-4 mr-2" />
                Property Details
              </div>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Street Address *</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#404040] group-focus-within:text-[#d4d4d4] transition-colors">
                      <Map className="h-4 w-4" />
                    </div>
                    <input 
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange} 
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#d4d4d4] transition-all" 
                      placeholder="123 Main St" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">City</label>
                    <input 
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#d4d4d4] transition-all" 
                      placeholder="Springfield" 
                    />
                  </div>
                  <div className="md:col-span-1 space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">State</label>
                    <input 
                      type="text" 
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#d4d4d4] transition-all text-center uppercase" 
                      placeholder="IL" 
                      maxLength={2} 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Zip Code</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#404040] group-focus-within:text-[#d4d4d4] transition-colors">
                        <Hash className="h-4 w-4" />
                      </div>
                      <input 
                        type="text" 
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#d4d4d4] transition-all" 
                        placeholder="62704" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Urgency */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#171717] rounded-2xl border border-[#262626] shadow-lg relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-all duration-300 ${urgency === 'emergency' ? 'from-[#f87171] to-[#ef4444]' : 'from-[#a3a3a3] to-[#404040]'}`}></div>
            <div className="p-6">
               <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-white font-bold mb-5">
                  <ShieldAlert className={`h-4 w-4 mr-2 transition-colors ${urgency === 'emergency' ? 'text-[#f87171]' : 'text-[#737373]'}`} />
                  Response Urgency
               </div>
               <div className="space-y-3">
                 <button
                   type="button"
                   onClick={() => setUrgency('standard')}
                   className={`w-full flex items-start p-4 rounded-xl border text-left transition-all ${
                     urgency === 'standard' 
                       ? 'bg-white/10 border-white shadow-[0_0_15px_rgba(56,189,248,0.1)] ring-1 ring-[#ffffff]' 
                       : 'bg-[#0a0a0a] border-[#262626] hover:border-[#404040]'
                   }`}
                 >
                   <Clock className={`h-5 w-5 mr-3 mt-0.5 shrink-0 ${urgency === 'standard' ? 'text-white' : 'text-[#737373]'}`} />
                   <div>
                     <div className={`text-[13px] font-bold ${urgency === 'standard' ? 'text-white' : 'text-[#a3a3a3]'}`}>Standard Inspection</div>
                     <div className="text-[11px] text-[#737373] mt-1 leading-relaxed">Schedule within next 24-48 hours sequence.</div>
                   </div>
                 </button>
                 
                 <button
                   type="button"
                   onClick={() => setUrgency('emergency')}
                   className={`w-full flex items-start p-4 rounded-xl border text-left transition-all ${
                     urgency === 'emergency' 
                       ? 'bg-[#f87171]/10 border-[#f87171] shadow-[0_0_15px_rgba(248,113,113,0.15)] ring-1 ring-[#f87171]' 
                       : 'bg-[#0a0a0a] border-[#262626] hover:border-[#404040]'
                   }`}
                 >
                   <ShieldAlert className={`h-5 w-5 mr-3 mt-0.5 shrink-0 ${urgency === 'emergency' ? 'text-[#f87171]' : 'text-[#737373]'}`} />
                   <div>
                     <div className={`text-[13px] font-bold ${urgency === 'emergency' ? 'text-[#f87171]' : 'text-[#a3a3a3]'}`}>Emergency Tarping</div>
                     <div className="text-[11px] text-[#737373] mt-1 leading-relaxed">Immediate dispatch required. Roof actively leaking.</div>
                   </div>
                 </button>
               </div>
            </div>
          </motion.div>

          {/* Lead Source */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#171717] rounded-2xl border border-[#262626] shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4d4d4] to-[#404040]"></div>
            <div className="p-6">
              <div className="flex items-center text-[11px] uppercase tracking-[0.05em] text-[#d4d4d4] font-bold mb-5">
                <Building className="h-4 w-4 mr-2" />
                Lead Source
              </div>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Acquisition Source</label>
                  <div className="relative group">
                    <select 
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-4 pr-10 py-3 text-white text-[13px] focus:outline-none focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#d4d4d4] transition-all appearance-none"
                    >
                      <option value="" disabled>Select source...</option>
                      <option value="Door Knocking">Door Knocking</option>
                      <option value="Referral">Referral</option>
                      <option value="Google Ad">Google Ad</option>
                      <option value="Website">Website</option>
                      <option value="Previous Customer">Previous Customer</option>
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#404040] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#d4d4d4] transition-colors" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-white ml-1">Initial Notes</label>
                  <div className="relative group">
                    <div className="absolute top-3.5 left-3.5 pointer-events-none text-[#404040] group-focus-within:text-[#d4d4d4] transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <textarea 
                      rows={4} 
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-white text-[13px] placeholder:text-[#404040] placeholder:font-medium focus:outline-none focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#d4d4d4] transition-all resize-none"
                      placeholder="Additional context about this lead..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-4 border-t border-[#262626] pt-6"
      >
        <button 
          onClick={() => onNavigate('projects')}
          disabled={loading}
          className="w-full sm:w-auto bg-[#171717] text-white border border-[#262626] hover:bg-[#262626] px-8 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={handleSaveLead}
          disabled={loading}
          className="w-full sm:w-auto justify-center bg-white text-black hover:bg-neutral-300 px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Lead
        </button>
      </motion.div>
    </div>
  );
}
