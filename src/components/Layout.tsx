import { ReactNode, useState } from 'react';
import {
  MapPin,
  Target,
  Home,
  Briefcase,
  FileText,
  ShieldAlert,
  Settings,
  Bell,
  Search,
  Menu,
  DollarSign,
  Users,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects & Claims', icon: Briefcase },
    { id: 'door_knocker', label: 'Door Knocker (Map)', icon: MapPin },
    { id: 'knock_manager', label: 'Knock KPIs Manager', icon: Target },
    { id: 'reports', label: 'Damage Reports', icon: ShieldAlert },
    { id: 'invoices', label: 'Payments & Finances', icon: DollarSign },
    { id: 'admin_dashboard', label: 'Team & Admin', icon: Users },
  ];

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out', err);
    }
  };

  const userEmail = auth.currentUser?.email || 'User';
  const initial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[9998] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col z-[9999] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shrink-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#262626]">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Rafter AI Logo" className="h-6 w-6 mr-2 rounded" />
            <span className="text-white font-semibold text-lg tracking-tight">Rafter AI</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-[#a3a3a3] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">Navigation</div>
          {navItems.map((item) => {
            const isActive = currentView === item.id || (currentView === 'project_detail' && item.id === 'projects');
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                  isActive 
                    ? 'bg-white/10 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-[#171717] hover:text-white'
                }`}
              >
                <item.icon className={`h-4 w-4 mr-3 ${isActive ? 'text-white' : 'opacity-60'}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-[#262626] bg-[#0a0a0a] shrink-0">
          <button 
            onClick={() => handleNavigate('settings')}
            className={`flex items-center px-3 py-2 text-sm w-full rounded-lg transition-colors ${
              currentView === 'settings' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:bg-[#171717] hover:text-white'
            }`}
          >
            <Settings className={`h-4 w-4 mr-3 ${currentView === 'settings' ? 'text-white' : 'opacity-60'}`} />
            Settings
          </button>
          
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center flex-1 min-w-0 pr-2">
              <div className="h-8 w-8 rounded bg-[#171717] border border-[#262626] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initial}
              </div>
              <div className="ml-3 truncate">
                <div className="text-[10px] uppercase tracking-[0.05em] text-[#a3a3a3] font-semibold">Logged in as</div>
                <div className="text-sm font-medium text-white truncate" title={userEmail}>{userEmail}</div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-[#737373] hover:text-red-400 p-1.5 rounded-md hover:bg-[#171717] transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 bg-[#0a0a0a] border-b border-[#262626] flex items-center justify-between px-4 sm:px-6 relative z-[9997] shrink-0">
          <div className="flex items-center flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-[#a3a3a3] hover:text-white hover:bg-[#171717] rounded-md mr-3 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="max-w-md w-full relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#a3a3a3]" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-[#262626] rounded-lg leading-5 bg-[#171717] text-white placeholder-[#a3a3a3] focus:outline-none focus:ring-1 focus:ring-[#ffffff] focus:border-white sm:text-sm transition-colors"
                placeholder="Search claims, customers, or adjusters..."
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#f87171]" />
              <Bell className="h-5 w-5" />
            </button>
            <button 
              onClick={() => onNavigate('new_lead')}
              className="bg-white hover:bg-neutral-300 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              + New Lead
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 bg-[#0a0a0a]">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
