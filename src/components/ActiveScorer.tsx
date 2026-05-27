import React, { useState, useEffect } from 'react';
import { Player, Match, TableSide } from '../types';
import { getColorClass } from '../utils';
import { Play, RotateCcw, Save, ShieldAlert, Sparkles, Undo, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveScorerProps {
  players: Player[];
  onLogMatch: (match: Omit<Match, 'id' | 'date'>) => void;
}

export function ActiveScorer({ players, onLogMatch }: ActiveScorerProps) {
  const [isActive, setIsActive] = useState(false);
  const [p1Id, setP1Id] = useState(''); // Left player
  const [p2Id, setP2Id] = useState(''); // Right player
  
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [starterId, setStarterId] = useState('');
  const [currentServerId, setCurrentServerId] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [targetPoints, setTargetPoints] = useState(11);
  const [history, setHistory] = useState<{ p1: number; p2: number; server: string }[]>([]);

  // Find player details
  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  // Initialize server when starting or changing scores
  useEffect(() => {
    if (isActive && !isFinished) {
      updateServer(p1Score, p2Score);
    }
  }, [p1Score, p2Score, starterId, isActive, isFinished]);

  const updateServer = (score1: number, score2: number) => {
    if (!starterId) return;

    const totalPoints = score1 + score2;
    const receiverId = starterId === p1Id ? p2Id : p1Id;

    // Table Tennis rules:
    // If BOTH scores are 10 or more (deuce / advantage state), serve rotates EVERY point.
    // Otherwise, serve rotates EVERY 2 points.
    if (score1 >= 10 && score2 >= 10) {
      if (totalPoints % 2 === 0) {
        setCurrentServerId(starterId);
      } else {
        setCurrentServerId(receiverId);
      }
    } else {
      const serveCycle = Math.floor(totalPoints / 2);
      if (serveCycle % 2 === 0) {
        setCurrentServerId(starterId);
      } else {
        setCurrentServerId(receiverId);
      }
    }
  };

  const handleStart = () => {
    if (!p1Id || !p2Id || p1Id === p2Id) return;
    setP1Score(0);
    setP2Score(0);
    setIsFinished(false);
    setHistory([]);
    
    // Choose starting server automatically if not set
    const startingServer = starterId || p1Id;
    setStarterId(startingServer);
    setCurrentServerId(startingServer);
    setIsActive(true);
  };

  const addPoint = (playerNum: 1 | 2) => {
    if (isFinished) return;

    // Save previous state to history for undo
    setHistory(prev => [...prev, { p1: p1Score, p2: p2Score, server: currentServerId }]);

    let nextP1 = p1Score;
    let nextP2 = p2Score;

    if (playerNum === 1) {
      nextP1 = p1Score + 1;
      setP1Score(nextP1);
    } else {
      nextP2 = p2Score + 1;
      setP2Score(nextP2);
    }

    // Check game termination:
    // Reach 11 (or 21), win by 2
    if (nextP1 >= targetPoints && nextP1 - nextP2 >= 2) {
      setIsFinished(true);
    } else if (nextP2 >= targetPoints && nextP2 - nextP1 >= 2) {
      setIsFinished(true);
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || isFinished) return;
    const prev = history[history.length - 1];
    setP1Score(prev.p1);
    setP2Score(prev.p2);
    setCurrentServerId(prev.server);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const handleManualIncrement = (playerNum: 1 | 2, amount: number) => {
    if (playerNum === 1) {
      const val = Math.max(0, p1Score + amount);
      setP1Score(val);
      if (val >= targetPoints && val - p2Score >= 2) setIsFinished(true);
      else setIsFinished(false);
    } else {
      const val = Math.max(0, p2Score + amount);
      setP2Score(val);
      if (val >= targetPoints && val - p1Score >= 2) setIsFinished(true);
      else setIsFinished(false);
    }
  };

  const handleSave = () => {
    if (!p1Id || !p2Id) return;
    
    const winnerId = p1Score > p2Score ? p1Id : p2Id;
    
    onLogMatch({
      player1Id: p1Id,
      player2Id: p2Id,
      player1Side: 'Left',
      player2Side: 'Right',
      player1Score: p1Score,
      player2Score: p2Score,
      winnerId,
      status: 'completed'
    });

    setIsActive(false);
    setP1Score(0);
    setP2Score(0);
    setIsFinished(false);
  };

  const handleReset = () => {
    if (window.confirm("Abandon current live match? State will be lost.")) {
      setIsActive(false);
      setP1Score(0);
      setP2Score(0);
      setIsFinished(false);
      setHistory([]);
    }
  };

  const handleSwapSides = () => {
    // Convenience feature to swap who is Left vs Right
    const tempP1 = p1Id;
    setP1Id(p2Id);
    setP2Id(tempP1);
    
    const tempScore = p1Score;
    setP1Score(p2Score);
    setP2Score(tempScore);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md" id="active-scorer-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600 block text-base">🏓</span>
            Live Match Scoreboard
          </h2>
          <p className="text-xs text-gray-400 mt-1">Tap players to score. Track serves and automatic match turnover.</p>
        </div>
        
        {!isActive ? (
          <div className="flex gap-2 bg-gray-50 p-1 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200">
            <button 
              onClick={() => setTargetPoints(11)}
              className={`px-3 py-1.5 rounded-lg transition-all ${targetPoints === 11 ? 'bg-white text-gray-800 shadow-xs border border-gray-150' : 'hover:text-gray-800'}`}
            >
              11 Points
            </button>
            <button 
              onClick={() => setTargetPoints(21)}
              className={`px-3 py-1.5 rounded-lg transition-all ${targetPoints === 21 ? 'bg-white text-gray-800 shadow-xs border border-gray-150' : 'hover:text-gray-800'}`}
            >
              21 Points
            </button>
          </div>
        ) : (
          <button 
            onClick={handleReset} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer"
          >
            <RotateCcw size={14} /> Abort Match
          </button>
        )}
      </div>

      {!isActive ? (
        /* Configuration Panel */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Player 1 Selection (Left Side) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Left Side Player</label>
              <div className="relative">
                <select 
                  value={p1Id} 
                  onChange={(e) => {
                    setP1Id(e.target.value);
                    if (!starterId) setStarterId(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-gray-200 p-3 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="">Select Left Competitor...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === p2Id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center pr-1 text-gray-400">
                  ▼
                </div>
              </div>
            </div>

            {/* Player 2 Selection (Right Side) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Right Side Player</label>
              <div className="relative">
                <select 
                  value={p2Id} 
                  onChange={(e) => {
                    setP2Id(e.target.value);
                    if (!starterId) setStarterId(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-gray-200 p-3 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="">Select Right Competitor...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === p1Id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center pr-1 text-gray-400">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Sizing options, service choice, swap button */}
          {p1Id && p2Id && p1Id !== p2Id && (
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-500">Who serves first?</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setStarterId(p1Id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${starterId === p1Id ? 'bg-orange-500 text-white shadow-xs' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                    {players.find(p => p.id === p1Id)?.name}
                  </button>
                  <button 
                    onClick={() => setStarterId(p2Id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${starterId === p2Id ? 'bg-orange-500 text-white shadow-xs' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                  >
                    {players.find(p => p.id === p2Id)?.name}
                  </button>
                </div>
               </div>

              <button 
                type="button" 
                onClick={handleSwapSides}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all bg-white cursor-pointer"
              >
                <Shuffle size={14} /> Swap Left / Right
              </button>
            </div>
          )}

          <button
            disabled={!p1Id || !p2Id}
            onClick={handleStart}
            className={`w-full py-3.5 rounded-2xl font-bold flex text-sm items-center justify-center gap-2 transition-all cursor-pointer ${
              p1Id && p2Id
                ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-98 shadow-md'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
          >
            <Play size={16} /> Start Live Scorer (First to {targetPoints})
          </button>
        </div>
      ) : (
        /* Active Scorer Panel */
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Player 1 Left Side Counter */}
            <div 
              onClick={() => addPoint(1)}
              className={`relative cursor-pointer rounded-2xl border p-6 flex flex-col items-center justify-center text-center transition-all ${
                p1Score > p2Score && !isFinished
                  ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50' 
                  : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
              } group overflow-hidden select-none`}
            >
              <div className="absolute top-3 left-3 bg-cyan-100 text-cyan-800 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">
                Left Side
              </div>
              
              {currentServerId === p1Id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full animate-pulse-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                  SERVING
                </div>
              )}

              <div className={`text-3xl mt-4 ${getColorClass(p1?.color || '').text}`}>
                {p1?.avatar}
              </div>
              <h3 className="font-bold text-gray-800 mt-2 truncate w-full px-2">{p1?.name}</h3>
              
              <div className="text-6xl md:text-7xl font-extrabold font-mono text-gray-900 tracking-tighter my-4 group-hover:scale-105 transition-transform">
                {p1Score}
              </div>

              <p className="text-[10px] text-gray-400 font-medium group-hover:text-gray-500 transition-colors">Tap Box to Score +1</p>

              <div className="flex gap-2 mt-4 relative z-20" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handleManualIncrement(1, -1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-gray-600 flex items-center justify-center text-base hover:bg-gray-100 cursor-pointer"
                  title="Minus 1 point"
                >
                  -
                </button>
                <button 
                  onClick={() => handleManualIncrement(1, 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-gray-600 flex items-center justify-center text-base hover:bg-gray-100 cursor-pointer"
                  title="Plus 1 point"
                >
                  +
                </button>
              </div>
            </div>

            {/* Player 2 Right Side Counter */}
            <div 
              onClick={() => addPoint(2)}
              className={`relative cursor-pointer rounded-2xl border p-6 flex flex-col items-center justify-center text-center transition-all ${
                p2Score > p1Score && !isFinished
                  ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50' 
                  : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
              } group overflow-hidden select-none`}
            >
              <div className="absolute top-3 left-3 bg-violet-100 text-violet-800 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">
                Right Side
              </div>

              {currentServerId === p2Id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-full animate-pulse-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                  SERVING
                </div>
              )}

              <div className={`text-3xl mt-4 ${getColorClass(p2?.color || '').text}`}>
                {p2?.avatar}
              </div>
              <h3 className="font-bold text-gray-800 mt-2 truncate w-full px-2">{p2?.name}</h3>
              
              <div className="text-6xl md:text-7xl font-extrabold font-mono text-gray-900 tracking-tighter my-4 group-hover:scale-105 transition-transform">
                {p2Score}
              </div>

              <p className="text-[10px] text-gray-400 font-medium group-hover:text-gray-500 transition-colors">Tap Box to Score +1</p>

              <div className="flex gap-2 mt-4 relative z-20" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handleManualIncrement(2, -1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-gray-600 flex items-center justify-center text-base hover:bg-gray-100 cursor-pointer"
                  title="Minus 1 point"
                >
                  -
                </button>
                <button 
                  onClick={() => handleManualIncrement(2, 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 bg-white text-gray-600 flex items-center justify-center text-base hover:bg-gray-100 cursor-pointer"
                  title="Plus 1 point"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Live Action Tools: Undo, Rules info */}
          <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                history.length > 0 
                  ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium' 
                  : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Undo size={12} /> Undo Point
            </button>
            
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldAlert size={12} className="text-gray-400" />
              {p1Score >= targetPoints - 1 && p2Score >= targetPoints - 1 ? (
                <span className="text-orange-500 font-bold">DEUCE: Winner must lead by 2 points. Served 1 by 1.</span>
              ) : (
                <span>First to {targetPoints} leads. Served 2 by 2.</span>
              )}
            </span>
          </div>

          {/* Victory overlay and Save Match trigger */}
          <AnimatePresence>
            {isFinished && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg animate-bounce">
                  ✨
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-base">
                    Match Point! Game Set Match!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Winner is <strong className="font-extrabold">{p1Score > p2Score ? p1?.name : p2?.name}</strong> with score <strong>{Math.max(p1Score, p2Score)} - {Math.min(p1Score, p2Score)}</strong>.
                  </p>
                </div>
                <div className="flex gap-2 w-full max-w-sm mt-1">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    <Save size={14} /> Log Match & Reset
                  </button>
                  <button
                    onClick={() => {
                      // Let them adjust scores back down if they misclicked
                      setIsFinished(false);
                      if (history.length > 0) handleUndo();
                    }}
                    className="py-2 px-4 rounded-xl border border-emerald-200 bg-white text-emerald-700 font-semibold text-xs hover:bg-emerald-100/50 transition-all cursor-pointer"
                  >
                    Not yet done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
