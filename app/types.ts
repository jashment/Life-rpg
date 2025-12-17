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
    type: 'HEALTH' | 'WORK' | 'LIFE' | 'SOCIAL';
};

export type Item = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: string;
  type: string;
};
