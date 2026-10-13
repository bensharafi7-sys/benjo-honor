// Automated direction-contract test (GDD): real multi-touch via CDP on the portrait build.
import puppeteer from 'puppeteer-core';
const URL=process.argv[2]||'http://localhost:8947/';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const p=await b.newPage();await p.setViewport({width:360,height:640,isMobile:true,hasTouch:true});p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(URL+'?rec&touch',{waitUntil:'load'});await p.waitForFunction('window.G&&G.ready',{timeout:180000});
const cdp=await p.target().createCDPSession();
const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y,id])=>({x,y,id,radiusX:5,radiusY:5,force:1}))});
const step=n=>p.evaluate(k=>__step(k),n);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rect=s=>p.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},s);
await p.evaluate(()=>{localStorage.setItem('benjo_ist_m01_cp',JSON.stringify({stage:'C'}));G.continueGame();});await step(3);
const st=await rect('#stick');
const heroScr=()=>p.evaluate(()=>{const P=__dbg.P.pos;return __dbg.project({x:P.x,y:P.y+1,z:P.z});});
async function place(yaw){await p.evaluate(y=>{__dbg.P.pos.set(0,.15,-4);__dbg.P.vel.set(0,0,0);G.look.yaw=y;G.look.pitch=-.12;G.snapCam=true;__step(10);},yaw);}
for(const yd of[0,90,180,-90,37,135]){const yaw=yd*Math.PI/180;
 for(const[dir,dx,dy]of[['right',50,0],['left',-50,0],['up',0,-50]]){await place(yaw);const a=await heroScr();const d0=await p.evaluate(()=>__dbg.P.pos.distanceTo(__dbg.camera.position));
  await T('touchStart',[[st.x,st.y,1]]);await T('touchMove',[[st.x+dx,st.y+dy,1]]);await p.evaluate(y=>{G.__y=y},yaw);
  await p.evaluate(()=>{for(let i=0;i<12;i++){G.look.yaw=G.__y;__step(1);}});
  const b2=await heroScr();const d1=await p.evaluate(()=>__dbg.P.pos.distanceTo(__dbg.camera.position));await T('touchEnd',[]);
  // compare in camera space: hero moved relative to camera basis
  const mv=await p.evaluate(()=>{const P=__dbg.P.pos,c=__dbg.camera;const r=new __dbg.THREE.Vector3(1,0,0).applyQuaternion(c.quaternion),f=new __dbg.THREE.Vector3(0,0,-1).applyQuaternion(c.quaternion);return{r:r.dot(__dbg.P.vel),f:f.dot(__dbg.P.vel)};});
  if(dir==='right')ok(mv.r>1&&Math.abs(mv.f)<.5*mv.r,`yaw ${yd}°: stick right -> moves screen-right (vR=${mv.r.toFixed(2)} vF=${mv.f.toFixed(2)})`);
  if(dir==='left')ok(mv.r<-1&&Math.abs(mv.f)<.5*-mv.r,`yaw ${yd}°: stick left -> moves screen-left (vR=${mv.r.toFixed(2)})`);
  if(dir==='up')ok(mv.f>1,`yaw ${yd}°: stick up -> moves forward/away (vF=${mv.f.toFixed(2)})`);}}
