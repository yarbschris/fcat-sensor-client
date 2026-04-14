import { SetStateAction, memo, useCallback, useEffect, useState } from 'react';
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
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_MAPS_API_KEY || '',
    language: initialLanguage,
  });
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
        {isLoaded ? (
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
