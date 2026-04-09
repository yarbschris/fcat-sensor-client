/* Imports for Leaflet */
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import { Icon } from 'leaflet';

import { SetStateAction, memo, useCallback, useEffect, useState } from 'react';
import { Plot } from '@/lib/types';
import { SensorNodeCell } from '../tables/cell/sensorNodeCell';
import {
  Language,
  getLocalLanguage,
  useLanguage,
} from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';

export const DynamicPlotMap = ({
  plots,
  selectedPlot,
  setSelectedPlot,
}: {
  plots: Array<Plot>;
  selectedPlot: string | null;
  setSelectedPlot: (val: string | null) => void;
}) => {
  const [data, setData] = useState([]);
  const [initialLanguage] = useState<Language>(getLocalLanguage());
  const [map, setMap] = useState(null);
  const [selectedPlotOpen, setSelectedPlotOpen] = useState(false);
  useEffect(() => {
    setSelectedPlotOpen(selectedPlot !== null);
  }, [selectedPlot]);

  const [isLanguageChanged, setIsLanguageChanged] = useState(false);
  const { language } = useLanguage();
  useEffect(() => {
    if (language !== getLocalLanguage()) {
      setIsLanguageChanged(true);
    }
  }, [language]);

  const getCenter = () => {
    const lat = plots.reduce((acc, curr) => acc + curr.latitude, 0);
    const lng = plots.reduce((acc, curr) => acc + curr.longitude, 0);
    return {
      lat: lat / plots.length,
      lng: lng / plots.length,
    };
  };

  const getZoom = () => {
    const center = getCenter();
    const maxLat = Math.max(...plots.map((plot) => plot.latitude));
    const minLat = Math.min(...plots.map((plot) => plot.latitude));
    const maxLng = Math.max(...plots.map((plot) => plot.longitude));
    const minLng = Math.min(...plots.map((plot) => plot.longitude));
    const latDiff = Math.abs(maxLat - minLat);
    const lngDiff = Math.abs(maxLng - minLng);
    const latZoom = Math.floor(Math.log2(360 / latDiff));
    const lngZoom = Math.floor(Math.log2(360 / lngDiff));
    return Math.min(latZoom, lngZoom);
  };

  const onUnmount = useCallback((_map: any) => {
    setMap(null);
  }, []);
  return (
    <>
      {isLanguageChanged && (
        <p>
          {decodeCombined(
            '[en]Language changed, please reload the page to reload map.[es]Idioma cambiado, por favor recargue la página para recargar el mapa.',
            language,
          )}
        </p>
      )}
      <div
        style={{ height: 600 }}
      >
        {/* Leaflet Map Implementation */}
        <MapContainer
          center={getCenter()}
          zoom={getZoom()}
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Markers for each plot */}
          {plots.map((plot) => (
            <Marker
              key={plot.id}
              position={{
                lat: plot.latitude,
                lng: plot.longitude,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedPlot(plot.id);
                },
              }}
              icon={new Icon({ iconUrl: markerIconPng, iconSize: [25, 41] })}
            >
              {/* Popup for selected plot */}
              <Popup>
                {plot.nodeID ? (
                  <SensorNodeCell plotId={plot.nodeID} />
                ) : (
                  <span>{decodeCombined('[en]No Node Assigned[es]Ningún nodo asignado', language)}</span>
                )}
                <div>
                  <strong>Lat:</strong> {plot.latitude.toFixed(5)}
                  <br />
                  <strong>Lng:</strong> {plot.longitude.toFixed(5)}
                  <br />
                  <strong>Desc:</strong> {plot.description}
                  <br />
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Listen for map clicks to clear selection */}
          <MapClickHandler onClick={() => setSelectedPlotOpen(false)} />
        </MapContainer>
      </div>
    </>
  );
};

export const MemoizedDynamicPlotMapLeaflet = memo(
  DynamicPlotMap,
  (prev, next) =>
    prev.selectedPlot === next.selectedPlot &&
    prev.plots === next.plots,
);

// Handles map clicks to clear selection when clicking outside markers
function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({
    click: () => {
      onClick(); // clear selection
    },
  });
  return null; // nothing visible
}
