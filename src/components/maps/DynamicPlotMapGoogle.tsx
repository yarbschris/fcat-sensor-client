import { memo, useCallback, useEffect, useState } from 'react';
import {
  GoogleMap,
  InfoWindowF,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { Plot } from '@/lib/types';
import { SensorNodeCell } from '../tables/cell/sensorNodeCell';
import {
  Language,
  getLocalLanguage,
  useLanguage,
} from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';
//add maps api key to src/mapsapi.env.json file. in production, gotta protect this key with web URL!

// Track what language the Google Maps API was loaded with — it's a global singleton
// and cannot be reloaded with a different language without a full page refresh.
let googleMapsLoadedLanguage: Language | null = null;

export const DynamicPlotMap = ({
  plots,
  selectedPlot,
  setSelectedPlot,
}: {
  plots: Array<Plot>;
  selectedPlot: string | null;
  setSelectedPlot: (val: string | null) => void;
}) => {
  const [initialLanguage] = useState<Language>(getLocalLanguage());
  const { language } = useLanguage();

  // If the API was already loaded with a different language, we can't reinitialize it.
  const languageMismatch = googleMapsLoadedLanguage !== null && googleMapsLoadedLanguage !== initialLanguage;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY || '',
    // Always pass the originally-loaded language to avoid the singleton conflict.
    language: googleMapsLoadedLanguage ?? initialLanguage,
  });

  useEffect(() => {
    if (isLoaded && googleMapsLoadedLanguage === null) {
      googleMapsLoadedLanguage = initialLanguage;
    }
  }, [isLoaded]);

  const [map, setMap] = useState(null);
  const [selectedPlotOpen, setSelectedPlotOpen] = useState(false);
  useEffect(() => {
    setSelectedPlotOpen(selectedPlot !== null);
  }, [selectedPlot]);

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
      {languageMismatch && (
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
        {isLoaded && !languageMismatch ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={getCenter()}
            zoom={getZoom()}
          >
            {plots.map((plot) => (
              <>
                <Marker
                  key={plot.id}
                  position={{
                    lat: plot.latitude,
                    lng: plot.longitude,
                  }}
                  onClick={() => {
                    setSelectedPlot(plot.id);
                  }}
                >
                  {selectedPlot === plot.id && selectedPlotOpen ? (
                    <InfoWindowF
                      position={{
                        lat: plot.latitude,
                        lng: plot.longitude,
                      }}
                      onCloseClick={() => setSelectedPlotOpen(false)}
                    >
                      {plot.nodeID ? (
                        <SensorNodeCell plotId={plot.nodeID} />
                      ) : (
                        <span>{decodeCombined('[en]No Node Assigned[es]Ningún nodo asignado', language)}</span>
                      )}
                    </InfoWindowF>
                  ) : null}
                </Marker>
              </>
            ))}
          </GoogleMap>
        ) : (
          <></>
        )}
      </div>
    </>
  );
};
export const MemoizedDynamicPlotMapGoogle = memo(
  DynamicPlotMap,
  (prev, next) =>
    prev.selectedPlot === next.selectedPlot &&
    prev.plots === next.plots,
);
