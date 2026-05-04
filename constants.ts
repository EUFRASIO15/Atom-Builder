
import { ElementData, OrbitalDefinition, OrbitalType, Difficulty } from './types';

// Speed settings
export const SPEEDS = {
  [Difficulty.NORMAL]: 8,    
  [Difficulty.LEGENDARY]: 22 
};

// VISUAL TUNING PARAMETERS
export const VISUAL_TUNING = {
  pOrbitalSeparationFactor: 1.18, // Increase separation between P-orbitals by 18%
  labelOffsetRadius: 25, // Relative units to push labels outward
  labelLetterSpacing: 2, // px
  labelCollisionMargin: 15,
};

// MOBILE & TOUCH TUNING
export const MOBILE_TUNING = {
  touch_target_min_dp: 48,   // Minimum touch target size
  touch_hitbox_padding: 2.0, // Multiplier for invisible hitbox
  touch_grab_radius_dp: 30,  // Radius to grab
  drag_start_threshold_px: 5, // Pixel movement before drag is "official"
  smoothing_factor: 0.25,     // Lerp factor for drag (lower = smoother/laggier, higher = responsive)
  snap_radius_dp: 50,        // Distance to snap to orbital
  snap_strength: 0.3,        // How hard it pulls to the orbital center
  mobile_assist_enabled: true, // Toggle magnetic snap
  debug_show_hitboxes: false // Set to true to see touch targets
};

// NEW: STRICT QUANTUM PHYSICS TUNING
export const QUANTUM_TUNING = {
  vel_multiplier: 18.0,       // DRASTICALLY INCREASED (3x faster than previous 6.0)
  vel_min_factor: 0.5,      
  vel_max_multiplier: 8.0,   
  
  noise_scale: 0.4,          
  noise_frequency: 0.03,     // Faster vibration frequency
  
  jitter_interval_min: 30,   // Extremely fast jitter decision
  jitter_interval_max: 100,  
  jitter_magnitude_factor: 0.2, 
  jitter_decay: 0.85,        
  
  direction_change_min: 50, 
  direction_change_max: 150, 
  
  orbital_thickness_factor: 0.5, 
  min_separation_factor: 0.18,   
  
  // DEBUG FLAGS
  debug_seed: false,
  debug_show_paths: false,   
  debug_show_targets: false, 
  debug_show_zones: false    
};

// GAME BALANCE CONFIGURATION
export const GAME_BALANCE = {
  [Difficulty.NORMAL]: {
    initialLives: 3,
    maxLives: 3,
    initialTime: 85, // 80-90s
    
    // Hourglass (Time)
    timeReward: 30, 
    hourglassThreshold: 30, 
    hourglassLifeTime: 30000, 
    hourglassSpawnMin: 5000, // Reduced for more presence
    hourglassSpawnMax: 10000, 
    hourglassScale: 0.6,
    
    // Movement Tuning (Responsive)
    hourglassSpeedMinPct: 0.08, // Slightly faster to cross screen
    hourglassSpeedMaxPct: 0.12, 
    hourglassWanderAmp: 0.5,
    
    // Heart (Life)
    heartThresholdTime: 40, 
    heartThresholdLives: 1, 
    heartLifeTime: 15000, 
    heartSpawnMin: 12000, // Reduced for more presence
    heartSpawnMax: 20000, 
    heartScale: 0.75,
    heartProb: 0.25, // Increased probability
    
    // Responsive Tuning
    atomPaddingFactor: 0.06, 
    uiSafeZoneMargin: 140, 
    minAtomScale: 0.5,
    maxAtomScale: 1.0
  },
  [Difficulty.LEGENDARY]: {
    initialLives: 2,
    maxLives: 3,
    initialTime: 60, 
    
    // Hourglass (Time)
    timeReward: 30, 
    hourglassThreshold: 30,
    hourglassLifeTime: 30000, 
    hourglassSpawnMin: 7000, // Reduced
    hourglassSpawnMax: 12000, 
    hourglassScale: 0.6,
    
    // Movement Tuning
    hourglassSpeedMinPct: 0.10, 
    hourglassSpeedMaxPct: 0.15,
    hourglassWanderAmp: 0.8,
    
    // Heart (Life)
    heartThresholdTime: 40,
    heartThresholdLives: 1,
    heartLifeTime: 12000, 
    heartSpawnMin: 20000, // Reduced
    heartSpawnMax: 35000, 
    heartScale: 0.75,
    heartProb: 0.15, // Increased

    // Responsive Tuning
    atomPaddingFactor: 0.06,
    uiSafeZoneMargin: 140,
    minAtomScale: 0.5,
    maxAtomScale: 1.0
  }
};

