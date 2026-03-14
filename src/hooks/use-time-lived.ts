import { useState, useEffect } from 'react';
import { intervalToDuration, type Duration } from 'date-fns';

export function useTimeLived(dob: string | null | undefined) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const duration: Duration | null = dob
        ? intervalToDuration({ start: new Date(dob), end: time })
        : null;

    return { time, duration };
}
