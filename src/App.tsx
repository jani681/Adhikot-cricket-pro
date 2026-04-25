import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update } from "firebase/database";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_NAME = "Touqeer Iqbal Baghoor";
const ADMIN_WA = "923015800630";
const PASS_KEY = "6545";

export default function AdhiKotCricketApp() {
  const [match, setMatch] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'live' | 'setup' | 'login'>('live');
  const [passInp, setPassInp] = useState("");
  const [adminDp, setAdminDp] = useState("");
  const [modal, setModal] = useState<{type: string, list: any[]} | null>(null);

  useEffect(() => {
    const savedDp = localStorage.getItem('touqeer_dp');
    if (savedDp) setAdminDp(savedDp);
    onValue(ref(db, 'liveMatch'), (snap) => setMatch(snap.val()));
  }, []);

  const handleDp = (e: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAdminDp(b64);
      localStorage.setItem('touqeer_dp', b64);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const updateScore = (runs: number, extra: string = "") => {
    if (!match || !isAdmin || !match.striker) return;
    let m = { ...match };
    const sIdx = m.pBat.findIndex((p: any) => p.name === m.striker.name);

    if (extra === "W") {
      m.wkts += 1; m.balls += 1; m.pBat[sIdx].b += 1; m.striker = null;
    } else if (extra === "WD" || extra === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs; m.balls += 1;
      m.pBat[sIdx].r += runs; m.pBat[sIdx].b += 1;
      if (runs === 4) m.pBat[sIdx].f4 += 1;
      if (runs === 6) m.pBat[sIdx].s6 += 1;
      if (runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if (m.balls === 6) {
      m.ovs += 1; m.balls = 0;
      [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
      m.bowler = null;
    }
    set(ref(db, 'liveMatch'), m);
  };

  const sendWa = (pName: string) => {
    const text = `🏏 Match Update: ${match.score}/${match.wkts} (${match.ovs}.${match.balls}) - ${pName} is playing!`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={s.body}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.adminRow}>
          <div style={s.dpBox}>
            <img src={adminDp || "https://via.placeholder.com/100"} style={s.dp} />
            {isAdmin && <input type="file" onChange={handleDp} style={s.fileInp} />}
          </div>
          <div style={{flex:1}}>
            <div style={s.aName}>{ADMIN_NAME}</div>
            <div style={s.waLive}>🟢 WhatsApp Live Integrated</div>
          </div>
          <button onClick={() => setView(isAdmin ? 'setup' : 'login')} style={s.topBtn}>
            {isAdmin ? "+ Match" : "Login"}
          </button>
        </div>
      </div>

      {/* VIEWS */}
      {view === 'login' && (
        <div style={s.pad}>
          <input type="password" placeholder="Password: 6545" style={s.input} onChange={e=>setPassInp(e.target.value)} />
          <button onClick={()=> passInp === PASS_KEY ? (setIsAdmin(true), setView('live')) : alert("Wrong")} style={s.mBtn}>LOGIN</button>
        </div>
      )}

      {view === 'setup' && isAdmin && (
        <form style={s.pad} onSubmit={(e:any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const p = (v:any) => v.split(",").map((n:any)=>({name:n.trim(), r:0, b:0, f4:0, s6:0}));
          const mData = {
            league: fd.get('league'), ground: fd.get('ground'),
            pBat: p(fd.get('pBat')), pBow: p(fd.get('pBow')),
            score: 0, wkts: 0, balls: 0, ovs: 0, striker: null, nonStriker: null, bowler: null
          };
          set(ref(db, 'liveMatch'), mData);
          setView('live');
        }}>
          <input name="league" placeholder="League Name" style={s.input} />
          <input name="ground" placeholder="Ground" style={s.input} />
          <textarea name="pBat" placeholder="Batsmen (Ali, Ahmed...)" style={s.area} />
          <textarea name="pBow" placeholder="Bowlers (Zaid, Khan...)" style={s.area} />
          <button type="submit" style={s.mBtn}>START MATCH</button>
        </form>
      )}

      {view === 'live' && match && (
        <div style={s.pad}>
          <div style={s.card}>
            <div style={s.meta}>{match.league} | {match.ground}</div>
            <div style={s.score}>{match.score}/{match.wkts} <small style={{fontSize:'20px'}}>({match.ovs}.{match.balls})</small></div>
            <div style={s.rr}>RR: {(match.score / (match.ovs + match.balls/6 || 1)).toFixed(2)}</div>
          </div>

          {/* PLAYERS */}
          <div style={s.playerBox}>
            <div style={s.pRow} onClick={()=> isAdmin && setModal({type:'striker', list:match.pBat})}>
              <span>{match.striker ? `🏏 ${match.striker.name}*` : "Select Striker"}</span>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <span style={s.stats}>{match.striker ? `${match.striker.r}(${match.striker.b})` : "0(0)"}</span>
                <PhoneIcon onClick={()=>sendWa(match.striker?.name)} />
              </div>
            </div>
            <div style={s.pRow} onClick={()=> isAdmin && setModal({type:'nonStriker', list:match.pBat})}>
              <span>{match.nonStriker ? `🏏 ${match.nonStriker.name}` : "Select Non-Striker"}</span>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <span style={s.stats}>{match.nonStriker ? `${match.nonStriker.r}(${match.nonStriker.b})` : "0(0)"}</span>
                <PhoneIcon onClick={()=>sendWa(match.nonStriker?.name)} />
              </div>
            </div>
            <div style={{...s.pRow, background:'#2d3748'}} onClick={()=> isAdmin && setModal({type:'bowler', list:match.pBow})}>
              <span>🎾 {match.bowler ? match.bowler.name : "Select Bowler"}</span>
            </div>
          </div>

          {/* ADMIN CONTROLS */}
          {isAdmin && (
            <div style={s.grid}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>updateScore(n)} style={s.numBtn}>{n}</button>)}
              <button onClick={()=>updateScore(0,"WD")} style={s.exBtn}>WD</button>
              <button onClick={()=>updateScore(0,"NB")} style={s.exBtn}>NB</button>
              <button onClick={()=>updateScore(0,"W")} style={s.wktBtn}>WICKET</button>
            </div>
          )}
        </div>
      )}

      {/* SELECTION MODAL */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{textAlign:'center'}}>Choose {modal.type}</h3>
            {modal.list.map((p, i) => (
              <div key={i} style={s.listItem} onClick={() => {
                let m = {...match};
                m[modal.type] = p;
                set(ref(db, 'liveMatch'), m);
                setModal(null);
              }}>{p.name}</div>
            ))}
            <button onClick={()=>setModal(null)} style={s.mBtn}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple WhatsApp Icon Component
const PhoneIcon = ({onClick}: any) => (
  <div onClick={(e)=>{e.stopPropagation(); onClick();}} style={{background:'#22c55e', padding:'5px', borderRadius:'50%', cursor:'pointer', display:'flex'}}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.41 0 .01 5.399.007 12.039c0 2.122.554 4.197 1.607 6.048L0 24l6.103-1.6c1.801.98 3.829 1.5 5.94 1.5h.005c6.64 0 12.039-5.399 12.042-12.041a11.813 11.813 0 00-3.535-8.402z"/></svg>
  </div>
);

const s: any = {
  body: { background: '#0f172a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background: '#1e293b', padding: '15px', borderBottom: '2px solid #eab308' },
  adminRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  dpBox: { position: 'relative', width: '50px', height: '50px' },
  dp: { width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #eab308', objectFit: 'cover' },
  fileInp: { position: 'absolute', inset: 0, opacity: 0 },
  aName: { fontWeight: 'bold', fontSize: '14px', color: '#eab308' },
  waLive: { fontSize: '10px', color: '#22c55e' },
  topBtn: { background: '#eab308', border: 'none', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' },
  pad: { padding: '20px' },
  card: { background: '#1e293b', padding: '20px', borderRadius: '15px', textAlign: 'center', borderTop: '4px solid #eab308' },
  meta: { color: '#94a3b8', fontSize: '12px', marginBottom: '10px' },
  score: { fontSize: '50px', fontWeight: 'bold' },
  rr: { color: '#eab308', marginTop: '5px' },
  playerBox: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  pRow: { background: '#1e293b', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stats: { color: '#eab308', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' },
  numBtn: { padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  exBtn: { background: '#eab308', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  wktBtn: { gridColumn: 'span 4', padding: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', width: '85%', padding: '20px', borderRadius: '15px' },
  listItem: { padding: '15px', borderBottom: '1px solid #334155', textAlign: 'center' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '5px' },
  area: { width: '100%', padding: '12px', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '5px', height: '80px' },
  mBtn: { width: '100%', padding: '15px', background: '#eab308', border: 'none', borderRadius: '5px', fontWeight: 'bold' }
};
