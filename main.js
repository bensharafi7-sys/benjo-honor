// BENJO IN ISTANBUL – משימה 01 "השיחה מקרקוי". Three.js + cannon-es, portrait 9:16, mobile-first.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as CANNON from 'cannon-es';
import {makeRetargeter} from './retarget.js';
import {moveVector,lookDelta,camBasis} from './controls.js';

const Q=new URLSearchParams(location.search),REC=Q.has('rec');
const $=id=>document.getElementById(id);
const isTouch=matchMedia('(pointer:coarse)').matches||Q.has('touch');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,damp=(a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
const wrapA=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
const angDamp=(a,b,k,dt)=>a+wrapA(b-a)*(1-Math.exp(-k*dt));
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const APP=$('app');const HERO_GLB='ben_v2.glb';

// ---------- settings ----------
const SET=Object.assign({sens:1,lefty:false,invY:false,contrast:false},JSON.parse(localStorage.getItem('benjo_ist_set')||'{}'));
function applySet(){APP.classList.toggle('lefty',SET.lefty);document.body.classList.toggle('hc',SET.contrast);localStorage.setItem('benjo_ist_set',JSON.stringify(SET));}
$('sens').value=SET.sens;$('lefty').checked=SET.lefty;$('invY').checked=SET.invY;$('contrast').checked=SET.contrast;applySet();
for(const id of['sens','lefty','invY','contrast'])$(id).oninput=()=>{SET[id]=id==='sens'?+$(id).value:$(id).checked;applySet();};
$('gear').onclick=()=>$('settings').classList.toggle('hidden');$('setClose').onclick=()=>$('settings').classList.add('hidden');

// ---------- renderer (mobile budget: no shadows, no point lights) ----------
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:!isTouch,powerPreference:'high-performance',preserveDrawingBuffer:REC});
renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.25:1.5));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a1426);scene.fog=new THREE.FogExp2(0x101a2e,0.012);
const camera=new THREE.PerspectiveCamera(62,9/16,0.1,600);
function resize(){const w=APP.clientWidth,h=APP.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
{const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();es.background=new THREE.Color(0x0b1424);
 const cols=[0xffb860,0xffd28a,0x3b6bd6,0xff7040,0xffe2b0];for(let i=0;i<16;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(3,1+Math.random()*3,.2),new THREE.MeshBasicMaterial({color:cols[i%5]}));const a=i/16*Math.PI*2;m.position.set(Math.cos(a)*20,1+Math.random()*5,Math.sin(a)*20);m.lookAt(0,3,0);es.add(m);}
 scene.environment=pm.fromScene(es,0.04).texture;scene.environmentIntensity=0.45;}
scene.add(new THREE.HemisphereLight(0x5a6a98,0x2a1a10,1.0));
const key=new THREE.DirectionalLight(0xffc58a,1.1);key.position.set(-30,40,30);scene.add(key);   // warm street-light key (single light, no shadows)
const rim=new THREE.DirectionalLight(0x6f9cff,0.6);rim.position.set(20,25,-40);scene.add(rim);

// ---------- physics ----------
const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});world.broadphase=new CANNON.SAPBroadphase(world);
const gMat=new CANNON.Material('g'),wMat=new CANNON.Material('w');world.addContactMaterial(new CANNON.ContactMaterial(gMat,wMat,{friction:.3,restitution:0}));
{const b=new CANNON.Body({mass:0,material:gMat});b.addShape(new CANNON.Plane());b.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(b);}
const solids=[];
function addSolid(cx,cz,sx,sz,h=12,y0=0,phys=true){const b=new THREE.Box3(V3(cx-sx/2,y0,cz-sz/2),V3(cx+sx/2,y0+h,cz+sz/2));solids.push(b);
 if(phys){const body=new CANNON.Body({mass:0,material:gMat});body.addShape(new CANNON.Box(new CANNON.Vec3(sx/2,h/2,sz/2)));body.position.set(cx,y0+h/2,cz);world.addBody(body);}return b;}

// ---------- assets ----------
const loader=new GLTFLoader();const cache={};const load=u=>cache[u]||(cache[u]=loader.loadAsync(u));
async function model(u,{width,height,length}={}){const g=(await load(u)).scene.clone(true);const s=new THREE.Box3().setFromObject(g).getSize(V3());
 g.scale.setScalar(width?width/s.x:height?height/s.y:length?length/s.z:1);return g;}
const A=s=>{const a=new Audio('assets/audio/'+s);a.preload='auto';return a;};
const music={calm:A('m_calm.mp3'),tension:A('m_tension.mp3'),chase:A('m_chase.mp3')};for(const m of Object.values(music)){m.loop=true;m.volume=0;}
const amb={rain:A('rain.mp3'),city:A('city.mp3'),engine:A('engine.mp3')};for(const m of Object.values(amb)){m.loop=true;m.volume=0;}
let audioOn=false;const AUD={log:[]};
function sfx(n,vol=1,rate=1){AUD.log.push({t:G.time,src:n});if(REC||!audioOn)return;const a=A(n+'.mp3');a.volume=clamp(vol,0,1);a.playbackRate=rate;a.play().catch(()=>{});}
let actx;function buzz(){try{navigator.vibrate?.([200,100,200,100,200]);}catch{}if(!audioOn||REC)return;actx=actx||new AudioContext();const t=actx.currentTime;
 for(let i=0;i<3;i++){const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=150;o.type='square';g.gain.value=0;g.gain.setValueAtTime(.12,t+i*.3);g.gain.setValueAtTime(0,t+i*.3+.2);o.connect(g).connect(actx.destination);o.start(t+i*.3);o.stop(t+i*.3+.22);}}

// ---------- materials ----------
const M={asphalt:new THREE.MeshStandardMaterial({color:0x1a1d24,roughness:.22,metalness:.4}),
 walk:new THREE.MeshStandardMaterial({color:0x3a3a40,roughness:.4,metalness:.2}),stone:new THREE.MeshStandardMaterial({color:0x4a4640,roughness:.55}),
 water:new THREE.MeshStandardMaterial({color:0x061224,roughness:.06,metalness:.95}),wood:new THREE.MeshStandardMaterial({color:0x4a3524,roughness:.7}),
 line:new THREE.MeshBasicMaterial({color:0x8d8a78}),dark:new THREE.MeshStandardMaterial({color:0x14161c,roughness:.8}),
 warm:new THREE.MeshBasicMaterial({color:0xffc070,toneMapped:false}),cool:new THREE.MeshBasicMaterial({color:0x9cc4ff,toneMapped:false}),
 rail:new THREE.MeshStandardMaterial({color:0x22252c,roughness:.4,metalness:.7}),brick:new THREE.MeshStandardMaterial({color:0x5a3a2e,roughness:.8}),
 metal:new THREE.MeshStandardMaterial({color:0x3c4450,roughness:.5,metalness:.6})};
function glowTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);return t;}
const GLOW=glowTex();
function fakeLight(pos,color=0xffb060,size=3,pool=7){ // lamp = sprite halo + additive ground pool, zero real lights
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9,fog:true}));s.scale.setScalar(size);s.position.copy(pos);scene.add(s);
 if(pool){const p=new THREE.Mesh(new THREE.PlaneGeometry(pool,pool),new THREE.MeshBasicMaterial({map:GLOW,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.35,toneMapped:false}));p.rotation.x=-Math.PI/2;p.position.set(pos.x,.17,pos.z);scene.add(p);}}
function sign(text,color,w,h,pos,rotY){const cv=document.createElement('canvas');cv.width=512;cv.height=Math.round(512*h/w);const c=cv.getContext('2d');
 c.fillStyle='#0a0a10';c.fillRect(0,0,cv.width,cv.height);c.font=`700 ${cv.height*.55}px Arial`;c.textAlign='center';c.textBaseline='middle';c.direction=/[\u0590-\u05ff]/.test(text)?'rtl':'ltr';
 c.shadowColor=color;c.shadowBlur=22;c.fillStyle=color;c.fillText(text,256,cv.height/2);c.shadowBlur=0;c.globalAlpha=.6;c.fillStyle='#fff';c.fillText(text,256,cv.height/2);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));m.position.copy(pos);m.rotation.y=rotY;scene.add(m);
 fakeLight(pos.clone().add(V3(Math.sin(rotY),0,Math.cos(rotY))),new THREE.Color(color).getHex(),w*1.3,0);return m;}

