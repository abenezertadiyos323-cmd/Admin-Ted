import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { 
  Send, 
  ChevronLeft, 
  MoreVertical, 
  Check, 
  CheckCheck,
  Package,
  ArrowRight,
  Circle,
  Clock,
  User,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ThreadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const thread = useQuery(api.threads.getThreadById, {
    threadId: id as Id<'threads'>,
  });
  const messages = useQuery(api.messages.listMessages, {
    threadId: id as Id<'threads'>,
  });

  const sendAdminMessage = useMutation(api.messages.sendAdminMessage);
  const updateThreadStatus = useMutation(api.threads.updateThreadStatus);
  const markAsRead = useMutation(api.threads.markAsRead);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when entering
  useEffect(() => {
    if (id) {
      markAsRead({ threadId: id as Id<'threads'> });
    }
  }, [id, markAsRead]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!reply.trim() || isSending || !id) return;

    setIsSending(true);
    try {
      await sendAdminMessage({
        threadId: id as Id<'threads'>,
        text: reply.trim(),
        adminName: 'Admin', // In a real app, this would be the actual admin name
      });
      setReply('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: 'seen' | 'done') => {
    if (!id) return;
    try {
      await updateThreadStatus({
        threadId: id as Id<'threads'>,
        status,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (thread === undefined || messages === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Conversation not found</h1>
        <button 
          onClick={() => navigate('/inbox')}
          className="text-primary font-bold"
        >
          Back to Inbox
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <header className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inbox')} className="p-1 -ml-2 text-muted active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-bold leading-none mb-1">
              {thread.customerFirstName} {thread.customerLastName || ''}
            </h1>
            <p className="text-[10px] text-muted font-mono leading-none">
              @{thread.customerUsername || 'no-username'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {thread.status !== 'done' ? (
            <button 
              onClick={() => handleStatusChange('done')}
              className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-transform"
            >
              Close
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border opacity-60">
              <CheckCircle size={12} className="text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-muted">Archived</span>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <div className="text-center py-6">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted/40">
            Conversation Started {new Date(thread.createdAt).toLocaleDateString()}
          </p>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'admin';
          const isBot = msg.senderRole === 'bot';
          
          return (
            <div 
              key={msg._id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm relative ${
                  isMe 
                    ? 'bg-primary text-primary-fg rounded-tr-none' 
                    : isBot
                    ? 'bg-surface-2 border border-blue-500/20 text-text rounded-tl-none'
                    : 'bg-surface border border-border text-text rounded-tl-none'
                }`}
              >
                {isBot && (
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1 select-none">Automated Reply</p>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className={`text-[9px] opacity-60 font-mono ${isMe ? 'text-primary-fg' : 'text-muted'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckCheck size={10} className="text-primary-fg/60" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-surface border-t border-border pb-safe">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={isSending}
            placeholder="Type a message..."
            className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!reply.trim() || isSending}
            className="w-12 h-12 bg-primary text-primary-fg rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}

function CheckCircle({ size, className }: { size: number; className?: string }) {
  return <CheckCircle2 size={size} className={className} />;
}
import { CheckCircle2 } from 'lucide-react';
