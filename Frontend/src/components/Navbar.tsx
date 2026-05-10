// frontend/src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, LayoutDashboard, Map, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="font-bold text-xl text-gray-800">SmartSeason</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/fields"
              className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition"
            >
              <Map className="h-5 w-5" />
              <span>Fields</span>
            </Link>

            <div className="flex items-center space-x-3 border-l pl-6 ml-2">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;