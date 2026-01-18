import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { changeLanguage } from '../../i18n';
import { Sun, Moon, Globe, LogOut, Menu, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'fr', label: 'Francais' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, language, setLanguage } = useUIStore();
  const navigate = useNavigate();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLanguageChange = (langCode: 'fr' | 'en' | 'ar') => {
    setLanguage(langCode);
    changeLanguage(langCode);
    setLangMenuOpen(false);
  };

  return (
    <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-500">TradeSense</span>
              <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">AI</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/pricing" className="text-gray-300 hover:text-white transition">
              {t('nav.pricing')}
            </Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition">
              {t('nav.leaderboard')}
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition">
                {t('nav.dashboard')}
              </Link>
            )}
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <Link to="/admin" className="text-gray-300 hover:text-white transition">
                {t('nav.admin')}
              </Link>
            ) : null}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2 text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                <Globe size={20} />
                <span className="text-xs uppercase">{language}</span>
                <ChevronDown size={14} className={`transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-dark-800 border border-dark-700 rounded-lg shadow-lg overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code as 'fr' | 'en' | 'ar')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition ${
                        language === lang.code ? 'text-primary-500 bg-dark-700/50' : 'text-gray-300'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-400 hover:text-white transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                  title={t('nav.logout')}
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
