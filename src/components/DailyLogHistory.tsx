import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Utensils, Zap, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DailyLog {
  id: string;
  date: string;
  total_calories_consumed: number;
  total_calories_burned: number;
}

interface FoodEntry {
  id: string;
  food_name: string;
  calories: number;
  portions: number;
  meal_type: string;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  activity_name: string;
  calories_burned: number;
  duration_minutes: number;
  created_at: string;
}

export const DailyLogHistory: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDailyData();
    }
  }, [user, selectedDate]);

  const loadDailyData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get daily log
      const { data: logData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .maybeSingle();

      setDailyLog(logData);

      if (logData) {
        // Get food entries
        const { data: foodData } = await supabase
          .from('food_entries')
          .select('*')
          .eq('daily_log_id', logData.id)
          .order('created_at', { ascending: true });

        // Get activity entries
        const { data: activityData } = await supabase
          .from('activity_entries')
          .select('*')
          .eq('daily_log_id', logData.id)
          .order('created_at', { ascending: true });

        setFoodEntries(foodData || []);
        setActivityEntries(activityData || []);
      } else {
        setFoodEntries([]);
        setActivityEntries([]);
      }
    } catch (error) {
      console.error('Error loading daily data:', error);
    }

    setLoading(false);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupFoodsByMealType = (foods: FoodEntry[]) => {
    const groups: { [key: string]: FoodEntry[] } = {};
    foods.forEach(food => {
      if (!groups[food.meal_type]) {
        groups[food.meal_type] = [];
      }
      groups[food.meal_type].push(food);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-900 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  const totalConsumed = dailyLog?.total_calories_consumed || 0;
  const totalBurned = dailyLog?.total_calories_burned || 0;
  const netCalories = totalConsumed - totalBurned;
  const groupedFoods = groupFoodsByMealType(foodEntries);

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Daily History</h2>
          <p className="text-gray-400">View your daily food and activity logs</p>
        </div>
        <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-700 rounded-l-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="px-4 py-2 border-x border-gray-700">
            <div className="flex items-center text-white">
              <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="font-medium">{formatDate(selectedDate)}</span>
            </div>
          </div>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-700 rounded-r-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Consumed</p>
              <p className="text-2xl font-bold text-white">{totalConsumed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Burned</p>
              <p className="text-2xl font-bold text-white">{totalBurned}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-900" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Net Calories</p>
              <p className={`text-2xl font-bold ${netCalories > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netCalories > 0 ? '+' : ''}{netCalories}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Food Entries */}
      {Object.keys(groupedFoods).length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Utensils className="w-5 h-5 mr-2 text-green-500" />
            Food Entries
          </h3>
          <div className="space-y-4">
            {Object.entries(groupedFoods).map(([mealType, foods]) => (
              <div key={mealType}>
                <h4 className="font-medium text-yellow-500 mb-2">{mealType}</h4>
                <div className="space-y-2">
                  {foods.map(food => (
                    <div key={food.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div>
                        <p className="text-white font-medium">{food.food_name}</p>
                        <p className="text-sm text-gray-400">{food.portions} portion(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{food.calories}</p>
                        <p className="text-sm text-gray-400">calories</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Entries */}
      {activityEntries.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-500" />
            Activity Entries
          </h3>
          <div className="space-y-2">
            {activityEntries.map(activity => (
              <div key={activity.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{activity.activity_name}</p>
                    <p className="text-sm text-gray-400">{activity.duration_minutes} minutes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{activity.calories_burned}</p>
                  <p className="text-sm text-gray-400">calories burned</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!dailyLog && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No data recorded for this date</p>
          <p className="text-sm text-gray-500 mt-1">Start logging your meals and activities!</p>
        </div>
      )}
    </div>
  );
};