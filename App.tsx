
import React, { useState, useEffect, useMemo } from 'react';
import { ELEMENTS, LEVEL_RANGES, GAME_BALANCE } from './constants';
import { GameCanvas } from './components/GameCanvas';
import { BoxDiagram } from './components/BoxDiagram';
import { getNextOrbitalForElectron } from './utils/chemistry';
import { Difficulty, GameState, ScoreEntry } from './types';

const App: React.FC = () => {
  // Game Flow State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [targetAtomicNumber, setTargetAtomicNumber] = useState(1);
  const [lives, setLives] = useState(3); 
  
  // Gameplay State
  const [electronCount, setElectronCount] = useState(0);
  const [hoveredOrbitalName, setHoveredOrbitalName] = useState<string | null>(null);
  const [showVictoryInfoPrompt, setShowVictoryInfoPrompt] = useState(false);
  
  // Scoring & Player Name
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);

  // Calculate Targets
  const targetElement = useMemo(() => {
    return ELEMENTS.find(e => e.number === targetAtomicNumber) || ELEMENTS[1];
  }, [targetAtomicNumber]);

  // Calculate Current Element based on electrons
  const currentElement = useMemo(() => {
      return ELEMENTS.find(e => e.number === electronCount) || ELEMENTS[0];
  }, [electronCount]);

  // Initialize Level
  const generateNextLevel = (levelIdx: number, diff: Difficulty) => {
    const ranges = LEVEL_RANGES[diff];
    if (!ranges || levelIdx >= ranges.length) return false;

    const range = ranges[levelIdx];
    const randomZ = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
    setTargetAtomicNumber(randomZ);
    setElectronCount(0); 
    setShowVictoryInfoPrompt(false);
    
    // INITIAL TIME from Balance Config
    const balance = GAME_BALANCE[diff];
    setTimeLeft(balance.initialTime);
    
    return true;
  };

  // Timer Countdown
  useEffect(() => {
      if (gameState !== GameState.PLAYING) return;
      
      const timer = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 0) {
                  // TIMEOUT LOGIC: Lose 1 Life
                  setLives(currentLives => {
                       const newLives = currentLives - 1;
                       if (newLives <= 0) {
                           // GAME OVER
                           setGameState(GameState.NAME_INPUT);
                           clearInterval(timer);
                           return 0;
                       } else {
                           // RESET TIMER if lives remain
                           return newLives;
                       }
                  });
                  
                  // Reset timer to initial level time if still playing
                  return GAME_BALANCE[difficulty].initialTime;
              }
              return prev - 1;
          });
      }, 1000);
      
      return () => clearInterval(timer);
  }, [gameState, difficulty]);

  // Timer start initial
  useEffect(() => {
    if (gameState === GameState.PLAYING && startTime === 0) {
        setStartTime(Date.now());
    }
  }, [gameState, startTime]);

  const nextNeededOrbital = getNextOrbitalForElectron(electronCount);

  const handleElectronCaptured = (isBonus: boolean) => {
    setElectronCount(prev => {
        const next = prev + 1;
        if (next === targetAtomicNumber) {
            // LEVEL COMPLETE
            handleLevelComplete();
        }
        return next;
    });
    // HIGHER POINTS FOR EXCITED (BONUS) ELECTRONS
    setScore(prev => prev + (isBonus ? 500 : 100)); 
  };

  const handleMistake = () => {
      setScore(prev => Math.max(0, prev - 50)); 
      // MISTAKES DO NOT COST LIVES ANYMORE
  };

  const handleTimeBonus = () => {
      const addedTime = GAME_BALANCE[difficulty].timeReward;
      setTimeLeft(prev => prev + addedTime);
  };

  const handleLifeBonus = () => {
      const max = GAME_BALANCE[difficulty].maxLives;
      setLives(prev => Math.min(prev + 1, max));
  };

  const handleLevelComplete = () => {
    const timeBonus = timeLeft * 10; // Points for remaining time
    setScore(prev => prev + timeBonus + 500);
    
    // Trigger animation immediately
    setGameState(GameState.LEVEL_COMPLETE_ANIMATION);
    
    // Wait 1.5s (0.9s zoom + 0.6s hold) before showing UI prompt
    setTimeout(() => {
        setShowVictoryInfoPrompt(true);
    }, 1500);
  };

  // Input listener for Info Screen navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        if (gameState === GameState.LEVEL_COMPLETE_ANIMATION && showVictoryInfoPrompt) {
             setGameState(GameState.LEVEL_INFO);
        } else if (gameState === GameState.LEVEL_INFO) {
             checkProgression();
        }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, showVictoryInfoPrompt]);

  const checkProgression = () => {
    const ranges = LEVEL_RANGES[difficulty];
    if (currentLevelIndex + 1 >= ranges.length) {
        // Game Complete
        setGameState(GameState.NAME_INPUT);
    } else {
        setCurrentLevelIndex(prev => prev + 1);
        generateNextLevel(currentLevelIndex + 1, difficulty);
        setStartTime(Date.now());
        setGameState(GameState.PLAYING);
    }
  };

  const submitScore = (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerName.trim() || 'Anónimo';
    setHighScores(prev => [...prev, { name, score, difficulty }].sort((a,b) => b.score - a.score).slice(0, 10));
    setGameState(GameState.GAME_OVER);
  };

  const startGame = (diff: Difficulty) => {
      setDifficulty(diff);
      // INITIAL LIVES from Balance Config
      setLives(GAME_BALANCE[diff].initialLives); 
      setScore(0);
      setCurrentLevelIndex(0);
      generateNextLevel(0, diff);
      setStartTime(Date.now());
      setGameState(GameState.PLAYING);
  };

  // --- RENDERERS ---

  // 1. MENU
  if (gameState === GameState.MENU) {
      return (
          <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                   <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full border-4 border-yellow-400 animate-float"></div>
                   <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full border-4 border-blue-400 animate-float" style={{animationDelay: '1s'}}></div>
               </div>

               <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-yellow-400 mb-12 tracking-widest text-center title-font" style={{ textShadow: '0 0 40px rgba(50, 100, 255, 0.3)' }}>
                   SCHRÖDINGER<br/><span className="text-4xl md:text-6xl">HUNTERS</span>
               </h1>

               <div className="flex gap-8 z-10">
                   <button 
                     onClick={() => startGame(Difficulty.NORMAL)}
                     className="group relative px-8 py-4 bg-slate-800 border-2 border-green-400 text-green-400 rounded-xl font-bold text-xl hover:bg-green-400 hover:text-slate-900 transition-all transform hover:scale-110 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                   >
                       NORMAL
                       <div className="text-xs mt-2 opacity-80 font-normal">4 Niveles • Velocidad Baja</div>
                   </button>
                   <button 
                     onClick={() => startGame(Difficulty.LEGENDARY)}
                     className="group relative px-8 py-4 bg-slate-800 border-2 border-purple-500 text-purple-400 rounded-xl font-bold text-xl hover:bg-purple-500 hover:text-white transition-all transform hover:scale-110 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                   >
                       LEGENDARIO
                       <div className="text-xs mt-2 opacity-80 font-normal">7 Niveles • 2 Vidas Inicio • Caos</div>
                   </button>
               </div>
          </div>
      );
  }

  // 2. NAME INPUT
  if (gameState === GameState.NAME_INPUT) {
    return (
        <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
             <h2 className="text-4xl font-bold text-yellow-400 mb-8 title-font">
                 {lives <= 0 ? "GAME OVER" : "¡JUEGO COMPLETADO!"}
             </h2>
             <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-2xl w-full max-w-md">
                <p className="text-center text-slate-300 mb-6">Puntuación Final: <span className="text-2xl text-white font-bold">{score}</span></p>
                <form onSubmit={submitScore} className="flex flex-col gap-4">
                    <label className="text-sm text-slate-400">Introduce tu nombre para la historia:</label>
                    <input 
                        type="text" 
                        maxLength={15}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="bg-slate-900 border border-slate-600 text-white p-3 rounded text-xl text-center focus:border-yellow-400 outline-none"
                        placeholder="Cazador..."
                        autoFocus
                    />
                    <button type="submit" className="bg-yellow-500 text-slate-900 font-bold py-3 rounded hover:bg-yellow-400 transition-colors mt-2">
                        REGISTRAR HAZAÑA
                    </button>
                </form>
             </div>
        </div>
    );
  }

  // 3. SCOREBOARD
  if (gameState === GameState.GAME_OVER) {
      return (
          <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
              <h2 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 title-font">SALÓN DE LA FAMA</h2>
              
              <div className="bg-slate-800/90 p-8 rounded-2xl border border-slate-600 w-full max-w-3xl shadow-2xl">
                  <div className="grid grid-cols-3 gap-4 mb-4 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-700 pb-2">
                      <div>Cazador</div>
                      <div>Dificultad</div>
                      <div className="text-right">Puntuación</div>
                  </div>
                  {highScores.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">Aún no hay leyendas registradas.</p>
                  ) : (
                      highScores.map((entry, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-4 py-3 border-b border-slate-700/30 text-lg items-center">
                            <div className="text-white font-bold flex items-center gap-2">
                                {idx === 0 && <span className="text-yellow-400">👑</span>}
                                {entry.name}
                            </div>
                            <div className={entry.difficulty === Difficulty.LEGENDARY ? 'text-purple-400 text-sm' : 'text-green-400 text-sm'}>
                                {entry.difficulty}
                            </div>
                            <div className="text-right font-mono text-yellow-400">{entry.score}</div>
                        </div>
                      ))
                  )}
              </div>

              <button 
                  onClick={() => setGameState(GameState.MENU)}
                  className="mt-12 px-10 py-4 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors border border-slate-500"
              >
                  VOLVER AL MENÚ
              </button>
          </div>
      );
  }

  // 4. GAME / INFO / VICTORY ANIMATION
  const isVictoryAnim = gameState === GameState.LEVEL_COMPLETE_ANIMATION;
  const isInfoMode = gameState === GameState.LEVEL_INFO;
  const hideOverlay = isVictoryAnim || isInfoMode;
  
  // Format Timer
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="w-screen h-screen flex flex-col relative font-sans select-none bg-slate-900 overflow-hidden">
      
      {isVictoryAnim && <div className="absolute inset-0 z-[100] pointer-events-none bg-white animate-flash"></div>}

      {/* --- TOP UI --- */}
      <div className={`absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 transition-opacity duration-500 ${hideOverlay ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* TOP LEFT: TARGET */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl text-slate-200 pointer-events-auto min-w-[240px]">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs uppercase tracking-wider text-slate-400">Objetivo</h2>
                <span className="text-xs font-mono text-slate-500">Nivel {currentLevelIndex + 1}</span>
            </div>
            <div className="flex items-center gap-4">
                <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-slate-900 shadow-inner text-2xl ring-2 ring-white/10"
                    style={{ backgroundColor: targetElement.color }}
                >
                    {targetElement.symbol}
                </div>
                <div>
                    <div className="text-2xl font-bold leading-none text-white">{targetElement.name}</div>
                    <div className="text-sm text-slate-400 font-mono">Z: {targetElement.number}</div>
                </div>
            </div>
            
            {difficulty === Difficulty.NORMAL && (
                <div className="mt-3 border-t border-slate-700 pt-2">
                    <div className="text-xs text-slate-500 mb-1 uppercase">Siguiente Orbital</div>
                    {nextNeededOrbital ? (
                        <span className={`
                            inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase border
                            ${nextNeededOrbital.type === 's' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' : ''}
                            ${nextNeededOrbital.type === 'p' ? 'bg-green-900/30 text-green-400 border-green-500/30' : ''}
                            ${nextNeededOrbital.type === 'd' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : ''}
                            ${nextNeededOrbital.type === 'f' ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : ''}
                        `}>
                            {nextNeededOrbital.name}
                        </span>
                    ) : (
                        <span className="text-green-500 text-xs">Completo</span>
                    )}
                </div>
            )}
        </div>

        {/* TOP RIGHT: CURRENT ATOM + BOX DIAGRAM */}
        <div className="flex flex-col gap-2 items-end pointer-events-auto">
            {/* Main Card */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl text-slate-200 min-w-[240px]">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xs uppercase tracking-wider text-blue-400">Átomo Actual</h2>
                    <div className="flex gap-1">
                        {/* Render Hearts up to Max Lives */}
                        {Array.from({length: GAME_BALANCE[difficulty].maxLives}).map((_, i) => (
                        <span key={i} className={`text-sm transition-all ${i < lives ? 'opacity-100 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'opacity-20 grayscale'}`}>❤️</span>
                    ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center font-black text-slate-900 shadow-inner text-2xl ring-2 ring-white/10"
                        style={{ backgroundColor: currentElement.color }}
                    >
                        {currentElement.symbol}
                    </div>
                    <div>
                        <div className="text-2xl font-bold leading-none text-white">{currentElement.name}</div>
                        <div className="text-sm text-slate-400 font-mono">{electronCount} Electrones</div>
                    </div>
                </div>
                
                {/* BOX DIAGRAM INSIDE CURRENT ATOM CONTAINER */}
                <div className="mt-4 border-t border-slate-700 pt-3">
                    <BoxDiagram electronCount={electronCount} />
                </div>
            </div>
        </div>
      </div>

      {/* CENTER HOVER LABEL */}
      <div className={`absolute left-1/2 transform -translate-x-1/2 top-8 pointer-events-none transition-opacity duration-500 ${hideOverlay ? 'opacity-0' : 'opacity-100'}`}>
            <h1 
            className={`text-7xl font-black tracking-tighter transition-all duration-200 title-font ${hoveredOrbitalName ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ 
                textShadow: '0 0 30px rgba(0,0,0,0.8)',
                color: hoveredOrbitalName && hoveredOrbitalName.includes('s') ? '#facc15' : 
                        hoveredOrbitalName && hoveredOrbitalName.includes('p') ? '#4ade80' : 
                        hoveredOrbitalName && hoveredOrbitalName.includes('d') ? '#60a5fa' : 'white'
            }}
            >
            {hoveredOrbitalName}
            </h1>
      </div>

      {/* --- BOTTOM LEFT UI: SCORE & TIMER --- */}
      <div className={`absolute bottom-4 left-4 z-10 transition-transform duration-500 ${hideOverlay ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl text-slate-200 pointer-events-auto flex items-center gap-6">
            
            {/* Score */}
            <div className="flex flex-col items-start">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Puntuación</div>
                <div className="text-yellow-400 font-mono font-bold text-4xl drop-shadow-md">{score.toLocaleString()}</div>
            </div>

            <div className="w-px h-10 bg-slate-600"></div>

            {/* Timer */}
             <div className="flex flex-col items-start">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Tiempo Restante</div>
                <div className={`font-mono font-bold text-3xl drop-shadow-md ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeString}
                </div>
            </div>

        </div>
      </div>

      {/* --- BOTTOM RIGHT UI: QUIT --- */}
      <div className={`absolute bottom-4 right-4 z-20 transition-opacity duration-500 ${hideOverlay ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         <button 
            onClick={() => setGameState(GameState.MENU)}
            className="p-4 bg-slate-800/90 hover:bg-red-900/80 border border-slate-600 hover:border-red-500 text-slate-400 hover:text-white rounded-full shadow-2xl backdrop-blur-md transition-all hover:scale-110 group"
            title="Abandonar Partida"
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
             </svg>
        </button>
      </div>

      {/* --- VICTORY OVERLAY --- */}
      {isVictoryAnim && showVictoryInfoPrompt && (
         <div 
            className="absolute inset-0 z-40 flex flex-col justify-end pb-8 cursor-pointer animate-in fade-in duration-500"
            onClick={() => setGameState(GameState.LEVEL_INFO)}
         >
             <div className="flex w-full items-end px-8">
                 {/* BOX DIAGRAM & COUNT DISPLAY FOR VICTORY SCREEN */}
                 <div className="mb-2 bg-black/60 p-6 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-start shadow-2xl max-w-[70%]">
                    <div className="transform origin-bottom-left mb-4 scale-110">
                         <BoxDiagram electronCount={currentElement.number} />
                    </div>
                    <div className="text-white font-mono text-xl font-bold bg-black/50 px-6 py-2 rounded-full border border-white/20">
                        Total Electrones: <span className="text-yellow-400 text-2xl ml-2">{currentElement.number}</span>
                    </div>
                 </div>
             </div>

             <p className="text-slate-400 text-sm uppercase tracking-widest animate-pulse opacity-70 mt-4 text-center w-full mb-4">
                 Haga clic para ver información
             </p>
         </div>
      )}

      {/* --- INFO MODAL --- */}
      {isInfoMode && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => checkProgression()}
          >
              <div 
                className="bg-slate-900 border-2 border-slate-700 p-0 rounded-2xl shadow-2xl max-w-lg w-full mx-4 relative overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()} 
              >
                  <div className="h-3 w-full" style={{ backgroundColor: currentElement.color }}></div>
                  
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-5xl font-black text-white title-font mb-1">{currentElement.name}</h2>
                            <p className="text-slate-400 text-lg flex items-center gap-2">
                                <span className="text-yellow-500">★</span> <span className="font-bold mr-1">Descubridor:</span> {currentElement.discoverer}
                            </p>
                        </div>
                        <div 
                            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black text-slate-900 shadow-2xl"
                            style={{ backgroundColor: currentElement.color, boxShadow: `0 0 30px ${currentElement.color}40` }}
                        >
                            {currentElement.symbol}
                        </div>
                    </div>
                    
                    <div className="bg-slate-800/50 p-6 rounded-xl mb-8 text-slate-200 italic leading-relaxed border-l-4 border-slate-600">
                        "{currentElement.trivia}"
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 font-mono mb-8">
                        <div className="bg-slate-800 p-3 rounded text-center">
                            <div className="text-xs uppercase mb-1">Masa Atómica</div>
                            <div className="text-white font-bold">{currentElement.mass}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded text-center">
                            <div className="text-xs uppercase mb-1">Número (Z)</div>
                            <div className="text-white font-bold">{currentElement.number}</div>
                        </div>
                    </div>

                    {/* INFO MODAL ALSO HAS IT FOR CONSISTENCY */}
                    <div className="mb-8">
                        <div className="text-center text-xs uppercase text-slate-500 mb-2 tracking-widest">Configuración Electrónica Final</div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 flex flex-col items-center justify-center">
                            <div className="transform scale-125 mb-2">
                                <BoxDiagram electronCount={currentElement.number} />
                            </div>
                            <div className="mt-4 text-slate-400 font-mono text-sm">
                                Total Electrones: <span className="text-white font-bold text-lg">{currentElement.number}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => checkProgression()}
                        className="w-full py-4 bg-white text-slate-900 font-black tracking-wider rounded-lg hover:bg-yellow-400 hover:scale-[1.02] transition-all text-lg shadow-lg"
                    >
                        ¡CONTINUAR CON LA CAZA!
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* GAME CANVAS */}
      <div className="flex-grow z-0 relative">
        <GameCanvas 
            currentElement={currentElement}
            electronCount={electronCount}
            onElectronCaptured={handleElectronCaptured}
            onMistake={handleMistake}
            setHoveredOrbitalName={setHoveredOrbitalName}
            difficulty={difficulty}
            isLevelComplete={isVictoryAnim || isInfoMode}
            lives={lives}
            onTimeBonus={handleTimeBonus}
            onLifeBonus={handleLifeBonus}
            timeLeft={timeLeft} 
        />
      </div>
    </div>
  );
};

export default App;
