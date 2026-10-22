import * as THREE from 'three';
import {Player} from './player.js';
import {Professor} from './professor.js';

const canvas=document.getElementById('previewCanvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdfe9dc);scene.add(new THREE.HemisphereLight(0xfff1d2,0x51725f,2.4));const sun=new THREE.DirectionalLight(0xffe0b0,3);sun.position.set(-6,12,8);sun.castShadow=true;scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshStandardMaterial({color:0x789978,roughness:.9}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const camera=new THREE.PerspectiveCamera(32,1,.1,100);let characterType='student',pose='idle',viewYaw=0,yaw=0,pitch=.12,distance=8.8,dragging=false,lastX=0,lastY=0,runner,professor;
function rebuild(){if(runner)scene.remove(runner.root);if(professor)scene.remove(professor.root);if(characterType==='professor'){professor=new Professor(scene);runner=null;}else{runner=new Player(scene,characterType==='girl'?'girl':'boy');professor=null;}}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(d);renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
function animatePose(){if(runner){runner.reset();if(pose==='jump')runner.jump();if(pose==='slide')runner.slide();runner.update(1/60,pose==='run'?18:0,pose==='catch'?'caught':'run');}if(professor){professor.reset();professor.update(1/60,0,2.5,pose==='catch'?'catch':pose==='run'?'run':'idle',pose==='catch'?1:0);}}
window.addEventListener('resize',resize);resize();rebuild();
for(const button of document.querySelectorAll('[data-character]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-character]').forEach(b=>b.classList.toggle('active',b===button));characterType=button.dataset.character;rebuild();});
for(const button of document.querySelectorAll('[data-pose]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b===button));pose=button.dataset.pose;});
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));viewYaw={front:0,left:-Math.PI/2,back:Math.PI}[button.dataset.view];});
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.006;pitch=Math.max(-.2,Math.min(.55,pitch+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY;});canvas.addEventListener('pointerup',e=>{dragging=false;canvas.releasePointerCapture(e.pointerId);});canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(6,Math.min(13,distance+e.deltaY*.008));},{passive:false});
function frame(now){animatePose();const totalYaw=viewYaw+yaw;camera.position.set(Math.sin(totalYaw)*distance,2.9+pitch*3,Math.cos(totalYaw)*distance);camera.lookAt(0,1.45,0);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
