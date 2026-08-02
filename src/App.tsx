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
import { mockProjects as initialMockProjects } from './store/mockData';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Loader2 } from 'lucide-react';
import { Project } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  
  // Shared Branding State
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || 'Rafter AI');
  const [companyWebsite, setCompanyWebsite] = useState(() => localStorage.getItem('companyWebsite') || 'www.rafter.ai');
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('companyPhone') || '1-800-555-0199');
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('companyAddress') || '123 Headquarters Road, Suite 100, Cityville, State 12345');
  const [logoImage, setLogoImage] = useState<string | null>(() => localStorage.getItem('logoImage') || null);
  
  const [repName, setRepName] = useState(() => localStorage.getItem('repName') || 'Mike Builder');
  const [repPhone, setRepPhone] = useState(() => localStorage.getItem('repPhone') || '(555) 123-4567');
  const [repEmail, setRepEmail] = useState(() => localStorage.getItem('repEmail') || 'mike@rafter.ai');
  const [repRole, setRepRole] = useState(() => localStorage.getItem('repRole') || 'Manager');

  // Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Firestore Projects for current user
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      return;
    }

    const q = query(
      collection(db, 'projects'), 
      where('userId', '==', currentUser.uid)
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
      
      // If none exist, we can merge with our local mock data just for visual demonstration purposes during the preview
      if (fetchedProjects.length === 0) {
        setProjects(initialMockProjects);
      } else {
        setProjects(fetchedProjects);
      }
      
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('companyName', companyName);
    localStorage.setItem('companyWebsite', companyWebsite);
    localStorage.setItem('companyPhone', companyPhone);
    localStorage.setItem('companyAddress', companyAddress);
  }, [companyName, companyWebsite, companyPhone, companyAddress]);

  useEffect(() => {
    if (logoImage) {
      localStorage.setItem('logoImage', logoImage);
    } else {
      localStorage.removeItem('logoImage');
    }
  }, [logoImage]);

  useEffect(() => {
    localStorage.setItem('repName', repName);
    localStorage.setItem('repPhone', repPhone);
    localStorage.setItem('repEmail', repEmail);
    localStorage.setItem('repRole', repRole);
  }, [repName, repPhone, repEmail, repRole]);

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
        <NewLead onNavigate={handleNavigate} />
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
        <DoorKnockerWorkspace />
      )}
      {currentView === 'knock_manager' && (
        <KnockAnalytics onNavigate={handleNavigate} />
      )}
      {currentView === 'admin_dashboard' && (
        <AdminDashboard projects={projects} onNavigate={handleNavigate} />
      )}
    </Layout>
  );
}
