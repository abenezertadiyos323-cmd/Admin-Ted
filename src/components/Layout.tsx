import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FloatingActionButton from './FloatingActionButton';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content area — bottom padding accounts for nav bar + device safe area */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Outlet />
      </main>

      {/* Global FAB */}
      <FloatingActionButton />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
