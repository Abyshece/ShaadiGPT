import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { isAdminEmail } from '../lib/adminService';
import {
  IconSearch, IconHistory, IconHeart, IconMessageCircle, IconStar, IconUser,
  IconX, IconZap, IconLogOut, IconSettings, IconChevronLeft, IconChevronRight,
} from '../constants';

type Tab = 'search' | 'history' | 'likes' | 'matches' | 'standouts' | 'profile' | 'settings' | 'admin';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab | 'profile' | 'settings') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen, setIsOpen, isCollapsed, toggleCollapse,
  activeTab, onTabChange,
}) => {
  const { profile, signOut } = useAuth();
  const tier = profile?.subscriptionTier || 'FREE';
  const isAdmin = isAdminEmail(profile?.email);

  const SidebarItem = ({
    icon, label, id,
  }: { icon: React.ReactNode; label: string; id: Tab }) => (
    <div
      onClick={() => { onTabChange(id); setIsOpen(false); }}
      className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-1
        ${activeTab === id
          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200'}
        ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!isCollapsed && <span className="text-sm font-medium truncate animate-fade-in flex-1">{label}</span>}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`fixed md:relative z-[70] h-full bg-white dark:bg-[#191919] border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-60'}
        w-60`}
    >
      <div className={`relative flex items-center mb-6 pt-6 pb-2 ${isCollapsed ? 'justify-center px-3' : 'px-6'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 select-none w-full">
            <span className="flex-shrink-0 text-2xl">💍</span>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">ShaadiGPT</span>
          </div>
        ) : (
          <div onClick={toggleCollapse} className="text-2xl cursor-pointer">💍</div>
        )}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 mt-1.5 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded"
        >
          <IconX />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto overflow-x-hidden">
        <SidebarItem icon={<IconSearch />} label="Find Match" id="search" />
        <SidebarItem icon={<IconHistory />} label="Chat History" id="history" />
        <SidebarItem icon={<IconHeart />} label="Likes You" id="likes" />
        <SidebarItem icon={<IconMessageCircle />} label="Matches" id="matches" />
        <SidebarItem icon={<IconStar />} label="Standouts" id="standouts" />
        <SidebarItem icon={<IconUser />} label="My Profile" id="profile" />
        <SidebarItem icon={<IconSettings />} label="Settings" id="settings" />
        {isAdmin && (
          <>
            <div className={`my-3 mx-3 border-t border-gray-200 dark:border-zinc-800 ${isCollapsed ? '' : ''}`} />
            <SidebarItem
              icon={<span className="text-base">🛡️</span>}
              label="Admin"
              id="admin"
            />
          </>
        )}
      </nav>

      <div className="mt-auto pt-4 pb-4 px-3 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#191919]">
        <button
          onClick={toggleCollapse}
          className="hidden md:flex w-full items-center justify-center p-2 mb-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'gap-3'} mt-2`}>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{profile?.name || 'You'}</div>
              <div className="text-xs text-gray-400 truncate">{tier === 'FREE' ? 'Free plan' : 'Pro plan'}</div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center justify-center rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ${isCollapsed ? 'p-2 w-full' : 'p-2'}`}
            title="Sign out"
          >
            <IconLogOut />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
