import * as THREE from 'three';
import {CampusScene} from './scene.js';
import {Player} from './player.js';
import {Professor} from './professor.js';
import {ChaseCamera} from './camera.js';
import {Obstacles,HAZARDS} from './obstacles.js';
import {Coins,POWER_TYPES} from './coins.js';
import {Controls} from './controls.js';
import {UI} from './ui.js';
import {Audio} from './audio.js';
import {Particles,loadSave,saveProgress,clamp,damp,random,COLORS as C} from './utils.js';
export const STATES=Object.freeze({LOADING:'LOADING',MENU:'MENU',PLAYING:'PLAYING',PAUSED:'PAUSED',GAME_OVER:'GAME_OVER'});
export class Game {
  constructor(canvas){
    this.state=STATES.LOADING;this.data=loadSave();this.world=new CampusScene(canvas);this.view=new ChaseCamera(innerWidth,innerHeight);
    const scene=this.world.scene;this.player=new Player(scene);this.professor=new Professor(scene);this.obstacles=new Obstacles(scene);this.coins=new Coins(scene);this.particles=new Particles(scene);
    this.ui=new UI(action=>this.action(action));this.ui.setName(this.data.name);this.ui.host.addEventListener('namechange',e=>{this.data.name=e.detail.name;this.commit();});this.audio=new Audio(this.data.muted);this.controls=new Controls(canvas,action=>this.action(action));
    this.bounds=new THREE.Box3();this.box=new THREE.Box3Helper(this.bounds,0x6affac);scene.add(this.box);
    this.aura=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),new THREE.MeshBasicMaterial({color:0x86e0ff,wireframe:true,transparent:true,opacity:.15,depthWrite:false}));this.aura.position.y=1.2;this.aura.scale.set(.8,1.25,.8);this.player.root.add(this.aura);
    this.last=performance.now();this.accumulator=0;this.fps=60;this.hudClock=0;this.saveClock=0;this.resetValues();this.resize();this.setState(STATES.MENU);
    window.addEventListener('resize',()=>this.resize());
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.pause();this.commit();}this.last=performance.now();this.accumulator=0;});
    window.addEventListener('blur',()=>this.pause());window.addEventListener('pagehide',()=>this.commit());
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.pause();this.fail('The graphics context was interrupted. Reload the page to restore it.');});
  }
  resetValues(){this.score=0;this.runCoins=0;this.distance=0;this.combo=0;this.speed=12;this.baseSpeed=12;this.gap=2.5;this.rowClock=0;this.rowIndex=0;this.safeLane=1;this.powers={boost:0,shield:0,magnet:0,multiplier:0};this.intro=0;this.catchTime=-1;this.shake=0;this.toast='';this.toastTime=0;this.dust=0;this.scoreRecorded=false;this.lastSpeedStage=0;}
  setState(state){this.state=state;this.ui.show(state);this.controls.cancel();this.accumulator=0;}
  start(){this.commit();this.resetValues();this.player.reset();this.professor.reset();this.obstacles.reset();this.coins.reset();this.particles.reset();this.intro=2.4;this.rowClock=1.5;this.spawnRow(-34);this.setState(STATES.PLAYING);this.audio.unlock();}
  pause(){if(this.state!==STATES.PLAYING)return;this.setState(STATES.PAUSED);this.commit();}
  commit(){this.data.best=Math.max(this.data.best,Math.floor(this.score));saveProgress(this.data);}
  recordScore(){if(this.scoreRecorded||!this.data.name||this.score<=0)return;const row={name:this.data.name,score:Math.floor(this.score),distance:Math.floor(this.distance),date:new Date().toISOString()};const existing=this.data.leaderboard.find(r=>r.name.toLowerCase()===row.name.toLowerCase());if(existing){existing.score=Math.max(existing.score,row.score);existing.distance=Math.max(existing.distance,row.distance);existing.date=row.date;}else this.data.leaderboard.push(row);this.data.leaderboard.sort((a,b)=>b.score-a.score);this.data.leaderboard=this.data.leaderboard.slice(0,10);this.scoreRecorded=true;}
  action(a){
    if(a==='sound'){this.data.muted=!this.data.muted;this.audio.setMuted(this.data.muted);this.audio.unlock();this.commit();return;}
    if(a==='debug'){this.data.debug=!this.data.debug;this.commit();return;}
    if(a==='play'||a==='restart'){const name=this.ui.getName()||this.data.name;if(!name){this.ui.showNameHint(true);return;}this.data.name=name;this.ui.setName(name);this.commit();this.start();return;}
    if(a==='leaderboard'){this.ui.renderLeaderboard(this.data.leaderboard,this.data.name);this.setState('LEADERBOARD');return;}
    if(a==='closeLeaderboard'){this.setState(STATES.MENU);return;}
    if(a==='home'){this.commit();this.ui.setName(this.data.name);this.ui.showNameHint(false);this.setState(STATES.MENU);return;}
    if(a==='resume'&&this.state===STATES.PAUSED){this.audio.unlock();this.last=performance.now();this.setState(STATES.PLAYING);return;}
    if(a==='pause'){if(this.state===STATES.PAUSED)this.action('resume');else this.pause();return;}
    if(this.state!==STATES.PLAYING||this.intro>0||this.catchTime>=0)return;
    if(a==='left'||a==='right')this.player.move(a==='left'?-1:1);
    if(a==='jump'&&this.player.jump())this.audio.play('jump');if(a==='slide')this.player.slide();
  }
  spawnRow(z=-72){
    // One whole corridor stays clear. Consecutive safe lanes differ by at most one.
    const difficulty=clamp(this.distance/1300,0,1);this.safeLane=clamp(this.safeLane+random([-1,0,1]),0,2);
    const blocked=[0,1,2].filter(l=>l!==this.safeLane);if(Math.random()>.35+difficulty*.55)blocked.pop();
    blocked.forEach(l=>this.obstacles.spawn(random(Object.keys(HAZARDS)),l,z));
    this.coins.pattern(this.safeLane,z,random(['line','line','arc','weave']));
    if(++this.rowIndex%4===0)this.coins.spawn(POWER_TYPES[(Math.floor(this.rowIndex/4)-1)%4],this.safeLane,z-8,1.1);
  }
  points(value){this.score+=value*(this.powers.multiplier>0?2:1);}
  message(text){this.toast=text;this.toastTime=1.6;}
  collect(e){
    this.particles.emit(e.root.position.x,e.root.position.y,e.root.position.z,e.color,8);
    if(e.kind==='coin'){this.combo++;this.runCoins++;this.data.total++;this.points(25*Math.min(5,1+Math.floor(this.combo/5)));this.gap=Math.min(3.15,this.gap+.025);this.audio.play('coin');}
    else{this.powers[e.kind]={boost:5,shield:14,magnet:10,multiplier:12}[e.kind];this.audio.play('power');this.message({boost:'Coffee rush · collision protection',shield:'Shield ready · one hit',magnet:'Medal magnet active',multiplier:'Double-score study streak'}[e.kind]);}
  }
  hit(e){if(this.catchTime>=0)return;
    if(this.powers.shield>0||this.powers.boost>0){if(this.powers.boost<=0)this.powers.shield=0;this.particles.emit(e.root.position.x,1,0,C.blue,12);this.obstacles.release(e);this.audio.play('power');this.message('Obstacle deflected');return;}
    this.catchTime=0;this.combo=0;this.shake=1;this.audio.play('crash');this.particles.emit(this.player.x,.7,0,C.copper,24);this.message('The professor is catching up!');
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
    // Every 500m adds 10% speed. The increase begins at 490m and is
    // complete at 510m, avoiding an abrupt speed snap on mobile.
    const completedMilestones=Math.max(0,Math.floor((this.distance-10)/500));
    const nextMilestone=(completedMilestones+1)*500;
    const ramp=clamp((this.distance-(nextMilestone-10))/20,0,1);
    const multiplier=1+(completedMilestones+ramp)*.1;
    const target=this.baseSpeed*multiplier+(this.powers.boost>0?4:0);this.speed=damp(this.speed,target,2.5,dt);
    const visibleStage=Math.floor((this.distance+10)/500);if(visibleStage>this.lastSpeedStage){this.lastSpeedStage=visibleStage;this.message(`Speed up · ${visibleStage*10}% faster`);}
    this.distance+=this.speed*dt;this.points(this.speed*dt*2);this.gap=Math.min(3.15,this.gap+dt*.012);
    this.player.update(dt,this.speed);this.professor.update(dt,this.player.x,this.gap);
    this.world.update(dt,this.speed*dt,this.speed);
    this.rowClock-=dt;if(this.rowClock<=0){this.spawnRow();this.rowClock=1.85-clamp(this.distance/1600,0,1)*.5;}
    this.obstacles.update(dt,this.speed,this.player,e=>this.hit(e),()=>{if(this.catchTime>=0)return;this.points(60);this.gap=Math.min(3.15,this.gap+.07);this.audio.play('near');this.message('Close call +60');},this.data.debug);
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
