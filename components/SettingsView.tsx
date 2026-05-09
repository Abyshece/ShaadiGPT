import React, { useState } from 'react';
import { PageHeader, InfoSection, Button } from './NotionUI';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/useToast';
import { updateSettings, softDeleteAccount } from '../lib/profileService';
import {
  IconMoon, IconSun, IconUser, IconLogOut, IconChevronRight, IconTrash, IconX,
} from '../constants';
import type { UserSettings } from '../types';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate?: (tab: string) => void;
}

const DELETE_REASONS = [
  'I met someone on ShaadiGPT',
  `I'm not happy with the matches`,
  'I need a break from dating',
  'Privacy concerns',
  'Other',
];

const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, onToggleDarkMode, onNavigate }) => {
  const { profile, settings, session, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'REASON' | 'CONFIRM'>('REASON');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!settings || !profile) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>;
  }

  const updateOne = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!session?.user.id) return;
    const next = { ...settings, [key]: value };
    const result = await updateSettings(session.user.id, next);
    if (result.error) {
      showToast(`Couldn't save: ${result.error}`, 'error');
      return;
    }
    await refreshProfile();
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteStep('REASON');
    setDeleteReason('');
    setDeleteConfirmationInput('');
  };

  const handleFinalDelete = async () => {
    if (!session?.user.id) return;
    if (deleteConfirmationInput !== 'Delete') return;
    setDeleting(true);
    const result = await softDeleteAccount(session.user.id);
    setDeleting(false);
    if (result.error) {
      showToast(`Couldn't delete: ${result.error}`, 'error');
      return;
    }
    setShowDeleteModal(false);
    showToast('Account deleted', 'success');
  };

  const SettingsToggle = ({
    label, description, checked, onChange,
  }: { label: string; description?: string; checked: boolean; onChange: (val: boolean) => void }) => (
    <div
      className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-zinc-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800/30 px-2 rounded transition-colors cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${checked ? 'left-6' : 'left-1'}`} />
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto relative">
      <div className="max-w-3xl mx-auto py-12 px-6 animate-fade-in">
        <PageHeader title="Settings & Preferences" />

        <div className="space-y-8">
          <InfoSection title="Account">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-500">
                  <IconUser />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{profile.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
                </div>
              </div>
              <Button variant="secondary" className="text-xs h-8" onClick={() => onNavigate?.('profile')}>Edit Profile</Button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between py-3 border-b border-gray-50 dark:border-zinc-800/50 px-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Phone</span>
                <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{profile.phoneNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50 dark:border-zinc-800/50 px-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Plan</span>
                <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{profile.subscriptionTier || 'FREE'}</span>
              </div>
            </div>
          </InfoSection>

          <InfoSection title="Privacy & Visibility">
            <SettingsToggle label="Incognito Mode" description="Only show my profile to people I've liked." checked={settings.incognito} onChange={(v) => updateOne('incognito', v)} />
            <SettingsToggle label="Active Status" description="Show when you are online." checked={settings.showOnline} onChange={(v) => updateOne('showOnline', v)} />
            <SettingsToggle label="Read Receipts" description="Let matches know when you've read messages." checked={settings.readReceipts} onChange={(v) => updateOne('readReceipts', v)} />
          </InfoSection>

          <InfoSection title="Notifications">
            <SettingsToggle label="Push Notifications" checked={settings.pushNotifs} onChange={(v) => updateOne('pushNotifs', v)} />
            <SettingsToggle label="Email Digests" description="Weekly summary of profile activity." checked={settings.emailNotifs} onChange={(v) => updateOne('emailNotifs', v)} />
          </InfoSection>

          <InfoSection title="Appearance">
            <div
              className="flex items-center justify-between py-3 px-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors"
              onClick={onToggleDarkMode}
            >
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {isDarkMode ? <IconMoon /> : <IconSun />} {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </h4>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isDarkMode ? 'bg-black border border-white/20' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${isDarkMode ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </InfoSection>

          <InfoSection title="Support">
            <button
              onClick={() => onNavigate?.('help')}
              className="w-full flex items-center justify-between py-3 px-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/30 rounded text-left"
            >
              <span>Help Center</span>
              <IconChevronRight />
            </button>
          </InfoSection>

          <div className="pt-8 border-t border-gray-100 dark:border-zinc-800 mt-8">
            <button
              onClick={signOut}
              className="w-full py-3 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 mb-4 flex items-center justify-center gap-2"
            >
              <IconLogOut /> Sign Out
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-full py-3 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Delete Account
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">ShaadiGPT • v0.3</p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-white/65 backdrop-blur-[10px] animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 border border-gray-200 dark:border-zinc-800 relative">
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white"><IconX /></button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4"><IconTrash /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Account</h3>
            </div>

            {deleteStep === 'REASON' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                  We're sorry to see you go. Please tell us why:
                </p>
                <div className="space-y-2">
                  {DELETE_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        deleteReason === reason
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'
                          : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deleteReason"
                        value={reason}
                        checked={deleteReason === reason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{reason}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1 justify-center">Cancel</Button>
                  <Button
                    onClick={() => setDeleteStep('CONFIRM')}
                    disabled={!deleteReason}
                    className="flex-1 justify-center"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-lg text-sm text-red-800 dark:text-red-200">
                  <p className="font-bold mb-1">Warning: This is irreversible.</p>
                  <p>Your profile, photos, matches, and messages will be permanently removed.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Type "Delete" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    placeholder="Delete"
                    className="w-full border border-gray-300 dark:border-zinc-700 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1 justify-center">Cancel</Button>
                  <Button
                    onClick={handleFinalDelete}
                    disabled={deleteConfirmationInput !== 'Delete' || deleting}
                    className="flex-1 justify-center bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/50 disabled:cursor-not-allowed border-none shadow-md"
                  >
                    {deleting ? 'Deleting…' : 'Permanently Delete'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
