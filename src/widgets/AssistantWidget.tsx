import React, {useEffect, useRef, useState} from "react";

const TTS = async (text, voice="nigerian-female")=>{
  const u = `/api/tts/speak?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;
  const r = await fetch(u); if(!r.ok) throw new Error("TTS failed");
  const b = await r.blob(); const url = URL.createObjectURL(b);
  const au = new Audio(url); await au.play(); au.onended=()=>URL.revokeObjectURL(url);
};

export default function AssistantWidget(){
  const [open,setOpen]=useState(true);
  const [busy,setBusy]=useState(false);
  const [interim,setInterim]=useState("");
  const [messages,setMessages]=useState([{role:"assistant",content:"Welcome. You can speak; I am listening."}]);
  const recRef = useRef(null);

  useEffect(()=>{
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
    const rec = new SR(); recRef.current = rec;
    rec.lang="en-NG"; rec.continuous=true; rec.interimResults=true;
    rec.onresult=(e)=>{
      let final=""; let int="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const s=e.results[i][0].transcript;
        if(e.results[i].isFinal) final+=s; else int+=s;
      }
      if(int) setInterim(int);
      if(final){
        setInterim("");
        setMessages(m=>[...m,{role:"user",content:final}]);
        (async()=>{
          try{
            setBusy(true);
            const r = await fetch("/api/assistant/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({messages:[...messages,{role:"user",content:final}]})});
            const j = await r.json();
            const reply = j.message || "I hear you.";
            setMessages(m=>[...m,{role:"assistant",content:reply}]);
            await TTS(reply);
          }finally{ setBusy(false); }
        })();
      }
    };
    rec.onerror=()=>{}; rec.start(); return ()=>{ try{rec.stop();}catch{} };
  },[]);

  if(!open) return null;

  return (
    <div style={{
      position:"fixed", right:16, bottom:16, zIndex:9999,
      width:360, maxHeight:"70vh", background:"rgba(0,0,0,0.75)",
      color:"#fff", borderRadius:16, boxShadow:"0 10px 30px rgba(0,0,0,0.3)", backdropFilter:"blur(8px)"
    }}>
      <div style={{padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{fontWeight:700}}> Protect.NG Assistant</div>
        <button onClick={()=>setOpen(false)} style={{color:"#bbb"}}></button>
      </div>
      <div style={{padding:12, overflowY:"auto", maxHeight:"52vh"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{margin:"8px 0", textAlign: m.role==="user"?"right":"left"}}>
            <div style={{
              display:"inline-block", padding:"8px 10px", borderRadius:12,
              background: m.role==="user" ? "#fde047" : "rgba(255,255,255,0.1)",
              color: m.role==="user" ? "#000" : "#fff", maxWidth: "85%"
            }}>{m.content}</div>
          </div>
        ))}
        {interim && <div style={{opacity:0.8, fontStyle:"italic"}}>{interim}</div>}
      </div>
      <div style={{padding:10, borderTop:"1px solid rgba(255,255,255,0.15)", fontSize:12, opacity:0.8}}>
        {busy ? " Thinking..." : " Listening (no tap needed). Speak naturally."}
      </div>
    </div>
  );
}
