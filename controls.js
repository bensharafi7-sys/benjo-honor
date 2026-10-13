// Direction contract (GDD "חוזה כיוונים – אסור לשנות"). Pure functions, unit-tested by src/dirtest.mjs.
// Camera yaw convention: camera looks along fwd=(-sin yaw, 0, -cos yaw); screen-right = (cos yaw, 0, -sin yaw).
export function camBasis(yaw){return{fwd:{x:-Math.sin(yaw),z:-Math.cos(yaw)},right:{x:Math.cos(yaw),z:-Math.sin(yaw)}};}
// stick x: +1 = right; stick y: +1 = DOWN on screen (pointer coords). Joystick right ⇒ moves to screen-right, no inversion.
export function moveVector(sx,sy,yaw){const{fwd,right}=camBasis(yaw);const f=-sy;return{x:right.x*sx+fwd.x*f,z:right.z*sx+fwd.z*f};}
// finger drag dx>0 (right) ⇒ look right (yaw decreases = clockwise from above); finger up (dy<0) ⇒ look up (pitch increases).
export function lookDelta(dx,dy,sens=1,invertY=false){return{yaw:-dx*0.0055*sens,pitch:(invertY?dy:-dy)*0.004*sens};}
