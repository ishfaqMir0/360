import React, { useState, useRef, useEffect } from 'react';
import { User, Menu, Edit, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  user: { name: string; farmName: string; avatar?: string };
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm"></span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AppleKul Suite</h1>
          </div>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.farmName}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-green-600" />
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.farmName}</p>
                </div>
              </div>
              
              <button
                onClick={handleEditProfile}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-3 text-gray-500" />
                Edit Profile
              </button>
              
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-3 text-gray-500" />
                Settings
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;