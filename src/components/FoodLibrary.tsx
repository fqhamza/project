import React, { useState, useEffect } from 'react';
import { Search, Utensils, Plus, Trash2, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Food {
  id: string;
  name: string;
  calories_per_serving: number;
  serving_size: string;
  category: string;
}

export const FoodLibrary: React.FC = () => {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    serving: 'serving',
    category: 'Breakfast',
  });

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Other'];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const foodData = {
        user_id: user.id,
        name: formData.name,
        calories_per_serving: parseFloat(formData.calories),
        serving_size: formData.serving,
        category: formData.category,
      };

      if (editingFood) {
        const { error } = await supabase
          .from('foods')
          .update(foodData)
          .eq('id', editingFood.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('foods')
          .insert(foodData);
        if (error) throw error;
      }

      // Reset form
      setFormData({
        name: '',
        calories: '',
        serving: 'serving',
        category: 'Breakfast',
      });
      setShowAddForm(false);
      setEditingFood(null);

      // Reload foods
      loadFoods();
    } catch (error) {
      console.error('Error saving food:', error);
    }
  };

  const handleEdit = (food: Food) => {
    setFormData({
      name: food.name,
      calories: food.calories_per_serving.toString(),
      serving: food.serving_size,
      category: food.category,
    });
    setEditingFood(food);
    setShowAddForm(true);
  };

  const handleDelete = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food?')) return;

    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', foodId);

      if (error) throw error;
      loadFoods();
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-900 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Food Library</h2>
          <p className="text-gray-400">Manage your personal food database</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              calories: '',
              serving: 'serving',
              category: 'Breakfast',
            });
            setEditingFood(null);
            setShowAddForm(true);
          }}
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

      {/* Food Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map(food => (
          <div
            key={food.id}
            className="bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-700 hover:shadow-md hover:border-gray-600 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                  <Utensils className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{food.name}</h3>
                  <p className="text-sm text-gray-400">{food.category}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(food)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleDelete(food.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">{food.calories_per_serving}</p>
              <p className="text-sm text-gray-400">calories/{food.serving_size}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="text-center py-12">
          <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {foods.length === 0 
              ? 'No foods in your library yet. Add some to get started!'
              : 'No foods match your search criteria.'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Food Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingFood ? 'Edit Food' : 'Add New Food'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Food Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
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
                  value={formData.serving}
                  onChange={(e) => setFormData({ ...formData, serving: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-400"
                  placeholder="serving, cup, piece, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingFood(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {editingFood ? 'Update' : 'Add'} Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};