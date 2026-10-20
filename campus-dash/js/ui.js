const button=(action,text,cls='secondary')=>`<button data-action="${action}" class="${cls}">${text}</button>`;
export class UI {
  constructor(onAction){
    this.host=document.getElementById('ui');this.cache=new Map();
    this.host.innerHTML=`
      <section id="menu" class="overlay" hidden><div class="panel"><div class="eyebrow">Aaroh campus · 08:59</div><h1>Campus<span>Dash</span></h1><p>One class. Three lanes.<br>A very determined professor.</p><div class="stats"><div><small>Personal best</small><b id="menuBest">0</b></div><div><small>Lifetime coins</small><b id="menuTotal">0</b></div></div><div class="actions">${button('play','Run to class','primary')}${button('sound','Sound on')}${button('debug','Debug off')}</div><div class="guide">Swipe ← → to change lane<br>Swipe ↑ or tap the path to jump · Swipe ↓ to slide<br>Desktop: arrows / WASD · P pause · M sound · F2 debug<br>Low obstacles: jump · High obstacles: slide<br>Tall obstacles: change lane</div><p class="credit">Campus Dash — original game concept and assets.</p></div></section>
      <section id="pauseMenu" class="overlay" hidden><div class="panel"><div class="eyebrow">A moment between classes</div><h2>Paused</h2><p>The professor can wait.</p><div class="actions">${button('resume','Resume','primary')}${button('restart','Restart')}${button('sound','Sound on')}${button('home','Home')}</div></div></section>
      <section id="overMenu" class="overlay" hidden><div class="panel"><div class="eyebrow">Attendance recorded</div><h2>Caught by the Professor!</h2><p>“Next time, try leaving the canteen earlier.”</p><div class="stats"><div><small>Score</small><b id="finalScore">0</b></div><div><small>Best</small><b id="finalBest">0</b></div></div><div class="stats"><div><small>Coins</small><b id="finalCoins">0</b></div><div><small>Distance</small><b id="finalDistance">0</b></div></div><div class="actions">${button('restart','Try another route','primary')}${button('home','Home')}</div><p class="credit">Campus Dash — original game concept and assets.</p></div></section>
      <div id="hud" hidden><div class="hudrow"><div class="stat"><small>Distance</small><b id="distance">0 m</b></div><div class="stat score"><small>Score</small><b id="score">0</b></div><div class="stat"><small>Coins</small><b id="coins">0</b></div>${button('pause','Ⅱ','pause')}</div><div class="chase"><small id="gap">PROFESSOR · 2.5 m</small><div class="track"><div id="chaseFill" class="fill"></div></div></div><div id="powers"></div><div id="combo"></div></div>
      <div id="touchControls" hidden><div class="pair">${button('left','←')}${button('right','→')}</div><div class="pair">${button('jump','Jump')}${button('slide','Slide')}</div></div><div id="intro" hidden></div><div id="toast" hidden></div><pre id="debug" hidden></pre>`;
    this.host.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){onAction(b.dataset.action);b.blur();}});
    this.host.querySelector('.pause').setAttribute('aria-label','Pause');
    this.state='LOADING';this.show('MENU');
  }
  show(state){this.state=state;for(const [id,s] of [['menu','MENU'],['pauseMenu','PAUSED'],['overMenu','GAME_OVER']])document.getElementById(id).hidden=state!==s;
    document.getElementById('hud').hidden=state!=='PLAYING';document.getElementById('touchControls').hidden=state!=='PLAYING';
    if(state!=='PLAYING'){document.getElementById('intro').hidden=true;document.getElementById('toast').hidden=true;}
  }
  text(id,value){const s=String(value);if(this.cache.get(id)===s)return;this.cache.set(id,s);document.getElementById(id).textContent=s;}
  update(d){const n=v=>Math.floor(v).toLocaleString('en-US');
    for(const [id,v] of Object.entries({menuBest:n(d.best),menuTotal:n(d.total),finalScore:n(d.score),finalBest:n(d.best),finalCoins:d.coins,finalDistance:n(d.distance)+' m',score:n(d.score),coins:d.coins,distance:n(d.distance)+' m',gap:`PROFESSOR · ${d.gap.toFixed(1)} m`,combo:d.combo>1?`${d.combo} COIN STREAK · ×${Math.min(5,1+Math.floor(d.combo/5))}`:''}))this.text(id,v);
    const names={boost:'COFFEE',shield:'SHIELD',magnet:'MAGNET',multiplier:'DOUBLE SCORE'};this.text('powers',Object.entries(d.powers).filter(([,s])=>s>0).map(([k,s])=>`${names[k]} ${Math.ceil(s)}s`).join('  ·  '));
    const width=`${Math.max(5,100-(d.gap-1.5)*45)}%`;document.getElementById('chaseFill').style.width=width;
    for(const action of ['sound','debug']){const text=action==='sound'?(d.muted?'Sound off':'Sound on'):(d.debug?'Debug on':'Debug off');this.host.querySelectorAll(`[data-action="${action}"]`).forEach(b=>{if(b.textContent!==text)b.textContent=text;});}
    const active=this.state==='PLAYING';this.text('intro',d.intro?'You are late for class — the professor is right behind you!':'');document.getElementById('intro').hidden=!active||!d.intro;
    this.text('toast',d.toast||'');document.getElementById('toast').hidden=!active||!d.toast||!!d.intro;
    document.getElementById('touchControls').hidden=!active||d.catching||!!d.intro;
    const c=d.camera;this.text('debug',`FPS ${d.fps.toFixed(0)} | ${this.state}\nCamera ${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)}\n${d.input}\nBoxes: green player / coral hazards`);document.getElementById('debug').hidden=!d.debug;
  }
}