// ---------- WORLD: Karaköy waterfront (x along shore, water at z<-10) ----------
const ROAD={z0:2,z1:10,x0:-80,x1:215};const QUAY={z0:-10,z1:2};
const PIER={x0:26,x1:34,z0:-42,z1:-10};
const WAREHOUSE=V3(178,0,24),ELIF_POS=V3(30,.15,-13),SUV_POS=V3(40,0,6),START=V3(-34,.15,-5);
const DEMIR_POS=V3(178,0,15.2),EXIT_GOAL=V3(150,0,6);
const BLOCKS=[];function slab(x0,x1,z0,z1,mat=M.walk,y=.15){BLOCKS.push([x0,x1,z0,z1,y]);const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y,z1-z0),mat);m.position.set((x0+x1)/2,y/2,(z0+z1)/2);scene.add(m);}
const groundY=(x,z)=>{for(const[a,b,c,d,y]of BLOCKS)if(x>a&&x<b&&z>c&&z<d)return y;return 0;};
const walkable=(x,z)=>{if(z<QUAY.z0)return x>PIER.x0+.3&&x<PIER.x1-.3&&z>PIER.z0+.3;return x>ROAD.x0&&x<ROAD.x1&&z<60;};
let ferry;const npcs=[];
async function buildWorld(){
 const g=new THREE.Mesh(new THREE.PlaneGeometry(320,80),M.asphalt);g.rotation.x=-Math.PI/2;g.position.set(68,0,30);scene.add(g);
 const w=new THREE.Mesh(new THREE.PlaneGeometry(900,500),M.water);w.rotation.x=-Math.PI/2;w.position.set(68,-.5,-260);scene.add(w);
 slab(ROAD.x0,ROAD.x1,QUAY.z0,QUAY.z1,M.stone);slab(ROAD.x0,150,ROAD.z1,14);
 // quay edge wall + rail
 const edge=new THREE.Mesh(new THREE.BoxGeometry(ROAD.x1-ROAD.x0,1.2,.6),M.stone);edge.position.set((ROAD.x0+ROAD.x1)/2,-.45,QUAY.z0);scene.add(edge);
 for(let x=ROAD.x0;x<ROAD.x1;x+=2.5){if(x>PIER.x0-1&&x<PIER.x1+1)continue;const p=new THREE.Mesh(new THREE.BoxGeometry(.08,1,.08),M.rail);p.position.set(x,.65,QUAY.z0+.3);scene.add(p);}
 const r=new THREE.Mesh(new THREE.BoxGeometry(ROAD.x1-ROAD.x0,.06,.06),M.rail);r.position.set((ROAD.x0+ROAD.x1)/2,1.13,QUAY.z0+.3);scene.add(r);
 // pier (wooden, on posts) + lamps
 slab(PIER.x0,PIER.x1,PIER.z0,PIER.z1+.01,M.wood,.2);
 for(let z=PIER.z0;z<PIER.z1;z+=4)for(const x of[PIER.x0,PIER.x1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,2.2,6),M.wood);p.position.set(x,-.9,z);scene.add(p);}
 for(let z=PIER.z0+4;z<PIER.z1;z+=10){fakeLight(V3(PIER.x0+.4,3.6,z),0xffc070,2.2,6);const p=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.6,5),M.rail);p.position.set(PIER.x0+.4,1.8,z);scene.add(p);}
 // lane markings
 for(let x=ROAD.x0;x<ROAD.x1;x+=7){const l=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.16),M.line);l.rotation.x=-Math.PI/2;l.position.set(x,.01,6);scene.add(l);}
 // building row with two alleys (gaps at x≈-16 and x≈62)
 const B=['a','b','c','d','e','f','g','h'];let n=0;const P=[];
 const place=(x,z,rot)=>{const nm=B[n++%8];P.push(model(`assets/models/city/building-${nm}.glb`,{width:9.6}).then(m=>{m.position.set(x,.15,z);m.rotation.y=rot;scene.add(m);}));addSolid(x,z,10,10,30,0,true);};
 for(let x=-74;x<=144;x+=10){if(Math.abs(x+16)<5||Math.abs(x-62)<5)continue;place(x,19.2,Math.PI);if(x%20===0)place(x,40,Math.PI);}
 for(const ax of[-16,62]){slab(ax-4,ax+4,14,48);for(const s of[-1,1])addSolid(ax+s*7,32,4,22,30,0,true);addSolid(ax,49,10,2,30,0,true);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(10,12,1),M.brick);wall.position.set(ax,6,49);scene.add(wall);
  for(let z=20;z<46;z+=8)fakeLight(V3(ax+(z%16?3.4:-3.4),3.4,z),0xffa84a,2,5);
  P.push(model('assets/models/roads/dumpster.glb',{width:2}).then(d=>{d.position.set(ax+2.6,.15,40);d.rotation.y=Math.PI/2;scene.add(d);}));addSolid(ax+2.6,40,1.4,2,1.4,0);
  // string lights across alley
  for(let i=0;i<8;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.07,5,4),M.warm);b.position.set(ax-3.6+i,4.6-Math.sin(i/7*Math.PI)*.6,26);scene.add(b);}}
 for(const nm of['awning-wide','awning'])void nm;
 for(let x=-70;x<140;x+=20){if(Math.abs(x+16)<6||Math.abs(x-62)<6)continue;P.push(model('assets/models/city/detail-awning-wide.glb',{width:5}).then(a=>{a.position.set(x,2.6,14.2);a.rotation.y=Math.PI;scene.add(a);}));
  // café tables
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.75,8),M.metal);t.position.set(x+1.5,.5,12.4);scene.add(t);}
 // street lamps (fake light only)
 for(let x=ROAD.x0+6;x<ROAD.x1;x+=16){P.push(model('assets/models/roads/light-curved.glb',{height:6.5}).then(m=>{m.position.set(x,.15,1.4);m.rotation.y=Math.PI/2*0;scene.add(m);}));fakeLight(V3(x,6.2,2.6),0xffb35a,3.4,8);}
 // signs: Karaköy + Hebrew
 sign('KARAKÖY','#f3c25b',8,1.6,V3(-40,6,14.1),Math.PI);sign('בית קפה','#ff8a3c',4.5,1.2,V3(-4,4.4,14.1),Math.PI);sign('LOKANTA','#56c8ff',5,1.2,V3(24,4.6,14.1),Math.PI);
 sign('BALIK','#ff4d6d',4,1.1,V3(90,4.4,14.1),Math.PI);sign('רציף','#9cc4ff',3,1,V3(30,3.2,-9.6),Math.PI);sign('GALATA','#f3c25b',5,1.2,V3(120,5,14.1),Math.PI);
 // bollards along quay
 for(let x=ROAD.x0+3;x<ROAD.x1;x+=9){const b=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.6,8),M.dark);b.position.set(x,.45,-8.8);scene.add(b);}
 // WAREHOUSE (east end, x 150..215)
 slab(150,215,10,60,M.stone,.12);
 const wh=new THREE.Mesh(new THREE.BoxGeometry(30,10,16),M.metal);wh.position.set(WAREHOUSE.x,5,WAREHOUSE.z+8);scene.add(wh);addSolid(WAREHOUSE.x,WAREHOUSE.z+8,30,16,10,0,true);
 const door=new THREE.Mesh(new THREE.PlaneGeometry(6,5),new THREE.MeshStandardMaterial({color:0x2a2018,roughness:.7}));door.position.set(WAREHOUSE.x,2.5,WAREHOUSE.z-.01);door.rotation.y=Math.PI;scene.add(door);
 sign('DEPO 7','#ff6a3c',5,1.2,V3(WAREHOUSE.x,7,WAREHOUSE.z-.05),Math.PI);fakeLight(V3(WAREHOUSE.x+4,5.5,WAREHOUSE.z-.6),0xffd090,3,9);fakeLight(V3(WAREHOUSE.x-4,5.5,WAREHOUSE.z-.6),0xffd090,3,9);
 const ccol=[0x7a1f1f,0x1f4f7a,0x2e6b3a,0x8a6d1f];for(let i=0;i<6;i++){const x=158+i*8,z=i%2?44:36;const m=new THREE.Mesh(new THREE.BoxGeometry(6,2.6,2.5),new THREE.MeshStandardMaterial({color:ccol[i%4],roughness:.55,metalness:.4}));m.position.set(x,1.4,z+ (i<3?-6:0));scene.add(m);addSolid(x,z+(i<3?-6:0),6,2.5,2.6,0);}
 for(const z of[14,58])addSolid(205,z,2,2,1,0); // keep warehouse yard closed east
 addSolid(214,30,2,60,6,0,true);
 // FERRY on the Bosphorus + far shore + Galata tower + bridge lights
 ferry=new THREE.Group();const hull=new THREE.Mesh(new THREE.BoxGeometry(26,3,7),new THREE.MeshStandardMaterial({color:0xe8e8e0,roughness:.6}));hull.position.y=1;ferry.add(hull);
 const cab=new THREE.Mesh(new THREE.BoxGeometry(16,2.4,5.5),M.dark);cab.position.y=3.6;ferry.add(cab);for(let i=0;i<10;i++){const win=new THREE.Mesh(new THREE.PlaneGeometry(1,.8),M.warm);win.position.set(-7+i*1.55,3.7,2.8);ferry.add(win);}
 ferry.position.set(0,-.4,-70);scene.add(ferry);
 const shore=new THREE.MeshBasicMaterial({color:0x0c1220});for(let i=0;i<50;i++){const h=6+Math.random()*22;const m=new THREE.Mesh(new THREE.BoxGeometry(10+Math.random()*12,h,6),shore);m.position.set(-150+i*9,h/2-.5,-240-Math.random()*30);scene.add(m);
  for(let k=0;k<5;k++){const win=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.4),Math.random()<.7?M.warm:M.cool);win.position.set(m.position.x+(Math.random()-.5)*8,1+Math.random()*(h-2),m.position.z+3.1);scene.add(win);}}
 const tower=new THREE.Group();const tb=new THREE.Mesh(new THREE.CylinderGeometry(4,4.6,40,14),new THREE.MeshStandardMaterial({color:0x8a7a68,roughness:.8,emissive:0x2a1a0a}));tb.position.y=20;tower.add(tb);
 const tc=new THREE.Mesh(new THREE.ConeGeometry(4.8,12,14),new THREE.MeshStandardMaterial({color:0x3a4250,roughness:.6}));tc.position.y=46;tower.add(tc);
 for(let i=0;i<14;i++){const win=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.6),M.warm);const a=i/14*Math.PI*2;win.position.set(Math.sin(a)*4.05,36,Math.cos(a)*4.05);win.rotation.y=a;tower.add(win);}
 tower.position.set(70,0,110);scene.add(tower);fakeLight(V3(70,38,110),0xffc070,22,0);
 for(let i=0;i<60;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.6,5,4),M.cool);const t=i/59;b.position.set(260+t*20,24+Math.sin(t*Math.PI)*-6+6,-40-t*260);scene.add(b);}
 // hill of lights behind the buildings
 for(let i=0;i<220;i++){const b=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.2),Math.random()<.8?M.warm:M.cool);b.position.set(-120+Math.random()*340,8+Math.random()*30,70+Math.random()*60);scene.add(b);}
 // ambient NPCs (static/idle mannequins added in buildChars)
 await Promise.all(P);
}

