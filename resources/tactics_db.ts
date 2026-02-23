import { Tactic, PlayerPosition } from '../types';

// Helper to create slots easily
// x: 0.0 (left) to 1.0 (right)
// y: 0.92 is GK line (bottom), 0.2 is FWD line (top/midfield)
const createSlot = (index: number, role: PlayerPosition, x: number, y: number) => ({ index, role, x, y });

export const TACTICS_DB: Tactic[] = [
  {
    id: '4-4-2',
    name: '4-4-2 Classic',
    category: 'Neutral',
    attackBias: 50,
    defenseBias: 50,
    pressingIntensity: 50,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92), // GK
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75), // LB
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75), // CB
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75), // CB
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75), // RB
      createSlot(5, PlayerPosition.MID, 0.15, 0.45), // LM
      createSlot(6, PlayerPosition.MID, 0.38, 0.45), // CM
      createSlot(7, PlayerPosition.MID, 0.62, 0.45), // CM
      createSlot(8, PlayerPosition.MID, 0.85, 0.45), // RM
      createSlot(9, PlayerPosition.FWD, 0.35, 0.20), // ST
      createSlot(10, PlayerPosition.FWD, 0.65, 0.20), // ST
    ]
  },
  {
    id: '4-4-2-OFF',
    name: '4-4-2 Offensive',
    category: 'Offensive',
    attackBias: 75,
    defenseBias: 35,
    pressingIntensity: 75,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.10, 0.30), // LM (Wysoko)
      createSlot(6, PlayerPosition.MID, 0.40, 0.50), // CM
      createSlot(7, PlayerPosition.MID, 0.60, 0.50), // CM
      createSlot(8, PlayerPosition.MID, 0.90, 0.30), // RM (Wysoko)
      createSlot(9, PlayerPosition.FWD, 0.40, 0.15), // ST
      createSlot(10, PlayerPosition.FWD, 0.60, 0.15), // ST
    ]
  },
  {
    id: '4-4-2-DEF',
    name: '4-4-2 Defensive',
    category: 'Defensive',
    attackBias: 30,
    defenseBias: 80,
    pressingIntensity: 40,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.15, 0.55), // LM (Cofnięty)
      createSlot(6, PlayerPosition.MID, 0.40, 0.65), // CDM
      createSlot(7, PlayerPosition.MID, 0.60, 0.65), // CDM
      createSlot(8, PlayerPosition.MID, 0.85, 0.55), // RM (Cofnięty)
      createSlot(9, PlayerPosition.FWD, 0.45, 0.30), // ST
      createSlot(10, PlayerPosition.FWD, 0.55, 0.30), // ST
    ]
  },
  {
    id: '4-4-2-DIAMOND',
    name: '4-4-2 Diamond',
    category: 'Technical',
    attackBias: 60,
    defenseBias: 55,
    pressingIntensity: 60,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.50, 0.65), // CDM
      createSlot(6, PlayerPosition.MID, 0.25, 0.45), // CM (Lewy)
      createSlot(7, PlayerPosition.MID, 0.75, 0.45), // CM (Prawy)
      createSlot(8, PlayerPosition.MID, 0.50, 0.30), // CAM
      createSlot(9, PlayerPosition.FWD, 0.35, 0.15), // ST
      createSlot(10, PlayerPosition.FWD, 0.65, 0.15), // ST
    ]
  },
  {
    id: '6-3-1',
    name: '6-3-1 Ultra Defensive',
    category: 'Park Bus',
    attackBias: 5,
    defenseBias: 95,
    pressingIntensity: 20,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.08, 0.75), // LWB
      createSlot(2, PlayerPosition.DEF, 0.25, 0.80), // CB
      createSlot(3, PlayerPosition.DEF, 0.42, 0.82), // CB
      createSlot(4, PlayerPosition.DEF, 0.58, 0.82), // CB
      createSlot(5, PlayerPosition.DEF, 0.75, 0.80), // CB
      createSlot(6, PlayerPosition.DEF, 0.92, 0.75), // RWB
      createSlot(7, PlayerPosition.MID, 0.25, 0.55), // CM
      createSlot(8, PlayerPosition.MID, 0.50, 0.60), // CDM
      createSlot(9, PlayerPosition.MID, 0.75, 0.55), // CM
      createSlot(10, PlayerPosition.FWD, 0.50, 0.30), // ST (Samotny)
    ]
  },
  {
    id: '4-2-4',
    name: '4-2-4 Brazilian',
    category: 'Ultra-Offensive',
    attackBias: 90,
    defenseBias: 10,
    pressingIntensity: 85,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.35, 0.55), // CM
      createSlot(6, PlayerPosition.MID, 0.65, 0.55), // CM
      createSlot(7, PlayerPosition.FWD, 0.10, 0.20), // LW
      createSlot(8, PlayerPosition.FWD, 0.40, 0.15), // ST
      createSlot(9, PlayerPosition.FWD, 0.60, 0.15), // ST
      createSlot(10, PlayerPosition.FWD, 0.90, 0.20), // RW
    ]
  },
  {
    id: '4-3-3',
    name: '4-3-3 Offensive',
    category: 'Offensive',
    attackBias: 75,
    defenseBias: 30,
    pressingIntensity: 80,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.5, 0.55),  // CDM
      createSlot(6, PlayerPosition.MID, 0.3, 0.45),  // CM
      createSlot(7, PlayerPosition.MID, 0.7, 0.45),  // CM
      createSlot(8, PlayerPosition.FWD, 0.15, 0.20), // LW
      createSlot(9, PlayerPosition.FWD, 0.5, 0.15),  // ST
      createSlot(10, PlayerPosition.FWD, 0.85, 0.20), // RW
    ]
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1 Wide',
    category: 'Neutral',
    attackBias: 60,
    defenseBias: 60,
    pressingIntensity: 60,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.4, 0.60),  // CDM
      createSlot(6, PlayerPosition.MID, 0.6, 0.60),  // CDM
      createSlot(7, PlayerPosition.MID, 0.15, 0.35), // LM/LW
      createSlot(8, PlayerPosition.MID, 0.5, 0.35),  // CAM
      createSlot(9, PlayerPosition.MID, 0.85, 0.35), // RM/RW
      createSlot(10, PlayerPosition.FWD, 0.5, 0.15), // ST
    ]
  },
  {
    id: '3-5-2',
    name: '3-5-2 Possession',
    category: 'Neutral',
    attackBias: 65,
    defenseBias: 45,
    pressingIntensity: 70,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.30, 0.75), // CB
      createSlot(2, PlayerPosition.DEF, 0.50, 0.75), // CB
      createSlot(3, PlayerPosition.DEF, 0.70, 0.75), // CB
      createSlot(4, PlayerPosition.MID, 0.10, 0.50), // LWB
      createSlot(5, PlayerPosition.MID, 0.35, 0.55), // CM
      createSlot(6, PlayerPosition.MID, 0.50, 0.60), // CDM
      createSlot(7, PlayerPosition.MID, 0.65, 0.55), // CM
      createSlot(8, PlayerPosition.MID, 0.90, 0.50), // RWB
      createSlot(9, PlayerPosition.FWD, 0.40, 0.20), // ST
      createSlot(10, PlayerPosition.FWD, 0.60, 0.20), // ST
    ]
  },
  {
    id: '5-3-2',
    name: '5-3-2 Fortress',
    category: 'Defensive',
    attackBias: 20,
    defenseBias: 90,
    pressingIntensity: 30,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.10, 0.65), // LWB
      createSlot(2, PlayerPosition.DEF, 0.30, 0.75), // CB
      createSlot(3, PlayerPosition.DEF, 0.50, 0.75), // CB
      createSlot(4, PlayerPosition.DEF, 0.70, 0.75), // CB
      createSlot(5, PlayerPosition.DEF, 0.90, 0.65), // RWB
      createSlot(6, PlayerPosition.MID, 0.35, 0.50), // CM
      createSlot(7, PlayerPosition.MID, 0.50, 0.50), // CM
      createSlot(8, PlayerPosition.MID, 0.65, 0.50), // CM
      createSlot(9, PlayerPosition.FWD, 0.40, 0.25), // ST
      createSlot(10, PlayerPosition.FWD, 0.60, 0.25), // ST
    ]
  },
  {
    id: '4-5-1',
    name: '4-5-1 Park Bus',
    category: 'Defensive',
    attackBias: 30,
    defenseBias: 85,
    pressingIntensity: 40,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.10, 0.50), // LM
      createSlot(6, PlayerPosition.MID, 0.30, 0.55), // CM
      createSlot(7, PlayerPosition.MID, 0.50, 0.55), // CM
      createSlot(8, PlayerPosition.MID, 0.70, 0.55), // CM
      createSlot(9, PlayerPosition.MID, 0.90, 0.50), // RM
      createSlot(10, PlayerPosition.FWD, 0.50, 0.25), // ST
    ]
  },
  {
    id: '4-1-4-1',
    name: '4-1-4-1 Control',
    category: 'Neutral',
    attackBias: 55,
    defenseBias: 55,
    pressingIntensity: 65,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.50, 0.65), // CDM
      createSlot(6, PlayerPosition.MID, 0.15, 0.45), // LM
      createSlot(7, PlayerPosition.MID, 0.38, 0.45), // CM
      createSlot(8, PlayerPosition.MID, 0.62, 0.45), // CM
      createSlot(9, PlayerPosition.MID, 0.85, 0.45), // RM
      createSlot(10, PlayerPosition.FWD, 0.50, 0.20), // ST
    ]
  },
  {
    id: '3-4-3',
    name: '3-4-3 Total',
    category: 'Offensive',
    attackBias: 85,
    defenseBias: 20,
    pressingIntensity: 90,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.25, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.50, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.75, 0.75),
      createSlot(4, PlayerPosition.MID, 0.10, 0.50), // LM
      createSlot(5, PlayerPosition.MID, 0.40, 0.50), // CM
      createSlot(6, PlayerPosition.MID, 0.60, 0.50), // CM
      createSlot(7, PlayerPosition.MID, 0.90, 0.50), // RM
      createSlot(8, PlayerPosition.FWD, 0.20, 0.20), // LW
      createSlot(9, PlayerPosition.FWD, 0.50, 0.15), // ST
      createSlot(10, PlayerPosition.FWD, 0.80, 0.20), // RW
    ]
  },
  {
    id: '5-4-1',
    name: '5-4-1 Diamond',
    category: 'Defensive',
    attackBias: 35,
    defenseBias: 80,
    pressingIntensity: 50,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.10, 0.65), // LWB
      createSlot(2, PlayerPosition.DEF, 0.30, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.50, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.70, 0.75),
      createSlot(5, PlayerPosition.DEF, 0.90, 0.65), // RWB
      createSlot(6, PlayerPosition.MID, 0.50, 0.60), // CDM
      createSlot(7, PlayerPosition.MID, 0.30, 0.50), // CM
      createSlot(8, PlayerPosition.MID, 0.70, 0.50), // CM
      createSlot(9, PlayerPosition.MID, 0.50, 0.40), // CAM
      createSlot(10, PlayerPosition.FWD, 0.50, 0.20), // ST
    ]
  },
  {
    id: '4-3-2-1',
    name: '4-3-2-1 Xmas Tree',
    category: 'Neutral',
    attackBias: 60,
    defenseBias: 50,
    pressingIntensity: 55,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.30, 0.55),
      createSlot(6, PlayerPosition.MID, 0.50, 0.55),
      createSlot(7, PlayerPosition.MID, 0.70, 0.55),
      createSlot(8, PlayerPosition.MID, 0.40, 0.35), // CAM
      createSlot(9, PlayerPosition.MID, 0.60, 0.35), // CAM
      createSlot(10, PlayerPosition.FWD, 0.50, 0.20), // ST
    ]
  },
  {
    id: '3-4-2-1',
    name: '3-4-2-1 Box Control',
    category: 'Technical',
    attackBias: 65,
    defenseBias: 40,
    pressingIntensity: 70,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.25, 0.75), // CB
      createSlot(2, PlayerPosition.DEF, 0.50, 0.78), // CB
      createSlot(3, PlayerPosition.DEF, 0.75, 0.75), // CB
      createSlot(4, PlayerPosition.MID, 0.10, 0.50), // LWB
      createSlot(5, PlayerPosition.MID, 0.38, 0.55), // CM
      createSlot(6, PlayerPosition.MID, 0.62, 0.55), // CM
      createSlot(7, PlayerPosition.MID, 0.90, 0.50), // RWB
      createSlot(8, PlayerPosition.MID, 0.38, 0.35), // CAM
      createSlot(9, PlayerPosition.MID, 0.62, 0.35), // CAM
      createSlot(10, PlayerPosition.FWD, 0.50, 0.15), // ST
    ]
  },
  {
    id: '4-3-3-F9',
    name: '4-3-3 False Nine',
    category: 'Possession',
    attackBias: 80,
    defenseBias: 35,
    pressingIntensity: 75,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.15, 0.75),
      createSlot(2, PlayerPosition.DEF, 0.38, 0.75),
      createSlot(3, PlayerPosition.DEF, 0.62, 0.75),
      createSlot(4, PlayerPosition.DEF, 0.85, 0.75),
      createSlot(5, PlayerPosition.MID, 0.50, 0.65), // CDM
      createSlot(6, PlayerPosition.MID, 0.30, 0.45), // CM
      createSlot(7, PlayerPosition.MID, 0.70, 0.45), // CM
      createSlot(8, PlayerPosition.FWD, 0.15, 0.25), // LW
      createSlot(9, PlayerPosition.FWD, 0.50, 0.35), // CF (False Nine)
      createSlot(10, PlayerPosition.FWD, 0.85, 0.25), // RW
    ]
  },
  {
    id: '5-2-1-2',
    name: '5-2-1-2 Vertical Counter',
    category: 'Counter',
    attackBias: 45,
    defenseBias: 85,
    pressingIntensity: 45,
    slots: [
      createSlot(0, PlayerPosition.GK, 0.5, 0.92),
      createSlot(1, PlayerPosition.DEF, 0.10, 0.72), // LWB
      createSlot(2, PlayerPosition.DEF, 0.30, 0.78), // CB
      createSlot(3, PlayerPosition.DEF, 0.50, 0.82), // CB
      createSlot(4, PlayerPosition.DEF, 0.70, 0.78), // CB
      createSlot(5, PlayerPosition.DEF, 0.90, 0.72), // RWB
      createSlot(6, PlayerPosition.MID, 0.40, 0.55), // CM
      createSlot(7, PlayerPosition.MID, 0.60, 0.55), // CM
      createSlot(8, PlayerPosition.MID, 0.50, 0.35), // CAM
      createSlot(9, PlayerPosition.FWD, 0.38, 0.18), // ST
      createSlot(10, PlayerPosition.FWD, 0.62, 0.18), // ST
    ]
  }
];

export const TacticRepository = {
  getAll: () => TACTICS_DB,
  getById: (id: string) => TACTICS_DB.find(t => t.id === id) || TACTICS_DB[0],
  getDefault: () => TACTICS_DB[0] // 4-4-2
};