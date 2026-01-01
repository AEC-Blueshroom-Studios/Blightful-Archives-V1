
export interface Reward {
    name: string;
    desc: string;
    type: 'ACTIVE' | 'PASSIVE';
    id: string;
    cost: number;
    // Method to draw the icon in the UI
    drawIcon: (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
}

export interface Boss {
    id: number;
    name: string;
    archetype: string;
    color: string;
    hp: number;
    desc: string;
    quote: string;
    dialogue: string[];
    reward: Reward;
    draw: (c: CanvasRenderingContext2D, x: number, y: number, t: number, s: number, col: string, state?: any) => void;
}

export interface PlayerStats {
    maxHp: number;
    damageMult: number;
    speedMult: number;
    fireRateMult: number;
    currency: number;
}

export type GameState = 'INTRO' | 'MENU' | 'SHOP' | 'INVENTORY' | 'DIALOGUE' | 'PLAY' | 'REWARD' | 'ENDING';

export interface Bullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    col?: string;
    angle?: number;
    size?: number;
    life?: number;
    special?: string;
    gravity?: number;
    timer?: number;
    homing?: boolean;
    bounce?: number;
    pierce?: number;
    damage?: number;
}
