import { useTimezone } from '@/TimezoneProvider';

const ZONES = [
    'America/Guayaquil',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'UTC',
];

export const Settings = () => {
    const { timezone, setTimezone } = useTimezone();
    return (
        <div className="p-4">
            <label className="flex gap-2 items-center">
                <span>Timezone:</span>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                    className="border rounded px-2 py-1">
                    {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
            </label>
        </div>
    );
};

