import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, Languages } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed inset-y-0 left-0 z-30 print:hidden`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-60'} print:ml-0`}>
        {/* Top header */}
        <header className="glass-header px-4 py-3 flex items-center justify-between print:hidden">
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setMobileOpen(o => !o)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 md:block hidden animate-float">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Welcome back, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-primary">{user?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              title="Toggle Language"
            >
              <Languages size={18} />
              <span className="uppercase">{language}</span>
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 print:p-0 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
