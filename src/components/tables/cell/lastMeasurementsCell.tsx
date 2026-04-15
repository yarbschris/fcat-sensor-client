import { useState, useCallback } from 'react';
import { useLanguage } from '@/LocalizationProvider';
import { Progress } from '@/components/ui/progress';
import { Measurement, Sensor } from '@/lib/types';
import { decodeCombined } from '@/lib/utils';
import axios from 'axios';
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
    const [openSensorID, setOpenSensorID] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchMeasurements = useCallback(async (sensorId: string) => {
        try {
            setLoading(true);
            setChartData([]);
            const response = await axios.get(`/api/measurements/byPlot/${plotId}`);
            const rawData: any[] = response.data;

            const points: ChartData[] = rawData
                .filter((item) => item.sensorID === sensorId)
                .map((item) => ({
                    timestamp: new Date(item.time).toLocaleString(),
                    value: parseFloat(item.data),
                }))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setChartData(points);
        } catch (error) {
            console.error('Error fetching measurements:', error);
        } finally {
            setLoading(false);
        }
    }, [plotId]);

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
                                    fetchMeasurements(measurement.sensorID);
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
                            <DialogContent className="w-full max-w-[1400px] h-[800px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        {decodeCombined('[en]Measurement Data for Sensor[es]Datos de medición para el sensor', language)} {measurement.sensorID}
                                    </DialogTitle>
                                </DialogHeader>
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
