import React, { useState, useEffect } from 'react';
import { Plus, Search, Utensils, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Food {
  id: string;
  name: string;
  calories_per_serving: number;
  serving_size: string;
  category: string;
}

interface Props {
  onBack: () => void;
}

export const FoodLogger: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add Food Form State
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodServing, setNewFoodServing] = useState('serving');
  const [newFoodCategory, setNewFoodCategory] = useState('Breakfast');

  // Log Food State
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [portions, setPortions] = useState('1');
  const [mealType, setMealType] = useState('Breakfast');

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Other'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  useEffect(() => {
    if (user) {
      loadFoods();
    }
  }, [user]);

  const loadFoods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      console.error('Error loading foods:', error);
    }

    setLoading(false);
  };

  const addFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('foods')
        .insert({
          user_id: user.id,
          name: newFoodName,
          calories_per_serving: parseFloat(newFoodCalories),
          serving_size: newFoodServing,
          category: newFoodCategory,
        });

      if (error) throw error;

      // Reset form
      setNewFoodName('');
      setNewFoodCalories('');
      setNewFoodServing('serving');
      setNewFoodCategory('Breakfast');
      setShowAddForm(false);

      // Reload foods
      loadFoods();
    } catch (error) {
      console.error('Error adding food:', error);
    }
  };

  const logFood = async () => {
    if (!user || !selectedFood) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const totalCalories = selectedFood.calories_per_serving * parseFloat(portions);

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

      // Add food entry
      const { error: entryError } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          daily_log_id: dailyLog.id,
          food_id: selectedFood.id,
          food_name: selectedFood.name,
          calories: totalCalories,
          portions: parseFloat(portions),
          meal_type: mealType,
        });

      if (entryError) throw entryError;

      // Update daily log totals
      const { error: updateError } = await supabase
        .from('daily_logs')
        .update({
          total_calories_consumed: dailyLog.total_calories_consumed + totalCalories,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dailyLog.id);

      if (updateError) throw updateError;

      // Reset and go back
      setSelectedFood(null);
      setPortions('1');
      onBack();
    } catch (error) {
      console.error('Error logging food:', error);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (selectedFood) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <button
            onClick={() => setSelectedFood(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Log {selectedFood.name}</h2>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portions
              </label>
              <input
                type="number"
                step="0.1"
                value={portions}
                onChange={(e) => setPortions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {mealTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-600">
                {parseFloat(portions)} × {selectedFood.calories_per_serving} calories = {' '}
                <span className="font-bold text-emerald-600">
                  {(selectedFood.calories_per_serving * parseFloat(portions)).toFixed(0)} calories
                </span>
              </p>
            </div>

            <button
              onClick={logFood}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Log Food
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
            <h2 className="text-2xl font-bold text-white">Food Logger</h2>
            <p className="text-gray-400">Select a food to log or add new ones</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Food
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search foods..."
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Food List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFoods.map(food => (
          <div
            key={food.id}
            onClick={() => setSelectedFood(food)}
            className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700 hover:shadow-md hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                  <Utensils className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{food.name}</h3>
                  <p className="text-sm text-gray-400">{food.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{food.calories_per_serving}</p>
                <p className="text-sm text-gray-400">calories/{food.serving_size}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="text-center py-12">
          <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No foods found. Add some to get started!</p>
        </div>
      )}

      {/* Add Food Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Add New Food</h3>
            <form onSubmit={addFood} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Food Name
                </label>
                <input
                  type="text"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                  placeholder="e.g., Grilled Chicken Breast"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Calories per Serving
                </label>
                <input
                  type="number"
                  value={newFoodCalories}
                  onChange={(e) => setNewFoodCalories(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                  placeholder="250"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serving Size
                </label>
                <input
                  type="text"
                  value={newFoodServing}
                  onChange={(e) => setNewFoodServing(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                  placeholder="serving, cup, piece, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newFoodCategory}
                  onChange={(e) => setNewFoodCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
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
                  Add Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};