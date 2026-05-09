
import React, { useState, useEffect, useRef } from 'react';
import { MatchCandidate, ChatMessage } from '../types';
import { 
    IconSend, IconSmile, IconChevronLeft, IconMoreHorizontal, 
    IconUserMinus, IconBan, IconFlag, IconCalendar, IconCheckAll, 
    IconMapPin, IconClock, IconLock
} from '../constants';
import { EMOJI_CATEGORIES } from '../constants';

interface ChatWindowProps {
    activeMatch: MatchCandidate;
    messages: ChatMessage[];
    isTyping: boolean;
    onSendMessage: (text: string) => void;
    onBack: () => void;
    onViewProfile: (match: MatchCandidate) => void;
    onInitiateAction: (action: 'BLOCK' | 'REMOVE' | 'REPORT') => void;
    onOpenDateModal: () => void;
    isDateProposalLocked?: boolean;
}

// Date Proposal Card Component (Internal to Window)
const DateProposalCard = ({ text, isMe, onResponse }: { text: string, isMe: boolean, onResponse: (response: string) => void }) => {
    const activityMatch = text.match(/Let's meet for \*\*(.*?)\*\*/);
    const locationMatch = text.match(/📍 \*\*Where:\*\* (.*)/);
    const timeMatch = text.match(/⏰ \*\*When:\*\* (.*)/);

    const activity = activityMatch ? activityMatch[1] : 'a date';
    const location = locationMatch ? locationMatch[1] : 'Unknown location';
    const time = timeMatch ? timeMatch[1] : 'TBD';

    const formatDateTime = (dtStr: string) => {
        const parts = dtStr.split(' at ');
        if (parts.length === 2) {
            const dateObj = new Date(`${parts[0]}T${parts[1]}`);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + 
                       ' • ' + 
                       dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
        }
        return dtStr;
    };

    const displayTime = formatDateTime(time);

    return (
        <div className={`
            flex flex-col w-full max-w-[320px] bg-white dark:bg-[#202020] rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden font-sans
            ${isMe ? 'ml-auto' : 'mr-auto'}
        `}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50 flex items-center gap-2 bg-gray-50/50 dark:bg-zinc-800/30">
                <div className="p-1.5 bg-white dark:bg-zinc-700 rounded border border-gray-200 dark:border-zinc-600 text-gray-500 dark:text-gray-300 shadow-sm">
                    <IconCalendar />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date Proposal</span>
                {isMe && <div className="ml-auto text-[10px] text-blue-500 font-bold flex items-center gap-1"><IconCheckAll /> Sent</div>}
            </div>

            <div className="p-5">
                <div className="text-lg text-gray-800 dark:text-gray-100 mb-5 leading-snug">
                    Let's meet for <span className="font-bold border-b-2 border-black/10 dark:border-white/20 px-0.5">{activity}</span>?
                </div>
                <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                        <div className="text-red-500 mt-0.5"><IconMapPin /></div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Where</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{location}</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                        <div className="text-blue-500 mt-0.5"><IconClock /></div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">When</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayTime}</div>
                        </div>
                    </div>
                </div>
            </div>

            {!isMe && (
                <div className="grid grid-cols-3 border-t border-gray-100 dark:border-zinc-700 divide-x divide-gray-100 dark:divide-zinc-700">
                    <button onClick={() => onResponse(`Yes, I'd love to! ${activity} sounds great. See you there! ✨`)} className="py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-400 transition-colors">Yes</button>
                    <button onClick={() => onResponse(`Maybe! Can we reschedule the time? 🤔`)} className="py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">Maybe</button>
                    <button onClick={() => onResponse(`I can't make it then. Sorry! 😔`)} className="py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors">No</button>
                </div>
            )}
        </div>
    );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    activeMatch, messages, isTyping, onSendMessage, onBack, 
    onViewProfile, onInitiateAction, onOpenDateModal, isDateProposalLocked
}) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, activeMatch.id]);

    // Close popovers on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputText.trim()) {
                onSendMessage(inputText);
                setInputText('');
                setShowEmojiPicker(false);
            }
        }
    };

    const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 h-full relative">
            {/* Header */}
            <div className="h-14 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 justify-between bg-white dark:bg-zinc-900 flex-shrink-0 relative z-30">
                <div className="flex items-center gap-3">
                  <button onClick={onBack} className="md:hidden p-1 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                      <IconChevronLeft />
                  </button>
                  <div 
                    className="w-8 h-8 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onViewProfile(activeMatch)}
                    title="View Profile"
                  >
                      <img src={activeMatch.imageUrls[0]} alt="Avatar" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div className="cursor-pointer" onClick={() => onViewProfile(activeMatch)}>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none hover:underline">{activeMatch.name}</h3>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        {isTyping ? (
                             <span className="text-green-600 dark:text-green-400 font-medium animate-pulse">Typing...</span>
                        ) : activeMatch.isOnline ? (
                          <><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Online</>
                        ) : (activeMatch.lastSeen || 'Offline')}
                      </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-medium mr-2">
                      {activeMatch.compatibilityScore}% Match
                    </span>
                    
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                            <IconMoreHorizontal />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-700 overflow-hidden z-20 animate-fade-in">
                                <button onClick={() => { onInitiateAction('REMOVE'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"><IconUserMinus /> Remove Match</button>
                                <button onClick={() => { onInitiateAction('BLOCK'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"><IconBan /> Block Match</button>
                                <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
                                <button onClick={() => { onInitiateAction('REPORT'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><IconFlag /> Report Match</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-white dark:bg-zinc-900">
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 space-y-2 border-b border-gray-50 dark:border-zinc-800 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-100 transition-all opacity-50 grayscale" onClick={() => onViewProfile(activeMatch)}>
                         <img src={activeMatch.imageUrls[0]} className="w-full h-full object-cover" alt="Avatar" loading="lazy" decoding="async" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Start a chat with {activeMatch.name}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">{new Date().toLocaleDateString()}</p>
                </div>

                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === 'me';
                  const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                  const isProposal = msg.text.includes('📅 **Date Proposal**');
                  
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group`}>
                        <div className="w-8 flex-shrink-0 flex flex-col items-center">
                          {!isMe && showAvatar && (
                            <img src={activeMatch.imageUrls[0]} className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity" alt={activeMatch.name} onClick={() => onViewProfile(activeMatch)} title="View Profile" loading="lazy" decoding="async" />
                          )}
                        </div>
                        <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                          {showAvatar && !isProposal && (
                            <div className={`flex items-baseline gap-2 text-xs ${isMe ? 'flex-row-reverse' : ''}`}>
                              <span className="font-bold text-gray-900 dark:text-gray-100">{isMe ? 'Me' : activeMatch.name}</span>
                              <span className="text-gray-400 dark:text-gray-500 text-[10px]">{formatTime(msg.timestamp)}</span>
                              {isMe && <span className={`transition-colors ${msg.isRead ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}><IconCheckAll /></span>}
                            </div>
                          )}
                          {isProposal ? (
                              <DateProposalCard text={msg.text} isMe={isMe} onResponse={onSendMessage} />
                          ) : (
                              <div className={`py-2 px-3 rounded text-sm leading-relaxed whitespace-pre-wrap ${isMe ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-gray-200'}`}>
                                {msg.text}
                              </div>
                          )}
                        </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-3">
                      <div className="w-8 flex-shrink-0"><img src={activeMatch.imageUrls[0]} className="w-8 h-8 rounded object-cover" alt={activeMatch.name} loading="lazy" decoding="async" /></div>
                      <div>
                          <div className="flex items-baseline gap-2 text-xs mb-1"><span className="font-bold text-gray-900 dark:text-gray-100">{activeMatch.name}</span></div>
                          <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-3 py-2 rounded-lg inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></span>
                          </div>
                      </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900">
                <div className="max-w-3xl mx-auto relative border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white focus-within:border-black dark:focus-within:border-white transition-all bg-white dark:bg-zinc-800">
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-2xl rounded-xl w-80 h-96 overflow-hidden flex flex-col z-50 animate-fade-in">
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            {EMOJI_CATEGORIES.map(category => (
                                <div key={category.name} className="mb-4">
                                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-white dark:bg-zinc-800 py-1">{category.name}</h4>
                                    <div className="grid grid-cols-8 gap-1">
                                        {category.emojis.map(emoji => (
                                            <button key={emoji} onClick={() => setInputText(prev => prev + emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-xl transition-colors">{emoji}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeMatch.name}...`}
                    className="w-full py-3 pl-3 pr-10 resize-none max-h-32 focus:outline-none text-sm bg-transparent rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    rows={1}
                    style={{ minHeight: '44px' }}
                  />
                  <div className="flex items-center justify-between px-2 pb-2">
                      <div className="flex gap-1">
                        <button className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700'}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Insert Emoji"><IconSmile /></button>
                        <button 
                            className={`p-1.5 rounded transition-colors ${isDateProposalLocked ? 'text-gray-300 dark:text-zinc-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700'}`} 
                            onClick={() => !isDateProposalLocked && onOpenDateModal()} 
                            title={isDateProposalLocked ? "Upgrade to plan dates" : "Propose a Date"}
                        >
                            {isDateProposalLocked ? <div className="scale-75"><IconLock /></div> : <IconCalendar />}
                        </button>
                      </div>
                      <button onClick={() => { if (inputText.trim()) { onSendMessage(inputText); setInputText(''); setShowEmojiPicker(false); } }} disabled={!inputText.trim()} className={`p-1.5 rounded transition-all ${inputText.trim() ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'text-gray-300 dark:text-zinc-600'}`}><IconSend /></button>
                  </div>
                </div>
                <div className="text-center mt-2"><span className="text-[10px] text-gray-400 dark:text-gray-500">Press Enter to send</span></div>
            </div>
        </div>
    );
};

export default ChatWindow;