// ---------- rain ----------
const RAIN_N=isTouch?1400:3200,rainGeo=new THREE.BufferGeometry(),rp=new Float32Array(RAIN_N*6);
for(let i=0;i<RAIN_N;i++){const x=(Math.random()-.5)*40,y=Math.random()*22,z=(Math.random()-.5)*40;rp.set([x,y,z,x+.04,y+.5,z],i*6);}
rainGeo.setAttribute('position',new THREE.BufferAttribute(rp,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xa8bde0,transparent:true,opacity:.35,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
function updRain(dt){const p=rainGeo.attributes.position.array,c=camera.position;for(let i=0;i<RAIN_N;i++){const o=i*6;let y=p[o+1]-dt*22,x=p[o],z=p[o+2];
 if(y<c.y-10||y<-.3){y=c.y+10+Math.random()*4;x=c.x+(Math.random()-.5)*40;z=c.z+(Math.random()-.5)*40;}
 if(x-c.x>20)x-=40;else if(x-c.x<-20)x+=40;if(z-c.z>20)z-=40;else if(z-c.z<-20)z+=40;p[o]=x;p[o+1]=y;p[o+2]=z;p[o+3]=x+.04;p[o+4]=y+.5;p[o+5]=z;}rainGeo.attributes.position.needsUpdate=true;}

// ---------- animation ----------
let CLIPS={};
function prepClips(gltf){const man=gltf.scene.getObjectByName('pelvis');
 for(const c of gltf.animations){const tracks=[];for(const t of c.tracks){if(t.name.endsWith('.quaternion')){tracks.push(t);continue;}
  if(t.name==='pelvis.position'){const v=t.values.slice();for(let i=0;i<v.length;i+=3){v[i]=man.position.x;v[i+2]=man.position.z;}tracks.push(new THREE.VectorKeyframeTrack(t.name,t.times,v));}}
  CLIPS[c.name]=new THREE.AnimationClip(c.name,c.duration,tracks);}}
const AMAP={idle:'Idle_Loop',walk:'Walk_Loop',jog:'Jog_Fwd_Loop',sprint:'Sprint_Loop',aim:'Pistol_Idle_Loop',shoot:'Pistol_Shoot',
 crouch:'Crouch_Idle_Loop',crouchF:'Crouch_Fwd_Loop',hit:'Hit_Chest',death:'Death01',talk:'Idle_Talking_Loop',drive:'Driving_Loop',interact:'Interact',
 jab:'Punch_Jab',cross:'Punch_Cross',jump:'Jump_Loop',jumpS:'Jump_Start',jumpL:'Jump_Land'};
const ONCE=['shoot','hit','death','interact','jab','cross','jumpS','jumpL'];
const LOCO=['idle','walk','jog','sprint'],LOCO_SPD=[0,1.5,3.9,6.6];
class Animator{
 constructor(root,CL=CLIPS){this.mixer=new THREE.AnimationMixer(root);this.a={};this.w={};this.phase=0;this.mode='loco';this.one=null;this.speed=0;
  for(const[k,n]of Object.entries(AMAP)){if(!CL[n])continue;const act=this.mixer.clipAction(CL[n]);act.play();act.setEffectiveWeight(0);this.a[k]=act;this.w[k]=0;if(ONCE.includes(k)){act.setLoop(THREE.LoopOnce);act.clampWhenFinished=true;}}
  for(const k of LOCO)this.a[k].timeScale=0;this.w.idle=1;}
 oneShot(k,dur,rate=1){this.one={k,until:dur/rate,t:0};const a=this.a[k];a.reset();a.timeScale=rate;a.play();}
 update(dt){const T={};for(const k in this.a)T[k]=0;
  if(this.one){this.one.t+=dt;if(this.one.t>=this.one.until&&this.one.k!=='death')this.one=null;}
  if(this.one)T[this.one.k]=1;else if(this.mode!=='loco')T[this.mode]=1;
  else{const s=this.speed;for(let i=0;i<4;i++){const lo=LOCO_SPD[i-1]??-1,mid=LOCO_SPD[i],hi=LOCO_SPD[i+1]??99;T[LOCO[i]]=s<=mid?(i==0?1:clamp((s-lo)/(mid-lo),0,1)):(i==3?1:clamp((hi-s)/(hi-mid),0,1));}}
  let sum=0;for(const k in this.w){this.w[k]=damp(this.w[k],T[k],this.one?16:9,dt);sum+=this.w[k];}
  let lw=0,rate=0;for(const k of LOCO){lw+=this.w[k];rate+=this.w[k]/this.a[k].getClip().duration;}
  if(lw>.001)this.phase=(this.phase+dt*rate/lw)%1;for(const k of LOCO){const a=this.a[k];a.time=this.phase*a.getClip().duration;}
  for(const k in this.a){this.a[k].setEffectiveWeight(this.w[k]/(sum||1));this.a[k].enabled=this.w[k]>.002||T[k]>0;}
  this.mixer.update(dt);}
}

// ---------- state ----------
const G={time:0,state:'title',stage:null,hp:100,flags:{},keys:{},look:{yaw:0,pitch:-.12},run:false,crouch:false,inCar:false,aim:false,jumpV:0,air:false};
window.G=G;
let hero,heroAnim,gun,elif,elifAnim,demir,demirAnim;const extras=[];
function makeGun(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x111111,roughness:.35,metalness:.8});
 const s=new THREE.Mesh(new THREE.BoxGeometry(.035,.05,.2),m);s.position.z=.06;const h=new THREE.Mesh(new THREE.BoxGeometry(.03,.11,.045),m);h.position.set(0,-.06,-.02);h.rotation.x=.25;g.add(s,h);return g;}
