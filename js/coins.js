import * as THREE from 'three';
import {mesh,material,COLORS as C,LANES,damp} from './utils.js';
export const POWER_TYPES=['boost','shield','magnet','multiplier'];
export class Coins {
  constructor(scene){this.time=0;this.items=[];
    for(let i=0;i<80;i++)this.items.push(this.create(scene,'coin'));
    for(const kind of POWER_TYPES)for(let j=0;j<2;j++)this.items.push(this.create(scene,kind));
  }
  create(scene,kind){const root=new THREE.Group();scene.add(root);let color=C.gold;
    if(kind==='coin'){const disc=mesh(root,'cylinder',C.gold,[0,0,0],[.28,.09,.28]);disc.rotation.x=Math.PI/2;disc.material=material(C.gold,.55);mesh(root,'box',C.cream,[0,0,.06],[.22,.055,.04]);mesh(root,'box',C.cream,[0,.09,.06],[.16,.055,.04]);}
    else{
      color={boost:0xcf7443,shield:0x60b7c9,magnet:0xc074ba,multiplier:0x87b869}[kind];
      const rim=mesh(root,'ring',color,[0,0,0],[.46,.46,.46]);rim.material=material(color,.25);
      if(kind==='boost'){mesh(root,'cylinder',C.cream,[0,0,0],[.19,.35,.19]);mesh(root,'ring',color,[.2,0,0],[.12,.12,.12]);}
      if(kind==='shield'){const shield=mesh(root,'ball',color,[0,0,0],[.25,.32,.08]);shield.rotation.z=.15;}
      if(kind==='magnet'){for(const x of [-.18,.18])mesh(root,'box',C.cream,[x,.05,0],[.12,.36,.15]);mesh(root,'box',color,[0,-.16,0],[.48,.12,.15]);}
      if(kind==='multiplier')for(const angle of [-.7,.7]){const x=mesh(root,'box',C.cream,[0,0,0],[.12,.55,.1]);x.rotation.z=angle;}
    }
    root.visible=false;return {root,kind,color,active:false};
  }
  spawn(kind,lane,z,y=1.1){const e=this.items.find(e=>!e.active&&e.kind===kind);if(!e)return;e.root.position.set(LANES[lane],y,z);e.root.visible=true;e.active=true;return e;}
  pattern(lane,z,type){for(let i=0;i<5;i++){const e=this.spawn('coin',lane,z+4-i*2,type==='arc'?1.05+Math.sin(i/4*Math.PI)*1.35:1.1);if(e&&type==='weave')e.root.position.x+=i%2?.37:-.37;}}
  update(dt,speed,p,magnet,onCollect,onMiss){this.time+=dt;
    for(const e of this.items){if(!e.active)continue;const pos=e.root.position;pos.z+=speed*dt;e.root.rotation.y+=dt*2.8;
      if(magnet&&e.kind==='coin'&&Math.abs(pos.z)<12){pos.x=damp(pos.x,p.x,10,dt);pos.y=damp(pos.y,p.y+1.1,10,dt);pos.z=damp(pos.z,0,5,dt);}
      if(Math.abs(pos.z)<.85&&Math.abs(pos.x-p.x)<.67&&Math.abs(pos.y-(p.y+(p.slideTime>0?.6:1.1)))<.9){onCollect(e);e.active=false;e.root.visible=false;}
      else if(pos.z>2){if(e.kind==='coin')onMiss();e.active=false;e.root.visible=false;}
    }
  }
  reset(){for(const e of this.items){e.active=false;e.root.visible=false;e.root.rotation.set(0,0,0);}}
}
