import * as THREE from 'three';
import {clamp,damp} from './utils.js';
export class ChaseCamera {
  constructor(w,h){this.camera=new THREE.PerspectiveCamera(57,w/h,.1,130);this.extra=0;this.resize(w,h);this.camera.position.set(0,6.7,12);this.update(1,0,12,false);}
  resize(w,h){this.camera.aspect=w/Math.max(h,1);this.extra=Math.max(0,.55-this.camera.aspect)*7;this.camera.updateProjectionMatrix();}
  update(dt,x,speed,sliding,shake=0){
    // Exact lateral anchor prevents off-screen lane changes; only height/FOV are damped.
    this.camera.position.x=x;this.camera.position.z=12+this.extra;
    this.camera.position.y=damp(this.camera.position.y,6.7-(sliding?.18:0),7,dt);
    const fov=damp(this.camera.fov,57+clamp((speed-12)*.23,0,4),3,dt);
    if(Math.abs(fov-this.camera.fov)>.001){this.camera.fov=fov;this.camera.updateProjectionMatrix();}
    this.camera.lookAt(x,1,-5);
    if(shake>0){this.camera.position.x+=(Math.random()-.5)*shake*.12;this.camera.position.y+=(Math.random()-.5)*shake*.09;}
    this.camera.updateMatrixWorld();
  }
}
