import React from 'react';
import { Player, Match, PlayerStats, SideStats } from '../types';
import { calculateStats, calculateSideStats, getColorClass } from '../utils';
import { Award, BarChart2, Check, TrendingUp } from 'lucide-react';

interface AnalyticsViewProps {
  players: Player[];
  matches: Match[];
}

export function AnalyticsView({ players, matches }: AnalyticsViewProps) {
  const stats = calculateStats(players, matches);
  const sideStats = calculateSideStats(matches);
  const completedMatches = matches.filter(m => m.status === 'completed');

  // Find overall highest winrate player
  const leader = [...stats].sort((a, b) => b.winRate - a.winRate)[0];
  const leaderPlayer = players.find(p => p.id === leader?.playerId);

  // Helper to determine side bias string
  const getSideBias = (playerStat: PlayerStats) => {
    const diff = playerStat.leftWinRate - playerStat.rightWinRate;
    
    if (playerStat.totalPlayed === 0) return { label: 'No Data yet', style: 'text-gray-400 bg-gray-50 border-gray-200' };
    if (playerStat.leftPlayed === 0 && playerStat.rightPlayed === 0) return { label: 'Newbie', style: 'text-gray-400 bg-gray-50' };
    
    if (Math.abs(diff) < 15) {
      return { 
        label: 'Symmetric / Balanced', 
        style: 'text-slate-600 bg-slate-50 border-slate-200 border' 
      };
    }
    
    if (diff > 0) {
      return { 
        label: 'Left Side specialist', 
        style: 'text-cyan-600 bg-cyan-50 border-cyan-200 border' 
      };
    } else {
      return { 
        label: 'Right Side specialist', 
        style: 'text-violet-600 bg-violet-50 border-violet-200 border' 
      };
    }
  };

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* Table Side Bias Comparison Card */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart2 size={16} className="text-gray-400" />
          Living Room Arena: Overall Table-Side Bias
        </h3>

        {completedMatches.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Log some completed matches to unlock table-side analytics.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              
              {/* Left Side Wins */}
              <div className="bg-cyan-50/55 rounded-2xl p-4 border border-cyan-100 flex flex-col items-center">
                <span className="text-xs font-semibold text-cyan-600 mb-1">Left Side Wins</span>
                <span className="text-3xl font-extrabold text-cyan-900 font-mono">{sideStats.leftTotalWins}</span>
                <span className="text-[10px] text-cyan-500 mt-1">Play Count: {sideStats.leftPlayCount}</span>
              </div>

              {/* Side Bias Slider Meter */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                  Side Win Percentage Ratio
                </span>
                
                {/* Visual Ratio Bar */}
                <div className="w-full bg-violet-250 h-5 rounded-full overflow-hidden flex relative border border-gray-100">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-500" 
                    style={{ width: `${sideStats.leftOverallWinRate}%` }}
                    title={`Left Side: ${sideStats.leftOverallWinRate.toFixed(1)}%`}
                  />
                  <div 
                    className="bg-purple-400 h-full transition-all duration-500 flex-1"
                    title={`Right Side: ${sideStats.rightOverallWinRate.toFixed(1)}%`}
                  />
                </div>

                <div className="flex justify-between w-full text-xs font-mono font-bold px-1 mt-1 text-gray-500">
                  <span className="text-cyan-600">Left: {sideStats.leftOverallWinRate.toFixed(0)}%</span>
                  <span className="text-purple-600">Right: {sideStats.rightOverallWinRate.toFixed(0)}%</span>
                </div>
              </div>

              {/* Right Side Wins */}
              <div className="bg-violet-50/55 rounded-2xl p-4 border border-violet-100 flex flex-col items-center">
                <span className="text-xs font-semibold text-violet-600 mb-1">Right Side Wins</span>
                <span className="text-3xl font-extrabold text-violet-900 font-mono">{sideStats.rightTotalWins}</span>
                <span className="text-[10px] text-violet-500 mt-1">Play Count: {sideStats.rightPlayCount}</span>
              </div>

            </div>

            {/* Micro Verdict Context text */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 text-xs text-gray-500 leading-relaxed">
              <span className="font-bold text-gray-700">The Side Verdict:</span>{' '}
              {Math.abs(sideStats.leftOverallWinRate - sideStats.rightOverallWinRate) < 5 ? (
                <span>Uncanny symmetry! The Left side ({sideStats.leftOverallWinRate.toFixed(1)}%) and Right side ({sideStats.rightOverallWinRate.toFixed(1)}%) win rates are closely matched. Playing side doesn't seem to offer an advantage in your apartment.</span>
              ) : (
                <span>
                  The <strong className={sideStats.leftOverallWinRate > sideStats.rightOverallWinRate ? 'text-cyan-600' : 'text-purple-600'}>
                    {sideStats.leftOverallWinRate > sideStats.rightOverallWinRate ? 'Left Side' : 'Right Side'}
                  </strong> is proving to be advantageous overall, with a{' '}
                  <strong>{Math.max(sideStats.leftOverallWinRate, sideStats.rightOverallWinRate).toFixed(0)}%</strong> win rate. 
                  {sideStats.leftOverallWinRate > sideStats.rightOverallWinRate 
                    ? ' Maybe there is a draft, lighting reflection, or more space to swing your wrist on the Left side!' 
                    : ' Check if the dresser or dining table corner inhibits players on the Left!'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Individual Side Preference Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(playerStat => {
          const p = players.find(x => x.id === playerStat.playerId);
          if (!p) return null;
          const bias = getSideBias(playerStat);
          const color = getColorClass(p.color);

          return (
            <div key={p.id} className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
                      <p className="text-[10px] text-gray-400">Total Played: {playerStat.totalPlayed}</p>
                    </div>
                  </div>
                  
                  {leaderPlayer?.id === p.id && playerStat.totalPlayed > 0 && (
                    <span className="p-1 rounded-full bg-amber-50 border border-amber-100 text-amber-500" title="Ruler of the Table">
                      <Award size={14} />
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Win Rates by Side</div>
                
                <div className="space-y-2 mb-4">
                  {/* Left Side rate bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-0.5">
                      <span>Left side</span>
                      <span className="font-bold text-cyan-600">{playerStat.leftWinRate.toFixed(0)}% <span className="text-[9px] text-gray-400">({playerStat.leftWon}/{playerStat.leftPlayed})</span></span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: `${playerStat.leftWinRate}%` }} />
                    </div>
                  </div>

                  {/* Right Side rate bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-0.5">
                      <span>Right side</span>
                      <span className="font-bold text-purple-600">{playerStat.rightWinRate.toFixed(0)}% <span className="text-[9px] text-gray-400">({playerStat.rightWon}/{playerStat.rightPlayed})</span></span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-400 h-full" style={{ width: `${playerStat.rightWinRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-2">
                <span className="text-[10px] text-gray-400">Win Rate: <strong className="text-gray-700">{playerStat.winRate.toFixed(0)}%</strong></span>
                <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md ${bias.style}`}>
                  {bias.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
