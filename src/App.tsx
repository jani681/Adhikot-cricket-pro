import React, { useState, useEffect } from 'react';
import { database } from './firebase'; // Ensure your config is here
import { ref, set, onValue, update, remove } from "firebase/database";

const AdminPassword = "6545";

const CricketApp = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [animation, setAnimation] = useState(null);

  // Load Live Data
  useEffect(() => {
    const matchRef = ref(database, 'liveMatch');
    onValue(matchRef, (snapshot) => {
      setMatchData(snapshot.val());
    });
  }, []);

  const triggerAnimation = (type) => {
    setAnimation(type);
    setTimeout(() => setAnimation(null), 3000);
  };

  const updateScore = (runs, isExtra = false, extraType = "") => {
    if (!matchData) return;
    
    let newScore = matchData.score + (isExtra ? 1 : runs);
    let newBalls = matchData.balls;
    let newWickets = matchData.wickets;
    let freeHit = false;

    if (!isExtra) {
        newBalls++;
        if (runs === 4) triggerAnimation('FOUR');
        if (runs === 6) triggerAnimation('SIX');
    }
    
    if (extraType === "NB") freeHit = true;

    update(ref(database, 'liveMatch'), {
      score: newScore,
      balls: newBalls,
      freeHit: freeHit,
      // Logic for RR and Target would update here
    });
  };

  const sendWhatsApp = (number, message) => {
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!matchData) return <div className="blank-screen">Koi Match Live Nahi Hai.</div>;

  return (
    <div className="app-container">
      {/* Animation Overlay */}
      {animation && <div className={`anim-overlay ${animation}`}>{animation}!</div>}

      {/* Header */}
      <div className="header">
        <div className="user-profile">
          <img src={matchData.adminDp || "default-dp.png"} alt="Admin" />
          <span>{matchData.adminName} (Umpire: {matchData.umpireName})</span>
        </div>
        <button onClick={() => setIsAdmin(!isAdmin)}>Admin</button>
      </div>

      {/* Scoreboard */}
      <div className="score-card">
        <h1>{matchData.score}/{matchData.wickets} ({Math.floor(matchData.balls/6)}.{matchData.balls%6})</h1>
        <p>RR: {(matchData.score / (matchData.balls / 6 || 1)).toFixed(2)}</p>
        {matchData.isSecondInning && <p>Target: {matchData.target} (Needs {matchData.target - matchData.score} in {matchData.totalBalls - matchData.balls} balls)</p>}
        {matchData.freeHit && <div className="free-hit">FREE HIT!</div>}
      </div>

      {/* Players List with WhatsApp */}
      <div className="player-stats">
        {matchData.battingTeam.players.map(p => (
          <div key={p.name} className="player-row">
            <span>{p.name} {p.isStriker ? '*' : ''}</span>
            <span>{p.runs}({p.balls})</span>
            <button onClick={() => sendWhatsApp(p.phone, `Live Score: ${matchData.score}/${matchData.wickets}`)}>
              📞
            </button>
          </div>
        ))}
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="admin-panel">
          {passInput !== AdminPassword ? (
            <input type="password" onChange={(e) => setPassInput(e.target.value)} placeholder="Enter Pin" />
          ) : (
            <div className="controls">
              <button onClick={() => updateScore(0)}>0</button>
              <button onClick={() => updateScore(1)}>1</button>
              <button onClick={() => updateScore(4)}>4</button>
              <button onClick={() => updateScore(6)}>6</button>
              <button className="wd" onClick={() => updateScore(1, true, "WD")}>WD</button>
              <button className="nb" onClick={() => updateScore(1, true, "NB")}>NB</button>
              <button className="out" onClick={() => { triggerAnimation('WICKET'); /* Add wicket logic */ }}>WICKET</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CricketApp;
