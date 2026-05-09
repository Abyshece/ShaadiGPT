
import React from 'react';
import { PageHeader, InfoSection, Toggle } from './NotionUI';
import { IconSearch, IconZap, IconShield, IconUser, IconBook, IconHelpCircle } from '../constants';

const HelpCenter: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-[#191919]">
        <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in">
            <PageHeader title="Help Center" icon="❓" />

            <div className="grid gap-8">
                
                {/* Intro Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <IconBook /> Getting Started
                    </h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        Welcome to MatchGPT! We use advanced AI to help you find meaningful connections based on personality, values, and lifestyle compatibility—not just swipes.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
                            <div className="text-2xl mb-1">🎙️</div>
                            <h3 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400">Voice Profile</h3>
                            <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">Speak naturally to build your profile instantly.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
                            <div className="text-2xl mb-1">🔍</div>
                            <h3 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400">AI Search</h3>
                            <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">Search for exactly who you want using natural language.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
                            <div className="text-2xl mb-1">🛡️</div>
                            <h3 className="font-bold text-xs uppercase text-gray-500 dark:text-gray-400">Verified</h3>
                            <p className="text-xs text-gray-800 dark:text-gray-200 mt-1">Real people only. Phone & Voice verification required.</p>
                        </div>
                    </div>
                </div>

                {/* Search Mastery Section */}
                <InfoSection title="Search Mastery">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        The search bar is your most powerful tool. Instead of just filtering by age or location, describe the <strong>person</strong> you are looking for.
                    </p>
                    
                    <div className="grid gap-4">
                        <div className="border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Effective Prompts</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex gap-2">
                                    <span className="text-green-500">✓</span> 
                                    "Find a vegan yogi in Brooklyn who loves hiking"
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-green-500">✓</span> 
                                    "Looking for an ambitious lawyer who wants a big family"
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-green-500">✓</span> 
                                    "Show me introverted artists who drink coffee and hate smoking"
                                </li>
                            </ul>
                        </div>
                        
                        <div className="border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-lg p-4">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Avoid Vague Searches</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex gap-2">
                                    <span className="text-red-500">✕</span> 
                                    "Men" (Too broad, use filters instead)
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-500">✕</span> 
                                    "Someone nice" (Be more specific about traits)
                                </li>
                            </ul>
                        </div>
                    </div>
                </InfoSection>

                {/* FAQ Section */}
                <InfoSection title="Frequently Asked Questions">
                    <Toggle title="Is MatchGPT free to use?">
                        <p className="text-sm text-gray-600 dark:text-gray-300 pb-2">
                            Yes! You can create a profile, get verified, and receive daily matches for free. The Free plan includes 1 AI search per day and access to profiles in your current location. Upgrading to Plus or Pro unlocks unlimited search, travel mode, and more visibility.
                        </p>
                    </Toggle>
                    <Toggle title="How does the Compatibility Score work?">
                        <p className="text-sm text-gray-600 dark:text-gray-300 pb-2">
                            Our AI analyzes over 70 data points including values, lifestyle habits, future goals, and personality traits. It compares your profile against potential matches to calculate a percentage score representing how well you align on the things that matter for long-term relationships.
                        </p>
                    </Toggle>
                    <Toggle title="What are 'Standouts'?">
                        <p className="text-sm text-gray-600 dark:text-gray-300 pb-2">
                            Standouts are a curated selection of top profiles in your area that receive high engagement and have complete, high-quality profiles. This list refreshes daily. You can use a 'Super Like' to get their attention instantly.
                        </p>
                    </Toggle>
                    <Toggle title="How do I verify my profile?">
                        <p className="text-sm text-gray-600 dark:text-gray-300 pb-2">
                            Verification happens automatically during onboarding. We verify your phone number via SMS and analyze your voice intro to ensure you are a real person. Profiles without verification are hidden from search results after 72 hours.
                        </p>
                    </Toggle>
                    <Toggle title="Can I control who sees me?">
                        <p className="text-sm text-gray-600 dark:text-gray-300 pb-2">
                            Yes. MatchGPT Pro users can enable "Incognito Mode" in Settings. This hides your profile from everyone except the people you have explicitly liked or messaged.
                        </p>
                    </Toggle>
                </InfoSection>

                {/* Support Contact */}
                <div className="border-t border-gray-100 dark:border-zinc-800 pt-8 mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
                    <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold shadow-md hover:scale-105 transition-transform">
                        Contact Support
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};

export default HelpCenter;
