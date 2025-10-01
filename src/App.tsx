import React, { useState } from 'react';
import { Home, BookOpen, Calendar, Settings, Zap } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { FoodLogger } from './components/FoodLogger';
import { ActivityLogger } from './components/ActivityLogger';
import { FoodLibrary } from './components/FoodLibrary';
import { Settings as SettingsComponent } from './components/Settings';
import { DailyLogHistory } from './components/DailyLogHistory';

type View = 'dashboard' | 'food-logger' | 'activity-logger' | 'food-library' | 'settings' | 'history';

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onAddFood={() => setCurrentView('food-logger')}
            onAddActivity={() => setCurrentView('activity-logger')}
          />
        );
      case 'food-logger':
        return <FoodLogger onBack={() => setCurrentView('dashboard')} />;
      case 'activity-logger':
        return <ActivityLogger onBack={() => setCurrentView('dashboard')} />;
      case 'food-library':
        return <FoodLibrary />;
      case 'history':
        return <DailyLogHistory />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return (
          <Dashboard
            onAddFood={() => setCurrentView('food-logger')}
            onAddActivity={() => setCurrentView('activity-logger')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <main className="pb-20 md:pb-0 md:pl-64">
          {renderCurrentView()}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="grid grid-cols-4 py-2">
            {[
              { id: 'dashboard', icon: Home, label: 'Home' },
              { id: 'food-library', icon: BookOpen, label: 'Foods' },
              { id: 'history', icon: Calendar, label: 'History' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id as View)}
                className={`flex flex-col items-center py-2 px-1 ${
                  currentView === id
                    ? 'text-yellow-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 bg-gray-800 overflow-y-auto border-r border-gray-700">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 rounded-xl mr-3">
                  <Zap className="w-8 h-8 text-gray-900" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Calorie Tracker</h1>
                  <p className="text-sm text-gray-400">Stay healthy & fit</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {[
                  { id: 'dashboard', icon: Home, label: 'Dashboard' },
                  { id: 'food-library', icon: BookOpen, label: 'Food Library' },
                  { id: 'history', icon: Calendar, label: 'History' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setCurrentView(id as View)}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentView === id
                        ? 'bg-yellow-500 text-gray-900'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        currentView === id ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;