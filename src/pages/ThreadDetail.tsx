import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeftRight, ChevronLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { getTelegramUser } from '../lib/telegram';
import { formatTime, formatDate, getCustomerName, formatETB } from '../lib/utils';
import type { Message, Exchange } from '../types';

// Avatar palette — same as ThreadCard for consistency
const AVATAR_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#DC2626',
  '#0891B2',
];

function getExchangeStatusDark(status: string): { background: string; color: string } {
  switch (status) {
    case 'Pending':   return { background: 'rgba(59,130,246,0.15)',  color: '#60A5FA' };
    case 'Quoted':    return { background: 'rgba(139,92,246,0.15)',  color: '#A78BFA' };
    case 'Accepted':  return { background: 'rgba(245,196,0,0.15)',   color: '#F5C400' };
    case 'Completed': return { background: 'rgba(16,185,129,0.15)',  color: '#34D399' };
    case 'Rejected':  return { background: 'rgba(239,68,68,0.15)',   color: '#F87171' };
    default:          return { background: 'rgba(148,163,184,0.12)', color: '#94A3B8' };
  }
}

function getThreadStatusDark(status: string): { background: string; color: string } {
  switch (status) {
    case 'new':  return { background: 'rgba(59,130,246,0.15)',  color: '#60A5FA' };
    case 'seen': return { background: 'rgba(148,163,184,0.12)', color: '#94A3B8' };
    default:     return { background: 'rgba(16,185,129,0.15)',  color: '#34D399' };
  }
}

export default function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getTelegramUser();

  const thread = useQuery(api.threads.getThread, id ? { threadId: id as Id<'threads'> } : 'skip');
  const messages = useQuery(api.threads.listThreadMessages, id ? { threadId: id as Id<'threads'> } : 'skip') ?? [];
  const exchanges = (useQuery(api.exchanges.listExchangesByThread, id ? { threadId: id as Id<'threads'> } : 'skip') ?? []) as Exchange[];

  const createAdminMessage = useMutation(api.messages.createAdminMessage);
  const markSeenMutation = useMutation(api.threads.markThreadSeen);

  const markedSeen = useRef(false);
  useEffect(() => {
    if (!markedSeen.current && thread && thread.status === 'new') {
      markedSeen.current = true;
      markSeenMutation({ threadId: thread._id });
    }
  }, [thread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !id || sending) return;
    setSending(true);
    await createAdminMessage({
      threadId: id as Id<'threads'>,
      adminTelegramId: String(user.id),
      text: text.trim(),
    });
    setText('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (thread === undefined) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--muted)' }}>Thread not found</p>
        <button onClick={() => navigate(-1)} className="text-sm" style={{ color: 'var(--primary)' }}>Go back</button>
      </div>
    );
  }

  const customerName = getCustomerName(thread.customerFirstName, thread.customerLastName);
  const initials = customerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarBg = AVATAR_COLORS[customerName.charCodeAt(0) % AVATAR_COLORS.length];
  const threadStatusStyle = getThreadStatusDark(thread.status);

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateStr = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateStr) {
      last.messages.push(msg);
    } else {
      grouped.push({ date: dateStr, messages: [msg] });
    }
  });

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--bg)',
        height: 'calc(100vh - 64px - env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-3 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: avatarBg }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{customerName}</p>
          {thread.customerUsername && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>@{thread.customerUsername}</p>
          )}
        </div>
        <span
          className="text-[11px] font-semibold px-2 py-1 rounded-full"
          style={threadStatusStyle}
        >
          {thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}
        </span>
      </div>

      {/* Exchange Cards (pinned) */}
      {exchanges.length > 0 && (
        <div
          className="px-3 py-2 space-y-2 flex-shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          {exchanges.map((ex) => {
            const exStatusStyle = getExchangeStatusDark(ex.status);
            return (
              <button
                key={ex._id}
                onClick={() => navigate(`/exchanges/${ex._id}`)}
                className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-150 active:scale-[0.99]"
                style={{ background: 'rgba(245,196,0,0.06)', border: '1px solid rgba(245,196,0,0.12)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,196,0,0.12)', color: 'var(--primary)' }}
                >
                  <ArrowLeftRight size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {ex.tradeInBrand} {ex.tradeInModel} → {ex.desiredPhone?.phoneType ?? 'Unknown'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    Pay {formatETB(ex.finalDifference)}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={exStatusStyle}
                >
                  {ex.status}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {grouped.map(({ date, messages: msgs }) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[11px] font-medium px-2" style={{ color: 'var(--muted)' }}>{date}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            <div className="space-y-2">
              {msgs.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${isAdmin ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                      style={isAdmin
                        ? { background: 'rgba(245,196,0,0.18)', border: '1px solid rgba(245,196,0,0.25)' }
                        : { background: 'var(--surface-2)', border: '1px solid var(--border)' }
                      }
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                        {msg.text}
                      </p>
                      <p
                        className="text-[10px] mt-1 text-right"
                        style={{ color: isAdmin ? 'rgba(245,196,0,0.55)' : 'var(--muted)' }}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {thread.status !== 'done' ? (
        <div
          className="px-3 py-3 flex items-end gap-2 flex-shrink-0"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none resize-none max-h-32 overflow-y-auto"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              minHeight: '42px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 btn-interactive disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            <Send size={16} style={{ color: 'var(--primary-foreground)' }} />
          </button>
        </div>
      ) : (
        <div
          className="px-4 py-3 text-center flex-shrink-0"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>This thread is closed. Customer can reopen by sending a message.</p>
        </div>
      )}
    </div>
  );
}
