const CACHE='habits-v3';
const ASSETS=['/routines-app/','/routines-app/index.html','/routines-app/manifest.json','/routines-app/icon-192.png','/routines-app/icon-512.png'];
let alarmTimers=[];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(cached=>{
    if(cached) return cached;
    return fetch(e.request).catch(()=>caches.match('/routines-app/index.html'));
  }));
});

function showAlarmNotif(routineName, tag){
  return self.registration.showNotification('⏰ '+routineName,{
    body:'Your routine is starting now! Tap to open.',
    icon:'/routines-app/icon-192.png',
    badge:'/routines-app/icon-192.png',
    vibrate:[400,100,400,100,400],
    tag:tag||'habits-alarm',
    requireInteraction:true,
    actions:[{action:'open',title:'Open Habits'},{action:'dismiss',title:'Dismiss'}]
  });
}

self.addEventListener('message',e=>{
  const d=e.data; if(!d) return;

  if(d.type==='SHOW_NOTIFICATION'){
    showAlarmNotif(d.title.replace('⏰ ',''),d.tag);
  }

  if(d.type==='SCHEDULE_ALARMS'){
    alarmTimers.forEach(t=>clearTimeout(t));
    alarmTimers=[];
    (d.alarms||[]).forEach(alarm=>{
      const delay=alarm.fireAt-Date.now();
      if(delay>0 && delay<48*3600*1000){
        alarmTimers.push(setTimeout(()=>showAlarmNotif(alarm.routineName),delay));
      }
    });
  }
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  if(e.action==='dismiss') return;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cls=>{
    for(const c of cls){ if(c.url.includes('routines-app')&&'focus' in c) return c.focus(); }
    return clients.openWindow('/routines-app/');
  }));
});
