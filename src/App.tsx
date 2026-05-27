import React, { useState, useEffect } from 'react';
import { Player, Match, TableSide, AIAnalysisResponse } from './types';
import { INITIAL_PLAYERS, INITIAL_MATCHES, calculateStats } from './utils';
import { ActiveScorer } from './components/ActiveScorer';
import { AnalyticsView } from './components/AnalyticsView';
import { PlayerRoster } from './components/PlayerRoster';
import { 
  Plus, 
  History, 
  Trash2, 
  Sparkles, 
  Award, 
  HelpCircle, 
  CheckCircle,
  HelpCircle as QuestionIcon,
  CirclePlay,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // PWA Install suggestion state
  const [showInstallTip, setShowInstallTip] = useState(() => {
    const saved = localStorage.getItem('tt_hide_install_tip');
    return saved !== 'true';
  });

  // 1. Core State with local storage persistence
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('tt_players');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('tt_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  // 2. AI States
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(() => {
    const saved = localStorage.getItem('tt_ai_analysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 3. Quick Match Log State
  const [quickP1, setQuickP1] = useState('');
  const [quickP2, setQuickP2] = useState('');
  const [quickP1Side, setQuickP1Side] = useState<TableSide>('Left');
  const [quickP1Score, setQuickP1Score] = useState(11);
  const [quickP2Score, setQuickP2Score] = useState(9);
  const [quickError, setQuickError] = useState<string | null>(null);

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem('tt_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('tt_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    if (aiAnalysis) {
      localStorage.setItem('tt_ai_analysis', JSON.stringify(aiAnalysis));
    }
  }, [aiAnalysis]);

  // Handlers
  const handleLogMatch = (newMatchData: Omit<Match, 'id' | 'date'>) => {
    const freshMatch: Match = {
      ...newMatchData,
      id: `m-${Date.now()}`,
      date: new Date().toISOString()
    };
    setMatches(prev => [freshMatch, ...prev]);
    
    // Smooth reset quick logger state
    setQuickError(null);
  };

  const handleDeleteMatch = (id: string) => {
    if (window.confirm("Are you sure you want to delete this match record?")) {
      setMatches(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handleResetPlayers = () => {
    setPlayers(INITIAL_PLAYERS);
  };

  const handleDismissInstallTip = () => {
    localStorage.setItem('tt_hide_install_tip', 'true');
    setShowInstallTip(false);
  };

  const runAiAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ players, matches })
      });

      if (!response.ok) {
        throw new Error('Analysis server returned an error status');
      }

      const data = await response.json();
      setAiAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Could not reach analysis endpoint.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const submitQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);

    if (!quickP1 || !quickP2) {
      setQuickError("Please select both players.");
      return;
    }

    if (quickP1 === quickP2) {
      setQuickError("A player cannot play against themselves!");
      return;
    }

    if (quickP1Score === quickP2Score) {
      setQuickError("Matches cannot end in a draw! Keep serving.");
      return;
    }

    const leadValue = Math.abs(quickP1Score - quickP2Score);
    const maxScore = Math.max(quickP1Score, quickP2Score);
    
    if (maxScore < 11) {
      if (!window.confirm(`Is the game score of ${maxScore} points correct? Usually competitive games play up to 11 points.`)) {
        return;
      }
    }

    if (maxScore >= 11 && leadValue < 2) {
      setQuickError(`Invalid Score: Ping pong rules require winning by at least 2 points (e.g. 11-9 or 13-11).`);
      return;
    }

    const p2Side: TableSide = quickP1Side === 'Left' ? 'Right' : 'Left';
    const winnerId = quickP1Score > quickP2Score ? quickP1 : quickP2;

    handleLogMatch({
      player1Id: quickP1,
      player2Id: quickP2,
      player1Side: quickP1Side,
      player2Side: p2Side,
      player1Score: quickP1Score,
      player2Score: quickP2Score,
      winnerId,
      status: 'completed'
    });

    // Reset scores only, keep chosen players for quick rapid games
    setQuickP1Score(11);
    setQuickP2Score(9);
    setQuickError(null);
  };

  // Stats for simple overview
  const stats = calculateStats(players, matches);
  const leader = [...stats].sort((a, b) => b.winRate - a.winRate)[0];
  const leaderPlayer = players.find(p => p.id === leader?.playerId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-16">
      {/* 1. Header Hero Area */}
      <header className="bg-white border-b border-gray-150 py-6 px-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce-slow" role="img" aria-label="paddle">🏓</span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                Living Room <span className="text-orange-500">Arena</span>
              </h1>
              <p className="text-xs text-gray-400 font-medium font-mono">BHAVY • SAM • ALEX • DORM PING-PONG CENTRAL</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {leaderPlayer && leader?.totalPlayed > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700 shadow-xs">
                <span className="text-sm">👑</span>
                <span>Leader: <strong className="font-extrabold">{leaderPlayer.name}</strong> ({leader.winRate.toFixed(0)}% wins)</span>
              </div>
            )}

            <button 
              onClick={runAiAnalysis}
              disabled={loadingAnalysis}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer ${
                loadingAnalysis 
                  ? 'bg-orange-100 text-orange-400' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:shadow-md active:scale-95'
              }`}
            >
              <Sparkles size={13} className={loadingAnalysis ? 'animate-spin' : ''} />
              {loadingAnalysis ? 'Consulting Gemini...' : 'Analyze with Gemini'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Bento Layout */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Gemini AI Insight Panel (Top Spawning Card if loaded or loading) */}
        <AnimatePresence>
          {(aiAnalysis || loadingAnalysis || analysisError) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white rounded-3xl border border-slate-800 p-6 shadow-xl relative"
            >
              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-orange-400">Gemini Roommate Analyst</h3>
                    <p className="text-[10px] text-zinc-400">Real-time behavior analytics, micro slanders & table bias reports</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setAiAnalysis(null);
                    setAnalysisError(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  title="Close AI analysis"
                >
                  ✕ Close
                </button>
              </div>

              {loadingAnalysis ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-zinc-300 font-mono">Sifting through score cards, calculating server correlations... Hang tight!</p>
                </div>
              ) : analysisError ? (
                <div className="py-4 text-xs text-red-400">
                  ⚠️ Error getting AI Insights: {analysisError}
                  <button onClick={runAiAnalysis} className="ml-2 underline font-bold hover:text-white">Retry</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Verdict & Commentary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Verdict */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sassy Sport Insights</h4>
                      <p className="text-sm text-zinc-200 leading-relaxed font-medium">"{aiAnalysis?.insights}"</p>
                    </div>

                    {/* Commentary */}
                    <div className="space-y-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        🎤 Arena Commentary
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed italic">"{aiAnalysis?.funCommentary}"</p>
                    </div>
                  </div>

                  {/* Side Bias Details */}
                  {aiAnalysis?.sideBiasVerdict && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-400 block mb-1">Scientific Side Correlation Verdict:</span>
                        <p className="text-zinc-200 font-medium">{aiAnalysis.sideBiasVerdict.explanation}</p>
                      </div>
                      <span className={`shrink-0 px-3 py-1.5 font-black uppercase text-[10px] tracking-wider rounded-xl ${
                        aiAnalysis.sideBiasVerdict.significant 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {aiAnalysis.sideBiasVerdict.significant ? 'Significant Bias Alert ⚠️' : 'Hypothesis Rejected ✅'}
                      </span>
                    </div>
                  )}

                  {/* Rivalries Head-To-Head */}
                  {aiAnalysis?.rivalries && aiAnalysis.rivalries.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <span className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-400 block mb-2">Roommate Rivalry Match-Ups:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {aiAnalysis.rivalries.map((r, idx) => (
                          <div key={idx} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                            <span className="text-md">⚡</span>
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-bold text-xs text-zinc-200">{r.players.join(' vs ')}</span>
                                <span className="text-[10px] bg-slate-800 text-zinc-300 font-mono px-1.5 py-0.5 rounded-md font-bold">{r.headToHead}</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 font-medium">{r.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Home Screen Installation Guide */}
        <AnimatePresence>
          {showInstallTip && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-8 bg-sky-50 border border-sky-100 text-sky-900 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="p-2.5 rounded-xl bg-sky-100 text-sky-600 shrink-0 text-base flex items-center justify-center">
                  <Smartphone size={18} />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    📱 Run as a Full-Screen App on your Mobile Phone!
                  </h4>
                  <p className="text-xs text-sky-700 mt-1 leading-relaxed">
                    You can install this tracker directly onto your phone's home screen for a fast, native app experience:
                    <br />
                    • <strong className="font-extrabold text-sky-900">On Android (Chrome):</strong> Tap the browser's three-dot menu, then select <strong className="font-bold underline">"Install App"</strong>.
                    <br />
                    • <strong className="font-extrabold text-sky-900">On iPhone / iOS (Safari):</strong> Tap the <strong className="font-bold">Share</strong> button at the bottom, then scroll and select <strong className="font-bold underline">"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDismissInstallTip}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 px-3 py-2 rounded-xl border border-sky-200/50 hover:border-sky-300 bg-white/70 shadow-2xs transition-all cursor-pointer whitespace-nowrap self-end md:self-center"
              >
                Clear Notice
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Primary Workspace Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 PANELS: Active Scorer + Quick Logger */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Live Scorer */}
            <ActiveScorer players={players} onLogMatch={handleLogMatch} />

            {/* Quick completed match log panel */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-850 uppercase tracking-wider flex items-center gap-2">
                  <Plus size={16} className="text-emerald-500" />
                  Quick Log Completed Match
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">For logging offline games in seconds</span>
              </div>

              {quickError && (
                <div className="p-3 mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-150 rounded-xl">
                  {quickError}
                </div>
              )}

              <form onSubmit={submitQuickLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Quick Player 1 Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">First Player (P1)</label>
                    <select 
                      value={quickP1}
                      onChange={(e) => setQuickP1(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-250 p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-gray-700"
                    >
                      <option value="">Select Player...</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id} disabled={p.id === quickP2}>
                          {p.avatar} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Player 2 Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Second Player (P2)</label>
                    <select 
                      value={quickP2}
                      onChange={(e) => setQuickP2(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-250 p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-gray-700"
                    >
                      <option value="">Select Player...</option>
                      {players.map(p => (
                        <option key={p.id} value={p.id} disabled={p.id === quickP1}>
                          {p.avatar} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Match Side and Scores */}
                <div className="grid grid-cols-3 gap-3 items-end">
                  {/* Side Allocation Choice */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">P1 Start Side</label>
                    <select 
                      value={quickP1Side}
                      onChange={(e) => setQuickP1Side(e.target.value as TableSide)}
                      className="w-full text-xs rounded-xl border border-gray-250 p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-gray-700"
                    >
                      <option value="Left">Left Side (P1)</option>
                      <option value="Right">Right Side (P1)</option>
                    </select>
                    <p className="text-[9px] text-gray-400 mt-0.5">P2 gets inverse side</p>
                  </div>

                  {/* Score for P1 */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">P1 Score</label>
                    <input 
                      type="number" 
                      min={0}
                      max={99}
                      value={quickP1Score}
                      onChange={(e) => setQuickP1Score(Number(e.target.value))}
                      className="w-full text-xs font-bold rounded-xl border border-gray-250 p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center font-mono"
                    />
                  </div>

                  {/* Score for P2 */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">P2 Score</label>
                    <input 
                      type="number" 
                      min={0}
                      max={99}
                      value={quickP2Score}
                      onChange={(e) => setQuickP2Score(Number(e.target.value))}
                      className="w-full text-xs font-bold rounded-xl border border-gray-250 p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 shadow-xs"
                >
                  <CheckCircle size={14} /> Record Finished Match
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT 5 PANELS: Roster, Table Side Analytics, Match History */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Roommate Roster */}
            <PlayerRoster 
              players={players} 
              onUpdatePlayer={handleUpdatePlayer} 
              onResetPlayers={handleResetPlayers} 
            />

            {/* Side preference Analytics Panel */}
            <AnalyticsView players={players} matches={matches} />

            {/* Match History feed */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm" id="match-history-panel">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <History size={16} className="text-gray-400" />
                  Recent Games Match Feed
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full font-mono">{matches.length} matches</span>
              </div>

              {matches.length === 0 ? (
                <div className="py-8 text-center text-gray-450 text-xs">
                  No match history logs available. Start serving!
                </div>
              ) : (
                <div className="space-y-3.5 max-h-120 overflow-y-auto pr-1">
                  {matches.slice(0, 15).map((match) => {
                    const p1Obj = players.find(p => p.id === match.player1Id);
                    const p2Obj = players.find(p => p.id === match.player2Id);
                    
                    const isP1Winner = match.winnerId === match.player1Id;
                    const formattedDate = new Date(match.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div 
                        key={match.id}
                        className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-3 flex flex-col justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center gap-2">
                          {/* P1 information */}
                          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                            <span className="text-lg shrink-0">{p1Obj?.avatar || '🏓'}</span>
                            <div className="truncate">
                              <span className={`text-xs block font-bold ${isP1Winner ? 'text-gray-900 font-extrabold' : 'text-gray-500 font-medium'}`}>
                                {p1Obj?.name || 'Unknown'}
                              </span>
                              <span className="text-[9px] text-gray-400 uppercase tracking-widest">{match.player1Side} Side</span>
                            </div>
                          </div>

                          {/* Scores details */}
                          <div className="flex items-center gap-2 font-mono px-2 shrink-0">
                            <span className={`text-[15px] font-bold ${isP1Winner ? 'text-emerald-600 font-black' : 'text-gray-450'}`}>
                              {match.player1Score}
                            </span>
                            <span className="text-[10px] text-gray-300 font-sans">-</span>
                            <span className={`text-[15px] font-bold ${!isP1Winner ? 'text-emerald-600 font-black' : 'text-gray-450'}`}>
                              {match.player2Score}
                            </span>
                          </div>

                          {/* P2 information */}
                          <div className="flex items-center gap-1.5 overflow-hidden flex-1 justify-end text-right">
                            <div className="truncate">
                              <span className={`text-xs block font-bold ${!isP1Winner ? 'text-gray-900 font-extrabold' : 'text-gray-500 font-medium'}`}>
                                {p2Obj?.name || 'Unknown'}
                              </span>
                              <span className="text-[9px] text-gray-400 uppercase tracking-widest">{match.player2Side} Side</span>
                            </div>
                            <span className="text-lg shrink-0">{p2Obj?.avatar || '🙋‍♂️'}</span>
                          </div>
                        </div>

                        {/* Match metadata and delete */}
                        <div className="flex justify-between items-center border-t border-gray-150 mt-2.5 pt-2 text-[10px] text-gray-400">
                          <span>{formattedDate}</span>
                          <button
                            onClick={() => handleDeleteMatch(match.id)}
                            className="text-gray-450 hover:text-rose-600 transition-colors p-1 rounded-sm cursor-pointer"
                            title="Delete Match Key"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {matches.length > 15 && (
                    <div className="text-center text-[11px] text-gray-400 pb-2">
                      Showing last 15 matches. Log more to gather deeper side-analytics!
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

