
import React from 'react';
import { MatchCandidate, ChatMessage } from '../types';
import { IconSearch, IconUnlock } from '../constants';

interface ChatListProps {
    matches: MatchCandidate[];
    messages: Record<string, ChatMessage[]>;
    activeMatchId: string | null;
    onSelectMatch: (id: string) => void;
    viewMode: 'ACTIVE' | 'BLOCKED';
    setViewMode: (mode: 'ACTIVE' | 'BLOCKED') => void;
    blockedUsers: MatchCandidate[];
    onUnblock: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isVisible: boolean; // For mobile responsive toggle
}

const ChatList: React.FC<ChatListProps> = ({ 
    matches, messages, activeMatchId, onSelectMatch, 
    viewMode, setViewMode, blockedUsers, onUnblock,
    searchQuery, setSearchQuery, isVisible
}) => {
    
    const filteredMatches = matches.filter(match => 
        match.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`
          flex-col border-r border-gray-200 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900 w-full md:w-80 flex-shrink-0
          ${isVisible ? 'flex' : 'hidden md:flex'}
        `}>
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {viewMode === 'ACTIVE' ? 'Matches' : 'Blocked Users'}
            </h2>
            {viewMode === 'ACTIVE' && (
                <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Search conversations..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-zinc-800 border-none rounded-md py-1.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-gray-300 dark:focus:ring-zinc-600 transition-shadow outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
                    <div className="transform scale-75">
                         <IconSearch />
                    </div>
                </div>
                </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {viewMode === 'ACTIVE' ? (
                filteredMatches.length === 0 ? (
                    <div className="text-center p-4 text-gray-400 dark:text-gray-600 text-xs">
                        No conversations found.
                    </div>
                ) : (
                    filteredMatches.map(match => {
                    const chatMsgs = messages[match.id] || [];
                    const lastMsg = chatMsgs[chatMsgs.length - 1];
                    const isUnread = lastMsg && lastMsg.senderId !== 'me' && !lastMsg.isRead;
                    
                    return (
                        <div 
                        key={match.id}
                        onClick={() => onSelectMatch(match.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group
                            ${activeMatchId === match.id ? 'bg-gray-200/60 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800/50'}
                        `}
                        >
                        <div className="relative">
                            <img src={match.imageUrls[0]} alt={match.name} className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-zinc-700" loading="lazy" decoding="async" />
                            {match.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                                    {match.name}
                                    {isUnread && (
                                        <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide leading-none">NEW</span>
                                    )}
                                </span>
                                {lastMsg && <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(lastMsg.timestamp)}</span>}
                            </div>
                            <p className={`text-xs truncate ${isUnread ? 'font-bold text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {lastMsg ? (lastMsg.senderId === 'me' ? `You: ${lastMsg.text}` : lastMsg.text) : `Start a chat with ${match.name}`}
                            </p>
                        </div>
                        </div>
                    );
                    })
                )
            ) : (
                blockedUsers.length === 0 ? (
                    <div className="text-center p-4 text-gray-400 dark:text-gray-600 text-xs">
                        No blocked users.
                    </div>
                ) : (
                    blockedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-50 dark:border-red-900/20">
                             <img src={user.imageUrls[0]} alt={user.name} className="w-10 h-10 rounded-md object-cover grayscale opacity-70" loading="lazy" decoding="async" />
                             <div className="flex-1 min-w-0">
                                 <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate block">{user.name}</span>
                                 <span className="text-[10px] text-red-500">Blocked</span>
                             </div>
                             <button 
                                onClick={() => onUnblock(user.id)}
                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="Unblock"
                             >
                                 <IconUnlock />
                             </button>
                        </div>
                    ))
                )
            )}
          </div>
          
          {/* Footer Toggle */}
          <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
              <button 
                onClick={() => setViewMode(viewMode === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}
                className="w-full text-xs font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white uppercase tracking-wide py-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                  {viewMode === 'ACTIVE' ? 'View Blocked Users' : 'Back to Matches'}
              </button>
          </div>
        </div>
    );
};

export default ChatList;
