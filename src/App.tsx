
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BOSS_DATABASE } from './bossData';
import { Boss, Bullet, GameState, PlayerStats, Reward } from './types';

// ==========================================
// CONSTANTS & GAME ENGINE DATA
// ==========================================

const DEFEATED_BOSSES = new Set<number>();
const UNLOCKED_SHOP_ITEMS = new Set<string>(); // IDs of items available to buy
const OWNED_ITEMS = new Set<string>(['DASH']); // Start with Dash owned

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Physics Constants
const MOVE_SPEED = 1.5;
const MAX_SPEED_BASE = 6;
const FRICTION = 0.85;

const introLines = [
    "SYSTEM DIAGNOSTIC...",
    "ERROR: CORE DATA CORRUPTED.",
    "DETECTED SOURCE: THE ARCHIVE BLIGHTS.",
    "50 ANOMALIES HAVE SEIZED THE ARCHIVE.",
    "THREAT LEVEL: OMEGA.",
    " ",
    "INITIATING CHRONICLER PROTOCOL...",
    "OBJECTIVE: PURGE ALL RECORDS."
];

const finalLines = [
    "SYSTEM DIAGNOSTIC COMPLETE...",
    "0 ANOMALIES DETECTED.",
    "ALL 50 ARCHIVE ENTRIES RESTORED.",
    "THE BLIGHT HAS BEEN PERMANENTLY DELETED.",
    " ",
    "A GAME BY TEJAS JARUGULA.",
    "THANK YOU FOR SAVING THE ARCHIVES.",
    " ",
    "RETURNING TO ROOT DIRECTORY..."
];

// Helper: Spawn Boss Bullet (Global for behaviors)
let spawnBullet: (x: number, y: number, vx: number, vy: number, col: string, props?: any) => void = () => {};

const createPhasedAI = (phases: any[]) => {
    return (b: any, p: any, t: number, engine: any) => {
        if (b.phaseTimer > phases[b.currentPhaseIdx].duration) {
            b.currentPhaseIdx = (b.currentPhaseIdx + 1) % phases.length;
            b.phase = phases[b.currentPhaseIdx].name;
            b.phaseTimer = 0;
        }
        const phase = phases[b.currentPhaseIdx];
        if (engine && engine.timeScale < 1 && Math.random() > engine.timeScale) return;
        if (b.phaseTimer % phase.interval === 0) phase.action(b, p, b.phaseTimer);
        
        let ts = engine ? engine.timeScale : 1.0;
        let moveSpeed = (phase.move === 'chase' ? 0.02 : 0.05) * ts;
        if (engine && engine.unlockedAbilities.has('STASIS')) moveSpeed *= 0.8;

        if (phase.move === 'chase') { b.x += (p.x - b.x) * moveSpeed; b.y += (p.y - b.y) * moveSpeed; } 
        else if (phase.move === 'center') { b.x += (400 - b.x) * moveSpeed; b.y += (150 - b.y) * moveSpeed; } 
        else { b.x = 400 + Math.sin(b.timer * 0.02) * 200; b.y = 150 + Math.cos(b.timer * 0.03) * 50; }
    };
};

const GENERIC_AI = createPhasedAI([
    { name: 'SPRAY', duration: 180, interval: 20, action: (b:any,p:any) => { for(let i=0; i<5; i++) { let a = Math.PI/4 + i*(Math.PI/8); spawnBullet(b.x, b.y, Math.cos(a)*5, Math.sin(a)*5, b.col); } } },
    { name: 'TARGET', duration: 120, interval: 30, action: (b:any,p:any) => { let a = Math.atan2(p.y-b.y, p.x-b.x); spawnBullet(b.x, b.y, Math.cos(a)*8, Math.sin(a)*8, "#fff"); } },
    { name: 'RING', duration: 150, interval: 50, action: (b:any,p:any) => { for(let i=0; i<12; i++) { let a = i*(Math.PI/6); spawnBullet(b.x, b.y, Math.cos(a)*4, Math.sin(a)*4, b.col); } } }
]);

const BOSS_BEHAVIORS: Record<number, Function> = {
    0: createPhasedAI([{ name: 'TRIANGULATE', duration: 180, interval: 40, action: (b:any,p:any) => { for(let i=0; i<3; i++) { let a = i * (Math.PI*2/3) + b.timer*0.05; spawnBullet(b.x, b.y, Math.cos(a)*5, Math.sin(a)*5, "#2ecc71"); } } }, { name: 'BEAM', duration: 120, interval: 5, action: (b:any,p:any) => { spawnBullet(b.x + (Math.random()-0.5)*40, b.y+50, 0, 10, "#fff", {special: 'beam'}); } }, { name: 'ENCASE', duration: 150, interval: 20, action: (b:any,p:any) => { for(let i=0; i<8; i++) { let a = i * (Math.PI/4); spawnBullet(p.x + Math.cos(a)*200, p.y + Math.sin(a)*200, -Math.cos(a)*2, -Math.sin(a)*2, "#2ecc71"); } } }, { name: 'RANDOM_VECTORS', duration: 120, interval: 8, action: (b:any,p:any) => { spawnBullet(b.x, b.y, (Math.random()-0.5)*12, (Math.random()-0.5)*12, "#fff"); } }]),
    49: createPhasedAI([
        { name: 'ORIGIN', duration: 200, interval: 5, action: (b:any) => { for(let i=0;i<4;i++) spawnBullet(b.x, b.y, Math.cos(b.timer*0.1+i*1.5)*6, Math.sin(b.timer*0.1+i*1.5)*6, "#fff"); } },
        { name: 'OMEGA', duration: 180, interval: 40, action: (b:any,p:any) => { for(let i=0;i<12;i++) spawnBullet(b.x, b.y, Math.cos(i*0.5)*5, Math.sin(i*0.5)*5, "#fff"); spawnBullet(b.x, b.y, (p.x-b.x)*0.08, (p.y-b.y)*0.08, "#fff", {size: 10}); } },
        { name: 'END', duration: 160, interval: 30, action: (b:any) => { spawnBullet(0, Math.random()*600, 8, 0, "#fff"); spawnBullet(800, Math.random()*600, -8, 0, "#fff"); } },
        { name: 'FINALITY', duration: 200, interval: 100, action: (b:any) => { for(let i=0;i<40;i++) spawnBullet(b.x, b.y, Math.cos(i*0.15)*8, Math.sin(i*0.15)*8, "#fff", {size: 5}); } }
    ])
};

