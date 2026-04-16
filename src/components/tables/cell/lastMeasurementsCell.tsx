import { useState, useEffect } from 'react';
import { useLanguage } from '@/LocalizationProvider';
import { Progress } from '@/components/ui/progress';
import { Measurement, Sensor } from '@/lib/types';
import { decodeCombined } from '@/lib/utils';
import axios from 'axios';
import { useTimezone } from '@/TimezoneProvider';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface ChartData {
    timestamp: string;
    value: number;
}


export const LastMeasurementsCell = ({
    lastMeasurements,
    sensors,
    plotId,
}: {
    lastMeasurements: Array<Measurement>;
    sensors: Array<Sensor>;
    plotId: string;
}) => {
    const { language } = useLanguage();
    const { timezone } = useTimezone();
    const [openSensorID, setOpenSensorID] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date(); d.setDate(d.getDate() - 30);
        return formatInTimeZone(d, timezone, 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState<string>(
        () => formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
    );
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!openSensorID) return;
        let cancelled = false;
        setLoading(true);
        const startIso = fromZonedTime(`${startDate}T00:00:00`, timezone).toISOString();
        const endIso = fromZonedTime(`${endDate}T23:59:59`, timezone).toISOString();
        axios.get(`/api/measurements/byPlot/${plotId}`, {
            params: { start: startIso, end: endIso },
        })
            .then((res) => {
                if (cancelled) return;
                const points: ChartData[] = res.data
                    .filter((i: any) => i.sensorID === openSensorID)
                    .map((i: any) => ({
                        timestamp: formatInTimeZone(new Date(i.time), timezone, 'yyyy-MM-dd HH:mm'),
                        value: parseFloat(i.data),
                    }))
                    .sort((a: ChartData, b: ChartData) =>
                        a.timestamp.localeCompare(b.timestamp)
                    );
                setChartData(points);
            })
            .catch((err) => console.error('Error fetching measurements:', err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [openSensorID, startDate, endDate, plotId, timezone]);

    return (
        <div className="flex flex-row flex-wrap">
            {lastMeasurements.map((measurement) => {
                const sensor = sensors.find((s) => s.id.toString() === measurement.sensorID);
                const valuePercentage = sensor
                    ? ((parseFloat(measurement.data) - sensor.typicalRange[0]) /
                        (sensor.typicalRange[1] - sensor.typicalRange[0])) *
                    100
                    : 0;

                return (
                    <div
                        key={`sensor-${measurement.sensorID}`}
                        className="flex flex-col p-2 border rounded-lg m-2 bg-gradient-to-r from-green-200 to-green-100 hover:to-green-200"
                    >
                        <Dialog
                            open={openSensorID === measurement.sensorID}
                            onOpenChange={(open) => {
                                if (open) {
                                    setOpenSensorID(measurement.sensorID);
                                    setSelectedSensor(sensor ?? null);
                                } else {
                                    setOpenSensorID(null);
                                }
                            }}
                        >
                            <DialogTrigger className="w-full">
                                <div className="flex flex-col cursor-pointer">
                                    <div className="font-bold">
                                        {decodeCombined(sensor?.name as string, language)}
                                    </div>
                                    <div className="flex flex-row gap-2">
                                        <div className="font-bold">
                                            {isNaN(parseFloat(measurement.data)) ? '—' : parseFloat(measurement.data).toFixed(2)} {decodeCombined(sensor?.description ?? '', language)}
                                        </div>
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-[1400px] h-[800px] flex flex-col gap-2">
                                <DialogHeader className="pb-0">
                                    <DialogTitle>
                                        {decodeCombined('[en]Measurement Data for Sensor[es]Datos de medición para el sensor', language)} {measurement.sensorID}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex gap-2 items-center px-4 py-2">
                                    <span>{decodeCombined('[en]Range:[es]Rango:', language)}</span>
                                    <input type="date" value={startDate} max={endDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="border rounded px-2 py-1" />
                                    <span>-</span>
                                    <input type="date" value={endDate} min={startDate}
                                        max={new Date().toISOString().slice(0, 10)}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border rounded px-2 py-1" />
                                </div>
                                {loading ? (
                                    <div className="text-center">Loading...</div>
                                ) : (
                                    <div className="flex justify-center items-center w-full h-full">
                                        <ResponsiveContainer width="95%" height="90%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="timestamp" dy={15} />
                                                <YAxis
                                                    unit={selectedSensor?.description ?? ''}
                                                    domain={
                                                        selectedSensor?.typicalRange
                                                            ? [selectedSensor.typicalRange[0], selectedSensor.typicalRange[1]]
                                                            : [0, 'auto']
                                                    }
                                                    tickCount={6}
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                    width={80}
                                                />
                                                <Tooltip
                                                    formatter={(value: number) => [
                                                        `${value.toFixed(2)} ${decodeCombined(selectedSensor?.description ?? '', language)}`,
                                                        decodeCombined(selectedSensor?.name ?? '', language),
                                                    ]}
                                                />
                                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                                                <Line type="monotone" dataKey="value" name={decodeCombined(selectedSensor?.name ?? '', language)} stroke="#8884d8" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                        <Progress value={valuePercentage} />
                    </div>
                );
            })}
        </div>
    );
};
