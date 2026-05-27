export interface Player {
  id: string;
  name: string;
  color: string; // Tailwind color name like 'emerald', 'indigo', 'amber'
  avatar: string; // Emoji
}

export type TableSide = 'Left' | 'Right';

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Side: TableSide;
  player2Side: TableSide;
  player1Score: number;
  player2Score: number;
  winnerId: string;
  date: string; // ISO timestamp
  status: 'completed' | 'live';
  serverSide?: TableSide; // Which side is currently serving (helpful for active game state)
}

export interface PlayerStats {
  playerId: string;
  totalPlayed: number;
  totalWon: number;
  totalLost: number;
  
  // Side specific stats
  leftPlayed: number;
  leftWon: number;
  leftLost: number;
  
  rightPlayed: number;
  rightWon: number;
  rightLost: number;
  
  winRate: number;
  leftWinRate: number;
  rightWinRate: number;
}

export interface SideStats {
  leftTotalWins: number;
  rightTotalWins: number;
  leftPlayCount: number;
  rightPlayCount: number;
  leftOverallWinRate: number;
  rightOverallWinRate: number;
}

export interface AIAnalysisResponse {
  insights: string;
  funCommentary: string;
  sideBiasVerdict: {
    significant: boolean;
    explanation: string;
  };
  rivalries: Array<{
    players: string[]; // [Player1Name, Player2Name]
    headToHead: string;
    comment: string;
  }>;
}
