import React from 'react';
import { Home, Map, Bell, User } from 'lucide-react';

const BottomNav = ({ currentTab, onSelectTab, unreadCount = 0 }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'heatmap', label: 'Map', icon: Map },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-tg-surface/95 dark:bg-tg-surface-dark/95 backdrop-blur-lg border-t border-black/5 dark:border-white/10 pb-safe transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-all focus:outline-none"
              aria-label={item.label}
            >
              {/* Active Indicator dot */}
              {isActive && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-brand-green" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? 'text-brand-green scale-110'
                      : 'text-tg-muted dark:text-tg-muted-dark hover:text-tg-text'
                  }`}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-risk-high text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-tg-surface dark:ring-tg-surface-dark">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] mt-1 font-medium tracking-tight ${
                  isActive
                    ? 'text-brand-green font-semibold'
                    : 'text-tg-muted dark:text-tg-muted-dark'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