function mannequin(ag,col,{coat,hair,skirt}={}){const m=SkeletonUtils.clone(ag.scene);m.updateMatrixWorld(true);m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.material=o.material.clone();o.material.color.set(o.material.name==='M_Joints'?(coat??0x111111):col);o.material.roughness=.6;}});
 const head=m.getObjectByName('Head');if(head&&hair){const k=1/head.getWorldScale(V3()).x;const hm=new THREE.Mesh(new THREE.SphereGeometry(.13*k,12,8,0,Math.PI*2,0,Math.PI*.62),new THREE.MeshStandardMaterial({color:hair,roughness:.7}));hm.position.y=.1*k;head.add(hm);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(.07*k,.03*k,.34*k,8),hm.material);tail.position.set(0,-.06*k,-.1*k);head.add(tail);}
 if(skirt){const p=m.getObjectByName('pelvis');const k=1/p.getWorldScale(V3()).x;const sk=new THREE.Mesh(new THREE.CylinderGeometry(.17*k,.3*k,.62*k,12,1,true),new THREE.MeshStandardMaterial({color:skirt,roughness:.75,side:THREE.DoubleSide}));sk.position.y=-.24*k;p.add(sk);}
 return m;}
async function buildChars(){
 const[hg,ag]=await Promise.all([load('assets/models/'+HERO_GLB+''),load('assets/models/anims.glb')]);prepClips(ag);
 const bake=makeRetargeter(hg.scene,SkeletonUtils.clone(ag.scene));const HC={};for(const n of Object.values(AMAP)){const c=ag.animations.find(a=>a.name===n);if(c)HC[n]=bake(c);}
 hero=hg.scene;hero.traverse(o=>{if(o.isMesh){o.frustumCulled=false;for(const mt of[].concat(o.material)){mt.roughness=Math.max(mt.roughness??1,.7);if(mt.roughnessMap)mt.roughness=1;mt.metalness=0;mt.metalnessMap=null;mt.envMapIntensity=.5;}}});
 scene.add(hero);heroAnim=new Animator(hero,HC);
 gun=makeGun();const hand=hero.getObjectByName('RightHand');hand.add(gun);gun.position.set(-.08,.03,0);gun.rotation.set(0,Math.PI/2,Math.PI/2);gun.scale.setScalar(1/hand.getWorldScale(V3()).x);gun.visible=false;
 // אליף: long dark-red coat, dark hair (mannequin based – placeholder body)
 elif=mannequin(ag,0x6a1e2a,{coat:0x2a0c12,hair:0x1a0f0a,skirt:0x4a1420});scene.add(elif);elifAnim=new Animator(elif);elif.position.copy(ELIF_POS);elif.rotation.y=0;elifAnim.mode='idle';
 demir=mannequin(ag,0x22252c,{coat:0x0c0c0e,hair:0x0a0a0a});demir.scale.setScalar(1.08);scene.add(demir);demirAnim=new Animator(demir);demir.position.copy(DEMIR_POS);demir.rotation.y=Math.PI;
 G.demir={hp:100,hostile:false,dead:false,cool:1.5};
 for(const[x,z,r,c]of[[-8,12.6,Math.PI,0x3a4a5a],[-6.8,12.4,-.4,0x5a4636],[84,12.5,Math.PI,0x2e3a2e],[12,-6,1.2,0x4a3a2a],[100,-7,-2,0x3a2e3e]]){const m=mannequin(ag,c,{hair:0x111111});m.position.set(x,.15,z);m.rotation.y=r;scene.add(m);const an=new Animator(m);an.mode=Math.random()<.5?'talk':'idle';extras.push(an);}
}

// ---------- vehicle: black SUV ----------
let vehicle,chassis,carModel,wheelsVis=[];
async function buildCar(){
 const g=await model('assets/models/car/suv-luxury.glb',{length:4.7});carModel=g;scene.add(g);
 g.traverse(o=>{if(o.isMesh&&o.name==='body'){o.material=o.material.clone();o.material.color.set(0x2a2a30);o.material.metalness=.6;o.material.roughness=.25;}});
 const s=g.scale.x;['wheel-front-left','wheel-front-right','wheel-back-left','wheel-back-right'].forEach(n=>{const w=g.getObjectByName(n);w.removeFromParent();const p=new THREE.Group();w.position.set(0,0,0);w.scale.setScalar(s);p.add(w);scene.add(p);wheelsVis.push(p);});
 // headlights (fake) as child sprites
 for(const x of[-.6,.6]){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xfff2d0,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));h.scale.setScalar(1.3/s);h.position.set(x/s,.75/s,2.35/s);g.add(h);
  const t=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xff2020,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));t.scale.setScalar(.7/s);t.position.set(x/s,.85/s,-2.35/s);g.add(t);}
 chassis=new CANNON.Body({mass:1700,angularDamping:.4,linearDamping:.02});chassis.addShape(new CANNON.Box(new CANNON.Vec3(.9,.45,2.25)),new CANNON.Vec3(0,.2,0));
 chassis.position.set(SUV_POS.x,1.3,SUV_POS.z);chassis.quaternion.setFromEuler(0,Math.PI/2,0);
 vehicle=new CANNON.RaycastVehicle({chassisBody:chassis,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
 const wo={radius:.42,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:34,suspensionRestLength:.34,frictionSlip:2.4,dampingRelaxation:2.4,dampingCompression:4.2,maxSuspensionForce:1e6,rollInfluence:.02,axleLocal:new CANNON.Vec3(-1,0,0),chassisConnectionPointLocal:new CANNON.Vec3(),maxSuspensionTravel:.3,customSlidingRotationalSpeed:-30,useCustomSlidingRotationalSpeed:true};
 for(const[x,z]of[[.78,1.42],[-.78,1.42],[.78,-1.42],[-.78,-1.42]]){wo.chassisConnectionPointLocal.set(x,-.05,z);vehicle.addWheel(wo);}
 vehicle.addToWorld(world);for(const w of vehicle.wheelInfos)w.material=wMat;
}
const CAR={steer:0,rpm:0,speed:0};
function carHeading(){const f=V3(0,0,1).applyQuaternion(carModel.quaternion);return Math.atan2(f.x,f.z);}
function updCar(dt){
 const k=G.keys,T=G.touch;let thr=0,st=0;
 if(G.inCar&&G.state==='play'){thr=(k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0);st=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0);
  if(T.stick.active){st=T.stick.x;if(Math.abs(T.stick.y)>.35)thr=-Math.sign(T.stick.y);}
  if(T.gas)thr=1;if(T.brake)thr=-1;}
 const v=chassis.velocity,fwd=new CANNON.Vec3(0,0,1);chassis.quaternion.vmult(fwd,fwd);const sp=v.dot(fwd);CAR.speed=sp;
 // stick/keys right (+) = turn right on screen. cannon steering + = left, hence the minus.
 const maxSteer=lerp(.55,.18,clamp(Math.abs(sp)/30,0,1));CAR.steer=damp(CAR.steer,-st*maxSteer,6,dt);
 vehicle.setSteeringValue(CAR.steer,0);vehicle.setSteeringValue(CAR.steer,1);
 let force=0,brake=0;if(thr>0){force=sp<-1?0:4800*thr*(1-clamp(sp/36,0,1));brake=sp<-1?80:0;}else if(thr<0){force=sp>1?0:-2600;brake=sp>1?90:0;}else brake=G.inCar?6:40;
 for(let i=0;i<4;i++){vehicle.applyEngineForce(i>=2?-force:0,i);vehicle.setBrake(brake,i);}
 const up=new CANNON.Vec3(0,1,0);chassis.quaternion.vmult(up,up);if(up.y<.3){CAR.flip=(CAR.flip||0)+dt;if(CAR.flip>2){const e=new THREE.Euler().setFromQuaternion(chassis.quaternion);chassis.quaternion.setFromEuler(0,e.y,0);chassis.position.y+=1.2;chassis.angularVelocity.set(0,0,0);CAR.flip=0;}}else CAR.flip=0;
 if(chassis.position.z<QUAY.z0+1.5){chassis.position.z=QUAY.z0+1.5;chassis.velocity.z=Math.max(0,chassis.velocity.z);} // quay wall
 CAR.rpm=damp(CAR.rpm,clamp(Math.abs(sp)/25+Math.abs(thr)*.25,0,1.3),4,dt);}
