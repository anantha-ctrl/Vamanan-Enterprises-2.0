import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Star, Loader2, Inbox, CheckCircle2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

// Customer-facing Feedback & Remarks widget.
//  - Customer submits feedback/remarks to the company (customer_to_admin)
//  - Customer sees replies/remarks from admin/manager (admin_to_customer)
// Fully DB-connected + polls every 20s for real-time replies.
const FeedbackWidget = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('send');

  const fetchFeedback = async () => {
    if (!user.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/get_feedback.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setReceived(res.data.data.received || []);
        setSent(res.data.data.sent || []);
      }
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    fetchFeedback();
    const t = setInterval(fetchFeedback, 20000);
    return () => clearInterval(t);
  }, []);

  const submit = async () => {
    if (!message.trim()) { setStatus('Please write your message.'); return; }
    setSending(true);
    setStatus('');
    try {
      const res = await axios.post(`${API_BASE_URL}/customer/submit_feedback.php`, {
        user_id: user.id, subject, message, rating: rating || ''
      });
      if (res.data.status === 'success') {
        setStatus('Thank you! Your feedback has been submitted.');
        setSubject(''); setMessage(''); setRating(0);
        fetchFeedback();
      } else {
        setStatus(res.data.message || 'Failed to submit.');
      }
    } catch (err) {
      setStatus('Failed to submit. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-[2rem] md:rounded-[3rem] shadow-sm overflow-hidden">
      <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare size={22} /></div>
          <div>
            <h3 className="text-lg md:text-2xl font-black text-blue-900 uppercase italic tracking-tight leading-none">Feedback & Remarks</h3>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1.5 italic">Share your thoughts • See replies from our team</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 md:px-10 md:pt-6">
        {[
          { id: 'send', label: 'Write Feedback' },
          { id: 'inbox', label: `From Team${received.length ? ` (${received.length})` : ''}` },
          { id: 'sent', label: 'My Submissions' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-blue-900 border border-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-10 pt-4 md:pt-6">
        {tab === 'send' && (
          <div className="space-y-5">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Subject (optional)</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Payout query, Suggestion..."
                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Your Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Write your feedback or remarks here..."
                className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mr-2 italic">Rate us</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                  <Star size={22} className={n <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                </button>
              ))}
            </div>
            {status && <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider italic flex items-center gap-2"><CheckCircle2 size={14} /> {status}</p>}
            <button onClick={submit} disabled={sending}
              className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 italic disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Feedback
            </button>
          </div>
        )}

        {tab === 'inbox' && (
          <div className="space-y-4">
            {received.length === 0 ? (
              <div className="py-16 text-center"><Inbox className="mx-auto text-slate-200 mb-3" size={40} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No replies from the team yet</p></div>
            ) : received.map(f => (
              <div key={f.id} className="border border-blue-100 bg-blue-50/40 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">{f.from_name || 'Team'} • {f.sender_role || 'admin'}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase ml-auto">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                {f.subject && <p className="text-sm font-black text-blue-900 italic mb-1">{f.subject}</p>}
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{f.message}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'sent' && (
          <div className="space-y-4">
            {sent.length === 0 ? (
              <div className="py-16 text-center"><MessageSquare className="mx-auto text-slate-200 mb-3" size={40} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">You haven't sent any feedback yet</p></div>
            ) : sent.map(f => (
              <div key={f.id} className="border border-slate-100 bg-slate-50/60 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  {f.rating > 0 && <span className="flex items-center gap-0.5">{[...Array(f.rating)].map((_,i) => <Star key={i} size={12} className="text-amber-500 fill-amber-500" />)}</span>}
                  <span className="text-[8px] font-bold text-slate-400 uppercase ml-auto">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                {f.subject && <p className="text-sm font-black text-blue-900 italic mb-1">{f.subject}</p>}
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackWidget;
