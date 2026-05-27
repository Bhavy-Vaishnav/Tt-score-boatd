import React, { useState } from 'react';
import { Player } from '../types';
import { AVATAR_EMOJIS, THEME_COLORS, getColorClass } from '../utils';
import { Edit3, UserPlus, Save, X, RefreshCw } from 'lucide-react';

interface PlayerRosterProps {
  players: Player[];
  onUpdatePlayer: (updatedPlayer: Player) => void;
  onResetPlayers: () => void;
}

export function PlayerRoster({ players, onUpdatePlayer, onResetPlayers }: PlayerRosterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditAvatar(player.avatar);
    setEditColor(player.color);
  };

  const handleSave = (id: string) => {
    if (!editName.trim()) return;
    onUpdatePlayer({
      id,
      name: editName.trim(),
      avatar: editAvatar,
      color: editColor
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm" id="player-roster-panel">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            👤 Roommate Roster
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Customize player names, emojis, and styling cards.</p>
        </div>
        <button 
          onClick={() => {
            if (window.confirm("Reset player names to defaults? This will keep match histories but map matches based on internal IDs.")) {
              onResetPlayers();
            }
          }}
          className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 hover:text-gray-600 transition-colors cursor-pointer bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg"
          title="Reset back to Default Roommate Names"
        >
          <RefreshCw size={10} /> Reset
        </button>
      </div>

      <div className="space-y-4">
        {players.map(player => {
          const isEditing = editingId === player.id;
          const config = getColorClass(player.color);

          return (
            <div 
              key={player.id} 
              className={`rounded-2xl border p-4 transition-all ${
                isEditing 
                  ? 'border-orange-200 bg-orange-50/20 shadow-xs' 
                  : 'border-gray-150 bg-white hover:bg-gray-50/50'
              }`}
            >
              {isEditing ? (
                /* Editing Flow */
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editName}
                      maxLength={18}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter Player Name..."
                      className="flex-1 rounded-xl border border-gray-200 p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 bg-white"
                    />
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleSave(player.id)}
                        className="p-2 rounded-xl bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700 transition-colors"
                        title="Save Changes"
                      >
                        <Save size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2 rounded-xl bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Avatar Emoji</span>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEditAvatar(emoji)}
                          className={`text-base p-1.5 leading-none rounded-lg cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                            editAvatar === emoji 
                              ? 'bg-orange-100 border border-orange-300 font-bold scale-105' 
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlight Color Picker */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Highlight Color Theme</span>
                    <div className="flex flex-wrap gap-2">
                      {THEME_COLORS.map(c => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setEditColor(c.name)}
                          className={`w-6 h-6 rounded-full cursor-pointer border ${c.bg} ${
                            editColor === c.name ? 'ring-2 ring-offset-1 ring-orange-500 border-white' : 'border-gray-200 hover:scale-105'
                          }`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Static view flow */
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-3xl shrink-0" role="img" aria-label="avatar">
                      {player.avatar}
                    </span>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{player.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${config.bg}`}></span>
                        <span className="text-[10px] font-semibold text-gray-400 capitalize">{player.color} theme</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => startEdit(player)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                    title={`Customize ${player.name}`}
                  >
                    <Edit3 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
