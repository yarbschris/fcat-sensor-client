import { createContext, useContext, useEffect, useState, SetStateAction, Dispatch, ReactNode } from 'react';

export const TimezoneContext = createContext<{
    timezone: string;
    setTimezone: Dispatch<SetStateAction<string>>;
}>({ timezone: 'America/Guayaquil', setTimezone: () => { } });

export const TimezoneProvider = ({ children }: { children: ReactNode }) => {
    const [timezone, setTimezone] = useState<string>(getLocalTimezone());
    useEffect(() => { localStorage.setItem('tz', timezone); }, [timezone]);

    return (
        <TimezoneContext.Provider value={{ timezone, setTimezone }}>
            {children}
        </TimezoneContext.Provider>
    );
};

export const useTimezone = () => useContext(TimezoneContext);

export const getLocalTimezone = (): string => {
    const stored = localStorage.getItem('tz');
    if (stored) return stored;
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
    catch { return 'America/Guayaquil'; }
};
