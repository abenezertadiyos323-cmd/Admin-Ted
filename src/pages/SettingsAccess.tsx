import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Search,
  X
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsAccess() {
  const admins = useQuery(api.admin.listAdmins);
  const addAdmin = useMutation(api.admin.addAdmin);
  const removeAdmin = useMutation(api.admin.removeAdmin);

  const [newTelegramId, setNewTelegramId] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTelegramId || !newName) return;

    setIsAdding(true);
    setError(null);
    try {
      await addAdmin({
        telegramId: newTelegramId.trim(),
        firstName: newName.trim(),
      });
      setNewTelegramId('');
      setNewName('');
    } catch (err) {
      setError("Failed to add admin. ID might already exist.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (telegramId: string) => {
    if (!confirm(`Remove admin ${telegramId}?`)) return;
    try {
      await removeAdmin({ telegramId });
    } catch (err) {
      console.error(err);
    }
  };

  if (admins === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Authorized Admins" backTo="/settings" />

      <div className="p-4 space-y-6">
        {/* Add New Admin Form */}
        <div className="p-5 bg-surface border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={18} className="text-primary" />
            <h2 className="text-sm font-bold">Add Authorized Account</h2>
          </div>
          
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <form onSubmit={handleAdd} className="space-y-3">
            <input 
              type="text"
              placeholder="Telegram User ID (e.g. 12345678)"
              value={newTelegramId}
              onChange={(e) => setNewTelegramId(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <input 
              type="text"
              placeholder="First Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button 
              type="submit"
              disabled={isAdding || !newTelegramId || !newName}
              className="w-full py-3 bg-primary text-primary-fg rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Authorize Account
            </button>
          </form>
        </div>

        {/* Admin List */}
        <div className="space-y-3">
          <h3 className="px-1 text-[10px] font-black uppercase tracking-widest text-muted/60">Authorized Users ({admins.length})</h3>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div 
                key={admin.telegramId}
                className="p-4 bg-surface border border-border rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${admin.isActive ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {admin.isActive ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{admin.firstName} {admin.lastName || ''}</p>
                    <p className="text-[10px] text-muted font-mono">{admin.telegramId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(admin.telegramId)}
                  className="p-2 text-muted hover:text-red-500 active:scale-90 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-surface-2 rounded-xl border border-border">
          <p className="text-[10px] text-muted leading-relaxed">
            <span className="font-bold text-primary">Note:</span> Only accounts listed here can access the Admin Dashboard. New admins must open the mini-app via Telegram to initialize their session once added.
          </p>
        </div>
      </div>
    </div>
  );
}
