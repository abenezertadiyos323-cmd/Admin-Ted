import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Smartphone, Headphones } from 'lucide-react';
import { hapticLight } from '../lib/telegram';

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
      {/* FAB button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] right-4 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
          open ? 'bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        aria-label="Add product"
      >
        <Plus
          size={24}
          className={`text-white transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          strokeWidth={2.5}
        />
      </button>

      {/* Action sheet — rendered at document.body so it overlays everything */}
      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />

            {/* Bottom sheet */}
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5 animate-in slide-in-from-bottom duration-200"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
                Add new item
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleAddPhone}
                  className="w-full flex items-center gap-4 bg-gray-50 hover:bg-blue-50 rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all"
                >
                  <span className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Smartphone size={22} className="text-blue-600" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Add Phone</p>
                    <p className="text-xs text-gray-400 mt-0.5">Create a new phone listing</p>
                  </div>
                </button>

                <button
                  onClick={handleAddAccessory}
                  className="w-full flex items-center gap-4 bg-gray-50 hover:bg-purple-50 rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition-all"
                >
                  <span className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Headphones size={22} className="text-purple-600" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Add Accessory</p>
                    <p className="text-xs text-gray-400 mt-0.5">Create a new accessory listing</p>
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
