import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, User, Network, TrendingUp, ShieldCheck } from 'lucide-react';

const TreeNode = ({ node, level = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(level === 1); // Expand first level by default
  const hasDownline = node.downline && node.downline.length > 0;

  // Colors for different levels
  const levelColors = [
    'border-amber-500 bg-amber-50',
    'border-blue-500 bg-blue-50',
    'border-amber-500 bg-amber-50',
    'border-slate-600 bg-slate-50',
    'border-blue-500 bg-blue-50',
  ];

  const levelText = [
    'text-amber-700',
    'text-blue-700',
    'text-amber-700',
    'text-slate-700',
    'text-blue-700',
  ];

  return (
    <div className="ml-2 sm:ml-4 md:ml-8 mt-2">
      <div 
        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer group ${levelColors[level-1] || 'border-slate-300 bg-slate-50'}`}
        onClick={() => hasDownline && setIsExpanded(!isExpanded)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${levelText[level-1]} bg-white/50 border border-current/10 font-black text-[10px]`}>
          {hasDownline ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <User size={14} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-tight truncate group-hover:text-amber-600 transition-colors italic">
              {node.name}
            </p>
            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${levelText[level-1]} bg-white/50 italic`}>
              L{level}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">{node.referral_code}</p>
            {node.total_investment > 0 && (
              <p className="text-[8px] text-amber-600 font-black uppercase tracking-widest italic">₹{parseFloat(node.total_investment).toLocaleString()}</p>
            )}
          </div>
        </div>

        {node.kyc_status === 'verified' && (
          <ShieldCheck size={14} className="text-amber-500" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && hasDownline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-l border-slate-200 ml-2 sm:ml-4 pl-1 sm:pl-2"
          >
            {node.downline.map((child, idx) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GenealogyTree = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
        <TrendingUp className="animate-pulse" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Scanning Network Structure...</p>
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
    <div className="w-full h-full overflow-hidden">
      <div className="mb-6 p-6 bg-blue-900 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Network size={150} /></div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">Your Referral Tree</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">See your members across all 5 levels</p>
        </div>
        <div className="relative z-10 flex flex-wrap justify-center gap-2">
          {['L1','L2','L3','L4','L5'].map((l, i) => (
             <div key={l} className={`px-3 py-1 rounded-full text-[8px] font-black border shadow-lg ${[
               'border-amber-500/20 bg-amber-500 text-blue-900',
               'border-blue-500/20 bg-blue-500 text-white',
               'border-amber-500/20 bg-amber-500 text-white',
               'border-slate-600/20 bg-slate-600 text-white',
               'border-blue-500/20 bg-blue-500 text-white',
             ][i]}`}>{l}</div>
          ))}
        </div>
      </div>

      <div className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((node) => (
          <TreeNode key={node.id} node={node} />
        ))}
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default GenealogyTree;
