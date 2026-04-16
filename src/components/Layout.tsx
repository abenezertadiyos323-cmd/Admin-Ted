import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg antialiased selection:bg-primary/30 scroll-smooth">
      {/* Scrollable Context */}
      <main className="pb-32">
        <Outlet />
      </main>

      {/* Persistent Navigation */}
      <BottomNav />
    </div>
  );
}
