import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_NAME = "Touqeer Iqbal Baghoor";
const ADMIN_WA = "923015800630";
const PASS_KEY = "6545"; // Updated Password

export default function AdhiKotCricketMaster() {
  const [match, setMatch] = useState<any>(null);
  const [view, setView] = useState<'live' | 'setup' | 'login'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInp, setPassInp] = useState('');
  const [adminDp, setAdminDp] = useState<string>("");
  const [modal, setModal] = useState<{type: string, list: any[]} | null>(null);

  useEffect(() => {
    // Load Admin DP from LocalStorage
    const saved = localStorage.getItem('admin_profile_pic');
    if (saved) setAdminDp(saved);
    
    // Listen to Firebase
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleDpUpload = (e: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAdminDp(base64);
      localStorage.setItem('admin_profile_pic', base64);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleUpdateScore = (runs: number, type = "n") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    if (type === "W") {
      m.wkts += 1; m.balls += 1; m.striker.b += 1; m.striker = null;
    } else if (type === "WD" || type === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs; m.balls += 1; m.striker.r += runs; m.striker.b += 1;
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    if (m.balls === 6) { m.ovs += 1; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
  };

  return (
    <div style={s.container}>
      {/* PERMANENT ADMIN HEADER */}
      <div style={s.header}>
        <div style={s.adminRow}>
          <div style={s.dpBox}>
            <img src={adminDp || "https://via.placeholder.com/150"} style={s.dp} />
            {isAdmin && <input type="file" style={s.fileInp} onChange={handleDpUpload} />}
          </div>
          <div style={{flex:1}}>
            <div style={s.aName}>{ADMIN_NAME}</div>
            <a href={`https://wa.me/${ADMIN_WA}`} style={s.waLink}>🟢 WhatsApp Admin</a>
          </div>
          <button onClick={() => setView(isAdmin ? 'setup' : 'login')} style={s.btnAdmin}>
            {isAdmin ? "+ Match" : "Login"}
          </button>
        </div>
      </div>

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div style={s.pad}>
          <input type="password" placeholder="Enter Password" style={s.input} onChange={e=>setPassInp(e.target.value)} />
          <button onClick={() => passInp === PASS_KEY ? (setIsAdmin(true), setView('live')) : alert("Wrong!")} style={s.mBtn}>LOGIN</button>
        </div>
      )}

      {/* SETUP VIEW */}
      {view === 'setup' && isAdmin && (
        <form style={s.pad} onSubmit={(e:any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const p = (v:any) => v.split(",").map((n:any)=>({name:n.trim(), r:0, b:0}));
          const mData = {
            tA: fd.get('tA'), tB: fd.get('tB'),
            pA: p(fd.get('pA')), pB: p(fd.get('pB')),
            score: 0, wkts: 0, balls: 0, ovs: 0, inning: 1, striker: null, nonStriker: null, bowler: null
          };
          set(ref(db, 'liveMatch'), mData);
          setView('live');
        }}>
          <input name="tA" placeholder="Batting Team" style={s.input} />
          <textarea name="pA" placeholder="Team A Players (Ali, Ahmed...)" style={s.area} />
          <input name="tB" placeholder="Bowling Team" style={s.input} />
          <textarea name="pB" placeholder="Team B Players (Zaid, Khan...)" style={s.area} />
          <button type="submit" style={s.mBtn}>START MATCH</button>
        </form>
      )}

      {/* LIVE SCORECARD */}
      {view === 'live' && match && (
        <div style={s.scoreCard}>
          <div style={s.bigScore}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
          <div style={s.rr}>RR: {(match.score / (match.ovs + match.balls/6 || 1)).toFixed(2)}</div>
          
          <div style={s.playerArea}>
            <div style={s.pRow} onClick={()=>isAdmin && setModal({type:'striker', list:match.pA})}>
              <span>{match.striker ? `🏏 ${match.striker.name}*` : "Select Striker"}</span>
              <span>{match.striker ? `${match.striker.r}(${match.striker.b})` : "0(0)"}</span>
            </div>
            <div style={s.pRow} onClick={()=>isAdmin && setModal({type:'nonStriker', list:match.pA})}>
              <span>{match.nonStriker ? `🏏 ${match.nonStriker.name}` : "Select Non-Striker"}</span>
              <span>{match.nonStriker ? `${match.nonStriker.r}(${match.nonStriker.b})` : "0(0)"}</span>
            </div>
            <div style={{...s.pRow, background:'#334155'}} onClick={()=>isAdmin && setModal({type:'bowler', list:match.pB})}>
              <span>🎾 {match.bowler ? match.bowler.name : "Select Bowler"}</span>
            </div>
          </div>

          {isAdmin && (
            <div style={s.adminP}>
              <div style={s.grid}>
                {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>handleUpdateScore(n)} style={s.scBtn}>{n}</button>)}
                <button onClick={()=>handleUpdateScore(0,"WD")} style={s.exBtn}>WD</button>
                <button onClick={()=>handleUpdateScore(0,"NB")} style={s.exBtn}>NB</button>
              </div>
              <button onClick={()=>handleUpdateScore(0,"W")} style={s.wktBtn}>WICKET OUT</button>
              <button onClick={()=>remove(ref(db, 'liveMatch'))} style={s.delBtn}>DELETE MATCH</button>
            </div>
          )}
        </div>
      )}

      {/* FULL TEAM SELECTION MODAL */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3>Select {modal.type}</h3>
            {modal.list.map((p, i) => (
              <div key={i} style={s.listItem} onClick={() => {
                let m = {...match};
                m[modal.type] = p;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }}>{p.name}</div>
            ))}
            <button onClick={()=>setModal(null)} style={s.wktBtn}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: any = {
  container: { background: '#0a0f1e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#161d31', padding: '15px', borderBottom: '2px solid #f5cd11' },
  adminRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  dpBox: { position: 'relative', width: '55px', height: '55px' },
  dp: { width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #f5cd11', objectFit: 'cover' },
  fileInp: { position: 'absolute', inset: 0, opacity: 0 },
  aName: { fontWeight: 'bold', fontSize: '15px', color: '#f5cd11' },
  waLink: { fontSize: '11px', color: '#22c55e', textDecoration: 'none' },
  btnAdmin: { background: '#f5cd11', border: 'none', padding: '8px 12px', borderRadius: '5px', fontWeight: 'bold' },
  scoreCard: { padding: '20px' },
  bigScore: { fontSize: '55px', textAlign: 'center', fontWeight: 'bold' },
  rr: { textAlign: 'center', color: '#f5cd11', marginBottom: '20px' },
  playerArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
  pRow: { background: '#161d31', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' },
  scBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  exBtn: { background: '#f5cd11', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold' },
  delBtn: { width: '100%', background: 'none', color: '#666', border: 'none', marginTop: '10px', fontSize: '12px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: '#161d31', width: '85%', padding: '20px', borderRadius: '15px' },
  listItem: { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center', fontSize: '18px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#0a0f1e', color: 'white', border: '1px solid #334155' },
  area: { width: '100%', padding: '12px', height: '80px', background: '#0a0f1e', color: 'white', border: '1px solid #334155' },
  mBtn: { width: '100%', padding: '15px', background: '#f5cd11', border: 'none', fontWeight: 'bold' },
  pad: { padding: '20px' }
};
