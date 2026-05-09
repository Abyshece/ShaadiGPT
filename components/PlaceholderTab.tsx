import React from 'react';

interface PlaceholderTabProps {
  title: string;
  emoji: string;
  comingIn: string;
  description: string;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, emoji, comingIn, description }) => (
  <div className="h-full flex items-center justify-center bg-white dark:bg-[#191919]">
    <div className="max-w-md text-center px-6">
      <div className="text-6xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-xs font-bold text-blue-700 dark:text-blue-300">
        Coming in {comingIn}
      </div>
    </div>
  </div>
);

export default PlaceholderTab;