// Ranges for Random Selection: { min: AtomicNumber, max: AtomicNumber }
export const LEVEL_RANGES = {
  [Difficulty.NORMAL]: [
    { min: 1, max: 7 },   // Level 1: H - N
    { min: 7, max: 15 },  // Level 2: N - P 
    { min: 16, max: 25 }, // Level 3: S - Mn
    { min: 26, max: 36 }  // Level 4: Fe - Kr
  ],
  [Difficulty.LEGENDARY]: [
    { min: 1, max: 5 },   
    { min: 6, max: 10 },   
    { min: 11, max: 15 },   
    { min: 16, max: 20 },  
    { min: 21, max: 25 }, 
    { min: 26, max: 30 }, 
    { min: 31, max: 36 }  
  ]
};

// CPK-inspired colors
export const ELEMENT_COLORS: Record<number, string> = {
  0: '#1e293b', // Neutron/Null
  1: '#ffffff', // H
  2: '#d9ffff', // He
  3: '#cc80ff', // Li
  4: '#c2ff00', // Be
  5: '#ffb5b5', // B
  6: '#9ca3af', // C
  7: '#3050f8', // N
  8: '#ff0d0d', // O
  9: '#90e050', // F
  10: '#b3e3f5', // Ne
  11: '#ab5cf2', // Na
  12: '#8aff00', // Mg
  13: '#bfa6a6', // Al
  14: '#f0c8a0', // Si
  15: '#ff8000', // P
  16: '#ffff30', // S
  17: '#1ff01f', // Cl
  18: '#80d1e3', // Ar
  19: '#8f40d4', // K
  20: '#3dff00', // Ca
  21: '#e6e6e6', // Sc
  22: '#bfc2c7', // Ti
  23: '#a6a6ab', // V
  24: '#8a99c7', // Cr
  25: '#9c7ac7', // Mn
  26: '#e06633', // Fe
  27: '#f090a0', // Co
  28: '#50d050', // Ni
  29: '#c88033', // Cu
  30: '#7d80b0', // Zn
  31: '#c28f8f', // Ga
  32: '#668f8f', // Ge
  33: '#bd80e3', // As
  34: '#ffa100', // Se
  35: '#a62929', // Br
  36: '#5cb8d1', // Kr
};

// UPDATED: Strictly Yellow, Green, Blue, Lila (Purple) as requested
export const ORBITAL_COLORS = {
  [OrbitalType.S]: { 
    fill: 'rgba(255, 215, 0, 0.1)', 
    stroke: '#FFD700', // Gold/Yellow
    electron: '#FFFF00' // Pure Yellow
  }, 
  [OrbitalType.P]: { 
    fill: 'rgba(0, 255, 0, 0.1)', 
    stroke: '#00FF00', // Lime
    electron: '#00FF00' // Pure Green
  }, 
  [OrbitalType.D]: { 
    fill: 'rgba(0, 191, 255, 0.1)', 
    stroke: '#00BFFF', // Deep Sky Blue
    electron: '#00BFFF' // Pure Blue
  }, 
  [OrbitalType.F]: { 
    fill: 'rgba(218, 112, 214, 0.1)', 
    stroke: '#DA70D6', // Orchid
    electron: '#E056FD' // Lila/Violet
  }, 
};

