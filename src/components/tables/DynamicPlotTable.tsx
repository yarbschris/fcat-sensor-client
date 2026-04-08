import { DataTable } from '@/components/ui/data-table';
import { Measurement, Plot, Sensor, SensorNode } from '@/lib/types';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { LucideBatteryWarning } from 'lucide-react';
import { SensorNodeCell } from './cell/sensorNodeCell';
import { Progress } from '../ui/progress';
import { LastMeasurementsCell } from './cell/lastMeasurementsCell';
import { useEffect, useState } from 'react';
import { LastSeenCell } from './cell/lastSeenCell';
import { Language } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';
export const columnFactory: ({
    setSelectedPlot,
    selectedPlot,
    language,
}: {
    selectedPlot: string | null;
    setSelectedPlot: (val: string | null) => void;
    language: Language;
}) => ColumnDef<
    Plot & {
        node: SensorNode;
        sensors: Array<Sensor>;
        lastMeasurements: Array<Measurement>;
    }
>[] = ({ setSelectedPlot, selectedPlot, language }) => [
    {
        header: decodeCombined('[en]Plot ID[es]ID de Parcela', language),
        accessorKey: 'id',
    },
    {
        header: decodeCombined('[en]Node[es]Nodo', language),
        cell: (cell) => <SensorNodeCell plotId={cell.getValue() as string} />,
        accessorKey: 'nodeID',
    },
    {
        header: decodeCombined('[en]Description[es]Descripción', language),
        accessorKey: 'description',
    },
    {
        header: decodeCombined('[en]Last Seen[es]Última vez vista', language),
        cell: (cell) => (
            <LastSeenCell
                lastSeen={new Date(cell.row?.original?.lastMeasurements[0]?.createdAt)}
            />
        ),
    },
    {
        header: decodeCombined('[en]Location[es]Ubicación', language),
        accessorKey: 'location',
        cell: (cell) => {
            const location = {
                latitude: cell.row.original.latitude,
                longitude: cell.row.original.longitude,
            };
            const id = cell.row.original.id as string;

            console.log('Location Cell Row Original:', cell.row.original);
            console.log('Location Cell Plot ID:', id);

            return (
                <div
                    onClick={() => {
                        setSelectedPlot(id);
                        window.scrollTo(0, 0);
                    }}
                    className="border w-fit bg-gradient-to-r rounded-3xl p-2 to-blue-200 from-blue-50 hover:to-blue-100"
                >
                    <div>{`${Math.abs(location.latitude).toFixed(5)}°${location.latitude > 0 ? 'N' : 'S'}`}</div>
                    <div>{`${Math.abs(location.longitude).toFixed(5)}°${location.longitude > 0 ? 'E' : 'W'}`}</div>
                </div>
            );
        },
    },

    {
        header: decodeCombined(
            '[en]Last Measurements[es]Últimas mediciones',
            language,
        ),
        cell: (cell) => {
            console.log('Last Measurements Cell Row Original:', cell.row.original);
            console.log('Last Measurements Cell Plot ID:', cell.row.original.id);

            return (
                <LastMeasurementsCell
                    lastMeasurements={cell.row.original.lastMeasurements}
                    sensors={cell.row.original.sensors}
                    plotId={cell.row.original.id}
                />
            );
        },
    },

];

export const DynamicPlotTable = ({
    data,
    selectedPlot,
    setSelectedPlot,
    language,
}: {
    data: DynamicTableData;
    selectedPlot: string | null;
    setSelectedPlot: (val: string | null) => void;
    language: Language;
}) => (
    <div>
        <DataTable
            columns={columnFactory({ setSelectedPlot, selectedPlot, language })}
            data={data}
            highlightRow={(row) => row.id === selectedPlot}
        />
    </div>
);

export type DynamicTableData = Array<
    Plot & {
        node: SensorNode;
        sensors: Array<Sensor>;
        lastMeasurements: Array<Measurement>;
    }
>;
