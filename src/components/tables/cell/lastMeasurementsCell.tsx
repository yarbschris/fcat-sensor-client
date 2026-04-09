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
    temperature?: number;
    humidity?: number;
    lightCoverage?: number;
    batteryPercentage?: number;
    soilMoisture?: number;
}

const cleanSensorName = (name: string) => {
    const match = name.match(/\[en\](.*?)\[/);
    return match ? match[1] : name;
};

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
    const [selectedSensorName, setSelectedSensorName] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchMeasurements = useCallback(async (sensorName: string) => {
        try {
            setLoading(true);
            setChartData([]);
            const response = await axios.get(`/api/measurements/byPlot/${plotId}`);
            const rawData = response.data;

            const sensorMap: { [key: string]: keyof ChartData } = {
                '0': 'soilMoisture',
                '1': 'temperature',
                '2': 'humidity',
                '3': 'lightCoverage',
                '4': 'batteryPercentage',
            };

            const grouped: { [key: string]: Partial<ChartData> } = {};
            rawData.forEach((item: any) => {
                const time = new Date(item.time).toLocaleString();
                const sensorIds = item.sensorID.split(',');
                const values = item.data.split(',');

                if (!grouped[time]) grouped[time] = { timestamp: time };

                sensorIds.forEach((id: string, index: number) => {
                    const field = sensorMap[id];
                    if (field && values[index] !== undefined) {
                        const value = parseFloat(values[index]);
                        (grouped[time] as any)[field] = value;
                    }
                });
            });

            const formatted = Object.values(grouped).sort(
                (a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime()
            ) as ChartData[];

            setChartData(formatted);
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
                const sensorName = cleanSensorName(sensor?.name || '');
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
                                    setSelectedSensorName(sensorName);
                                    fetchMeasurements(sensorName);
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
                                            {parseFloat(measurement.data).toFixed(2)}
                                        </div>
                                        <div>{sensor?.description}</div>
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-[1400px] h-[800px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Measurement Data for Sensor {measurement.sensorID}
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
                                                    unit={
                                                        selectedSensorName === 'Temperature'
                                                            ? '°F'
                                                            : selectedSensorName === 'Humidity'
                                                                ? '%'
                                                                : selectedSensorName === 'Light Coverage'
                                                                    ? 'lux'
                                                                    : selectedSensorName === 'Battery Percentage'
                                                                        ? '%'
                                                                        : selectedSensorName === 'Soil Moisture'
                                                                            ? '%'
                                                                            : ''
                                                    }
                                                    domain={
                                                        selectedSensorName === 'Battery Percentage'
                                                            ? [0, 100]
                                                            : selectedSensorName === 'Light Coverage'
                                                                ? [0, 2000]
                                                                : [0, 'auto']
                                                    }
                                                    tickCount={6}
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                    width={80}
                                                />
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                                                {selectedSensorName === 'Soil Moisture' && (
                                                    <Line type="monotone" dataKey="soilMoisture" stroke="#8884d8" />
                                                )}
                                                {selectedSensorName === 'Temperature' && (
                                                    <Line type="monotone" dataKey="temperature" stroke="#ff4d4f" />
                                                )}
                                                {selectedSensorName === 'Humidity' && (
                                                    <Line type="monotone" dataKey="humidity" stroke="#82ca9d" />
                                                )}
                                                {selectedSensorName === 'Light Coverage' && (
                                                    <Line type="monotone" dataKey="lightCoverage" stroke="#ffc658" />
                                                )}
                                                {selectedSensorName === 'Battery Percentage' && (
                                                    <Line type="monotone" dataKey="batteryPercentage" stroke="#ff7300" />
                                                )}
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
