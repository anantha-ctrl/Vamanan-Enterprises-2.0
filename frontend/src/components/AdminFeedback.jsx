import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Inbox, Star, Reply, Trash2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

// Admin/Manager feedback console:
//   - Inbox: feedback customers submitted (customer_to_admin)
//   - Reply / compose: send feedback/remarks to a customer (admin_to_customer)
// DB-connected + polls every 20s.
const AdminFeedback = () => {
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [toUser, setToUser] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('inbox');

  const fetchAll = async () => {
    try {
      const [fb, us] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/feedback.php`),
        axios.get(`${API_BASE_URL}/admin/all_users.php`),
      ]);
      if (fb.data.status === 'success') { setInbox(fb.data.data.inbox || []); setSent(fb.data.data.sent || []); }
      if (us.data.status === 'success') setCustomers((us.data.data || []).filter(u => u.role === 'customer'));
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 20000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    if (!toUser) { setStatus('Select a customer first.'); return; }
    if (!message.trim()) { setStatus('Write a message.'); return; }
    setSending(true); setStatus('');
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/feedback.php`, {
        action: 'reply', from_user_id: me.id, to_user_id: Number(toUser), subject, message
      });
      if (res.data.status === 'success') {
        setStatus('Feedback sent to customer.');
        setSubject(''); setMessage(''); setToUser('');
        fetchAll();
      } else setStatus(res.data.message || 'Failed.');
    } catch (err) { setStatus('Failed to send.'); }
    finally { setSending(false); }
  };

  const replyTo = (f) => { setTab('compose'); setToUser(String(f.from_user_id)); setSubject(f.subject ? `Re: ${f.subject}` : ''); };
  const markRead = async (id) => { try { await axios.post(`${API_BASE_URL}/admin/feedback.php`, { action: 'read', id }); fetchAll(); } catch(e){} };
  const del = async (id) => { if (!window.confirm('Delete this feedback?')) return; try { await axios.post(`${API_BASE_URL}/admin/feedback.php`, { action: 'delete', id }); fetchAll(); } catch(e){} };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl md:text-4xl font-black text-blue-900 uppercase italic tracking-tighter">Feedback & Remarks</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 italic">Customer feedback inbox · send remarks to clients</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { id: 'inbox', label: `Customer Inbox${inbox.length ? ` (${inbox.length})` : ''}` },
          { id: 'compose', label: 'Send to Customer' },
          { id: 'sent', label: 'Sent History' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:text-blue-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'inbox' && (
        <div className="space-y-4">
          {inbox.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center"><Inbox className="mx-auto text-slate-200 mb-3" size={44} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No customer feedback yet</p></div>
          ) : inbox.map(f => (
            <div key={f.id} className={`bg-white rounded-3xl border p-6 md:p-8 shadow-sm ${f.is_read == 0 ? 'border-amber-200' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic">{f.from_name?.[0] || 'C'}</div>
                  <div>
                    <p className="text-sm font-black text-blue-900 uppercase italic leading-none">{f.from_name || 'Customer'} <span className="text-[9px] text-amber-600 ml-1">{f.customer_id}</span></p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{f.from_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {f.rating > 0 && <span className="flex items-center gap-0.5">{[...Array(f.rating)].map((_,i) => <Star key={i} size={13} className="text-amber-500 fill-amber-500" />)}</span>}
                  {f.is_read == 0 && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[8px] font-black rounded-full uppercase tracking-widest italic">New</span>}
                </div>
              </div>
              {f.subject && <p className="text-sm font-black text-blue-900 italic mt-4">{f.subject}</p>}
              <p className="text-sm text-slate-600 font-medium leading-relaxed mt-2">{f.message}</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-50">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(f.created_at).toLocaleString()}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => replyTo(f)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-blue-700 transition-all flex items-center gap-2"><Reply size={13} /> Reply</button>
                  {f.is_read == 0 && <button onClick={() => markRead(f.id)} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-slate-100 transition-all">Mark read</button>}
                  <button onClick={() => del(f.id)} className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'compose' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-10 shadow-sm space-y-5 max-w-2xl">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">To Customer</label>
            <select value={toUser} onChange={e => setToUser(e.target.value)}
              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all">
              <option value="">Select a customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.customer_id || c.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Subject (optional)</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Regarding your recent purchase"
              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Message / Remarks</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Write your feedback or remarks to the customer..."
              className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all resize-none" />
          </div>
          {status && <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider italic flex items-center gap-2"><CheckCircle2 size={14} /> {status}</p>}
          <button onClick={send} disabled={sending}
            className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl active:scale-95 flex items-center gap-3 italic disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send to Customer
          </button>
        </div>
      )}

      {tab === 'sent' && (
        <div className="space-y-4">
          {sent.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center"><MessageSquare className="mx-auto text-slate-200 mb-3" size={44} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No remarks sent yet</p></div>
          ) : sent.map(f => (
            <div key={f.id} className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">To: {f.to_name || 'Customer'} {f.customer_id ? `(${f.customer_id})` : ''}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase ml-auto">{f.sender_name} · {new Date(f.created_at).toLocaleString()}</span>
              </div>
              {f.subject && <p className="text-sm font-black text-blue-900 italic mb-1">{f.subject}</p>}
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
