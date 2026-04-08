import { Header } from '@/components/ui/header';
import { DataTable } from '@/components/ui/data-table';
import { SensorNode, Plot, LastMeasurementsObject } from '@/lib/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { LastSeenCell } from '@/components/tables/cell/lastSeenCell';

type NodeRow = SensorNode & {
  plotDescription: string | null;
  lastMeasurementDate: Date | null;
};

export const Nodes = () => {
  const [rows, setRows] = useState<NodeRow[]>([]);
  const { language } = useLanguage();

  const fetchData = async () => {
    const res = await axios.get('/api/measurements/latest');
    const data = res.data as LastMeasurementsObject;

    const plots: Plot[] = data.plots;

    const nodeRows: NodeRow[] = data.nodes.map((entry) => {
      const node = entry.node;
      const plot = plots.find((p) => p.id === node.plotID);
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

  const columns: ColumnDef<NodeRow>[] = [
    {
      header: decodeCombined('[en]Node ID[es]ID de Nodo', language),
      accessorKey: 'id',
    },
    {
      header: decodeCombined('[en]Plot[es]Parcela', language),
      accessorKey: 'plotDescription',
      cell: ({ getValue }) => {
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
    </>
  );
};
