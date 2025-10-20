export interface TimerState {
    timeLeft: number; // in seconds
    isRunning: boolean;
    isWarning: boolean; // true when less than 1 minute left
}

export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const createTimer = (
    initialMinutes: number,
    onTick: (state: TimerState) => void,
    onComplete: () => void
) => {
    let timeLeft = initialMinutes * 60;
    let intervalId: NodeJS.Timeout | null = null;

    const tick = () => {
        timeLeft--;

        const state: TimerState = {
            timeLeft,
            isRunning: timeLeft > 0,
            isWarning: timeLeft <= 60
        };

        onTick(state);

        if (timeLeft <= 0) {
            stop();
            onComplete();
        }
    };

    const start = () => {
        if (intervalId) return;
        intervalId = setInterval(tick, 1000);
    };

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    const pause = () => {
        stop();
    };

    const resume = () => {
        start();
    };

    return {
        start,
        stop,
        pause,
        resume,
        getTimeLeft: () => timeLeft,
        getState: () => ({
            timeLeft,
            isRunning: timeLeft > 0,
            isWarning: timeLeft <= 60
        })
    };
};
