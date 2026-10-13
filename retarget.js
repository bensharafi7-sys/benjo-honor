// Bake UAL (Quaternius) clips onto the Meshy rig: world-delta retarget with rest-direction alignment.
import * as THREE from 'three';
export const MAP={Hips:'pelvis',Spine:'spine_01',Spine01:'spine_02',Spine02:'spine_03',neck:'neck_01',Head:'Head',
 LeftShoulder:'clavicle_l',LeftArm:'upperarm_l',LeftForeArm:'lowerarm_l',LeftHand:'hand_l',
 RightShoulder:'clavicle_r',RightArm:'upperarm_r',RightForeArm:'lowerarm_r',RightHand:'hand_r',
 LeftUpLeg:'thigh_l',LeftLeg:'calf_l',LeftFoot:'foot_l',LeftToeBase:'ball_l',
 RightUpLeg:'thigh_r',RightLeg:'calf_r',RightFoot:'foot_r',RightToeBase:'ball_r'};
const CHILD={Hips:'Spine',Spine:'Spine01',Spine01:'Spine02',Spine02:'neck',neck:'Head',LeftShoulder:'LeftArm',LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',
 RightShoulder:'RightArm',RightArm:'RightForeArm',RightForeArm:'RightHand',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',LeftFoot:'LeftToeBase',RightUpLeg:'RightLeg',RightLeg:'RightFoot',RightFoot:'RightToeBase'};
export function makeRetargeter(tRoot,sRoot){
 tRoot.updateMatrixWorld(true);sRoot.updateMatrixWorld(true);
 const T={},S={};tRoot.traverse(o=>{if(o.isBone&&MAP[o.name])T[o.name]=o;});sRoot.traverse(o=>{if(o.isBone)S[o.name]=o;});
 const names=Object.keys(MAP).filter(n=>T[n]&&S[MAP[n]]);
 // order parents first
 const depth=o=>{let d=0;while(o.parent){o=o.parent;d++;}return d;};names.sort((a,b)=>depth(T[a])-depth(T[b]));
 const wq=o=>o.getWorldQuaternion(new THREE.Quaternion()),wp=o=>o.getWorldPosition(new THREE.Vector3());
 const rest={};
 for(const n of names){const t=T[n],s=S[MAP[n]];const Qt0=wq(t),Qs0=wq(s);let R=new THREE.Quaternion();
  const c=CHILD[n];if(c&&T[c]&&S[MAP[c]]){const dt=wp(T[c]).sub(wp(t)).normalize(),ds=wp(S[MAP[c]]).sub(wp(s)).normalize();if(dt.lengthSq()>0&&ds.lengthSq()>0)R.setFromUnitVectors(dt,ds);}
  rest[n]={Qs0inv:Qs0.clone().invert(),QtA:R.multiply(Qt0)};}
 const tH=T.Hips,sH=S.pelvis;const tHip0=wp(tH),sHip0=wp(sH);const scale=tHip0.y/sHip0.y;
 const tLocal0={};for(const n of names)tLocal0[n]=T[n].quaternion.clone();const tHipLocal0=tH.position.clone();
 return function bake(clip,fps=30){
  const mixer=new THREE.AnimationMixer(sRoot);const act=mixer.clipAction(clip);act.play();
  const n=Math.max(2,Math.round(clip.duration*fps)+1);const times=new Float32Array(n);const q={},hp=new Float32Array(n*3);for(const b of names)q[b]=new Float32Array(n*4);
  const tmp=new THREE.Quaternion(),pw=new THREE.Quaternion(),tw={};
  for(let i=0;i<n;i++){const t=Math.min(clip.duration,i/fps);times[i]=t;mixer.setTime(t);sRoot.updateMatrixWorld(true);
   for(const b of names){const s=S[MAP[b]];const Qs=wq(s);const Tw=Qs.multiply(rest[b].Qs0inv).multiply(rest[b].QtA);tw[b]=Tw;
    const par=T[b].parent;let P;if(tw[par.name])P=tw[par.name];else{P=wq(par);}
    tmp.copy(P).invert().multiply(Tw);tmp.toArray(q[b],i*4);}
   const d=wp(sH).sub(sHip0).multiplyScalar(scale);const w=tHip0.clone().add(d);d.set(0,0,0);
   const local=tH.parent.worldToLocal(w.clone());local.toArray(hp,i*3);}
  act.stop();mixer.uncacheRoot(sRoot);
  // restore rest
  const tracks=names.map(b=>new THREE.QuaternionKeyframeTrack(T[b].name+'.quaternion',times,q[b]));
  tracks.push(new THREE.VectorKeyframeTrack(tH.name+'.position',times,hp));
  return new THREE.AnimationClip(clip.name,clip.duration,tracks);};
}
