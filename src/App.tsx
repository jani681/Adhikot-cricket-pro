import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  authDomain: "adhikot-cricket-pro.firebaseapp.com",
  projectId: "adhikot-cricket-pro",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN = {
  name: "Touqeer Iqbal",
  dp: "https://i.ibb.co/vzYyLz7/touqeer.jpg",
  wa: "923015800630"
};

export default function AdhiKotCricketFinal() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const unsub = onValue(matchRef, (snap) => {
      setMatch(snap.val());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string || "").split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const pB = (fd.get("pB") as string || "").split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    const init = {
      teamA: { name: fd.get("tA") || "Team A", players: pA },
      teamB: { name: fd.get("tB") || "Team B", players: pB },
      score: 0, wickets: 0, balls: 0, overs: 0, innings: 1,
      striker: { name: "Select Striker", idx: -1 },
      nonStriker: { name: "Select Non-Striker", idx: -1 },
      bowler: { name: "Select Bowler" }
    };
    set(ref(db, 'liveMatch'), init);
  };

  // Loading Screen taake crash na ho
  if (loading) return <div style={{background:'#0f172a',color:'white',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center'}}>Loading Data...</div>;

  // Setup Screen agar match data nahi hai
  if (!match || !match.teamA) {
    return (
      <div style={st.setupCont}>
        <div style={st.setupCard}>
          <img src={ADMIN.dp} style={st.setupDP} />
          <h2 style={{textAlign:'center', color:'#f5cd11'}}>{ADMIN.name} Setup</h2>
          <form onSubmit={startMatch} style={st.form}>
            <input name="tA" placeholder="Team A Name" required style={st.input} />
            <textarea name="pA" placeholder="Team A Players (Comma separated)" required style={st.area} />
            <input name="tB" placeholder="Team B Name" required style={st.input} />
            <textarea name="pB" placeholder="Team B Players (Comma separated)" required style={st.area} />
            <button type="submit" style={st.goBtn}>START PRO MATCH</button>
          </form>
        </div>
      </div>
    );
  }

  const batKey = match.innings === 1 ? 'teamA' : 'teamB';
  const bowlKey = match.innings === 1 ? 'teamB' : 'teamA';

  return (
    <div style={st.appWrap}>
      <div style={st.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={ADMIN.dp} style={st.miniDP} />
          <span style={st.headText}>{ADMIN.name} PRO</span>
        </div>
        <a href={`https://wa.me/${ADMIN.wa}`} style={st.waBtn}>WhatsApp</a>
      </div>

      <div style={st.scoreZone}>
        <div style={st.vsLine}>
          <span>{match.teamA?.name}</span>
          <span style={{color:'#f5cd11'}}>VS</span>
          <span>{match.teamB?.name}</span>
        </div>
        <div style={st.bigNum}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>
        
        <div style={st.battingBox}>
          <div style={st.playerRow} onClick={() => setModal({type:'striker', key: batKey})}>
            🏏 {match.striker?.name}* <span>{match.striker?.idx !== -1 ? `${match[batKey]?.players[match.striker.idx]?.runs}(${match[batKey]?.players[match.striker.idx]?.balls})` : "0(0)"}</span>
          </div>
          <div style={st.playerRow} onClick={() => setModal({type:'nonStriker', key: batKey})}>
            🏏 {match.nonStriker?.name} 
            <span>{match.nonStriker?.idx !== -1 ? `${match[batKey]?.players[match.nonStriker.idx]?.runs}(${match[batKey]?.players[match.nonStriker.idx]?.balls})` : "0(0)"}</span>
          </div>
          <div style={st.bowlRow} onClick={() => setModal({type:'bowler', key: bowlKey})}>
            🎾 {match.bowler?.name || "Select Bowler"}
          </div>
        </div>
      </div>

      <div style={st.btnGrid}>
        {[0,1,2,3,4,6].map(n => <button key={n} onClick={() => {}} style={st.numBtn}>{n}</button>)}
        <button style={st.exBtn}>WD</button>
        <button style={st.exBtn}>NB</button>
        <button style={st.wktBtn}>WICKET</button>
        <button onClick={() => set(ref(db, 'liveMatch'), null)} style={st.reset}>Reset Match</button>
      </div>

      {modal && (
        <div style={st.modalBg} onClick={() => setModal(null)}>
          <div style={st.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'white', marginBottom:'15px'}}>Select Player</h3>
            {match[modal.key]?.players.map((p: any, i: number) => (
              <div key={i} onClick={() => {
                let m = {...match};
                if(modal.type === 'striker') m.striker = {name: p.name, idx: i};
                if(modal.type === 'nonStriker') m.nonStriker = {name: p.name, idx: i};
                if(modal.type === 'bowler') m.bowler.name = p.name;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }} style={st.playerItem}>{p.name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const st: any = {
  setupCont: { background: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '20px' },
  setupCard: { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px' },
  setupDP: { width: '70px', height: '70px', borderRadius: '50%', margin: '0 auto 15px', display: 'block', border: '2px solid #f5cd11' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white' },
  area: { padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', minHeight: '80px' },
  goBtn: { background: '#f5cd11', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  appWrap: { background: '#0f172a', minHeight: '100vh', color: 'white' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#1e293b', borderBottom: '1px solid #f5cd11' },
  miniDP: { width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #f5cd11' },
  headText: { fontWeight: 'bold', color: '#f5cd11', fontSize: '14px' },
  waBtn: { background: '#25D366', color: 'white', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px' },
  scoreZone: { margin: '15px', padding: '20px', background: '#1e293b', borderRadius: '20px', border: '1px solid #334155' },
  vsLine: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#94a3b8' },
  bigNum: { fontSize: '50px', textAlign: 'center', margin: '15px 0', fontWeight: 'bold' },
  battingBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
  playerRow: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' },
  bowlRow: { padding: '12px', background: 'rgba(245, 205, 17, 0.1)', borderRadius: '10px', color: '#f5cd11' },
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '15px' },
  numBtn: { padding: '18px', borderRadius: '10px', background: 'white', color: '#0f172a', fontWeight: 'bold', border: 'none' },
  exBtn: { background: '#f5cd11', color: 'black', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 2', background: '#ef4444', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  reset: { gridColumn: 'span 4', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '10px', marginTop: '10px' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { background: '#1e293b', padding: '20px', borderRadius: '15px', width: '85%', maxHeight: '70%', overflowY: 'auto' },
  playerItem: { padding: '15px', color: 'white', borderBottom: '1px solid #334155', textAlign: 'center' }
};
