
import React, { useState, useEffect } from 'react';
import { IconFilter, IconSend, IconCheck, IconInstagram, IconMapPin, IconCigarette, IconLock, IconRocket, IconX } from '../constants';
import { FilterOptions, SubscriptionTier } from '../types';

interface SearchAreaProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearch: (filters?: FilterOptions) => void;
    handleStopSearch: () => void;
    loadingMatches: boolean;
    hasSearched: boolean;
    // Updated prop for interactive filters
    activeFilterBadges: { label: string; onDismiss: () => void }[];
    onShowFilterModal: () => void;
    onClearFilters: () => void;
    handleSuggestionClick: (suggestion: string) => void;
    suggestions: string[];
    isGuest?: boolean;
    onAuthTrigger?: () => void;
    // New Props for Quick Filters and Locks
    currentFilters?: FilterOptions;
    onApplyQuickFilter?: (partial: Partial<FilterOptions>) => void;
    hasBanner?: boolean;
    userTier?: SubscriptionTier;
    onShowSubscription?: () => void;
    // New Props for Boosts
    availableFreeBoosts?: number;
    onActivateFreeBoost?: () => void;
    isBoostActive?: boolean;
    boostEndTime?: number | null;
}

const SearchArea: React.FC<SearchAreaProps> = ({ 
    searchQuery, setSearchQuery, handleSearch, handleStopSearch, loadingMatches, 
    hasSearched, activeFilterBadges, onShowFilterModal, 
    onClearFilters, handleSuggestionClick, suggestions, isGuest, onAuthTrigger,
    currentFilters, onApplyQuickFilter, hasBanner, userTier = 'FREE', onShowSubscription,
    availableFreeBoosts = 0, onActivateFreeBoost, isBoostActive, boostEndTime
}) => {
    const [timeLeft, setTimeLeft] = useState('');
    const hasActiveFilters = activeFilterBadges.length > 0;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (isGuest && onAuthTrigger) {
             onAuthTrigger();
          } else {
             handleSearch();
          }
        }
    };

    const handleTextareaClick = (e: React.MouseEvent) => {
        if (isGuest && onAuthTrigger) {
            onAuthTrigger();
        }
    };

    const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (isGuest && onAuthTrigger) {
            e.target.blur();
            onAuthTrigger();
        }
    };

    // Helper to identify required tier for a filter set
    const getRequiredTier = (filters: Partial<FilterOptions>): SubscriptionTier => {
        const keys = Object.keys(filters) as (keyof FilterOptions)[];
        const proOnly = ['isOnline', 'hasLinkedin', 'hasInstagram', 'recentlyActive', 'isPremium', 'notAlreadyLiked'];
        if (keys.some(k => proOnly.includes(k))) return 'PRO';

        const freeAllowed = ['maxDistance', 'ageRange', 'ethnicity', 'religion', 'relationshipType'];
        // Quick suggestions typically use standard filters, but check strict logic
        if (keys.every(k => freeAllowed.includes(k))) return 'FREE';

        return 'PLUS';
    };

    const isLocked = (filters: Partial<FilterOptions>) => {
        const required = getRequiredTier(filters);
        if (userTier === 'PRO') return false; 
        if (userTier === 'PLUS') return required === 'PRO';
        // Free users locked out of PLUS and PRO
        return required !== 'FREE';
    };

    // Timer Logic for Active Boost
    useEffect(() => {
        if (!isBoostActive || !boostEndTime) return;
        const updateTimer = () => {
            const now = Date.now();
            const diff = boostEndTime - now;
            if (diff <= 0) {
                setTimeLeft('00h 00m 00s');
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [isBoostActive, boostEndTime]);

    // Smart Suggestions Configuration
    const QUICK_SUGGESTIONS = [
        {
            id: 'online',
            label: 'Online Now',
            icon: <div className="w-2 h-2 bg-green-500 rounded-full" />,
            active: currentFilters?.isOnline,
            action: { isOnline: true },
            className: 'hidden md:flex'
        },
        {
            id: 'verified',
            label: 'Verified Only',
            icon: <IconCheck />,
            active: currentFilters?.isVerified,
            action: { isVerified: true },
            className: 'hidden md:flex'
        },
        {
            id: 'nearby',
            label: 'Nearby (< 10mi)',
            icon: <IconMapPin />,
            active: currentFilters?.maxDistance === 10,
            action: { maxDistance: 10 },
            className: 'hidden md:flex'
        },
        {
            id: 'instagram',
            label: 'Has Instagram',
            icon: <IconInstagram />,
            active: currentFilters?.hasInstagram,
            action: { hasInstagram: true }
        },
        {
            id: 'nosmoke',
            label: 'Non-Smoker',
            icon: <IconCigarette />,
            active: currentFilters?.smoking === 'No',
            action: { smoking: 'No' }
        }
    ];

    // Filter out suggestions that are already active to keep the UI clean "Next Step" focused
    const visibleSuggestions = QUICK_SUGGESTIONS.filter(s => !s.active);

    return (
        <div className={`absolute inset-0 z-40 flex flex-col pointer-events-none transition-all duration-500 items-center ${!hasSearched ? 'justify-center' : 'justify-end pb-6'}`}>
            
            {/* Backdrop Gradient Blur - Only visible when floating at bottom */}
            {hasSearched && (
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#191919] dark:via-[#191919]/80 dark:to-transparent pointer-events-none backdrop-blur-[1px] z-0" />
            )}

            {/* Greeting / Branding - Only visible/centered when no search */}
            {!hasSearched && (
                <div className={`text-center mb-8 px-6 animate-fade-in pointer-events-auto relative z-10 ${hasBanner ? 'mt-24 md:mt-0' : ''}`}>
                    <div className="text-6xl mb-4">✨</div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Find your meaningful match</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Search by personality, interests, or vibe.</p>
                </div>
            )}

            {/* Search Field Container */}
            <div className={`
                w-full px-6 pointer-events-auto transition-all duration-700 ease-in-out flex flex-col items-center relative z-10
                ${hasSearched ? 'max-w-4xl' : 'max-w-6xl'}
            `}>
                {/* Floating Suggestions (Only when searched) */}
                {hasSearched && visibleSuggestions.length > 0 && !loadingMatches && (
                    <div className="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar py-1 px-1 justify-center animate-slide-up-fade w-full">
                        {visibleSuggestions.slice(0, 4).map((suggestion) => {
                            const locked = isLocked(suggestion.action);
                            const requiredTier = getRequiredTier(suggestion.action);
                            const lockColorClass = requiredTier === 'PRO' ? 'text-yellow-500 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-500';

                            return (
                                <button
                                    key={suggestion.id}
                                    onClick={() => {
                                        if (locked) {
                                            if (onShowSubscription) onShowSubscription();
                                        } else {
                                            if (onApplyQuickFilter) onApplyQuickFilter(suggestion.action);
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-gray-200 dark:border-zinc-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all text-[10px] font-semibold whitespace-nowrap active:scale-95 ${suggestion.className || ''} ${locked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}
                                    title={locked ? `Upgrade to ${requiredTier} to use this filter` : undefined}
                                >
                                    <span className="opacity-70 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3">{suggestion.icon}</span>
                                    {suggestion.label}
                                    {locked && <span className={`${lockColorClass} ml-0.5 flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5`}><IconLock /></span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className={`
                    w-full relative flex items-center gap-2 bg-white dark:bg-zinc-800 border rounded-[32px] p-1.5 transition-all duration-300 ease-out
                    ${hasSearched 
                        ? 'shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] border-gray-300 dark:border-zinc-600 scale-100' 
                        : 'shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] border-gray-200 dark:border-zinc-700'
                    }
                    focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.12)]
                `}>
                        {/* Filter Button (Internal) */}
                    <button 
                        onClick={() => {
                            if (isGuest && onAuthTrigger) {
                                onAuthTrigger();
                            } else {
                                onShowFilterModal();
                            }
                        }}
                        className={`ml-1 w-8 h-8 flex-none flex items-center justify-center rounded-full transition-all ${
                            hasActiveFilters 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                            : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700'
                        }`}
                        title="Filters"
                    >
                            <div className="transform scale-75">
                            <IconFilter />
                            </div>
                    </button>

                    <textarea 
                        className="w-full max-h-40 bg-transparent border-0 focus:ring-0 resize-none py-3 px-2 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-sm placeholder:font-normal focus:outline-none leading-relaxed text-sm font-sans overflow-hidden"
                        placeholder="Say something like I'm looking for someone who loves coffee, hikes and works in finance."
                        rows={1}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={handleTextareaClick}
                        onFocus={handleTextareaFocus}
                        style={{ minHeight: '44px' }}
                    />
                    
                    {/* SEND / STOP BUTTON */}
                    {loadingMatches ? (
                        <button 
                            onClick={handleStopSearch}
                            className="mr-1 w-8 h-8 flex-none flex items-center justify-center rounded-full transition-all duration-200 relative group"
                            title="Stop generating"
                        >
                            <span className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-zinc-600 opacity-50"></span>
                            <span className="absolute inset-0 rounded-full border-2 border-black dark:border-white border-t-transparent border-r-transparent border-l-transparent animate-spin"></span>
                            <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-[1px] transition-transform group-hover:scale-90"></div>
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if (isGuest && onAuthTrigger) {
                                    onAuthTrigger();
                                } else {
                                    handleSearch();
                                }
                            }}
                            disabled={!searchQuery.trim() && !isGuest}
                            className={`mr-1 w-8 h-8 flex-none flex items-center justify-center rounded-full transition-all duration-200
                                ${(!searchQuery.trim() && !isGuest) ? 'bg-transparent text-gray-300 dark:text-gray-600' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm'}
                            `}
                        >
                            <div className="transform scale-90"><IconSend /></div>
                        </button>
                    )}
                </div>
                
                {/* Active Filter Indicators */}
                {hasActiveFilters && (
                    <div className={`flex flex-wrap gap-1.5 mt-3 animate-fade-in items-center justify-center ${hasSearched ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm inline-flex' : 'px-2'}`}>
                        {activeFilterBadges.map((badge, idx) => (
                            <button 
                                key={idx} 
                                onClick={badge.onDismiss}
                                className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-medium border border-green-100 dark:border-green-900/30 flex items-center gap-1 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
                                title="Remove filter"
                            >
                                {badge.label}
                                <span className="opacity-60 group-hover:opacity-100 flex items-center justify-center [&>svg]:w-2 [&>svg]:h-2"><IconX /></span>
                            </button>
                        ))}
                        <button 
                            onClick={onClearFilters}
                            className="text-[10px] text-gray-400 hover:text-red-500 hover:underline ml-1.5"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Free Boost Available Container - Cylindrical, clean, no subtext */}
                {availableFreeBoosts > 0 && !isBoostActive && (
                    <div className={`mt-6 w-full max-w-md flex items-center justify-between p-1.5 pl-4 pr-1.5 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 shadow-sm animate-fade-in ${hasSearched ? 'hidden' : ''}`}>
                        <div className="flex items-center gap-2.5">
                            <div className="text-purple-600 dark:text-purple-400 animate-pulse">
                                <IconRocket className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                                {userTier === 'PRO' ? 'Weekly Boost Available' : 'Monthly Boost Available'}
                            </span>
                        </div>
                        <button 
                            onClick={onActivateFreeBoost}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-full shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                            Boost Now
                        </button>
                    </div>
                )}

                {/* Active Boost Timer Container */}
                {isBoostActive && boostEndTime && (
                    <div className={`mt-6 w-full max-w-md flex items-center justify-between p-1.5 pl-4 pr-4 rounded-full border border-purple-500/30 bg-purple-50 dark:bg-purple-900/20 shadow-sm animate-fade-in ${hasSearched ? 'hidden' : ''}`}>
                         <div className="flex items-center gap-2.5">
                            <div className="text-purple-600 dark:text-purple-400 animate-pulse">
                                <IconRocket className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                                Boost Active
                            </span>
                        </div>
                        <div className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                            {timeLeft}
                        </div>
                    </div>
                )}
            </div>

            {/* AI Suggestions (Landing State Only) */}
            {!hasSearched && (
                <div className="mt-8 w-full max-w-3xl px-4 animate-fade-in pointer-events-auto relative z-10">
                    <div className="text-center mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        Trending near you
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => {
                                    if (isGuest && onAuthTrigger) {
                                        onAuthTrigger();
                                    } else {
                                        handleSuggestionClick(suggestion);
                                    }
                                }}
                                className="px-6 py-2.5 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-zinc-500 hover:text-gray-900 dark:hover:text-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchArea;
