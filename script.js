// ─── SUPABASE ───
const SB_URL = 'https://eofgwpdvffzngcmahris.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZmd3cGR2ZmZ6bmdjbWFocmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzg5NTgsImV4cCI6MjA5NTk1NDk1OH0.qoMsoLFjEAIEKUl6j6Ml8-7Zper8kNkEu5a9dduq5os';
let sb = null;
try {
  sb = supabase.createClient(SB_URL, SB_KEY);
  console.log('✅ Supabase client ready');
} catch(e) {
  console.error('❌ Supabase init failed:', e);
}

// ─── IndexedDB (photos stored as Blobs + PIN) ───
const DB = {
  _db: null,
  open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open('monthsary_db', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos'))   db.createObjectStore('photos',   { keyPath: 'slot' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'k' });
      };
      req.onsuccess = e => { this._db = e.target.result; res(); };
      req.onerror   = rej;
    });
  },
  get(store, key) {
    return new Promise(res => {
      this._db.transaction(store).objectStore(store).get(key).onsuccess = e => res(e.target.result);
    });
  },
  put(store, data) {
    return new Promise(res => {
      const tx = this._db.transaction(store, 'readwrite');
      tx.objectStore(store).put(data).onsuccess = e => res(e.target.result);
    });
  },
  getAll(store) {
    return new Promise(res => {
      this._db.transaction(store).objectStore(store).getAll().onsuccess = e => res(e.target.result);
    });
  },
};

// ─── Fireworks ───
const fwC = document.getElementById('fw');
const fwX = fwC.getContext('2d');
let fwP = [], fwT = null;
function resizeFw() { fwC.width = innerWidth; fwC.height = innerHeight; }
resizeFw(); addEventListener('resize', resizeFw);

function launchFw(x, y) {
  const cols = ['hsl(335,100%,72%)', 'hsl(350,100%,80%)', 'hsl(315,80%,70%)', '#fff', '#f0d080', '#ffb3ce'];
  for (let i = 0; i < 90; i++) {
    const a = (Math.PI * 2 / 90) * i + Math.random() * .3;
    const spd = 2 + Math.random() * 5.5;
    fwP.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, col: cols[Math.floor(Math.random() * cols.length)], life: 1, dec: .011 + Math.random() * .014, sz: 1.5 + Math.random() * 2.2 });
  }
  if (!fwT) animFw();
}
function animFw() {
  fwX.clearRect(0, 0, fwC.width, fwC.height);
  fwP = fwP.filter(p => p.life > 0);
  fwP.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .07; p.vx *= .98; p.life -= p.dec;
    fwX.save(); fwX.globalAlpha = p.life; fwX.fillStyle = p.col;
    fwX.beginPath(); fwX.arc(p.x, p.y, p.sz, 0, Math.PI * 2); fwX.fill(); fwX.restore();
  });
  fwT = fwP.length > 0 ? requestAnimationFrame(animFw) : null;
}

// ─── PIN ───
let PIN = '6726';
let pv  = '';

async function initApp() {
  await DB.open();
  const stored = await DB.get('settings', 'pin');
  if (stored) PIN = stored.value;
  loadGalleryPhotos();
  loadBouquetImage();
}
initApp();

