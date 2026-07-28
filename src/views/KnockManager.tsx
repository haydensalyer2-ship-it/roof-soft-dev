import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Knock, KnockStatus } from '../types';
import { MapPin, Users, Target, CheckCircle2, TrendingUp, MessageSquare, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const statusColors: Record<KnockStatus, string> = {
  not_home: '#94a3b8',
  conversation: '#3b82f6',
  inspection: '#22c55e',
  dnc: '#ef4444'
};

const statusLabels: Record<KnockStatus, string> = {
  not_home: 'Not Home',
  conversation: 'Conversation',
  inspection: 'Inspection (Lead)',
  dnc: 'Not Interested'
};

export function KnockManager({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'all'>('today');
  const [selectedRep, setSelectedRep] = useState<'all' | string>('all');
  
  useEffect(() => {
    const q = query(collection(db, 'knocks'));
    const unsub = onSnapshot(q, (snap) => {
      const data: Knock[] = [];
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      snap.forEach(doc => {
        const knock = { id: doc.id, ...doc.data() } as Knock;
        
        let knockTime = Date.now();
        if (knock.createdAt && (knock.createdAt as any).seconds) {
          knockTime = (knock.createdAt as any).seconds * 1000;
        } else if (knock.createdAt && typeof knock.createdAt === 'string') {
          knockTime = new Date(knock.createdAt).getTime();
        }

        if (timeFilter === 'today') {
           if (knockTime >= startOfToday) {
             data.push(knock);
           }
        } else {
           data.push(knock);
        }
      });
      setKnocks(data);
    }, (err) => console.error("Knocks fetch error", err));

    return () => unsub();
  }, [timeFilter]);

  // Unique Reps for filter
  const allReps = Array.from(new Set(knocks.map(k => k.repName || 'Unknown Rep'))).sort();

  // Filter knocks by selected rep
  const filteredKnocks = selectedRep === 'all' 
    ? knocks 
    : knocks.filter(k => (k.repName || 'Unknown Rep') === selectedRep);

  // Aggregation on FILTERED knocks
  const totalKnocks = filteredKnocks.length;
  const totalConversations = filteredKnocks.filter(k => k.status === 'conversation').length;
  const totalInspections = filteredKnocks.filter(k => k.status === 'inspection').length;
  
  const pitchRate = totalKnocks > 0 ? ((totalConversations / totalKnocks) * 100).toFixed(1) : '0.0';
  const closeRate = totalConversations > 0 ? ((totalInspections / totalConversations) * 100).toFixed(1) : '0.0';

  // Group by Rep using ALL knocks to show leaderboard regardless of filter
  const repStats: Record<string, { total: number; conversations: number; inspections: number }> = {};
  knocks.forEach(k => {
    const repName = k.repName || 'Unknown Rep';
    if (!repStats[repName]) {
      repStats[repName] = { total: 0, conversations: 0, inspections: 0 };
    }
    repStats[repName].total++;
    if (k.status === 'conversation') repStats[repName].conversations++;
    if (k.status === 'inspection') repStats[repName].inspections++;
  });

  const topReps = Object.entries(repStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);

  // Approximate center of existing default knocks if none exist
  const centerLat = filteredKnocks.length > 0 ? filteredKnocks[0].lat : 39.8283;
  const centerLng = filteredKnocks.length > 0 ? filteredKnocks[0].lng : -98.5795;

  return (
    <div className="min-h-screen bg-[#050505] p-4 lg:p-8 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <MapPin className="text-blue-500 mr-3 h-8 w-8" /> 
            Door Knocking Manager KPIs
          </h1>
          <p className="text-[#a3a3a3] mt-1 text-sm">
            Real-time tracking of team activity, conversations, and inspections in the field.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select 
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none"
          >
            <option value="all">All Reps</option>
            {allReps.map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] rounded-xl p-1">
            <button 
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'today' ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:text-white'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'all' ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:text-white'}`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center text-[#a3a3a3] mb-2">
            <Target className="w-4 h-4 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">Total Knocks</span>
          </div>
          <div className="text-3xl font-black text-white">{totalKnocks}</div>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center text-blue-500 mb-2">
            <MessageSquare className="w-4 h-4 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">Conversations</span>
          </div>
          <div className="text-3xl font-black text-white">{totalConversations}</div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center text-emerald-500 mb-2">
            <CheckCircle2 className="w-4 h-4 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">Inspections</span>
          </div>
          <div className="text-3xl font-black text-white">{totalInspections}</div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-5">
          <div className="flex items-center text-yellow-500 mb-2">
            <TrendingUp className="w-4 h-4 mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">Conversion %</span>
          </div>
          <div className="text-3xl font-black text-white">{closeRate}%</div>
          <div className="text-xs text-[#737373] mt-1">Conv to Insp.</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden h-[500px]">
          <MapContainer 
            center={[centerLat, centerLng]} 
            zoom={4} 
            style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              maxZoom={21}
              maxNativeZoom={20}
            />
            {filteredKnocks.map((k) => (
              <Marker key={k.id} position={[k.lat, k.lng]} icon={createIcon(statusColors[k.status])}>
                <Popup className="text-black font-semibold text-xs">
                  <div>{k.repName} - {statusLabels[k.status]}</div>
                  {k.address && <div className='text-[10px] text-gray-500 mt-1'>{k.address}</div>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Rep Leaderboard */}
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center">
            <Users className="w-5 h-5 text-[#a3a3a3] mr-2" />
            Field Activity Leaderboard
          </h3>
          <div className="space-y-4">
            {topReps.length === 0 ? (
              <div className="text-[#a3a3a3] text-sm text-center py-10">No knocks logged yet.</div>
            ) : (
              topReps.map((r, i) => (
                <div 
                  key={r.name} 
                  onClick={() => setSelectedRep(r.name === selectedRep ? 'all' : r.name)}
                  className={`flex justify-between items-center p-3 rounded-lg transition-colors border cursor-pointer ${selectedRep === r.name ? 'bg-[#171717] border-[#404040]' : 'hover:bg-[#171717] border-[#262626]'}`}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-[#262626] text-white flex items-center justify-center text-xs font-bold mr-3">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{r.name}</div>
                      <div className="text-[10px] uppercase text-[#a3a3a3] tracking-wider mt-0.5">
                        {r.conversations} Conv • {r.inspections} Insp
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-lg">{r.total}</div>
                    <div className="text-[10px] text-[#737373] uppercase tracking-wider font-bold">Knocks</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure MessageSquare is exported or imported properly (already imported above)
