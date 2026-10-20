import * as THREE from 'three';
import {mesh,COLORS as C,LANES} from './utils.js';
export const HAZARDS={
  barrier:{action:'jump',height:.86,width:1.65,depth:.45,color:0xe49b36},
  books:{action:'jump',height:.68,width:1.35,depth:.85,color:0xb64d59},
  manhole:{action:'jump',height:.32,width:1.6,depth:1.1,color:0x263f42},
  bicycle:{action:'lane',height:2.65,width:1.55,depth:.7,color:0x346f99},
  cart:{action:'lane',height:2.65,width:1.5,depth:.9,color:0xa64b44},
  cooler:{action:'lane',height:2.65,width:1.05,depth:.85,color:0x267d8f},
  branch:{action:'slide',height:2.7,minY:1.14,width:1.8,depth:.6,color:0x617939},
  projector:{action:'slide',height:2.8,minY:1.14,width:1.8,depth:.6,color:0x956344}
};
export function intersects(e,p){
  const d=e.spec;
  if(Math.abs(e.root.position.x-p.x)>=d.width/2+.29)return false;
  const top=p.y+(p.slideTime>0?1.02:2.46);
  return p.y<d.height&&top>(d.minY||0);
}
export class Obstacles {
  constructor(scene){this.items=[];for(const kind of Object.keys(HAZARDS))for(let i=0;i<4;i++)this.items.push(this.create(scene,kind));}
  create(scene,kind){
    const root=new THREE.Group(),s=HAZARDS[kind];scene.add(root);
    const base=mesh(root,'box',0x504a3b,[0,.015,0],[s.width+.15,.03,s.depth+.18]);base.castShadow=false;
    if(kind==='manhole'){
      const rim=mesh(root,'ring',0xe49b36,[0,.03,0],[.85,.62,.5]);rim.rotation.x=-Math.PI/2;mesh(root,'cylinder',0x142b2c,[0,.025,0],[.73,.03,.52]);
    }else if(kind==='books'){
      for(let j=0;j<3;j++){const b=mesh(root,'box',[0xb64d59,0x346f99,0xd99b3b][j],[0,.12+j*.22,0],[1.35-j*.08,.22,.85]);b.rotation.y=(j-1)*.08;mesh(root,'box',C.cream,[0,.13+j*.22,.431],[1.16-j*.08,.12,.02]);}
    }else if(kind==='barrier'){
      for(const x of [-.7,.7])mesh(root,'box',C.dark,[x,.4,0],[.12,.8,.3]);mesh(root,'box',s.color,[0,.63,0],[1.65,.4,.22]);
      for(let j=-2;j<=2;j++){const stripe=mesh(root,'box',C.cream,[j*.3,.63,.12],[.12,.38,.03]);stripe.rotation.z=-.3;}
    }else if(kind==='bicycle'){
      for(const x of [-.48,.48])mesh(root,'ring',C.dark,[x,.49,0],[.43,.43,.4]);
      for(const x of [-.28,.28]){const bar=mesh(root,'box',s.color,[x,.75,0],[.08,.7,.08]);bar.rotation.z=x<0?-.6:.6;}
      mesh(root,'box',s.color,[0,.64,0],[1,.08,.08]);mesh(root,'box',C.dark,[-.28,1.16,0],[.34,.1,.22]);mesh(root,'box',C.dark,[.53,1.27,0],[.1,.12,.55]);
    }else if(kind==='cart'){
      mesh(root,'box',s.color,[0,.73,0],[1.5,1.2,.85]);mesh(root,'box',C.cream,[0,1.38,0],[1.6,.12,.95]);
      for(const x of [-.53,.53])mesh(root,'ball',C.dark,[x,.16,.3],[.19,.19,.19]);mesh(root,'cylinder',C.dark,[.45,1.7,0],[.05,1.2,.05]);mesh(root,'ball',C.cream,[.45,2.25,0],[.3,.16,.22]);
    }else if(kind==='cooler'){
      mesh(root,'box',s.color,[0,.7,0],[1.05,1.4,.85]);mesh(root,'cylinder',0x9ac5c0,[0,1.67,0],[.39,.55,.39]);mesh(root,'box',C.cream,[0,.9,.45],[.7,.4,.04]);mesh(root,'box',C.copper,[0,.86,.51],[.1,.13,.13]);
    }else{
      // Overhead obstacles have genuinely open space beneath their colliders.
      for(const x of [-.96,.96])mesh(root,'box',kind==='branch'?0x73533a:C.dark,[x,1.02,0],[.13,2.04,.17]);
      mesh(root,'box',s.color,[0,1.75,0],[2,.45,.45]);
      if(kind==='branch')for(const x of [-.65,0,.65])mesh(root,'ball',C.leaf,[x,2.05,0],[.43,.4,.4]);
      else{mesh(root,'box',C.cream,[0,2.13,0],[.85,.3,.6]);const lens=mesh(root,'cylinder',C.dark,[0,2.14,.34],[.15,.14,.15]);lens.rotation.x=Math.PI/2;}
    }
    // Height-coded action badge: rising chevron / low horizontal bar / cross.
    const badge=new THREE.Group();badge.position.set(0,s.action==='slide'?2.5:2.15,0);root.add(badge);
    mesh(badge,'box',C.dark,[0,0,0],[.65,.5,.07]);
    if(s.action==='jump'){for(const sign of [-1,1]){const m=mesh(badge,'box',0xffd680,[sign*.1,0,.05],[.07,.25,.035]);m.rotation.z=sign*.65;}}
    else if(s.action==='slide')mesh(badge,'box',0xffd680,[0,-.08,.05],[.4,.08,.035]);
    else for(const sign of [-1,1]){const m=mesh(badge,'box',0xffd680,[0,0,.05],[.07,.38,.035]);m.rotation.z=sign*.78;}
    const bounds=new THREE.Box3(),helper=new THREE.Box3Helper(bounds,0xff785e);helper.visible=false;scene.add(helper);root.visible=false;
    return {root,kind,spec:s,active:false,near:false,passed:false,bounds,helper};
  }
  spawn(kind,lane,z){const e=this.items.find(e=>!e.active&&e.kind===kind);if(!e)return false;e.active=true;e.near=false;e.passed=false;e.root.visible=true;e.root.position.set(LANES[lane],0,z);return true;}
  update(dt,speed,player,onHit,onNear,debug=false){
    for(const e of this.items){e.helper.visible=debug&&e.active;if(!e.active)continue;const old=e.root.position.z;e.root.position.z+=speed*dt;const z=e.root.position.z,s=e.spec;
      // Swept Z overlap protects against dropped frames; fixed simulation step protects X/Y.
      if(old<=s.depth/2+.3&&z>=-s.depth/2-.3&&!e.passed){
        if(intersects(e,player)){e.passed=true;onHit(e);if(!e.active)continue;}
        else if(Math.abs(e.root.position.x-player.x)<s.width/2+.8)e.near=true;
      }
      if(z>s.depth/2+.3&&!e.passed){e.passed=true;if(e.near)onNear();}
      if(z>12)this.release(e);
      if(debug){e.bounds.min.set(e.root.position.x-s.width/2,s.minY||0,z-s.depth/2);e.bounds.max.set(e.root.position.x+s.width/2,s.height,z+s.depth/2);}
    }
  }
  release(e){e.active=false;e.root.visible=false;e.helper.visible=false;}
  reset(){this.items.forEach(e=>this.release(e));}
}
