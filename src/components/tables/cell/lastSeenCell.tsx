import { useEffect, useState } from 'react';
import { useLanguage } from '@/LocalizationProvider';
import { decodeCombined } from '@/lib/utils';

export const LastSeenCell = ({ lastSeen }: { lastSeen: Date }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { language } = useLanguage();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const getTimeSinceString = (time: Date) => {
    const diff = Math.floor((currentTime.getTime() - time.getTime()) / 1000);
    if (diff < 60) {
      return `${diff} ${decodeCombined('[en]seconds ago[es]segundos atrás', language)}`;
    }
    if (diff < 3600) {
      return `${Math.floor(diff / 60)} ${decodeCombined('[en]minutes ago[es]minutos atrás', language)}`;
    }
    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} ${decodeCombined('[en]hours ago[es]horas atrás', language)}`;
    }
    return `${Math.floor(diff / 86400)} ${decodeCombined('[en]days ago[es]días atrás', language)}`;
  };
  return (
    <div>
      <div>{getTimeSinceString(lastSeen)}</div>
    </div>
  );
};
