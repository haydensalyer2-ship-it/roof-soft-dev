import { User, Bell, Shield, Wallet, Building, Moon, Monitor, UploadCloud, CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface SettingsProps {
  onNavigate: (view: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  companyWebsite: string;
  setCompanyWebsite: (url: string) => void;
  companyPhone: string;
  setCompanyPhone: (phone: string) => void;
  companyAddress: string;
  setCompanyAddress: (address: string) => void;
  logoImage: string | null;
  setLogoImage: (image: string | null) => void;
  repName: string;
  setRepName: (name: string) => void;
  repPhone: string;
  setRepPhone: (phone: string) => void;
  repEmail: string;
  setRepEmail: (email: string) => void;
  repRole: string;
  setRepRole: (role: string) => void;
}

export function Settings({ 
  onNavigate, companyName, setCompanyName, companyWebsite, setCompanyWebsite, companyPhone, setCompanyPhone, companyAddress, setCompanyAddress, logoImage, setLogoImage,
  repName, setRepName, repPhone, setRepPhone, repEmail, setRepEmail, repRole, setRepRole
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState('organization');
  const [orgSaved, setOrgSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleOrgSave = () => {
    setOrgSaved(true);
    setTimeout(() => setOrgSaved(false), 2000);
  };
  
  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[13px] text-[#a3a3a3] mt-1">Manage your account, organization, and app preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          {[
            { id: 'profile', icon: User, label: 'Profile' },
            { id: 'organization', icon: Building, label: 'Organization' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'security', icon: Shield, label: 'Security' },
            { id: 'billing', icon: Wallet, label: 'Billing & Plan' },
            { id: 'appearance', icon: Monitor, label: 'Appearance' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors text-sm font-semibold ${
                activeTab === tab.id ? 'bg-white/10 text-white border border-white/30' : 'text-[#a3a3a3] hover:bg-[#171717] hover:text-white border border-transparent'
              }`}
            >
              <tab.icon className={`h-4 w-4 mr-3 ${activeTab === tab.id ? 'text-white' : 'opacity-70'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          
          {activeTab === 'organization' && (
            <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-sm">
              <h2 className="text-white font-bold mb-4">Organization Branding</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="h-24 w-24 rounded-lg border-2 border-dashed border-[#262626] bg-[#0a0a0a] flex items-center justify-center cursor-pointer hover:border-[#d4d4d4] transition-colors relative overflow-hidden group"
                >
                  {logoImage ? (
                    <>
                      <img src={logoImage} alt="Logo" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                         <UploadCloud className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <UploadCloud className="h-8 w-8 text-[#404040] group-hover:text-[#d4d4d4]" />
                  )}
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/svg+xml" 
                    className="hidden" 
                    ref={logoInputRef} 
                    onChange={handleLogoChange} 
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Company Logo</h3>
                  <p className="text-[11px] text-[#a3a3a3] mb-3">Used on PDF reports and invoices. Recommended size: 512x512px.</p>
                  <div className="flex gap-2">
                    <button onClick={() => logoInputRef.current?.click()} className="bg-white text-black hover:bg-neutral-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                      Upload Logo
                    </button>
                    {logoImage && (
                      <button onClick={() => setLogoImage(null)} className="bg-[#0a0a0a] text-[#f87171] border border-[#262626] hover:bg-[#262626] px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Name</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Website</label>
                    <input 
                      type="text" 
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#262626] flex justify-end">
                  <button onClick={handleOrgSave} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    orgSaved ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-black hover:bg-neutral-300'
                  }`}>
                    {orgSaved ? <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</span> : 'Save Organization Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <>
                <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-sm">
                  <h2 className="text-white font-bold mb-4">Personal Information</h2>
                  
                  <div className="flex items-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-[#0a0a0a] border-2 border-[#262626] flex items-center justify-center text-white font-bold text-xl ring-4 ring-[#ffffff]/10">
                      {repName ? repName.charAt(0) : 'M'}
                    </div>
                    <div className="ml-5">
                      <button className="bg-[#0a0a0a] text-white border border-[#262626] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#262626] transition-colors">
                        Change Avatar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={repEmail}
                        onChange={(e) => setRepEmail(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        value={repPhone}
                        onChange={(e) => setRepPhone(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Role / View Level</label>
                      <select 
                        value={repRole}
                        onChange={(e) => setRepRole(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-[#a3a3a3] text-[13px] focus:outline-none" 
                      >
                        <option value="Manager">Manager</option>
                        <option value="Sales Rep">Sales Rep</option>
                      </select>
                    </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Phone</label>
                    <input 
                      type="text" 
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Company Address</label>
                    <input 
                      type="text" 
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors" 
                    />
                  </div>

                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleProfileSave} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      profileSaved ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-black hover:bg-neutral-300'
                    }`}>
                      {profileSaved ? <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> Saved!</span> : 'Save Changes'}
                    </button>
                  </div>
                </div>

              <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-sm">
                <h2 className="text-white font-bold mb-4">Inspection Preferences</h2>
                
                <div className="space-y-4">
                   <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#a3a3a3] mb-1.5">Default Test Square Size</label>
                      <select className="bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-white focus:ring-1 focus:ring-[#ffffff] transition-colors appearance-none">
                        <option>10ft x 10ft (100 sq ft)</option>
                        <option>Custom</option>
                      </select>
                   </div>
                   <div className="flex items-center justify-between py-3 border-b border-[#262626]">
                     <div>
                       <div className="text-[13px] font-semibold text-white">Auto-Sync Photos</div>
                       <div className="text-[11px] text-[#a3a3a3] mt-0.5">Automatically upload inspection photos on cellular data.</div>
                     </div>
                     <button className="w-10 h-6 bg-white rounded-full relative transition-colors border border-white/30">
                        <div className="w-4 h-4 bg-[#0a0a0a] rounded-full absolute right-1 top-1"></div>
                     </button>
                   </div>
                   <div className="flex items-center justify-between py-3">
                     <div>
                       <div className="text-[13px] font-semibold text-white">Carrier Integrations</div>
                       <div className="text-[11px] text-[#a3a3a3] mt-0.5">Allow generating Xactimate-compatible exports natively.</div>
                     </div>
                     <button className="w-10 h-6 bg-white rounded-full relative transition-colors border border-white/30">
                        <div className="w-4 h-4 bg-[#0a0a0a] rounded-full absolute right-1 top-1"></div>
                     </button>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
