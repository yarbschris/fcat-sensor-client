import { DataTable } from '@/components/ui/data-table';
import { Measurement, Plot, Sensor, SensorNode } from '@/lib/types';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { LucideBatteryWarning } from 'lucide-react';
import { SensorNodeCell } from './cell/sensorNodeCell';
import { Progress } from '../ui/progress';
import { LastMeasurementsCell } from './cell/lastMeasurementsCell';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
        node: SensorNode | null;
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
        cell: (cell) => {
            const nodeID = cell.getValue() as string | null;
            if (!nodeID) return decodeCombined('[en]No Node Assigned[es]Ningún nodo asignado', language);
            return <SensorNodeCell plotId={nodeID} />;
        },
        accessorKey: 'nodeID',
    },
    {
        header: decodeCombined('[en]Description[es]Descripción', language),
        accessorKey: 'description',
    },
    {
        header: decodeCombined('[en]Last Seen[es]Última vez vista', language),
        cell: (cell) => {
            const lastMeasurement = cell.row?.original?.lastMeasurements[0];
            if (!lastMeasurement) return '—';
            return <LastSeenCell lastSeen={new Date(lastMeasurement.createdAt)} />;
        },
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
            if (cell.row.original.lastMeasurements.length === 0) return '—';
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
}) => {
    const columns = useMemo(
        () => columnFactory({ setSelectedPlot, selectedPlot, language }),
        [setSelectedPlot, selectedPlot, language],
    );
    const highlightRow = useCallback(
        (row: DynamicTableData[number]) => row.id === selectedPlot,
        [selectedPlot],
    );
    return (
        <div>
            <DataTable
                columns={columns}
                data={data}
                highlightRow={highlightRow}
            />
        </div>
    );
};

export type DynamicTableData = Array<
    Plot & {
        node: SensorNode | null;
        sensors: Array<Sensor>;
        lastMeasurements: Array<Measurement>;
    }
>;
