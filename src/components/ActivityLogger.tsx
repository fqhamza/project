import React, { useState, useEffect } from 'react';
import { Plus, Search, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Activity {
  id: string;
  name: string;
  calories_per_minute: number;
}

interface Props {
  onBack: () => void;
}

export const ActivityLogger: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add Activity Form State
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCalories, setNewActivityCalories] = useState('');

  // Log Activity State
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }

    setLoading(false);
  };

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          name: newActivityName,
          calories_per_minute: parseFloat(newActivityCalories),
        });

      if (error) throw error;

      // Reset form
      setNewActivityName('');
      setNewActivityCalories('');
      setShowAddForm(false);

      // Reload activities
      loadActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const logActivity = async () => {
    if (!user || !selectedActivity) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const totalCaloriesBurned = selectedActivity.calories_per_minute * parseFloat(duration);

      // Get or create daily log
      let { data: dailyLog, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (logError && logError.code === 'PGRST116') {
        // Create new daily log
        const { data: newLog, error: createError } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date: today,
            total_calories_consumed: 0,
            total_calories_burned: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        dailyLog = newLog;
      } else if (logError) {
        throw logError;
      }

      // Add activity entry
      const { error: entryError } = await supabase
        .from('activity_entries')
        .insert({
          user_id: user.id,
          daily_log_id: dailyLog.id,
          activity_id: selectedActivity.id,
          activity_name: selectedActivity.name,
          calories_burned: totalCaloriesBurned,
          duration_minutes: parseFloat(duration),
        });

      if (entryError) throw entryError;

      // Update daily log totals
      const { error: updateError } = await supabase
        .from('daily_logs')
        .update({
          total_calories_burned: dailyLog.total_calories_burned + totalCaloriesBurned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dailyLog.id);

      if (updateError) throw updateError;

      // Reset and go back
      setSelectedActivity(null);
      setDuration('');
      onBack();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (selectedActivity) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <button
            onClick={() => setSelectedActivity(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Log {selectedActivity.name}</h2>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="30"
                required
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Calories Burned</h3>
              <p className="text-gray-600">
                {duration && !isNaN(parseFloat(duration)) ? (
                  <>
                    {parseFloat(duration)} minutes × {selectedActivity.calories_per_minute} calories/min = {' '}
                    <span className="font-bold text-blue-600">
                      {(selectedActivity.calories_per_minute * parseFloat(duration)).toFixed(0)} calories
                    </span>
                  </>
                ) : (
                  'Enter duration to see calories burned'
                )}
              </p>
            </div>

            <button
              onClick={logActivity}
              disabled={!duration || isNaN(parseFloat(duration))}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Log Activity
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Activity Logger</h2>
            <p className="text-gray-400">Select an activity to log or add new ones</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Activity
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search activities..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
        />
      </div>

      {/* Activity List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredActivities.map(activity => (
          <div
            key={activity.id}
            onClick={() => setSelectedActivity(activity)}
            className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700 hover:shadow-md hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                  <Zap className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{activity.name}</h3>
                  <p className="text-sm text-gray-400">
                    {activity.calories_per_minute} cal/min
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No activities found. Add some to get started!</p>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add New Activity</h3>
            <form onSubmit={addActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Activity Name
                </label>
                <input
                  type="text"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                  placeholder="e.g., Running, Walking, Cycling"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Calories per Minute
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newActivityCalories}
                  onChange={(e) => setNewActivityCalories(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                  placeholder="10"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};