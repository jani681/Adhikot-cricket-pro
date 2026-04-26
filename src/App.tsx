import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const ADMIN_PIN = "6545";

export default function AdhikotCricketFinal() {
  const [match, setMatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'live' | 'setup' | 'history' | 'admin'>('live');
  const [isAdmin, setIsAdmin] = useState(false);
  const [anim, setAnim] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    const histRef = ref(db, 'history');
    
    const unsub = onValue(matchRef, (snap) => {
      setMatch(snap.val() || null);
      setLoading(false);
    }, () => setLoading(false));

    onValue(histRef, (snap) => {
      const d = snap.val();
      setHistory(d ? Object.entries(d).map(([id, v]: any) => ({ ...v, id })) : []);
    });

    return () => unsub();
  }, []);

  const trigger = (txt: string) => {
    setAnim(txt);
    setTimeout(() => setAnim(""), 2500);
  };

  const shareWA = (p: any) => {
    if(!match) return;
    const msg = `🏏 *LIVE:* ${match.team1.name} vs ${match.team2.name}\n📊 Score: ${match.score}/${match.wkts}\n🥎 Overs: ${match.ovs}.${match.balls}\n👤 Umpire: ${match.umpire}\n🕒 Time: ${match.time}`;
    window.open(`https://wa.me/${p.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const update = (runs: number, type = "reg") => {
    if(!isAdmin || !match) return;
    let m = JSON.parse(JSON.stringify(match));
    
    if(type === "W") { m.wkts++; m.balls++; trigger("OUT! ☝️"); m.striker = null; }
    else if(type === "WD") { m.score += (runs + 1); trigger("WIDE ↔️"); }
    else if(type === "NB") { m.score += (runs + 1); m.freeHit = true; trigger("NO BALL ⚠️"); }
    else {
      m.score += runs; m.balls++; m.freeHit = false;
      if(runs === 4) trigger("FOUR! 🏏");
      if(runs === 6) trigger("SIX! 🚀");
      if(m.striker) { m.striker.r = (m.striker.r || 0) + runs; m.striker.b = (m.striker.b || 0) + 1; }
      if(runs % 2 !== 0) [m.striker, m.nonStriker] = [m.nonStriker, m.striker];
    }

    if(m.balls >= 6) { m.ovs++; m.balls = 0; [m.striker, m.nonStriker] = [m.nonStriker, m.striker]; m.bowler = null; }
    set(ref(db, 'liveMatch'), m);
  };

  if(loading) return <div style={css.loader}>Connecting to Adhikot Server...</div>;

  return (
    <div style={css.app}>
      {/* Header */}
      <div style={css.nav}>
        <div style={css.user}>
          <div style={css.dp}>T</div>
          <div><b>Touqeer Iqbal Baghoor</b><br/><small>{isAdmin ? "Admin Control" : "Live View"}</small></div>
        </div>
        <div style={css.tabs}>
          <button onClick={() => setView('live')} style={view==='live'?css.tabA:css.tab}>LIVE</button>
          <button onClick={() => setView('history')} style={view==='history'?css.tabA:css.tab}>HISTORY</button>
          {!isAdmin ? <button onClick={()=>setView('admin')} style={css.tab}>LOGIN</button> : <button onClick={()=>setView('setup')} style={css.gold}>START</button>}
        </div>
      </div>

      {anim && <div style={css.popup}>{anim}</div>}

      {view === 'admin' && (
        <div style={css.card}>
          <h3>Admin Auth</h3>
          <input type="password" onChange={e=>setPin(e.target.value)} style={css.input} placeholder="Enter 6545" />
          <button onClick={()=>{if(pin===ADMIN_PIN){setIsAdmin(true); setView('live');}}} style={css.btn}>UNLOCK</button>
        </div>
      )}

      {view === 'setup' && (
        <form style={css.card} onSubmit={(e: any) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const parse = (v: any) => v.split('\n').filter((x:any)=>x).map((l: any) => ({ name: l.split(',')[0], phone: l.split(',')[1] || '9230000000', r: 0, b: 0 }));
          set(ref(db, 'liveMatch'), {
            league: fd.get('lg'), umpire: fd.get('up'), time: fd.get('tm'), target: fd.get('tr'),
            team1: { name: fd.get('t1'), p: parse(fd.get('p1')) },
            team2: { name: fd.get('t2'), p: parse(fd.get('p2')) },
            score: 0, wkts: 0, ovs: 0, balls: 0, striker: null, nonStriker: null, bowler: null
          });
          setView('live');
        }}>
          <input name="lg" placeholder="Match Name" style={css.input} required />
          <input name="up" placeholder="Empire Name" style={css.input} required />
          <input name="tm" placeholder="Match Time" style={css.input} required />
          <input name="tr" placeholder="Target" style={css.input} />
          <input name="t1" placeholder="Batting Team" style={css.input} required />
          <textarea name="p1" placeholder="Batsmen (Name,WhatsApp)" style={css.area} required />
          <input name="t2" placeholder="Bowling Team" style={css.input} required />
          <textarea name="p2" placeholder="Bowlers (Name,WhatsApp)" style={css.area} required />
          <button type="submit" style={css.btn}>ACTIVATE LIVE MATCH</button>
        </form>
      )}

      {view === 'live' && match && (
        <div style={css.pad}>
          <div style={css.scoreBox}>
            <div style={css.meta}>{match.league} | {match.time}</div>
            <div style={css.umpText}>Empire: {match.umpire}</div>
            <div style={css.scoreTxt}>{match.score}/{match.wkts} <small>({match.ovs}.{match.balls})</small></div>
            <div style={css.rr}>RR: {(match.score / (match.ovs + match.balls/6 || 1)).toFixed(2)} {match.target && `| Target: ${match.target}`}</div>
            {match.freeHit && <div style={css.fh}>FREE HIT ⚡</div>}
          </div>

          <div style={css.playerGrid}>
            <div style={css.pCard} onClick={() => { if(isAdmin) { let p = match.team1.p[prompt("Index?") || 0]; set(ref(db, 'liveMatch/striker'), p); } }}>
              <span>🏏 {match.striker?.name || "Set Striker"}*</span>
              <b>{match.striker?.r || 0}({match.striker?.b || 0})</b>
            </div>
            <div style={css.pCard}>
              <span>🏏 {match.nonStriker?.name || "Set Non-Striker"}</span>
              <b>{match.nonStriker?.r || 0}({match.nonStriker?.b || 0})</b>
            </div>
            <div style={css.pCard} style={{gridColumn:'span 2', borderColor:'#facc15'}}>
               ⚾ Bowler: {match.bowler?.name || "Set Bowler"}
            </div>
          </div>

          <div style={css.list}>
            {match.team1.p.map((p:any, i:number)=>(
              <div key={i} style={css.row}>
                <span>{p.name}</span>
                <button onClick={()=>shareWA(p)} style={css.wa}>WhatsApp</button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div style={css.adminControls}>
              {[0,1,2,3,4,6].map(n => <button key={n} onClick={()=>update(n)} style={css.nBtn}>{n}</button>)}
              <button onClick={()=>update(0, "WD")} style={css.ex}>WD</button>
              <button onClick={()=>update(0, "NB")} style={css.ex}>NB</button>
              <button onClick={()=>update(0, "W")} style={css.wkt}>OUT</button>
              <button onClick={()=>{push(ref(db,'history'), match); remove(ref(db,'liveMatch'));}} style={css.end}>FINISH</button>
            </div>
          )}
        </div>
      )}

      {view === 'history' && (
        <div style={css.pad}>
          {history.map(h => (
            <div key={h.id} style={css.card}>
              <b>{h.team1.name} vs {h.team2.name}</b><br/>
              Score: {h.score}/{h.wkts} ({h.ovs}.{h.balls})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const css: any = {
  app: { background: '#05060f', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui' },
  nav: { background: '#121421', padding: '15px', borderBottom: '2px solid #facc15' },
  user: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  dp: { width: '40px', height: '40px', background: '#facc15', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  tabs: { display: 'flex', gap: '5px' },
  tab: { flex: 1, padding: '8px', background: '#1e213a', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' },
  tabA: { flex: 1, padding: '8px', background: '#facc15', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 'bold' },
  gold: { flex: 1, padding: '8px', background: '#facc15', color: '#000', borderRadius: '6px', fontWeight: 'bold' },
  pad: { padding: '15px' },
  scoreBox: { background: 'linear-gradient(to bottom, #161a31, #05060f)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid #334155' },
  scoreTxt: { fontSize: '50px', fontWeight: '900', color: '#facc15', margin: '10px 0' },
  umpText: { color: '#facc15', fontSize: '14px', marginBottom: '5px' },
  meta: { fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' },
  rr: { fontWeight: 'bold' },
  popup: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', background: '#facc15', color: '#000', padding: '40px 60px', borderRadius: '100px', fontSize: '40px', fontWeight: '900', zIndex: 1000, boxShadow: '0 0 50px #facc15' },
  playerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' },
  pCard: { background: '#121421', padding: '15px', borderRadius: '12px', border: '1px solid #334155' },
  adminControls: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '20px' },
  nBtn: { padding: '15px', background: '#fff', color: '#000', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '18px' },
  ex: { background: '#facc15', color: '#000', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  wkt: { gridColumn: 'span 4', background: '#ef4444', color: '#fff', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold' },
  end: { gridColumn: 'span 4', background: '#334155', color: '#fff', padding: '10px', borderRadius: '10px', border: 'none', marginTop: '5px' },
  input: { width: '100%', padding: '12px', background: '#121421', border: '1px solid #334155', color: '#fff', borderRadius: '10px', marginBottom: '10px' },
  area: { width: '100%', height: '80px', background: '#121421', border: '1px solid #334155', color: '#fff', borderRadius: '10px', marginBottom: '10px', padding: '10px' },
  btn: { width: '100%', padding: '15px', background: '#facc15', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #1e213a' },
  wa: { background: '#25D366', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060f', color: '#facc15' },
  fh: { color: '#ef4444', fontWeight: 'bold', marginTop: '10px' }
};
