import * as THREE from 'three';
export const LANES = [-2.2, 0, 2.2];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
export const random = a => a[Math.floor(Math.random() * a.length)];
export const COLORS = {green:0x245b4d,cream:0xeee0bc,copper:0xbc613f,gold:0xffcb62,blue:0x39868e,dark:0x20383c,skin:0xb77550,leaf:0x53875b};
const geometries = new Map(), materials = new Map();
export function material(color, metalness=0) {
  const key = `${color}/${metalness}`;
  if (!materials.has(key)) materials.set(key,new THREE.MeshStandardMaterial({color,roughness:metalness?.35:.86,metalness}));
  return materials.get(key);
}
export function mesh(parent,shape,color,position=[0,0,0],scale=[1,1,1]) {
  if (!geometries.has(shape)) geometries.set(shape,shape==='ball'?new THREE.SphereGeometry(1,12,8):shape==='cylinder'?new THREE.CylinderGeometry(1,1,1,12):shape==='ring'?new THREE.TorusGeometry(1,.12,6,18):new THREE.BoxGeometry(1,1,1));
  const m=new THREE.Mesh(geometries.get(shape),material(color));m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function label(parent,text,x,y,z,width=3) {
  const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#193e36';g.fillRect(0,0,512,128);g.fillStyle='#ffdf9c';g.font='600 38px sans-serif';g.textAlign='center';g.fillText(text,256,80);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const p=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:texture}));p.position.set(x,y,z);parent.add(p);return p;
}
export function loadSave() {
  const finite=v=>Number.isFinite(+v)?Math.max(0,+v):0;
  try {
    const data=JSON.parse(localStorage.getItem('campusDash.v3')||'{}');
    const leaderboard=Array.isArray(data.leaderboard)?data.leaderboard.filter(row=>row&&typeof row.name==='string').map(row=>({name:row.name.slice(0,18),score:finite(row.score),distance:finite(row.distance),coins:finite(row.coins),date:row.date||''})).sort((a,b)=>b.score-a.score).slice(0,5):[];
    return {best:finite(data.best??localStorage.getItem('campusDashBest')),total:finite(data.total??localStorage.getItem('campusDashTotalCoins')),muted:!!data.muted,debug:!!data.debug,name:typeof data.name==='string'?data.name.slice(0,18):'',character:['boy','girl','professor'].includes(data.character)?data.character:'boy',leaderboard};
  }
  catch(e){console.warn('Local progress unavailable; using memory.',e);return {best:0,total:0,muted:false,debug:false,name:'',leaderboard:[]};}
}
export function saveProgress(data){try{localStorage.setItem('campusDash.v3',JSON.stringify(data));}catch(e){console.warn('Progress could not be saved on this device.',e);}}
// Fixed pool: no geometry or material allocations during play.
export class Particles {
  constructor(scene){[COLORS.gold,COLORS.copper,COLORS.blue,0xcdbd9f,0xcf7443,0x60b7c9,0xc074ba,0x87b869].forEach(c=>material(c));this.items=Array.from({length:80},()=>{const p=mesh(scene,'ball',COLORS.gold);p.visible=false;p.castShadow=false;p.receiveShadow=false;return {p,life:0,v:new THREE.Vector3()};});}
  emit(x,y,z,color,count=8){let n=0;for(const e of this.items){if(e.life>0)continue;e.life=.35+Math.random()*.35;e.p.material=material(color);e.p.visible=true;e.p.position.set(x,y,z);e.v.set((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3);if(++n>=count)break;}}
  update(dt){for(const e of this.items){if(e.life<=0)continue;e.life-=dt;e.p.visible=e.life>0;e.p.position.addScaledVector(e.v,dt);e.v.y-=6*dt;e.p.scale.setScalar(Math.max(.01,e.life*.1));}}
  reset(){for(const e of this.items){e.life=0;e.p.visible=false;}}
}
