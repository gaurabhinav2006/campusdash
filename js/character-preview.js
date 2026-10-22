import * as THREE from 'three';
import {loadCharacterAsset,prepareCharacterAsset} from './asset-loader.js';

const canvas=document.getElementById('previewCanvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdfe9dc);scene.fog=new THREE.Fog(0xdfe9dc,18,42);
scene.add(new THREE.HemisphereLight(0xfff1d2,0x51725f,2.45));
const sun=new THREE.DirectionalLight(0xffe0b0,3.1);sun.position.set(-6,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshStandardMaterial({color:0x789978,roughness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.01;ground.receiveShadow=true;scene.add(ground);
const camera=new THREE.PerspectiveCamera(32,1,.1,100);const display=new THREE.Group();scene.add(display);
const urls={student:'assets/boy.glb',girl:'assets/girl.glb',professor:'assets/professor.glb'};let current='student',pose='idle',asset=null,viewYaw=0,yaw=0,pitch=.12,distance=8.8,dragging=false,lastX=0,lastY=0;

async function load(type){current=type;if(asset)display.remove(asset);asset=null;asset=prepareCharacterAsset(await loadCharacterAsset(urls[type]),2.65);display.add(asset);applyPose(0);}
function applyPose(now){if(!asset)return;const t=now*.001,running=pose==='run',jumping=pose==='jump',sliding=pose==='slide',catching=pose==='catch';const phase=running?Math.sin(t*9):0;asset.position.y=jumping?Math.abs(Math.sin(t*2.2))*.16:sliding?-.02:0;asset.rotation.x=sliding?-.82:catching?-.16:jumping?-.06:0;asset.rotation.z=catching?-.08:0;asset.position.x=running?Math.sin(t*4)*.02:0;asset.position.z=running?Math.cos(t*4)*.015:0;if(asset.userData.type==='professor')asset.rotation.y=asset.rotation.y;}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);renderer.setPixelRatio(d);renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();load(current).catch(error=>{console.error('Character preview failed.',error);document.querySelector('.previewNote span').textContent='Could not load the GLB asset. Check that the local server is running.';});
for(const button of document.querySelectorAll('[data-character]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-character]').forEach(b=>b.classList.toggle('active',b===button));load(button.dataset.character);});
for(const button of document.querySelectorAll('[data-pose]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-pose]').forEach(b=>b.classList.toggle('active',b===button));pose=button.dataset.pose;});
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));viewYaw={front:0,left:-Math.PI/2,back:Math.PI}[button.dataset.view];});
canvas.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!dragging)return;yaw+=(event.clientX-lastX)*.006;pitch=Math.max(-.2,Math.min(.55,pitch+(event.clientY-lastY)*.004));lastX=event.clientX;lastY=event.clientY;});
canvas.addEventListener('pointerup',event=>{dragging=false;canvas.releasePointerCapture(event.pointerId);});
canvas.addEventListener('wheel',event=>{event.preventDefault();distance=Math.max(6,Math.min(13,distance+event.deltaY*.008));},{passive:false});
function frame(now){applyPose(now);const totalYaw=viewYaw+yaw;camera.position.set(Math.sin(totalYaw)*distance,2.9+pitch*3,Math.cos(totalYaw)*distance);camera.lookAt(0,1.45,0);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
