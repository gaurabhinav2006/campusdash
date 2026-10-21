import * as THREE from 'three';
import {mesh,COLORS as C,LANES,clamp,damp} from './utils.js';
// Shared articulated proportions; character-specific clothing and behavior stay separate.
export function createRig(scene,professor=false){
  const root=new THREE.Group(),body=new THREE.Group();scene.add(root);root.add(body);
  const shirt=professor?0xe8d7ad:0x3b8589,pants=professor?0x5a5145:0x263f48;
  mesh(body,'ball',shirt,[0,1.43,0],[.34,.49,.23]);mesh(body,'cylinder',C.skin,[0,1.91,0],[.11,.2,.11]);
  const head=new THREE.Group();head.position.y=2.16;body.add(head);
  mesh(head,'ball',C.skin,[0,0,0],[.24,.3,.24]);mesh(head,'ball',professor?0x46443a:0x242d29,[0,.2,.035],[.25,.15,.24]);
  mesh(head,'ball',C.skin,[0,-.015,-.25],[.06,.08,.06]);
  for(const side of [-1,1]){mesh(head,'ball',C.cream,[side*.09,.035,-.219],[.065,.045,.025]);mesh(head,'ball',C.dark,[side*.09,.035,-.24],[.025,.028,.014]);const brow=mesh(head,'box',C.dark,[side*.09,.115,-.23],[.13,.024,.025]);brow.rotation.z=professor?side*.25:0;}
  const mouth=mesh(head,'ball',C.dark,[0,-.13,-.224],[.065,professor?.048:.014,.012]);
  if(professor){for(const s of [-1,1])mesh(head,'ring',C.dark,[s*.1,.035,-.25],[.081,.068,.07]);mesh(head,'box',C.dark,[0,.035,-.26],[.06,.015,.015]);}
  else {mesh(body,'box',C.copper,[0,1.45,.27],[.48,.65,.22]);for(const s of [-1,1])mesh(body,'box',C.cream,[s*.24,1.5,.02],[.055,.55,.48]);}
  const arms=[],legs=[],knees=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.38,1.75,0);body.add(arm);mesh(arm,'cylinder',shirt,[0,-.16,0],[.1,.32,.1]);
    const elbow=new THREE.Group();elbow.position.y=-.32;elbow.rotation.x=-.55;arm.add(elbow);mesh(elbow,'cylinder',C.skin,[0,-.17,0],[.073,.34,.073]);mesh(elbow,'ball',C.skin,[0,-.37,0],[.09,.11,.08]);arm.userData.hand=elbow;arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.16,1.02,0);body.add(leg);mesh(leg,'cylinder',pants,[0,-.23,0],[.12,.46,.12]);
    const knee=new THREE.Group();knee.position.y=-.46;leg.add(knee);mesh(knee,'cylinder',pants,[0,-.22,0],[.09,.44,.09]);mesh(knee,'box',professor?C.dark:C.cream,[0,-.44,-.07],[.21,.13,.37]);legs.push(leg);knees.push(knee);
  }
  return {root,body,head,arms,legs,knees,mouth};
}
export class Player {
  constructor(scene){Object.assign(this,createRig(scene));this.reset();}
  reset(){this.x=0;this.y=0;this.lane=1;this.velocity=0;this.slideTime=0;this.land=0;this.time=0;this.root.position.set(0,0,0);this.body.rotation.set(0,0,0);this.body.position.set(0,0,0);this.body.scale.set(1,1,1);}
  move(dir){this.lane=clamp(this.lane+dir,0,2);}
  jump(){if(this.y>.01||this.velocity!==0||this.slideTime>0)return false;this.velocity=8.6;return true;}
  slide(){if(this.y>.01||this.velocity!==0)return false;this.slideTime=.78;return true;}
  update(dt,speed,mode='run'){
    const old=this.x;this.x=damp(this.x,LANES[this.lane],15,dt);this.root.position.x=this.x;this.time+=dt*(mode==='run'?9+speed*.18:2);
    this.land=Math.max(0,this.land-dt);this.slideTime=Math.max(0,this.slideTime-dt);
    if(this.velocity!==0||this.y>0){this.y+=this.velocity*dt;this.velocity-=23*dt;if(this.y<=0){this.y=0;this.velocity=0;this.land=.16;}}
    const sliding=this.slideTime>0,air=this.y>.02,running=mode==='run';const swing=running&&!air&&!sliding?Math.sin(this.time)*.68:0;
    this.root.position.y=this.y;this.body.position.y=damp(this.body.position.y,sliding?-.65:this.land>0?-.1:running?Math.abs(Math.sin(this.time))*.025:0,20,dt);
    this.body.rotation.z=damp(this.body.rotation.z,clamp((old-this.x)/Math.max(dt,.001)*.025,-.18,.18),12,dt);
    this.body.rotation.x=damp(this.body.rotation.x,mode==='caught'?-.27:mode==='stumble'?.5:sliding?-.86:0,13,dt);
    this.head.rotation.y=Math.sin(this.time*.2)*.045;
    for(let i=0;i<2;i++){const sign=i?1:-1;this.arms[i].rotation.x=damp(this.arms[i].rotation.x,mode==='caught'?-.9:air?-1.1:sliding?.4:sign*swing,20,dt);this.legs[i].rotation.x=damp(this.legs[i].rotation.x,sliding?-1.3:air?-.55:-sign*swing,22,dt);this.knees[i].rotation.x=damp(this.knees[i].rotation.x,sliding?1.1:air?1.05:Math.max(0,sign*swing)*.8,20,dt);}
  }
}
