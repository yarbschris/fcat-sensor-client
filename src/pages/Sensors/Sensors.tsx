import { Header } from '@/components/ui/header';
import { DataTable } from '@/components/ui/data-table';
import { Sensor } from '@/lib/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
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

export const Sensors = () => {
  const [rows, setRows] = useState<Sensor[]>([]);
  const [editingSensorId, setEditingSensorId] = useState<number | null>(null);
  const [deleteSensorId, setDeleteSensorId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSensor, setNewSensor] = useState({
    id: '',
    name: '',
    description: '',
    length: '',
    transformEq: '',
    typicalRangeMin: '',
    typicalRangeMax: '',
  });
  const [editSensor, setEditSensor] = useState<Partial<Sensor>>({ });
  const { language } = useLanguage();

  const fetchData = async () => {
    const res = await axios.get('/api/sensors');
    setRows(res.data.sensors);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    await axios.post('/api/sensors/', {
      id: parseInt(newSensor.id),
      name: newSensor.name,
      description: newSensor.description,
      length: parseInt(newSensor.length),
      transformEq: newSensor.transformEq,
      typicalRange: [parseFloat(newSensor.typicalRangeMin), parseFloat(newSensor.typicalRangeMax)],
    });
    setShowCreate(false);
    setNewSensor({ id: '', name: '', description: '', length: '', transformEq: '', typicalRangeMin: '', typicalRangeMax: '' });
    await fetchData();
  };

  const handleUpdate = async (id: number) => {
    await axios.patch(`/api/sensors/updatePlot/${id}`, {
      sensor: editSensor,
    });
    setEditingSensorId(null);
    setEditSensor({ });
    await fetchData();
  };

  const handleDelete = async (id: number) => {
    await axios.delete(`/api/sensors/deletePlot/${id}`);
    setDeleteSensorId(null);
    await fetchData();
  };

  const columns: ColumnDef<Sensor>[] = [
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const id = row.original.id;
        if (editingSensorId === id) {
          return (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingSensorId(null); setEditSensor({ }); }}>
                {decodeCombined('[en]Cancel[es]Cancelar', language)}
              </Button>
              <Button size="sm" onClick={() => handleUpdate(id)}>
                {decodeCombined('[en]Save[es]Guardar', language)}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteSensorId(id)}>
                {decodeCombined('[en]Delete[es]Eliminar', language)}
              </Button>
            </div>
          );
        }
        return (
          <Button variant="outline" size="sm" onClick={() => { setEditingSensorId(id); setEditSensor(row.original); }}>
            {decodeCombined('[en]Edit[es]Editar', language)}
          </Button>
        );
      },
    },
    {
      header: decodeCombined('[en]ID[es]ID', language),
      accessorKey: 'id',
    },
    {
      header: decodeCombined('[en]Name[es]Nombre', language),
      accessorKey: 'name',
      cell: ({ row, getValue }) => {
        if (editingSensorId === row.original.id) {
          return (
            <Input
              value={editSensor.name ?? ''}
              onChange={(e) => setEditSensor({ ...editSensor, name: e.target.value })}
            />
          );
        }
        return getValue() as string;
      },
    },
    {
      header: decodeCombined('[en]Description[es]Descripción', language),
      accessorKey: 'description',
      cell: ({ row, getValue }) => {
        if (editingSensorId === row.original.id) {
          return (
            <Input
              value={editSensor.description ?? ''}
              onChange={(e) => setEditSensor({ ...editSensor, description: e.target.value })}
            />
          );
        }
        return (getValue() as string) ?? '—';
      },
    },
    {
      header: decodeCombined('[en]Length[es]Longitud', language),
      accessorKey: 'length',
      cell: ({ row, getValue }) => {
        if (editingSensorId === row.original.id) {
          return (
            <Input
              type="number"
              value={editSensor.length ?? ''}
              onChange={(e) => setEditSensor({ ...editSensor, length: parseInt(e.target.value) })}
            />
          );
        }
        return getValue() as number;
      },
    },
    {
      header: decodeCombined('[en]Transform Equation[es]Ecuación de transformación', language),
      accessorKey: 'transformEq',
      cell: ({ row, getValue }) => {
        if (editingSensorId === row.original.id) {
          return (
            <Input
              value={editSensor.transformEq ?? ''}
              onChange={(e) => setEditSensor({ ...editSensor, transformEq: e.target.value })}
            />
          );
        }
        return getValue() as string;
      },
    },
    {
      header: decodeCombined('[en]Typical Range[es]Rango típico', language),
      accessorKey: 'typicalRange',
      cell: ({ getValue }) => {
        const val = getValue() as [number, number] | null;
        if (!val) return '—';
        return `${val[0]} – ${val[1]}`;
      },
    },
  ];

  return (
    <>
      <Header />
      <div className="flex justify-center">
        <div className="w-5/6 bg-white drop-shadow-lg p-10 pt-0 mt-0 m-10">
          <div className="flex justify-between items-center pt-8 pb-4">
            <h1 className="font-bold tracking-tighter text-4xl">
              {decodeCombined('[en]Sensors[es]Sensores', language)}
            </h1>
            <Button onClick={() => setShowCreate(true)}>
              {decodeCombined('[en]+ New Sensor[es]+ Nuevo sensor', language)}
            </Button>
          </div>
          <DataTable columns={columns} data={rows} />
        </div>
      </div>

      <Dialog open={deleteSensorId !== null} onOpenChange={(open) => { if (!open) setDeleteSensorId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decodeCombined('[en]Delete Sensor[es]Eliminar sensor', language)}</DialogTitle>
            <DialogDescription>
              {decodeCombined('[en]Are you sure you want to delete this sensor? This action cannot be undone.[es]¿Está seguro de que desea eliminar este sensor? Esta acción no se puede deshacer.', language)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSensorId(null)}>
              {decodeCombined('[en]Cancel[es]Cancelar', language)}
            </Button>
            <Button variant="destructive" onClick={() => deleteSensorId && handleDelete(deleteSensorId)}>
              {decodeCombined('[en]Delete[es]Eliminar', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) setShowCreate(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decodeCombined('[en]Create New Sensor[es]Crear nuevo sensor', language)}</DialogTitle>
            <DialogDescription>
              {decodeCombined('[en]Enter the details for the new sensor.[es]Ingrese los detalles del nuevo sensor.', language)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]ID[es]ID', language)}</Label>
              <Input type="number" value={newSensor.id} onChange={(e) => setNewSensor({ ...newSensor, id: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Name[es]Nombre', language)}</Label>
              <Input value={newSensor.name} onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Description[es]Descripción', language)}</Label>
              <Input value={newSensor.description} onChange={(e) => setNewSensor({ ...newSensor, description: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Length[es]Longitud', language)}</Label>
              <Input type="number" value={newSensor.length} onChange={(e) => setNewSensor({ ...newSensor, length: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Transform Equation[es]Ecuación de transformación', language)}</Label>
              <Input value={newSensor.transformEq} onChange={(e) => setNewSensor({ ...newSensor, transformEq: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Typical Range Min[es]Rango mínimo típico', language)}</Label>
              <Input type="number" value={newSensor.typicalRangeMin} onChange={(e) => setNewSensor({ ...newSensor, typicalRangeMin: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{decodeCombined('[en]Typical Range Max[es]Rango máximo típico', language)}</Label>
              <Input type="number" value={newSensor.typicalRangeMax} onChange={(e) => setNewSensor({ ...newSensor, typicalRangeMax: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {decodeCombined('[en]Cancel[es]Cancelar', language)}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newSensor.id || !newSensor.name || !newSensor.length || !newSensor.transformEq}
            >
              {decodeCombined('[en]Create[es]Crear', language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