export const ORBITAL_ORDER: OrbitalDefinition[] = [
  { name: '1s', type: OrbitalType.S, n: 1, capacity: 2, startElectronIndex: 0 },
  { name: '2s', type: OrbitalType.S, n: 2, capacity: 2, startElectronIndex: 2 },
  { name: '2p', type: OrbitalType.P, n: 2, capacity: 6, startElectronIndex: 4 },
  { name: '3s', type: OrbitalType.S, n: 3, capacity: 2, startElectronIndex: 10 },
  { name: '3p', type: OrbitalType.P, n: 3, capacity: 6, startElectronIndex: 12 },
  { name: '4s', type: OrbitalType.S, n: 4, capacity: 2, startElectronIndex: 18 },
  { name: '3d', type: OrbitalType.D, n: 3, capacity: 10, startElectronIndex: 20 },
  { name: '4p', type: OrbitalType.P, n: 4, capacity: 6, startElectronIndex: 30 },
];

export const ELEMENTS: ElementData[] = [
    { number: 0, symbol: 'n', name: 'Neutron', color: ELEMENT_COLORS[0], mass: 1, discoverer: 'Chadwick', trivia: 'Partícula subatómica sin carga neta que compone el núcleo junto a los protones. Su descubrimiento fue clave para entender la fisión nuclear.' },
    { number: 1, symbol: 'H', name: 'Hidrógeno', color: ELEMENT_COLORS[1], mass: 1.008, discoverer: 'Cavendish', trivia: 'Es el elemento más ligero y abundante del universo, constituyendo cerca del 75% de la materia bariónica. Es el combustible principal de las estrellas.' },
    { number: 2, symbol: 'He', name: 'Helio', color: ELEMENT_COLORS[2], mass: 4.0026, discoverer: 'Janssen', trivia: 'Un gas noble inerte y el segundo elemento más ligero. Se descubrió en el espectro solar antes que en la Tierra y se usa en refrigeración criogénica.' },
    { number: 3, symbol: 'Li', name: 'Litio', color: ELEMENT_COLORS[3], mass: 6.94, discoverer: 'Arfwedson', trivia: 'Es el metal más ligero y el sólido menos denso. Fundamental en la fabricación de baterías recargables modernas para dispositivos electrónicos.' },
    { number: 4, symbol: 'Be', name: 'Berilio', color: ELEMENT_COLORS[4], mass: 9.0122, discoverer: 'Vauquelin', trivia: 'Un metal alcalinotérreo ligero pero fuerte y tóxico. Se usa en ventanas de rayos X y en aleaciones aeroespaciales por su rigidez.' },
    { number: 5, symbol: 'B', name: 'Boro', color: ELEMENT_COLORS[5], mass: 10.81, discoverer: 'Gay-Lussac', trivia: 'Un metaloide semiconductor vital para el crecimiento de las plantas. Se utiliza en vidrios de borosilicato resistentes al calor y en detergentes.' },
    { number: 6, symbol: 'C', name: 'Carbono', color: ELEMENT_COLORS[6], mass: 12.011, discoverer: 'Prehistoria', trivia: 'La base química de toda la vida conocida. Puede formar diamantes, la sustancia natural más dura, y grafito, una de las más blandas.' },
    { number: 7, symbol: 'N', name: 'Nitrógeno', color: ELEMENT_COLORS[7], mass: 14.007, discoverer: 'Rutherford', trivia: 'Un gas incoloro que constituye el 78% de la atmósfera terrestre. Es esencial para los aminoácidos y ácidos nucleicos en todos los seres vivos.' },
    { number: 8, symbol: 'O', name: 'Oxígeno', color: ELEMENT_COLORS[8], mass: 15.999, discoverer: 'Priestley', trivia: 'Altamente reactivo y esencial para la respiración de la mayoría de los seres vivos. Es el tercer elemento más abundante en el universo por masa.' },
    { number: 9, symbol: 'F', name: 'Flúor', color: ELEMENT_COLORS[9], mass: 18.998, discoverer: 'Moissan', trivia: 'El elemento más electronegativo y reactivo de todos. Es tan corrosivo que puede disolver vidrio y reaccionar con gases nobles.' },
    { number: 10, symbol: 'Ne', name: 'Neón', color: ELEMENT_COLORS[10], mass: 20.180, discoverer: 'Ramsay', trivia: 'Un gas noble inerte famoso por su brillo rojo-anaranjado en lámparas de descarga eléctrica. No forma compuestos químicos estables conocidos.' },
    { number: 11, symbol: 'Na', name: 'Sodio', color: ELEMENT_COLORS[11], mass: 22.990, discoverer: 'Davy', trivia: 'Un metal alcalino blando que explota al contacto con el agua. Es vital para la transmisión de impulsos nerviosos en el cuerpo humano.' },
    { number: 12, symbol: 'Mg', name: 'Magnesio', color: ELEMENT_COLORS[12], mass: 24.305, discoverer: 'Black', trivia: 'Un metal ligero esencial para la vida; es el átomo central en la molécula de clorofila, permitiendo la fotosíntesis en las plantas.' },
    { number: 13, symbol: 'Al', name: 'Aluminio', color: ELEMENT_COLORS[13], mass: 26.982, discoverer: 'Oersted', trivia: 'El metal más abundante en la corteza terrestre. Es ligero, no magnético y resistente a la corrosión, ideal para latas y aviones.' },
    { number: 14, symbol: 'Si', name: 'Silicio', color: ELEMENT_COLORS[14], mass: 28.085, discoverer: 'Berzelius', trivia: 'El segundo elemento más abundante en la corteza. Es el semiconductor principal sobre el que se construye toda la tecnología informática moderna.' },
    { number: 15, symbol: 'P', name: 'Fósforo', color: ELEMENT_COLORS[15], mass: 30.974, discoverer: 'Brand', trivia: 'Descubierto al destilar orina, brilla en la oscuridad en su forma blanca. Es fundamental para el ADN y el transporte de energía celular (ATP).' },
    { number: 16, symbol: 'S', name: 'Azufre', color: ELEMENT_COLORS[16], mass: 32.06, discoverer: 'Prehistoria', trivia: 'Un no metal amarillo conocido desde la antigüedad como "piedra de azufre". Es responsable del olor de los volcanes y los huevos podridos.' },
    { number: 17, symbol: 'Cl', name: 'Cloro', color: ELEMENT_COLORS[17], mass: 35.45, discoverer: 'Scheele', trivia: 'Un gas amarillo-verdoso tóxico usado como desinfectante. En combinación con sodio forma la sal común, esencial para la vida.' },
    { number: 18, symbol: 'Ar', name: 'Argón', color: ELEMENT_COLORS[18], mass: 39.948, discoverer: 'Ramsay', trivia: 'El gas noble más común en la Tierra, componiendo casi el 1% de la atmósfera. Se usa en bombillas y soldadura para crear atmósferas inertes.' },
    { number: 19, symbol: 'K', name: 'Potasio', color: ELEMENT_COLORS[19], mass: 39.098, discoverer: 'Davy', trivia: 'Un metal alcalino altamente reactivo, vital para la función nerviosa y cardíaca. Se encuentra abundantemente en plátanos y fertilizantes.' },
    { number: 20, symbol: 'Ca', name: 'Calcio', color: ELEMENT_COLORS[20], mass: 40.078, discoverer: 'Davy', trivia: 'El metal más abundante en el cuerpo humano. Es el componente estructural principal de huesos y dientes, y regula la contracción muscular.' },
    { number: 21, symbol: 'Sc', name: 'Escandio', color: ELEMENT_COLORS[21], mass: 44.956, discoverer: 'Nilson', trivia: 'Un elemento raro y ligero utilizado en aleaciones de aluminio para componentes aeroespaciales de alto rendimiento y bates de béisbol.' },
    { number: 22, symbol: 'Ti', name: 'Titanio', color: ELEMENT_COLORS[22], mass: 47.867, discoverer: 'Gregor', trivia: 'Famoso por ser tan fuerte como el acero pero mucho más ligero. Es biocompatible, por lo que se usa en prótesis médicas e implantes.' },
    { number: 23, symbol: 'V', name: 'Vanadio', color: ELEMENT_COLORS[23], mass: 50.942, discoverer: 'del Río', trivia: 'Un metal de transición duro que se añade al acero para aumentar su resistencia. Fue descubierto en México y nombrado por la diosa Vanadis.' },
    { number: 24, symbol: 'Cr', name: 'Cromo', color: ELEMENT_COLORS[24], mass: 51.996, discoverer: 'Vauquelin', trivia: 'Conocido por su brillo intenso y resistencia a la corrosión (cromado). Es el elemento que da a los rubíes su característico color rojo.' },
    { number: 25, symbol: 'Mn', name: 'Manganeso', color: ELEMENT_COLORS[25], mass: 54.938, discoverer: 'Gahn', trivia: 'Un metal esencial para la producción de acero y baterías. Biológicamente es vital para muchas enzimas y para la fotosíntesis en plantas.' },
    { number: 26, symbol: 'Fe', name: 'Hierro', color: ELEMENT_COLORS[26], mass: 55.845, discoverer: 'Prehistoria', trivia: 'El metal más utilizado por la humanidad y componente clave de la hemoglobina, transportando oxígeno en la sangre de los vertebrados.' },
    { number: 27, symbol: 'Co', name: 'Cobalto', color: ELEMENT_COLORS[27], mass: 58.933, discoverer: 'Brandt', trivia: 'Utilizado en superaleaciones para motores a reacción y en imanes permanentes. Su isótopo radiactivo se usa en radioterapia médica.' },
    { number: 28, symbol: 'Ni', name: 'Níquel', color: ELEMENT_COLORS[28], mass: 58.693, discoverer: 'Cronstedt', trivia: 'Un metal resistente a la corrosión usado en monedas y acero inoxidable. Se encuentra en el núcleo de la Tierra junto con el hierro.' },
    { number: 29, symbol: 'Cu', name: 'Cobre', color: ELEMENT_COLORS[29], mass: 63.546, discoverer: 'Prehistoria', trivia: 'Uno de los primeros metales usados por humanos. Es un excelente conductor de electricidad y calor, y tiene propiedades antimicrobianas.' },
    { number: 30, symbol: 'Zn', name: 'Zinc', color: ELEMENT_COLORS[30], mass: 65.38, discoverer: 'Marggraf', trivia: 'Se usa principalmente para galvanizar acero y protegerlo del óxido. Es un nutriente esencial para el sistema inmunológico humano.' },
    { number: 31, symbol: 'Ga', name: 'Galio', color: ELEMENT_COLORS[31], mass: 69.723, discoverer: 'Lecoq', trivia: 'Un metal extraño que se funde con el calor de la palma de la mano. Se usa en semiconductores y LEDs azules y violetas.' },
    { number: 32, symbol: 'Ge', name: 'Germanio', color: ELEMENT_COLORS[32], mass: 72.63, discoverer: 'Winkler', trivia: 'Un metaloide cuyas propiedades predijo Mendeléyev antes de su descubrimiento. Fue crucial en los primeros transistores electrónicos.' },
    { number: 33, symbol: 'As', name: 'Arsénico', color: ELEMENT_COLORS[33], mass: 74.922, discoverer: 'Magnus', trivia: 'Históricamente conocido como un potente veneno, aunque tiene usos modernos en la fabricación de semiconductores para electrónica.' },
    { number: 34, symbol: 'Se', name: 'Selenio', color: ELEMENT_COLORS[34], mass: 78.96, discoverer: 'Berzelius', trivia: 'Tiene propiedades fotovoltaicas y fotoconductoras, usado en fotocopiadoras. Es esencial en pequeñas cantidades para la salud celular.' },
    { number: 35, symbol: 'Br', name: 'Bromo', color: ELEMENT_COLORS[35], mass: 79.904, discoverer: 'Balard', trivia: 'Es el único no metal líquido a temperatura ambiente. Es un líquido rojo-marrón volátil y tóxico usado en retardantes de llama.' },
    { number: 36, symbol: 'Kr', name: 'Kriptón', color: ELEMENT_COLORS[36], mass: 83.798, discoverer: 'Ramsay', trivia: 'Un gas noble incoloro utilizado en iluminación fluorescente y fotografía de alta velocidad. Su nombre significa "el oculto" en griego.' },
];