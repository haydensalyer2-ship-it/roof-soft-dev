import {
  Bell, Building2, Check, CheckCircle2, ChevronRight, CreditCard, Download,
  Eye, EyeOff, FileText, ImagePlus, LogOut, Mail, Moon,
  Palette, RefreshCw, Shield, Trash2, UploadCloud, User, Wallet,
} from 'lucide-react';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface SettingsProps {
  onNavigate: (view: string) => void;
  companyName: string; setCompanyName: (value: string) => void;
  companyWebsite: string; setCompanyWebsite: (value: string) => void;
  companyPhone: string; setCompanyPhone: (value: string) => void;
  companyAddress: string; setCompanyAddress: (value: string) => void;
  logoImage: string | null; setLogoImage: (value: string | null) => void;
  repName: string; setRepName: (value: string) => void;
  repPhone: string; setRepPhone: (value: string) => void;
  repEmail: string; setRepEmail: (value: string) => void;
  repRole: string; setRepRole: (value: string) => void;
}

type TabId = 'profile' | 'organization' | 'notifications' | 'security' | 'billing' | 'appearance';
type Notice = { kind: 'success' | 'error'; text: string } | null;

const inputClass = 'w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-[13px] text-white outline-none transition focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#525252]';
const SETTINGS_KEY = 'rafterSettings';

const defaultPreferences = {
  emailNewLead: true,
  emailClaimUpdate: true,
  emailWeeklySummary: false,
  pushAssignments: true,
  pushMentions: true,
  pushPayments: false,
  testSquare: '10x10',
  autoSync: true,
  carrierExports: true,
  theme: 'dark',
  density: 'comfortable',
  reduceMotion: false,
};

type Preferences = typeof defaultPreferences;

function loadPreferences(): Preferences {
  try {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return defaultPreferences;
  }
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <label className="block">
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#a3a3a3]">{label}</span>
    {children}
    {(error || hint) && <span className={`mt-1.5 block text-[11px] ${error ? 'text-red-400' : 'text-[#737373]'}`}>{error || hint}</span>}
  </label>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
    className={`relative h-6 w-11 shrink-0 rounded-full border transition ${checked ? 'border-white bg-white' : 'border-[#404040] bg-[#262626]'}`}>
    <span className={`absolute top-1 h-4 w-4 rounded-full transition-transform ${checked ? 'translate-x-5 bg-black' : 'translate-x-1 bg-[#a3a3a3]'}`} />
  </button>;
}

function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="flex items-center justify-between gap-5 border-b border-[#262626] py-4 last:border-0">
    <div><p className="text-[13px] font-semibold text-white">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#a3a3a3]">{description}</p></div>
    {children}
  </div>;
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[#262626] bg-[#171717] shadow-sm">
    <div className="border-b border-[#262626] px-5 py-4 sm:px-6">
      <h2 className="font-bold text-white">{title}</h2>
      {description && <p className="mt-1 text-[12px] text-[#a3a3a3]">{description}</p>}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>;
}

