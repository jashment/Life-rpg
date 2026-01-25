export function calculateLevel(xp: number): {
    level: number;
    currentXP: number;
    xpForNextLevel: number;
} {
    let level = 1;
    let xpRemaining = xp;
    let xpNeeded = 100;

    while (xpRemaining >= xpNeeded) {
        xpRemaining -= xpNeeded;
        level++;
        xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
    }

    return { level, currentXP: xpRemaining, xpForNextLevel: xpNeeded };
}
