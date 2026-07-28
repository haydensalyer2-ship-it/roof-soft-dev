import { useState } from 'react';
import { Shield, ArrowRight, Activity, Zap, CheckCircle2, Loader2, Info } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during Google sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row text-white font-sans">
      
      {/* Left side: Branding & Value Prop */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 lg:p-24 relative overflow-hidden bg-[#0a0a0a] border-r border-[#171717]">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#171717]/50 to-transparent rounded-full blur-3xl -ml-64 -mt-32 opacity-50"></div>
        
        <div className="relative z-10 flex items-center font-bold text-xl tracking-tight">
          <img src="/logo.svg" alt="Rafter AI Logo" className="h-7 w-7 mr-2 rounded-lg border border-[#262626]" />
          RAFTER AI
        </div>

        <div className="relative z-10 my-16 md:my-0 flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center text-[11px] font-bold uppercase tracking-widest text-[#a3a3a3] mb-6">
            <Activity className="h-4 w-4 mr-2" />
            The Ultimate Claims OS
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            Generate <br /> Reports <span className="text-[#737373] text-3xl md:text-5xl">&</span> win <br /> claims.
          </h1>
          <p className="text-lg text-[#a3a3a3] max-w-md font-medium leading-relaxed mb-10">
            A command center for roofing sales and production perfectly tuned for high-volume storm restoration.
          </p>

          <ul className="space-y-4">
            {['Automated Premium PDF Inspections', 'Live Carrier Pipeline Tracking', 'Interactive Real-Time Storm Map'].map((feature, i) => (
              <li key={i} className="flex items-center font-semibold text-[#d4d4d4]">
                <CheckCircle2 className="h-5 w-5 mr-3 text-white" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-[11px] font-medium tracking-widest uppercase text-[#737373]">
          &copy; {new Date().getFullYear()} Rafter AI. All rights reserved.
        </div>
      </div>

      {/* Right side: Login / Signup */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-[#a3a3a3] font-medium">
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Sign up to start generating premium reports'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start">
              <Info className="h-5 w-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#a3a3a3] font-bold mb-2">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder-[#404040]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#a3a3a3] font-bold mb-2 flex justify-between">
                Password
                {isLogin && <button type="button" onClick={async () => { if(!email) setError("Please enter your email to reset password."); else { try { await sendPasswordResetEmail(auth, email); setMsg("Password reset email sent."); setError(null); } catch (e: any) { setError(e.message); setMsg(null); } } }} className="text-white hover:underline transition-all">Forgot?</button>}
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder-[#404040]"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold text-sm py-4 rounded-xl flex items-center justify-center hover:bg-[#e5e5e5] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>{isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 h-px bg-[#262626]"></div>
            <div className="px-4 text-[11px] uppercase font-bold tracking-widest text-[#737373]">Or</div>
            <div className="flex-1 h-px bg-[#262626]"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#0a0a0a] border border-[#262626] text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center hover:bg-[#171717] hover:border-[#404040] transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm font-medium text-[#737373]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-white hover:underline font-bold transition-all"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
