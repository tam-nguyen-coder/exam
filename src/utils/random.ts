// Utility functions to avoid hydration mismatches

let seed = 0;

export const seededRandom = (): number => {
    // Simple seeded random number generator
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
};

export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const getCurrentTimestamp = (): number => {
    return Date.now();
};
