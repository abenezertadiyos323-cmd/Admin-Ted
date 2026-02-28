import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Smartphone, Headphones } from 'lucide-react';
import { hapticLight } from '../lib/telegram';

const TAB_ROUTES = ['/', '/inventory', '/exchanges', '/inbox'];

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!TAB_ROUTES.includes(pathname)) return null;

  const handleToggle = () => {
    hapticLight();
    setOpen((prev) => !prev);
  };

  const handleAddPhone = () => {
    hapticLight();
    setOpen(false);
    navigate('/inventory/add?type=phone');
  };

  const handleAddAccessory = () => {
    hapticLight();
    setOpen(false);
    navigate('/inventory/add?type=accessory');
  };

  return (
    <>
      {/* FAB button — primary yellow, rotates to ✕ when open */}
      <button
        onClick={handleToggle}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
        style={{
          background: open ? 'var(--surface-2)' : 'var(--primary)',
          color:      open ? 'var(--muted)'     : 'var(--primary-foreground)',
          border:     open ? '1px solid var(--border)' : 'none',
          boxShadow:  open
            ? '0 4px 16px rgba(0,0,0,0.4)'
            : '0 4px 16px rgba(245,196,0,0.35)',
        }}
        aria-label="Add product"
      >
        <Plus
          size={24}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        />
      </button>

      {/* Action sheet */}
      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setOpen(false)}
            />

            {/* Bottom sheet */}
            <div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 animate-in slide-in-from-bottom duration-200"
              style={{
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              }}
            >
              {/* Drag handle */}
              <div
                className="w-10 h-1 rounded-full mx-auto mb-5"
                style={{ background: 'var(--border)' }}
              />

              <p
                className="text-xs font-semibold uppercase tracking-wider text-center mb-4"
                style={{ color: 'var(--muted)' }}
              >
                Add new item
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleAddPhone}
                  className="w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(245,196,0,0.12)', color: 'var(--primary)' }}
                  >
                    <Smartphone size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Add Phone</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Create a new phone listing</p>
                  </div>
                </button>

                <button
                  onClick={handleAddAccessory}
                  className="w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(148,163,184,0.12)', color: 'var(--muted)' }}
                  >
                    <Headphones size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Add Accessory</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Create a new accessory listing</p>
                  </div>
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
