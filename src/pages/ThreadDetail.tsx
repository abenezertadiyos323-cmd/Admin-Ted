import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeftRight, ChevronLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getThreadById, getMessages, sendMessage, getExchanges, markThreadSeen } from '../lib/api';
import { getTelegramUser } from '../lib/telegram';
import { formatTime, formatDate, getCustomerName, getExchangeStatusColor, formatETB } from '../lib/utils';
import type { Thread, Message, Exchange } from '../types';

export default function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getTelegramUser();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getThreadById(id),
      getMessages(id),
      getExchanges(),
    ]).then(([t, m, ex]) => {
      setThread(t);
      setMessages(m);
      setExchanges(ex.filter((e) => e.threadId === id));
      setLoading(false);
      if (t && t.status === 'new') {
        markThreadSeen(id);
      }
    });
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !id || sending) return;
    setSending(true);
    const msg = await sendMessage(id, text.trim(), String(user.id));
    setMessages((prev) => [...prev, msg]);
    setText('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-gray-500">Thread not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm">Go back</button>
      </div>
    );
  }

  const customerName = getCustomerName(thread.customerFirstName, thread.customerLastName);
  const initials = customerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

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
      className="flex flex-col bg-gray-50"
      style={{ height: 'calc(100vh - 64px - env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-black/5 flex items-center gap-3 px-3 py-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ChevronLeft size={22} className="text-slate-700" />
        </button>
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{customerName}</p>
          {thread.customerUsername && (
            <p className="text-xs text-gray-400">@{thread.customerUsername}</p>
          )}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${thread.status === 'new' ? 'bg-indigo-50 text-indigo-600' :
            thread.status === 'seen' ? 'bg-slate-100 text-slate-500' :
              'bg-green-50 text-green-600'
          }`}>
          {thread.status.charAt(0).toUpperCase() + thread.status.slice(1)}
        </span>
      </div>

      {/* Exchange Cards (pinned) */}
      {exchanges.length > 0 && (
        <div className="bg-white border-b border-black/5 px-3 py-2 space-y-2 flex-shrink-0">
          {exchanges.map((ex) => {
            const statusStyle = getExchangeStatusColor(ex.status);
            return (
              <button
                key={ex._id}
                onClick={() => navigate(`/exchanges/${ex._id}`)}
                className="w-full flex items-center gap-3 bg-indigo-50 rounded-xl p-3 text-left transition-all duration-150 active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <ArrowLeftRight size={14} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-800 truncate">
                    {ex.tradeInBrand} {ex.tradeInModel} → {ex.desiredPhone?.phoneType ?? 'Unknown'}
                  </p>
                  <p className="text-[11px] text-indigo-500">
                    Pay {formatETB(ex.finalDifference)}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle.bg} ${statusStyle.color}`}>
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
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium px-2">{date}</span>
              <div className="flex-1 h-px bg-gray-200" />
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
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${isAdmin
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-800 rounded-bl-sm shadow-sm border border-black/5'
                        }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isAdmin ? 'text-indigo-200' : 'text-slate-400'} text-right`}>
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
        <div className="bg-white border-t border-black/5 px-3 py-3 flex items-end gap-2 flex-shrink-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 btn-interactive disabled:opacity-40"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      ) : (
        <div className="bg-white border-t border-black/5 px-4 py-3 text-center flex-shrink-0">
          <p className="text-xs text-slate-400">This thread is closed. Customer can reopen by sending a message.</p>
        </div>
      )}
    </div>
  );
}
