import { useDmas, useLatestTelemetry } from '../../services/hooks';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { Loader2 } from 'lucide-react';

const defaultDmas = [
  { code: 'DMA-MO-01', name: 'Moche 01', district: 'Moche', latitude: -8.1700, longitude: -79.0050, status: 'ACTIVE' },
  { code: 'DMA-EP-01', name: 'El Porvenir 01', district: 'El Porvenir', latitude: -8.0800, longitude: -79.0150, status: 'ACTIVE' },
  { code: 'DMA-EP-02', name: 'El Porvenir 02', district: 'El Porvenir', latitude: -8.0750, longitude: -79.0200, status: 'WARNING' },
  { code: 'DMA-VL-01', name: 'Víctor Larco 01', district: 'Víctor Larco', latitude: -8.1400, longitude: -79.0500, status: 'ACTIVE' },
  { code: 'DMA-LE-01', name: 'La Esperanza 01', district: 'La Esperanza', latitude: -8.0600, longitude: -79.0400, status: 'CRITICAL' },
];

function getMarkerIcon(status: string) {
  const color = status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#eab308' : '#22c55e';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function DmasMapPage() {
  const { data: apiDmas, isLoading } = useDmas();
  const { data: readings } = useLatestTelemetry();
  const navigate = useNavigate();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { setMapReady(true); }, []);

  const dmas = apiDmas && apiDmas.length > 0
    ? apiDmas.map((d) => ({ code: d.code, name: d.name, district: d.district, latitude: d.latitude, longitude: d.longitude, status: d.status }))
    : defaultDmas;

  const latestReadings: Record<string, any> = {};
  if (Array.isArray(readings)) {
    readings.forEach((r) => { if (!latestReadings[r.dma_id]) latestReadings[r.dma_id] = r; });
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {dmas.map((dma) => (
          <div key={dma.code} className="kpi-card cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate(`/dmas/${dma.code}`)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-400">{dma.code}</span>
              <StatusBadge status={dma.status} />
            </div>
            <p className="font-semibold text-gray-800 truncate">{dma.name}</p>
            <p className="text-xs text-gray-400">{dma.district}</p>
            {latestReadings[dma.code] && (
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span>P: {latestReadings[dma.code].pressure_mca} MCA</span>
                <span>Q: {latestReadings[dma.code].flow_lps} LPS</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="kpi-card p-1">
        <div className="h-[450px] rounded-xl overflow-hidden">
          {mapReady && (
            <MapContainer center={[-8.12, -79.02]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {dmas.map((dma) => (
                <Marker key={dma.code} position={[dma.latitude, dma.longitude]} icon={getMarkerIcon(dma.status)}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-gray-800">{dma.name}</p>
                      <p className="text-xs text-gray-500">{dma.code} — {dma.district}</p>
                      <StatusBadge status={dma.status} className="mt-1" />
                      {latestReadings[dma.code] && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Presión: {latestReadings[dma.code].pressure_mca} MCA</p>
                          <p>Caudal: {latestReadings[dma.code].flow_lps} LPS</p>
                        </div>
                      )}
                      <button onClick={() => navigate(`/dmas/${dma.code}`)} className="mt-2 text-xs text-hydraulic-600 hover:underline">Ver detalle →</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
