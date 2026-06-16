'use client';

import { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from './Toast';

interface Message {
  id: string;
  sender_name: string;
  sender_role: 'customer' | 'vendor';
  content: string;
  created_at: string;
}

interface OrderMessagesProps {
  orderId: string;
  senderName: string;
  senderRole: 'customer' | 'vendor';
}

export function OrderMessages({ orderId, senderName, senderRole }: OrderMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('order_messages')
        .select('id, sender_name, sender_role, content, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages', error);
      } else {
        setMessages(data ?? []);
      }
      setLoading(false);
    };

    void load();
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || content.length > 2000) return;

    setSending(true);
    try {
      const response = await fetch('/api/orders/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          senderName,
          senderRole,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { message } = await response.json();
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message', err);
      addToast({ type: 'error', title: 'Message not sent', message: 'Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('en-TZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="border-b border-slate-800 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-100">Order Messages</h3>
        <p className="text-xs text-slate-400 mt-0.5">Chat with {senderRole === 'customer' ? 'the vendor' : 'the customer'}</p>
      </div>

      <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
                  <div className="h-10 w-48 rounded-xl bg-slate-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-slate-800 p-3 text-slate-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-500">Start the conversation by sending a message.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_role === senderRole;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  msg.sender_role === 'vendor'
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {msg.sender_name.charAt(0).toUpperCase()}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? 'bg-sky-500/10 text-slate-100'
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-300">{msg.sender_name}</span>
                    <span className="text-[10px] text-slate-500">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 px-5 py-3">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-sky-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
          >
            {sending ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
