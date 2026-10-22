import * as THREE from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';

const loader=new GLTFLoader();
const cache=new Map();

export function loadCharacterAsset(url){
  if(cache.has(url))return cache.get(url).then(source=>source.clone(true));
  const promise=new Promise((resolve,reject)=>loader.load(url,gltf=>resolve(gltf.scene),undefined,reject));
  cache.set(url,promise);
  return promise.then(source=>source.clone(true));
}

export function prepareCharacterAsset(root,targetHeight=2.65){
  root.traverse(node=>{if(!node.isMesh)return;node.castShadow=true;node.receiveShadow=true;});
  const bounds=new THREE.Box3().setFromObject(root);
  const size=bounds.getSize(new THREE.Vector3());
  if(size.y>0)root.scale.multiplyScalar(targetHeight/size.y);
  const fitted=new THREE.Box3().setFromObject(root);
  const center=fitted.getCenter(new THREE.Vector3());
  root.position.x-=center.x;
  root.position.z-=center.z;
  root.position.y-=fitted.min.y;
  return root;
}
