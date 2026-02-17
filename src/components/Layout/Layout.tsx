import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, session } = useAuth();
  const displayUser = useMemo(
    () => ({
      name: user?.name || session?.user?.email || 'Account',
      farmName: user?.farmName || 'Farm',
      avatar: user?.avatar,
    }),
    [session?.user?.email, user?.avatar, user?.farmName, user?.name]
  );

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onToggleSidebar={toggleSidebar} user={displayUser} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <main className="flex-1 p-6 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;