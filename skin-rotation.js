(()=>{'use strict';const video=document.getElementById('skin-rotation-video'),button=document.getElementById('rotation-toggle'),status=document.getElementById('rotation-status');if(!video)return;const motion=matchMedia('(prefers-reduced-motion: reduce)');let userPaused=false,failed=false;video.muted=true;
function refresh(){if(failed)return;button.disabled=false;button.textContent=video.paused?'Play rotation':'Pause rotation';button.setAttribute('aria-label',video.paused?'Play the 360-degree Outfit rotation':'Pause the 360-degree Outfit rotation');status.textContent=video.paused?'Rotation paused.':'Looping · muted';}
async function start(){try{await video.play();refresh()}catch{refresh();status.textContent='Press Play rotation to view.'}}
button.addEventListener('click',()=>{if(video.paused){userPaused=false;start()}else{userPaused=true;video.pause()}});
video.addEventListener('loadeddata',()=>{refresh();if(!motion.matches&&!userPaused)start();else status.textContent='Press Play rotation to view.'},{once:true});
video.addEventListener('play',refresh);video.addEventListener('pause',refresh);video.addEventListener('error',()=>{failed=true;button.disabled=true;button.textContent='Preview unavailable';status.textContent='Use the Fortnite.GG source link to view.'});
motion.addEventListener('change',()=>{if(motion.matches)video.pause();else if(!userPaused)start()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!userPaused&&!motion.matches)start()});
if(video.readyState>=2){refresh();if(!motion.matches)start()}
})();
