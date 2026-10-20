import * as THREE from 'three';
import {createRig} from './player.js';
import {mesh,COLORS as C,damp} from './utils.js';
export class Professor {
  constructor(scene){Object.assign(this,createRig(scene,true));this.root.scale.setScalar(.96);this.folder=new THREE.Group();this.arms[1].userData.hand.add(this.folder);this.folder.position.set(0,-.33,0);mesh(this.folder,'box',C.copper,[.04,0,0],[.38,.48,.065]);mesh(this.folder,'box',C.cream,[.04,0,-.038],[.29,.36,.012]);this.reset();}
  reset(){this.time=0;this.root.position.set(-.95,0,2.5);}
  update(dt,playerX,gap,mode='run',progress=0){
    this.time+=dt*(mode==='idle'?2:10.4);const catchUp=mode==='catch';
    this.root.position.x=damp(this.root.position.x,playerX-(catchUp?.48:.95),14,dt);
    this.root.position.z=damp(this.root.position.z,catchUp?gap*(1-progress)+.42*progress:gap,8,dt);
    this.body.position.y=Math.abs(Math.sin(this.time))*(mode==='idle'?.01:.04);this.body.rotation.x=damp(this.body.rotation.x,catchUp?-.16:.04,8,dt);
    const swing=Math.sin(this.time)*(mode==='idle'?.06:catchUp?.2:.6);
    this.arms[0].rotation.x=damp(this.arms[0].rotation.x,catchUp?-1.4:-swing,12,dt);this.arms[1].rotation.x=damp(this.arms[1].rotation.x,catchUp?-.9:swing-.3,12,dt);
    this.folder.rotation.z=Math.sin(this.time*.5)*.12;this.head.rotation.y=Math.sin(this.time*.25)*.09;
    // Forward travel is toward negative Z. Match the student's stride phase so
    // the professor's feet and arms visibly drive forward instead of reading
    // as a backward-running loop from the chase camera.
    for(let i=0;i<2;i++){const sign=i?-1:1;this.legs[i].rotation.x=sign*swing;this.knees[i].rotation.x=Math.max(0,-sign*swing)*.7;}
  }
}
