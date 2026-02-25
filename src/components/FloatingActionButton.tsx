import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Smartphone, Headphones, X } from 'lucide-react';
import { hapticLight } from '../lib/telegram';

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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
    <div ref={menuRef} className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {/* Action Sheet */}
      {open && (
        <div className="flex flex-col gap-2 mb-1 animate-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={handleAddAccessory}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-lg px-4 py-3 text-sm font-medium text-gray-800 border border-gray-100 active:scale-95 transition-transform"
          >
            <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Headphones size={16} className="text-purple-600" />
            </span>
            Add Accessory
          </button>
          <button
            onClick={handleAddPhone}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-lg px-4 py-3 text-sm font-medium text-gray-800 border border-gray-100 active:scale-95 transition-transform"
          >
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Smartphone size={16} className="text-blue-600" />
            </span>
            Add Phone
          </button>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-90 ${
          open
            ? 'bg-gray-800 rotate-45'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <Plus size={24} className="text-white" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}