// look drag
await place(0.3);const lz=await rect('#lookzone');
let y0=await p.evaluate(()=>G.look.yaw);await T('touchStart',[[lz.x,lz.y,2]]);await T('touchMove',[[lz.x+60,lz.y,2]]);await T('touchEnd',[]);await step(10);
let y1=await p.evaluate(()=>G.look.yaw);
const fw=await p.evaluate(()=>{const f=new __dbg.THREE.Vector3(0,0,-1).applyQuaternion(__dbg.camera.quaternion);return f;});
const cross=-(Math.sin(0.3)); // expected: new forward is rotated clockwise (to the right) of the old forward
const oldF={x:-Math.sin(.3),z:-Math.cos(.3)},oldR={x:Math.cos(.3),z:-Math.sin(.3)};
ok(y1<y0&&(fw.x*oldR.x+fw.z*oldR.z)>0.05,`drag right -> camera looks right (yaw ${y0.toFixed(2)}→${y1.toFixed(2)}, new fwd·oldRight=${(fw.x*oldR.x+fw.z*oldR.z).toFixed(2)})`);
let p0=await p.evaluate(()=>G.look.pitch);await T('touchStart',[[lz.x,lz.y,2]]);await T('touchMove',[[lz.x,lz.y-50,2]]);await T('touchEnd',[]);let p1=await p.evaluate(()=>G.look.pitch);
ok(p1>p0,`drag up -> camera looks up (pitch ${p0.toFixed(2)}→${p1.toFixed(2)})`);
// three fingers: stick + look + run held, each tracked separately
await place(0);const run=await rect('[data-k="run"]');
await T('touchStart',[[st.x,st.y,11]]);await T('touchStart',[[st.x,st.y,11],[run.x,run.y,12]]);await T('touchStart',[[st.x,st.y,11],[run.x,run.y,12],[lz.x,lz.y-120,13]]);
y0=await p.evaluate(()=>G.look.yaw);
await T('touchMove',[[st.x,st.y-50,11],[run.x,run.y,12],[lz.x+40,lz.y-120,13]]);await step(25);
const s3=await p.evaluate(()=>({stick:G.touch.stick.active,sy:G.touch.stick.y,run:G.run,yaw:G.look.yaw,spd:__dbg.P.speed}));
ok(s3.stick&&s3.sy<-.5&&s3.run&&s3.yaw<y0&&s3.spd>4.5,`3 fingers: stick+run+look simultaneously (run=${s3.run}, speed=${s3.spd.toFixed(1)}, yaw moved=${(s3.yaw-y0).toFixed(2)})`);
await T('touchEnd',[[run.x,run.y,12],[lz.x+40,lz.y-120,13]]);await step(2);
const s4=await p.evaluate(()=>({stick:G.touch.stick.active,run:G.run}));ok(s4.stick&&!s4.run,`lifting only stick finger keeps run+look released and stick held (stick=${s4.stick}, run=${s4.run})`);
await T('touchEnd',[]);await step(2);
// enter button 3 m
const vis=async d=>{await p.evaluate(d=>{const c=__dbg.car.position;__dbg.P.pos.set(c.x,.15,c.z-1.2-0.01);const dz=Math.sqrt(Math.max(0,d*d));__dbg.P.pos.set(c.x,.15,c.z-dz);__dbg.P.vel.set(0,0,0);__step(2);},d);return p.evaluate(()=>({v:!document.getElementById('enter').classList.contains('hidden'),d:Math.hypot(__dbg.P.pos.x-__dbg.car.position.x,__dbg.P.pos.z-__dbg.car.position.z)}));};
let r1=await vis(2.6),r2=await vis(3.6),r3=await vis(8);
ok(r1.v&&!r2.v&&!r3.v,`enter button: ${r1.d.toFixed(2)}m=${r1.v}, ${r2.d.toFixed(2)}m=${r2.v}, ${r3.d.toFixed(2)}m=${r3.v}`);
// tap enter, then stick right in car -> turns right (clockwise from above)
await vis(2.6);const en=await rect('#enter');await T('touchStart',[[en.x,en.y,21]]);await T('touchEnd',[]);await step(3);
const gas=await rect('[data-k="gas"]');
const h0=await p.evaluate(()=>{const f=new __dbg.THREE.Vector3(0,0,1).applyQuaternion(__dbg.car.quaternion);return{h:Math.atan2(f.x,f.z),car:G.inCar};});
await T('touchStart',[[gas.x,gas.y,22]]);await T('touchStart',[[gas.x,gas.y,22],[st.x,st.y,23]]);await T('touchMove',[[gas.x,gas.y,22],[st.x+50,st.y,23]]);await step(25);
const h1=await p.evaluate(()=>{const f=new __dbg.THREE.Vector3(0,0,1).applyQuaternion(__dbg.car.quaternion);const c=__dbg.camera;const r=new __dbg.THREE.Vector3(1,0,0).applyQuaternion(c.quaternion);return{h:Math.atan2(f.x,f.z),sp:__dbg.CAR.speed,fr:f.dot(r)};});
await T('touchEnd',[]);
ok(h0.car&&h1.h<h0.h-.05,`in car: gas + stick right -> clockwise turn (heading ${h0.h.toFixed(2)}→${h1.h.toFixed(2)}, speed ${h1.sp.toFixed(1)})`);
console.log(fails?`\n${fails} FAILED`:'\nALL DIRECTION TESTS PASSED');await b.close();process.exit(fails?1:0);