function pp(d) {
  if (pv.length >= 4) return;
  pv += d;
  document.getElementById('pd' + (pv.length - 1)).classList.add('on');
  if (pv.length === 4) setTimeout(() => pv === PIN ? pinOk() : pinFail(), 180);
}
function pd() {
  if (!pv.length) return;
  pv = pv.slice(0, -1);
  document.getElementById('pd' + pv.length).classList.remove('on');
  document.getElementById('pin-err').classList.remove('show');
}
function pc() {
  pv = '';
  for (let i = 0; i < 4; i++) document.getElementById('pd' + i).classList.remove('on');
  document.getElementById('pin-err').classList.remove('show');
}
function pinFail() {
  document.getElementById('pin-err').classList.add('show');
  const c = document.getElementById('pin-card');
  c.classList.add('shake');
  setTimeout(() => { c.classList.remove('shake'); pc(); }, 500);
}
function pinOk() {
  const s = document.getElementById('pin-screen');
  s.style.transition = 'opacity .8s ease'; s.style.opacity = '0';
  setTimeout(() => { s.classList.remove('active'); startLoading(); }, 800);
}
document.addEventListener('keydown', e => {
  if (!document.getElementById('pin-screen').classList.contains('active')) return;
  if (e.key >= '0' && e.key <= '9') pp(e.key);
  if (e.key === 'Backspace') pd();
  if (e.key === 'Escape') pc();
});

