import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";
import { FaWhatsapp, FaSyncAlt, FaUserShield, FaTrophy, FaTrash, FaSave, FaPlay, FaCog, FaUsers } from 'react-icons/fa';

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg",
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProProfessional() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selModal, setSelModal] = useState(null);
  const [squadModal, setSquadModal] = useState(null); // To view full team
  const [extraModal, setExtraModal] = useState(null);
  const [wktModal, setWktModal] = useState(false);
  const [anim, setAnim] = useState("");

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    return onValue(matchRef, (snap) => {
      const data = snap.val();
      if (data) {
        // Winning Logic Fix
        if (data.innings === 2 && data.score >= data.target) {
          data.status = 'Finished';
          data.winner = data.battingTeam;
        } else if (data.ov >= data.maxOv || data.wkts >= 10) {
          if (data.innings === 1) data.status = 'Innings Break';
          else {
            data.status = 'Finished';
            data.winner = data.score < data.target - 1 ? data.bowlingTeam : 'Match Tied';
          }
        }
        setMatch(data);
      }
    });
  }, []);

  const handleScore = (runs, type = 'normal', outType = null) => {
    if (!match || match.status === 'Finished') return;
    let data = { ...match };
    let striker = data.active === 1 ? data.s1 : data.s2;

    if (type === 'normal') {
      data.score += runs; data.bwr_r += runs;
      data.bl += 1; // Increment ball
      striker.r = (parseInt(striker.r) || 0) + runs;
      striker.b += 1;
      if (runs === 4) striker.fours = (striker.fours || 0) + 1;
      if (runs === 6) striker.sixes = (striker.sixes || 0) + 1;
    } else if (type === 'wd' || type === 'nb') {
      data.score += (1 + runs); data.bwr_r += (1 + runs);
      if (type === 'nb') { striker.r += runs; striker.b += 1; }
    }

    if (outType) {
      data.wkts += 1; 
      if (outType !== 'Run Out') data.bwr_w += 1;
      striker.isOut = true;
      striker.outDesc = outType;
    }

    // Strike Rotation
    if (runs % 2 !== 0 && type !== 'wd') data.active = data.active === 1 ? 2 : 1;

    // Over Completion Logic (Fixing Countless Balls)
    if (data.bl === 6) {
      data.ov += 1;
      data.bl = 0;
      data.bwr_o += 1;
      data.active = data.active === 1 ? 2 : 1; // Change strike on over end
    }

    update(ref(db, 'liveMatch'), data);
    setExtraModal(null); setWktModal(false);
  };

  const sendWhatsApp = () => {
    const text = `🏏 *Live Match Update* 🏏\n${match.battingTeam}: ${match.score}/${match.wkts}\nOvers: ${match.ov}.${match.bl}\nTarget: ${match.target || 'N/A'}`;
    window.open(`https://wa.me/923015800630?text=${encodeURIComponent(text)}`);
  };

  return (
    <div style={s.container}>
      {/* Header with WhatsApp & Admin */}
      <div style={s.header}>
        <div style={s.flexBetween}>
          <div style={s.flex} onClick={() => setShowAuth(true)}>
            <div style={s.avatar}>{match?.lg?.charAt(0) || 'T'}</div>
            <div>
              <b>{match?.lg || 'Adhikot Pro'}</b><br/>
              <small style={{color: isAdmin ? '#22c55e' : '#ef4444'}}>● {isAdmin ? 'ADMIN ACTIVE' : 'LIVE'}</small>
            </div>
          </div>
          <div style={s.flex}>
            <FaWhatsapp size={24} color="#22c55e" style={{cursor:'pointer'}} onClick={sendWhatsApp} />
            <FaCog size={20} style={{marginLeft:'15px', opacity:0.5}} onClick={() => setShowAuth(true)} />
          </div>
        </div>
      </div>

      {!match ? (
         <div style={s.setupBox}>Setup Match Content... (Same as previous setup form)</div>
      ) : (
        <div style={{padding:'10px'}}>
          {/* Main Scorecard */}
          <div style={s.card}>
            <div style={s.teamNames}>{match.t1} <span style={{color:'#facc15'}}>vs</span> {match.t2}</div>
            <div style={s.battingTeamName} onClick={() => setSquadModal('batting')}>
              {match.battingTeam} <FaUsers size={14}/>
            </div>
            <div style={s.mainScore}>{match.score}/{match.wkts}</div>
            <div style={s.overInfo}>Overs: {match.ov}.{match.bl} / {match.maxOv}</div>
            {match.target > 0 && <div style={s.targetBox}>Target: {match.target}</div>}
          </div>

          {/* Batsmen Stats with 4s/6s */}
          <div style={s.playerCard}>
            {[match.s1, match.s2].map((p, i) => (
              <div key={i} style={match.active === (i+1) ? s.activeP : s.pRow}>
                <span onClick={() => isAdmin && setSelModal(i === 0 ? 's1' : 's2')}>
                  {p.n}{match.active === (i+1) ? '*' : ''} {isAdmin && <FaSyncAlt size={12}/>}
                </span>
                <div style={s.statsGroup}>
                  <span style={s.runText}>{p.r}({p.b})</span>
                  <span style={s.smallStats}>4s:{p.fours || 0} | 6s:{p.sixes || 0}</span>
                </div>
              </div>
            ))}
            <div style={s.divider}></div>
            <div style={s.pRow} onClick={() => isAdmin && setSelModal('bwr')}>
              <span style={{color:'#60a5fa'}}>{match.bwr} (B)</span>
              <span>{match.bwr_w}/{match.bwr_r} ({match.bwr_o}.{match.bl})</span>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && match.status !== 'Finished' && (
            <div style={s.adminGrid}>
              {[0,1,2,3,4,6].map(r => <button key={r} onClick={()=>handleScore(r)} style={s.numBtn}>{r}</button>)}
              <button onClick={()=>setExtraModal('wd')} style={s.exBtn}>WD+</button>
              <button onClick={()=>setExtraModal('nb')} style={s.nbBtn}>NB+</button>
              <button onClick={()=>setWktModal(true)} style={s.wktBtn}>OUT</button>
              
              <div style={{gridColumn:'span 3', display:'flex', gap:'10px', marginTop:'10px'}}>
                <button onClick={() => update(ref(db, 'liveMatch'), { /* switch innings logic */ })} style={s.saveBtn}>2ND INNINGS</button>
                <button onClick={() => remove(ref(db, 'liveMatch'))} style={s.delBtn}><FaTrash/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Squad View Modal */}
      {squadModal && (
        <div style={s.overlay} onClick={() => setSquadModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#facc15'}}>{squadModal === 'batting' ? match.battingTeam : match.bowlingTeam} Squad</h3>
            {(squadModal === 'batting' ? match.t1p : match.t2p).map((name, idx) => (
              <div key={idx} style={s.pItem}>{idx + 1}. {name}</div>
            ))}
            <button onClick={() => setSquadModal(null)} style={s.goldBtn}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { background: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' },
  header: { background:'#0f172a', padding:'15px', borderBottom:'1px solid #1e293b' },
  flexBetween: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  flex: { display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:'40px', height:'40px', background:'#facc15', borderRadius:'10px', color:'black', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'20px' },
  card: { background:'#0f172a', padding:'25px', borderRadius:'24px', textAlign:'center', margin:'12px', border:'1px solid #1e293b', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.5)' },
  teamNames: { fontSize:'14px', textTransform:'uppercase', letterSpacing:'1px', opacity:0.6, marginBottom:'5px' },
  battingTeamName: { fontSize:'20px', fontWeight:'bold', color:'#facc15', marginBottom:'10px', cursor:'pointer' },
  mainScore: { fontSize:'64px', fontWeight:'bold', color:'white', lineHeight:1 },
  overInfo: { fontSize:'18px', opacity:0.8, marginTop:'5px' },
  targetBox: { background:'#facc15', color:'black', padding:'6px 20px', borderRadius:'50px', fontWeight:'bold', marginTop:'15px', display:'inline-block', fontSize:'14px' },
  playerCard: { background:'#0f172a', margin:'12px', padding:'20px', borderRadius:'20px' },
  pRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0' },
  activeP: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', color:'#facc15', fontWeight:'bold' },
  statsGroup: { textAlign:'right' },
  runText: { fontSize:'18px', display:'block' },
  smallStats: { fontSize:'11px', opacity:0.6 },
  divider: { height:'1px', background:'#1e293b', margin:'10px 0' },
  adminGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', padding:'12px' },
  numBtn: { padding:'18px', background:'white', color:'black', borderRadius:'15px', fontWeight:'bold', border:'none', fontSize:'18px' },
  exBtn: { padding:'18px', background:'#fb923c', color:'white', borderRadius:'15px', fontWeight:'bold', border:'none' },
  wktBtn: { padding:'18px', background:'#ef4444', color:'white', borderRadius:'15px', fontWeight:'bold', border:'none' },
  saveBtn: { flex:2, padding:'15px', background:'#22c55e', color:'white', borderRadius:'12px', fontWeight:'bold', border:'none' },
  delBtn: { flex:1, padding:'15px', background:'#b91c1c', color:'white', borderRadius:'12px', fontWeight:'bold', border:'none' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'#1e293b', width:'85%', padding:'20px', borderRadius:'24px', maxHeight:'80vh', overflowY:'auto' },
  pItem: { padding:'12px', borderBottom:'1px solid #334155', textAlign:'left', fontSize:'14px' },
  goldBtn: { width:'100%', padding:'12px', background:'#facc15', color:'black', borderRadius:'10px', fontWeight:'bold', border:'none', marginTop:'15px' }
};