function syncCar(){carModel.position.set(chassis.position.x,chassis.position.y-.68,chassis.position.z);carModel.quaternion.copy(chassis.quaternion);
 for(let i=0;i<4;i++){vehicle.updateWheelTransform(i);const t=vehicle.wheelInfos[i].worldTransform;wheelsVis[i].position.copy(t.position);wheelsVis[i].quaternion.copy(t.quaternion);}}

// ---------- INPUT (GDD direction contract; pure math in controls.js) ----------
G.touch={stick:{active:false,x:0,y:0,id:null},look:{id:null},gas:false,brake:false,btn:{}};
const TT=G.touch;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();G.keys[k]=true;if(G.state!=='play')return;
 if(k==='e')act('enter');if(k==='f')act('punch');if(k===' ')act('jump');if(k==='c')act('crouch');if(k==='shift')G.run=true;if(k==='g')G.aim=true;});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();G.keys[k]=false;if(k==='shift')G.run=false;if(k==='g')G.aim=false;});
const cv=$('c');
cv.addEventListener('mousedown',e=>{if(G.state==='play'&&!isTouch&&document.pointerLockElement!==cv)cv.requestPointerLock?.();});
addEventListener('mousemove',e=>{if(document.pointerLockElement===cv)applyLook(e.movementX,e.movementY,.6);});
function applyLook(dx,dy,scale=1){const d=lookDelta(dx,dy,SET.sens*scale,SET.invY);G.look.yaw+=d.yaw;G.look.pitch=clamp(G.look.pitch+d.pitch,-1.0,.7);G.lookT=G.time;}
// Joystick: pointer-captured, own pointerId
const stick=$('stick'),knob=$('knob');let c0=null;
stick.addEventListener('pointerdown',e=>{if(TT.stick.id!==null)return;e.preventDefault();stick.setPointerCapture?.(e.pointerId);TT.stick.id=e.pointerId;const r=stick.getBoundingClientRect();c0={x:r.left+r.width/2,y:r.top+r.height/2,R:r.width*.4};TT.stick.active=true;moveStick(e);});
function moveStick(e){let dx=(e.clientX-c0.x)/c0.R,dy=(e.clientY-c0.y)/c0.R;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}TT.stick.x=dx;TT.stick.y=dy;knob.style.transform=`translate(${dx*c0.R}px,${dy*c0.R}px)`;}
// Look zone: its own pointerId; drag right = look right, drag up = look up
const lz=$('lookzone');let lp=null;
lz.addEventListener('pointerdown',e=>{if(TT.look.id!==null)return;e.preventDefault();lz.setPointerCapture?.(e.pointerId);TT.look.id=e.pointerId;lp={x:e.clientX,y:e.clientY};});
addEventListener('pointermove',e=>{if(e.pointerId===TT.stick.id)moveStick(e);else if(e.pointerId===TT.look.id){applyLook(e.clientX-lp.x,e.clientY-lp.y);lp={x:e.clientX,y:e.clientY};}});
const pend=e=>{if(e.pointerId===TT.stick.id){TT.stick.id=null;TT.stick.active=false;TT.stick.x=TT.stick.y=0;knob.style.transform='';}if(e.pointerId===TT.look.id)TT.look.id=null;
 for(const[k,id]of Object.entries(TT.btn))if(id===e.pointerId)btnUp(k);};
addEventListener('pointerup',pend);addEventListener('pointercancel',pend);
// Buttons: each owns its own pointerId
function btnDown(k,id,el){TT.btn[k]=id;el?.classList.add('down');if(k==='run')G.run=true;else if(k==='gas')TT.gas=true;else if(k==='brake')TT.brake=true;else if(k==='gun')G.aim=true;else act(k);}
function btnUp(k){delete TT.btn[k];document.querySelector(`[data-k="${k}"]`)?.classList.remove('down');if(k==='run')G.run=false;if(k==='gas')TT.gas=false;if(k==='brake')TT.brake=false;if(k==='gun')G.aim=false;}
for(const b of document.querySelectorAll('#touch [data-k]')){b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();b.setPointerCapture?.(e.pointerId);btnDown(b.dataset.k,e.pointerId,b);});}
if(isTouch)$('touch').classList.remove('hidden');
function act(k){if(G.state!=='play'||G.dead)return;
 if(k==='enter'||k==='exit')toggleCar();else if(k==='punch')punch();else if(k==='jump'){if(!G.air&&!G.inCar){G.air=true;G.jumpV=4.6;heroAnim.oneShot('jumpS',.25,1.4);}}
 else if(k==='crouch'){G.crouch=!G.crouch;document.querySelector('[data-k="crouch"]').classList.toggle('on',G.crouch);}}

// ---------- player ----------
const P={pos:START.clone(),vel:V3(),face:Math.PI/2,speed:0,stepT:0,y:.15};
const ENTER_R=3.0;
function nearCar(){return !G.inCar&&carModel&&Math.hypot(P.pos.x-carModel.position.x,P.pos.z-carModel.position.z)<=ENTER_R;}
function toggleCar(){if(G.dead)return;
 if(G.inCar){if(Math.abs(CAR.speed)>3){hint('האט כדי לצאת');return;}G.inCar=false;document.body.classList.remove('incar');hero.visible=true;
  const side=V3(-2.1,0,0).applyQuaternion(carModel.quaternion);P.pos.copy(carModel.position).add(side);P.pos.y=groundY(P.pos.x,P.pos.z);sfx('door',.8);G.look.yaw=carHeading()+Math.PI;return;}
 if(!nearCar())return;heroAnim.oneShot('interact',.5,1.6);sfx('door',.8);G.state='busy';
 const go=()=>{G.inCar=true;document.body.classList.add('incar');hero.visible=false;G.state='play';G.look.yaw=carHeading()+Math.PI;G.look.pitch=-.15;onEnterCar();};if(REC)go();else setTimeout(go,380);}
