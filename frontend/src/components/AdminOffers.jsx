import React, { useState, useEffect } from 'react';
import { Gift, Plus, Loader2, Trash2, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

// Admin offers/festival console. Offers created here appear as a popup on login.
// The "color" controls the popup accent — satisfies "color change" per offer.
const COLORS = [
  { id: 'blue', cls: 'bg-blue-600' },
  { id: 'amber', cls: 'bg-amber-500' },
  { id: 'emerald', cls: 'bg-emerald-500' },
  { id: 'red', cls: 'bg-red-500' },
  { id: 'purple', cls: 'bg-purple-500' },
];

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', badge: 'FESTIVAL', color: 'amber', ends_at: '' });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/offers.php`);
      if (res.data.status === 'success') setOffers(res.data.data || []);
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    fetchOffers();
    const t = setInterval(fetchOffers, 20000);
    return () => clearInterval(t);
  }, []);

  const create = async () => {
    if (!form.title.trim()) { setStatus('Title is required.'); return; }
    setSaving(true); setStatus('');
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/offers.php`, { action: 'create', ...form });
      if (res.data.status === 'success') {
        setStatus('Offer published — it will show on customer login.');
        setForm({ title: '', message: '', badge: 'FESTIVAL', color: 'amber', ends_at: '' });
        fetchOffers();
      } else setStatus(res.data.message || 'Failed.');
    } catch (err) { setStatus('Failed to publish.'); }
    finally { setSaving(false); }
  };

  const toggle = async (id) => { try { await axios.post(`${API_BASE_URL}/admin/offers.php`, { action: 'toggle', id }); fetchOffers(); } catch(e){} };
  const del = async (id) => { if (!window.confirm('Delete this offer?')) return; try { await axios.post(`${API_BASE_URL}/admin/offers.php`, { action: 'delete', id }); fetchOffers(); } catch(e){} };

  const colorCls = (c) => (COLORS.find(x => x.id === c) || COLORS[0]).cls;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl md:text-4xl font-black text-blue-900 uppercase italic tracking-tighter">Offers & Festival Banners</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 italic">Active offers pop up when customers log in</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Gift size={20} /></div>
            <h4 className="text-lg font-black text-blue-900 uppercase italic tracking-tight">New Offer</h4>
          </div>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Offer title (e.g. Diwali Gold Bonanza)"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Offer details / message..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all resize-none" />
          <div className="grid grid-cols-2 gap-4">
            <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Badge (e.g. FESTIVAL)"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
            <input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 italic">Accent Color</label>
            <div className="flex items-center gap-3 mt-3">
              {COLORS.map(c => (
                <button key={c.id} onClick={() => setForm({ ...form, color: c.id })}
                  className={`w-9 h-9 rounded-full ${c.cls} transition-all ${form.color === c.id ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' : 'opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          </div>
          {status && <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider italic flex items-center gap-2"><CheckCircle2 size={14} /> {status}</p>}
          <button onClick={create} disabled={saving}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl active:scale-95 flex items-center gap-3 italic disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Publish Offer
          </button>
        </div>

        {/* Offer list */}
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 py-20 text-center"><Sparkles className="mx-auto text-slate-200 mb-3" size={44} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No offers yet</p></div>
          ) : offers.map(o => (
            <div key={o.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`h-1.5 w-full ${colorCls(o.color)}`} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-slate-50 text-slate-500 text-[8px] font-black rounded-full uppercase tracking-widest italic mb-2">{o.badge}</span>
                    <h4 className="text-base font-black text-blue-900 italic tracking-tight">{o.title}</h4>
                    {o.message && <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{o.message}</p>}
                    {o.ends_at && <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Ends {new Date(o.ends_at).toLocaleDateString()}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic ${o.is_active == 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{o.is_active == 1 ? 'Active' : 'Hidden'}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                  <button onClick={() => toggle(o.id)} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-slate-100 transition-all flex items-center gap-2">
                    {o.is_active == 1 ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                  </button>
                  <button onClick={() => del(o.id)} className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all ml-auto"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOffers;