// Falling petals on PIN screen
(function () {
  const c = document.getElementById('pin-petals');
  const em = ['🌸', '🌺', '🌷', '💮', '🩷', '💗'];
  function mk() {
    const el = document.createElement('div');
    el.textContent = em[Math.floor(Math.random() * em.length)];
    el.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:-30px;font-size:${11 + Math.random() * 16}px;opacity:${.3 + Math.random() * .7};pointer-events:none;animation:petalFall ${5 + Math.random() * 9}s linear forwards;`;
    c.appendChild(el); setTimeout(() => el.remove(), 15000);
  }
  for (let i = 0; i < 14; i++) setTimeout(mk, i * 250);
  setInterval(mk, 380);
})();

// ─── Loading (restored from old.html) ───
function startLoading() {
  const ls = document.getElementById('loading-screen');
  ls.classList.add('active'); ls.style.opacity = '0';
  requestAnimationFrame(() => { ls.style.transition = 'opacity .5s ease'; ls.style.opacity = '1'; });

  // Cycling messages
  const msgs = ['Preparing a surprise for you... 🌸','Gathering all my love for you... 💕','Sprinkling some magic... ✨','Almost ready, my love... 🐱'];
  const te = document.getElementById('loading-text'); let mi = 0;
  const msgIv = setInterval(() => {
    mi = (mi + 1) % msgs.length;
    te.style.opacity = '0';
    setTimeout(() => { te.textContent = msgs[mi]; te.style.opacity = '1'; }, 300);
  }, 900);
  setTimeout(() => clearInterval(msgIv), 3600);

  // Percentage counter
  const pctEl = document.getElementById('loading-percent');
  let pct = 0;
  const pctIv = setInterval(() => {
    pct = Math.min(pct + Math.floor(Math.random() * 4) + 1, 99);
    if (pctEl) pctEl.textContent = pct + '%';
  }, 35);
  setTimeout(() => { clearInterval(pctIv); if (pctEl) pctEl.textContent = '100%'; }, 3400);

  // Drifting clouds
  const cloudsEl = document.getElementById('loading-clouds');
  if (cloudsEl) {
    [{w:200,h:100,top:'15%',delay:'0s',dur:'9s',op:.35},{w:280,h:130,top:'55%',delay:'2s',dur:'12s',op:.25},
     {w:160,h:80,top:'35%',delay:'5s',dur:'8s',op:.3},{w:320,h:140,top:'72%',delay:'1s',dur:'14s',op:.2},
     {w:240,h:110,top:'10%',delay:'7s',dur:'11s',op:.28}].forEach(c => {
      const d = document.createElement('div'); d.className = 'loading-cloud';
      d.style.cssText = `width:${c.w}px;height:${c.h}px;top:${c.top};left:-${c.w}px;opacity:${c.op};animation-duration:${c.dur};animation-delay:${c.delay}`;
      cloudsEl.appendChild(d);
    });
  }

  // Floating hearts
  const heartEmojis = ['💗','💕','💖','💓','🩷'];
  for (let h = 0; h < 8; h++) {
    setTimeout(() => {
      const hEl = document.createElement('div'); hEl.className = 'load-heart';
      hEl.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      hEl.style.cssText = `left:${Math.random()*90+5}%;font-size:${12+Math.random()*16}px;animation-duration:${4+Math.random()*4}s;animation-delay:${Math.random()*2}s`;
      ls.appendChild(hEl);
    }, h * 300);
  }

  setTimeout(() => {
    ls.style.transition = 'opacity .7s ease'; ls.style.opacity = '0';
    setTimeout(() => { ls.classList.remove('active'); startDoor(); }, 700);
  }, 4200);
}

// ─── Door Cinematic (rAF-driven zoom from old.html) ───
function startDoor() {
  const ds = document.getElementById('door-screen');
  ds.classList.add('active');

  const door        = document.getElementById('the-door');
  const doorLight   = document.getElementById('door-light');
  const starsEl     = document.getElementById('door-stars');
  const celebration = document.getElementById('door-celebration');
  const bgEl        = document.getElementById('door-bg');

  // Bokeh ambient glows
  const bokehs = [
    {w:180,h:180,top:'10%',left:'5%', color:'rgba(255,133,173,0.25)',dur:'5s',delay:'0s'},
    {w:120,h:120,top:'55%',left:'2%', color:'rgba(255,182,193,0.2)', dur:'6s',delay:'1s'},
    {w:200,h:200,top:'8%', left:'75%',color:'rgba(255,100,150,0.2)', dur:'7s',delay:'0.5s'},
    {w:140,h:140,top:'60%',left:'80%',color:'rgba(255,150,180,0.18)',dur:'5.5s',delay:'2s'},
    {w:90, h:90, top:'30%',left:'42%',color:'rgba(255,220,235,0.12)',dur:'4s',delay:'1.5s'},
    {w:160,h:160,top:'75%',left:'30%',color:'rgba(255,100,130,0.15)',dur:'8s',delay:'0.8s'},
  ];
  bokehs.forEach(b => {
    const el = document.createElement('div'); el.className = 'door-bokeh';
    el.style.cssText = `width:${b.w}px;height:${b.h}px;top:${b.top};left:${b.left};background:${b.color};animation-duration:${b.dur};animation-delay:${b.delay}`;
    if (bgEl) bgEl.appendChild(el);
  });

  // Sparkle stars
  const starPos = [{top:'15%',left:'30%'},{top:'10%',left:'65%'},{top:'35%',left:'12%'},{top:'38%',left:'82%'},
    {top:'65%',left:'22%'},{top:'60%',left:'72%'},{top:'22%',left:'47%'},{top:'72%',left:'50%'},
    {top:'50%',left:'5%'},{top:'48%',left:'90%'},{top:'80%',left:'38%'},{top:'82%',left:'62%'}];
  starPos.forEach((pos, i) => {
    const s = document.createElement('div');
    s.style.cssText = `position:absolute;font-size:${13+Math.random()*16}px;animation:sparkTwinkle ${1.4+Math.random()*1.2}s ease-in-out ${i*0.22}s infinite;z-index:9;left:${pos.left};top:${pos.top}`;
    s.textContent = ['✨','⭐','💫','🌟','🌸','💕'][i % 6];
    if (starsEl) starsEl.appendChild(s);
  });

  // Phase 1: smooth rAF camera zoom (7 seconds)
  startCameraZoom();

  // Phase 2 (3.8s): door swings open
  setTimeout(() => {
    if (door) {
      door.style.transition = 'transform 2.5s cubic-bezier(0.4,0,0.2,1)';
      door.style.transform  = 'perspective(800px) rotateY(-86deg)';
      door.style.transformOrigin = 'left center';
    }
  }, 3800);

  // Phase 3 (5.2s): magical light floods out
  setTimeout(() => {
    if (doorLight) doorLight.style.opacity = '1';
  }, 5200);

  // Phase 4 (6.0s): fireworks burst
  setTimeout(() => {
    for (let i = 0; i < 5; i++) setTimeout(() => launchFw(innerWidth*(.07+Math.random()*.85), innerHeight*(.05+Math.random()*.55)), i*350);
  }, 6000);

  // Phase 5 (7.2s): celebration message + more fireworks
  setTimeout(() => {
    if (celebration) celebration.style.opacity = '1';
    for (let i = 0; i < 4; i++) setTimeout(() => launchFw(innerWidth*Math.random(), innerHeight*.5*Math.random()), i*350);
  }, 7200);

  // Phase 6 (10s): flash → main dashboard
  setTimeout(() => {
    const fl = document.getElementById('door-flash');
    if (fl) {
      fl.style.background = 'linear-gradient(135deg,#fff0f5,#ffd6e7)';
      fl.style.transition = 'opacity 0.6s ease';
      fl.style.opacity = '1';
    }
    setTimeout(() => {
      ds.classList.remove('active');
      showMain();
      if (fl) setTimeout(() => { fl.style.opacity = '0'; }, 150);
    }, 600);
  }, 10000);
}

// Smooth rAF-driven zoom: scale 0.35 → 1.0 over 7 seconds
function startCameraZoom() {
  const scene = document.getElementById('door-scene');
  if (!scene) return;
  let scale = 0.35, opacity = 0.3;
  const start = performance.now();
  const DURATION = 7000;
  function step(now) {
    const t = Math.min((now - start) / DURATION, 1);
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    scale   = 0.35 + 0.65 * ease;
    opacity = 0.3  + 0.7  * ease;
    scene.style.transform = `scale(${scale})`;
    scene.style.opacity   = `${opacity}`;
    if (t < 1) requestAnimationFrame(step);
    else { scene.style.transform = 'scale(1)'; scene.style.opacity = '1'; }
  }
  requestAnimationFrame(step);
}

// ─── Main Screen ───
function showMain() {
  const ms = document.getElementById('main-screen');
  ms.classList.add('active'); ms.style.opacity = '0';
  requestAnimationFrame(() => { ms.style.transition = 'opacity 1s ease'; ms.style.opacity = '1'; });
  calcStats(); spawnBgHearts();
  setTimeout(() => {
    for (let i = 0; i < 8; i++) setTimeout(() => launchFw(innerWidth * (.1 + Math.random() * .8), innerHeight * (.05 + Math.random() * .5)), i * 550);
  }, 600);
  setInterval(() => {
    const ht = document.getElementById('tab-home');
    if (ht.classList.contains('active') && Math.random() < .35) launchFw(innerWidth * (.1 + Math.random() * .8), innerHeight * (.05 + Math.random() * .45));
  }, 3200);
}

function calcStats() {
  // ← Change this to your real start date
  const start = new Date('2026-05-02');
  const days = Math.max(0, Math.floor((Date.now() - start) / 864e5));
  document.getElementById('s-days').textContent = days;
  document.getElementById('s-hours').textContent = (days * 24).toLocaleString();
}

function spawnBgHearts() {
  const em = ['💗', '💕', '💖', '💓', '🩷'];
  function mk() {
    const el = document.createElement('div'); el.className = 'bh';
    el.textContent = em[Math.floor(Math.random() * em.length)];
    el.style.cssText += `left:${Math.random() * 100}vw;bottom:-20px;font-size:${7 + Math.random() * 12}px;opacity:${.4 + Math.random() * .5};animation-duration:${7 + Math.random() * 11}s;`;
    document.getElementById('main-screen').appendChild(el);
    setTimeout(() => el.remove(), 20000);
  }
  setInterval(mk, 1800);
}

// ─── Tabs ───
document.querySelectorAll('.ntab[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.tab;
    document.querySelectorAll('.ntab[data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tpanel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
  });
});

// ─── Edit Mode ───
let editMode = false;

function toggleEditMode() {
  editMode = !editMode;
  const ms   = document.getElementById('main-screen');
  const btn  = document.getElementById('sc-edit-toggle');
  const badge= document.getElementById('edit-badge');
  const hint = document.getElementById('bq-hint');
  const ehint= document.getElementById('bq-edit-hint');

  if (editMode) {
    ms.classList.add('edit-mode');
    btn.classList.add('active');
    btn.textContent = '✓ Edit Mode ON — tap to disable';
    badge.style.display = 'inline-block';
    if (hint)  hint.style.display  = 'none';
    if (ehint) ehint.style.display = 'block';
  } else {
    ms.classList.remove('edit-mode');
    btn.classList.remove('active');
    btn.textContent = 'Enable Edit Mode';
    badge.style.display = 'none';
    if (hint)  hint.style.display  = '';
    if (ehint) ehint.style.display = 'none';
  }
}

// ─── Supabase storage upload ───
async function uploadFileToStorage(file, path) {
  console.log('📤 Uploading to storage:', path);
  const { data, error } = await sb.storage.from('monthsary-photos').upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });
  if (error) {
    console.error('❌ Storage upload error:', error);
    throw new Error(error.message || JSON.stringify(error));
  }
  console.log('✅ Storage upload success:', data);
  const { data: urlData } = sb.storage.from('monthsary-photos').getPublicUrl(path);
  return urlData.publicUrl;
}

// ─── Toast notification ───
function showToast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.className = 'upload-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Gallery — load photos ───
async function loadGalleryPhotos() {
  if (!DB._db) return;

  // Try Supabase first
  if (sb) {
    try {
      const { data } = await sb.from('photos').select('*').order('slot', { ascending: true });
      if (data && data.length) {
        data.forEach(p => { if (p.slot != null) setFramePhoto(p.slot, p.url); });
        return;
      }
    } catch(e) { console.warn('Supabase load failed, using IndexedDB', e); }
  }

  // Fallback: IndexedDB blobs
  const photos = await DB.getAll('photos');
  photos.forEach(p => { if (p.blob) setFramePhoto(p.slot, URL.createObjectURL(p.blob)); });
}

function triggerUpload(slot) {
  if (!editMode) {
    // Normal mode: open lightbox if photo exists
    const img = document.querySelector(`#gi-${slot} img`);
    if (img) openLightbox(img.src);
    return;
  }
  document.getElementById('gf-' + slot).click();
}

async function handleUpload(slot, input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';

  // Immediate local preview
  const localUrl = URL.createObjectURL(file);
  setFramePhoto(slot, localUrl);
  showToast('Uploading...');

  // Save blob to IndexedDB as fallback
  await DB.put('photos', { slot, blob: file });

  // Upload to Supabase
  if (sb) {
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `gallery/slot-${slot}-${Date.now()}.${ext}`;
      const publicUrl = await uploadFileToStorage(file, path);
      // Upsert — needs slot column (run the schema update below)
      await sb.from('photos').upsert(
        { slot, url: publicUrl, caption: `Photo ${slot + 1}` },
        { onConflict: 'slot' }
      );
      setFramePhoto(slot, publicUrl);
      showToast('Photo saved to Supabase ✓');
    } catch(e) {
      console.error('❌ Gallery upload error:', e);
      showToast('Upload failed: ' + (e.message || 'check console'));
    }
  } else {
    console.warn('⚠️ Supabase not connected — saved locally only');
    showToast('Saved locally ✓');
  }
}