let hintT=0;function hint(t,d=2.2){$('hint').textContent=t;hintT=d;}
function updPlayer(dt){
 if(G.dead){heroAnim.update(dt);return;}
 const k=G.keys;let sx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),sy=-((k.w||k.arrowup?1:0)-(k.s||k.arrowdown?1:0));
 if(TT.stick.active){sx=TT.stick.x;sy=TT.stick.y;}
 if(G.state!=='play')sx=sy=0;
 const mv=moveVector(sx,sy,G.look.yaw);const dir=V3(mv.x,0,mv.z);const mag=Math.min(1,dir.length());
 const aiming=G.aim;let target=mag*(G.crouch?1.4:aiming?1.6:G.run?6.4:(mag>.7?3.9:1.6));
 if(G.punchT>0)target*=.3;
 P.speed=damp(P.speed,target,mag>.1?6:10,dt);
 if(mag>.05){dir.normalize();P.vel.lerp(dir.multiplyScalar(P.speed),1-Math.exp(-12*dt));}else P.vel.multiplyScalar(Math.exp(-12*dt));
 const ox=P.pos.x,oz=P.pos.z;P.pos.x+=P.vel.x*dt;P.pos.z+=P.vel.z*dt;
 if(!walkable(P.pos.x,P.pos.z)){if(walkable(ox,P.pos.z))P.pos.x=ox;else if(walkable(P.pos.x,oz))P.pos.z=oz;else{P.pos.x=ox;P.pos.z=oz;}}
 for(const b of solids){if(b.max.y<.3||b.min.y>P.y+1.5)continue;const cx=clamp(P.pos.x,b.min.x,b.max.x),cz=clamp(P.pos.z,b.min.z,b.max.z),dx=P.pos.x-cx,dz=P.pos.z-cz,d=Math.hypot(dx,dz);if(d<.4){if(d>1e-4){P.pos.x=cx+dx/d*.4;P.pos.z=cz+dz/d*.4;}else P.pos.x+=.4;}}
 if(carModel){const cp=carModel.position,inv=carModel.quaternion.clone().invert(),l=P.pos.clone().sub(cp).applyQuaternion(inv);if(Math.abs(l.x)<1.2&&Math.abs(l.z)<2.6){if(Math.abs(l.x)/1.2>Math.abs(l.z)/2.6)l.x=Math.sign(l.x)*1.2;else l.z=Math.sign(l.z)*2.6;P.pos.copy(l.applyQuaternion(carModel.quaternion).add(cp));}}
 for(const o of[elif,demir]){const dx=P.pos.x-o.position.x,dz=P.pos.z-o.position.z,d=Math.hypot(dx,dz);if(d<.7&&d>1e-3){P.pos.x=o.position.x+dx/d*.7;P.pos.z=o.position.z+dz/d*.7;}}
 // vertical: ground + jump
 const gy=groundY(P.pos.x,P.pos.z);if(G.air){G.jumpV-=14*dt;P.y+=G.jumpV*dt;if(P.y<=gy){P.y=gy;G.air=false;G.jumpV=0;heroAnim.oneShot('jumpL',.3,1.6);}}else P.y=damp(P.y,gy,18,dt);
 P.pos.y=P.y;
 const hs=Math.hypot(P.vel.x,P.vel.z);
 if(aiming||G.punchT>0)P.face=angDamp(P.face,G.punchYaw??(G.look.yaw+Math.PI),18,dt);else if(hs>.3)P.face=angDamp(P.face,Math.atan2(P.vel.x,P.vel.z),12,dt);
 if(aiming)P.face=angDamp(P.face,G.look.yaw+Math.PI,18,dt);
 hero.position.copy(P.pos);hero.rotation.y=P.face;
 heroAnim.speed=hs;heroAnim.mode=G.air?'jump':G.crouch?(hs>.4?'crouchF':'crouch'):aiming?(hs>.4?'loco':'aim'):'loco';
 gun.visible=aiming;heroAnim.update(dt);
 if(hs>.6&&!G.air){P.stepT-=dt*hs/(hs>5?2.6:1.7);if(P.stepT<=0){P.stepT=.5;sfx('step',.35,.9+Math.random()*.2);}}
 G.punchT=Math.max(0,(G.punchT||0)-dt);G.fireCool=Math.max(0,(G.fireCool||0)-dt);
 if(aiming&&G.fireCool<=0&&G.flags.gunOK)fire();
}
// ---------- combat (stage E) ----------
function punch(){if(G.inCar||G.punchT>0)return;G.punchT=.45;G.combo=(G.combo||0)+1;heroAnim.oneShot(G.combo%2?'jab':'cross',.5,1.5);sfx('hit',.25,1.4);
 const D=G.demir,dp=demir.position;const d=Math.hypot(dp.x-P.pos.x,dp.z-P.pos.z);if(d<3.5)G.punchYaw=Math.atan2(dp.x-P.pos.x,dp.z-P.pos.z);else G.punchYaw=null;
 if(!D.dead&&G.stage==='E'&&d<1.8){setTimeout(()=>{D.hp-=20;D.hostile=true;demirAnim.oneShot('hit',.5,1.2);sfx('hit',.8,.9);shake=.12;checkDemir();},REC?0:180);}}
let shake=0;
function fire(){G.fireCool=.35;sfx('gun',.9);shake=.1;heroAnim.oneShot('shoot',.3,1.4);const D=G.demir;if(D.dead||G.stage!=='E')return;
 const to=demir.position.clone().sub(camera.position);const f=camera.getWorldDirection(V3());if(to.length()<30&&f.dot(to.normalize())>.97){D.hp-=34;D.hostile=true;demirAnim.oneShot('hit',.5,1.2);checkDemir();}}
function checkDemir(){const D=G.demir;if(D.hp<=0&&!D.dead){D.dead=true;demirAnim.oneShot('death',99);stageF();}}
function updDemir(dt){const D=G.demir;demirAnim.update(dt);if(D.dead||!D.hostile||G.state!=='play'||G.inCar)return;
 const dp=demir.position,d=Math.hypot(P.pos.x-dp.x,P.pos.z-dp.z),ang=Math.atan2(P.pos.x-dp.x,P.pos.z-dp.z);demir.rotation.y=angDamp(demir.rotation.y,ang,8,dt);
 if(d>1.3){dp.x+=Math.sin(ang)*2.6*dt;dp.z+=Math.cos(ang)*2.6*dt;demirAnim.mode='loco';demirAnim.speed=2.6;}else{demirAnim.mode='loco';demirAnim.speed=0;}
 D.cool-=dt;if(d<1.6&&D.cool<=0){D.cool=1.5;demirAnim.oneShot(Math.random()<.5?'jab':'cross',.5,1.3);setTimeout(()=>{if(!D.dead&&Math.hypot(P.pos.x-dp.x,P.pos.z-dp.z)<1.8)damage(G.crouch?4:9);},REC?0:220);}}
function damage(d){if(G.dead)return;G.hp=Math.max(0,G.hp-d);shake=.22;heroAnim.oneShot('hit',.45,1.2);$('hp').firstChild.style.width=G.hp+'%';
 if(G.hp<=0){G.dead=true;heroAnim.oneShot('death',99);fadeMsg('נפלת. חוזר לצ\'קפוינט...',2.4).then(()=>loadCheckpoint(true));}}

// ---------- camera ----------
const camPos=V3(),camLook=V3();let fov=62;
function updCamera(dt){
 if(G.cine){const c=G.cine;c.t+=dt;const u=clamp(c.t/c.dur,0,1),e=u*u*(3-2*u);camera.position.lerpVectors(c.from,c.to,e);camLook.lerpVectors(c.lookA,c.lookB,e);camera.lookAt(camLook);camera.fov=damp(camera.fov,c.fov||45,3,dt);camera.updateProjectionMatrix();return;}
 const {fwd}=camBasis(G.look.yaw);
 if(G.inCar){const hy=carHeading()+Math.PI;if(G.time-(G.lookT||-9)>1.5&&Math.abs(CAR.speed)>2)G.look.yaw=angDamp(G.look.yaw,hy,2.2,dt);
  const pit=G.look.pitch-.05;const back=V3(Math.sin(G.look.yaw)*Math.cos(pit),-Math.sin(pit),Math.cos(G.look.yaw)*Math.cos(pit));
  const pivot=carModel.position.clone();pivot.y+=1.5;const want=pivot.clone().addScaledVector(back,8.5);want.y=Math.max(want.y,.6);
  camPos.lerp(want,1-Math.exp(-8*dt));camera.position.copy(camPos);camLook.copy(pivot).addScaledVector(back,-6);camera.lookAt(camLook);fov=lerp(64,78,clamp(Math.abs(CAR.speed)/30,0,1));}
 else{const aiming=G.aim,dist=aiming?2.4:4.6,side=aiming?.55:.0,h=G.crouch?1.25:1.65,yaw=G.look.yaw,pit=G.look.pitch;
  const back=V3(Math.sin(yaw)*Math.cos(pit),-Math.sin(pit),Math.cos(yaw)*Math.cos(pit));const right=camBasis(yaw).right;
  const pivot=P.pos.clone().setY(P.pos.y+h).addScaledVector(V3(right.x,0,right.z),side);let want=pivot.clone().addScaledVector(back,dist);
  for(const b of solids){if(b.containsPoint(want)){const p=new THREE.Ray(pivot,back).intersectBox(b,V3());if(p)want=p.addScaledVector(back,-.25);}}
  want.y=Math.max(want.y,P.pos.y+.3);
  camPos.lerp(want,1-Math.exp(-(G.snapCam?60:16)*dt));G.snapCam=false;camera.position.copy(camPos);camLook.copy(pivot).addScaledVector(back,-10);camera.lookAt(camLook);fov=aiming?50:64;}
 if(shake>0){shake=Math.max(0,shake-dt);camera.position.x+=(Math.random()-.5)*shake*.4;camera.position.y+=(Math.random()-.5)*shake*.4;}
 camera.fov=damp(camera.fov,fov,8,dt);camera.updateProjectionMatrix();$('cross').classList.toggle('on',G.aim&&!G.inCar&&G.state==='play');}

// ---------- audio mix ----------
function updAudio(dt){const mode=G.stage==='E'&&G.demir.hostile&&!G.demir.dead?'chase':G.stage==='D'?'tension':'calm';
 if(!audioOn)return;for(const k in music)music[k].volume=clamp(damp(music[k].volume,k===mode?(G.talking?.12:.3):0,1.2,dt),0,1);
 amb.rain.volume=.4;amb.city.volume=.2;amb.engine.volume=G.inCar?clamp(.2+CAR.rpm*.45,0,1):0;amb.engine.playbackRate=.7+CAR.rpm*1.1;}

