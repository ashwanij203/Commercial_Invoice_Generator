import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, PlusCircle,
  LogOut, ChevronLeft, ChevronRight, User, Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',           icon: LayoutDashboard, translationKey: 'dashboard',  exact: true },
  { to: '/invoices',   icon: FileText,        translationKey: 'invoices' },
  { to: '/customers',  icon: Users,           translationKey: 'customers' },
  { to: '/products',   icon: Package,         translationKey: 'products' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className={`
      h-full flex flex-col
      bg-gray-900 dark:bg-gray-950 text-white
      transition-all duration-300 ease-in-out border-r border-gray-800
      ${collapsed ? 'w-16' : 'w-60'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
          <Store size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <p className="text-sm font-bold leading-tight text-white tracking-wide">JAISWAL</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">Billing System</p>
          </div>
        )}
      </div>

      {/* New Invoice Button */}
      <div className="p-3">
        <button
          onClick={() => navigate('/invoices/new')}
          className={`w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl py-2 text-sm font-semibold shadow-md hover:shadow-brand-500/20 transform transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${collapsed ? 'justify-center px-2' : 'px-3'}`}
          title={t('newInvoice')}
        >
          <PlusCircle size={16} />
          {!collapsed && t('newInvoice')}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto mt-2">
        {navItems.map(({ to, icon: Icon, translationKey, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 translate-x-1'
                : 'text-gray-400 hover:text-white hover:bg-gray-800 hover:translate-x-1'}
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? t(translationKey) : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && t(translationKey)}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-700/50 p-2 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
            ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Profile' : ''}
        >
          <User size={16} className="flex-shrink-0" />
          {!collapsed && (
            <span className="truncate">{user?.name || 'Profile'}</span>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-gray-700 border border-gray-600 rounded-full items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
