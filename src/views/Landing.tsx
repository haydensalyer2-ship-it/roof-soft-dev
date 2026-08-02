import { useState } from 'react';
import {
  ArrowRight, BarChart3, Bot, Check, ChevronRight, ClipboardCheck, FileText,
  Loader2, Map, Menu, ShieldCheck, Sparkles, Users, X, Zap,
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

const features = [
  { icon: Bot, number: '01', title: 'AI damage reports', copy: 'Turn field photos and inspection notes into polished, carrier-ready reports in minutes—not hours.' },
  { icon: Map, number: '02', title: 'Territory intelligence', copy: 'Focus your team with live storm mapping, canvassing tools, and a clear view of every opportunity.' },
  { icon: Users, number: '03', title: 'One sales pipeline', copy: 'Track every lead, inspection, claim, and contract from first knock through final payment.' },
  { icon: BarChart3, number: '04', title: 'Financial clarity', copy: 'See production value, outstanding balances, conversion rates, and team performance at a glance.' },
];

const workflow = [
  { icon: Map, label: 'Find', title: 'Spot the opportunity', copy: 'Identify storm-affected neighborhoods and coordinate your field team from a shared map.' },
  { icon: ClipboardCheck, label: 'Inspect', title: 'Capture every detail', copy: 'Build a complete project record with photos, notes, damage findings, and homeowner details.' },
  { icon: Sparkles, label: 'Report', title: 'Let AI do the paperwork', copy: 'Generate professional, branded documentation built to communicate damage with confidence.' },
  { icon: FileText, label: 'Close', title: 'Move the claim forward', copy: 'Keep sales, supplements, production, and payments connected until the job is complete.' },
];

export function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const scrollToAuth = (login: boolean) => {
    setIsLogin(login);
    setMobileOpen(false);
    window.setTimeout(() => document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setMsg(null);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not complete your request. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError(null);
    try { await signInWithPopup(auth, googleProvider); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Google sign-in was unsuccessful.'); }
    finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!email) { setError('Enter your email address first, then select “Forgot password?”'); return; }
    try { await sendPasswordResetEmail(auth, email); setMsg('Password reset email sent. Check your inbox.'); setError(null); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to send reset email.'); }
  };

  return (
    <div className="landing-shell">
      <nav className="landing-nav" aria-label="Main navigation">
        <a href="#top" className="landing-logo" aria-label="Rafter home">
          <span className="landing-logo-mark"><img src="/logo.svg" alt="" /></span><span>RAFTER <b>AI</b></span>
        </a>
        <div className="landing-nav-links">
          <a href="#platform">Platform</a><a href="#workflow">How it works</a><a href="#results">Why Rafter</a>
        </div>
        <div className="landing-nav-actions">
          <button className="nav-login" onClick={() => scrollToAuth(true)}>Log in</button>
          <button className="nav-cta" onClick={() => scrollToAuth(false)}>Get started <ArrowRight /></button>
        </div>
        <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X /> : <Menu />}</button>
        {mobileOpen && <div className="mobile-panel"><a href="#platform" onClick={() => setMobileOpen(false)}>Platform</a><a href="#workflow" onClick={() => setMobileOpen(false)}>How it works</a><a href="#results" onClick={() => setMobileOpen(false)}>Why Rafter</a><button onClick={() => scrollToAuth(true)}>Log in</button><button className="nav-cta" onClick={() => scrollToAuth(false)}>Get started</button></div>}
      </nav>

      <main id="top">
        <section className="hero-section">
          <div className="hero-glow" />
          <div className="hero-copy">
            <div className="eyebrow"><span /><Zap /> Built for restoration teams</div>
            <h1>The operating system for <em>roofing growth.</em></h1>
            <p>Rafter brings your sales pipeline, field inspections, AI-powered damage reports, canvassing, and financials into one focused platform.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollToAuth(false)}>Start building momentum <ArrowRight /></button>
              <a className="text-button" href="#platform">Explore the platform <ChevronRight /></a>
            </div>
            <div className="hero-proof"><span><Check /> No credit card required</span><span><Check /> Built for the field</span><span><Check /> Set up in minutes</span></div>
          </div>

          <div className="product-stage" aria-label="Rafter platform dashboard preview">
            <div className="stage-orbit orbit-one" /><div className="stage-orbit orbit-two" />
            <div className="dashboard-preview">
              <div className="preview-sidebar">
                <div className="preview-brand"><img src="/logo.svg" alt="" /></div>
                {[0,1,2,3,4].map(i => <span key={i} className={i === 0 ? 'active' : ''} />)}
              </div>
              <div className="preview-main">
                <div className="preview-top"><div><small>GOOD MORNING, ALEX</small><strong>Command Center</strong></div><div className="preview-avatar">AM</div></div>
                <div className="metric-grid">
                  <div><small>ACTIVE PIPELINE</small><strong>$1.24M</strong><b>+18.4%</b></div>
                  <div><small>OPEN PROJECTS</small><strong>48</strong><b>+6 this week</b></div>
                  <div><small>CLOSE RATE</small><strong>42%</strong><b>+4.2%</b></div>
                </div>
                <div className="preview-panels">
                  <div className="chart-panel"><span>Revenue performance</span><div className="fake-chart"><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="chart-line"><svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 78 C50 65, 52 86, 95 57 S155 64, 190 40 S245 67, 275 34 S350 53,400 10" /></svg></div></div>
                  <div className="jobs-panel"><span>Project pipeline</span>{[['Inspection','12'],['Adjuster','08'],['Approved','18'],['Production','10']].map((j,i)=><div key={j[0]}><i className={`dot d${i}`}/><small>{j[0]}</small><b>{j[1]}</b></div>)}</div>
                </div>
              </div>
            </div>
            <div className="floating-card report-card"><span><FileText /></span><div><small>REPORT GENERATED</small><strong>1847 Oak Ridge Dr.</strong></div><Check /></div>
            <div className="floating-card ai-card"><span><Sparkles /></span><div><small>RAFTER AI</small><strong>18 damage points found</strong></div></div>
          </div>
        </section>

        <section className="trust-strip"><p>ONE PLATFORM. EVERY STEP OF THE RESTORATION JOURNEY.</p><div><span>LEAD CAPTURE</span><i/> <span>INSPECTIONS</span><i/> <span>CLAIMS</span><i/> <span>PRODUCTION</span><i/> <span>FINANCIALS</span></div></section>

        <section className="features-section" id="platform">
          <div className="section-heading"><div><span className="section-kicker">THE PLATFORM</span><h2>Everything your team needs.<br/><em>Nothing they don't.</em></h2></div><p>Purpose-built tools replace scattered apps, manual reports, and lost context with one dependable source of truth.</p></div>
          <div className="feature-grid">{features.map(({icon: Icon, number, title, copy}) => <article key={title}><div className="feature-icon"><Icon /></div><span>{number}</span><h3>{title}</h3><p>{copy}</p><a href="#access">Learn more <ArrowRight /></a></article>)}</div>
        </section>

        <section className="workflow-section" id="workflow">
          <div className="workflow-intro"><span className="section-kicker light">HOW IT WORKS</span><h2>From first knock<br/>to <em>final payment.</em></h2><p>A connected workflow that keeps every person, document, and next step moving in the same direction.</p></div>
          <div className="workflow-list">{workflow.map(({icon: Icon,label,title,copy},i)=><article key={label}><div className="workflow-number">0{i+1}</div><div className="workflow-icon"><Icon /></div><div><small>{label}</small><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
        </section>

        <section className="results-section" id="results">
          <div className="results-visual"><div className="rings"><ShieldCheck/><span className="ring r1"/><span className="ring r2"/><span className="ring r3"/></div><div className="result-chip chip-one"><strong>4.8×</strong><small>FASTER REPORTING</small></div><div className="result-chip chip-two"><strong>100%</strong><small>PIPELINE VISIBILITY</small></div></div>
          <div className="results-copy"><span className="section-kicker">WHY RAFTER</span><h2>Less admin.<br/>More <em>momentum.</em></h2><p>Rafter gives owners a clearer business, managers a more accountable team, and reps more time to sell.</p><ul><li><Check/> Standardize the way every rep sells and documents</li><li><Check/> Create a premium, consistent homeowner experience</li><li><Check/> Make faster decisions with real-time operating data</li><li><Check/> Keep every job accountable from lead to revenue</li></ul></div>
        </section>

        <section className="access-section" id="access">
          <div className="access-copy"><span className="section-kicker light">YOUR NEXT CHAPTER</span><h2>Build a roofing business that runs <em>as strong as it sells.</em></h2><p>Join the next generation of restoration teams operating with speed, clarity, and confidence.</p><div className="access-quote"><Sparkles/><blockquote>“Everything the team needs is finally in one place.”</blockquote><span>— OPERATIONS, RESTORATION TEAM</span></div></div>
          <div className="auth-card">
            <div className="auth-tabs"><button className={isLogin ? 'active':''} onClick={()=>{setIsLogin(true);setError(null)}}>Log in</button><button className={!isLogin ? 'active':''} onClick={()=>{setIsLogin(false);setError(null)}}>Create account</button></div>
            <h3>{isLogin ? 'Welcome back.' : 'Start with Rafter.'}</h3><p>{isLogin ? 'Enter your details to open your command center.' : 'Create your account and bring your operation together.'}</p>
            {error && <div className="auth-alert error">{error}</div>}{msg && <div className="auth-alert success">{msg}</div>}
            <form onSubmit={handleAuth}>
              <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required /></label>
              <label><span>Password {isLogin && <button type="button" onClick={resetPassword}>Forgot password?</button>}</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
              <button className="auth-submit" disabled={loading}>{loading ? <Loader2 className="spin"/> : <>{isLogin ? 'Open Rafter' : 'Create my account'} <ArrowRight/></>}</button>
            </form>
            <div className="auth-divider"><span>OR CONTINUE WITH</span></div>
            <button className="google-button" onClick={handleGoogleLogin} disabled={loading}><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-2 3.3-4.8 3.3-8.2Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1a6.4 6.4 0 0 1-6.2-4.5H2.2V17A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14.1A6.6 6.6 0 0 1 5.5 12c0-.7.1-1.4.3-2.1V7.1H2.2A11 11 0 0 0 1 12c0 1.8.4 3.5 1.2 4.9l3.6-2.8Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.5 4.2 1.6l3.2-3.1A10.7 10.7 0 0 0 12 1a11 11 0 0 0-9.8 6.1l3.6 2.8A6.5 6.5 0 0 1 12 5.4Z"/></svg> Continue with Google</button>
            <small className="auth-terms">By continuing, you agree to Rafter's Terms and Privacy Policy.</small>
          </div>
        </section>
      </main>
      <footer><a href="#top" className="landing-logo"><span className="landing-logo-mark"><img src="/logo.svg" alt="" /></span><span>RAFTER <b>AI</b></span></a><p>Built for the people building what's next.</p><span>© {new Date().getFullYear()} RAFTER AI</span></footer>
    </div>
  );
}
