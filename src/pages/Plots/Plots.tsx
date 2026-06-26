import { MemoizedDynamicPlotMapLeaflet } from '@/components/maps/DynamicPlotMapLeaflet';
import { MemoizedDynamicPlotMapGoogle } from '@/components/maps/DynamicPlotMapGoogle';
import { Switch } from '@/components/ui/switch';
import {
  DynamicPlotTable,
  DynamicTableData,
} from '@/components/tables/DynamicPlotTable';
import {
  MeasurementChartDialog,
  ChartTarget,
} from '@/components/tables/cell/MeasurementChartDialog';
import { Header } from '@/components/ui/header';
import { LastMeasurementsObject, SensorNode, Plot, Sensor } from '@/lib/types';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';
import { isAuthenticated } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Plots = () => {
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const selectedPlotRef = useRef(selectedPlot);
  const [chartTarget, setChartTarget] = useState<ChartTarget | null>(null);
  const [deletePlotId, setDeletePlotId] = useState<string | null>(null);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [editPlot, setEditPlot] = useState<Partial<Plot>>({});
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

  const handleUpdatePlot = async () => {
    if (!editingPlot) return;
    await axios.patch(`/api/plots/updatePlot/${editingPlot.id}`, { plot: editPlot });
    setEditingPlot(null);
    setEditPlot({});
    await fetchData();
  };

  const handleDeletePlot = async (id: string) => {
    await axios.delete(`/api/plots/deletePlot/${id}`);
    if (selectedPlot === id) setSelectedPlot(null);
    setDeletePlotId(null);
    setEditingPlot(null);
    await fetchData();
  };

  // Variable that will control which map is showing
  const [mapToggle, setMapToggle] = useState(false);

  return (
    <>
      <Header />
      <div className="flex justify-center ">
        <div className="w-full md:w-11/12 bg-white drop-shadow-lg p-3 md:p-10 pt-0 mt-0 m-2 md:m-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="font-bold tracking-tighter text-2xl md:text-4xl pt-8">
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
            onEditPlot={isAuthenticated() ? (plot) => { setEditingPlot(plot); setEditPlot(plot); } : undefined}
            onOpenChart={(plotId, sensor) => setChartTarget({ plotId, sensor })}
            data={tableData}
            language={language}
          />
        </div>
      </div>
      <MeasurementChartDialog
        target={chartTarget}
        onClose={() => setChartTarget(null)}
      />
      <Dialog open={editingPlot !== null} onOpenChange={(open) => { if (!open) { setEditingPlot(null); setEditPlot({}); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decodeCombined('[en]Edit Plot[es]Editar parcela', language)}</DialogTitle>
            <DialogDescription>
              {decodeCombined('[en]Update the plot details.[es]Actualice los detalles de la parcela.', language)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Description[es]Descripción', language)}</Label>
              <Input
                value={editPlot.description ?? ''}
                onChange={(e) => setEditPlot({ ...editPlot, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Latitude[es]Latitud', language)}</Label>
              <Input
                type="number"
                value={editPlot.latitude ?? ''}
                onChange={(e) => setEditPlot({ ...editPlot, latitude: parseFloat(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Longitude[es]Longitud', language)}</Label>
              <Input
                type="number"
                value={editPlot.longitude ?? ''}
                onChange={(e) => setEditPlot({ ...editPlot, longitude: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => editingPlot && setDeletePlotId(editingPlot.id)}>
              {decodeCombined('[en]Delete[es]Eliminar', language)}
            </Button>
            <Button variant="outline" onClick={() => { setEditingPlot(null); setEditPlot({}); }}>
              {decodeCombined('[en]Cancel[es]Cancelar', language)}
            </Button>
            <Button onClick={handleUpdatePlot}>
              {decodeCombined('[en]Save[es]Guardar', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletePlotId !== null} onOpenChange={(open) => { if (!open) setDeletePlotId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decodeCombined('[en]Delete Plot[es]Eliminar parcela', language)}</DialogTitle>
            <DialogDescription>
              {decodeCombined(
                '[en]Are you sure you want to delete this plot? This action cannot be undone.[es]¿Está seguro de que desea eliminar esta parcela? Esta acción no se puede deshacer.',
                language,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlotId(null)}>
              {decodeCombined('[en]Cancel[es]Cancelar', language)}
            </Button>
            <Button variant="destructive" onClick={() => deletePlotId && handleDeletePlot(deletePlotId)}>
              {decodeCombined('[en]Delete[es]Eliminar', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
