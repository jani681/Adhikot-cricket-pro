import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Ensure your firebase config is here
import { ref, set, onValue, update } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trophy, User, MapPin, Clock, Lock } from 'lucide-react';

// --- Types ---
interface Player {
  name: string;
  whatsapp: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface MatchState {
  league: string;
  ground: string;
  date: string;
  time: string;
  battingTeam: string;
  bowlingTeam: string;
  tossWinner: string;
  decision: 'Bat' | 'Bowl';
  runs: number;
  wickets: number;
  overs: number;
  ballsInOver: number;
  target?: number;
  striker: Player | null;
  nonStriker: Player | null;
  bowler: string;
  isLive: boolean;
}

const ADMIN_PASSWORD = "6545";

export default function AdhiKotCricketPro() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Real-time Firebase Sync
  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snapshot) => {
      setMatch(snapshot.val());
      setLoading(false);
    });
  }, []);

  // 2. Admin Authentication
  const handleLogin = () => {
    if (passInput === ADMIN_PASSWORD) setIsAdmin(true);
    else alert("Wrong Password!");
  };

  // 3. Scoring Logic (Functional Buttons)
  const updateScore = (value: number | 'WD' | 'NB' | 'W') => {
    if (!match || !isAdmin) return;
    
    let newRuns = match.runs;
    let newBalls = match.ballsInOver;
    let newOvers = match.overs;
    let newWickets = match.wickets;

    if (typeof value === 'number') {
      newRuns += value;
      newBalls += 1;
      // Update striker stats here...
    } else if (value === 'WD' || value === 'NB') {
      newRuns += 1;
    } else if (value === 'W') {
      newWickets += 1;
      newBalls += 1;
    }

    if (newBalls === 6) {
      newOvers += 1;
      newBalls = 0;
    }

    update(ref(db, 'liveMatch'), {
      runs: newRuns,
      ballsInOver: newBalls,
      overs: newOvers,
      wickets: newWickets
    });
  };

  if (loading) return <div className="text-white p-10">Loading System...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4">
      {/* Header with Admin Info */}
      <header className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-yellow-500">ADHI KOT PRO</h1>
          <p className="text-xs text-gray-400">Admin: Touqeer Iqbal Baghoor</p>
        </div>
        <a href="https://wa.me/923000000000" className="bg-green-600 p-2 rounded-full">
          <MessageCircle size={20} />
        </a>
      </header>

      {!isAdmin && !match?.isLive ? (
        /* Admin Login Section */
        <div className="max-w-md mx-auto bg-[#1e293b] p-8 rounded-2xl shadow-2xl border border-gray-700">
          <Lock className="mx-auto mb-4 text-yellow-500" />
          <h2 className="text-center mb-6">Enter Admin Password</h2>
          <input 
            type="password" 
            className="w-full p-3 bg-black rounded-lg mb-4 text-center border border-gray-600 focus:border-yellow-500 outline-none"
            onChange={(e) => setPassInput(e.target.value)}
          />
          <button onClick={handleLogin} className="w-full bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400">
            ACCESS SYSTEM
          </button>
        </div>
      ) : (
        /* Live Scoreboard with Animations */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-[#1e293b] rounded-3xl p-6 shadow-xl border-t-4 border-yellow-500">
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1"><MapPin size={14}/> {match?.ground}</span>
              <span className="flex items-center gap-1"><Clock size={14}/> {match?.time}</span>
            </div>

            <div className="text-center mb-8">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={match?.runs}
                  initial={{ scale: 0.8 }} 
                  animate={{ scale: 1 }}
                  className="text-7xl font-black"
                >
                  {match?.runs}/{match?.wickets}
                </motion.h2>
              </AnimatePresence>
              <p className="text-xl text-yellow-500 font-medium">Overs: {match?.overs}.{match?.ballsInOver}</p>
              <p className="text-xs mt-2 text-gray-400">CRR: {(match!.runs / (match!.overs + match!.ballsInOver/6 || 1)).toFixed(2)}</p>
            </div>

            {/* Batsmen & Bowler Section */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="bg-black/30 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                <span>🏏 {match?.striker?.name}*</span>
                <span className="font-mono text-yellow-500">{match?.striker?.runs}({match?.striker?.balls})</span>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                <span>🏏 {match?.nonStriker?.name}</span>
                <span className="font-mono">{match?.nonStriker?.runs}({match?.nonStriker?.balls})</span>
              </div>
              <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30 flex justify-between items-center">
                <span className="text-yellow-500">🎾 Bowler: {match?.bowler}</span>
                <button className="text-[10px] bg-yellow-500 text-black px-2 py-1 rounded">CHANGE</button>
              </div>
            </div>

            {/* Functional Control Panel (Admin Only) */}
            {isAdmin && (
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 6].map(val => (
                  <button 
                    key={val} 
                    onClick={() => updateScore(val)}
                    className="bg-white text-black font-bold h-14 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {val}
                  </button>
                ))}
                <button onClick={() => updateScore('WD')} className="bg-yellow-600 text-white font-bold rounded-xl">WD</button>
                <button onClick={() => updateScore('NB')} className="bg-yellow-600 text-white font-bold rounded-xl">NB</button>
                <button onClick={() => updateScore('W')} className="col-span-4 bg-red-600 py-3 rounded-xl font-bold mt-2 uppercase tracking-widest">Wicket Out</button>
              </div>
            )}
          </div>
          
          <button className="w-full mt-6 py-4 bg-[#2d3748] rounded-xl text-gray-400 text-sm font-semibold border border-gray-700">
            MATCH FINISHED & SAVE TO HISTORY
          </button>
        </motion.div>
      )}
    </div>
  );
}
