import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Target, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [dailyGoal, setDailyGoal] = useState('2000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      let { data: profile, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // If maybeSingle() failed, it might be due to multiple profiles
        // Let's fetch all profiles and use the first one
        const { data: profiles, error: fetchError } = await supabase
          .from('users_profile')
          .select('*')
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;
        
        if (profiles && profiles.length > 0) {
          profile = profiles[0];
          console.warn('Multiple user profiles found, using the first one');
        }
      }

      if (!profile) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('users_profile')
          .insert({
            user_id: user.id,
            daily_calorie_goal: 2000,
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      }

      if (profile) {
        setDailyGoal(profile.daily_calorie_goal.toString());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users_profile')
        .upsert({
          user_id: user.id,
          daily_calorie_goal: parseInt(dailyGoal),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving profile:', error);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) console.error('Error signing out:', error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-900 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-gray-700 rounded-lg mr-3">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Profile</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-yellow-500 rounded-lg mr-3">
            <Target className="w-5 h-5 text-gray-900" />
          </div>
          <h3 className="text-lg font-semibold text-white">Daily Goals</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Calorie Goal
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                placeholder="2000"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              This is your target daily calorie intake
            </p>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-gray-700 rounded-lg mr-3">
            <SettingsIcon className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Account</h3>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center text-red-400 hover:text-red-300 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};