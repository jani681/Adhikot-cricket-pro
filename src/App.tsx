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

export default function UpgradedCricketApp() {
  const [match, setMatch] = useState<any>(null);
  const [view, setView] = useState<'live' | 'setup' | 'login'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [modal, setModal] = useState<{type: string, list: any[]} | null>(null);
  const [adminData, setAdminData] = useState({
    name: "Touqeer Iqbal Baghoor",
    dp: "",
    wa: "923015800630"
  });

  // Load Admin Data & Match
  useEffect(() => {
    const savedDp = localStorage.getItem('adminDp');
    if (savedDp) setAdminData(prev => ({ ...prev, dp: savedDp }));
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleDpUpload = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      localStorage.setItem('adminDp', base64String);
      setAdminData(prev => ({ ...prev, dp: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAdmin(true);
      setView('live');
    } else {
      alert("Wrong Password!");
    }
  };

  const updateScore = (r: number, type = "n") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    if (type === "W") {
      m.wkts += 1; m.balls += 1; m.striker.b += 1; m.striker = null;
    } else if (type === "WD" || type === "NB") {
      m.score += (r + 1);
    } else {
      m.score += r; m.balls += 1; m.striker.r += r; m.striker.b += 1;
      if (r === 4) m.striker.f += 1;
      if (r === 6) m.striker.s += 1;
      if (r % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }
    if (m.balls === 6) { m.ovs += 1; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
  };

  const sendWhatsApp = (p: any) => {
    const text = `🏏 *LIVE UPDATE* 🏏%0A${match.tA} vs ${match.tB}%0AScore: ${match.score}/${match.wkts} (${match.ovs}.${match.balls})%0A${p.name}: ${p.r}(${p.b})%0ARR: ${((match.score/((match.ovs*6)+match.balls))*6).toFixed(2)}`;
    window.open(`https://wa.me/${adminData.wa}?text=${text}`, '_blank');
  };

  return (
    <div style={s.container}>
      {/* ADMIN HEADER */}
      <div style={s.header}>
        <div style={s.adminRow}>
          <div style={s.dpContainer}>
            {adminData.dp ? <img src={adminData.dp} style={s.dp} /> : <div style={s.dpPlaceholder}>DP</div>}
            {isAdmin && <input type="file" onChange={handleDpUpload} style={s.fileInput} />}
          </div>
          <div style={{flex:1}}>
            <div style={s.adminName}>{adminData.name}</div>
            <div style={s.waStatus}>🟢 Admin WhatsApp Active</div>
          </div>
          <button onClick={() => setView(isAdmin ? 'setup' : 'login')} style={s.loginBtn}>
            {isAdmin ? "+ Match" : "Login"}
          </button>
        </div>
      </div>

      {/* VIEWS */}
      {view === 'login' && (
        <div style={s.card}>
          <input type="password" placeholder="Admin Password" onChange={e=>setPassword(e.target.value)} style={s.input} />
          <button onClick={handleLogin} style={s.createBtn}>ENTER ADMIN PANEL</button>
        </div>
      )}

      {view === 'setup' && isAdmin && (
        <form style={s.form} onSubmit={(e:any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const players = (val:any) => val.split(",").map((n:any)=>({name:n.trim(), r:0, b:0, f:0, s:0}));
          const m = {
            tA: fd.get('tA'), tB: fd.get('tB'),
            pA: players(fd.get('pA')), pB: players(fd.get('pB')),
            score: 0, wkts: 0, balls: 0, ovs: 0, target: 0, inning: 1,
            striker: null, nonStriker: null, bowler: null
          };
          set(ref(db, 'liveMatch'), m);
          setView('live');
        }}>
          <input name="tA" placeholder="Batting Team" style={s.input} />
          <textarea name="pA" placeholder="Batsmen (Ali, Ahmed...)" style={s.area} />
          <input name="tB" placeholder="Bowling Team" style={s.input} />
          <textarea name="pB" placeholder="Bowlers (Zaid, Khan...)" style={s.area} />
          <button type="submit" style={s.createBtn}>START MATCH</button>
        </form>
      )}

      {view === 'live' && match && (
        <div style={s.scorecard}>
          <div style={s.mainScore}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
          <div style={s.rrBox}>RR: {match.ovs > 0 ? ((match.score/(match.ovs + match.balls/6))).toFixed(2) : "0.00"}</div>
          
          {/* TEAM DISPLAY & SELECTION */}
          <div style={s.playerGrid}>
            <div style={s.pRow} onClick={()=>isAdmin && setModal({type:'striker', list:match.pA})}>
              <span>{match.striker ? `🏏 ${match.striker.name}*` : "Select Striker"}</span>
              <span>{match.striker ? `${match.striker.r}(${match.striker.b})` : "0(0)"}</span>
              <span onClick={(e)=>{e.stopPropagation(); sendWhatsApp(match.striker)}} style={s.waIconSmall}>📞</span>
            </div>
            <div style={s.pRow} onClick={()=>isAdmin && setModal({type:'nonStriker', list:match.pA})}>
              <span>{match.nonStriker ? `🏏 ${match.nonStriker.name}` : "Select Non-Striker"}</span>
              <span>{match.nonStriker ? `${match.nonStriker.r}(${match.nonStriker.b})` : "0(0)"}</span>
              <span onClick={(e)=>{e.stopPropagation(); sendWhatsApp(match.nonStriker)}} style={s.waIconSmall}>📞</span>
            </div>
            <div style={{...s.pRow, background:'#334155'}} onClick={()=>isAdmin && setModal({type:'bowler', list:match.pB})}>
              <span>🎾 {match.bowler ? match.bowler.name : "Select Bowler"}</span>
              <span>BOWLER</span>
            </div>
          </div>

          {isAdmin && (
            <div style={s.controls}>
              <div style={s.btnGrid}>
                {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={s.numBtn}>{n}</button>)}
                <button onClick={()=>updateScore(0,"WD")} style={s.extraBtn}>WD</button>
                <button onClick={()=>updateScore(0,"NB")} style={s.extraBtn}>NB</button>
              </div>
              <button onClick={()=>updateScore(0,"W")} style={s.wktBtn}>WICKET OUT</button>
            </div>
          )}
        </div>
      )}

      {/* MODAL FOR FULL TEAM LIST */}
      {modal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3 style={{textAlign:'center'}}>Select {modal.type}</h3>
            {modal.list.map((p, i) => (
              <div key={i} style={s.listItem} onClick={() => {
                let m = {...match};
                m[modal.type] = p;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }}>{p.name}</div>
            ))}
            <button onClick={()=>setModal(null)} style={s.wktBtn}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: any = {
  container: { background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#1e293b', padding: '15px', borderBottom: '2px solid #eab308' },
  adminRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  dpContainer: { position: 'relative', width: '55px', height: '55px' },
  dp: { width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #eab308', objectFit: 'cover' },
  dpPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fileInput: { position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' },
  adminName: { fontWeight: 'bold', fontSize: '16px', color: '#eab308' },
  waStatus: { fontSize: '11px', color: '#22c55e' },
  loginBtn: { background: '#eab308', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold' },
  scorecard: { padding: '20px' },
  mainScore: { fontSize: '50px', fontWeight: 'bold', textAlign: 'center' },
  rrBox: { textAlign: 'center', color: '#eab308', margin: '10px 0' },
  playerGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  pRow: { background: '#1e293b', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  waIconSmall: { background: '#22c55e', padding: '5px 10px', borderRadius: '50%', fontSize: '12px' },
  btnGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' },
  numBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  extraBtn: { padding: '15px', background: '#eab308', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { width: '100%', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { background: '#1e293b', width: '85%', padding: '20px', borderRadius: '15px' },
  listItem: { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center', fontSize: '18px' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#0f172a', color: 'white' },
  area: { width: '100%', padding: '12px', height: '80px', borderRadius: '5px', background: '#0f172a', color: 'white', marginBottom: '10px' },
  createBtn: { width: '100%', padding: '15px', background: '#eab308', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  card: { padding: '40px 20px' }
};