function setFramePhoto(slot, url) {
  const inner = document.getElementById('gi-' + slot);
  if (!inner) return;
  const safeUrl = url.replace(/'/g, '%27');
  inner.innerHTML = `<img src="${url}" alt="Photo ${slot + 1}" style="width:100%;height:100%;object-fit:cover;display:block;" onclick="triggerUpload(${slot})">`;
}

function openLightbox(url) {
  document.getElementById('lb-img').src = url;
  document.getElementById('photo-lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('photo-lightbox').classList.remove('open');
}

// ─── Bouquet ───
function bouquetClick() {
  if (editMode) {
    document.getElementById('bouquet-file').click();
  } else {
    openLetter();
  }
}

async function handleBouquetUpload(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';

  // Immediate preview
  const localUrl = URL.createObjectURL(file);
  setBouquetImage(localUrl);
  showToast('Uploading bouquet...');

  // Save blob to IndexedDB
  await DB.put('settings', { k: 'bouquet_blob', blob: file });

  // Upload to Supabase
  if (sb) {
    try {
      const ext  = file.name.split('.').pop() || 'png';
      const path = `bouquet/bouquet-${Date.now()}.${ext}`;
      const publicUrl = await uploadFileToStorage(file, path);
      await DB.put('settings', { k: 'bouquet_url', value: publicUrl });
      setBouquetImage(publicUrl);
      showToast('Bouquet saved to Supabase ✓');
    } catch(e) {
      console.error('❌ Bouquet upload error:', e);
      showToast('Upload failed: ' + (e.message || 'check console'));
    }
  } else {
    showToast('Bouquet saved locally ✓');
  }
}

function setBouquetImage(url) {
  const img = document.getElementById('bouquet-img');
  if (img) img.src = url;
}

async function loadBouquetImage() {
  // Try Supabase settings first
  if (sb) {
    try {
      const { data } = await sb.from('settings').select('value').eq('key', 'bouquet_url').single();
      if (data?.value) { setBouquetImage(data.value); return; }
    } catch(e) {}
  }
  // Fallback: IndexedDB
  const stored = await DB.get('settings', 'bouquet_url');
  if (stored?.value) { setBouquetImage(stored.value); return; }
  const blob = await DB.get('settings', 'bouquet_blob');
  if (blob?.blob) setBouquetImage(URL.createObjectURL(blob.blob));
}

// ─── Bouquet / Love Letter ───
function openLetter() {
  document.getElementById('letter-modal').classList.add('open');
  // Burst of petals
  const em = ['🌸', '💕', '🌺', '🌷', '💮', '✨'];
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.textContent = em[Math.floor(Math.random() * em.length)];
      el.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:${40 + Math.random() * 30}vh;font-size:${12 + Math.random() * 18}px;pointer-events:none;z-index:999;animation:heartRise ${2 + Math.random() * 3}s ease forwards;`;
      document.body.appendChild(el); setTimeout(() => el.remove(), 6000);
    }, i * 55);
  }
}
function closeLetter() {
  document.getElementById('letter-modal').classList.remove('open');
}

// ─── Settings / Change PIN ───
function openSettings() {
  document.getElementById('settings-modal').classList.add('open');
  ['cp-current', 'cp-new', 'cp-confirm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sc-err').textContent = '';
  document.getElementById('sc-ok').textContent  = '';
}
function closeSettings() {
  document.getElementById('settings-modal').classList.remove('open');
}
async function changePin() {
  const curr    = document.getElementById('cp-current').value.trim();
  const newPin  = document.getElementById('cp-new').value.trim();
  const confirm = document.getElementById('cp-confirm').value.trim();
  const err = document.getElementById('sc-err');
  const ok  = document.getElementById('sc-ok');
  err.textContent = ''; ok.textContent = '';

  if (curr !== PIN)             { err.textContent = '💔 Wrong current PIN.'; return; }
  if (!/^\d{4}$/.test(newPin)) { err.textContent = 'New PIN must be exactly 4 digits.'; return; }
  if (newPin !== confirm)       { err.textContent = "Pins don't match."; return; }

  PIN = newPin;
  await DB.put('settings', { k: 'pin', value: PIN });
  ok.textContent = '✓ PIN updated!';
  setTimeout(closeSettings, 1400);
}

// Close all modals with Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLetter(); closeSettings(); closeLightbox(); }
});