// ---------- dialogue (Hebrew RTL subtitles + verified voice files) ----------
const WHO={elif:'אליף',benjo:"בנג'ו",selim:'סלים',demir:'דמיר'};
let LINES={},DUR={};const waits=[];const wait=s=>new Promise(r=>waits.push({t:G.time+s,r}));let subT=0;
function say(k,phone=false){const[sp,t]=LINES[k];const d=DUR[k]||2.5;$('sub').innerHTML=`<b>${WHO[sp]}${phone?' 📱':''}:</b><bdi>${t}</bdi>`;subT=d+.35;G.talking=true;AUD.log.push({t:G.time,src:'voice/'+k});
 if(audioOn&&!REC){const a=A('voice2/'+k+'.mp3');a.volume=1;a.play().catch(()=>{});}return wait(d+.4).then(()=>{G.talking=false;});}
function shot(from,to,lookA,lookB,dur,fov){G.cine={from:V3(...from),to:V3(...to),lookA:V3(...lookA),lookB:V3(...(lookB||lookA)),dur,t:0,fov};}
function cineOn(){G.state='cine';document.body.classList.add('cine');$('hud').classList.add('hidden');$('touch').classList.add('hidden');$('enter').classList.add('hidden');}
function cineOff(){G.cine=null;G.state='play';document.body.classList.remove('cine');$('hud').classList.remove('hidden');if(isTouch)$('touch').classList.remove('hidden');$('sub').textContent='';G.snapCam=true;}
function phone(text,s=3.2){const p=$('phone');p.querySelector('span').textContent=text;p.classList.remove('hidden');buzz();return wait(s).then(()=>p.classList.add('hidden'));}

// ---------- checkpoints (localStorage only) ----------
const CPKEY='benjo_ist_m01_cp';
function saveCheckpoint(stage){const d={stage,t:Date.now(),car:carModel?[chassis.position.x,chassis.position.z,carHeading()]:null};localStorage.setItem(CPKEY,JSON.stringify(d));const c=$('cp');c.textContent='✔ נשמר צ\'קפוינט';c.classList.add('on');setTimeout(()=>c.classList.remove('on'),2200);}
function getCheckpoint(){try{return JSON.parse(localStorage.getItem(CPKEY));}catch{return null;}}
function placeCar(x,z,h){chassis.position.set(x,1.3,z);chassis.quaternion.setFromEuler(0,h,0);chassis.velocity.set(0,0,0);chassis.angularVelocity.set(0,0,0);}
function loadCheckpoint(afterDeath=false){const cp=getCheckpoint();G.dead=false;G.hp=100;$('hp').firstChild.style.width='100%';heroAnim.one=null;G.inCar=false;document.body.classList.remove('incar');hero.visible=true;
 G.demir={hp:100,hostile:false,dead:false,cool:1.5};demir.position.copy(DEMIR_POS);demir.rotation.y=Math.PI;demirAnim.one=null;
 if(!cp||cp.stage==='A'){if(afterDeath){P.pos.copy(START);stageA(true);}else opening();return;}
 if(cp.stage==='C'){placeCar(SUV_POS.x,SUV_POS.z,Math.PI/2);P.pos.set(ELIF_POS.x,.15,ELIF_POS.z+2.5);G.look.yaw=Math.PI;cineOff();stageC();}
 if(cp.stage==='E'){placeCar(WAREHOUSE.x-14,8,Math.PI/2);P.pos.set(WAREHOUSE.x-10,.12,10);G.look.yaw=Math.PI;cineOff();stageE();}
 G.snapCam=true;}

// ---------- MISSION 01 ----------
const OBJ={A:'הגע לאליף בסוף הרציף',B:'דבר עם אליף',C:'היכנס ל-SUV השחור',D:'סע למחסן בקצה הנמל',E:'התמודד עם השומר',F:'צא מאזור המחסן',done:'משימה 01 הושלמה'};
let goal=null;function setStage(s,g){G.stage=s;goal=g;$('objT').textContent=OBJ[s];G.prog={best:1e9,t:G.time};}
async function opening(){
 cineOn();G.stage='intro';P.pos.copy(START);P.face=Math.PI/2;hero.position.copy(P.pos);
 placeCar(-30,6,Math.PI/2);G.suvIntro=true;          // SUV rolls in and stops
 shot([-60,30,-90],[-40,9,-26],[30,8,40],[-28,1,4],9,46);   // drone over the Bosphorus to the quay
 await wait(5.5);sfx('skid',.25,.8);await wait(3.2);
 shot([-26,1.6,-1],[-27.5,1.7,-2.6],[-34,1.4,-5],[-34,1.5,-5],5,38);G.suvIntro=false;
 await wait(.8);sfx('door',.8);buzz();await phone('אליף מתקשרת...',1.6);
 await say('ph',true);
 await wait(.3);cineOff();stageA();}
function stageA(resume=false){setStage('A',ELIF_POS);G.look.yaw=-Math.PI/2;G.look.pitch=-.12;G.snapCam=true;saveCheckpoint('A');
 if(!resume)(async()=>{hint(isTouch?'ג\'ויסטיק משמאל = הליכה':'WASD = הליכה',3.5);await wait(4);hint(isTouch?'גרור בצד ימין כדי להסתובב':'עכבר = מבט',3.5);await wait(4);hint(isTouch?'החזק "ריצה" כדי לרוץ':'Shift = ריצה',3.5);})();}
async function stageB(){setStage('B',null);cineOn();elifAnim.mode='talk';
 const e=elif.position;elif.rotation.y=Math.atan2(P.pos.x-e.x,P.pos.z-e.z);P.face=Math.atan2(e.x-P.pos.x,e.z-P.pos.z);hero.rotation.y=P.face;heroAnim.speed=0;P.vel.set(0,0,0);
 const mid=P.pos.clone().add(e).multiplyScalar(.5);const side=V3(-(e.z-P.pos.z),0,e.x-P.pos.x).normalize();
 const ov=(sgn,dist)=>mid.clone().addScaledVector(side,sgn*dist).setY(1.65);
 shot(ov(1,4.6).toArray(),ov(1,4.0).toArray(),[e.x,1.35,e.z],[e.x,1.4,e.z],6,36);await say('e1');
 shot(ov(-1,4.4).toArray(),ov(-1,3.9).toArray(),[P.pos.x,1.4,P.pos.z],[P.pos.x,1.45,P.pos.z],5,36);heroAnim.mode='talk';await say('b1');
 shot(ov(1,4).toArray(),ov(1,3.6).toArray(),[e.x,1.35,e.z],[e.x,1.4,e.z],4,34);await say('e2');
 shot(ov(-1,3.8).toArray(),ov(-1,3.5).toArray(),[P.pos.x,1.4,P.pos.z],[P.pos.x,1.45,P.pos.z],5,34);await say('b2');
 heroAnim.mode='loco';elifAnim.mode='idle';saveCheckpoint('C');cineOff();G.look.yaw=Math.PI;stageC();}
function stageC(){setStage('C',SUV_POS);hint('ה-SUV השחור מחכה ליד הרציף',3);}
async function onEnterCar(){if(G.stage==='C'){setStage('D',V3(WAREHOUSE.x,0,8));await say('e3',true);hint(isTouch?'ג\'ויסטיק = הגה · גז / בלם':'W/S גז-בלם · A/D הגה',3.5);
  await wait(9);if(G.stage==='D'){buzz();await phone('סלים מתקשר...',1.4);await say('s1',true);await say('b5');}}}
async function arriveWarehouse(){saveCheckpoint('E');stageE();}
function stageE(){setStage('E',DEMIR_POS);G.flags.gunOK=true;$('wpn').textContent='אגרוף · אקדח';hint(G.inCar?'צא מהרכב וגש לשומר':'גש לשומר בדלת המחסן',3);}
async function demirTalk(){G.flags.dtalk=true;cineOn();const d=demir.position;
 shot([d.x+3,1.8,d.z-5],[d.x+2.5,1.7,d.z-4.4],[d.x,1.6,d.z],[d.x,1.6,d.z],4,38);demirAnim.mode='talk';await say('d1');
 shot([P.pos.x-2,1.8,P.pos.z-2.5],[P.pos.x-1.8,1.7,P.pos.z-2.2],[P.pos.x,1.6,P.pos.z],[P.pos.x,1.6,P.pos.z],4,36);await say('b3');
 shot([d.x+3,1.8,d.z-5],[d.x+2.6,1.7,d.z-4.5],[d.x,1.6,d.z],[d.x,1.6,d.z],4,38);await say('d2');
 demirAnim.mode='loco';G.demir.hostile=true;cineOff();hint(isTouch?'לחץ "אגרוף" · החזק "אקדח" לכיוון וירי':'F = אגרוף · G (החזק) = אקדח',4);}
