import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  MessageSquare,
  RefreshCw,
  Navigation,
  CalendarDays,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Knock, KnockStatus } from '../types';
import { Coordinates, resolveUserLocation } from '../lib/geolocation';

type TimeFilter = 'today' | '7d' | '30d' | 'all';

const statusColors: Record<KnockStatus, string> = {
  not_home: '#94a3b8',
  conversation: '#60a5fa',
  inspection: '#34d399',
  dnc: '#fb7185',
};

const statusLabels: Record<KnockStatus, string> = {
  not_home: 'Not home',
  conversation: 'Conversation',
  inspection: 'Inspection',
  dnc: 'Not interested',
};

const createIcon = (status: KnockStatus) => L.divIcon({
  html: `<span class="knock-map-marker" style="--marker-color:${statusColors[status]}"></span>`,
  className: 'knock-marker-shell',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const userIcon = L.divIcon({
  html: '<span class="knock-user-marker"><i></i></span>',
  className: 'knock-marker-shell',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const getKnockTime = (knock: Knock) => {
  if (knock.createdAt?.toDate) return knock.createdAt.toDate().getTime();
  if (knock.createdAt?.seconds) return knock.createdAt.seconds * 1000;
  if (typeof knock.createdAt === 'string') return new Date(knock.createdAt).getTime();
  return 0;
};

function MapViewport({ coordinates }: { coordinates: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    map.setView(coordinates, 14);
  }, [coordinates, map]);

  return null;
}

export function KnockManager({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [allKnocks, setAllKnocks] = useState<Knock[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [selectedRep, setSelectedRep] = useState('all');
  const [userLocation, setUserLocation] = useState<Coordinates>([39.8283, -98.5795]);
  const [isPreciseLocation, setIsPreciseLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'knocks')),
      (snapshot) => {
        setAllKnocks(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Knock)));
        setLoadError('');
        setIsLoading(false);
      },
      (error) => {
        console.error('Knocks fetch error', error);
        setLoadError('Live field activity could not be loaded.');
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    resolveUserLocation().then(({ coordinates, precise }) => {
      setUserLocation(coordinates);
      setIsPreciseLocation(precise);
    });
  }, []);

  const periodConfig = useMemo(() => {
    const now = new Date();
    const end = now.getTime();
    const start = new Date(now);
    if (timeFilter === 'today') start.setHours(0, 0, 0, 0);
    if (timeFilter === '7d') start.setDate(start.getDate() - 6);
    if (timeFilter === '30d') start.setDate(start.getDate() - 29);
    if (timeFilter !== 'today') start.setHours(0, 0, 0, 0);
    const duration = end - start.getTime();
    return { start: timeFilter === 'all' ? 0 : start.getTime(), end, previousStart: Math.max(0, start.getTime() - duration) };
  }, [timeFilter]);

  const periodKnocks = useMemo(() => {
    return allKnocks.filter((knock) => getKnockTime(knock) >= periodConfig.start);
  }, [allKnocks, periodConfig]);

  const allReps = useMemo(
    () => Array.from(new Set(periodKnocks.map((knock) => knock.repName || 'Unknown rep'))).sort(),
    [periodKnocks],
  );

  useEffect(() => {
    if (selectedRep !== 'all' && !allReps.includes(selectedRep)) setSelectedRep('all');
  }, [allReps, selectedRep]);

  const filteredKnocks = selectedRep === 'all'
    ? periodKnocks
    : periodKnocks.filter((knock) => (knock.repName || 'Unknown rep') === selectedRep);

  const previousKnocks = timeFilter === 'all' ? [] : allKnocks.filter((knock) => {
    const time = getKnockTime(knock);
    const matchesRep = selectedRep === 'all' || (knock.repName || 'Unknown rep') === selectedRep;
    return matchesRep && time >= periodConfig.previousStart && time < periodConfig.start;
  });

  const conversations = filteredKnocks.filter((knock) => knock.status === 'conversation').length;
  const inspections = filteredKnocks.filter((knock) => knock.status === 'inspection').length;
  const conversationRate = filteredKnocks.length ? (conversations / filteredKnocks.length) * 100 : 0;
  const inspectionRate = conversations ? (inspections / conversations) * 100 : 0;
  const previousConversations = previousKnocks.filter((knock) => knock.status === 'conversation').length;
  const previousInspections = previousKnocks.filter((knock) => knock.status === 'inspection').length;

  const changeFrom = (current: number, previous: number) => {
    if (timeFilter === 'all') return 'Complete history';
    if (!previous) return current ? 'New this period' : 'No change';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs prior period`;
  };

  const repStats = useMemo(() => {
    const stats = new Map<string, { total: number; conversations: number; inspections: number }>();
    periodKnocks.forEach((knock) => {
      const name = knock.repName || 'Unknown rep';
      const current = stats.get(name) || { total: 0, conversations: 0, inspections: 0 };
      current.total += 1;
      if (knock.status === 'conversation') current.conversations += 1;
      if (knock.status === 'inspection') current.inspections += 1;
      stats.set(name, current);
    });
    return Array.from(stats, ([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.inspections - a.inspections || b.conversations - a.conversations || b.total - a.total);
  }, [periodKnocks]);

  const statusCounts = (Object.keys(statusLabels) as KnockStatus[]).map((status) => ({
    status,
    count: filteredKnocks.filter((knock) => knock.status === status).length,
  }));

  const periodLabels: Record<TimeFilter, string> = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days', all: 'All time' };
  const periodLabel = periodLabels[timeFilter];
  const emptyCopy = selectedRep === 'all'
    ? `No doors have been logged ${timeFilter === 'today' ? 'today' : 'yet'}.`
    : `${selectedRep} has no activity in this period.`;

  const trendData = useMemo(() => {
    const days = timeFilter === 'today' ? 1 : timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 12;
    const useMonths = timeFilter === 'all';
    const now = new Date();
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(now);
      if (useMonths) {
        date.setMonth(date.getMonth() - (days - index - 1), 1);
      } else {
        date.setDate(date.getDate() - (days - index - 1));
      }
      const items = filteredKnocks.filter((knock) => {
        const knockDate = new Date(getKnockTime(knock));
        return useMonths
          ? knockDate.getMonth() === date.getMonth() && knockDate.getFullYear() === date.getFullYear()
          : knockDate.toDateString() === date.toDateString();
      });
      return {
        label: useMonths ? date.toLocaleDateString(undefined, { month: 'short' }) : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        doors: items.length,
        conversations: items.filter((knock) => knock.status === 'conversation').length,
        inspections: items.filter((knock) => knock.status === 'inspection').length,
      };
    });
  }, [filteredKnocks, timeFilter]);

  const maxTrend = Math.max(1, ...trendData.map((item) => item.doors));

  return (
    <div className="knock-page">
      <header className="knock-page-header">
        <div>
          <div className="knock-eyebrow"><span className="knock-live-dot" /> Live field intelligence</div>
          <h1>Knock performance</h1>
          <p>See where the team is working and turn every doorstep into a measurable outcome.</p>
        </div>
        <div className="knock-toolbar" aria-label="Dashboard filters">
          <label className="knock-select-label">
            <span>Sales rep</span>
            <select value={selectedRep} onChange={(event) => setSelectedRep(event.target.value)}>
              <option value="all">All reps</option>
              {allReps.map((rep) => <option key={rep} value={rep}>{rep}</option>)}
            </select>
          </label>
          <div className="knock-segmented" role="group" aria-label="Time period">
            {(['today', '7d', '30d', 'all'] as const).map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={timeFilter === period}
                onClick={() => setTimeFilter(period)}
              >
                {{ today: 'Today', '7d': '7 days', '30d': '30 days', all: 'All time' }[period]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loadError && <div className="knock-alert" role="alert"><RefreshCw size={16} /> {loadError}</div>}

      <section className="knock-kpi-grid" aria-label={`${periodLabel} KPIs`}>
        {[
          { label: 'Doors knocked', value: filteredKnocks.length, detail: changeFrom(filteredKnocks.length, previousKnocks.length), icon: Target, tone: 'neutral' },
          { label: 'Conversations', value: conversations, detail: `${conversationRate.toFixed(1)}% rate · ${changeFrom(conversations, previousConversations)}`, icon: MessageSquare, tone: 'blue' },
          { label: 'Inspections', value: inspections, detail: changeFrom(inspections, previousInspections), icon: CheckCircle2, tone: 'green' },
          { label: 'Inspection rate', value: `${inspectionRate.toFixed(1)}%`, detail: 'Conversation to inspection', icon: TrendingUp, tone: 'amber' },
        ].map((metric, index) => (
          <motion.article
            key={metric.label}
            className={`knock-kpi-card knock-tone-${metric.tone}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <div className="knock-kpi-icon"><metric.icon /></div>
            <div className="knock-kpi-label">{metric.label}</div>
            <strong>{isLoading ? '—' : metric.value}</strong>
            <span>{metric.detail}</span>
          </motion.article>
        ))}
      </section>

      <section className="knock-panel knock-trend-panel" aria-label="KPI performance over time">
        <div className="knock-panel-heading">
          <div><h2><CalendarDays size={18} /> Performance over time</h2><p>Doors, conversations, and inspections · {periodLabel}</p></div>
          <div className="knock-map-legend">
            <span><i style={{ background: '#cbd5e1' }} />Doors</span>
            <span><i style={{ background: '#60a5fa' }} />Conversations</span>
            <span><i style={{ background: '#34d399' }} />Inspections</span>
          </div>
        </div>
        <div className="knock-trend-chart">
          {trendData.map((item) => (
            <div className="knock-trend-column" key={item.label} title={`${item.label}: ${item.doors} doors, ${item.conversations} conversations, ${item.inspections} inspections`}>
              <div className="knock-trend-values">
                <i className="doors" style={{ height: `${(item.doors / maxTrend) * 100}%` }} />
                <i className="conversations" style={{ height: `${(item.conversations / maxTrend) * 100}%` }} />
                <i className="inspections" style={{ height: `${(item.inspections / maxTrend) * 100}%` }} />
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="knock-trend-summary">
          <div><span>Average doors / day</span><strong>{(filteredKnocks.length / Math.max(1, timeFilter === 'today' ? 1 : timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : trendData.length)).toFixed(1)}</strong></div>
          <div><span>Conversation rate</span><strong>{conversationRate.toFixed(1)}%</strong></div>
          <div><span>Inspection yield</span><strong>{filteredKnocks.length ? ((inspections / filteredKnocks.length) * 100).toFixed(1) : '0.0'}%</strong></div>
          <div><span>Best period</span><strong>{trendData.reduce((best, item) => item.doors > best.doors ? item : best, trendData[0])?.label || '—'}</strong></div>
        </div>
      </section>

      <section className="knock-dashboard-grid">
        <article className="knock-panel knock-map-panel">
          <div className="knock-panel-heading">
            <div><h2>Territory activity</h2><p>{filteredKnocks.length} mapped outcomes · {periodLabel}</p></div>
            <div className="knock-map-legend">
              {(Object.keys(statusLabels) as KnockStatus[]).map((status) => (
                <span key={status}><i style={{ background: statusColors[status] }} />{statusLabels[status]}</span>
              ))}
            </div>
          </div>
          <div className="knock-map-canvas">
            <MapContainer center={userLocation} zoom={14} zoomControl>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />
              <MapViewport coordinates={userLocation} />
              <Marker position={userLocation} icon={userIcon}>
                <Popup><div className="knock-popup"><span>Your location</span><strong>{isPreciseLocation ? 'GPS position' : 'Approximate position'}</strong></div></Popup>
              </Marker>
              {filteredKnocks.map((knock) => (
                <Marker key={knock.id} position={[knock.lat, knock.lng]} icon={createIcon(knock.status)}>
                  <Popup>
                    <div className="knock-popup">
                      <span style={{ color: statusColors[knock.status] }}>{statusLabels[knock.status]}</span>
                      <strong>{knock.repName || 'Unknown rep'}</strong>
                      {knock.address && <p>{knock.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {!isLoading && !filteredKnocks.length && (
              <div className="knock-map-empty"><MapPin /><strong>No map activity</strong><span>{emptyCopy}</span></div>
            )}
          </div>
          <button
            type="button"
            className="knock-map-locate"
            onClick={async () => {
              const { coordinates, precise } = await resolveUserLocation();
              setUserLocation(coordinates);
              setIsPreciseLocation(precise);
            }}
          ><Navigation /> My location</button>
        </article>

        <aside className="knock-panel knock-leaderboard">
          <div className="knock-panel-heading">
            <div><h2><Trophy size={18} /> Leaderboard</h2><p>Ranked by inspections</p></div>
          </div>
          <div className="knock-leader-list">
            {repStats.length ? repStats.map((rep, index) => (
              <button
                type="button"
                key={rep.name}
                className={selectedRep === rep.name ? 'is-selected' : ''}
                onClick={() => setSelectedRep(selectedRep === rep.name ? 'all' : rep.name)}
              >
                <span className={`knock-rank ${index < 3 ? `rank-${index + 1}` : ''}`}>{index + 1}</span>
                <span className="knock-rep-copy"><strong>{rep.name}</strong><small>{rep.conversations} conversations · {rep.inspections} inspections</small></span>
                <span className="knock-rep-total"><strong>{rep.total}</strong><small>doors</small></span>
                <ChevronRight />
              </button>
            )) : (
              <div className="knock-empty"><Users /><strong>No leaderboard yet</strong><span>{emptyCopy}</span></div>
            )}
          </div>
          <div className="knock-outcomes">
            <h3>Outcome mix</h3>
            {statusCounts.map(({ status, count }) => {
              const percentage = filteredKnocks.length ? (count / filteredKnocks.length) * 100 : 0;
              return (
                <div key={status} className="knock-outcome-row">
                  <div><span>{statusLabels[status]}</span><strong>{count}</strong></div>
                  <div className="knock-progress"><i style={{ width: `${percentage}%`, background: statusColors[status] }} /></div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <button type="button" className="knock-mobile-cta" onClick={() => onNavigate('door_knocker')}>
        <MapPin /> Open door knocker <ChevronRight />
      </button>
    </div>
  );
}
