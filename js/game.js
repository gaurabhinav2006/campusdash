import * as THREE from 'three';
import {CampusScene} from './scene.js?v=campus-dash-global-board-8';
import {Player} from './player.js?v=campus-dash-global-board-8';
import {Professor} from './professor.js?v=campus-dash-global-board-8';
import {ChaseCamera} from './camera.js?v=campus-dash-global-board-8';
import {Obstacles,HAZARDS} from './obstacles.js?v=campus-dash-global-board-8';
import {Coins,POWER_TYPES} from './coins.js?v=campus-dash-global-board-8';
import {Controls} from './controls.js?v=campus-dash-global-board-8';
import {UI} from './ui.js?v=campus-dash-global-board-8';
import {Audio} from './audio.js?v=campus-dash-global-board-8';
import {GlobalLeaderboard} from './leaderboard.js?v=campus-dash-global-board-8';
import {Particles,loadSave,saveProgress,clamp,damp,random,COLORS as C} from './utils.js?v=campus-dash-global-board-8';
export const STATES=Object.freeze({LOADING:'LOADING',MENU:'MENU',LEADERBOARD:'LEADERBOARD',PLAYING:'PLAYING',PAUSED:'PAUSED',GAME_OVER:'GAME_OVER'});
const MOTIVATION_LINES=['Keep moving — your class is waiting!','One more stretch — you have got this!','Great run — stay sharp and keep going!','Every step gets you closer to class!','Eyes up, feet quick, finish strong!'];
export class Game {
  constructor(canvas){
    this.state=STATES.LOADING;this.data=loadSave();this.world=new CampusScene(canvas);this.view=new ChaseCamera(innerWidth,innerHeight);
    const scene=this.world.scene;this.player=new Player(scene);this.professor=new Professor(scene);this.obstacles=new Obstacles(scene);this.coins=new Coins(scene);this.particles=new Particles(scene);
    this.ui=new UI(action=>this.action(action));this.ui.setName(this.data.name);this.ui.setNameLocked(Boolean(this.data.name));this.ui.setCharacterChoice(this.data.character);this.ui.host.addEventListener('namechange',e=>{if(!this.data.name)this.pendingName=e.detail.name;});this.pendingName=this.data.name;this.starting=false;this.characterAssets={};this.assetReady=false;this.assetsReady=this.loadAssets();this.audio=new Audio(this.data.muted);this.leaderboard=new GlobalLeaderboard();this.controls=new Controls(canvas,action=>this.action(action));
    this.bounds=new THREE.Box3();this.box=new THREE.Box3Helper(this.bounds,0x6affac);scene.add(this.box);
    this.aura=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({color:0x86e0ff,wireframe:true,transparent:true,opacity:.15,depthWrite:false}));this.aura.position.y=1.2;this.aura.scale.set(.8,1.25,.8);this.player.root.add(this.aura);
    this.lastSubmit=null;this.last=performance.now();this.accumulator=0;this.fps=60;this.hudClock=0;this.saveClock=0;this.resetValues();this.resize();this.setState(STATES.MENU);
    window.addEventListener('resize',()=>this.resize());
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.pause();this.commit();}this.last=performance.now();this.accumulator=0;});
    window.addEventListener('blur',()=>this.pause());window.addEventListener('pagehide',()=>this.commit());
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.pause();this.fail('The graphics context was interrupted. Reload the page to restore it.');});
  }
  resetValues(){this.score=0;this.runCoins=0;this.distance=0;this.combo=0;this.speed=18;this.baseSpeed=18;this.gap=2.5;this.rowClock=0;this.rowIndex=0;this.safeLane=1;this.powers={boost:0,shield:0,magnet:0,multiplier:0};this.intro=0;this.catchTime=-1;this.shake=0;this.toast='';this.toastTime=0;this.dust=0;this.scoreRecorded=false;this.lastSpeedStage=0;this.lastDifficultyStage=0;this.lastMotivationStage=0;}
  async loadAssets(){if(typeof fetch!=='function')return false;try{const {loadCharacterAsset}=await import('./asset-loader.js?v=campus-dash-global-board-8');const [boy,girl,professor]=await Promise.all([loadCharacterAsset('assets/boy.glb'),loadCharacterAsset('assets/girl.glb'),loadCharacterAsset('assets/professor.glb')]);this.characterAssets={boy,girl,professor};this.player.useAsset(this.characterAssets[this.data.character]||boy);this.professor.useAsset(professor);this.assetReady=true;return true;}catch(error){console.warn('GLB character assets could not be loaded; procedural fallback remains active.',error);return false;}}
  applyCharacter(){if(this.assetReady)this.player.useAsset(this.characterAssets[this.data.character]||this.characterAssets.boy);}
  setState(state){this.state=state;this.ui.show(state);this.controls.cancel();this.accumulator=0;}
  start(){this.commit();this.resetValues();this.player.reset();this.professor.reset();this.obstacles.reset();this.coins.reset();this.particles.reset();this.intro=2;this.rowClock=1.1;this.spawnRow(-34);this.setState(STATES.PLAYING);this.audio.unlock();}
  pause(){if(this.state!==STATES.PLAYING)return;this.setState(STATES.PAUSED);this.commit();}
  commit(){this.data.best=Math.max(this.data.best,Math.floor(this.score));saveProgress(this.data);}
  recordScore(){if(this.scoreRecorded||!this.data.name||this.score<=0)return;const row={name:this.data.name,score:Math.floor(this.score),distance:Math.floor(this.distance),coins:Math.floor(this.runCoins),date:new Date().toISOString()};const existing=this.data.leaderboard.find(r=>r.name.toLowerCase()===row.name.toLowerCase());if(existing){if(row.score>existing.score){existing.score=row.score;existing.distance=row.distance;existing.coins=row.coins;existing.date=row.date;}}else this.data.leaderboard.push(row);this.data.leaderboard.sort((a,b)=>b.score-a.score);this.data.leaderboard=this.data.leaderboard.slice(0,5);this.scoreRecorded=true;this.lastSubmit=this.leaderboard.submit(row).then(result=>{if(!result.ok&&result.configured)this.message('Global score could not be submitted; check Supabase policies.');return result;});}
  async openLeaderboard(){this.setState(STATES.LEADERBOARD);this.ui.renderLeaderboard([],this.data.name,'Loading the shared leaderboard…');if(this.lastSubmit)await Promise.race([this.lastSubmit,new Promise(resolve=>setTimeout(resolve,1200))]);const result=await this.leaderboard.list(5);if(this.state!==STATES.LEADERBOARD)return;if(result.configured&&!result.error){this.ui.renderLeaderboard(result.rows,this.data.name,'Top 5 scores from everyone using this game link.');}else if(!result.configured){this.ui.renderLeaderboard(this.data.leaderboard,this.data.name,'Global leaderboard is not configured; showing this device\'s saved scores.');}else{this.ui.renderLeaderboard(this.data.leaderboard,this.data.name,`Global board request failed: ${result.error}`);}}
  async prepareRun(){if(this.starting)return;const name=(this.data.name||this.pendingName||this.ui.getName()).trim().replace(/\s+/g,' ').slice(0,18);if(!name){this.ui.showNameHint(true,'Enter a unique name before you run.');return;}this.starting=true;try{if(!this.assetReady){this.ui.showNameHint(true,'Loading character models…');await this.assetsReady;}if(!this.data.name){this.ui.showNameHint(true,'Checking whether that name is available…');const result=await this.leaderboard.isNameAvailable(name);if(!result.available){this.ui.showNameHint(true,result.error||'That name is already taken. Choose another.');return;}this.data.name=name;this.pendingName=name;this.ui.setName(name);this.ui.setNameLocked(true);this.ui.showNameHint(false);this.commit();}this.applyCharacter();this.start();}finally{this.starting=false;}}
  action(a){
    if(a==='sound'){this.data.muted=!this.data.muted;this.audio.setMuted(this.data.muted);this.audio.unlock();this.commit();return;}
    if(a==='character-boy'||a==='character-girl'){this.data.character=a.replace('character-','');this.ui.setCharacterChoice(this.data.character);this.applyCharacter();this.commit();return;}
    if(a==='debug'){this.data.debug=!this.data.debug;this.commit();return;}
    if(a==='play'||a==='restart'){this.prepareRun();return;}
    if(a==='leaderboard'){this.openLeaderboard();return;}
    if(a==='closeLeaderboard'){this.setState(STATES.MENU);return;}
    if(a==='home'){this.commit();this.ui.setName(this.data.name);this.ui.showNameHint(false);this.setState(STATES.MENU);return;}
    if(a==='resume'&&this.state===STATES.PAUSED){this.audio.unlock();this.last=performance.now();this.setState(STATES.PLAYING);return;}
    if(a==='pause'){if(this.state===STATES.PAUSED)this.action('resume');else this.pause();return;}
    if(this.state!==STATES.PLAYING||this.intro>0||this.catchTime>=0)return;
    if(a==='left'||a==='right')this.player.move(a==='left'?-1:1);
    if(a==='jump'&&this.player.jump())this.audio.play('jump');if(a==='slide')this.player.slide();
  }
  spawnRow(z=-72){
    // Before 1000m, keep one readable lane. After 1000m, full-width rows
    // appear randomly and use one shared action so the challenge stays fair.
    const difficultyStage=Math.floor(this.distance/500);this.lastDifficultyStage=Math.max(this.lastDifficultyStage,difficultyStage);
    const patterns=[['barrier','books'],['manhole','bicycle'],['branch','cooler'],['projector','cart'],['books','barrier'],['bicycle','cart'],['cooler','manhole'],['branch','projector']];
    const fullRowChance=this.distance<1000?0:clamp(.28+(this.distance-1000)/3000*.27,.28,.55);
    if(this.distance>=1000&&Math.random()<fullRowChance){
      const action=random(['jump','slide']);
      const fullRow=action==='jump'?['barrier','books','manhole']:['branch','projector'];
      [0,1,2].forEach(lane=>this.obstacles.spawn(fullRow[lane%fullRow.length],lane,z));
      this.safeLane=-1;
    }else{
      const difficulty=clamp(difficultyStage/2,0,1);this.safeLane=clamp(this.safeLane+random([-1,0,1]),0,2);
      const blocked=[0,1,2].filter(l=>l!==this.safeLane);const pattern=patterns[this.rowIndex%patterns.length];
      this.obstacles.spawn(pattern[0],blocked[0],z);
      if(blocked[1]!==undefined&&Math.random()<.68+difficulty*.28)this.obstacles.spawn(pattern[1],blocked[1],z);
      this.coins.pattern(this.safeLane,z,random(['line','line','arc','weave']));
    }
    if(++this.rowIndex%4===0){const powerLane=this.safeLane>=0?this.safeLane:Math.floor(Math.random()*3);this.coins.spawn(POWER_TYPES[(Math.floor(this.rowIndex/4)-1)%4],powerLane,z-8,1.1);}
  }
  points(value){this.score+=value*(this.powers.multiplier>0?2:1);}
  message(text){this.toast=text;this.toastTime=1.6;}
  collect(e){
    this.particles.emit(e.root.position.x,e.root.position.y,e.root.position.z,e.color,8);
    if(e.kind==='coin'){this.combo++;this.runCoins++;this.data.total++;this.points(25*Math.min(5,1+Math.floor(this.combo/5)));this.gap=Math.min(3.15,this.gap+.025);this.audio.play('coin');}
    else{this.powers[e.kind]={boost:5,shield:14,magnet:10,multiplier:12}[e.kind];this.audio.play('power');}
  }
  hit(e){if(this.catchTime>=0)return;
    if(this.powers.shield>0||this.powers.boost>0){if(this.powers.boost<=0)this.powers.shield=0;this.particles.emit(e.root.position.x,1,0,C.blue,12);this.obstacles.release(e);this.audio.play('power');return;}
    this.catchTime=0;this.combo=0;this.shake=1;this.audio.play('crash');this.particles.emit(this.player.x,.7,0,C.copper,24);
  }
  step(dt){
    if(this.state===STATES.PAUSED)return;
    if(this.state!==STATES.PLAYING){this.player.update(dt,0,this.state===STATES.GAME_OVER?'caught':'idle');this.professor.update(dt,this.player.x,this.gap,this.state===STATES.GAME_OVER?'catch':'idle',1);this.particles.update(dt);return;}
    if(this.intro>0){this.intro=Math.max(0,this.intro-dt);this.player.update(dt,0,'idle');this.professor.update(dt,this.player.x,this.gap,'idle');return;}
    if(this.catchTime>=0){
      this.catchTime+=dt;this.shake=Math.max(0,this.shake-dt*2.5);this.player.update(dt,0,this.catchTime<.3?'stumble':'caught');this.professor.update(dt,this.player.x,this.gap,'catch',clamp(this.catchTime/1.1,0,1));this.particles.update(dt);
      if(this.catchTime>=1.35){this.recordScore();this.commit();this.audio.play('caught');this.setState(STATES.GAME_OVER);}return;
    }
    for(const p of POWER_TYPES)this.powers[p]=Math.max(0,this.powers[p]-dt);
    // Speed increases every 250m, with a short hidden ramp around each mark.
    const completedMilestones=Math.max(0,Math.floor((this.distance-10)/250));
    const nextMilestone=(completedMilestones+1)*250;
    const ramp=clamp((this.distance-(nextMilestone-10))/20,0,1);
    const multiplier=1+(completedMilestones+ramp)*.1;
    const target=this.baseSpeed*multiplier+(this.powers.boost>0?5:0);this.speed=damp(this.speed,target,3.4,dt);
    this.distance+=this.speed*dt;this.points(this.speed*dt*2);this.gap=Math.min(3.15,this.gap+dt*.012);
    const completedDistanceStage=Math.floor(this.distance/500);if(completedDistanceStage>this.lastMotivationStage){this.lastMotivationStage=completedDistanceStage;this.message(random(MOTIVATION_LINES));}
    this.player.update(dt,this.speed);this.professor.update(dt,this.player.x,this.gap);
    this.world.update(dt,this.speed*dt,this.speed,this.distance);
    this.rowClock-=dt;if(this.rowClock<=0){this.spawnRow();this.rowClock=1.28-clamp(this.distance/2000,0,1)*.42;}
    this.obstacles.update(dt,this.speed,this.player,e=>this.hit(e),()=>{if(this.catchTime>=0)return;this.points(60);this.gap=Math.min(3.15,this.gap+.07);this.audio.play('near');},this.data.debug);
    if(this.catchTime<0)this.coins.update(dt,this.speed,this.player,this.powers.magnet>0,e=>this.collect(e),()=>{this.combo=0;});
    this.dust+=dt;if(this.dust>.14&&this.player.y===0){this.dust=0;this.particles.emit(this.player.x,.08,.3,0xcdbd9f,1);}
    this.particles.update(dt);this.toastTime-=dt;if(this.toastTime<=0)this.toast='';
    this.saveClock+=dt;if(this.saveClock>5){this.saveClock=0;this.commit();}
  }
  frame(now){
    const elapsed=Math.max(0,(now-this.last)/1000),delta=Math.min(.1,elapsed);this.last=now;this.fps=damp(this.fps,1/Math.max(elapsed,.001),3,delta);
    this.accumulator+=delta;const step=1/120;while(this.accumulator>=step){this.accumulator-=step;this.step(step);}
    if(this.state!==STATES.PAUSED)this.view.update(delta,this.player.x,this.speed,this.player.slideTime>0,this.shake);
    const p=this.player;this.box.visible=this.data.debug;this.bounds.min.set(p.x-.29,p.y,-.3);this.bounds.max.set(p.x+.29,p.y+(p.slideTime>0?1.02:2.46),.3);
    this.aura.visible=this.powers.shield>0||this.powers.boost>0;
    for(const e of this.obstacles.items)e.helper.visible=this.data.debug&&e.active;
    this.world.render(this.view.camera);this.hudClock+=delta;
    if(this.hudClock>.1){this.hudClock=0;this.ui.update({score:this.score,coins:this.runCoins,distance:this.distance,best:this.data.best,total:this.data.total,name:this.data.name,combo:this.combo,gap:this.gap,powers:this.powers,muted:this.data.muted,debug:this.data.debug,intro:this.intro,toast:this.toast,fps:this.fps,camera:this.view.camera.position,input:this.controls.lastInput,catching:this.catchTime>=0});}
  }
  resize(){this.world.resize(innerWidth,innerHeight);this.view.resize(innerWidth,innerHeight);}
  fail(message){document.getElementById('errorMessage').textContent=message;document.getElementById('fatalError').hidden=false;}
}
