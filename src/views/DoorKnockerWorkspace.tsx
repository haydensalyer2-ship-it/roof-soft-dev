import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Knock, KnockStatus } from '../types';
import { Navigation, Home, MessageSquare, ClipboardCheck, Loader2, X, Activity, MousePointerClick } from 'lucide-react';
import { Coordinates, resolveUserLocation } from '../lib/geolocation';

const createIcon = (color: string) => L.divIcon({
  html: `<span class="knock-map-marker" style="--marker-color:${color}"></span>`,
  className: 'knock-marker-shell',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const userIcon = L.divIcon({
  html: '<span class="knock-user-marker"><i></i></span>',
  className: 'knock-marker-shell',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const statusColors: Record<KnockStatus, string> = {
  not_home: '#94a3b8',
  conversation: '#3b82f6',
  inspection: '#22c55e',
  dnc: '#ef4444'
};

const statusIcons: Record<KnockStatus, any> = {
  not_home: Home,
  conversation: MessageSquare,
  inspection: ClipboardCheck,
  dnc: X
};

const statusLabels: Record<KnockStatus, string> = {
  not_home: 'Not Home',
  conversation: 'Conversation',
  inspection: 'Inspection (Lead)',
  dnc: 'Not Interested'
};

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function DoorKnockerWorkspace() {
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isPreciseLocation, setIsPreciseLocation] = useState(false);
  
  const [newKnockCoords, setNewKnockCoords] = useState<[number, number] | null>(null);
  const [selectedKnockId, setSelectedKnockId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<KnockStatus | null>(null);
  const [knockNotes, setKnockNotes] = useState('');
  const [knockAddress, setKnockAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    resolveUserLocation().then(({ coordinates, precise }) => {
      if (!isMounted) return;
      setPosition(coordinates);
      setIsPreciseLocation(precise);
      setIsLocating(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const q = query(
      collection(db, 'knocks'),
      where('userId', '==', auth.currentUser.uid),
      where('createdAt', '>=', startOfToday)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: Knock[] = [];
      snap.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Knock);
      });
      setKnocks(data);
    });

    return () => unsub();
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setNewKnockCoords([lat, lng]);
    setSelectedKnockId(null);
    setSelectedStatus(null);
    setKnockAddress('');
    setKnockNotes('');
  };

  const handleMarkerClick = (k: Knock) => {
    setNewKnockCoords([k.lat, k.lng]);
    setSelectedKnockId(k.id);
    setSelectedStatus(k.status);
    setKnockNotes(k.notes || '');
    setKnockAddress(k.address || ''); // fallback to empty string if missing
  };

  const handleSaveKnock = async () => {
    if (!auth.currentUser || !newKnockCoords || !selectedStatus) return;
    setIsSaving(true);
    
    const repName = localStorage.getItem('repName') || auth.currentUser.email || 'Unknown Rep';

    try {
      if (selectedKnockId) {
        await updateDoc(doc(db, 'knocks', selectedKnockId), {
          status: selectedStatus,
          notes: knockNotes || '',
          address: knockAddress || ''
        });
      } else {
        await addDoc(collection(db, 'knocks'), {
          userId: auth.currentUser.uid,
          repName,
          lat: newKnockCoords[0],
          lng: newKnockCoords[1],
          status: selectedStatus,
          notes: knockNotes || '',
          address: knockAddress || '',
          createdAt: serverTimestamp()
        });
      }
      setNewKnockCoords(null);
      setSelectedKnockId(null);
      setSelectedStatus(null);
      setKnockAddress('');
      setKnockNotes('');
    } catch (e) {
      console.error('Failed to log knock', e);
      alert('Failed to log door knock.');
    }
    setIsSaving(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.getTime();

  const knocksToday = knocks.filter(k => {
    let knockTime = 0;
    if (k.createdAt && (k.createdAt as any).seconds) knockTime = (k.createdAt as any).seconds * 1000;
    else if (k.createdAt && typeof k.createdAt === 'string') knockTime = new Date(k.createdAt).getTime();
    return knockTime >= startOfToday;
  });

  const doorsToday = knocksToday.length;
  const conversationsToday = knocksToday.filter(k => k.status === 'conversation').length;
  const inspectionsToday = knocksToday.filter(k => k.status === 'inspection').length;

  if (isLocating || !position) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-white font-medium">Acquiring GPS Signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="door-knocker-shell">
      {/* Top Banner KPI Bar */}
      <div className="door-knocker-summary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex items-center text-white font-black uppercase tracking-widest text-lg font-mono">
               <Activity className="w-5 h-5 mr-3 text-emerald-500" />
               Today's Activity
             </div>
          </div>
          
          <div className="flex bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden w-full md:w-auto divide-x divide-[#262626]">
            <div className="px-4 py-2 flex-1 md:flex-none text-center">
               <div className="text-[10px] text-[#a3a3a3] uppercase font-bold tracking-wider">Doors Knocked</div>
               <div className="text-xl font-black text-white">{doorsToday}</div>
            </div>
            <div className="px-4 py-2 flex-1 md:flex-none text-center">
               <div className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Conversations</div>
               <div className="text-xl font-black text-white">{conversationsToday}</div>
            </div>
            <div className="px-4 py-2 flex-1 md:flex-none text-center">
               <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Inspections</div>
               <div className="text-xl font-black text-white">{inspectionsToday}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="door-knocker-map">
        <MapContainer 
          center={position} 
          zoom={18} 
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          zoomControl={false}
        >
          <MapUpdater center={position} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
          <ClickHandler onMapClick={handleMapClick} />
          
          <Marker position={position} icon={userIcon}>
            <Popup><div className="knock-popup"><span>Your location</span><strong>{isPreciseLocation ? 'GPS position' : 'Approximate position'}</strong></div></Popup>
          </Marker>

          {knocks.map((k) => (
            <Marker 
              key={k.id} 
              position={[k.lat, k.lng]} 
              icon={createIcon(statusColors[k.status])}
              eventHandlers={{ click: () => handleMarkerClick(k) }}
            >
              <Popup>
                <div className="knock-popup">
                  <div className="font-bold mb-1" style={{ color: statusColors[k.status] }}>
                     {statusLabels[k.status]}
                  </div>
                  {k.address ? <div className="text-xs text-gray-400 mb-1">{k.address}</div> : null}
                  {k.notes && <p>{k.notes}</p>}
                  <p>
                     {k.createdAt ? new Date(k.createdAt.seconds * 1000).toLocaleTimeString() : 'Just now'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {newKnockCoords && !selectedKnockId && (
             <Marker position={newKnockCoords} icon={createIcon('#ffffff')} />
          )}
        </MapContainer>

        {!newKnockCoords && (
          <div className="door-map-hint">
            <MousePointerClick />
            <span><strong>Tap any home</strong> to log an outcome</span>
          </div>
        )}

        <div className="door-location-status">
          <span className={isPreciseLocation ? 'is-precise' : ''} />
          {isPreciseLocation ? 'GPS location' : 'Approximate location'}
        </div>

        {newKnockCoords && (
          <div className="door-knock-sheet">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.12em] text-[#737373]">Door outcome</div>
                  <h3 className="text-white font-bold mt-1">{selectedKnockId ? 'Update activity' : 'Log activity'}</h3>
                </div>
                <button type="button" aria-label="Close activity form" onClick={() => { setNewKnockCoords(null); setSelectedKnockId(null); setSelectedStatus(null); setKnockNotes(''); setKnockAddress(''); }} className="p-2 bg-[#262626] rounded-full text-white hover:bg-[#404040] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                {(Object.keys(statusLabels) as KnockStatus[]).map(status => {
                  const Icon = statusIcons[status];
                  const isSelected = selectedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedStatus(status)}
                      aria-pressed={isSelected}
                      className={`door-status-button ${isSelected ? 'is-selected' : ''}`}
                    >
                      <Icon className="w-5 h-5 mb-2" style={{ color: statusColors[status] }} />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center">
                        {statusLabels[status]}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={knockAddress}
                  onChange={(e) => setKnockAddress(e.target.value)}
                  placeholder="House/Street Address (optional)"
                  aria-label="House or street address"
                  className="door-field"
                />
                <textarea
                  value={knockNotes}
                  onChange={(e) => setKnockNotes(e.target.value)}
                  placeholder="Notes..."
                  aria-label="Door knock notes"
                  className="door-field h-20 resize-none"
                />
              </div>

              <button
                onClick={handleSaveKnock}
                disabled={!selectedStatus || isSaving}
                className="door-save-button"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (selectedKnockId ? 'Update Door Knock' : 'Save Door Knock')}
              </button>
            </div>
          </div>
        )}

        <button 
          type="button"
          aria-label="Center map on my location"
          title="Center on my location"
          onClick={async () => {
            const { coordinates, precise } = await resolveUserLocation();
            setPosition(coordinates);
            setIsPreciseLocation(precise);
          }}
          className="door-location-button"
        >
          <Navigation className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