export function Settings(props: SettingsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [profile, setProfile] = useState({ name: props.repName, email: props.repEmail, phone: props.repPhone, role: props.repRole });
  const [organization, setOrganization] = useState({ name: props.companyName, website: props.companyWebsite, phone: props.companyPhone, address: props.companyAddress });
  const [logo, setLogo] = useState<string | null>(props.logoImage);
  const [passwordSent, setPasswordSent] = useState(false);
  const [showAccountId, setShowAccountId] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
  useEffect(() => {
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences]);

  const flash = (text: string, kind: Notice['kind'] = 'success') => {
    setNotice({ text, kind });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3500);
  };

  const savePreferences = (next: Preferences, message = 'Preferences saved') => {
    setPreferences(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    flash(message);
  };

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    savePreferences({ ...preferences, [key]: value });
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile.name.trim() || !/^\S+@\S+\.\S+$/.test(profile.email)) return;
    setSaving(true);
    try {
      props.setRepName(profile.name.trim()); props.setRepEmail(profile.email.trim());
      props.setRepPhone(profile.phone.trim()); props.setRepRole(profile.role);
      if (auth.currentUser && auth.currentUser.displayName !== profile.name.trim()) {
        await updateProfile(auth.currentUser, { displayName: profile.name.trim() });
      }
      flash('Profile changes saved');
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Could not save profile', 'error');
    } finally { setSaving(false); }
  };

  const saveOrganization = (event: FormEvent) => {
    event.preventDefault();
    if (!organization.name.trim()) return;
    props.setCompanyName(organization.name.trim()); props.setCompanyWebsite(organization.website.trim());
    props.setCompanyPhone(organization.phone.trim()); props.setCompanyAddress(organization.address.trim());
    props.setLogoImage(logo); flash('Organization settings saved');
  };

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) return flash('Choose a PNG, JPG, WEBP, or SVG image', 'error');
    if (file.size > 2 * 1024 * 1024) return flash('Logo must be smaller than 2 MB', 'error');
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.onerror = () => flash('That image could not be read', 'error');
    reader.readAsDataURL(file);
  };

  const sendReset = async () => {
    const email = auth.currentUser?.email;
    if (!email) return flash('No sign-in email is available for this account', 'error');
    setSaving(true);
    try { await sendPasswordResetEmail(auth, email); setPasswordSent(true); flash(`Password reset sent to ${email}`); }
    catch (error) { flash(error instanceof Error ? error.message : 'Could not send reset email', 'error'); }
    finally { setSaving(false); }
  };

  const downloadInvoice = () => {
    const content = `Rafter AI\nBilling receipt\nPlan: Professional\nStatus: Active\nAccount: ${auth.currentUser?.email || profile.email}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'rafter-ai-receipt.txt'; anchor.click(); URL.revokeObjectURL(url);
    flash('Receipt downloaded');
  };

  const tabs = [
    { id: 'profile' as const, icon: User, label: 'Profile', description: 'Personal details' },
    { id: 'organization' as const, icon: Building2, label: 'Organization', description: 'Brand and company' },
    { id: 'notifications' as const, icon: Bell, label: 'Notifications', description: 'Alerts and emails' },
    { id: 'security' as const, icon: Shield, label: 'Security', description: 'Password and sessions' },
    { id: 'billing' as const, icon: Wallet, label: 'Billing & plan', description: 'Plan and receipts' },
    { id: 'appearance' as const, icon: Palette, label: 'Appearance', description: 'Display preferences' },
  ];

  return <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
    <header className="mb-7 flex items-start justify-between gap-4">
      <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">Workspace</p><h1 className="text-2xl font-bold text-white">Settings</h1><p className="mt-1 text-[13px] text-[#a3a3a3]">Manage your account, organization, and app preferences.</p></div>
      {notice && <div role="status" className={`flex max-w-sm items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${notice.kind === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}><CheckCircle2 className="h-4 w-4 shrink-0" />{notice.text}</div>}
    </header>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-[230px_minmax(0,1fr)]">
      <aside><nav aria-label="Settings navigation" className="flex gap-2 overflow-x-auto pb-2 md:block md:space-y-1 md:overflow-visible">
        {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`group flex min-w-[170px] items-center rounded-xl border px-3 py-3 text-left transition md:w-full md:min-w-0 ${activeTab === tab.id ? 'border-[#404040] bg-[#1f1f1f]' : 'border-transparent hover:bg-[#171717]'}`}>
          <span className={`mr-3 rounded-lg border p-2 ${activeTab === tab.id ? 'border-[#525252] bg-white text-black' : 'border-[#262626] bg-[#171717] text-[#737373] group-hover:text-white'}`}><tab.icon className="h-4 w-4" /></span>
          <span className="min-w-0"><span className={`block text-[13px] font-semibold ${activeTab === tab.id ? 'text-white' : 'text-[#a3a3a3]'}`}>{tab.label}</span><span className="mt-0.5 block text-[10px] text-[#737373]">{tab.description}</span></span>
        </button>)}
      </nav></aside>

      <main className="min-w-0 space-y-5">
        {activeTab === 'profile' && <>
          <Card title="Personal information" description="This information appears on reports, assignments, and customer communications.">
            <form onSubmit={saveProfile}>
              <div className="mb-6 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#404040] bg-[#0a0a0a] text-xl font-bold">{profile.name.trim().charAt(0).toUpperCase() || 'U'}</div><div><p className="text-sm font-semibold text-white">{profile.name || 'Your profile'}</p><p className="mt-1 text-xs text-[#737373]">Profile initials update automatically.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={!profile.name.trim() ? 'A name is required' : undefined}><input className={inputClass} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></Field>
                <Field label="Work email" error={profile.email && !/^\S+@\S+\.\S+$/.test(profile.email) ? 'Enter a valid email address' : undefined}><input type="email" className={inputClass} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></Field>
                <Field label="Phone number"><input type="tel" className={inputClass} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></Field>
                <Field label="Role / view level" hint="Permissions are managed by workspace owners."><select className={inputClass} value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value })}><option>Manager</option><option>Sales Rep</option><option>Owner</option></select></Field>
              </div>
              <div className="mt-6 flex justify-end border-t border-[#262626] pt-5"><button disabled={saving || !profile.name.trim() || !/^\S+@\S+\.\S+$/.test(profile.email)} className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Saving…' : 'Save profile'}</button></div>
            </form>
          </Card>
          <Card title="Inspection preferences" description="Set the defaults used when you begin a new roof inspection.">
            <Field label="Default test square"><select className={inputClass} value={preferences.testSquare} onChange={e => updatePreference('testSquare', e.target.value)}><option value="10x10">10 ft × 10 ft (100 sq ft)</option><option value="5x5">5 ft × 5 ft (25 sq ft)</option><option value="custom">Ask each time</option></select></Field>
            <div className="mt-3"><SettingRow title="Auto-sync photos" description="Upload inspection photos automatically when a connection is available."><Toggle label="Auto-sync photos" checked={preferences.autoSync} onChange={() => updatePreference('autoSync', !preferences.autoSync)} /></SettingRow><SettingRow title="Carrier exports" description="Enable Xactimate-compatible export options in damage reports."><Toggle label="Carrier exports" checked={preferences.carrierExports} onChange={() => updatePreference('carrierExports', !preferences.carrierExports)} /></SettingRow></div>
          </Card>
        </>}

        {activeTab === 'organization' && <Card title="Organization branding" description="Your brand details are used across reports, invoices, and customer documents.">
          <form onSubmit={saveOrganization}>
            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <button type="button" aria-label="Upload company logo" onClick={() => logoInputRef.current?.click()} className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#404040] bg-[#0a0a0a] hover:border-white">{logo ? <img src={logo} className="h-full w-full object-contain p-2" alt="Company logo preview" /> : <ImagePlus className="h-7 w-7 text-[#737373] group-hover:text-white" />}</button>
              <div><p className="text-sm font-semibold text-white">Company logo</p><p className="mt-1 max-w-md text-xs leading-5 text-[#a3a3a3]">PNG, JPG, WEBP, or SVG. Maximum 2 MB. A square transparent image works best.</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => logoInputRef.current?.click()} className="flex items-center rounded-lg border border-[#404040] bg-[#0a0a0a] px-3 py-2 text-xs font-semibold text-white hover:border-[#737373]"><UploadCloud className="mr-2 h-4 w-4" />Choose image</button>{logo && <button type="button" onClick={() => setLogo(null)} className="flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"><Trash2 className="mr-2 h-4 w-4" />Remove</button>}</div></div>
              <input ref={logoInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Company name" error={!organization.name.trim() ? 'A company name is required' : undefined}><input className={inputClass} value={organization.name} onChange={e => setOrganization({ ...organization, name: e.target.value })} /></Field><Field label="Website"><input className={inputClass} placeholder="https://example.com" value={organization.website} onChange={e => setOrganization({ ...organization, website: e.target.value })} /></Field><Field label="Company phone"><input type="tel" className={inputClass} value={organization.phone} onChange={e => setOrganization({ ...organization, phone: e.target.value })} /></Field><Field label="Company address"><input className={inputClass} value={organization.address} onChange={e => setOrganization({ ...organization, address: e.target.value })} /></Field></div>
            <div className="mt-6 flex justify-end border-t border-[#262626] pt-5"><button disabled={!organization.name.trim()} className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-neutral-300 disabled:opacity-40">Save organization</button></div>
          </form>
        </Card>}

        {activeTab === 'notifications' && <>
          <Card title="Email notifications" description="Choose which updates arrive in your inbox."><SettingRow title="New leads" description="Receive an email whenever a new lead is assigned to you."><Toggle label="New lead emails" checked={preferences.emailNewLead} onChange={() => updatePreference('emailNewLead', !preferences.emailNewLead)} /></SettingRow><SettingRow title="Claim status updates" description="Get notified when a claim moves to a new stage."><Toggle label="Claim update emails" checked={preferences.emailClaimUpdate} onChange={() => updatePreference('emailClaimUpdate', !preferences.emailClaimUpdate)} /></SettingRow><SettingRow title="Weekly performance summary" description="A Monday recap of inspections, claims, and collected revenue."><Toggle label="Weekly summary emails" checked={preferences.emailWeeklySummary} onChange={() => updatePreference('emailWeeklySummary', !preferences.emailWeeklySummary)} /></SettingRow></Card>
          <Card title="In-app notifications" description="Control the activity shown in your Rafter AI notification center."><SettingRow title="Assignments" description="Notify me when a project or inspection is assigned."><Toggle label="Assignment notifications" checked={preferences.pushAssignments} onChange={() => updatePreference('pushAssignments', !preferences.pushAssignments)} /></SettingRow><SettingRow title="Mentions and notes" description="Notify me when a teammate mentions me in a project note."><Toggle label="Mention notifications" checked={preferences.pushMentions} onChange={() => updatePreference('pushMentions', !preferences.pushMentions)} /></SettingRow><SettingRow title="Payment activity" description="Notify me about invoice payments and failed transactions."><Toggle label="Payment notifications" checked={preferences.pushPayments} onChange={() => updatePreference('pushPayments', !preferences.pushPayments)} /></SettingRow></Card>
        </>}

        {activeTab === 'security' && <>
          <Card title="Password & authentication" description="Keep your sign-in details secure and up to date."><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="rounded-xl border border-[#333] bg-[#0a0a0a] p-3"><Mail className="h-5 w-5 text-[#a3a3a3]" /></span><div><p className="text-sm font-semibold text-white">Password reset</p><p className="mt-1 text-xs text-[#a3a3a3]">We’ll send a secure reset link to {auth.currentUser?.email || 'your sign-in email'}.</p></div></div><button disabled={saving || passwordSent} onClick={sendReset} className="flex shrink-0 items-center justify-center rounded-lg border border-[#404040] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#262626] disabled:opacity-50"><RefreshCw className="mr-2 h-4 w-4" />{passwordSent ? 'Email sent' : 'Send reset email'}</button></div></Card>
          <Card title="Account security" description="Review the account and device currently signed in."><SettingRow title="Signed-in account" description={showAccountId ? (auth.currentUser?.uid || 'Unavailable') : 'Your account identifier is hidden.'}><button onClick={() => setShowAccountId(!showAccountId)} className="rounded-lg border border-[#333] p-2 text-[#a3a3a3] hover:text-white" aria-label={showAccountId ? 'Hide account identifier' : 'Show account identifier'}>{showAccountId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></SettingRow><SettingRow title="Current session" description="Sign out of this browser. You’ll need to authenticate again."><button onClick={() => signOut(auth)} className="flex items-center rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10"><LogOut className="mr-2 h-4 w-4" />Sign out</button></SettingRow></Card>
        </>}

        {activeTab === 'billing' && <>
          <section className="relative overflow-hidden rounded-2xl border border-[#404040] bg-[#171717] p-6"><div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/5 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Active plan</span><h2 className="mt-4 text-2xl font-bold text-white">Professional</h2><p className="mt-2 max-w-lg text-sm text-[#a3a3a3]">Everything your roofing team needs to manage inspections, claims, reports, and collections.</p></div><div className="shrink-0 text-left sm:text-right"><p className="text-3xl font-bold text-white">$99<span className="text-sm font-medium text-[#737373]"> / month</span></p><p className="mt-1 text-[11px] text-[#737373]">Renews monthly</p></div></div></section>
          <Card title="Plan usage" description="A live summary of features included in this workspace."><div className="grid gap-3 sm:grid-cols-3">{[['Users','12 seats'],['Projects','Unlimited'],['AI reports','Unlimited']].map(([label,value]) => <div key={label} className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-4"><p className="text-[11px] uppercase tracking-wider text-[#737373]">{label}</p><p className="mt-2 text-lg font-bold text-white">{value}</p></div>)}</div><button onClick={() => props.onNavigate('admin_dashboard')} className="mt-5 flex items-center text-xs font-bold text-white hover:text-[#d4d4d4]">Manage team seats <ChevronRight className="ml-1 h-4 w-4" /></button></Card>
          <Card title="Billing history" description="Download a receipt for your latest plan payment."><div className="flex items-center justify-between gap-4 rounded-xl border border-[#262626] bg-[#0a0a0a] p-4"><div className="flex items-center gap-3"><span className="rounded-lg border border-[#333] p-2"><FileText className="h-5 w-5 text-[#a3a3a3]" /></span><div><p className="text-sm font-semibold text-white">Professional plan</p><p className="mt-1 text-xs text-[#737373]">Latest billing receipt · $99.00</p></div></div><button onClick={downloadInvoice} aria-label="Download latest billing receipt" className="rounded-lg border border-[#333] p-2 text-[#a3a3a3] hover:text-white"><Download className="h-4 w-4" /></button></div></Card>
        </>}

        {activeTab === 'appearance' && <>
          <Card title="Theme" description="Rafter AI uses a high-contrast theme designed for field work."><div className="relative flex min-h-28 max-w-xs flex-col justify-between rounded-xl border border-white bg-white/10 p-4 text-left"><Moon className="h-5 w-5 text-[#a3a3a3]" /><span className="text-sm font-semibold text-white">Dark</span><Check className="absolute right-3 top-3 h-4 w-4" /></div></Card>
          <Card title="Display" description="Tune spacing and motion for the way you work."><SettingRow title="Interface density" description="Compact mode fits more project data on screen."><select className="rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-xs text-white outline-none" value={preferences.density} onChange={e => updatePreference('density', e.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></SettingRow><SettingRow title="Reduce motion" description="Minimize transitions and interface animation."><Toggle label="Reduce motion" checked={preferences.reduceMotion} onChange={() => updatePreference('reduceMotion', !preferences.reduceMotion)} /></SettingRow></Card>
        </>}
      </main>
    </div>
  </div>;
}