async function stageF(){await wait(1);await say('b4');setStage('F',EXIT_GOAL);hint('צא מאזור המחסן',3);}
async function finale(){setStage('done',null);buzz();await phone('אליף: הודעה חדשה',1.2);await say('f1',true);localStorage.removeItem(CPKEY);
 await fadeMsg('<div style="font-size:30px;color:#f3c25b">משימה 01 הושלמה</div><div>השיחה מקרקוי</div><div style="font-size:16px;opacity:.75;margin-top:14px">הבא: משימה 02 – מחיר הנאמנות</div>',6);$('objT').textContent='שיטוט חופשי בקרקוי';}
function fadeMsg(html,s){const f=$('fade');f.innerHTML=`<div>${html}</div>`;f.style.opacity=1;return wait(s).then(()=>{f.style.opacity=0;});}

// navigation: goal arrow + distance + re-show after 10 s without progress
function updMission(dt){const me=G.inCar?carModel.position:P.pos;
 if(G.stage==='A'&&P.pos.distanceTo(ELIF_POS)<2.6&&G.state==='play')stageB();
 if(G.stage==='C'&&G.state==='play'){const n=nearCar();$('enter').classList.toggle('hidden',!n||!isTouch);if(n&&!isTouch&&!hintT)$('hint').textContent='E – כניסה לרכב';}else $('enter').classList.add('hidden');
 if(G.stage!=='C'&&nearCar()&&G.state==='play'&&!G.inCar)$('enter').classList.toggle('hidden',!isTouch);
 if(G.stage==='D'&&me.distanceTo(goal)<14&&G.state==='play'){setStage('E',DEMIR_POS);arriveWarehouse();}
 if(G.stage==='E'&&!G.inCar&&!G.flags.dtalk&&G.state==='play'&&P.pos.distanceTo(demir.position)<4.5)demirTalk();
 if(G.stage==='F'&&me.distanceTo(EXIT_GOAL)<6&&G.state==='play')finale();
 if(goal&&G.state==='play'){const d=Math.hypot(goal.x-me.x,goal.z-me.z);$('objD').textContent=`· ${Math.round(d)} מ'`;
  if(d<G.prog.best-1){G.prog.best=d;G.prog.t=G.time;}const stale=G.time-G.prog.t>10;
  if(stale&&!G.prog.shown){G.prog.shown=true;hint('➜ '+OBJ[G.stage],3);}if(!stale)G.prog.shown=false;
  const ang=Math.atan2(goal.x-me.x,goal.z-me.z);const rel=wrapA(ang-(G.look.yaw+Math.PI));const ar=$('arrow');ar.classList.add('on');ar.classList.toggle('blink',stale);ar.style.transform=`translateX(-50%) rotate(${-rel}rad)`;}
 else{$('objD').textContent='';$('arrow').classList.remove('on');}
 $('speed').textContent=G.inCar?`${Math.round(Math.abs(CAR.speed)*3.6)} קמ"ש`:'';}
// mini-map (heading-up)
const mctx=$('map').getContext('2d');
function drawMap(){const c=mctx,W=220,me=G.inCar?carModel.position:P.pos,s=1.3;c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(110,110,108,0,7);c.clip();c.fillStyle='#08101d';c.fillRect(0,0,W,W);
 c.translate(110,110);c.rotate(G.look.yaw);c.scale(s,s);c.translate(-me.x,-me.z);
 c.fillStyle='#0a2340';c.fillRect(-200,-400,600,390);c.fillStyle='#2b2f38';c.fillRect(ROAD.x0,ROAD.z0,ROAD.x1-ROAD.x0,ROAD.z1-ROAD.z0);c.fillStyle='#3a3630';c.fillRect(ROAD.x0,QUAY.z0,ROAD.x1-ROAD.x0,12);
 c.fillStyle='#5a4530';c.fillRect(PIER.x0,PIER.z0,PIER.x1-PIER.x0,PIER.z1-PIER.z0);c.fillStyle='#1c2028';for(const b of solids)if(b.max.y>5)c.fillRect(b.min.x,b.min.z,b.max.x-b.min.x,b.max.z-b.min.z);
 if(goal){c.fillStyle='#f3c25b';c.beginPath();c.arc(goal.x,goal.z,4,0,7);c.fill();}
 if(carModel&&!G.inCar){c.fillStyle='#9cc4ff';c.fillRect(carModel.position.x-1.5,carModel.position.z-1.5,3,3);}
 c.restore();c.fillStyle='#fff';c.beginPath();c.moveTo(110,100);c.lineTo(104,116);c.lineTo(116,116);c.fill();}

// ---------- main loop ----------
let last=performance.now(),mapT=0;
function frame(dt){
 G.time+=dt;for(let i=waits.length-1;i>=0;i--)if(G.time>=waits[i].t){const w=waits.splice(i,1)[0];w.r();}
 if(hintT>0){hintT-=dt;if(hintT<=0){hintT=0;$('hint').textContent='';}}if(subT>0){subT-=dt;if(subT<=0)$('sub').textContent='';}
 if(G.suvIntro){const t=clamp((G.time-(G.suvT??=G.time))/8.5,0,1),e=1-(1-t)*(1-t)*(1-t);placeCar(lerp(-30,SUV_POS.x,e),SUV_POS.z,Math.PI/2);}
 if(!G.inCar)updPlayer(dt);else{P.pos.copy(carModel.position);heroAnim.update(dt);}
 updCar(dt);world.step(1/60,dt,3);syncCar();
 elifAnim.update(dt);if(G.stage!=='B')elif.rotation.y=angDamp(elif.rotation.y,Math.atan2(P.pos.x-elif.position.x,P.pos.z-elif.position.z),2,dt);
 updDemir(dt);for(const e of extras)e.update(dt);
 if(ferry)ferry.position.x=((G.time*3)%400)-150;
 updCamera(dt);updRain(dt);updAudio(dt);updMission(dt);
 if((mapT+=dt)>.1){mapT=0;drawMap();}
 renderer.render(scene,camera);G.fps=lerp(G.fps||60,1/Math.max(dt,1e-3),.05);}
function loop(){const now=performance.now();const dt=Math.min(.05,(now-last)/1000);last=now;if(!REC)frame(dt);requestAnimationFrame(loop);}
window.__step=(n=1,dt=1/30)=>{for(let i=0;i<n;i++)frame(dt);};
window.__dbg={P,CAR,camera,THREE,get car(){return carModel},get chassis(){return chassis},get demir(){return demir},stageB,stageC,stageE,loadCheckpoint,saveCheckpoint,getCheckpoint,act,placeCar,
 project(v){const p=V3(v.x,v.y,v.z).project(camera);return{x:(p.x+1)/2*APP.clientWidth,y:(1-p.y)/2*APP.clientHeight};}};

// ---------- boot ----------
async function boot(){
 const lines=await (await fetch('assets/audio/voice2/lines.json')).json();for(const k in lines)LINES[k]=[lines[k][0],lines[k][1]];
 DUR=await (await fetch('assets/audio/voice2/durations.json')).json();
 await Promise.all([buildWorld(),buildChars(),buildCar()]);
 hero.position.copy(P.pos);camera.position.set(-60,30,-90);camera.lookAt(30,8,40);syncCar();
 $('load').textContent='';$('start').disabled=false;if(getCheckpoint()&&getCheckpoint().stage!=='A')$('cont').classList.remove('hidden');
 G.ready=true;requestAnimationFrame(loop);renderer.render(scene,camera);}
function startAudio(){audioOn=true;for(const m of[...Object.values(music),...Object.values(amb)])m.play().catch(()=>{});}
function goFull(){if(isTouch&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().then(()=>screen.orientation?.lock?.('portrait').catch(()=>{})).catch(()=>{});}
$('start').onclick=()=>{startAudio();$('title').classList.add('hidden');goFull();localStorage.removeItem(CPKEY);opening();};
$('cont').onclick=()=>{startAudio();$('title').classList.add('hidden');goFull();loadCheckpoint();};
G.startGame=()=>{$('title').classList.add('hidden');opening();};G.continueGame=()=>{$('title').classList.add('hidden');loadCheckpoint();};
boot().catch(e=>{$('load').textContent='שגיאה בטעינה: '+e.message;console.error(e);});
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js');
