export class Audio {
  constructor(muted=false){this.muted=muted;this.ctx=null;}
  unlock(){try{if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(Context)this.ctx=new Context();}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}catch(e){console.warn('Sound unavailable; play continues silently.',e);}}
  setMuted(value){this.muted=value;}
  play(name){
    if(this.muted)return;this.unlock();if(!this.ctx||this.ctx.state!=='running')return;
    const notes={jump:[[310,650,.14]],coin:[[710,1040,.09]],near:[[440,700,.12]],power:[[330,660,.16],[660,990,.2]],land:[[100,70,.06]],crash:[[160,45,.22]],caught:[[380,250,.17],[230,130,.25]]}[name]||[];
    notes.forEach(([start,end,duration],i)=>{const at=this.ctx.currentTime+i*.14,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=name==='crash'?'sawtooth':'triangle';osc.frequency.setValueAtTime(start,at);osc.frequency.exponentialRampToValueAtTime(end,at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.04,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain).connect(this.ctx.destination);osc.start(at);osc.stop(at+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
  }
}
