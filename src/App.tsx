import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";
// Icons ko check karne ke liye filhal simple text use karte hain agar icons crash kar rahe hon
import { FaWhatsapp, FaUserCircle } from 'react-icons/fa'; 

const firebaseConfig = {
  apiKey: "AIzaSyB0e37uvyY7Jpuj-FYxDlX52hjb0uwsBfg", 
  databaseURL: "https://adhikot-cricket-pro-default-rtdb.firebaseio.com"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function AdhikotProV3() {
  const [match, setMatch] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    const mRef = ref(db, 'liveMatch');
    const unsub = onValue(mRef, (s) => {
      if(s.exists()) setMatch(s.val());
      else setMatch(null);
    }, (err) => console.error("Firebase Error:", err));
    return () => unsub();
  }, []);

  if (isAdmin === false && !match) {
    return (
      <div style={{background:'#0a0e1a', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white'}}>
         <h2>Adhikot Pro Admin</h2>
         <input 
           type="password" 
           placeholder="Enter PIN (6545)" 
           onChange={(e) => e.target.value === "6545" && setIsAdmin(true)}
           style={{padding:'10px', borderRadius:'5px', border:'1px solid #facc15', background:'#111827', color:'white', textAlign:'center'}}
         />
         <p style={{fontSize:'12px', marginTop:'20px', opacity:0.5}}>No Live Match Currently</p>
      </div>
    );
  }

  // Agar phir bhi blank screen aaye, to apna "Inspect Element" ya Vercel Logs ka screenshot bhejain.
  return (
    <div style={{background:'#0a0e1a', minHeight:'100vh', color:'white', padding:'15px'}}>
       <h1 style={{color:'#facc15'}}>V3.0 Live</h1>
       {/* Baqi interface yahan load hoga */}
       <p>Database Connected: {match ? "Yes" : "Waiting..."}</p>
    </div>
  );
}
