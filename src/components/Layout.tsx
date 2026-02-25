import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FloatingActionButton from './FloatingActionButton';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content area with bottom padding for nav */}
      <main className="flex-1 pb-16 overflow-y-auto">
        <Outlet />
      </main>

      {/* Global FAB */}
      <FloatingActionButton />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
