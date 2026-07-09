import React from 'react';
import { motion } from 'framer-motion';
import { User, Network, TrendingUp, ShieldCheck, Sparkles, Crown } from 'lucide-react';

/*
 * REFERRAL GENEALOGY — TOP-DOWN ORG CHART
 * The viewing user (YOU) is the root at the top; every direct referral branches
 * beneath them, recursively, connected by lines — a true downline hierarchy.
 * Children arrive newest-first from the backend, and the most recently joined
 * member in the whole network is flagged `is_newest`.
 *
 * Input: `data` is the nested root node ({ id, name, children: [...] }).
 */

// Depth-cycled palette (root = depth 0).
const DEPTH_THEME = [
  { dot: 'bg-blue-900',   ring: 'border-blue-900',   badge: 'bg-amber-500 text-blue-900', text: 'text-amber-600' },
  { dot: 'bg-amber-500',   ring: 'border-amber-400',   badge: 'bg-amber-500 text-blue-900', text: 'text-amber-600' },
  { dot: 'bg-blue-500',    ring: 'border-blue-400',    badge: 'bg-blue-500 text-white',      text: 'text-blue-600' },
  { dot: 'bg-amber-500', ring: 'border-amber-400', badge: 'bg-amber-500 text-white',   text: 'text-amber-600' },
  { dot: 'bg-slate-700',   ring: 'border-slate-500',   badge: 'bg-slate-700 text-white',     text: 'text-slate-700' },
  { dot: 'bg-blue-500',    ring: 'border-blue-400',     badge: 'bg-blue-500 text-white',      text: 'text-blue-600' },
];

const NodeCard = ({ node, depth }) => {
  const theme = DEPTH_THEME[depth % DEPTH_THEME.length];
  const created = node.created_at
    ? new Date(node.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-white border-2 shadow-sm hover:shadow-lg transition-all ${theme.ring} ${
        node.is_newest ? 'ring-2 ring-amber-400/60' : ''
      } ${node.is_you ? 'ring-2 ring-blue-900/20' : ''}`}
    >
      {/* avatar */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-[13px] ${theme.dot} shadow`}>
        {node.is_you ? <Crown size={18} /> : (node.name?.[0]?.toUpperCase() || <User size={16} />)}
      </div>

      {/* name */}
      <p className="text-[11px] font-black uppercase tracking-tight italic text-blue-900 leading-none whitespace-nowrap max-w-[150px] truncate">
        {node.name}
      </p>

      {/* badges */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {node.is_you && (
          <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-900 text-amber-400 italic">You</span>
        )}
        {node.is_newest && (
          <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 italic">
            <Sparkles size={8} /> Newest
          </span>
        )}
        {node.kyc_status === 'verified' && (
          <ShieldCheck size={12} className="text-amber-500 shrink-0" />
        )}
      </div>

      {/* meta */}
      <div className="flex flex-col items-center gap-0.5">
        {node.referral_code && (
          <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest italic leading-none">{node.referral_code}</p>
        )}
        {created && (
          <p className="text-[7px] text-slate-300 font-black uppercase tracking-widest italic leading-none">{created}</p>
        )}
        {node.total_investment > 0 && (
          <p className="text-[7px] text-amber-600 font-black uppercase tracking-widest italic leading-none">
            ₹{parseFloat(node.total_investment).toLocaleString()}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Recursive tree node → renders <li>{card}{<ul> children </ul>}</li>
const TreeNode = ({ node, depth = 0 }) => (
  <li>
    <NodeCard node={node} depth={depth} />
    {node.children && node.children.length > 0 && (
      <ul>
        {node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} />
        ))}
      </ul>
    )}
  </li>
);

const RecencyGenealogyTree = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
        <TrendingUp className="animate-pulse" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Recalculating Network Levels...</p>
      </div>
    );
  }

  if (!data || !data.id) {
    return (
      <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2rem]">
        <Network size={40} className="mx-auto mb-4 text-slate-300" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No network nodes found yet.</p>
      </div>
    );
  }

  const hasChildren = data.children && data.children.length > 0;

  return (
    <div className="w-full">
      {/* Header banner + legend */}
      <div className="mb-6 p-6 bg-blue-900 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Network size={150} /></div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">Your Referral Tree</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">You at the top — your referrals branch below, live as your network grows</p>
        </div>
        <div className="relative z-10 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-amber-400 italic"><Crown size={10} /> You</span>
          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-amber-200 italic"><Sparkles size={10} /> Newest</span>
        </div>
      </div>

      {/* Org chart (scrolls horizontally for wide networks) */}
      <div className="gtree-scroll overflow-x-auto overflow-y-hidden pb-4">
        <div className="gtree inline-block min-w-full">
          <ul>
            <TreeNode node={data} depth={0} />
          </ul>
        </div>
        {!hasChildren && (
          <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest italic mt-6">
            No referrals yet — share your code to grow your tree.
          </p>
        )}
      </div>

      <style jsx="true">{`
        .gtree-scroll::-webkit-scrollbar { height: 6px; }
        .gtree-scroll::-webkit-scrollbar-track { background: transparent; }
        .gtree-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .gtree-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        .gtree { text-align: center; padding: 8px 0 20px; }
        .gtree ul {
          display: flex;
          justify-content: center;
          padding-top: 26px;
          position: relative;
          margin: 0;
          list-style: none;
          transition: all 0.3s;
        }
        .gtree > ul { padding-top: 0; }
        .gtree li {
          list-style: none;
          text-align: center;
          position: relative;
          padding: 26px 10px 0 10px;
        }
        /* connector lines from parent to children */
        .gtree li::before,
        .gtree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid #e2e8f0;
          width: 50%;
          height: 26px;
        }
        .gtree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid #e2e8f0;
        }
        /* a single child needs no horizontal connectors */
        .gtree li:only-child::after,
        .gtree li:only-child::before { display: none; }
        .gtree li:only-child { padding-top: 26px; }
        /* trim the connectors at the ends of each sibling row */
        .gtree li:first-child::before,
        .gtree li:last-child::after { border: 0 none; }
        .gtree li:last-child::before {
          border-right: 2px solid #e2e8f0;
          border-radius: 0 6px 0 0;
        }
        .gtree li:first-child::after { border-radius: 6px 0 0 0; }
        /* vertical line coming down from each parent into its children row */
        .gtree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #e2e8f0;
          width: 0;
          height: 26px;
        }
        /* root node sits flush with no incoming connector */
        .gtree > ul > li { padding-top: 0; }
        .gtree > ul > li::before,
        .gtree > ul > li::after { display: none; }
      `}</style>
    </div>
  );
};

export default RecencyGenealogyTree;