export default function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const abilityCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [selectedBossIdx, setSelectedBossIdx] = useState(0);
    const [bossHpPercent, setBossHpPercent] = useState(100);
    const [playerHpPercent, setPlayerHpPercent] = useState(100);
    const [terminalText, setTerminalText] = useState("");
    const [endText, setEndText] = useState("");
    const [showTerminalBtn, setShowTerminalBtn] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [controlsTab, setControlsTab] = useState<'KEYS' | 'DB'>('KEYS');
    const [currentReward, setCurrentReward] = useState<Reward | null>(null);
    const [dialogueLines, setDialogueLines] = useState<string[]>([]);
    const [dialogueIndex, setDialogueIndex] = useState(0);

    // Inventory & Shop State
    const [activeLoadout, setActiveLoadout] = useState<string[]>(['DASH']); // Max 2
    const [passiveLoadout, setPassiveLoadout] = useState<string | null>(null); // Max 1
    const [shopRefresh, setShopRefresh] = useState(0); // Force re-render for shop UI

    const [stats, setStats] = useState<PlayerStats>({
        maxHp: 100,
        damageMult: 1,
        speedMult: 1,
        fireRateMult: 1,
        currency: 0
    });
    
    // Engine State
    const engine = useRef({
        player: { 
            x: 400, y: 500, w: 20, h: 20,
            vx: 0, vy: 0, 
            hp: 200, 
            iframe: 0, 
            fireTimer: 0,
            dashTimer: 0, dashCooldown: 0,
            shieldActive: false, shieldTimer: 0, shieldCooldown: 0,
            timeSlowActive: false, timeSlowTimer: 0, timeSlowCooldown: 0,
            bombCooldown: 0, teleportCooldown: 0,
            turretCooldown: 0, turretActive: null as any,
            overclockActive: false, overclockTimer: 0, overclockCooldown: 0,
            regenTimer: 0, poisonTick: 0,
        },
        hasRevived: false,
        currentBoss: null as any,
        bullets: [] as Bullet[],
        bossBullets: [] as Bullet[],
        particles: [] as any[],
        stars: [] as any[],
        rain: [] as any[],
        cutsceneParticles: [] as any[],
        cutsceneTimer: 0,
        keys: {} as Record<string, boolean>,
        mouse: { x: 0, y: 0, down: false },
        rafId: 0,
        lastTime: 0,
        timeScale: 1.0,
        unlockedAbilities: new Set<string>() // This now reflects CURRENTLY EQUIPPED abilities for physics check
    });

    // Sync Loadout to Engine
    useEffect(() => {
        const equippedSet = new Set<string>();
        activeLoadout.forEach(id => equippedSet.add(id));
        if (passiveLoadout) equippedSet.add(passiveLoadout);
        engine.current.unlockedAbilities = equippedSet;
    }, [activeLoadout, passiveLoadout]);

    // Initialize Starfield & Helper
    useEffect(() => {
        const stars = [];
        for(let i=0; i<100; i++) {
            stars.push({ x: Math.random()*GAME_WIDTH, y: Math.random()*GAME_HEIGHT, s: Math.random()*2, v: Math.random()*0.5 + 0.1 });
        }
        engine.current.stars = stars;
        const rain = [];
        for(let i=0; i<50; i++) {
            rain.push({ x: Math.random()*GAME_WIDTH, y: Math.random()*GAME_HEIGHT, l: Math.random()*20+10, v: Math.random()*5+5 });
        }
        engine.current.rain = rain;
        spawnBullet = (x: number, y: number, vx: number, vy: number, col: string, props: any = {}) => {
            engine.current.bossBullets.push({ x, y, vx, vy, col, ...props });
        };
    }, []);

    // Draw Ability Icons Helper
    const renderAbilityIcon = (id: string, cvs: HTMLCanvasElement) => {
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        // Find reward definition
        let rewardDef = null;
        for (const b of BOSS_DATABASE) {
            if (b.reward.id === id) { rewardDef = b.reward; break; }
        }
        // Handle special case for initial DASH if not in boss list logic (it is in list though)
        if (!rewardDef && id === 'DASH') rewardDef = BOSS_DATABASE[0].reward;

        if (rewardDef) {
            rewardDef.drawIcon(ctx, 0, 0, cvs.width);
        }
    };

    // Update & Draw Loops (Same physics logic, but using updated Set)
    const createParticles = (x: number, y: number, color: string, count: number) => {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            engine.current.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30 + Math.random() * 20, color, size: Math.random() * 3
            });
        }
    };

    const update = () => {
        const { current } = engine;
        const { player, currentBoss, keys, mouse, unlockedAbilities } = current;

        // Always update global effects
        current.stars.forEach(s => { s.y += s.v; if(s.y > GAME_HEIGHT) s.y = 0; });
        current.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
        current.particles = current.particles.filter(p => p.life > 0);

        if (gameState === 'INTRO') {
            current.cutsceneTimer++;
            // Generate some glitch particles near the center
            if (Math.random() < 0.3) {
                createParticles(GAME_WIDTH/2 + (Math.random()-0.5)*50, GAME_HEIGHT/2 + (Math.random()-0.5)*50, '#0f0', 1);
            }
            return;
        }

        if (gameState === 'ENDING') {
            current.cutsceneTimer++;
            // Trigger explosions for ending sequence
            // We have 50 bosses. Let's explode them one by one starting from timer=100
            const startExplosionTime = 60;
            const interval = 5;
            if (current.cutsceneTimer > startExplosionTime && current.cutsceneTimer % interval === 0) {
                const idx = (current.cutsceneTimer - startExplosionTime) / interval;
                if (idx >= 0 && idx < BOSS_DATABASE.length) {
                    const cols = 10;
                    const spacingX = GAME_WIDTH / (cols + 1);
                    const spacingY = GAME_HEIGHT / (6); // 5 rows
                    const x = spacingX * (1 + (idx % cols));
                    const y = spacingY * (1 + Math.floor(idx / cols));
                    createParticles(x, y, BOSS_DATABASE[idx].color, 30);
                    // Add some white flash particles
                    createParticles(x, y, '#fff', 10);
                }
            }
            return;
        }

        if (gameState !== 'PLAY') return;

        // ... (All Physics and Ability Logic here is identical to previous versions)
        
        // --- COPY OF PHYSICS LOGIC ---
        current.timeScale = player.timeSlowActive ? 0.3 : 1.0;
        let acc = MOVE_SPEED * stats.speedMult;
        if (player.overclockActive) acc *= 1.5;
        if (player.timeSlowActive) acc *= 1.2;
        if (keys['w'] || keys['arrowup']) player.vy -= acc;
        if (keys['s'] || keys['arrowdown']) player.vy += acc;
        if (keys['a'] || keys['arrowleft']) player.vx -= acc;
        if (keys['d'] || keys['arrowright']) player.vx += acc;
        player.vx *= FRICTION; player.vy *= FRICTION;
        let currentMaxSpeed = MAX_SPEED_BASE * stats.speedMult;
        if (player.overclockActive) currentMaxSpeed *= 1.5;
        const speed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
        if (speed > currentMaxSpeed && player.dashTimer <= 0) {
            const ratio = currentMaxSpeed / speed; player.vx *= ratio; player.vy *= ratio;
        }

        if (unlockedAbilities.has('DASH') && (keys['shift'] || keys[' ']) && player.dashCooldown <= 0) {
            player.dashTimer = 10; player.dashCooldown = 60; player.iframe = 15;
            let dx = 0; let dy = 0;
            if (keys['w'] || keys['arrowup']) dy -= 1; if (keys['s'] || keys['arrowdown']) dy += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1; if (keys['d'] || keys['arrowright']) dx += 1;
            if (dx === 0 && dy === 0) { dx = mouse.x - player.x; dy = mouse.y - player.y; }
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len > 0) {
                player.vx = (dx / len) * 25; player.vy = (dy / len) * 25;
                createParticles(player.x, player.y, "#38b7ff", 10);
                if (unlockedAbilities.has('TRAIL')) current.bullets.push({ x: player.x, y: player.y, vx: 0, vy: 0, col: "#e67e22", size: 6, life: 60, damage: 10 });
            }
        }
        // ... (Other abilities: Shield, Time Slow, Bomb, Teleport, Turret, Overclock - assume standard logic)
        if (unlockedAbilities.has('SHIELD') && keys['q'] && player.shieldCooldown <= 0) { player.shieldActive = true; player.shieldTimer = 90; player.shieldCooldown = 300; }
        if (unlockedAbilities.has('TIME_SLOW') && keys['e'] && player.timeSlowCooldown <= 0) { player.timeSlowActive = true; player.timeSlowTimer = 120; player.timeSlowCooldown = 600; }
        if (unlockedAbilities.has('BOMB') && keys['f'] && player.bombCooldown <= 0) { engine.current.bossBullets = []; player.bombCooldown = 600; createParticles(player.x, player.y, "#ff9f43", 50); if(currentBoss) currentBoss.hp -= 200; if(unlockedAbilities.has('MEDIC')) { player.hp = Math.min(stats.maxHp, player.hp + 20); setPlayerHpPercent((player.hp / stats.maxHp) * 100); } }
        if (unlockedAbilities.has('TELEPORT') && keys['r'] && player.teleportCooldown <= 0) { createParticles(player.x, player.y, "#00d2d3", 20); player.x = mouse.x; player.y = mouse.y; createParticles(player.x, player.y, "#00d2d3", 20); player.teleportCooldown = 180; player.iframe = 10; if (unlockedAbilities.has('WARP_STRIKE')) { for(let i=0; i<8; i++) { const a = i * (Math.PI/4); current.bullets.push({ x: player.x, y: player.y, vx: Math.cos(a)*10, vy: Math.sin(a)*10, col: '#8e44ad', size: 6, damage: 15 }); } } }
        if (unlockedAbilities.has('TURRET') && keys['t'] && player.turretCooldown <= 0) { player.turretActive = { x: player.x, y: player.y, timer: 300 }; player.turretCooldown = 600; }
        if (unlockedAbilities.has('OVERCLOCK') && keys['c'] && player.overclockCooldown <= 0) { player.overclockActive = true; player.overclockTimer = 300; player.overclockCooldown = 900; }

        // Timers
        if (player.dashTimer > 0) player.dashTimer--; if (player.dashCooldown > 0) player.dashCooldown--;
        if (player.shieldActive) { player.shieldTimer--; if(player.shieldTimer<=0) player.shieldActive = false; } if (player.shieldCooldown > 0) player.shieldCooldown--;
        if (player.timeSlowActive) { player.timeSlowTimer--; if(player.timeSlowTimer<=0) player.timeSlowActive = false; } if (player.timeSlowCooldown > 0) player.timeSlowCooldown--;
        if (player.bombCooldown > 0) player.bombCooldown--; if (player.teleportCooldown > 0) player.teleportCooldown--;
        if (player.turretCooldown > 0) player.turretCooldown--; if (player.overclockCooldown > 0) player.overclockCooldown--;
        if (player.overclockActive) { player.overclockTimer--; if(player.overclockTimer<=0) player.overclockActive = false; }
        if (player.turretActive) { player.turretActive.timer--; if(player.turretActive.timer<=0) player.turretActive = null; }

        player.x += player.vx; player.y += player.vy;
        if (player.x < 10) player.x = 10; if (player.x > GAME_WIDTH - 10) player.x = GAME_WIDTH - 10;
        if (player.y < 10) player.y = 10; if (player.y > GAME_HEIGHT - 10) player.y = GAME_HEIGHT - 10;

        if (unlockedAbilities.has('REGEN')) { player.regenTimer++; if (player.regenTimer > 120) { if (player.hp < stats.maxHp) { player.hp += 1; setPlayerHpPercent((player.hp / stats.maxHp) * 100); } player.regenTimer = 0; } }

        if (!currentBoss) return;

        player.fireTimer++;
        let baseFireRate = unlockedAbilities.has('RAPID_FIRE') ? 5 : 8;
        if (unlockedAbilities.has('GATLING')) baseFireRate = 2;
        if (player.overclockActive) baseFireRate /= 2;

        if (mouse.down && player.fireTimer > baseFireRate) {
            player.fireTimer = 0;
            const dx = mouse.x - player.x; const dy = mouse.y - player.y; const angle = Math.atan2(dy, dx);
            let speed = 15; if (unlockedAbilities.has('VELOCITY')) speed = 25;
            const fireBullet = (x: number, y: number, a: number, isClone = false) => {
                let dmg = 20; if (isClone) dmg *= 0.5;
                if (unlockedAbilities.has('GIANT')) dmg *= 1.5; if (unlockedAbilities.has('SNIPER')) dmg *= 3;
                if (unlockedAbilities.has('RAGE')) dmg *= (1 + (1 - player.hp/stats.maxHp));
                if (unlockedAbilities.has('TITAN')) dmg *= 1.5; // TITAN SLAYER
                if (unlockedAbilities.has('EXECUTE') && (currentBoss.hp/currentBoss.maxHp) < 0.3) dmg *= 2;
                
                let isCrit = false; if (unlockedAbilities.has('CRIT') && Math.random() < 0.15) { dmg *= 3; isCrit = true; }
                if (isCrit && unlockedAbilities.has('ALCHEMY')) setStats(prev => ({ ...prev, currency: prev.currency + 1 }));
                if (unlockedAbilities.has('GATLING')) a += (Math.random()-0.5)*0.5;

                current.bullets.push({ x: x + Math.cos(a) * 15, y: y + Math.sin(a) * 15, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, col: isClone?'#a29bfe':'#38b7ff', size: unlockedAbilities.has('GIANT')?8:4, angle: a, pierce: unlockedAbilities.has('PIERCE')?1:0, bounce: unlockedAbilities.has('BOUNCE')?1:0, damage: dmg });
            };
            fireBullet(player.x, player.y, angle);
            if (unlockedAbilities.has('SPREAD')) { fireBullet(player.x, player.y, angle - 0.15); fireBullet(player.x, player.y, angle + 0.15); }
            if (unlockedAbilities.has('SHOTGUN')) { fireBullet(player.x, player.y, angle - 0.3); fireBullet(player.x, player.y, angle + 0.3); fireBullet(player.x, player.y, angle - 0.45); fireBullet(player.x, player.y, angle + 0.45); }
            if (unlockedAbilities.has('REAR_SHOT')) fireBullet(player.x, player.y, angle + Math.PI);
            if (unlockedAbilities.has('SIDE_SHOT')) { fireBullet(player.x, player.y, angle + Math.PI/2); fireBullet(player.x, player.y, angle - Math.PI/2); }
            if (unlockedAbilities.has('CLONE')) setTimeout(() => fireBullet(player.x, player.y, angle, true), 100);
        }

        if (player.turretActive && player.fireTimer % 10 === 0) {
            const dx = currentBoss.x - player.turretActive.x; const dy = currentBoss.y - player.turretActive.y; const a = Math.atan2(dy, dx);
            current.bullets.push({ x: player.turretActive.x, y: player.turretActive.y, vx: Math.cos(a)*15, vy: Math.sin(a)*15, col: '#fab1a0', size: 4, damage: 10 });
            if (unlockedAbilities.has('DBL_TURRET')) current.bullets.push({ x: player.turretActive.x, y: player.turretActive.y, vx: Math.cos(a+0.2)*15, vy: Math.sin(a+0.2)*15, col: '#fab1a0', size: 4, damage: 10 });
        }

        current.bullets.forEach((b, i) => {
            if (unlockedAbilities.has('WAVE')) { b.x += Math.cos(b.angle! + Math.PI/2) * Math.sin(b.x * 0.1) * 2; b.y += Math.sin(b.angle! + Math.PI/2) * Math.sin(b.y * 0.1) * 2; }
            b.x += b.vx; b.y += b.vy;
            if (b.bounce && b.bounce > 0) { if (b.x <= 0 || b.x >= GAME_WIDTH) { b.vx *= -1; b.bounce--; } if (b.y <= 0 || b.y >= GAME_HEIGHT) { b.vy *= -1; b.bounce--; } }
            if (unlockedAbilities.has('NULL')) { current.bossBullets.forEach(bb => { if (bb.y > -50 && Math.sqrt((b.x-bb.x)**2 + (b.y-bb.y)**2) < 20) bb.y = -999; }); }
        });
        current.bullets = current.bullets.filter(b => b.y > -50 && b.y < GAME_HEIGHT + 50 && b.x > -50 && b.x < GAME_WIDTH + 50);
        
        currentBoss.timer++; currentBoss.phaseTimer++;
        const behavior = BOSS_BEHAVIORS[currentBoss.id] || GENERIC_AI;
        if (behavior) behavior(currentBoss, player, currentBoss.timer, current);

        current.bossBullets.forEach(b => {
            const speedMod = engine.current.timeScale;
            if (b.special !== 'beam') { b.x += b.vx * speedMod; b.y += b.vy * speedMod; }
            if (b.gravity) b.vy += b.gravity * speedMod;
        });
        current.bossBullets = current.bossBullets.filter(b => b.y > -50 && b.y < GAME_HEIGHT + 50 && b.x > -50 && b.x < GAME_WIDTH + 50);

        current.bullets.forEach((b, i) => {
            const dx = b.x - currentBoss.x; const dy = b.y - currentBoss.y;
            if (Math.sqrt(dx*dx + dy*dy) < 60) {
                let finalDmg = (b.damage || 20);
                if (unlockedAbilities.has('GROWTH')) finalDmg *= (b.size! / 4);
                currentBoss.hp -= finalDmg;
                if (unlockedAbilities.has('POISON')) currentBoss.hp -= 2;
                if (unlockedAbilities.has('VAMPIRE')) { if (Math.random() < 0.05 && player.hp < stats.maxHp) { player.hp += 1; setPlayerHpPercent((player.hp / stats.maxHp) * 100); } }
                setBossHpPercent((currentBoss.hp / currentBoss.maxHp) * 100);
                if (!b.pierce || b.pierce <= 0) current.bullets[i].y = -9999; else if (b.pierce) b.pierce--;
                createParticles(b.x, b.y, "#fff", 3);
            }
        });

        if (currentBoss.hp <= 0) {
            DEFEATED_BOSSES.add(currentBoss.id);
            let currencyGain = 200;
            if (unlockedAbilities.has('MAGNET')) currencyGain = 300;
            setStats(prev => ({ ...prev, currency: prev.currency + currencyGain }));
            if (unlockedAbilities.has('LEECH')) { engine.current.player.hp = stats.maxHp; setPlayerHpPercent(100); }

            if (currentBoss.id === 49) {
                setGameState('ENDING');
            } else {
                setCurrentReward(BOSS_DATABASE[currentBoss.id].reward);
                setGameState('REWARD');
            }
        }

        if (player.iframe > 0) player.iframe--;
        else if (!player.shieldActive) {
            let hit = false;
            current.bossBullets.forEach(b => {
                if (Math.sqrt((b.x - player.x)**2 + (b.y - player.y)**2) < (b.size || 5) + 10) hit = true;
            });
            if (Math.sqrt((currentBoss.x - player.x)**2 + (currentBoss.y - player.y)**2) < 60) { hit = true; if (unlockedAbilities.has('THORNS')) currentBoss.hp -= 50; }
            if (hit && unlockedAbilities.has('LUCK') && Math.random() < 0.1) { hit = false; createParticles(player.x, player.y, "#ffff00", 5); }
            if (hit) {
                player.hp -= 4; player.iframe = unlockedAbilities.has('GHOST') ? 60 : 30;
                setPlayerHpPercent((player.hp / stats.maxHp) * 100); createParticles(player.x, player.y, "red", 10);
                if (unlockedAbilities.has('REACTIVE')) currentBoss.hp -= 50;
            }
        }

        if (player.hp <= 0) {
            if (unlockedAbilities.has('REVIVE') && !engine.current.hasRevived) {
                engine.current.hasRevived = true; player.hp = stats.maxHp / 2; setPlayerHpPercent((player.hp / stats.maxHp) * 100); createParticles(player.x, player.y, "#00ff00", 50); alert("PHOENIX PROTOCOL ENGAGED.");
            } else {
                setGameState('MENU'); alert("SYSTEM FAILURE.");
            }
        }
    };

    // Drawing
    const draw = () => {
        const cvs = canvasRef.current; if (!cvs) return; const ctx = cvs.getContext('2d'); if (!ctx) return;
        
        // Background for all states
        ctx.fillStyle = "#05050a"; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        if (gameState !== 'INTRO' && gameState !== 'ENDING' && gameState !== 'REWARD') {
            ctx.strokeStyle = "#111"; ctx.lineWidth = 1; for(let i=0; i<GAME_WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,GAME_HEIGHT); ctx.stroke(); } for(let i=0; i<GAME_HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(GAME_WIDTH,i); ctx.stroke(); }
        }
        
        // Draw Stars
        engine.current.stars.forEach(s => { ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(s.x, s.y, s.s, s.s); });

        if (gameState === 'INTRO') {
            const t = engine.current.cutsceneTimer;
            
            // Draw Central Computer Icon
            ctx.strokeStyle = "#0f0"; ctx.lineWidth = 2; 
            ctx.strokeRect(GAME_WIDTH/2 - 40, GAME_HEIGHT/2 - 30, 80, 60); // Monitor
            ctx.strokeRect(GAME_WIDTH/2 - 50, GAME_HEIGHT/2 + 30, 100, 10); // Keyboard
            ctx.fillStyle = "#0f0"; ctx.fillRect(GAME_WIDTH/2 - 30, GAME_HEIGHT/2 - 20, 60, 40); // Screen fill
            
            // Draw bosses streaming in
            BOSS_DATABASE.forEach((boss, i) => {
                const arrivalDelay = i * 2;
                if (t > arrivalDelay) {
                    const progress = Math.min(1, (t - arrivalDelay) / 100);
                    if (progress < 1) {
                        const angle = (i / 50) * Math.PI * 2;
                        const startDist = 500;
                        const startX = GAME_WIDTH/2 + Math.cos(angle) * startDist;
                        const startY = GAME_HEIGHT/2 + Math.sin(angle) * startDist;
                        const currX = startX + (GAME_WIDTH/2 - startX) * progress;
                        const currY = startY + (GAME_HEIGHT/2 - startY) * progress;
                        const scale = 0.5 * (1 - progress); // Shrink as they enter
                        
                        // Simple check to ensure draw exists
                        if (boss.draw) {
                            boss.draw(ctx, currX, currY, t, scale, boss.color, { phase: 'IDLE' });
                        }
                    }
                }
            });
            
            // Draw particles (glitches)
            engine.current.particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
            return;
        }

        if (gameState === 'ENDING') {
            const t = engine.current.cutsceneTimer;
            
            // Draw Grid of Bosses
            const cols = 10;
            const spacingX = GAME_WIDTH / (cols + 1);
            const spacingY = GAME_HEIGHT / (6);
            
            const startExplosionTime = 60;
            const interval = 5;

            BOSS_DATABASE.forEach((boss, i) => {
                const explosionTime = startExplosionTime + i * interval;
                
                if (t < explosionTime) {
                    const x = spacingX * (1 + (i % cols));
                    const y = spacingY * (1 + Math.floor(i / cols));
                    const shake = t > 30 ? (Math.random()-0.5)*4 : 0;
                    if (boss.draw) {
                        boss.draw(ctx, x + shake, y + shake, t, 0.4, boss.color, { phase: 'IDLE' });
                    }
                }
            });

            // Draw particles (explosions)
            engine.current.particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
            return;
        }

        if (gameState === 'REWARD' && currentReward) { 
            // Reuse cutscene logic from previous implementation
            if(currentReward) {
                const t = Date.now() * 0.002; const cx = GAME_WIDTH / 2; const cy = GAME_HEIGHT / 2 - 50;
                ctx.strokeStyle = "#0f0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle = "rgba(0, 255, 0, 0.5)"; ctx.beginPath(); ctx.ellipse(cx, cy, 80, 20, t, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, 80, 20, -t, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle = "#0f0"; ctx.font = "24px 'Press Start 2P', cursive"; ctx.textAlign = "center"; ctx.fillText("ANOMALY PURGED", cx, cy - 120);
                ctx.fillStyle = "#fff"; ctx.font = "20px 'Press Start 2P', cursive"; ctx.fillText("UNLOCKED IN SHOP:", cx, cy + 100);
                ctx.fillStyle = "#ffff00"; ctx.font = "28px 'Press Start 2P', cursive"; ctx.fillText(currentReward.name, cx, cy + 140);
                ctx.fillStyle = "#ccc"; ctx.font = "12px 'Press Start 2P', cursive"; ctx.fillText(currentReward.desc, cx, cy + 170);
                if (Math.floor(Date.now() / 500) % 2 === 0) { ctx.fillStyle = "#0f0"; ctx.fillText(">> CLICK TO CONTINUE <<", cx, cy + 220); }
            }
            return; 
        }
        
        const { player, currentBoss, bullets, bossBullets, particles } = engine.current;
        particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
        
        // Player
        ctx.fillStyle = player.dashTimer > 0 ? "#fff" : "#38b7ff"; if (player.overclockActive) ctx.fillStyle = "#fab1a0";
        if (player.iframe % 4 < 2) {
            ctx.save(); ctx.translate(player.x, player.y);
            if (player.shieldActive) { ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI*2); ctx.stroke(); }
            ctx.fillRect(-10, -10, 20, 20); ctx.restore();
        }
        if (player.turretActive) { ctx.fillStyle = "#74b9ff"; ctx.fillRect(player.turretActive.x - 10, player.turretActive.y - 10, 20, 20); }
        if (engine.current.unlockedAbilities.has('ORBITALS')) { const orbSpeed = engine.current.lastTime * 0.005; for(let i=0; i<3; i++) { const oa = orbSpeed + i*(Math.PI*2/3); ctx.fillStyle = "#a29bfe"; ctx.beginPath(); ctx.arc(player.x + Math.cos(oa)*50, player.y + Math.sin(oa)*50, 5, 0, Math.PI*2); ctx.fill(); } }

        bullets.forEach(b => { ctx.fillStyle = b.col || "#38b7ff"; ctx.fillRect(b.x-2, b.y-2, b.size||4, b.size||4); });
        bossBullets.forEach(b => { ctx.fillStyle = b.col || "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.size || 6, 0, Math.PI * 2); ctx.fill(); });

        if (currentBoss && (gameState === 'PLAY' || gameState === 'DIALOGUE')) {
            const data = BOSS_DATABASE.find(b => b.id === currentBoss.id);
            if (data) { const s = 1 + Math.sin(currentBoss.timer * 0.1) * 0.05; data.draw(ctx, currentBoss.x, currentBoss.y, currentBoss.timer, s, data.color, currentBoss); }
        }
    };

    const loop = (time: number) => { engine.current.rafId = requestAnimationFrame(loop); const delta = time - engine.current.lastTime; if (delta >= 16) { engine.current.lastTime = time; update(); draw(); } };

    useEffect(() => {
        engine.current.rafId = requestAnimationFrame(loop);
        const handleKeyDown = (e: KeyboardEvent) => { engine.current.keys[e.key.toLowerCase()] = true; if (e.key === ' ' && gameState === 'DIALOGUE') advanceDialogue(); };
        const handleKeyUp = (e: KeyboardEvent) => engine.current.keys[e.key.toLowerCase()] = false;
        const handleMouseDown = () => { engine.current.mouse.down = true; if (gameState === 'DIALOGUE') advanceDialogue(); if (gameState === 'REWARD') { UNLOCKED_SHOP_ITEMS.add(currentReward!.id); setGameState('SHOP'); } };
        const handleMouseUp = () => engine.current.mouse.down = false;
        const handleMouseMove = (e: MouseEvent) => { const rect = canvasRef.current?.getBoundingClientRect(); if (rect) { engine.current.mouse.x = e.clientX - rect.left; engine.current.mouse.y = e.clientY - rect.top; } };

        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp); window.addEventListener('mousemove', handleMouseMove);
        return () => { cancelAnimationFrame(engine.current.rafId); window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('mousemove', handleMouseMove); };
    }, [gameState, dialogueIndex, currentReward]);

    const animateText = (lines: string[], setter: any, onComplete: any) => { let lineIdx = 0; let charIdx = 0; let currentText = ""; const timer = setInterval(() => { if (lineIdx >= lines.length) { clearInterval(timer); onComplete(); return; } const line = lines[lineIdx]; if (charIdx < line.length) { currentText += line[charIdx]; setter(currentText); charIdx++; } else { currentText += "\n"; setter(currentText); lineIdx++; charIdx = 0; } }, 30); };
    useEffect(() => { if (gameState === 'INTRO') { engine.current.cutsceneTimer = 0; animateText(introLines, setTerminalText, () => setShowTerminalBtn(true)); } else if (gameState === 'ENDING') { engine.current.cutsceneTimer = 0; animateText(finalLines, setEndText, () => setShowTerminalBtn(true)); } }, [gameState]);

    const isBossLocked = useCallback((id: number) => { if (id === 0) return false; if (DEFEATED_BOSSES.has(id)) return false; if (DEFEATED_BOSSES.has(id - 1)) return false; return true; }, []);

    const startGame = (bossId: number) => { 
        const bossData = BOSS_DATABASE.find(b => b.id === bossId); if (!bossData) return; 
        engine.current.currentBoss = { id: bossId, x: 400, y: 150, hp: bossData.hp, maxHp: bossData.hp, timer: 0, phase: 'INIT', phaseTimer: 0, currentPhaseIdx: 0, col: bossData.color }; 
        engine.current.player.x = 400; engine.current.player.y = 500; engine.current.player.hp = stats.maxHp; 
        engine.current.bullets = []; engine.current.bossBullets = []; engine.current.hasRevived = false; 
        setBossHpPercent(100); setPlayerHpPercent(100); setDialogueLines(bossData.dialogue || ["..."]); setDialogueIndex(0); setGameState('DIALOGUE'); 
    };
    const advanceDialogue = () => { if (dialogueIndex < dialogueLines.length - 1) { setDialogueIndex(prev => prev + 1); } else { setGameState('PLAY'); } };

    // Shop & Inventory Logic
    const buyItem = (id: string, cost: number) => {
        if (stats.currency >= cost) {
            setStats(prev => ({...prev, currency: prev.currency - cost}));
            OWNED_ITEMS.add(id);
            UNLOCKED_SHOP_ITEMS.delete(id); // Remove from "To Buy" list
            setShopRefresh(prev => prev + 1);
        }
    };

    const toggleEquip = (item: Reward) => {
        if (item.type === 'ACTIVE') {
            if (activeLoadout.includes(item.id)) {
                setActiveLoadout(prev => prev.filter(id => id !== item.id));
            } else {
                if (activeLoadout.length < 2) setActiveLoadout(prev => [...prev, item.id]);
            }
        } else {
            if (passiveLoadout === item.id) setPassiveLoadout(null);
            else setPassiveLoadout(item.id);
        }
    };

    // Filter available items for shop
    const shopItems = BOSS_DATABASE.map(b => b.reward).filter(r => UNLOCKED_SHOP_ITEMS.has(r.id) && !OWNED_ITEMS.has(r.id));
    // Filter items for inventory
    const inventoryItems = BOSS_DATABASE.map(b => b.reward).filter(r => OWNED_ITEMS.has(r.id));
    if (OWNED_ITEMS.has('DASH') && !inventoryItems.find(r => r.id === 'DASH')) inventoryItems.unshift(BOSS_DATABASE[0].reward); // Ensure dash exists

    const currentSelectionLocked = isBossLocked(BOSS_DATABASE[selectedBossIdx].id);

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden">
            <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="border-4 border-gray-700 bg-black shadow-2xl" style={{ imageRendering: 'pixelated' }} />
            
            {/* INTRO & ENDING */}
            {(gameState === 'INTRO' || gameState === 'ENDING') && ( 
                <div className="absolute inset-0 p-10 flex flex-col items-start justify-center text-green-500 z-50 pointer-events-none"> 
                    <pre className="whitespace-pre-wrap text-sm md:text-xl leading-relaxed bg-black/50 p-4" style={{fontFamily: "'Press Start 2P', cursive"}}>{gameState === 'INTRO' ? terminalText : endText}</pre> 
                    {showTerminalBtn && ( <div className="pointer-events-auto mt-8"> <button onClick={() => setGameState('MENU')} className="px-6 py-2 border-2 border-green-500 hover:bg-green-500 hover:text-black animate-pulse"> > {gameState === 'INTRO' ? 'INITIALIZE' : 'RETURN TO ROOT'} </button> </div> )} 
                </div> 
            )}

            {/* MAIN MENU */}
            {gameState === 'MENU' && ( 
                <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center p-4 md:p-8"> 
                    <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-4"> 
                        <button onClick={() => setGameState('SHOP')} className="px-4 py-2 border border-yellow-500 text-yellow-400 hover:text-white hover:bg-yellow-600 text-xs"> [BLACK MARKET] </button>
                        <button onClick={() => setGameState('INVENTORY')} className="px-4 py-2 border border-blue-500 text-blue-400 hover:text-white hover:bg-blue-600 text-xs"> [LOADOUT] </button>
                        <button onClick={() => setShowControls(true)} className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-white text-xs"> [CONTROLS] </button>
                    </div> 
                    <h1 className="text-2xl md:text-4xl text-blue-400 mb-2 text-shadow text-center">BLIGHTFUL ARCHIVES</h1> 
                    <h2 className="text-xs md:text-sm text-gray-500 mb-6">SELECT ANOMALY TO PURGE</h2> 
                    <div className="flex gap-4 md:gap-8 w-full max-w-6xl h-[60vh]"> 
                        <div className="w-1/3 overflow-y-auto pr-2 md:pr-4 border-r border-gray-800"> 
                            {BOSS_DATABASE.map((b, idx) => { const locked = isBossLocked(b.id); return ( <button key={b.id} onClick={() => setSelectedBossIdx(idx)} className={`w-full text-left p-2 md:p-4 mb-2 border ${ selectedBossIdx === idx ? 'border-blue-500 bg-blue-900/30' : 'border-gray-800 hover:bg-gray-900' } ${DEFEATED_BOSSES.has(b.id) ? 'text-green-500 line-through opacity-50' : 'text-white'}`}> <div className="flex justify-between items-center text-[10px] md:text-xs"> <span>#{b.id.toString().padStart(2,'0')} {b.name}</span> {DEFEATED_BOSSES.has(b.id) && <span className="hidden md:inline">[CLEARED]</span>} {locked && ( <span className="text-red-500 ml-2">LOCKED</span> )} </div> </button> ); })} 
                        </div> 
                        <div className="w-2/3 flex flex-col items-center border border-gray-800 p-2 md:p-4 relative overflow-hidden bg-gray-900/50"> 
                            <h2 className="text-lg md:text-2xl text-white mb-2 text-center" style={{color: BOSS_DATABASE[selectedBossIdx].color}}> {BOSS_DATABASE[selectedBossIdx].name} </h2> 
                            <p className="text-gray-400 mb-4 text-center italic text-[10px] md:text-xs">"{BOSS_DATABASE[selectedBossIdx].quote}"</p> 
                            <div className="w-full bg-gray-900 p-2 md:p-4 border border-gray-700 flex-1 min-h-0 overflow-y-auto mb-4"> 
                                <h3 className="text-blue-400 mb-2 text-xs">ARCHIVE DATA:</h3> <p className="text-[10px] text-gray-300 leading-relaxed break-words whitespace-pre-wrap">{BOSS_DATABASE[selectedBossIdx].desc}</p> 
                                <div className="mt-4 grid grid-cols-2 gap-4 text-[10px]"> <div className="text-red-400">HP: {BOSS_DATABASE[selectedBossIdx].hp}</div> <div className="text-yellow-400">TYPE: {BOSS_DATABASE[selectedBossIdx].archetype}</div> </div> 
                            </div> 
                            <button onClick={() => !currentSelectionLocked && startGame(BOSS_DATABASE[selectedBossIdx].id)} disabled={currentSelectionLocked} className={`w-full py-3 md:py-4 font-bold text-xs md:text-lg tracking-widest pixel-border transition-colors shrink-0 ${ currentSelectionLocked ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer' }`}> {currentSelectionLocked ? "LOCKED" : "INITIATE BATTLE"} </button> 
                        </div> 
                    </div> 
                </div> 
            )}

            {/* SHOP */}
            {gameState === 'SHOP' && (
                <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-8">
                    <button onClick={() => setGameState('MENU')} className="absolute top-4 right-4 text-gray-500 hover:text-white">[BACK]</button>
                    <h1 className="text-2xl text-yellow-400 mb-2 text-center">ABILITY MARKET</h1>
                    <div className="text-center mb-8 text-green-400">CURRENCY: ${stats.currency}</div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto pb-20">
                        {shopItems.length === 0 && <div className="col-span-full text-center text-gray-500 mt-20">NO DATA FRAGMENTS AVAILABLE. HUNT MORE ANOMALIES.</div>}
                        {shopItems.map(item => (
                            <div key={item.id} className="border border-gray-700 p-4 bg-gray-900 flex flex-col items-center hover:border-yellow-500 transition-colors">
                                <canvas width={64} height={64} ref={el => { if(el) renderAbilityIcon(item.id, el); }} className="mb-2 bg-black border border-gray-800" />
                                <h3 className="text-xs font-bold text-white mb-1">{item.name}</h3>
                                <span className={`text-[10px] mb-2 px-2 py-0.5 rounded ${item.type === 'ACTIVE' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>{item.type}</span>
                                <p className="text-[10px] text-gray-400 text-center mb-4 flex-1">{item.desc}</p>
                                <button 
                                    onClick={() => buyItem(item.id, item.cost)} 
                                    className={`w-full py-1 text-xs border ${stats.currency >= item.cost ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black' : 'border-gray-600 text-gray-600 cursor-not-allowed'}`}
                                >
                                    ${item.cost}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* INVENTORY / LOADOUT */}
            {gameState === 'INVENTORY' && (
                <div className="absolute inset-0 bg-black/95 z-50 flex flex-col p-8">
                    <button onClick={() => setGameState('MENU')} className="absolute top-4 right-4 text-gray-500 hover:text-white">[BACK]</button>
                    <h1 className="text-2xl text-blue-400 mb-2 text-center">SYSTEM LOADOUT</h1>
                    <p className="text-center text-gray-500 text-xs mb-8">MAX: 2 ACTIVES, 1 PASSIVE</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 overflow-y-auto pb-20">
                        {inventoryItems.map(item => {
                            const isEquipped = activeLoadout.includes(item.id) || passiveLoadout === item.id;
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => toggleEquip(item)}
                                    className={`border p-4 bg-gray-900 flex flex-col items-center cursor-pointer transition-all ${isEquipped ? 'border-green-500 bg-green-900/20' : 'border-gray-700 hover:border-white'}`}
                                >
                                    <div className="relative">
                                        <canvas width={64} height={64} ref={el => { if(el) renderAbilityIcon(item.id, el); }} className="mb-2 bg-black border border-gray-800" />
                                        {isEquipped && <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] px-1 font-bold">ON</div>}
                                    </div>
                                    <h3 className="text-xs font-bold text-white mb-1 text-center">{item.name}</h3>
                                    <span className={`text-[10px] mb-2 px-2 py-0.5 rounded ${item.type === 'ACTIVE' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>{item.type}</span>
                                    <p className="text-[10px] text-gray-400 text-center">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* HUD */}
            {gameState === 'PLAY' && ( <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10"> <div className="w-full max-w-[800px] mx-auto"> <div className="flex justify-between text-xs mb-1 font-bold text-shadow"> <span style={{color: engine.current.currentBoss?.col, textShadow: '1px 1px 0 #000'}}> {engine.current.currentBoss?.id < BOSS_DATABASE.length ? BOSS_DATABASE[engine.current.currentBoss?.id].name : "UNKNOWN"} </span> <span>{Math.ceil(bossHpPercent)}%</span> </div> <div className="w-full h-6 bg-gray-900 border-2 border-gray-600 relative"> <div className="h-full transition-all duration-200" style={{ width: `${bossHpPercent}%`, backgroundColor: engine.current.currentBoss?.col || 'red' }} /> </div> </div> <div className="w-full max-w-[400px] mx-auto"> <div className="flex justify-between text-xs mb-1 text-blue-300 font-bold text-shadow"> <span>SYSTEM INTEGRITY</span> <span>{Math.ceil(playerHpPercent)}%</span> </div> <div className="w-full h-4 bg-gray-900 border border-gray-600 relative"> <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${playerHpPercent}%` }} /> </div> </div> </div> )}
            
            {/* DIALOGUE */}
            {gameState === 'DIALOGUE' && ( <div className="absolute inset-0 z-50 flex flex-col justify-end pb-10 px-4 md:px-10 pointer-events-none"> <div className="w-full max-w-4xl mx-auto bg-black border-4 border-white p-4 md:p-6 pointer-events-auto shadow-lg relative"> <div className="absolute -top-6 left-6 bg-black border-2 border-white px-4 py-1 text-white text-xs md:text-sm"> {BOSS_DATABASE[selectedBossIdx].name} </div> <p className="text-white text-xs md:text-base leading-relaxed font-mono whitespace-pre-wrap break-words"> {dialogueLines[dialogueIndex]} </p> <div className="text-right mt-4 text-[10px] md:text-xs text-gray-400 animate-pulse"> ▼ CLICK TO CONTINUE </div> </div> </div> )}
            
            {/* CONTROLS MODAL */}
            {showControls && ( <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4"> <div className="bg-gray-900 border-2 border-white p-6 max-w-4xl w-full h-[80vh] flex flex-col relative"> <button onClick={() => setShowControls(false)} className="absolute top-4 right-4 text-red-500 hover:text-white" > [CLOSE] </button> <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2"> <button onClick={() => setControlsTab('KEYS')} className={`px-4 py-2 text-xs md:text-sm ${controlsTab === 'KEYS' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-white'}`} > KEY BINDINGS </button> <button onClick={() => setControlsTab('DB')} className={`px-4 py-2 text-xs md:text-sm ${controlsTab === 'DB' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-white'}`} > ARCHIVE DATABASE (ABILITIES) </button> </div> <div className="flex-1 overflow-y-auto pr-2"> {controlsTab === 'KEYS' ? ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300"> <div className="col-span-1 md:col-span-2 text-center text-yellow-500 border-b border-gray-800 pb-2 mb-2">BASIC MOVEMENT</div> <div className="text-right text-yellow-500">WASD / ARROWS</div> <div>Movement Navigation</div> <div className="text-right text-yellow-500">MOUSE</div> <div>Aim Cursor</div> <div className="text-right text-yellow-500">LEFT CLICK</div> <div>Primary Fire (Affected by Passives)</div> <div className="col-span-1 md:col-span-2 text-center text-green-500 border-b border-gray-800 pb-2 mb-2 mt-4">ACTIVE ABILITIES (MUST BE UNLOCKED)</div> <div className="text-right text-green-500">SHIFT / SPACE</div> <div>DASH (Invulnerability)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 0. Modifiers: Phase Shift.</span></div> <div className="text-right text-green-500">Q</div> <div>SHIELD (Protection)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 2. Modifiers: Mirror Coating.</span></div> <div className="text-right text-green-500">E</div> <div>TIME SLOW (Matrix)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 8. Modifiers: Chrono Bank.</span></div> <div className="text-right text-green-500">F</div> <div>BOMB (Screen Clear)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 11. Modifiers: Nanobot Bomb.</span></div> <div className="text-right text-green-500">R</div> <div>TELEPORT (Blink)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 20. Modifiers: Quantum Capacitor.</span></div> <div className="text-right text-green-500">T</div> <div>TURRET (Sentry)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 24.</span></div> <div className="text-right text-green-500">C</div> <div>OVERCLOCK (Buff)<br/><span className="text-[10px] text-gray-500">Unlocks at Boss 27. Modifiers: Liquid Cooling.</span></div> </div> ) : ( <div className="grid grid-cols-1 gap-4"> <p className="text-[10px] text-gray-500 mb-4">Complete list of recoverble data fragments from anomalies.</p> {BOSS_DATABASE.map((b, i) => ( <div key={b.id} className="flex border border-gray-800 p-2 items-center bg-gray-900/50"> <div className="w-12 text-center text-gray-600 text-[10px] shrink-0">#{b.id}</div> <div className="flex-1 ml-4 min-w-0"> <div className={`text-xs font-bold truncate ${b.reward.type === 'ACTIVE' ? 'text-green-400' : 'text-blue-300'}`}> {b.reward.name} <span className="text-[8px] text-gray-500 ml-2">[{b.reward.type}]</span> </div> <div className="text-[10px] text-gray-400 break-words whitespace-normal">{b.reward.desc}</div> </div> {DEFEATED_BOSSES.has(b.id) ? ( <div className="text-green-500 text-[10px] shrink-0 ml-2">[ACQUIRED]</div> ) : ( <div className="text-red-900 text-[10px] shrink-0 ml-2">[LOCKED]</div> )} </div> ))} </div> )} </div> </div> </div> )}
        </div>
    );
}
