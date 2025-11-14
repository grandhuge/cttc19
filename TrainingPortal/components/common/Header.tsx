import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

const Header: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} className="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium">
      {children}
    </Link>
  );

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to={userProfile?.role === 'admin' ? '/admin' : '/'} className="flex-shrink-0 flex items-center">
              <img className="h-10 w-auto" src="/img/logo.png" alt="Logo" />
              <span className="ml-3 text-xl font-bold text-gray-800 dark:text-gray-200">{t('header.title')}</span>
            </Link>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {currentUser && userProfile?.role === 'user' && <NavLink to="/">{t('header.dashboard')}</NavLink>}
                {currentUser && userProfile?.role === 'admin' && <NavLink to="/admin">{t('header.adminDashboard')}</NavLink>}
              </div>
            </nav>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            {currentUser && userProfile && (
              <div className="ml-4 relative">
                <div>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="max-w-xs bg-gray-100 dark:bg-gray-700 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-700 focus:ring-primary-500" id="user-menu" aria-haspopup="true">
                    <span className="sr-only">Open user menu</span>
                     <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        {userProfile.name ? userProfile.name.charAt(0) : userProfile.email.charAt(0).toUpperCase()}
                     </div>
                  </button>
                </div>
                {menuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-600">
                      <p className="font-semibold">{userProfile.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
                    </div>
                    {userProfile.role === 'user' && (
                        <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">{t('header.yourProfile')}</Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                      {t('header.signOut')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;