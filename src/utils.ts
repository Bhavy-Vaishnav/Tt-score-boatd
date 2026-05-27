import { Player, Match, PlayerStats, SideStats } from './types';

// Default Emojis for avatars
export const AVATAR_EMOJIS = ['🏓', '🙋‍♂️', '⚡', '🔥', '👑', '🧙‍♂️', '🦁', '🦉', '🎯', '🥑', '🦊', '🚀'];

// Default Colors
export const THEME_COLORS = [
  { name: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'shadow-emerald-500/20', lightBg: 'bg-emerald-50' },
  { name: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', glow: 'shadow-indigo-500/20', lightBg: 'bg-indigo-50' },
  { name: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', glow: 'shadow-amber-500/20', lightBg: 'bg-amber-50' },
  { name: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'shadow-rose-500/20', lightBg: 'bg-rose-50' },
  { name: 'sky', bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500', glow: 'shadow-sky-500/20', lightBg: 'bg-sky-50' },
  { name: 'violet', bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500', glow: 'shadow-violet-500/20', lightBg: 'bg-violet-50' }
];

export const getColorClass = (colorName: string) => {
  const match = THEME_COLORS.find(c => c.name === colorName);
  return match || THEME_COLORS[1]; // default indigo
};

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'player-1',
    name: 'Bhavy', // personalized from bhavyvaishnav11@gmail.com
    color: 'emerald',
    avatar: '🏓'
  },
  {
    id: 'player-2',
    name: 'Sam',
    color: 'indigo',
    avatar: '⚡'
  },
  {
    id: 'player-3',
    name: 'Alex',
    color: 'amber',
    avatar: '🔥'
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-1',
    player1Id: 'player-1',
    player2Id: 'player-2',
    player1Side: 'Left',
    player2Side: 'Right',
    player1Score: 11,
    player2Score: 8,
    winnerId: 'player-1',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'completed'
  },
  {
    id: 'm-2',
    player1Id: 'player-2',
    player2Id: 'player-3',
    player1Side: 'Left',
    player2Side: 'Right',
    player1Score: 9,
    player2Score: 11,
    winnerId: 'player-3',
    date: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    status: 'completed'
  },
  {
    id: 'm-3',
    player1Id: 'player-1',
    player2Id: 'player-3',
    player1Side: 'Right',
    player2Side: 'Left',
    player1Score: 11,
    player2Score: 5,
    winnerId: 'player-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'completed'
  },
  {
    id: 'm-4',
    player1Id: 'player-2',
    player2Id: 'player-1',
    player1Side: 'Right',
    player2Side: 'Left',
    player1Score: 11,
    player2Score: 7,
    winnerId: 'player-2',
    date: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    status: 'completed'
  },
  {
    id: 'm-5',
    player1Id: 'player-3',
    player2Id: 'player-1',
    player1Side: 'Right',
    player2Side: 'Left',
    player1Score: 12,
    player2Score: 10,
    winnerId: 'player-3',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed'
  }
];

export function calculateStats(players: Player[], matches: Match[]): PlayerStats[] {
  const completedMatches = matches.filter(m => m.status === 'completed');

  return players.map(player => {
    const stats: PlayerStats = {
      playerId: player.id,
      totalPlayed: 0,
      totalWon: 0,
      totalLost: 0,
      leftPlayed: 0,
      leftWon: 0,
      leftLost: 0,
      rightPlayed: 0,
      rightWon: 0,
      rightLost: 0,
      winRate: 0,
      leftWinRate: 0,
      rightWinRate: 0
    };

    completedMatches.forEach(m => {
      const isP1 = m.player1Id === player.id;
      const isP2 = m.player2Id === player.id;

      if (!isP1 && !isP2) return;

      stats.totalPlayed++;
      
      const isWinner = m.winnerId === player.id;
      if (isWinner) {
        stats.totalWon++;
      } else {
        stats.totalLost++;
      }

      const side = isP1 ? m.player1Side : m.player2Side;
      if (side === 'Left') {
        stats.leftPlayed++;
        if (isWinner) stats.leftWon++;
        else stats.leftLost++;
      } else if (side === 'Right') {
        stats.rightPlayed++;
        if (isWinner) stats.rightWon++;
        else stats.rightLost++;
      }
    });

    stats.winRate = stats.totalPlayed > 0 ? (stats.totalWon / stats.totalPlayed) * 100 : 0;
    stats.leftWinRate = stats.leftPlayed > 0 ? (stats.leftWon / stats.leftPlayed) * 100 : 0;
    stats.rightWinRate = stats.rightPlayed > 0 ? (stats.rightWon / stats.rightPlayed) * 100 : 0;

    return stats;
  });
}

export function calculateSideStats(matches: Match[]): SideStats {
  const completedMatches = matches.filter(m => m.status === 'completed');
  let leftTotalWins = 0;
  let rightTotalWins = 0;
  let leftPlayCount = 0;
  let rightPlayCount = 0;

  completedMatches.forEach(m => {
    // Each match has one player on Left and one on Right
    leftPlayCount++;
    rightPlayCount++;

    const isP1Left = m.player1Side === 'Left';
    const isP1Winner = m.winnerId === m.player1Id;

    if (isP1Left) {
      if (isP1Winner) {
        leftTotalWins++;
      } else {
        rightTotalWins++;
      }
    } else {
      if (isP1Winner) {
        rightTotalWins++;
      } else {
        leftTotalWins++;
      }
    }
  });

  return {
    leftTotalWins,
    rightTotalWins,
    leftPlayCount,
    rightPlayCount,
    leftOverallWinRate: leftPlayCount > 0 ? (leftTotalWins / leftPlayCount) * 100 : 0,
    rightOverallWinRate: rightPlayCount > 0 ? (rightTotalWins / rightPlayCount) * 100 : 0
  };
}
