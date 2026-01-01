
import { Boss } from './types';

// Helper for art
const ART = {
    drawPoly: (c: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number, angle: number, fill: string | null, stroke: string | null) => {
        c.save(); c.translate(x, y); c.rotate(angle);
        c.beginPath();
        for(let i=0; i<sides; i++){
            let a = i * (Math.PI*2/sides);
            c.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        c.closePath();
        if(fill) { c.fillStyle = fill; c.fill(); }
        if(stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
        c.restore();
    },
    drawStar: (c: CanvasRenderingContext2D, x: number, y: number, r1: number, r2: number, points: number, angle: number, fill: string | null, stroke: string | null) => {
        c.save(); c.translate(x, y); c.rotate(angle);
        c.beginPath();
        for(let i=0; i<points*2; i++){
            let r = i % 2 === 0 ? r1 : r2;
            let a = i * (Math.PI/points);
            c.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        c.closePath();
        if(fill) { c.fillStyle = fill; c.fill(); }
        if(stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
        c.restore();
    }
};

// Helper to generate generic icons based on type
const Icons = {
    Active: (c: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) => {
        c.fillStyle = color; c.beginPath(); c.arc(x+w/2, y+w/2, w/3, 0, Math.PI*2); c.fill();
        c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke();
    },
    Passive: (c: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) => {
        c.fillStyle = color; c.fillRect(x+w/4, y+w/4, w/2, w/2);
        c.strokeStyle = "#fff"; c.lineWidth = 2; c.strokeRect(x+w/4, y+w/4, w/2, w/2);
    }
};

const REWARDS_LIST = [
    { name: "PHANTOM DASH", desc: "Press SPACE/SHIFT to dash. Grants invulnerability.", type: 'ACTIVE', id: 'DASH', cost: 0, 
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#38b7ff"); c.fillStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.3, y+w*0.5); c.lineTo(x+w*0.7, y+w*0.5); c.lineTo(x+w*0.6, y+w*0.3); c.fill(); } },
    { name: "RAPID FIRE", desc: "Passively increases fire rate.", type: 'PASSIVE', id: 'RAPID_FIRE', cost: 200,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e74c3c"); c.fillStyle="#fff"; c.fillRect(x+w*0.4, y+w*0.3, w*0.2, w*0.4); } },
    { name: "ENERGY SHIELD", desc: "Press Q for temporary shield.", type: 'ACTIVE', id: 'SHIELD', cost: 300,
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#00ffff"); c.strokeStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.25, 0, Math.PI*2); c.stroke(); } },
    { name: "VECTOR SPREAD", desc: "Fires 3 bullets in a spread.", type: 'PASSIVE', id: 'SPREAD', cost: 400,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#f1c40f"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/4, 2, 0, Math.PI*2); c.arc(x+w/3, y+w*0.75, 2, 0, Math.PI*2); c.arc(x+w*0.66, y+w*0.75, 2, 0, Math.PI*2); c.fill(); } },
    { name: "GROWTH PROTOCOL", desc: "Bullets grow larger over distance.", type: 'PASSIVE', id: 'GROWTH', cost: 450,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2ecc71"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w*0.3, y+w*0.5, 2, 0, Math.PI*2); c.arc(x+w*0.7, y+w*0.5, 6, 0, Math.PI*2); c.fill(); } },
    { name: "PIERCING ROUNDS", desc: "Bullets pierce through enemies.", type: 'PASSIVE', id: 'PIERCE', cost: 500,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e67e22"); c.strokeStyle="#fff"; c.lineWidth=2; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.5); c.lineTo(x+w*0.8, y+w*0.5); c.stroke(); } },
    { name: "BOUNCE MECHANISM", desc: "Bullets bounce off walls once.", type: 'PASSIVE', id: 'BOUNCE', cost: 350,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#9b59b6"); c.strokeStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.2); c.lineTo(x+w*0.5, y+w*0.8); c.lineTo(x+w*0.8, y+w*0.4); c.stroke(); } },
    { name: "VAMPIRE CORE", desc: "Chance to heal 1 HP on hit.", type: 'PASSIVE', id: 'VAMPIRE', cost: 600,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#c0392b"); c.fillStyle="#fff"; c.fillText("+", x+w*0.4, y+w*0.6); } },
    { name: "CHRONO DILATION", desc: "Press E to slow time.", type: 'ACTIVE', id: 'TIME_SLOW', cost: 800,
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#f39c12"); c.strokeStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.2, 0, Math.PI*2); c.moveTo(x+w/2, y+w/2); c.lineTo(x+w/2, y+w*0.3); c.stroke(); } },
    { name: "REAR GUARD", desc: "Fire backwards automatically.", type: 'PASSIVE', id: 'REAR_SHOT', cost: 400,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#7f8c8d"); c.fillStyle="#fff"; c.fillRect(x+w*0.45, y+w*0.6, w*0.1, w*0.2); } },
    { name: "FLANK MODULE", desc: "Fire to the sides automatically.", type: 'PASSIVE', id: 'SIDE_SHOT', cost: 450,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#7f8c8d"); c.fillStyle="#fff"; c.fillRect(x+w*0.2, y+w*0.45, w*0.2, w*0.1); c.fillRect(x+w*0.6, y+w*0.45, w*0.2, w*0.1); } },
    { name: "ORBITAL BITS", desc: "Orbs orbit you dealing damage.", type: 'PASSIVE', id: 'ORBITALS', cost: 700,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#3498db"); c.strokeStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.25, 0, Math.PI*2); c.stroke(); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2 + w*0.25, y+w/2, 3, 0, Math.PI*2); c.fill(); } },
    { name: "DATA BOMB", desc: "Press F to clear enemy bullets.", type: 'ACTIVE', id: 'BOMB', cost: 1000,
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#e74c3c"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.15, 0, Math.PI*2); c.fill(); } },
    { name: "GHOST SHELL", desc: "Longer invulnerability after hit.", type: 'PASSIVE', id: 'GHOST', cost: 500,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#bdc3c7"); c.globalAlpha=0.5; c.fillStyle="#fff"; c.fillRect(x+w*0.3, y+w*0.3, w*0.4, w*0.4); c.globalAlpha=1; } },
    { name: "VELOCITY DRIVE", desc: "Bullets travel much faster.", type: 'PASSIVE', id: 'VELOCITY', cost: 300,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2ecc71"); c.fillStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.5); c.lineTo(x+w*0.5, y+w*0.3); c.lineTo(x+w*0.5, y+w*0.7); c.fill(); c.beginPath(); c.moveTo(x+w*0.5, y+w*0.5); c.lineTo(x+w*0.8, y+w*0.3); c.lineTo(x+w*0.8, y+w*0.7); c.fill(); } },
    { name: "CLUSTER MUNITIONS", desc: "Bullets split on hit.", type: 'PASSIVE', id: 'CLUSTER', cost: 600,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e67e22"); c.fillStyle="#fff"; c.fillRect(x+w*0.45, y+w*0.2, w*0.1, w*0.3); c.fillRect(x+w*0.3, y+w*0.6, w*0.1, w*0.2); c.fillRect(x+w*0.6, y+w*0.6, w*0.1, w*0.2); } },
    { name: "AUTO-REPAIR", desc: "Slowly regenerates HP.", type: 'PASSIVE', id: 'REGEN', cost: 800,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#27ae60"); c.fillStyle="#fff"; c.fillRect(x+w*0.4, y+w*0.2, w*0.2, w*0.6); c.fillRect(x+w*0.2, y+w*0.4, w*0.6, w*0.2); } },
    { name: "THORNS BUFFER", desc: "Contact damage to enemies.", type: 'PASSIVE', id: 'THORNS', cost: 400,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#8e44ad"); c.strokeStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.5); c.lineTo(x+w*0.5, y+w*0.2); c.lineTo(x+w*0.8, y+w*0.5); c.lineTo(x+w*0.5, y+w*0.8); c.closePath(); c.stroke(); } },
    { name: "CRYO DRIVER", desc: "Chance to slow enemies.", type: 'PASSIVE', id: 'FREEZE', cost: 500,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#74b9ff"); c.fillStyle="#fff"; c.fillRect(x+w*0.4, y+w*0.2, w*0.2, w*0.6); c.fillRect(x+w*0.2, y+w*0.4, w*0.6, w*0.2); } },
    { name: "CORROSIVE DATA", desc: "Damage over time on hit.", type: 'PASSIVE', id: 'POISON', cost: 550,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2ecc71"); c.fillStyle="#000"; c.fillText("☠", x+w*0.3, y+w*0.7); } },
    { name: "BLINK SHIFT", desc: "Press R to teleport.", type: 'ACTIVE', id: 'TELEPORT', cost: 900,
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#8e44ad"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w*0.3, y+w*0.5, 3, 0, Math.PI*2); c.arc(x+w*0.7, y+w*0.5, 3, 0, Math.PI*2); c.fill(); } },
    { name: "ARC LIGHTNING", desc: "Bullets arc lightning.", type: 'PASSIVE', id: 'SHOCK', cost: 650,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#f1c40f"); c.strokeStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.5, y+w*0.2); c.lineTo(x+w*0.3, y+w*0.5); c.lineTo(x+w*0.7, y+w*0.5); c.lineTo(x+w*0.5, y+w*0.8); c.stroke(); } },
    { name: "EXECUTIONER", desc: "Double damage to low HP.", type: 'PASSIVE', id: 'EXECUTE', cost: 700,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#c0392b"); c.strokeStyle="#fff"; c.lineWidth=3; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.2); c.lineTo(x+w*0.8, y+w*0.8); c.moveTo(x+w*0.8, y+w*0.2); c.lineTo(x+w*0.2, y+w*0.8); c.stroke(); } },
    { name: "BERSERKER", desc: "More damage at low HP.", type: 'PASSIVE', id: 'RAGE', cost: 600,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e74c3c"); c.fillStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.8); c.lineTo(x+w*0.5, y+w*0.4); c.lineTo(x+w*0.8, y+w*0.8); c.fill(); } },
    { name: "LOOT MAGNET", desc: "Increased currency gain.", type: 'PASSIVE', id: 'MAGNET', cost: 400,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#f1c40f"); c.fillStyle="#fff"; c.fillText("$", x+w*0.35, y+w*0.7); } },
    { name: "REPULSOR FIELD", desc: "Pushes enemies away.", type: 'PASSIVE', id: 'REPULSOR', cost: 500,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#34495e"); c.strokeStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.3, 0, Math.PI*2); c.stroke(); } },
    { name: "ECHO CLONE", desc: "A clone mimics your shots.", type: 'PASSIVE', id: 'CLONE', cost: 1200,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#9b59b6"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w*0.3, y+w*0.5, 4, 0, Math.PI*2); c.arc(x+w*0.7, y+w*0.5, 4, 0, Math.PI*2); c.fill(); } },
    { name: "SENTRY TURRET", desc: "Press T to deploy turret.", type: 'ACTIVE', id: 'TURRET', cost: 1100,
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#7f8c8d"); c.fillStyle="#fff"; c.fillRect(x+w*0.3, y+w*0.4, w*0.4, w*0.3); c.fillRect(x+w*0.4, y+w*0.3, w*0.2, w*0.1); } },
    { name: "SINE WAVE", desc: "Bullets move in wave pattern.", type: 'PASSIVE', id: 'WAVE', cost: 450,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#3498db"); c.strokeStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.2, y+w*0.5); c.quadraticCurveTo(x+w*0.4, y+w*0.2, x+w*0.6, y+w*0.5); c.quadraticCurveTo(x+w*0.8, y+w*0.8, x+w, y+w*0.5); c.stroke(); } },
    { name: "GIGABYTE ROUNDS", desc: "Massive bullets, more damage.", type: 'PASSIVE', id: 'GIANT', cost: 800,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2c3e50"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.3, 0, Math.PI*2); c.fill(); } },
    { name: "NOVA STRIKE", desc: "Release bullets when hit.", type: 'PASSIVE', id: 'NOVA', cost: 600,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e67e22"); c.strokeStyle="#fff"; for(let i=0;i<8;i++){ let a=i*Math.PI/4; c.moveTo(x+w/2,y+w/2); c.lineTo(x+w/2+Math.cos(a)*10, y+w/2+Math.sin(a)*10); } c.stroke(); } },
    { name: "OVERCLOCK", desc: "Press C for speed/fire rate boost.", type: 'ACTIVE', id: 'OVERCLOCK', cost: 1200,
      drawIcon: (c, x, y, w) => { Icons.Active(c, x, y, w, "#c0392b"); c.fillStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.3, y+w*0.7); c.lineTo(x+w*0.5, y+w*0.3); c.lineTo(x+w*0.7, y+w*0.7); c.fill(); } },
    { name: "MIRROR COATING", desc: "Shield reflects bullets.", type: 'PASSIVE', id: 'REFLECT', cost: 900,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#1abc9c"); c.strokeStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.3, 0, Math.PI); c.stroke(); } },
    { name: "LEECH SEED", desc: "Killing boss heals you.", type: 'PASSIVE', id: 'LEECH', cost: 1000,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2ecc71"); c.fillStyle="#fff"; c.fillText("♥", x+w*0.35, y+w*0.7); } },
    { name: "CRITICAL PROCESS", desc: "Chance to deal 3x damage.", type: 'PASSIVE', id: 'CRIT', cost: 850,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#f1c40f"); c.fillStyle="#fff"; c.fillText("!", x+w*0.4, y+w*0.7); } },
    { name: "GATLING GEAR", desc: "Massive fire rate, low accuracy.", type: 'PASSIVE', id: 'GATLING', cost: 950,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#7f8c8d"); c.fillStyle="#fff"; c.fillRect(x+w*0.3, y+w*0.3, 2, w*0.4); c.fillRect(x+w*0.5, y+w*0.3, 2, w*0.4); c.fillRect(x+w*0.7, y+w*0.3, 2, w*0.4); } },
    { name: "SHOTGUN MODULE", desc: "Spread shot, short range.", type: 'PASSIVE', id: 'SHOTGUN', cost: 750,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#95a5a6"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w*0.8, 2, 0, Math.PI*2); c.moveTo(x+w/2, y+w*0.8); c.lineTo(x+w*0.2, y+w*0.2); c.lineTo(x+w*0.8, y+w*0.2); c.fill(); } },
    { name: "SNIPER BARREL", desc: "High dmg, low rate, fast shot.", type: 'PASSIVE', id: 'SNIPER', cost: 900,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#34495e"); c.strokeStyle="#fff"; c.beginPath(); c.moveTo(x+w*0.5, y+w*0.2); c.lineTo(x+w*0.5, y+w*0.8); c.moveTo(x+w*0.2, y+w*0.5); c.lineTo(x+w*0.8, y+w*0.5); c.stroke(); } },
    { name: "BLAZE TRAIL", desc: "Dash leaves damaging fire.", type: 'PASSIVE', id: 'TRAIL', cost: 550,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e67e22"); c.fillStyle="#f39c12"; c.beginPath(); c.arc(x+w*0.3, y+w*0.7, 4, 0, Math.PI*2); c.arc(x+w*0.5, y+w*0.5, 3, 0, Math.PI*2); c.fill(); } },
    { name: "REACTIVE SHOCK", desc: "Damage boss when hit.", type: 'PASSIVE', id: 'REACTIVE', cost: 600,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#f1c40f"); c.strokeStyle="#fff"; c.lineWidth=2; c.strokeRect(x+w*0.2, y+w*0.2, w*0.6, w*0.6); c.beginPath(); c.moveTo(x,y); c.lineTo(x+w,y+w); c.stroke(); } },
    { name: "LUCKY MATRIX", desc: "Chance to ignore damage.", type: 'PASSIVE', id: 'LUCK', cost: 800,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2ecc71"); c.fillStyle="#fff"; c.fillText("?", x+w*0.4, y+w*0.7); } },
    { name: "DATA ALCHEMY", desc: "Crits give money.", type: 'PASSIVE', id: 'ALCHEMY', cost: 1500,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#f1c40f"); c.fillStyle="#fff"; c.fillText("$", x+w*0.4, y+w*0.7); } },
    { name: "STASIS FIELD", desc: "Boss moves slower.", type: 'PASSIVE', id: 'STASIS', cost: 700,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#3498db"); c.strokeStyle="#fff"; c.strokeRect(x+w*0.2, y+w*0.2, w*0.6, w*0.6); c.beginPath(); c.moveTo(x+w*0.2, y+w*0.2); c.lineTo(x+w*0.8, y+w*0.8); c.stroke(); } },
    { name: "NANOBOT BOMB", desc: "Bomb heals you.", type: 'PASSIVE', id: 'MEDIC', cost: 1100,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#27ae60"); c.fillStyle="#fff"; c.fillText("+", x+w*0.4, y+w*0.6); c.strokeStyle="#e74c3c"; c.beginPath(); c.arc(x+w*0.7, y+w*0.7, 5, 0, Math.PI*2); c.stroke(); } },
    { name: "WARP NOVA", desc: "Teleport causes explosion.", type: 'PASSIVE', id: 'WARP_STRIKE', cost: 950,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#8e44ad"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.4, 0, Math.PI*2); c.fill(); } },
    { name: "DUAL SENTRY", desc: "Turret fires two streams.", type: 'PASSIVE', id: 'DBL_TURRET', cost: 1200,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#7f8c8d"); c.fillStyle="#fff"; c.fillRect(x+w*0.2, y+w*0.4, 5, 10); c.fillRect(x+w*0.6, y+w*0.4, 5, 10); } },
    { name: "HYPER BEAM", desc: "Chance to fire laser beam.", type: 'PASSIVE', id: 'BEAM', cost: 1300,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e74c3c"); c.fillStyle="#fff"; c.fillRect(x, y+w*0.4, w, w*0.2); } },
    { name: "NULLIFIER", desc: "Bullets destroy projectiles.", type: 'PASSIVE', id: 'NULL', cost: 1400,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#2c3e50"); c.fillStyle="#fff"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.3, 0, Math.PI*2); c.fill(); c.strokeStyle="#000"; c.lineWidth=1; c.stroke(); } },
    { name: "TITAN SLAYER", desc: "Damage +50%.", type: 'PASSIVE', id: 'TITAN', cost: 2000,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#c0392b"); c.fillStyle="#fff"; c.beginPath(); c.moveTo(x+w/2, y+w*0.2); c.lineTo(x+w*0.8, y+w*0.8); c.lineTo(x+w*0.2, y+w*0.8); c.fill(); } },
    { name: "PHOENIX CORE", desc: "Revive once per run.", type: 'PASSIVE', id: 'REVIVE', cost: 2500,
      drawIcon: (c, x, y, w) => { Icons.Passive(c, x, y, w, "#e67e22"); c.fillStyle="#f1c40f"; c.beginPath(); c.arc(x+w/2, y+w/2, w*0.3, 0, Math.PI*2); c.fill(); c.strokeStyle="#c0392b"; c.stroke(); } },
    { name: "THE END", desc: "You have saved the archive.", type: 'PASSIVE', id: 'WIN', cost: 99999,
      drawIcon: (c, x, y, w) => { c.fillStyle="#fff"; c.fillText("FIN", x+w*0.2, y+w*0.6); } }
];

const ARCHETYPE_LIST = [
    "COMBAT CONSTRUCT", "LOGIC GATE", "DATA GUARDIAN", "VIRAL PREDATOR", 
    "SYSTEM ANOMALY", "NETWORK SPECTRE", "SECURITY GOLEM", "CODE TITAN"
];

export const BOSS_DATABASE: Boss[] = [
    // Boss 0 is special (intro boss)
    { id: 0, name: "JADE PYRAMID", archetype: "POLYGONAL SENTINEL", color: "#2ecc71", hp: 6000, desc: "A monolith of ancient emerald code.", quote: "Triangulating your deletion.", dialogue: ["Unidentified user detected.", "Triangulation algorithms active.", "Prepare for immediate purging."], 
      reward: REWARDS_LIST[0] as any, // Dash is usually free/first
      draw: (c,x,y,t,s,col,state) => { let pulse = state && state.phase === 'BEAM' ? Math.sin(t*0.2)*10 : 0; for(let i=3; i>0; i--) { let sz = (i*25 + pulse)*s; let a = t*0.02*i; ART.drawPoly(c, x, y, sz, 3, a, i===1?col:null, "#fff"); } if(state && state.phase === 'BEAM' && state.timer > 60) { c.fillStyle = "rgba(255,255,255,0.3)"; c.fillRect(x-20, y, 40, 600); } } },
    // 1-3
    { id: 1, name: "INFERNO CORE", archetype: "THERMAL OVERLORD", color: "#e67e22", hp: 8000, desc: "The molten heart of the main server.", quote: "Everything burns in the firewall.", dialogue: ["Temperature rising.", "My firewall burns all intruders.", "You will be ash."], 
      reward: REWARDS_LIST[1] as any,
      draw: (c,x,y,t,s,col,state) => { let corePulse = Math.sin(t*0.1) * 5; ART.drawPoly(c, x, y, (40 + corePulse)*s, 8, t*0.05, col, "#fff"); let orbCount = state && state.phase === 'ORBITAL' ? 6 : 4; let orbDist = state && state.phase === 'ORBITAL' ? (80 + Math.sin(t*0.1)*30) : 60; for(let i=0; i<orbCount; i++) { let a = t*0.08 + (i*Math.PI*2/orbCount); ART.drawPoly(c, x+Math.cos(a)*orbDist*s, y+Math.sin(a)*orbDist*s, 15*s, 4, -a*2, col, "#fff"); } if(state && state.phase === 'FLARE') { c.strokeStyle = "rgba(255, 100, 0, 0.5)"; c.beginPath(); c.arc(x, y, 100 * Math.abs(Math.sin(t*0.2)), 0, Math.PI*2); c.stroke(); } } },
    { id: 2, name: "CORAL CHANDELIER", archetype: "PRISMATIC HIVE", color: "#ff7675", hp: 10000, desc: "An aquatic array of hanging lasers.", quote: "Beauty is a sharp refraction.", dialogue: ["The light is beautiful here.", "But it cuts deep.", "Shatter into fragments."], 
      reward: REWARDS_LIST[2] as any,
      draw: (c,x,y,t,s,col,state) => { c.fillStyle = col; c.fillRect(x-50*s, y-60*s, 100*s, 10*s); for(let i=0; i<5; i++) { let h = 40 + Math.sin(t*0.05+i)*20; if (state && state.phase === 'PRISM' && i === state.activeLaser) { c.shadowBlur = 15; c.shadowColor = "#fff"; } c.fillStyle = col; c.fillRect(x-45*s+i*20*s, y-50*s, 10*s, h*s); c.fillStyle = "#fff"; c.fillRect(x-42*s+i*20*s, y-50*s+h*s, 4*s, 10*s); c.shadowBlur = 0; } } },
    { id: 3, name: "CLOCKWORK ARBITER", archetype: "CHRONO JUDGE", color: "#d4af37", hp: 13000, desc: "The keeper of the system time.", quote: "Your seconds are numbered.", dialogue: ["Tick. Tock.", "Your session has expired.", "Time waits for no user."], 
      reward: REWARDS_LIST[3] as any,
      draw: (c,x,y,t,s,col,state) => { ART.drawPoly(c, x, y, 50*s, 12, t*0.02, col, "#fff"); ART.drawPoly(c, x, y, 10*s, 4, -t*0.1, "#000", "#fff"); let angle = t * 0.05; if (state && state.phase === 'SWEEP') angle = state.handAngle; c.strokeStyle = "#fff"; c.lineWidth = 3; c.beginPath(); c.moveTo(x,y); c.lineTo(x+Math.cos(angle)*40*s, y+Math.sin(angle)*40*s); c.stroke(); if (state && state.phase === 'DILATE') { c.beginPath(); c.arc(x, y, 150, 0, Math.PI*2); c.strokeStyle = "rgba(212, 175, 55, 0.3)"; c.lineWidth = 2; c.stroke(); } } },
    { id: 4, name: "VOID SINGULARITY", archetype: "NULL POINTER", color: "#9b59b6", hp: 40000, desc: "A gravitational anomaly.", quote: "...NOTHINGNESS...", dialogue: ["...", "The void hungers.", "Collapse."], 
      reward: REWARDS_LIST[4] as any,
      draw: (c,x,y,t,s,col,state) => { let size = 40; if(state && state.phase === 'COLLAPSE') size = 40 + Math.sin(t*0.5) * 15; c.fillStyle = "#000"; c.beginPath(); c.arc(x,y, size*s, 0, Math.PI*2); c.fill(); c.strokeStyle = col; c.lineWidth = 4; for(let i=0; i<3; i++) { c.beginPath(); c.ellipse(x,y, (60+i*10)*s, (20+i*5)*s, t*0.03 + i, 0, Math.PI*2); c.stroke(); } if(state && state.phase === 'GRAVITY_WELL') { c.save(); c.strokeStyle = "rgba(155, 89, 182, 0.4)"; c.setLineDash([5, 10]); c.beginPath(); c.arc(x, y, 250, 0, Math.PI*2); c.stroke(); c.restore(); } } },
    // Auto-map rest (5-48)
    ...Array.from({length: 44}, (_, i) => {
        const id = i + 5;
        const reward = REWARDS_LIST[id] || REWARDS_LIST[0];
        const archetype = ARCHETYPE_LIST[i % ARCHETYPE_LIST.length];
        return {
            id: id,
            name: ["RUBY RAVAGER", "AZURE ARCHITECT", "TITANIUM TITAN", "GOLDEN GORGON", "VIRUS OVERSEER", "QUARTZ QUASAR", "OSMIUM OBELISK", "PLASMA PHARAOH", "RADAR REAPER", "GEAR GOD", "BINARY BUTTERFLY", "DNA DYNAMO", "COBALT CROWN", "NEBULA NEST", "TESLA TURRET", "GLITCH GOLEM", "AETHER ANCHOR", "DIGITAL RAIN", "ORBITAL RING", "PRISM PRISON", "MAGMA MASK", "SILVER SCYTHE", "HEX HORROR", "MINT MONOLITH", "PULSE PENDULUM", "ZENITH ZERO", "CRIMSON COMET", "VIOLET VORTEX", "EMERALD EYE", "SAND SNAKE", "OBSIDIAN ORB", "FLAME FAN", "GLACIER GRID", "THUNDER TRIO", "PHANTOM PAGE", "ROOT RANCOR", "QUARK QUEEN", "LASER LANTERN", "ECHO ENGINE", "BONE BYTE", "STORM SIGNAL", "PIXEL PALADIN", "GHOST GEAR", "CORRUPT COMPASS"][i],
            archetype: archetype,
            color: ["#c0392b", "#2980b9", "#7f8c8d", "#f1c40f", "#16a085", "#d1f2eb", "#5d6d7e", "#f39c12", "#2ecc71", "#8d6e63", "#ff9ff3", "#54a0ff", "#5f27cd", "#48dbfb", "#feca57", "#ff6b6b", "#1dd1a1", "#00d2d3", "#576574", "#ff9f43", "#ee5253", "#c8d6e5", "#341f97", "#10ac84", "#ff9f1c", "#ffffff", "#eb4d4b", "#686de0", "#6ab04c", "#f9ca24", "#2d3436", "#ff7979", "#7ed6df", "#f6e58d", "#dff9fb", "#535c68", "#ffbe76", "#ff9f43", "#4834d4", "#f5f6fa", "#130f40", "#badc58", "#95afc0", "#535c68"][i],
            hp: 32000 + i*1500,
            desc: "A powerful anomaly.",
            quote: "I am inevitable.",
            dialogue: ["Initializing combat.", "Execute order.", "Die."],
            reward: reward as any,
            draw: (c: CanvasRenderingContext2D, x: number, y: number, t: number, s: number, col: string, state: any) => { return; }
        }
    }),
    { id: 49, name: "FINAL FRAGMENT", archetype: "ORIGIN KERNEL", color: "#ffffff", hp: 150000, desc: "The very last piece of the archive.", quote: "Complete at last.", dialogue: ["You have reached the end.", "I am the last blight.", "Purge me if you can."], 
      reward: REWARDS_LIST[49] as any,
      draw: (c,x,y,t,s,col,state) => { for(let i=0; i<4; i++) { let a = t*0.05 + i*(Math.PI/2); c.fillStyle = `hsl(${t%360}, 100%, 50%)`; c.fillRect(x+Math.cos(a)*50-10, y+Math.sin(a)*50-10, 20, 20); } c.fillStyle = "#fff"; c.fillRect(x-20, y-20, 40, 40); if(state && state.phase==='OMEGA_BEAM') { c.fillStyle="rgba(255,255,255,0.8)"; c.fillRect(x-5, y, 10, 600); } } }
];

// Re-applying the original draw functions to the array
const drawFuncs = [
    // 5
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let pistonY = Math.sin(t*0.1)*10; if (state && state.phase === 'CRUSH') pistonY = Math.sin(state.phaseTimer*0.5)*20; ART.drawPoly(c, x-30*s, y + pistonY, 25*s, 4, t*0.05, col, "#fff"); ART.drawPoly(c, x+30*s, y - pistonY, 25*s, 4, -t*0.05, col, "#fff"); c.fillStyle = "#fff"; let headPulse = (state && state.phase === 'OVERHEAT') ? Math.sin(t*0.8)*5 : 0; c.fillRect(x-(10+headPulse/2)*s, y-40*s + Math.sin(t*0.1)*10, (20+headPulse)*s, (20+headPulse)*s); if (state && state.phase === 'OVERHEAT' && t%4<2) { c.fillStyle = "rgba(255,255,255,0.4)"; c.fillRect(x-5, y-80, 10, 20); } },
    // 6
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<5; i++) { let ox = (i-2)*30*s; let oy = Math.cos(t*0.05+i)*20*s; let sz = 20; if (state && state.phase === 'EXPANSION') sz = 20 + Math.sin(t*0.2 + i)*10; c.fillStyle = col; c.strokeRect(x+ox-sz/2, y+oy-sz/2, sz, sz); c.fillRect(x+ox-sz/4, y+oy-sz/4, sz/2, sz/2); } if (state && state.phase === 'GRID') { c.strokeStyle = "rgba(41, 128, 185, 0.2)"; c.beginPath(); for(let i=-200; i<=200; i+=40) { c.moveTo(x+i, y-200); c.lineTo(x+i, y+200); c.moveTo(x-200, y+i); c.lineTo(x+200, y+i); } c.stroke(); } },
    // 7
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let offX = 0; let offY = 0; if (state && state.phase === 'SHIELD_BASH') { offY = Math.sin(state.phaseTimer * 0.1) * 10; } c.fillStyle = col; c.fillRect(x-60*s, y-40*s + offY, 120*s, 80*s); c.strokeStyle = "#fff"; c.strokeRect(x-50*s, y-30*s + offY, 100*s, 60*s); let coreCol = (state && state.phase === 'FORTRESS') ? "#3498db" : "#333"; c.fillStyle = coreCol; c.fillRect(x-20*s, y-10*s + offY, 40*s, 20*s); if (state && state.phase === 'FORTRESS') { c.strokeStyle = "#3498db"; c.lineWidth = 4; c.strokeRect(x-70, y-50, 140, 100); } },
    // 8
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let beamPulse = (state && state.phase === 'MIDAS_RAY') ? Math.abs(Math.sin(t*0.2)) : 1; ART.drawStar(c, x, y, 50*s*beamPulse, 20*s*beamPulse, 5, t*0.02, col, "#fff"); let eyeCol = (state && state.phase === 'MIDAS_RAY') ? "#fff" : "#000"; c.fillStyle = "#fff"; c.beginPath(); c.arc(x-15*s, y, 5*s, 0, Math.PI*2); c.arc(x+15*s, y, 5*s, 0, Math.PI*2); c.fill(); c.fillStyle = eyeCol; c.beginPath(); c.arc(x-15*s, y, 2*s, 0, Math.PI*2); c.arc(x+15*s, y, 2*s, 0, Math.PI*2); c.fill(); if (state && state.phase === 'FOUNTAIN') { c.strokeStyle = "rgba(241, 196, 15, 0.4)"; c.beginPath(); c.arc(x, y, 80, 0, Math.PI*2); c.stroke(); } },
    // 9
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let glitch = (state && state.phase === 'BINARY_SCRAMBLE') ? (Math.random()-0.5)*15 : 0; ART.drawPoly(c, x + glitch, y, 40*s, 6, t*0.05, "#000", col); for(let i=0; i<6; i++) { let a = t*0.05 + i*(Math.PI/3); let dist = 45 + (state && state.phase === 'NEURAL_SPIKE' ? Math.sin(t*0.2)*10 : 0); c.fillStyle = col; c.beginPath(); c.arc(x+Math.cos(a)*dist*s + glitch, y+Math.sin(a)*dist*s, 8*s, 0, Math.PI*2); c.fill(); if (state && state.phase === 'ROOT_OVERWRITE') { c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(x + glitch, y); c.lineTo(x+Math.cos(a)*dist*s + glitch, y+Math.sin(a)*dist*s); c.stroke(); } } },
    // 10
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let pulseScale = 1; if (state && state.phase === 'SUPERNOVA') pulseScale = 1 + Math.sin(t*0.5)*0.3; ART.drawStar(c, x, y, 60*s*pulseScale, 15*s*pulseScale, 8, t*0.1, col, "#fff"); if (state && state.phase === 'PRISM_REFRACTION') { c.strokeStyle = "rgba(255,255,255,0.4)"; for(let i=0; i<3; i++) { let a = t*0.2 + i*(Math.PI*2/3); c.beginPath(); c.moveTo(x,y); c.lineTo(x+Math.cos(a)*200, y+Math.sin(a)*200); c.stroke(); } } ART.drawPoly(c, x, y, 20*s, 4, -t*0.05, "#fff", col); },
    // 11
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let shake = state && state.phase === 'QUAKE' ? (Math.random()-0.5)*10 : 0; c.fillStyle = col; c.beginPath(); c.moveTo(x-30*s+shake, y+60*s); c.lineTo(x+30*s+shake, y+60*s); c.lineTo(x+shake, y-80*s); c.fill(); c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(x-20*s+shake, y+50*s); c.lineTo(x+20*s+shake, y+50*s); c.lineTo(x+shake, y-60*s); c.stroke(); if(state && state.phase === 'EVENT_PULL') { c.strokeStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.arc(x,y, 200-((t*5)%200), 0, Math.PI*2); c.stroke(); } },
    // 12
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { ART.drawPoly(c, x, y-20*s, 40*s, 3, Math.PI, col, "#fff"); c.fillStyle = col; c.fillRect(x-40*s, y, 80*s, 40*s); c.fillStyle = "#fff"; c.fillRect(x-10*s, y+10*s, 20*s, 20*s); if(state && state.phase==='SOLAR_FLARE') { c.fillStyle="rgba(243, 156, 18, 0.3)"; c.beginPath(); c.arc(x,y-20*s, 60*s, 0, Math.PI*2); c.fill(); } },
    // 13
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(x,y, 50*s, 0, Math.PI*2); c.stroke(); let rot = state && state.phase==='SCAN_SECTOR' ? t*0.2 : t*0.08; c.beginPath(); c.moveTo(x,y); c.lineTo(x+Math.cos(rot)*50*s, y+Math.sin(rot)*50*s); c.stroke(); c.fillStyle = col; c.fillRect(x-5, y-5, 10, 10); if(state && state.phase==='LOCK_ON') { c.strokeStyle = "red"; c.strokeRect(x-60, y-60, 120, 120); } },
    // 14
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let speed = state && state.phase === 'GRIND_GEARS' ? 0.2 : 0.04; ART.drawPoly(c, x, y, 60*s, 16, t*speed, col, "#fff"); ART.drawPoly(c, x, y, 30*s, 16, -t*speed, "#333", "#fff"); ART.drawPoly(c, x, y, 10*s, 4, t*0.1, "#fff", null); if(state && state.phase === 'STEAM_VENT' && t%10<5) { c.fillStyle="rgba(255,255,255,0.5)"; c.beginPath(); c.arc(x,y,80,0,Math.PI*2); c.fill(); } },
    // 15
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let wingW = (30 + Math.sin(t*0.2)*20)*s; if(state && state.phase === 'HURRICANE_BYTE') wingW = (30 + Math.sin(t*0.8)*20)*s; c.fillStyle = col; c.strokeStyle = "#fff"; c.beginPath(); c.ellipse(x-wingW/2, y, wingW, 40*s, 0, 0, Math.PI*2); c.fill(); c.stroke(); c.beginPath(); c.ellipse(x+wingW/2, y, wingW, 40*s, 0, 0, Math.PI*2); c.fill(); c.stroke(); c.fillStyle = "#fff"; c.fillRect(x-2, y-30, 4, 60); },
    // 16
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<8; i++) { let oy = (i-4)*20*s; let ox = Math.sin(t*0.1+i)*30*s; if(state && state.phase === 'SPLIT_CELL') ox *= 2; c.fillStyle = col; c.beginPath(); c.arc(x+ox, y+oy, 8*s, 0, Math.PI*2); c.fill(); c.beginPath(); c.arc(x-ox, y+oy, 8*s, 0, Math.PI*2); c.fill(); c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(x+ox, y+oy); c.lineTo(x-ox, y+oy); c.stroke(); } },
    // 17
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.beginPath(); c.moveTo(x-50*s, y+20*s); c.lineTo(x+50*s, y+20*s); c.lineTo(x+50*s, y-30*s); c.lineTo(x+25*s, y-10*s); c.lineTo(x, y-40*s); c.lineTo(x-25*s, y-10*s); c.lineTo(x-50*s, y-30*s); c.closePath(); c.fill(); c.stroke(); if(state && state.phase==='JEWEL_STORM') { c.fillStyle="#fff"; c.beginPath(); c.arc(x,y,10,0,Math.PI*2); c.fill(); } },
    // 18
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.globalAlpha = 0.5; c.fillStyle = col; if(state && state.phase === 'BLACK_HOLE_PULL') c.fillStyle = "#000"; c.beginPath(); c.arc(x, y, 60*s, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; for(let i=0; i<12; i++) { let r = (state && state.phase==='STAR_BIRTH' ? 60*s : 40*s); let a = t*0.05 + i*(Math.PI/6); c.fillStyle = "#fff"; c.fillRect(x+Math.cos(a)*r-2, y+Math.sin(a)*r-2, 4, 4); } },
    // 19
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.fillRect(x-20*s, y-10*s, 40*s, 50*s); c.beginPath(); c.arc(x, y-20*s, 25*s, 0, Math.PI*2); c.fill(); c.stroke(); if(state && state.phase==='CHAIN_LIGHTNING') { c.strokeStyle="white"; c.beginPath(); c.arc(x,y-20*s, 40, 0, Math.PI*2); c.stroke(); } if(t%10 < 5) { c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(x, y-20*s); c.lineTo(x+Math.random()*60-30, y-80); c.stroke(); } },
    // 20
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<15; i++) { let ox = (Math.random()-0.5)*80*s; let oy = (Math.random()-0.5)*80*s; if(state && state.phase==='PIXEL_SCATTER') { ox*=1.5; oy*=1.5; } c.fillStyle = Math.random() > 0.5 ? col : "#fff"; c.fillRect(x+ox, y+oy, 10*s, 10*s); } },
    // 21
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.strokeRect(x-5, y-60, 10, 80); ART.drawPoly(c, x, y+30, 40*s, 3, Math.PI, col, "#fff"); c.beginPath(); c.arc(x, y-60, 15*s, 0, Math.PI*2); c.stroke(); if(state && state.phase==='HEAVY_DROP') { c.fillStyle="rgba(29, 209, 161, 0.4)"; c.beginPath(); c.arc(x,y+30, 60, 0, Math.PI*2); c.fill(); } },
    // 22
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y-30, 60*s, 20*s, 0, 0, Math.PI*2); c.fill(); for(let i=0; i<5; i++) { let oy = (t*5 + i*20)%60; if(state && state.phase==='FLOOD') oy = (t*15 + i*20)%100; c.fillStyle = "#fff"; c.fillRect(x-40+i*20, y-10+oy, 2, 10); } },
    // 23
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.strokeStyle = col; c.lineWidth = 10; c.beginPath(); c.ellipse(x,y, 70*s, 20*s, t*0.02, 0, Math.PI*2); c.stroke(); if(state && state.phase==='SATELLITE_SHOT') { c.fillStyle="red"; c.beginPath(); c.arc(x+60,y,5,0,Math.PI*2); c.fill(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(x,y, 15*s, 0, Math.PI*2); c.fill(); },
    // 24
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { ART.drawPoly(c, x, y, 50*s, 6, t*0.01, null, col); for(let i=0; i<6; i++) { let a = t*0.01 + i*(Math.PI/3); if(state && state.phase==='REFRACT_BEAM') c.strokeStyle="#fff"; else c.strokeStyle=col; c.beginPath(); c.moveTo(x,y); c.lineTo(x+Math.cos(a)*50*s, y+Math.sin(a)*50*s); c.stroke(); } },
    // 25
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.beginPath(); c.arc(x,y, 50*s, Math.PI, 0); c.lineTo(x+30, y+50); c.lineTo(x-30, y+50); c.closePath(); c.fill(); c.fillStyle = state && state.phase && state.phase==='ERUPTION' ? "yellow" : "#000"; c.fillRect(x-20, y-10, 10, 5); c.fillRect(x+10, y-10, 10, 5); },
    // 26
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.save(); c.translate(x,y); let r = Math.sin(t*0.1); if(state && state.phase==='REAPING_ARC') r = t*0.3; c.rotate(r); c.fillStyle = "#555"; c.fillRect(-2, -60, 4, 120); c.fillStyle = col; c.beginPath(); c.arc(0, -60, 50, 0, Math.PI); c.fill(); c.restore(); },
    // 27
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { ART.drawPoly(c, x, y, 50*s, 6, t*0.05, col, "#fff"); c.fillStyle = "#fff"; c.font = "12px monospace"; c.fillText(state && state.phase==='HEX_CURSE' ? "ERR" : "666", x-10, y+5); },
    // 28
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.fillRect(x-40*s, y-60*s, 80*s, 120*s); c.strokeStyle = state && state.phase==='FORTIFY' ? "#fff" : "#000"; c.lineWidth = 3; c.strokeRect(x-30*s, y-50*s, 60*s, 100*s); },
    // 29
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { let sw = state && state.phase==='SWING_SICKLE' ? Math.sin(t*0.15)*1.5 : Math.sin(t*0.05)*1.2; c.save(); c.translate(x, y-60); c.rotate(sw); c.fillStyle = "#888"; c.fillRect(-2, 0, 4, 100); c.fillStyle = col; c.beginPath(); c.arc(0, 100, 25, 0, Math.PI*2); c.fill(); c.stroke(); c.restore(); },
    // 30
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.strokeStyle = "#fff"; c.lineWidth = 5; if(state && state.phase==='VOID_OPEN') c.strokeStyle="#000"; c.beginPath(); c.arc(x,y, 60*s, 0, Math.PI*2); c.stroke(); ART.drawPoly(c, x, y, 30*s, 4, t*0.1, "#fff", "#000"); },
    // 31
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<5; i++) { c.fillStyle = col; c.globalAlpha = 1 - (i*0.2); c.beginPath(); c.arc(x - i*(state && state.phase==='DASH_STRIKE' ? 30 : 15)*s, y, (20-i*3)*s, 0, Math.PI*2); c.fill(); } c.globalAlpha = 1; },
    // 32
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<10; i++) { let r = i*8*s; let a = t*0.1 + i*0.5; if(state && state.phase==='SPIRAL_OUT') r *= 1.5; c.fillStyle = col; c.fillRect(x+Math.cos(a)*r, y+Math.sin(a)*r, 6, 6); } },
    // 33
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(x,y, 40*s, 0, Math.PI*2); c.fill(); c.fillStyle = col; if(state && state.phase==='LASER_GAZE') c.fillStyle = "red"; c.beginPath(); c.arc(x+Math.sin(t*0.05)*10, y, 20*s, 0, Math.PI*2); c.fill(); },
    // 34
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<8; i++) { let ox = Math.sin(t*0.1-i*0.5)*40*s; c.fillStyle = col; c.beginPath(); c.arc(x+ox, y+i*15-60, 10*s, 0, Math.PI*2); c.fill(); } if(state && state.phase==='SANDSTORM') { c.fillStyle="rgba(249, 202, 36, 0.2)"; c.beginPath(); c.arc(x,y,100,0,Math.PI*2); c.fill(); } },
    // 35
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.beginPath(); c.arc(x,y, 50*s, 0, Math.PI*2); c.fill(); c.strokeStyle = "#fff"; if(state && state.phase==='ECLIPSE') c.strokeStyle="#2d3436"; c.beginPath(); c.arc(x,y, 55*s, t*0.01, t*0.01+1); c.stroke(); },
    // 36
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<5; i++) { let a = -Math.PI/2 + (i-2)*0.5 + Math.sin(t*0.05)*0.2; c.fillStyle = col; c.beginPath(); c.moveTo(x,y); c.lineTo(x+Math.cos(a)*80*s, y+Math.sin(a)*80*s); c.lineTo(x+Math.cos(a+0.3)*80*s, y+Math.sin(a+0.3)*80*s); c.fill(); } },
    // 37
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.strokeStyle = col; for(let i=0; i<4; i++) { let sz = 80*s-i*20; if(state && state.phase==='SHATTER') sz += Math.sin(t*0.5)*10; c.strokeRect(x-sz/2, y-sz/2, sz, sz); } c.fillStyle = "#fff"; c.fillRect(x-5, y-5, 10, 10); },
    // 38
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<3; i++) { let a = (state && state.phase==='ROTATE_BEAM' ? t*0.2 : t*0.1) + i*(Math.PI*2/3); ART.drawStar(c, x+Math.cos(a)*40*s, y+Math.sin(a)*40*s, 15*s, 7*s, 4, t*0.1, col, "#fff"); } },
    // 39
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.globalAlpha = state && state.phase==='FADE_OUT' ? 0.2 : 0.6; c.fillStyle = col; c.fillRect(x-30*s, y-40*s, 60*s, 80*s); c.fillStyle = "#888"; c.fillRect(x-20, y-20, 40, 2); c.fillRect(x-20, y-10, 40, 2); c.globalAlpha = 1; },
    // 40
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.fillRect(x-10, y-40, 20, 80); for(let i=0; i<4; i++) { let a = i*Math.PI/2 + Math.sin(t*0.05); if(state && state.phase==='GROWTH') a += t*0.1; c.fillRect(x+Math.cos(a)*20, y+Math.sin(a)*20, 30, 10); } },
    // 41
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { ART.drawPoly(c, x, y-30, 25*s, 3, 0, col, "#fff"); c.beginPath(); c.arc(x,y, 20*s, 0, Math.PI*2); c.fill(); ART.drawPoly(c, x, y+30, 20*s, 4, t*0.1, col, "#fff"); if(state && state.phase==='QUANTUM_LEAP') { c.strokeStyle="#fff"; c.beginPath(); c.arc(x,y,40,0,Math.PI*2); c.stroke(); } },
    // 42
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.fillRect(x-25*s, y-30*s, 50*s, 60*s); c.fillStyle = "#fff"; c.globalAlpha = Math.random(); if(state && state.phase==='FLASHBANG') c.globalAlpha = 1; c.beginPath(); c.arc(x,y, 15*s, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; },
    // 43
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { for(let i=0; i<3; i++) { c.strokeStyle = col; c.globalAlpha = 1 - (i*0.3); let off = state && state.phase==='REPLAY_LOOP' ? Math.sin(t*0.2)*20*i : Math.sin(t*0.05)*10*i; c.strokeRect(x-40*s - off, y-40*s, 80*s, 80*s); } c.globalAlpha = 1; },
    // 44
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.fillRect(x-20, y-20, 40, 40); c.fillRect(x-40, y, 80, 5); c.fillRect(x, y-40, 5, 80); if(state && state.phase==='RIB_CAGE') { c.strokeStyle = "#fff"; c.beginPath(); c.arc(x,y, 60, 0, Math.PI*2); c.stroke(); } },
    // 45
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; ART.drawPoly(c, x, y, 50*s, 8, t*0.02, col, "#fff"); c.strokeStyle = "yellow"; if(state && state.phase==='STATIC_NOISE') c.strokeStyle="white"; c.beginPath(); c.moveTo(x,y); c.lineTo(x-20, y+40); c.lineTo(x, y+40); c.lineTo(x-10, y+80); c.stroke(); },
    // 46
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.fillStyle = col; c.fillRect(x-30, y-40, 60, 60); c.fillStyle = "#fff"; c.fillRect(x-5, y-50, 10, 80); c.fillRect(x-40, y-10, 80, 10); if(state && state.phase==='SHIELD_WALL') { c.strokeStyle="cyan"; c.lineWidth=4; c.strokeRect(x-40,y-40,80,80); } },
    // 47
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.globalAlpha = 0.5; ART.drawPoly(c, x, y, 50*s, 8, -t*0.04, col, "#fff"); c.globalAlpha = 1; c.fillStyle = "#fff"; c.beginPath(); c.arc(x,y, 10*s, 0, Math.PI*2); c.fill(); },
    // 48
    (c:any,x:any,y:any,t:any,s:any,col:any,state:any) => { c.strokeStyle = col; c.beginPath(); c.arc(x,y, 50*s, 0, Math.PI*2); c.stroke(); c.save(); c.translate(x,y); c.rotate(state && state.phase==='SPIN_NORTH' ? t*0.5 : t*0.2); c.fillStyle = "red"; c.beginPath(); c.moveTo(0, -40); c.lineTo(10, 0); c.lineTo(-10, 0); c.fill(); c.restore(); }
];

for(let i=0; i<drawFuncs.length; i++) {
    BOSS_DATABASE[i+5].draw = drawFuncs[i];
}
