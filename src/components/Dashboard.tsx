import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, Activity, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  caloriesConsumed: number;
  caloriesBurned: number;
  dailyGoal: number;
  netCalories: number;
}

interface Props {
  onAddFood: () => void;
  onAddActivity: () => void;
}

export const Dashboard: React.FC<Props> = ({ onAddFood, onAddActivity }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    caloriesConsumed: 0,
    caloriesBurned: 0,
    dailyGoal: 2000,
    netCalories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get user profile for daily goal
      const { data: profile } = await supabase
        .from('users_profile')
        .select('daily_calorie_goal')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get today's daily log
      const { data: dailyLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      const dailyGoal = profile?.daily_calorie_goal || 2000;
      const consumed = dailyLog?.total_calories_consumed || 0;
      const burned = dailyLog?.total_calories_burned || 0;

      setStats({
        caloriesConsumed: consumed,
        caloriesBurned: burned,
        dailyGoal,
        netCalories: consumed - burned,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }

    setLoading(false);
  };

  const progressPercentage = Math.min((stats.netCalories / stats.dailyGoal) * 100, 100);
  const remainingCalories = stats.dailyGoal - stats.netCalories;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Today's Progress</h1>
        <p className="text-gray-400 mt-1">{new Date().toLocaleDateString()} • {remainingCalories > 0 ? `${remainingCalories} calories remaining` : 'Goal reached!'}</p>
      </div>

      {/* Progress Circle */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="#374151"
                strokeWidth="3"
              />
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="#EAB308"
                strokeWidth="3"
                strokeDasharray={`${progressPercentage}, 100`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {remainingCalories > 0 ? remainingCalories : 0}
                </div>
                <div className="text-sm text-gray-400">calories left</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Target className="w-5 h-5 text-gray-900" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Daily Goal</p>
              <p className="text-2xl font-bold text-white">{stats.dailyGoal}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Consumed</p>
              <p className="text-2xl font-bold text-white">{stats.caloriesConsumed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Burned</p>
              <p className="text-2xl font-bold text-white">{stats.caloriesBurned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onAddFood}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-center">
            <Plus className="w-6 h-6 mr-2" />
            <span className="text-lg font-semibold">Log Food</span>
          </div>
        </button>

        <button
          onClick={onAddActivity}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-center">
            <Plus className="w-6 h-6 mr-2" />
            <span className="text-lg font-semibold">Log Activity</span>
          </div>
        </button>
      </div>
    </div>
  );
};