import { Header } from '@/components/ui/header';
import { DataTable } from '@/components/ui/data-table';
import { SensorNode, Plot, LastMeasurementsObject } from '@/lib/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { LastSeenCell } from '@/components/tables/cell/lastSeenCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

type NodeRow = SensorNode & {
  plotDescription: string | null;
  lastMeasurementDate: Date | null;
};

export const Nodes = () => {
  const [rows, setRows] = useState<NodeRow[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showCreatePlot, setShowCreatePlot] = useState(false);
  const [createPlotNodeId, setCreatePlotNodeId] = useState<string | null>(null);
  const [newPlot, setNewPlot] = useState({ id: '', latitude: '', longitude: '', description: '' });
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const { language } = useLanguage();

  const fetchData = async () => {
    const res = await axios.get('/api/measurements/latest');
    const data = res.data as LastMeasurementsObject;

    const fetchedPlots: Plot[] = data.plots;
    setPlots(fetchedPlots);

    const nodeRows: NodeRow[] = data.nodes.map((entry) => {
      const node = entry.node;
      const plot = fetchedPlots.find((p) => p.id === node.plotID);
      const lastMeasurement = entry.lastMeasurements[0];
      return {
        ...node,
        plotDescription: plot
          ? `${plot.id} - ${plot.description}`
          : null,
        lastMeasurementDate: lastMeasurement
          ? new Date(lastMeasurement.createdAt)
          : null,
      };
    });

    setRows(nodeRows);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignPlot = async (nodeId: string, plotId: string | null) => {
    await axios.patch(`/api/nodes/updateNode/${nodeId}`, {
      node: { plotID: plotId },
    });
    setEditingNodeId(null);
    await fetchData();
  };

  const handleCreatePlot = async () => {
    if (!createPlotNodeId) return;
    await axios.post('/api/plots/', {
      plot: {
        id: newPlot.id || undefined,
        latitude: parseFloat(newPlot.latitude),
        longitude: parseFloat(newPlot.longitude),
        description: newPlot.description,
        nodeID: createPlotNodeId,
      },
    });
    setShowCreatePlot(false);
    setNewPlot({ id: '', latitude: '', longitude: '', description: '' });
    setCreatePlotNodeId(null);
    setEditingNodeId(null);
    await fetchData();
  };

  const handleDeleteNode = async (nodeId: string) => {
    await axios.delete(`/api/nodes/deleteNode/${nodeId}`);
    setDeleteNodeId(null);
    setEditingNodeId(null);
    await fetchData();
  };

  const availablePlots = plots.filter((p) => p.nodeID === null);

  const columns: ColumnDef<NodeRow>[] = [
    {
      id: 'edit',
      header: '',
      cell: ({ row }) => {
        const nodeId = row.original.id;
        if (editingNodeId === nodeId) {
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingNodeId(null)}
              >
                {decodeCombined('[en]Cancel[es]Cancelar', language)}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteNodeId(nodeId)}
              >
                {decodeCombined('[en]Delete[es]Eliminar', language)}
              </Button>
            </div>
          );
        }
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingNodeId(nodeId)}
          >
            {decodeCombined('[en]Edit[es]Editar', language)}
          </Button>
        );
      },
    },
    {
      header: decodeCombined('[en]Node ID[es]ID de Nodo', language),
      accessorKey: 'id',
    },
    {
      header: decodeCombined('[en]Plot[es]Parcela', language),
      accessorKey: 'plotDescription',
      cell: ({ row, getValue }) => {
        const nodeId = row.original.id;

        if (editingNodeId === nodeId) {
          return (
            <select
              className="border rounded-md p-2 text-sm"
              defaultValue={row.original.plotID ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__create__') {
                  setCreatePlotNodeId(nodeId);
                  setShowCreatePlot(true);
                } else {
                  handleAssignPlot(nodeId, val || null);
                }
              }}
            >
              <option value="">
                {decodeCombined(
                  '[en]Not Assigned to Plot[es]No asignado a parcela',
                  language,
                )}
              </option>
              {row.original.plotID != null && row.original.plotDescription != null && (
                <option value={row.original.plotID}>
                  {row.original.plotDescription} (current)
                </option>
              )}
              {availablePlots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.id} - {plot.description}
                </option>
              ))}
              <option value="__create__">
                {decodeCombined(
                  '[en]+ Create New Plot[es]+ Crear nueva parcela',
                  language,
                )}
              </option>
            </select>
          );
        }

        const val = getValue() as string | null;
        return val ?? decodeCombined(
          '[en]Not Assigned to Plot[es]No asignado a parcela',
          language,
        );
      },
    },
    {
      header: decodeCombined('[en]Last Seen[es]Última vez vista', language),
      accessorKey: 'lastMeasurementDate',
      cell: ({ getValue }) => {
        const val = getValue() as Date | null;
        if (!val) return '—';
        return <LastSeenCell lastSeen={val} />;
      },
    },
  ];

  return (
    <>
      <Header />
      <div className="flex justify-center">
        <div className="w-5/6 bg-white drop-shadow-lg p-10 pt-0 mt-0 m-10">
          <h1 className="font-bold tracking-tighter text-4xl pt-8 pb-4">
            {decodeCombined('[en]Nodes[es]Nodos', language)}
          </h1>
          <DataTable columns={columns} data={rows} />
        </div>
      </div>

      <Dialog open={deleteNodeId !== null} onOpenChange={(open) => {
        if (!open) setDeleteNodeId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decodeCombined('[en]Delete Node[es]Eliminar Nodo', language)}
            </DialogTitle>
            <DialogDescription>
              {decodeCombined(
                '[en]Are you sure you want to delete this node? This action cannot be undone unless the node is heard from again.[es]¿Está seguro de que desea eliminar este nodo? Esta acción no se puede deshacer a menos que el nodo se vuelva a escuchar.',
                language,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteNodeId(null)}>
              {decodeCombined('[en]Cancel[es]Cancelar', language)}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteNodeId && handleDeleteNode(deleteNodeId)}
            >
              {decodeCombined('[en]Delete[es]Eliminar', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatePlot} onOpenChange={(open) => {
        if (!open) {
          setShowCreatePlot(false);
          setCreatePlotNodeId(null);
          setNewPlot({ id: '', latitude: '', longitude: '', description: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decodeCombined('[en]Create New Plot[es]Crear nueva parcela', language)}
            </DialogTitle>
            <DialogDescription>
              {decodeCombined(
                '[en]Enter the details for the new plot.[es]Ingrese los detalles de la nueva parcela.',
                language,
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plotId">
                {decodeCombined('[en]Plot ID[es]ID de Parcela', language)}
              </Label>
              <Input
                id="plotId"
                value={newPlot.id}
                onChange={(e) => setNewPlot({ ...newPlot, id: e.target.value })}
                placeholder={decodeCombined('[en]Leave blank for auto-generated ID[es]Dejar en blanco para ID auto-generado', language)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="latitude">
                {decodeCombined('[en]Latitude[es]Latitud', language)}
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={newPlot.latitude}
                onChange={(e) => setNewPlot({ ...newPlot, latitude: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude">
                {decodeCombined('[en]Longitude[es]Longitud', language)}
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={newPlot.longitude}
                onChange={(e) => setNewPlot({ ...newPlot, longitude: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                {decodeCombined('[en]Description[es]Descripción', language)}
              </Label>
              <Input
                id="description"
                value={newPlot.description}
                onChange={(e) => setNewPlot({ ...newPlot, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreatePlot(false);
              setCreatePlotNodeId(null);
              setNewPlot({ id: '', latitude: '', longitude: '', description: '' });
            }}>
              {decodeCombined('[en]Cancel[es]Cancelar', language)}
            </Button>
            <Button
              onClick={handleCreatePlot}
              disabled={!newPlot.latitude || !newPlot.longitude || !newPlot.description}
            >
              {decodeCombined('[en]Create[es]Crear', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
