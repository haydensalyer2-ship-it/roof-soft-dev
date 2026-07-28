import { Project } from '../types';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useState, useEffect, useRef } from 'react';

interface ProjectsProps {
  projects: Project[];
  onNavigate: (view: string, id?: string) => void;
}

export function Projects({ projects, onNavigate }: ProjectsProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const handleSeedLeads = async () => {
      if (!auth.currentUser) return;
      if (localStorage.getItem('has_seeded_100_leads')) return;
      if (seeded.current) return;
      seeded.current = true;
      setIsSeeding(true);
      
      const firstNames = ['John', 'Emma', 'Michael', 'Olivia', 'William', 'Ava', 'James', 'Isabella', 'Benjamin', 'Mia', 'Lucas', 'Charlotte', 'Henry', 'Amelia', 'Alexander'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
      const streets = ['Main St', 'Oak Dr', 'Maple Ave', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd', 'Lakeview Dr', 'Sunset Blvd', 'Highland Ave'];
      const statuses = ['lead', 'inspection_scheduled', 'inspection_completed', 'claim_filed', 'approved', 'contract_signed', 'production', 'invoiced', 'completed'];
      
      try {
        const promises = [];
        for (let i = 0; i < 100; i++) {
          const first = firstNames[Math.floor(Math.random() * firstNames.length)];
          const last = lastNames[Math.floor(Math.random() * lastNames.length)];
          const address = `${Math.floor(Math.random() * 9000) + 100} ${streets[Math.floor(Math.random() * streets.length)]}`;
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          const randomPastMs = Math.floor(Math.random() * (180 * 24 * 60 * 60 * 1000));
          const pastDate = new Date(Date.now() - randomPastMs);
  
          promises.push(addDoc(collection(db, 'projects'), {
            userId: auth.currentUser.uid,
            customer: {
              id: crypto.randomUUID(),
              firstName: first,
              lastName: last,
              email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
              phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
              address: address
            },
            repName: 'Mock Gen',
            status: status,
            createdAt: Timestamp.fromDate(pastDate),
            updatedAt: Timestamp.now()
          }));
        }
        await Promise.all(promises);
        localStorage.setItem('has_seeded_100_leads', 'true');
        if (isMounted) alert('Automatically added 100 mock leads!');
      } catch (e) {
        console.error('Failed to seed leads:', e);
      } finally {
        if (isMounted) setIsSeeding(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        handleSeedLeads();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'contract_signed':
      case 'approved_or_denied':
        return 'bg-white text-black font-extrabold shadow-sm';
      case 'adjustment':
      case 'claim_filed':
        return 'bg-[#0a0a0a] text-white border border-[#404040]';
      default:
        return 'bg-[#171717] text-[#a3a3a3] border border-[#262626]';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Projects & Claims</h1>
          <p className="text-sm text-[#a3a3a3] mt-2">Manage your pipeline from inspection to final invoice.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button 
            onClick={() => onNavigate('new_lead')}
            className="bg-white hover:bg-neutral-200 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center"
          >
            New Project
          </button>
        </div>
      </div>

      <div className="bg-[#171717] shadow-xl rounded-3xl border border-[#262626] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#262626] flex flex-col sm:flex-row gap-4 justify-between bg-[#171717]">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#737373]" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-2.5 border border-[#404040] rounded-xl text-sm placeholder-[#737373] text-white bg-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-white transition-colors"
              placeholder="Search by name, address, or claim #..."
            />
          </div>
          <button className="flex items-center px-4 py-2.5 border border-[#404040] rounded-xl text-sm font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#262626] bg-[#0a0a0a] transition-all whitespace-nowrap">
            <Filter className="h-4 w-4 mr-2" />
            Filter Status
          </button>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-[#262626]">
            <thead className="bg-[#0a0a0a]/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs uppercase tracking-widest text-[#737373] font-bold font-mono">
                  Customer / Property
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs uppercase tracking-widest text-[#737373] font-bold font-mono">
                  Insurance / Claim
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs uppercase tracking-widest text-[#737373] font-bold font-mono">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs uppercase tracking-widest text-[#737373] font-bold font-mono">
                  Date added
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#171717] divide-y divide-[#262626]">
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-[#262626] cursor-pointer transition-colors"
                  onClick={() => onNavigate('project_detail', project.id)}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {project.customer.firstName} {project.customer.lastName}
                        </div>
                        <div className="text-xs text-[#a3a3a3] mt-1 font-medium">
                          {project.customer.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-white">{project.claim?.insuranceCompany || 'N/A'}</div>
                    <div className="text-xs text-[#737373] mt-1 font-mono tracking-tight">{project.claim?.claimNumber || 'Unfiled'}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getBadgeStyle(project.status)}`}>
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-[#737373]">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end">
                      <div className="p-2 rounded-full hover:bg-[#404040] transition-colors">
                        <ChevronRight className="h-4 w-4 text-[#a3a3a3] hover:text-white" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
