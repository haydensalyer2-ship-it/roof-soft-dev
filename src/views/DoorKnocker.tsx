import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Knock, KnockStatus } from '../types';
import { MapPin, Navigation, Home, Target, Clock, MessageSquare, ClipboardCheck, Loader2, X, Play, Square, Activity } from 'lucide-react';

const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
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

export function DoorKnocker() {
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  
  const [newKnockCoords, setNewKnockCoords] = useState<[number, number] | null>(null);
  const [selectedKnockId, setSelectedKnockId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<KnockStatus | null>(null);
  const [knockNotes, setKnockNotes] = useState('');
  const [knockAddress, setKnockAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fallbackTimeout = setTimeout(() => {
      if (isMounted && isLocating) {
        fetch('https://get.geojs.io/v1/ip/geo.json')
          .then(res => res.json())
          .then(data => {
            if (isMounted && isLocating) {
              setPosition([parseFloat(data.latitude), parseFloat(data.longitude)]);
              setIsLocating(false);
            }
          })
          .catch(() => {
            if (isMounted && isLocating) {
              setPosition([39.8283, -98.5795]);
              setIsLocating(false);
            }
          });
      }
    }, 3000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isMounted) {
            clearTimeout(fallbackTimeout);
            setPosition([pos.coords.latitude, pos.coords.longitude]);
            setIsLocating(false);
          }
        },
        (err) => {
          console.error('Error getting location', err);
          if (isMounted) {
            clearTimeout(fallbackTimeout);
            // Try IP fallback immediately
            fetch('https://get.geojs.io/v1/ip/geo.json')
              .then(res => res.json())
              .then(data => {
                if (isMounted) {
                  setPosition([parseFloat(data.latitude), parseFloat(data.longitude)]);
                  setIsLocating(false);
                }
              })
              .catch(() => {
                if (isMounted) {
                  setPosition([39.8283, -98.5795]); 
                  setIsLocating(false);
                }
              });
          }
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
      );
    } else {
      clearTimeout(fallbackTimeout);
      if (isMounted) {
        fetch('https://get.geojs.io/v1/ip/geo.json')
          .then(res => res.json())
          .then(data => {
            if (isMounted) {
              setPosition([parseFloat(data.latitude), parseFloat(data.longitude)]);
              setIsLocating(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setPosition([39.8283, -98.5795]); 
              setIsLocating(false);
            }
          });
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
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

  // If we defaulted to USA center, and we later load knocks, shift there.
  useEffect(() => {
    if (position && position[0] === 39.8283 && position[1] === -98.5795) {
      if (knocks.length > 0) {
        // Sort to find the latest
        const sorted = [...knocks].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        if (sorted[0]) {
          setPosition([sorted[0].lat, sorted[0].lng]);
        }
      }
    }
  }, [knocks, position]);

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
    <div className="relative h-[calc(100vh-4rem)] w-full flex flex-col">
      {/* Top Banner KPI Bar */}
      <div className="z-[400] bg-[#171717] border-b border-[#262626] p-4 flex-shrink-0">
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

      <div className="flex-1 relative">
        <MapContainer 
          center={position} 
          zoom={18} 
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          zoomControl={false}
        >
          <MapUpdater center={position} />
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
            maxZoom={21}
            maxNativeZoom={20}
          />
          <ClickHandler onMapClick={handleMapClick} />
          
          <Marker position={position} icon={createIcon('#ffffff')}>
            <Popup className="text-black font-bold">Your Location</Popup>
          </Marker>

          {knocks.map((k) => (
            <Marker 
              key={k.id} 
              position={[k.lat, k.lng]} 
              icon={createIcon(statusColors[k.status])}
              eventHandlers={{ click: () => handleMarkerClick(k) }}
            >
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <div className="font-bold border-b pb-1 mb-1" style={{ color: statusColors[k.status] }}>
                     {statusLabels[k.status]}
                  </div>
                  {k.address ? <div className="font-mono text-xs text-gray-500 mb-1">{k.address}</div> : null}
                  {k.notes && <p className="text-sm italic">{k.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">
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

        {newKnockCoords && (
          <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 bg-[#171717] border-t border-[#262626] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">{selectedKnockId ? 'Update Activity' : 'Log Activity'}</h3>
                <button onClick={() => { setNewKnockCoords(null); setSelectedKnockId(null); setSelectedStatus(null); setKnockNotes(''); setKnockAddress(''); }} className="p-2 bg-[#262626] rounded-full text-white">
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
                      onClick={() => setSelectedStatus(status)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${isSelected ? 'border-white bg-[#262626]' : 'border-[#404040] bg-[#0a0a0a]'} transition-all`}
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
                  className="w-full bg-[#0a0a0a] border border-[#404040] rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white"
                />
                <textarea
                  value={knockNotes}
                  onChange={(e) => setKnockNotes(e.target.value)}
                  placeholder="Notes..."
                  className="w-full bg-[#0a0a0a] border border-[#404040] rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white h-20"
                />
              </div>

              <button
                onClick={handleSaveKnock}
                disabled={!selectedStatus || isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (selectedKnockId ? 'Update Door Knock' : 'Save Door Knock')}
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={() => {
            const fallback = () => {
              fetch('https://get.geojs.io/v1/ip/geo.json')
                .then(res => res.json())
                .then(data => setPosition([parseFloat(data.latitude), parseFloat(data.longitude)]))
                .catch(err => console.error('Location error', err));
            };
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
                () => fallback(),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
              );
            } else {
              fallback();
            }
          }}
          className="absolute bottom-6 right-6 z-[400] w-14 h-14 bg-white/10 backdrop-blur border border-white/20 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-white/20 transition-all"
        >
          <Navigation className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
