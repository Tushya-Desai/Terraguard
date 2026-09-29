import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import HeatmapView from './pages/HeatmapView';
import NotificationsView from './pages/NotificationsView';
import ProfileView from './pages/ProfileView';
import Login from './pages/Login';
import Signup from './pages/Signup';
import api from './api/client';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'heatmap', 'notifications', 'profile'
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const refreshNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications');
      const unread = response.data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Could not fetch notifications count:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    }
  }, [isAuthenticated, currentTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tg-bg dark:bg-tg-bg-dark">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-tg-muted dark:text-tg-muted-dark">Loading TerraGuard...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  // Authenticated Main Application Flow
  return (
    <div className="min-h-screen bg-tg-bg dark:bg-tg-bg-dark text-tg-text dark:text-tg-text-dark flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        unreadCount={unreadCount}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        currentTab={currentTab}
      />

      {/* Main Page Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentTab === 'dashboard' && (
          <Dashboard onRefreshNotifications={refreshNotifications} />
        )}
        {currentTab === 'heatmap' && <HeatmapView />}
        {currentTab === 'notifications' && (
          <NotificationsView onNotificationRead={refreshNotifications} />
        )}
        {currentTab === 'profile' && <ProfileView />}
      </main>

      {/* Mobile-First Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        unreadCount={unreadCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
