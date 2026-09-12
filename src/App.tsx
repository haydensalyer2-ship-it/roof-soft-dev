import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Projects } from './views/Projects';
import { ProjectDetail } from './views/ProjectDetail';
import { DamageReports } from './views/DamageReports';
import { Financials } from './views/Financials';
import { NewLead } from './views/NewLead';
import { Settings } from './views/Settings';
import { ReportGenerator } from './views/ReportGenerator';
import { Landing } from './views/Landing';
import { AdminDashboard } from './views/AdminDashboard';
import { DoorKnockerWorkspace } from './views/DoorKnockerWorkspace';
import { KnockAnalytics } from './views/KnockAnalytics';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Loader2 } from 'lucide-react';
import { Project } from './types';
import { ensureWorkspace } from './lib/workspace';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [workspaceStorageReady, setWorkspaceStorageReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  
  // Shared Branding State
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repRole, setRepRole] = useState('Owner');

  // Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) { setOrganizationId(null); setAuthLoading(false); return; }
      try {
        const profile = await ensureWorkspace(user);
        setOrganizationId(profile.organizationId);
        setRepName(profile.displayName);
        setRepEmail(profile.email);
        setRepRole(profile.role === 'sales_rep' ? 'Sales Rep' : profile.role[0].toUpperCase() + profile.role.slice(1));
      } catch (error) {
        console.error('Unable to load workspace', error);
      } finally { setAuthLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Firestore Projects for current user
  useEffect(() => {
    if (!currentUser || !organizationId) {
      setProjects([]);
      return;
    }

    const q = query(
      collection(db, 'projects'), 
      where('organizationId', '==', organizationId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Pull down real projects
      const fetchedProjects = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Handle serverTimestamp properly (often null when still pending locally)
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as Project;
      });

      // Sort local since we might not have a composite index for orderBy('createdAt', 'desc') right now
      fetchedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setProjects(fetchedProjects);
      
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, [currentUser, organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    setWorkspaceStorageReady(false);
    const key = (name: string) => `rafter:${organizationId}:${name}`;
    setCompanyName(localStorage.getItem(key('companyName')) || '');
    setCompanyWebsite(localStorage.getItem(key('companyWebsite')) || '');
    setCompanyPhone(localStorage.getItem(key('companyPhone')) || '');
    setCompanyAddress(localStorage.getItem(key('companyAddress')) || '');
    setLogoImage(localStorage.getItem(key('logoImage')));
    setRepPhone(localStorage.getItem(key('repPhone')) || '');
    setWorkspaceStorageReady(true);
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !workspaceStorageReady) return;
    const key = (name: string) => `rafter:${organizationId}:${name}`;
    localStorage.setItem(key('companyName'), companyName);
    localStorage.setItem(key('companyWebsite'), companyWebsite);
    localStorage.setItem(key('companyPhone'), companyPhone);
    localStorage.setItem(key('companyAddress'), companyAddress);
  }, [organizationId, workspaceStorageReady, companyName, companyWebsite, companyPhone, companyAddress]);

  useEffect(() => {
    if (!organizationId || !workspaceStorageReady) return;
    if (logoImage) {
      localStorage.setItem(`rafter:${organizationId}:logoImage`, logoImage);
    } else {
      localStorage.removeItem(`rafter:${organizationId}:logoImage`);
    }
  }, [organizationId, workspaceStorageReady, logoImage]);

  useEffect(() => {
    if (organizationId && workspaceStorageReady) localStorage.setItem(`rafter:${organizationId}:repPhone`, repPhone);
  }, [organizationId, workspaceStorageReady, repPhone]);

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    if (id) {
      setSelectedProjectId(id);
    }
  };

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)
    : undefined;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Landing />;
  }

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {currentView === 'dashboard' && (
        <Dashboard projects={projects} onNavigate={handleNavigate} repRole={repRole} repName={repName} />
      )}
      {currentView === 'projects' && (
        <Projects projects={projects} onNavigate={handleNavigate} />
      )}
      {currentView === 'project_detail' && selectedProject && (
        <ProjectDetail project={selectedProject} onNavigate={handleNavigate} />
      )}
      {currentView === 'reports' && (
        <DamageReports projects={projects} onNavigate={handleNavigate} />
      )}
      {currentView === 'invoices' && (
        <Financials projects={projects} onNavigate={handleNavigate} />
      )}
      {currentView === 'new_lead' && (
        <NewLead onNavigate={handleNavigate} organizationId={organizationId!} />
      )}
      {currentView === 'generate_report' && (
        <ReportGenerator 
          project={selectedProject} 
          projects={projects}
          onNavigate={handleNavigate} 
          companyName={companyName}
          companyWebsite={companyWebsite}
          companyPhone={companyPhone}
          companyAddress={companyAddress}
          logoImage={logoImage}
          repName={repName}
          repPhone={repPhone}
          repEmail={repEmail}
          repRole={repRole}
        />
      )}
      {currentView === 'settings' && (
        <Settings 
          onNavigate={handleNavigate} 
          companyName={companyName}
          setCompanyName={setCompanyName}
          companyWebsite={companyWebsite}
          setCompanyWebsite={setCompanyWebsite}
          companyPhone={companyPhone}
          setCompanyPhone={setCompanyPhone}
          companyAddress={companyAddress}
          setCompanyAddress={setCompanyAddress}
          logoImage={logoImage}
          setLogoImage={setLogoImage}
          repName={repName}
          setRepName={setRepName}
          repPhone={repPhone}
          setRepPhone={setRepPhone}
          repEmail={repEmail}
          setRepEmail={setRepEmail}
          repRole={repRole}
          setRepRole={setRepRole}
        />
      )}
      {currentView === 'door_knocker' && (
        <DoorKnockerWorkspace organizationId={organizationId!} />
      )}
      {currentView === 'knock_manager' && (
        <KnockAnalytics onNavigate={handleNavigate} organizationId={organizationId!} />
      )}
      {currentView === 'admin_dashboard' && (
        <AdminDashboard projects={projects} onNavigate={handleNavigate} organizationId={organizationId!} />
      )}
    </Layout>
  );
}
