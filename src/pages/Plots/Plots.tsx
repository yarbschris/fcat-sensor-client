import { MemoizedDynamicPlotMapLeaflet } from '@/components/maps/DynamicPlotMapLeaflet';
import { MemoizedDynamicPlotMapGoogle } from '@/components/maps/DynamicPlotMapGoogle';
import { Switch } from '@/components/ui/switch';
import {
  DynamicPlotTable,
  DynamicTableData,
} from '@/components/tables/DynamicPlotTable';
import { Header } from '@/components/ui/header';
import { LastMeasurementsObject, SensorNode, Plot, Sensor } from '@/lib/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';

export const Plots = () => {
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const selectedPlotRef = useRef(selectedPlot);
  const [measurements, setMeasurements] = useState<LastMeasurementsObject>({
    nodes: [],
    sensors: [],
    plots: [],
  });
  const [tableData, setTableData] = useState<DynamicTableData>([]);
  const memoizedPlots = useMemo(() => measurements.plots, [measurements]);
  const { language } = useLanguage();

  const fetchData = async () => {
    const fetch = await axios.get('/api/measurements/latest');
    setMeasurements(fetch.data);
    const lastMeasurements = fetch.data as LastMeasurementsObject;
    const fetchedTableData: DynamicTableData = [];
    lastMeasurements.plots.forEach((plot) => {
      const _node = lastMeasurements.nodes.find(
        (_node) => _node.node.id === plot.nodeID,
      );
      const node = _node?.node ?? null;
      const sensors = lastMeasurements.sensors;
      const onlyLastMeasurements = _node?.lastMeasurements ?? [];
      fetchedTableData.push({
        node,
        ...plot,
        sensors,
        lastMeasurements: onlyLastMeasurements,
      });
    });

    // Keep selected plot at the top
    const current = selectedPlotRef.current;
    if (current) {
      const selected = fetchedTableData.find((plot) => plot.id === current);
      if (selected) {
        const rest = fetchedTableData.filter((plot) => plot.id !== current);
        fetchedTableData.length = 0;
        fetchedTableData.push(selected, ...rest);
      }
    }

    // Only update state if data actually changed to avoid re-mounting cells
    setTableData((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(fetchedTableData)) return prev;
      return fetchedTableData;
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    selectedPlotRef.current = selectedPlot;
    // Re-sort existing table data when selection changes
    if (selectedPlot === null) return;
    const selected = tableData.find((plot) => plot.id === selectedPlot);
    if (!selected) return;
    const rest = tableData.filter((plot) => plot.id !== selectedPlot);
    setTableData([selected, ...rest]);
  }, [selectedPlot]);

  // Variable that will control which map is showing
  const [mapToggle, setMapToggle] = useState(false);

  return (
    <>
      <Header />
      <div className="flex justify-center ">
        <div className=" w-5/6 bg-white drop-shadow-lg  p-10 pt-0 mt-0 m-10">
          <div className="flex justify-between items-center">
            <h1 className="font-bold  tracking-tighter text-4xl pt-8">
              {decodeCombined('[en]Plots[es]Parcelas', language)}
            </h1>
            {/* Toggle switches on right side */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label>
                  {decodeCombined('[en]Toggle Map[es]Alternar Mapa', language)}
                </label>
                <Switch
                  id="mapSwitch"
                  checked={mapToggle}
                  onClick={() => setMapToggle(!mapToggle)}
                />
              </div>
            </div>
          </div>

          {memoizedPlots.length > 0 &&
            (mapToggle ? (
              <MemoizedDynamicPlotMapGoogle
                setSelectedPlot={setSelectedPlot}
                selectedPlot={selectedPlot}
                plots={memoizedPlots}
              />
            ) : (
              <MemoizedDynamicPlotMapLeaflet
                setSelectedPlot={setSelectedPlot}
                selectedPlot={selectedPlot}
                plots={memoizedPlots}
              />
            ))}

          <DynamicPlotTable
            setSelectedPlot={setSelectedPlot}
            selectedPlot={selectedPlot}
            data={tableData}
            language={language}
          />
        </div>
      </div>
    </>
  );
};
