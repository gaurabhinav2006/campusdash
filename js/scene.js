import * as THREE from 'three';
import {mesh,label,COLORS as C} from './utils.js';
export class CampusScene {
  constructor(canvas){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xdde1c5);this.scene.fog=new THREE.Fog(0xdde1c5,28,108);
    this.scene.add(new THREE.HemisphereLight(0xffeed5,0x577762,2.1));
    const sun=new THREE.DirectionalLight(0xffdfac,2.8);sun.position.set(-13,24,10);sun.target.position.set(0,0,-14);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:27,bottom:-16,near:1,far:75});sun.shadow.normalBias=.04;this.scene.add(sun,sun.target);
    mesh(this.scene,'box',0x8b9c65,[0,-.2,-50],[90,.3,170]).castShadow=false;
    mesh(this.scene,'box',0xc9b997,[0,-.04,-50],[8.4,.12,170]).castShadow=false;
    this.segments=[];for(let i=0;i<6;i++)this.segments.push(this.segment(i));
    // Sparse world-space streaks; geometry is allocated only once.
    this.streaks=[];for(let i=0;i<12;i++){const s=mesh(this.scene,'box',0xffe2ac,[(i%2?1:-1)*(4.6+i%3),1+i%4,-i*6],[.018,.018,1.8]);s.castShadow=false;s.visible=false;this.streaks.push(s);}
  }
  segment(index){
    const g=new THREE.Group();g.position.z=12-index*24;
    for(const side of [-1,1]){
      mesh(g,'box',C.cream,[side*4.4,.09,0],[.4,.25,24]);
      mesh(g,'box',0xe0cfad,[side*5.3,.02,0],[1.4,.15,24]);
      for(let z=-10;z<12;z+=4){mesh(g,'box',0xdaccaa,[0,.029,z],[8.1,.015,.035]).castShadow=false;}
      const x=side*10.8;
      mesh(g,'box',index%2?0xd5b78d:0xe8d3ad,[x,3.4,-6],[7,6.8,10]);
      mesh(g,'box',C.copper,[x,6.9,-6],[7.5,.3,10.6]);
      for(let floor=0;floor<2;floor++)for(let j=0;j<3;j++){
        mesh(g,'box',C.dark,[x-2.2+j*2.2,1.8+floor*2.65,-.97],[1.2,1.5,.04]);
        mesh(g,'box',0xe9dac2,[x-2.2+j*2.2,2.65+floor*2.65,-.7],[1.55,.12,.6]);
      }
      label(g,['AAROH LIBRARY','CANTEEN','SCIENCE WING','STUDENT STUDIO','LECTURE HALL','ARTS COURT'][index],x,6.1,-.94,5.6);
      this.tree(g,side*6.7,7);this.tree(g,side*16,-13);
      mesh(g,'cylinder',C.dark,[side*5.8,1.8,-7],[.065,3.6,.065]);mesh(g,'ball',0xffe4aa,[side*5.8,3.65,-7],[.26,.3,.26]);
      mesh(g,'box',0x895a38,[side*6,.65,2],[.7,.13,2.2]);mesh(g,'box',0x895a38,[side*6.4,.95,2],[.12,.6,2.2]);
      for(const z of [1.2,2.8])mesh(g,'box',C.dark,[side*6,.32,z],[.55,.6,.1]);
      mesh(g,'cylinder',C.green,[side*5.8,.45,9],[.33,.9,.33]);mesh(g,'cylinder',C.dark,[side*5.8,.93,9],[.36,.1,.36]);
      mesh(g,'cylinder',C.copper,[side*5.8,.25,-2],[.45,.5,.45]);mesh(g,'ball',C.leaf,[side*5.8,.8,-2],[.53,.65,.53]);
    }
    if(index%2===0){mesh(g,'box',C.dark,[-5.9,1.2,11],[.12,2.4,.12]);mesh(g,'box',C.green,[-5.9,2,11],[1.8,1.2,.13]);label(g,'NOTICE BOARD',-5.9,2.12,11.08,1.6);}
    if(index%3===0){for(const x of [-4.8,4.8])mesh(g,'box',C.copper,[x,3,-11],[.5,6,.6]);mesh(g,'box',C.cream,[0,6,-11],[10.3,.6,.7]);label(g,'AAROH CAMPUS',0,6,-10.63,4.8);}
    if(index%2===1){
      for(const z of [4.5,5.7]){const w=mesh(g,'ring',C.dark,[5.5,.45,z],[.4,.4,.4]);w.rotation.y=Math.PI/2;}
      const f=mesh(g,'box',C.copper,[5.5,.78,5.1],[.09,.08,1.3]);f.rotation.x=.25;mesh(g,'box',C.dark,[5.5,1.15,4.7],[.6,.08,.08]);
      mesh(g,'box',C.blue,[-5.8,.7,4],[.7,1.4,.7]);mesh(g,'cylinder',0xa8cfc7,[-5.8,1.6,4],[.25,.45,.25]);
    }
    // Batch repeated geometry/material pairs within each recycled section.
    const batches=new Map();for(const m of [...g.children]){if(!m.isMesh||m.material.map)continue;const k=m.geometry.uuid+m.material.uuid+m.castShadow;const b=batches.get(k)||[];b.push(m);batches.set(k,b);}
    for(const list of batches.values()){if(list.length<2)continue;const base=list[0],inst=new THREE.InstancedMesh(base.geometry,base.material,list.length);inst.castShadow=base.castShadow;inst.receiveShadow=true;list.forEach((m,i)=>{m.updateMatrix();inst.setMatrixAt(i,m.matrix);g.remove(m);});g.add(inst);}
    this.scene.add(g);return g;
  }
  tree(g,x,z){mesh(g,'cylinder',0x755037,[x,1.5,z],[.22,3,.22]);for(let j=0;j<3;j++)mesh(g,'ball',j===1?0x688b4b:C.leaf,[x+(j-1)*.65,3.7+Math.sin(j)*.4,z],[1.2,1.5,1.15]);}
  update(dt,travel,speed=0){for(const s of this.segments){s.position.z+=travel;if(s.position.z>36)s.position.z-=144;}
    for(const s of this.streaks){s.visible=speed>20;s.position.z+=travel*1.7;if(s.position.z>9)s.position.z-=85;}}
  resize(w,h){this.renderer.setSize(w,h,false);}
  render(camera){this.renderer.render(this.scene,camera);}
}
