export type Achievement = {
    id: string;
    title: string;
    description: string;
    emoji: string;
    count: number;
    lastEarned: string;
    xp: number;
};

export type Quest = {
    id: string;
    title: string;      
    task: string;       
    xp: number;
    isCompleted: boolean;
    type: 'HEALTH' | 'CODE' | 'LIFE'; //
};
}