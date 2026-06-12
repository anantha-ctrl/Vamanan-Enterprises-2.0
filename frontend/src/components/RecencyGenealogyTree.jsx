import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Network, TrendingUp, ShieldCheck, Sparkles, Crown } from 'lucide-react';

/*
 * RECENCY-RANKED GENEALOGY
 * The newest member is always Level 1 (top). Every earlier member shifts down a
 * level, and the account owner (YOU) sits at the deepest level. Levels are sent
 * pre-sorted by the backend (newest first).
 */

const LEVEL_THEME = [
  { dot: 'bg-amber-500',   ring: 'border-amber-400',   badge: 'bg-amber-500 text-slate-900', text: 'text-amber-600' },
  { dot: 'bg-blue-500',    ring: 'border-blue-400',    badge: 'bg-blue-500 text-white',      text: 'text-blue-600' },
  { dot: 'bg-emerald-500', ring: 'border-emerald-400', badge: 'bg-emerald-500 text-white',   text: 'text-emerald-600' },
  { dot: 'bg-indigo-500',  ring: 'border-indigo-400',  badge: 'bg-indigo-500 text-white',    text: 'text-indigo-600' },
  { dot: 'bg-rose-500',    ring: 'border-rose-400',    badge: 'bg-rose-500 text-white',       text: 'text-rose-600' },
];

const RecencyGenealogyTree = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
        <TrendingUp className="animate-pulse" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Recalculating Network Levels...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
        <Network size={40} className="mx-auto mb-4 text-slate-300" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No network nodes found yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header banner + legend */}
      <div className="mb-6 p-6 bg-slate-900 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Network size={150} /></div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">Your Referral Tree</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">Newest member on top — levels update live as your network grows</p>
        </div>
        <div className="relative z-10 flex flex-wrap justify-center gap-2">
          {['L1','L2','L3','L4','L5'].map((l, i) => (
            <div key={l} className={`px-3 py-1 rounded-full text-[8px] font-black border shadow-lg ${LEVEL_THEME[i].badge}`}>{l}</div>
          ))}
        </div>
      </div>

      {/* Cascading recency list (L1 at top, each older member steps down) */}
      <div className="relative max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {data.map((node, idx) => {
            const theme  = LEVEL_THEME[(node.level - 1) % LEVEL_THEME.length];
            const indent = Math.min(idx, 6) * 28; // stagger the cascade, capped so deep trees stay readable
            const created = node.created_at
              ? new Date(node.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
              : '';

            return (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                style={{ marginLeft: `${indent}px` }}
                className={`relative mb-2.5 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border-l-4 bg-white shadow-sm hover:shadow-md transition-all ${theme.ring} ${node.is_newest ? 'ring-2 ring-amber-400/60' : ''}`}
              >
                {/* connector line back to the member above */}
                {idx > 0 && (
                  <span className="absolute -left-[14px] top-1/2 w-3.5 border-t-2 border-slate-200" />
                )}

                {/* avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-[11px] ${theme.dot} shadow`}>
                  {node.is_you ? <Crown size={16} /> : (node.name?.[0]?.toUpperCase() || <User size={16} />)}
                </div>

                {/* identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-tight truncate italic text-slate-900">{node.name}</p>
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full italic ${theme.badge}`}>L{node.level}</span>
                    {node.is_newest && (
                      <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 italic">
                        <Sparkles size={8} /> Newest
                      </span>
                    )}
                    {node.is_you && (
                      <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-400 italic">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">{node.referral_code}</p>
                    {created && <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">Joined {created}</p>}
                    {node.total_investment > 0 && (
                      <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest italic">₹{parseFloat(node.total_investment).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {node.kyc_status === 'verified' && (
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default RecencyGenealogyTree;
