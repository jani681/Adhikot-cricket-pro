import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update } from "firebase/database";
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, Trophy, MapPin, Calendar, Clock, Lock, UserCheck } from 'lucide-react';

// Firebase Configuration (Aapki DB URL ke mutabiq)
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_WA = "923015800630"; // Admin WhatsApp
const ADMIN_PASS = "6545";

export default function IntelligentCricketPro() {
  const [match, setMatch] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'live' | 'setup' | 'login'>('live');
  const [passInput, setPassInput] = useState("");

  useEffect(() => {
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleScore = (runs: number, extra: string = "") => {
    if (!match || !isAdmin || !match.striker) return;
    
    let m = { ...match };
    const sIdx = m.pBat.findIndex((p: any) => p.name === m.striker.name);

    if (extra === "W") {
      m.wkts += 1;
      m.balls += 1;
      m.pBat[sIdx].b += 1;
      m.striker = null; 
    } else if (extra === "WD" || extra === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs;
      m.balls += 1;
      m.pBat[sIdx].r += runs;
      m.pBat[sIdx].b += 1;
      if (runs === 4) m.pBat[sIdx].f4 += 1;
      if (runs === 6) m.pBat[sIdx].s6 += 1;
      
      if (runs % 2 !== 0) {
        const temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    if (m.balls === 6) {
      m.ovs += 1;
      m.balls = 0;
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    update(ref(db, 'liveMatch'), m);
  };

  return (
    <div className="min-h-screen bg-[#0a101e] text-white font-sans overflow-x-hidden">
      {/* --- HEADER (As per SS) --- */}
      <header className="bg-[#161d31] p-4 border-b border-yellow-500/50 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-yellow-500 overflow-hidden">
            <img src="https://via.placeholder.com/150" alt="Admin" className="object-cover" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-yellow-500 uppercase">Touqeer Iqbal Baghoor</h2>
            <a href={`https://wa.me/${ADMIN_WA}`} className="text-[10px] text-green-400 flex items-center gap-1">
              <MessageCircle size={10} /> WhatsApp Admin
            </a>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setView('live')} className={`px-4 py-1 rounded-md text-xs font-bold ${view === 'live' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>Live</button>
           <button onClick={() => isAdmin ? setView('setup') : setView('login')} className="bg-yellow-500 text-black px-4 py-1 rounded-md text-xs font-bold">+ Match</button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="p-4 max-w-lg mx-auto">
        
        {view === 'login' && (
          <div className="bg-[#161d31] p-6 rounded-2xl border border-gray-700 text-center">
            <Lock className="mx-auto mb-4 text-yellow-500" />
            <h3 className="mb-4">Admin Verification</h3>
            <input 
              type="password" 
              placeholder="Enter 6545" 
              className="w-full bg-black border border-gray-600 p-3 rounded-lg mb-4 text-center"
              onChange={(e) => setPassInput(e.target.value)}
            />
            <button 
              onClick={() => passInput === ADMIN_PASS ? (setIsAdmin(true), setView('setup')) : alert("Ghalat Password!")}
              className="w-full bg-yellow-500 text-black py-3 rounded-xl font-bold"
            >LOGIN</button>
          </div>
        )}

        {view === 'live' && match && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Score Display Card */}
            <div className="bg-[#161d31] rounded-3xl p-6 shadow-2xl border-t-4 border-yellow-500 relative overflow-hidden mb-6">
              <div className="flex justify-between text-[10px] text-gray-400 mb-4 uppercase tracking-widest">
                <span className="flex items-center gap-1"><MapPin size={10}/> {match.ground}</span>
                <span className="flex items-center gap-1"><Calendar size={10}/> {match.date}</span>
                <span className="flex items-center gap-1"><Clock size={10}/> {match.time}</span>
              </div>
              
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1 uppercase italic font-semibold">{match.league}</p>
                <div className="flex justify-center items-baseline gap-2">
                  <motion.h1 key={match.score} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-6xl font-black">
                    {match.score}/{match.wkts}
                  </motion.h1>
                  <span className="text-xl text-yellow-500">({match.ovs}.{match.balls})</span>
                </div>
                <div className="mt-2 text-xs text-yellow-500 font-bold bg-yellow-500/10 py-1 px-4 rounded-full inline-block">
                  {match.tossWinner} won & elected to {match.choice}
                </div>
              </div>

              {match.target && (
                <div className="mt-4 bg-black/40 p-2 rounded-xl text-center text-sm border border-yellow-500/20">
                  Target: <span className="text-yellow-500 font-bold">{match.target}</span> | 
                  Needs <span className="text-white font-bold">{match.target - match.score}</span> in <span className="text-white font-bold">{(match.totalOvers * 6) - (match.ovs * 6 + match.balls)}</span> balls
                </div>
              )}
            </div>

            {/* Players Table */}
            <div className="bg-[#161d31] rounded-2xl overflow-hidden mb-6 border border-gray-800">
              <table className="w-full text-xs">
                <thead className="bg-black/50 text-gray-400 uppercase">
                  <tr>
                    <th className="p-3 text-left">Batsman</th>
                    <th className="p-3">R</th>
                    <th className="p-3">B</th>
                    <th className="p-3">4s</th>
                    <th className="p-3">6s</th>
                    <th className="p-3">WA</th>
                  </tr>
                </thead>
                <tbody>
                  {[match.striker, match.nonStriker].map((p, i) => (
                    <tr key={i} className={`border-b border-gray-800 ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                      <td className="p-3 font-bold">{p?.name || '---'}{i === 0 ? '*' : ''}</td>
                      <td className="p-3 text-center text-yellow-500 font-mono">{p?.r || 0}</td>
                      <td className="p-3 text-center text-gray-400 font-mono">{p?.b || 0}</td>
                      <td className="p-3 text-center">{p?.f4 || 0}</td>
                      <td className="p-3 text-center">{p?.s6 || 0}</td>
                      <td className="p-3 text-center">
                        <a href={`https://wa.me/${p?.wa || ADMIN_WA}`} className="text-green-500"><Phone size={14}/></a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-black/20 text-[10px] flex justify-between items-center">
                <span className="text-gray-500">Bowler: <b className="text-white">{match.bowler || 'Select'}</b></span>
                <span className="text-yellow-500 font-bold uppercase tracking-tighter">Umpire: {match.umpire}</span>
              </div>
            </div>

            {/* Control Panel (Admin Only) */}
            {isAdmin && (
              <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-4">
                {[0, 1, 2, 3, 4, 6].map(num => (
                  <button key={num} onClick={() => handleScore(num)} className="h-14 bg-white text-black rounded-xl font-black text-xl shadow-lg active:scale-95 transition-transform">
                    {num}
                  </button>
                ))}
                <button onClick={() => handleScore(0, "WD")} className="h-14 bg-yellow-500 text-black rounded-xl font-bold">WD</button>
                <button onClick={() => handleScore(0, "NB")} className="h-14 bg-yellow-500 text-black rounded-xl font-bold">NB</button>
                <button onClick={() => handleScore(0, "W")} className="col-span-4 h-14 bg-red-600 rounded-xl font-bold uppercase tracking-widest text-white shadow-lg active:bg-red-700">WICKET OUT</button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* --- LIVE INDICATOR --- */}
      <div className="fixed bottom-4 left-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
        <span className="text-[10px] font-bold uppercase text-red-500 tracking-widest">Live System Active</span>
      </div>
    </div>
  );
}
