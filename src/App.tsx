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

// TOUQEER IQBAL PERMANENT DATA
const ADMIN = {
  name: "Touqeer Iqbal",
  dp: "https://i.ibb.co/vzYyLz7/touqeer.jpg",
  wa: "923015800630"
};

export default function AdhiKotCricketFinal() {
  const [match, setMatch] = useState<any>(null);
  const [modal, setModal] = useState<{type: string, teamKey: string} | null>(null);
  const [isSetup, setIsSetup] = useState(true);

  useEffect(() => {
    const matchRef = ref(db, 'liveMatch');
    onValue(matchRef, (snap) => {
      const val = snap.val();
      if (val && val.teamA) {
        setMatch(val);
        setIsSetup(false);
      } else {
        setIsSetup(true);
      }
    });
  }, []);

  const startMatch = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pA = (fd.get("pA") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));
    const pB = (fd.get("pB") as string).split(",").map(n => ({ name: n.trim(), runs: 0, balls: 0 }));

    const init = {
      teamA: { name: fd.get("tA") || "Team A", players: pA },
      teamB: { name: fd.get("tB") || "Team B", players: pB },
      score: 0, wickets: 0, balls: 0, overs: 0,
      innings: 1,
      striker: { name: "Select Striker", idx: -1 },
      nonStriker: { name: "Select Non-Striker", idx: -1 },
      bowler: { name: "Select Bowler", wkts: 0 }
    };
    set(ref(db, 'liveMatch'), init);
  };

  const updateScore = (runs: number, extra: string = "") => {
    if (!match || match.wickets >= 10) return;
    if (match.striker.idx === -1 || match.nonStriker.idx === -1) {
        alert("Pehlay Batsmen Select Karein!");
        return;
    }

    let m = JSON.parse(JSON.stringify(match));
    const batTeamKey = m.innings === 1 ? 'teamA' : 'teamB';

    if (extra === "W") {
      m.wickets += 1;
      m.balls += 1;
      m[batTeamKey].players[m.striker.idx].balls += 1;
      m.striker = { name: "Select New Batsman", idx: -1 };
    } else if (extra === "WD" || extra === "NB") {
      m.score += (runs + 1);
    } else {
      m.score += runs;
      m.balls += 1;
      m[batTeamKey].players[m.striker.idx].runs += runs;
      m[batTeamKey].players[m.striker.idx].balls += 1;
      if (runs % 2 !== 0) swap(m);
    }

    if (m.balls >= 6) { 
        m.overs += 1; m.balls = 0; 
        swap(m); 
        m.bowler.name = "Select Bowler"; 
    }
    set(ref(db, 'liveMatch'), m);
  };

  const swap = (m: any) => {
    let temp = m.striker;
    m.striker = m.nonStriker;
    m.nonStriker = temp;
  };

  if (isSetup) {
    return (
      <div style={setupCont}>
        <div style={setupCard}>
          <img src={ADMIN.dp} style={setupDP} onError={(e:any)=>e.target.src='https://via.placeholder.com/80'} />
          <h2 style={{textAlign:'center', color:'#f5cd11'}}>{ADMIN.name} Setup</h2>
          <form onSubmit={startMatch} style={form}>
            <input name="tA" placeholder="Team A Name" required style={input} />
            <textarea name="pA" placeholder="Team A Players (Comma separated)" required style={area} />
            <input name="tB" placeholder="Team B Name" required style={input} />
            <textarea name="pB" placeholder="Team B Players (Comma separated)" required style={area} />
            <button type="submit" style={goBtn}>START MATCH</button>
          </form>
        </div>
      </div>
    );
  }

  const currentBatTeam = match.innings === 1 ? match.teamA : match.teamB;
  const currentBowlTeam = match.innings === 1 ? match.teamB : match.teamA;

  return (
    <div style={appWrap}>
      <div style={header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={ADMIN.dp} style={miniDP} onError={(e:any)=>e.target.src='https://via.placeholder.com/35'}/>
          <span style={headText}>{ADMIN.name} PRO</span>
        </div>
        <a href={`https://wa.me/${ADMIN.wa}`} style={waBtn}>WhatsApp</a>
      </div>

      <div style={scoreZone}>
        <div style={vsLine}>
          <span>{match.teamA.name}</span>
          <span style={{color:'#f5cd11'}}>VS</span>
          <span>{match.teamB.name}</span>
        </div>

        <div style={bigNum}>{match.score}/{match.wickets} <small>({match.overs}.{match.balls})</small></div>

        <div style={battingBox}>
          <div style={playerRow} onClick={() => setModal({type:'striker', teamKey: match.innings === 1 ? 'teamA' : 'teamB'})}>
            🏏 {match.striker.name}* <span>{match.striker.idx !== -1 ? `${currentBatTeam.players[match.striker.idx].runs}(${currentBatTeam.players[match.striker.idx].balls})` : "0(0)"}</span>
          </div>
          <div style={playerRow} onClick={() => setModal({type:'nonStriker', teamKey: match.innings === 1 ? 'teamA' : 'teamB'})}>
            🏏 {match.nonStriker.name} 
            <span>{match
