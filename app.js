/* ============ KOTA BINATANG — Live ============
   Pulau 3D (sama dengan video "Awal Mula Kota Binatang") + data warga & kas Koin dari data.json.
   data.json diperbarui otomatis oleh GitHub Actions (scripts/ambil_instagram.py).
   Koin = poin fiktif, BUKAN uang / Rupiah. Desain Joko & Agus serta nama kota masih SEMENTARA. */
'use strict';
const lerp = (a, b, k) => a + (b - a) * k, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {out: k => 1 - Math.pow(1 - k, 3), io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  back: k => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }};
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function kanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const $ = s => document.querySelector(s);

const C = h => new THREE.Color(h).convertSRGBToLinear(), V = (x, y, z) => new THREE.Vector3(x, y, z), DEG = Math.PI / 180;
const HP = matchMedia('(max-width: 820px)').matches;
const REN = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
REN.setPixelRatio(Math.min(devicePixelRatio, HP ? 1.5 : 2)); REN.setSize(innerWidth, innerHeight); REN.domElement.id = 'gl'; document.body.prepend(REN.domElement);
REN.outputEncoding = THREE.sRGBEncoding; REN.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .5, 900);

function tekstur(w, h, lukis, ulang = [1, 1]) { const c = kanvas(w, h), x = c.getContext('2d'); lukis(x, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...ulang); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.kanvas = c; return t; }
const GRAD = (() => { const d = new Uint8Array([150, 150, 150, 215, 215, 215, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const MAT = (w, o = {}) => new THREE.MeshToonMaterial(Object.assign({color: C(w), gradientMap: GRAD}, o));
const BASIC = (w, o = {}) => new THREE.MeshBasicMaterial(Object.assign({color: C(w)}, o));
const TEPI = new THREE.MeshBasicMaterial({color: C('#2B2238'), side: THREE.BackSide});
function garis(m, s = 1.06) { const o = new THREE.Mesh(m.geometry, TEPI); o.scale.setScalar(s); m.add(o); return m; }
function bola(r, mat, x, y, z, sx = 1, sy = 1, sz = 1, induk, tepi = 1.06) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); if (tepi) garis(m, tepi); if (induk) induk.add(m); return m; }
function balok(w, h, d, mat, x, y, z, induk, tepi = 1.04) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  if (tepi) garis(m, tepi); if (induk) induk.add(m); return m; }
function spriteTeks(teks, warna = '#FFD447', ukuran = 220) { return new THREE.Sprite(new THREE.SpriteMaterial({map: tekstur(256, 256, (x) => {
  x.font = `700 ${ukuran}px 'Fredoka', sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.lineWidth = 26; x.strokeStyle = '#2B2238'; x.strokeText(teks, 128, 140); x.fillStyle = warna; x.fillText(teks, 128, 140); }), transparent: true, depthWrite: false})); }

/* langit siang, cahaya */
scene.background = tekstur(16, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5FC4FF'); g.addColorStop(.45, '#A9E3FF'); g.addColorStop(.62, '#E2F6FF'); g.addColorStop(.75, '#FFF1D0'); g.addColorStop(1, '#FFF1D0'); x.fillStyle = g; x.fillRect(0, 0, 16, 256); });
scene.background.wrapS = scene.background.wrapT = THREE.ClampToEdgeWrapping;
scene.fog = new THREE.Fog(C('#DDF4FF'), 140, 620);
const SUNDIR = V(.62, .42, .66).normalize();
const sun = new THREE.DirectionalLight(C('#FFF3DC'), 1.25); sun.position.copy(SUNDIR).multiplyScalar(100);
const hemi = new THREE.HemisphereLight(C('#CDEFFF'), C('#7FD9E6'), .55); scene.add(sun, hemi);
{ const m = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 12), BASIC('#FFF8D6', {fog: false})); m.position.copy(SUNDIR).multiplyScalar(420); scene.add(m); }
const R = rng(5);

/* laut */
const ombak = (x, z, t) => .22 * Math.sin(.34 * x + 1.15 * t) + .16 * Math.sin(.47 * z - .95 * t + 1) + .07 * Math.sin(.9 * (x + z) + 1.8 * t);
const LG = new THREE.PlaneGeometry(700, 700, HP ? 90 : 140, HP ? 90 : 140); LG.rotateX(-Math.PI / 2); LG.translate(0, 0, -80);
const LP = LG.attributes.position, LX = new Float32Array(LP.count), LZ = new Float32Array(LP.count);
for (let i = 0; i < LP.count; i++) { LX[i] = LP.getX(i); LZ[i] = LP.getZ(i); }
const pola = tekstur(512, 512, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const r = rng(11);
  for (let i = 0; i < 70; i++) { const px = r() * w, py = r() * h, L = 30 + r() * 60; x.strokeStyle = 'rgba(215,248,255,.75)'; x.lineWidth = 5 + r() * 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + L / 2, py - 8, px + L, py); x.stroke(); } }, [100, 100]);
const laut = new THREE.Mesh(LG, MAT('#1FB8D4', {map: pola})); scene.add(laut);

/* awan */
const AWAN = [];
for (let i = 0; i < 12; i++) { const g = new THREE.Group(), a = i / 12 * 6.28 + R() * .4, d = 250 + R() * 80;
  const mt = MAT('#FFFFFF', {fog: false, emissive: C('#C8E6FF'), emissiveIntensity: .25});
  for (let j = 0; j < 5; j++) { const s = 8 + R() * 8; const b = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 14), mt); b.position.set((j - 2) * 9 + R() * 3, R() * 3 + (j % 2) * 2, R() * 3); b.scale.y = .8; g.add(b); }
  g.position.set(Math.sin(a) * d, 50 + R() * 40, Math.cos(a) * d - 80); g.lookAt(0, g.position.y, -80); scene.add(g); AWAN.push({g, a, d}); }

/* ===== dari video: pulau ===== */
/* ---------- bahan pulau ---------- */
const pasirTex = tekstur(256, 256, (x, w, h) => { x.fillStyle = '#FFE2A8'; x.fillRect(0, 0, w, h); const r = rng(21);
  for (let i = 0; i < 260; i++) { x.fillStyle = r() < .5 ? 'rgba(240,200,140,.6)' : 'rgba(255,245,215,.7)'; x.beginPath(); x.arc(r() * w, r() * h, 1.5 + r() * 2.5, 0, 7); x.fill(); } }, [14, 14]);
const pasir = MAT('#FFFFFF', {map: pasirTex}), rumput = MAT('#5FD46A'), rumput2 = MAT('#43B85A'), batang = MAT('#B9773F'), daun = MAT('#2FAE4E'), batu = MAT('#A89A8C');
function kelapa(induk, x, y, z, tinggi, condong, rot = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; induk.add(g); let px = 0, py = 0;
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.45 - i * .03, .5 - i * .03, tinggi / 7 + .05, 10), batang); px += condong * i * .08; py += tinggi / 7; s.position.set(px, py, 0); s.rotation.z = -condong * .25; s.castShadow = true; g.add(s); }
  for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), daun); l.scale.set(3.4, .35, 1.1); const a = k / 6 * 6.28;
    l.position.set(px + Math.cos(a) * 2.4, py - .6, Math.sin(a) * 2.4); l.rotation.y = -a; l.rotation.z = -.35; l.castShadow = true; g.add(l); }
  bola(.45, MAT('#7A4A22'), px + .3, py - .5, .3, 1, 1, 1, g, 0); bola(.42, MAT('#7A4A22'), px - .2, py - .6, -.3, 1, 1, 1, g, 0); return g; }

/* PANTAI: PULAU BESAR (adegan 2–12). Pantai depan tetap seperti semula (garis air z≈31 di x=0, tempat tokoh),
   daratan meluas jauh ke belakang (-z): dataran lapang untuk kota, hutan, sungai, air terjun, dan satu gunung. */
const PANTAI = new THREE.Group(); scene.add(PANTAI);
const PB = {cz: -80, ax: 125, az: 111}, GUNUNG = [-12, -118];
function pantaiS(x, z) { const dz = z - PB.cz, q = Math.hypot(x / PB.ax, dz / PB.az), th = Math.atan2(dz, x);   // ± jarak dari garis air (positif = darat)
  const gel = (Math.sin(th * 3 + .5) * .05 + Math.sin(th * 5 + 1.3) * .03 + Math.sin(th * 9) * .015) * clamp((10 - z) / 40, 0, 1);
  return (1 - q * (1 + gel)) * PB.az; }
const _bukitDalam = (x, z) => .5 * (Math.sin(x * .071) + Math.sin(z * .063 + 1) + Math.sin((x + z) * .05 + 2)) + .3 * Math.sin(x * .17 + z * .11);
const _gunung = (x, z) => { const d = Math.hypot(x - GUNUNG[0], z - GUNUNG[1]), a = Math.atan2(z - GUNUNG[1], x - GUNUNG[0]);
  return (34 * Math.exp(-((d / 20) ** 2)) + 10 * Math.exp(-((d / 44) ** 2))) * (1 + .06 * Math.sin(a * 5) * clamp(d / 10, 0, 1)); };
function tinggi(x, z) { const s = pantaiS(x, z), rr = Math.max(0, 30.6 - s) / 45;
  const h0 = -1.65 + 2.25 * Math.sqrt(Math.max(0, 1 - rr * rr));                     // profil pantai lama (sama di depan)
  const naik = 4.2 * (1 - Math.exp(-Math.max(0, s - 20) / 28)), dal = clamp((s - 22) / 30, 0, 1);
  return h0 + naik + Math.max(0, _bukitDalam(x, z)) * 2.4 * dal + _gunung(x, z); }
const tanah = (x, z) => tinggi(x, z);

/* sungai: dari kolam air terjun di kaki gunung, berkelok ke laut di kanan depan */
const SUNGAI = (() => { const c = new THREE.CatmullRomCurve3([[-4.3, -92.5], [2, -76], [14, -56], [27, -34], [38, -12], [45, 7], [50, 22], [55, 38]].map(([x, z]) => V(x, 0, z)));
  const p = c.getSpacedPoints(170).map(v => ({x: v.x, z: v.z})); let m = 1e9;
  p.forEach((q, i) => { m = Math.min(m, tinggi(q.x, q.z) - .6); q.y = m; q.w = 1.7 + 2.3 * i / p.length; }); return p; })();
function dekatSungai(x, z) { let b = 1e9, j = 0; for (let i = 0; i < SUNGAI.length; i++) { const q = SUNGAI[i], d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < b) { b = d; j = i; } } return [Math.sqrt(b), j]; }
const LAHAN = [-30, -40, 36, 27];   /* dataran lapang (calon kota): pusat x,z & jari-jari */
const diLahan = (x, z, m = 1) => Math.hypot((x - LAHAN[0]) / LAHAN[2], (z - LAHAN[1]) / LAHAN[3]) < m;

{ /* daratan (satu permukaan, warna per titik: pasir → rumput → hutan → batu gunung) */
  const G = new THREE.PlaneGeometry(270, 240, HP ? 150 : 200, HP ? 134 : 178); G.rotateX(-Math.PI / 2); G.translate(0, 0, -80);
  const P = G.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
  const PS = C('#FFE2A8'), PS2 = C('#EED39A'), RA = C('#6BD86F'), RB = C('#4CC05E'), HT = C('#3BA956'), BT = C('#A8927E'), BT2 = C('#D9CEC2'), LPG = C('#8FE07A');
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), s = pantaiS(x, z); let h = tinggi(x, z);
    const [ds, j] = s > 8 ? dekatSungai(x, z) : [99, 0], q = SUNGAI[j];
    if (ds < q.w + 3.5) { const k = clamp(1 - (ds - q.w) / 3.5, 0, 1), kk = k * k * (3 - 2 * k); h = Math.min(h, lerp(h, q.y - .55, kk)); }
    P.setY(i, h);
    const g = _gunung(x, z), nz2 = .5 + .5 * Math.sin(x * .13 + Math.sin(z * .09) * 2);
    c.copy(RA).lerp(RB, nz2 * .8);
    if (diLahan(x, z, 1.05)) c.lerp(LPG, .55);
    c.lerp(HT, clamp((g - 6) / 8, 0, 1) * .7);
    c.lerp(BT, clamp((g - 17) / 7, 0, 1)); c.lerp(BT2, clamp((g - 33) / 6, 0, 1));
    if (ds < q.w + 2.2) c.lerp(PS2, clamp(1 - (ds - q.w) / 2.2, 0, 1) * .9);
    c.lerp(PS, clamp((17 - s) / 4, 0, 1));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  G.setAttribute('color', new THREE.BufferAttribute(col, 3)); G.computeVertexNormals();
  const butir = tekstur(256, 256, (x, w, h) => { x.fillStyle = '#F6F6F6'; x.fillRect(0, 0, w, h); const r = rng(21);
    for (let i = 0; i < 260; i++) { x.fillStyle = r() < .5 ? 'rgba(200,190,170,.35)' : 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(r() * w, r() * h, 1.5 + r() * 2.5, 0, 7); x.fill(); } }, [42, 38]);
  const D = new THREE.Mesh(G, MAT('#FFFFFF', {vertexColors: true, map: butir})); D.receiveShadow = true; PANTAI.add(D); }

/* air sungai & air terjun (tekstur mengalir digeser di frame) */
const AIRTEX = tekstur(128, 256, (x, w, h) => { x.fillStyle = '#4ECFEA'; x.fillRect(0, 0, w, h); const r = rng(31);
  for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(225,250,255,.85)'; const px = r() * w, py = r() * h, L = 30 + r() * 60; x.fillRect(px, py, 4 + r() * 5, L); x.fillRect(px, py - h, 4 + r() * 5, L); } }, [1, 1]);
const TERJUNTEX = tekstur(128, 256, (x, w, h) => { x.fillStyle = '#A9EEFF'; x.fillRect(0, 0, w, h); const r = rng(33);
  for (let i = 0; i < 40; i++) { x.fillStyle = r() < .6 ? 'rgba(255,255,255,.95)' : 'rgba(110,210,240,.7)'; const px = r() * w, py = r() * h, L = 40 + r() * 90; x.fillRect(px, py, 5 + r() * 8, L); x.fillRect(px, py - h, 5 + r() * 8, L); } }, [1, 1]);
function pita(titik, lebar, mat, ulangV) { /* pita mengikuti daftar titik {x,y,z}; v = panjang */
  const n = titik.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let L = 0;
  for (let i = 0; i < n; i++) { const a = titik[Math.max(0, i - 1)], b = titik[Math.min(n - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, m = Math.hypot(dx, dz) || 1, px = -dz / m, pz = dx / m, w = lebar(i) / 2;
    if (i) L += Math.hypot(titik[i].x - titik[i - 1].x, titik[i].y - titik[i - 1].y, titik[i].z - titik[i - 1].z);
    pos.set([titik[i].x + px * w, titik[i].y, titik[i].z + pz * w, titik[i].x - px * w, titik[i].y, titik[i].z - pz * w], i * 6);
    uv.set([0, L / ulangV, 1, L / ulangV], i * 4); if (i) idx.push((i - 1) * 2, i * 2, (i - 1) * 2 + 1, i * 2, i * 2 + 1, (i - 1) * 2 + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; PANTAI.add(m); return m; }
pita(SUNGAI.map(q => ({x: q.x, y: q.y + .05, z: q.z})), i => SUNGAI[i].w * 2, MAT('#FFFFFF', {map: AIRTEX, side: THREE.DoubleSide}), 14);
const TERJUN = (() => { const dx = .305, dz = .952, t = []; for (let k = 0; k <= 30; k++) { const d = 6.5 + k * .55, x = GUNUNG[0] + dx * d, z = GUNUNG[1] + dz * d;
    t.push({x: x + dx * 1.1, y: tinggi(x, z) + .5, z: z + dz * 1.1}); } return t; })();
pita(TERJUN, i => 2.6 + i * .06, BASIC('#FFFFFF', {map: TERJUNTEX, side: THREE.DoubleSide}), 10);
{ const ujung = TERJUN[TERJUN.length - 1]; const kolam = new THREE.Mesh(new THREE.CircleGeometry(4.6, 32), MAT('#5FD8F0')); kolam.rotation.x = -Math.PI / 2;
  kolam.position.set(SUNGAI[0].x, SUNGAI[0].y + .08, SUNGAI[0].z); PANTAI.add(kolam);
  /* batu-batu di tepi kolam */
  const r = rng(41); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, x = SUNGAI[0].x + Math.cos(a) * 5, z = SUNGAI[0].z + Math.sin(a) * 5;
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(.9 + r() * .9, 0), batu); b.position.set(x, tinggi(x, z), z); garis(b, 1.08); PANTAI.add(b); } }
const BUIH = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), BASIC('#FFFFFF', {transparent: true, opacity: .85})); PANTAI.add(m); BUIH.push(m); }

/* hutan: pohon bulat (instanced, dengan garis tepi), sebagian berbuah = sumber makanan */
const HUTAN = (() => { const r = rng(77), daftar = [];
  for (let i = 0; i < 30000 && daftar.length < 1500; i++) { const x = -128 + r() * 256, z = -196 + r() * 222, s = pantaiS(x, z);
    if (s < 34 || Math.hypot(x, z - 22) < 50) continue;
    const dg = Math.hypot(x - GUNUNG[0], z - GUNUNG[1]), gg = _gunung(x, z); if (gg > 13 || (gg > 8 && r() < .6)) continue;
    if (diLahan(x, z)) continue;
    const lebat = .3 + .5 * Math.sin(x * .045 + 1.3) * Math.sin(z * .05 + .4) + (dg < 52 ? .35 : 0) + (s > 70 ? .2 : 0);
    if (r() > lebat) continue;
    const [ds, j] = dekatSungai(x, z); if (ds < SUNGAI[j].w + 2.5) continue;
    daftar.push([x, tinggi(x, z) - .2, z, 1.5 + r() * 1.5, r(), r()]); }
  const n = daftar.length, gD = new THREE.IcosahedronGeometry(1, 2), gB = new THREE.CylinderGeometry(.2, .3, 1, 7); gB.translate(0, .5, 0);
  const mD = new THREE.InstancedMesh(gD, MAT('#FFFFFF'), n), mT = new THREE.InstancedMesh(gD, TEPI, n), mB = new THREE.InstancedMesh(gB, batang, n);
  const ijo = ['#3FBF5A', '#2FAE4E', '#58CC63', '#27A047', '#6AD46A'].map(C), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(1, 1, 1), Pp = V(0, 0, 0);
  const buah = []; const mBuah = new THREE.InstancedMesh(new THREE.SphereGeometry(.32, 12, 8), MAT('#FFFFFF'), n * 3);
  daftar.forEach(([x, y, z, k, a, b], i) => { const tb = 1.6 * k;
    Pp.set(x, y, z); S.set(k, tb, k); M4.compose(Pp, Q, S); mB.setMatrixAt(i, M4);
    Pp.set(x, y + tb + k * .9, z); S.set(k * 1.5, k * 1.3, k * 1.5); M4.compose(Pp, Q, S); mD.setMatrixAt(i, M4);
    S.multiplyScalar(1.07); M4.compose(Pp, Q, S); mT.setMatrixAt(i, M4); mD.setColorAt(i, ijo[Math.floor(a * 5)]);
    if (b < .16) for (let f = 0; f < 3; f++) { const ang = f * 2.1 + a * 6; buah.push([x + Math.cos(ang) * k * 1.35, y + tb + k * (.7 + f * .25), z + Math.sin(ang) * k * 1.35, f]); } });
  const wb = ['#FF7A45', '#FF4D6A', '#FFC23D'].map(C);
  buah.forEach(([x, y, z, f], i) => { Pp.set(x, y, z); S.set(1.4, 1.4, 1.4); M4.compose(Pp, Q, S); mBuah.setMatrixAt(i, M4); mBuah.setColorAt(i, wb[f]); });
  mBuah.count = buah.length;
  [mD, mT, mB, mBuah].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; PANTAI.add(m); });
  return {n, buah: buah.length}; })();

/* bebatuan besar di kaki gunung (sumber batu) + awan kecil di puncak */
{ const r = rng(53); for (let i = 0; i < 26; i++) { const a = -1 + r() * 4.2, d = 17 + r() * 14, x = GUNUNG[0] + Math.cos(a) * d, z = GUNUNG[1] + Math.sin(a) * d;
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + r() * 1.8, 0), batu); b.position.set(x, tinggi(x, z) + .2, z); b.rotation.set(r() * 3, r() * 3, 0); garis(b, 1.06); PANTAI.add(b); }
  const mt = MAT('#FFFFFF', {emissive: C('#C8E6FF'), emissiveIntensity: .25});
  for (const [ox, oy, oz, s] of [[-9, 47, 4, 1], [8, 44, -3, .8]]) { const g = new THREE.Group(); g.position.set(GUNUNG[0] + ox, oy, GUNUNG[1] + oz); g.scale.setScalar(s);
    for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(2.6 + r() * 1.6, 20, 14), mt); b.position.set((j - 1.5) * 3.2, (j % 2) * 1, r() * 1.5); b.scale.y = .75; g.add(b); }
    PANTAI.add(g); } }

/* isi pantai depan (seperti semula) */
{ const bukit = [[0, -2, 17, .32, rumput], [-11, 4, 9, .45, rumput2], [12, 2, 10, .4, rumput], [-3, -14, 12, .55, rumput2], [8, -10, 8, .7, rumput]];
  bukit.forEach(([x, z, r, s, m]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), m); b.scale.y = s; b.position.set(x, tanah(x, z) - r * s * .35, z); b.receiveShadow = b.castShadow = true; PANTAI.add(b); });
  const pk = [[-4.4, 23.6, 9, .9, .4], [6.5, 21, 10, -.7, 2], [-9, 18, 11, 1, 1], [11, 14, 9, -.8, 3], [-14, 10, 10, .7, 4], [3, 15, 12, .5, 5], [-6, 8, 9, -.6, 1], [15, 3, 11, -1, 2], [-18, -2, 10, .9, 0], [5, 3, 9, .6, 3],
    [-24, 12, 10, .8, 1], [22, 12, 11, -.8, 4], [30, 4, 9, -.6, 2], [-30, 2, 11, .7, 5]];
  pk.forEach(([x, z, h, c, r]) => kelapa(PANTAI, x, tanah(x, z) - .1, z, h, c, r));
  for (let i = 0; i < 16; i++) { const a = R() * 6.28, d = 26 + R() * 4; const bt = new THREE.Mesh(new THREE.DodecahedronGeometry(.4 + R() * .7, 0), batu);
    bt.position.set(Math.cos(a) * d, tanah(Math.cos(a) * d, Math.sin(a) * d) + .1, Math.sin(a) * d); bt.castShadow = true; PANTAI.add(bt); }
  for (let i = 0; i < 10; i++) { const x = -10 + R() * 20, z = 18 + R() * 7; const kr = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 5), MAT(R() < .5 ? '#FF9AA2' : '#FFFFFF')); kr.position.set(x, tanah(x, z) + .1, z); kr.rotation.z = 1.4; PANTAI.add(kr); } }
const kakiAir = 30.6;
function airMengalir(t) { AIRTEX.offset.y = -t * .35; TERJUNTEX.offset.y = -t * 1.1;
  const u = TERJUN[TERJUN.length - 1]; BUIH.forEach((m, i) => { const p = (t * .6 + i / 7) % 1, a = i * 2.3;
    m.position.set(u.x + Math.cos(a) * (1 + p * 2.2), u.y - .3 + p * 2.2, u.z + Math.sin(a) * (1 + p * 2.2) * .6); m.scale.setScalar(.9 + p * 1.4); m.material.opacity = (1 - p) * .85; }); }


/* ===== dari video: tokoh ===== */
/* ---------- TOKOH: rangka umum ---------- */
const HITAM = MAT('#1E1A2A'), PUTIH = BASIC('#FFFFFF'), PINK = MAT('#FF8FA3');
function wajah(kep, o) { /* mata, kilap, pipi, mulut */
  const r = {mata: [], kilap: []};
  for (const s of [-1, 1]) { r.mata.push(bola(o.rm, HITAM, s * o.mx, o.my, o.mz, 1, 1.3, .55, kep, 0));
    const k = new THREE.Mesh(new THREE.SphereGeometry(o.rm * .36, 12, 8), PUTIH); k.position.set(s * o.mx + o.rm * .35, o.my + o.rm * .6, o.mz + .09); kep.add(k); r.kilap.push(k);
    const k2 = new THREE.Mesh(new THREE.SphereGeometry(o.rm * .18, 10, 8), PUTIH); k2.position.set(s * o.mx - o.rm * .3, o.my - o.rm * .4, o.mz + .09); kep.add(k2); r.kilap.push(k2);
    const pipi = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 10), BASIC('#FF7E9A', {transparent: true, opacity: .55})); pipi.scale.set(1.2, .6, .3); pipi.position.set(s * o.px, o.py, o.pz); kep.add(pipi); }
  r.mulut = bola(.11, MAT('#C2405C'), 0, o.muy, o.muz, 1.2, .2, .6, kep, 0); return r; }
function lengan(induk, s, x, y, z, L, matA, matT) { const g = new THREE.Group(); g.position.set(s * x, y, z); induk.add(g);
  bola(.15, matA, 0, -L * .45, 0, 1, L * 2.6, 1, g, 1.08); const tg = new THREE.Group(); tg.position.y = -L; g.add(tg); bola(.2, matT, 0, 0, 0, 1, .85, 1.05, tg); g.ujung = tg; return g; }

function buatJoko() { const BULU = MAT('#FF8A2A'), KREM = MAT('#FFE9C9');
  const root = new THREE.Group(), J = new THREE.Group(); root.add(J);
  bola(.82, BULU, 0, .55, 0, 1, 1.05, .9, J); bola(.55, KREM, 0, .62, .42, 1, 1.1, .6, J, 0);
  const kaki = [-1, 1].map(s => bola(.2, KREM, s * .36, -.22, .12, 1, .7, 1.3, J));
  const kep = new THREE.Group(); kep.position.y = 1.25; J.add(kep);
  bola(.9, BULU, 0, .55, 0, 1.1, .92, 1, kep);
  for (const x of [-.22, 0, .22]) { const l = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 8), MAT('#D9601A')); l.scale.set(.8, 2.4, .6); l.position.set(x, 1.12, .62 - Math.abs(x) * .4); l.rotation.x = -.6; kep.add(l); }
  bola(.26, KREM, -.16, .3, .74, 1, .8, .8, kep, 0); bola(.26, KREM, .16, .3, .74, 1, .8, .8, kep, 0); bola(.09, PINK, 0, .45, .95, 1.3, .9, .9, kep, 0);
  const wj = wajah(kep, {rm: .17, mx: .36, my: .62, mz: .78, px: .62, py: .32, pz: .62, muy: .2, muz: .86});
  for (const s of [-1, 1]) for (const [dy, rz] of [[.06, .12], [-.04, -.05]]) { const k3 = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .55, 6), HITAM); k3.rotation.z = Math.PI / 2 + s * rz; k3.position.set(s * .55, .34 + dy, .78); kep.add(k3); }
  const telinga = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .58, 1.0, -.05); kep.add(p);
    const e = new THREE.Mesh(new THREE.ConeGeometry(.32, .62, 4), BULU); e.position.y = .26; e.rotation.y = Math.PI / 4; garis(e, 1.08); p.add(e);
    const ei = new THREE.Mesh(new THREE.ConeGeometry(.18, .38, 4), PINK); ei.position.set(0, .2, .1); ei.rotation.y = Math.PI / 4; p.add(ei); return [p, s]; });
  const topi = new THREE.Group(); topi.position.set(0, 1.28, -.08); topi.rotation.z = -.12; kep.add(topi);
  { const TP = MAT('#34407A'); const b = new THREE.Mesh(new THREE.CylinderGeometry(.56, .56, .07, 40), TP); garis(b, 1.05); topi.add(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.34, .38, .46, 32), TP); c.position.y = .25; garis(c, 1.06); topi.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.39, .39, .11, 32), MAT('#FFD447')); band.position.y = .1; topi.add(band); }
  const lg = [-1, 1].map(s => lengan(J, s, .6, .95, .25, .52, BULU, KREM));
  const ekor = []; { let ind = J, pos = V(0, .4, -.75); for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.copy(pos); ind.add(g); bola(.17 - i * .012, i === 5 ? KREM : BULU, 0, .2, 0, 1, 1.4, 1, g, 1.1); ekor.push(g); ind = g; pos = V(0, .34, i < 3 ? -.06 : .05); } }
  const seru = spriteTeks('!'); seru.position.set(0, 2.35, 0); kep.add(seru); seru.visible = false;
  return Object.assign({root, J, kep, kaki, telinga, topi, lg, ekor, seru, alas: .42, kepY: 1.25}, wj); }

function buatAgus() { const BULU = MAT('#8B5A3C'), MUKA = MAT('#F6D2A8'), MUKA2 = MAT('#FBE3C4');
  const root = new THREE.Group(), J = new THREE.Group(); root.add(J);
  bola(.68, BULU, 0, .5, 0, 1, 1.08, .9, J); bola(.45, MUKA, 0, .5, .36, 1, 1.15, .6, J, 0);
  const kaki = [-1, 1].map(s => bola(.19, MUKA, s * .3, -.18, .14, 1, .7, 1.35, J));
  const kep = new THREE.Group(); kep.position.y = 1.08; J.add(kep);
  bola(.74, BULU, 0, .5, 0, 1.05, .95, .95, kep);
  for (const [x, y] of [[-.12, 1.2], [.05, 1.24], [.2, 1.18]]) bola(.13, BULU, x, y, .1, 1, 1.3, 1, kep, 1.1);
  bola(.5, MUKA, 0, .45, .4, 1.15, .95, .6, kep, 0); bola(.3, MUKA2, 0, .24, .66, 1.25, .8, .7, kep, 0);
  for (const s of [-1, 1]) bola(.035, HITAM, s * .07, .33, .9, 1, 1, 1, kep, 0);
  const wj = wajah(kep, {rm: .13, mx: .2, my: .57, mz: .72, px: .42, py: .34, pz: .62, muy: .14, muz: .8});
  /* kacamata bulat (tanda "pintar") */
  const KM = MAT('#3A2A4A'); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.17, .028, 8, 28), KM); r.position.set(s * .2, .57, .8); kep.add(r); }
  { const br = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .12, 6), KM); br.rotation.z = Math.PI / 2; br.position.set(0, .6, .82); kep.add(br); }
  const telinga = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .74, .55, 0); kep.add(p); bola(.27, BULU, 0, 0, 0, .6, 1, 1, p); bola(.17, MUKA, s * .08, 0, .02, .5, 1, 1, p, 0); return [p, s]; });
  const lg = [-1, 1].map(s => lengan(J, s, .52, .85, .2, .68, BULU, MUKA));
  const ekor = []; { let ind = J, pos = V(0, .2, -.6); for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.position.copy(pos); ind.add(g); bola(.1, BULU, 0, .14, 0, 1, 1.6, 1, g, 1.12); ekor.push(g); ind = g; pos = V(0, .28, 0); } }
  const tongkat = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 1.3, 6), MAT('#9A6B3A')); tongkat.position.set(0, -.5, .1); tongkat.rotation.x = .3; lg[1].ujung.add(tongkat); tongkat.visible = false;
  const seru = spriteTeks('!'); seru.position.set(0, 1.8, 0); kep.add(seru); seru.visible = false;
  return Object.assign({root, J, kep, kaki, telinga, lg, ekor, tongkat, seru, alas: .37, kepY: 1.08, monyet: true}, wj); }

const JOKO = buatJoko(), AGUS = buatAgus(); scene.add(AGUS.root);

/* pose: semua dihitung dari parameter (bukan disimpan antar frame) */
function pose(r, o) {
  const t = o.t;
  r.root.position.set(o.x, o.y, o.z); r.root.rotation.set(o.rx || 0, o.yaw || 0, o.rz || 0);
  const lompat = o.lompat || 0, duduk = o.duduk || 0;
  r.J.position.y = lompat - duduk * .28; r.J.scale.set(1 + (o.pejet || 0) * .12, 1 - (o.pejet || 0) * .14, 1 + (o.pejet || 0) * .12);
  r.kaki.forEach((k, i) => { k.position.z = .12 + duduk * .45 + (o.jalan ? Math.sin(t * 14 + i * 3.14) * .14 : 0); k.position.y = -.22 + duduk * .18 + (o.jalan ? Math.max(0, Math.sin(t * 14 + i * 3.14)) * .1 : 0); });
  r.kep.rotation.set(o.kx || 0, o.ky || 0, (o.kz || 0) + Math.sin(t * 1.3 + (r.monyet ? 2 : 0)) * .04);
  const sd = o.sedih || 0, kg = o.kaget || 0;
  r.telinga.forEach(([p, s]) => { if (r.monyet) { p.rotation.z = -s * sd * .5; p.rotation.y = s * kg * .3; } else { p.rotation.z = -s * (.18 + sd * .9 - kg * .15) + Math.sin(t * 3 + s) * .03; p.rotation.x = sd * .3; } });
  const kd = a => 1 - Math.max(0, 1 - Math.abs(((t + (r.monyet ? 1.3 : 0)) % 3.7) - a) / .09);
  const buka = (o.tidur ? .06 : kd(1.6)) * lerp(1, .55, sd) * (1 + kg * .25) * (o.senyumMata ? .45 : 1);
  r.mata.forEach(m => m.scale.y = 1.3 * Math.max(.06, buka)); r.kilap.forEach(k => k.visible = buka > .3);
  const sn = o.senang || 0, bc = o.bicara || 0;
  r.mulut.scale.set(1.2 + sn * .3, .2 + kg + sn * .7 * (.7 + .3 * Math.sin(t * 6)) + bc * Math.abs(Math.sin(t * 11)) * .6, .6);
  r.ekor.forEach((g, i) => { g.rotation.z = Math.sin(t * (2.2 + sn * 4) - i * .5) * (.12 + sn * .2) * (1 - sd * .8); g.rotation.x = r.monyet ? -.32 + (i > 5 ? .35 : 0) : -.18 - sd * .25 + (i > 3 ? .15 : 0); });
  const la = o.la || [[0, 0], [0, 0]];
  r.lg.forEach((g, i) => { const s = i ? 1 : -1; g.rotation.set(la[i][0], 0, s * (.12 + la[i][1])); });
  if (r.seru) { const a = o.seru; r.seru.visible = a != null && t > a && t < a + 1.4; const k = E.back(seg(t, a, a + .3)) * .9; r.seru.scale.set(k, k, 1); r.seru.material.opacity = 1 - seg(t, a + 1, a + 1.4); }
}
const lambai = (t, k, s = 1) => [-.2 * k, k * (2.5 + Math.sin(t * 9) * .35)];
function taruh(r, x, z, dy = 0) { return [x, tanah(x, z) + r.alas + dy, z]; }


/* ================= KOTA: alun-alun, rumah, warga ================= */
scene.add(JOKO.root);
const PUSAT = [LAHAN[0], LAHAN[1]];
const SKALA_TOKOH = 1.8;

/* alun-alun + papan nama kota (nama BELUM DITENTUKAN) */
{ const ax = PUSAT[0], az = PUSAT[1], y = tinggi(ax, az);
  const lantai = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.8, .5, 40), MAT('#F3E2B8')); lantai.position.set(ax, y + .05, az); garis(lantai, 1.02); scene.add(lantai);
  const PAPAN = new THREE.Group(); PAPAN.position.set(ax, y + .3, az - 3.5); PAPAN.scale.setScalar(1.6); scene.add(PAPAN);
  const tx = tekstur(512, 256, (x, w, h) => { x.fillStyle = '#E8B878'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#DDAA68' : '#ECC088'; x.fillRect(0, i * 64 + 3, w, 58); }
    x.font = "700 130px 'Fredoka', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#5A3418'; x.fillText('Kota ???', w / 2, h / 2 + 8); });
  for (const s of [-1, 1]) balok(.22, 3.2, .22, MAT('#B87A42'), s * 1.5, 1.6, 0, PAPAN);
  balok(3.6, 1.8, .2, MAT('#FFFFFF', {map: tx}), 0, 2.6, .05, PAPAN, 1.03); }

/* tempat rumah: petak di dataran, tumbuh dari alun-alun ke luar, tidak menabrak sungai */
const PETAK = (() => { const p = [], r = rng(91);
  for (let gx = -45; gx <= 45; gx += 7.4) for (let gz = -35; gz <= 35; gz += 7.4) {
    const x = PUSAT[0] + gx + (r() - .5) * 2, z = PUSAT[1] + gz + (r() - .5) * 2, d = Math.hypot(x - PUSAT[0], z - PUSAT[1]);
    if (d < 11 || !diLahan(x, z, .97)) continue; const [ds, j] = dekatSungai(x, z); if (ds < SUNGAI[j].w + 4) continue;
    p.push({x, z, d, yaw: Math.atan2(PUSAT[0] - x, PUSAT[1] - z) + (r() - .5) * .3, i: p.length}); }
  return p.sort((a, b) => a.d - b.d); })();
const WARNA_RUMAH = ['#FF9AA2', '#FFD447', '#9AD0FF', '#B5EAD7', '#C7A6FF', '#FFB27A'], ATAP = ['#E5484D', '#3C6CD6', '#7A4ABF', '#E8742A'];
const MAT_RUMAH = WARNA_RUMAH.map(w => MAT(w)), MAT_ATAP = ATAP.map(w => MAT(w)), PINTU = MAT('#6B4A2E'), JENDELA = MAT('#FFF4C2');
function buatRumah(i) { const g = new THREE.Group(), h = .75 + (i % 3) * .25, lebar = 1 + (i % 2) * .3;
  balok(lebar, h, .9, MAT_RUMAH[i % 6], 0, h / 2, 0, g, 1.05);
  const at = new THREE.Mesh(new THREE.ConeGeometry(.82 * lebar, .6, 4), MAT_ATAP[i % 4]); at.position.y = h + .3; at.rotation.y = Math.PI / 4; at.scale.z = .9 / lebar; garis(at, 1.06); g.add(at);
  balok(.26, .4, .05, PINTU, 0, .2, .46, g, 0); balok(.22, .22, .05, JENDELA, .3 * lebar, h * .65, .46, g, 0); balok(.22, .22, .05, JENDELA, -.3 * lebar, h * .65, .46, g, 0);
  g.scale.setScalar(3.2); return g; }
const RUMAH = [];   // {g, lahir}

/* warga binatang acak: 1 follower = 1 warga; jenis ditentukan dari nomor warga (selalu sama) */
const JENIS = [
  {n: 'Kelinci', w: '#F4F0FA', t: 'panjang', a: '#FFB3C7'}, {n: 'Beruang', w: '#A0704A', t: 'bulat', a: '#D9B38C'}, {n: 'Panda', w: '#FFFFFF', t: 'bulat', a: '#2B2238', hitam: 1},
  {n: 'Rubah', w: '#FF8F4A', t: 'runcing', a: '#FFF1E0'}, {n: 'Babi', w: '#FFB3C1', t: 'kecil', a: '#FF8FA3', moncong: 1}, {n: 'Bebek', w: '#FFE14D', t: 'none', a: '#FF9A3C', paruh: 1},
  {n: 'Katak', w: '#7ED957', t: 'mata', a: '#C9F2A8'}, {n: 'Sapi', w: '#FFFFFF', t: 'tanduk', a: '#2B2238', bintik: 1}, {n: 'Ayam', w: '#FFFFFF', t: 'jengger', a: '#FF4D4D', paruh: 1},
  {n: 'Tikus', w: '#B8B8C8', t: 'besar', a: '#FFB3C7'}, {n: 'Anjing', w: '#E0B07A', t: 'lipat', a: '#8A5A3A'}, {n: 'Koala', w: '#A8B0BC', t: 'besar', a: '#E8ECF2'},
  {n: 'Harimau', w: '#FFA43A', t: 'bulat', a: '#2B2238', loreng: 1}, {n: 'Domba', w: '#FFF8EC', t: 'lipat', a: '#5A4A4A'}, {n: 'Pinguin', w: '#2E3A5A', t: 'none', a: '#FFFFFF', paruh: 1}];
const _matCache = {}; const M = w => _matCache[w] || (_matCache[w] = MAT(w));
function buatWarga(no) { const r = rng(no * 7919 + 13), J = JENIS[Math.floor(r() * JENIS.length)], g = new THREE.Group(), B = new THREE.Group(); g.add(B);
  const w = M(J.w), a = M(J.a);
  bola(.62, w, 0, .58, 0, 1, 1.05, .92, B); bola(.4, a === M('#2B2238') ? M('#FFFFFF') : a, 0, .55, .38, 1, 1.05, .55, B, 0);
  const kep = new THREE.Group(); kep.position.y = 1.3; B.add(kep);
  bola(.62, J.loreng ? w : w, 0, .4, 0, 1.08, .95, 1, kep);
  for (const s of [-1, 1]) { bola(.1, M('#1E1A2A'), s * .24, .48, .54, 1, 1.25, .6, kep, 0); const k = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), M('#FFFFFF')); k.position.set(s * .24 + .03, .53, .6); kep.add(k);
    const p = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), BASIC('#FF7E9A', {transparent: true, opacity: .55})); p.scale.set(1.2, .6, .3); p.position.set(s * .42, .28, .48); kep.add(p);
    if (J.hitam) bola(.17, a, s * .24, .48, .5, 1.1, 1.3, .5, kep, 0); }
  if (J.paruh) { const p = bola(.17, M('#FF9A3C'), 0, .3, .62, 1.3, .55, 1, kep, 1.1); }
  else if (J.moncong) { bola(.2, a, 0, .3, .58, 1.2, .9, .6, kep, 1.08); }
  else bola(.06, M('#2B2238'), 0, .34, .63, 1.3, .9, .8, kep, 0);
  if (J.bintik) { bola(.2, a, .35, .75, .25, 1, .8, .5, B, 0); bola(.16, a, -.3, .45, .35, 1, .8, .5, B, 0); }
  if (J.loreng) for (const s of [-1, 1]) bola(.07, a, s * .3, .82, .3, 1, 2.2, .5, kep, 0);
  for (const s of [-1, 1]) { const tw = J.t;
    if (tw === 'panjang') { const e = bola(.15, w, s * .2, 1.15, -.05, 1, 3, .7, kep); e.rotation.z = -s * .12; bola(.08, a, s * .2, 1.15, .03, 1, 2.6, .4, kep, 0); }
    else if (tw === 'bulat') bola(.2, J.hitam ? a : w, s * .45, .88, -.05, 1, 1, .6, kep);
    else if (tw === 'besar') { bola(.3, w, s * .52, .82, -.05, 1, 1, .45, kep); bola(.18, a, s * .52, .82, .03, 1, 1, .3, kep, 0); }
    else if (tw === 'kecil') { const e = new THREE.Mesh(new THREE.ConeGeometry(.15, .3, 4), w); e.position.set(s * .38, .95, 0); garis(e, 1.1); kep.add(e); }
    else if (tw === 'runcing') { const e = new THREE.Mesh(new THREE.ConeGeometry(.2, .5, 4), w); e.position.set(s * .38, 1.02, 0); e.rotation.y = Math.PI / 4; garis(e, 1.08); kep.add(e); }
    else if (tw === 'mata') { bola(.2, w, s * .26, .85, .2, 1, 1, 1, kep); bola(.09, M('#1E1A2A'), s * .26, .88, .37, 1, 1, .5, kep, 0); }
    else if (tw === 'tanduk') { const e = new THREE.Mesh(new THREE.ConeGeometry(.08, .3, 8), M('#FFE9A8')); e.position.set(s * .3, 1.0, 0); e.rotation.z = -s * .3; garis(e, 1.12); kep.add(e); bola(.13, w, s * .55, .72, 0, 1.4, .6, .6, kep); }
    else if (tw === 'jengger' && s > 0) { for (let k = 0; k < 3; k++) bola(.11, a, 0, 1.0 + Math.sin(k) * .05, -.15 + k * .15, 1, 1.2, 1, kep, 1.1); }
    else if (tw === 'lipat') { const e = bola(.2, a, s * .5, .62, 0, .6, 1.4, .8, kep); e.rotation.z = s * .3; } }
  if (J.t === 'mata') kep.children.filter(c => c.geometry && c.position.y === .48).forEach(c => c.visible = false);
  for (const s of [-1, 1]) bola(.16, w, s * .3, -.02, .14, 1, .7, 1.3, B);
  const bayang = new THREE.Mesh(new THREE.CircleGeometry(.75, 20), new THREE.MeshBasicMaterial({color: 0x2B2238, transparent: true, opacity: .18, depthWrite: false}));
  bayang.rotation.x = -Math.PI / 2; bayang.position.y = .03; g.add(bayang);
  g.scale.setScalar(1.35); g.userData = {B, kep, jenis: J.n, r: r(), r2: r(), r3: r(), lahir: -99}; return g; }
const MAKS_TAMPIL = HP ? 70 : 140;
const WARGA = [];   // objek yang tampil

/* Joko & Agus di depan papan */
function letakTokoh(t) { const ax = PUSAT[0], az = PUSAT[1];
  JOKO.root.scale.setScalar(SKALA_TOKOH); AGUS.root.scale.setScalar(SKALA_TOKOH);
  const [jx, jy, jz] = [ax - 1.9, tinggi(ax, az) + .3 + JOKO.alas * SKALA_TOKOH, az + 1.2], [gx, gy, gz] = [ax + 1.9, tinggi(ax, az) + .3 + AGUS.alas * SKALA_TOKOH, az + 1.2];
  pose(JOKO, {t, x: jx, y: jy + Math.abs(Math.sin(t * 3)) * .12, z: jz, yaw: .1, senang: .9, la: [[0, .2], lambai(t, .6 + .4 * Math.max(0, Math.sin(t * .7)))]});
  pose(AGUS, {t, x: gx, y: gy + Math.abs(Math.sin(t * 3 + 1)) * .12, z: gz, yaw: -.1, senang: .9, la: [[0, .2], [0, .2 + Math.max(0, Math.sin(t * .9 + 1)) * 1.6]]}); }

/* ================= DATA ================= */
let CFG = {nilai_koin: {follow: 500, like: 100, share: 1000, repost: 2000, saweria: 5000}, koin_per_rumah: 10000, followers_awal: 0, saweria: 0, instagram_url: ''};
let DATA = null, WARGA_N = -1, RUMAH_N = -1;
const fmt = n => Math.round(n).toLocaleString('id-ID');
function hitung(d) { const v = CFG.nilai_koin, warga = Math.max(0, (d.followers || 0) - (CFG.followers_awal || 0)), saw = (d.saweria != null ? d.saweria : CFG.saweria) || 0;
  const rinci = [['Follow', warga, v.follow], ['Like', d.likes || 0, v.like], ['Share', d.shares || 0, v.share], ['Repost', d.reposts || 0, v.repost], ['Saweria', saw, v.saweria]];
  const kas = rinci.reduce((s, [, n, k]) => s + n * k, 0); return {warga, kas, rinci, rumah: Math.min(PETAK.length, Math.floor(kas / CFG.koin_per_rumah))}; }

let tAnim = 0;
function terapkan(d, awal) { DATA = d; const h = hitung(d);
  /* rumah */
  while (RUMAH.length < h.rumah) { const i = RUMAH.length, p = PETAK[i], g = buatRumah(i); g.position.set(p.x, tinggi(p.x, p.z) - .1, p.z); g.rotation.y = p.yaw; scene.add(g); RUMAH.push({g, lahir: awal ? -99 : tAnim + i * 0 + (i - RUMAH_N) * .15}); }
  while (RUMAH.length > h.rumah) scene.remove(RUMAH.pop().g);
  /* warga (yang tampil dibatasi; sisanya dihitung) */
  const tampil = Math.min(h.warga, MAKS_TAMPIL);
  while (WARGA.length < tampil) { const no = WARGA.length, g = buatWarga(no); g.userData.no = no; g.userData.lahir = awal ? -99 : tAnim + (no - Math.max(0, WARGA_N)) * .25; scene.add(g); WARGA.push(g); }
  while (WARGA.length > tampil) scene.remove(WARGA.pop());
  const kabar = [];
  if (!awal && WARGA_N >= 0 && h.warga > WARGA_N) kabar.push(`+${fmt(h.warga - WARGA_N)} warga baru! 🎉`);
  if (!awal && RUMAH_N >= 0 && h.rumah > RUMAH_N) kabar.push(`+${fmt(h.rumah - RUMAH_N)} rumah baru! 🏠`);
  if (kabar.length) toast(kabar.join('  ·  '));
  WARGA_N = h.warga; RUMAH_N = h.rumah;
  isiPanel(d, h); }

function isiPanel(d, h) {
  $('#nWarga').textContent = fmt(h.warga); $('#nKas').textContent = fmt(h.kas); $('#nRumah').textContent = fmt(h.rumah);
  $('#rinci').innerHTML = ''; h.rinci.forEach(([nama, n, k]) => { const tr = document.createElement('tr');
    [nama, `${fmt(n)} × ${fmt(k)}`, fmt(n * k)].forEach((s, i) => { const td = document.createElement('td'); td.textContent = s; if (i === 2) td.className = 'kn'; tr.appendChild(td); }); $('#rinci').appendChild(tr); });
  const sisa = CFG.koin_per_rumah - (h.kas % CFG.koin_per_rumah), pr = (h.kas % CFG.koin_per_rumah) / CFG.koin_per_rumah;
  $('#barIsi').style.width = (h.rumah >= PETAK.length ? 100 : pr * 100) + '%';
  $('#barTeks').textContent = h.rumah >= PETAK.length ? 'Dataran kota sudah penuh! Tahap berikutnya: perluasan kota.' : `Rumah ke-${fmt(h.rumah + 1)}: ${fmt(sisa)} Koin lagi`;
  const ul = $('#usulan'); ul.innerHTML = ''; (d.usulan || []).slice(0, 5).forEach((u, i) => { const li = document.createElement('li');
    const n = document.createElement('span'); n.className = 'un'; n.textContent = u.nama; const l = document.createElement('span'); l.className = 'ul'; l.textContent = `❤ ${fmt(u.like || 0)}`;
    li.append(n, l); if (i === 0) li.className = 'top'; ul.appendChild(li); });
  if (!(d.usulan || []).length) { const li = document.createElement('li'); li.className = 'kosong'; li.textContent = 'Belum ada usulan. Tulis usulanmu di komentar!'; ul.appendChild(li); }
  const wb = $('#wargaBaru'); wb.innerHTML = ''; for (let i = h.warga - 1; i >= Math.max(0, h.warga - 6); i--) { const s = document.createElement('span'); s.className = 'chip';
    s.textContent = `${JENIS[Math.floor(rng(i * 7919 + 13)() * JENIS.length)].n} #${fmt(i + 1)}`; wb.appendChild(s); }
  if (!h.warga) wb.textContent = 'Belum ada warga. Jadilah yang pertama!';
  $('#lebih').textContent = h.warga > MAKS_TAMPIL ? `(${fmt(MAKS_TAMPIL)} warga tampil di pulau, ${fmt(h.warga - MAKS_TAMPIL)} lainnya sedang berjalan-jalan)` : '';
  const tg = d.diperbarui ? new Date(d.diperbarui) : null;
  $('#waktu').textContent = tg ? 'Diperbarui ' + tg.toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
  $('#demo').style.display = d.demo ? '' : 'none'; $('#tunda').style.display = d.tertunda ? '' : 'none';
  if (CFG.instagram_url) { $('#ig').href = CFG.instagram_url; $('#ig').style.display = ''; } }

let _toastT = 0;
function toast(s) { const el = $('#toast'); el.textContent = s; el.classList.add('on'); clearTimeout(_toastT); _toastT = setTimeout(() => el.classList.remove('on'), 3500); }

async function muat(awal) {
  try { if (awal) { const c = await fetch('config.json?' + Date.now()).then(r => r.json()); CFG = Object.assign(CFG, c, {nilai_koin: Object.assign(CFG.nilai_koin, c.nilai_koin || {})}); } } catch (e) {}
  const sumber = CFG.data_url ? [CFG.data_url, 'data.json'] : ['data.json'];
  for (const [i, u] of sumber.entries()) {
    if (i > 0 && !awal) { if (DATA) { DATA.tertunda = true; $('#tunda').style.display = ''; } return; }   // Worker gagal: tetap tampilkan data terakhir
    try { const d = await fetch(u + (u.includes('?') ? '&' : '?') + 't=' + Date.now(), {cache: 'no-store'}).then(r => { if (!r.ok) throw r.status; return r.json(); });
      if (i > 0) d.tertunda = true;
      if (awal || JSON.stringify(d) !== JSON.stringify(DATA)) terapkan(d, awal); return; } catch (e) {} }
  if (awal) terapkan({followers: 0, likes: 0, shares: 0, reposts: 0, usulan: [], demo: true}, true); }

/* ================= KAMERA (geser putar, cubit/scroll zoom) ================= */
const ORB = {th: .5, ph: .9, r: HP ? 125 : 105, tgt: V(PUSAT[0] + 6, 4, PUSAT[1] + 8)}, ORB_T = {th: ORB.th, ph: ORB.ph, r: ORB.r, tgt: ORB.tgt.clone()};
let diam = 0; const jari = new Map();
const el = REN.domElement;
el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); jari.set(e.pointerId, [e.clientX, e.clientY]); diam = 0; });
el.addEventListener('pointermove', e => { if (!jari.has(e.pointerId)) return; const [px, py] = jari.get(e.pointerId);
  if (jari.size === 1) { ORB_T.th -= (e.clientX - px) * .005; ORB_T.ph = clamp(ORB_T.ph - (e.clientY - py) * .004, .3, 1.38); }
  else if (jari.size === 2) { const [a, b] = [...jari.values()], d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); jari.set(e.pointerId, [e.clientX, e.clientY]);
    const [c, d] = [...jari.values()], d1 = Math.hypot(c[0] - d[0], c[1] - d[1]); ORB_T.r = clamp(ORB_T.r * d0 / Math.max(1, d1), 22, 260); return; }
  jari.set(e.pointerId, [e.clientX, e.clientY]); diam = 0; });
['pointerup', 'pointercancel'].forEach(n => el.addEventListener(n, e => jari.delete(e.pointerId)));
el.addEventListener('wheel', e => { e.preventDefault(); ORB_T.r = clamp(ORB_T.r * Math.exp(e.deltaY * .001), 22, 260); diam = 0; }, {passive: false});
const PRESET = {kota: {th: .5, ph: .9, r: HP ? 125 : 105, tgt: [PUSAT[0] + 6, 4, PUSAT[1] + 8]}, warga: {th: .35, ph: 1.12, r: 34, tgt: [PUSAT[0], 3, PUSAT[1]]},
  gunung: {th: .3, ph: 1.12, r: 150, tgt: [GUNUNG[0] + 8, 18, GUNUNG[1] + 20]}, pulau: {th: .6, ph: .82, r: 300, tgt: [0, 0, -70]}};
document.querySelectorAll('[data-kam]').forEach(b => b.addEventListener('click', () => { const p = PRESET[b.dataset.kam];
  ORB_T.th = ORB.th + Math.atan2(Math.sin(p.th - ORB.th), Math.cos(p.th - ORB.th)); ORB_T.ph = p.ph; ORB_T.r = p.r; ORB_T.tgt.set(...p.tgt); diam = 0;
  document.querySelectorAll('[data-kam]').forEach(x => x.classList.toggle('on', x === b)); }));

/* ================= LOOP ================= */
let t0 = performance.now(), tl = t0;
function loop(now) { const t = (now - t0) / 1000, dt = Math.min(.05, (now - tl) / 1000); tl = now; tAnim = t; diam += dt;
  if (diam > 6 && !jari.size) ORB_T.th += dt * .035;
  const k = 1 - Math.exp(-dt * 5); ORB.th = lerp(ORB.th, ORB_T.th, k); ORB.ph = lerp(ORB.ph, ORB_T.ph, k); ORB.r = lerp(ORB.r, ORB_T.r, k); ORB.tgt.lerp(ORB_T.tgt, k);
  cam.position.set(ORB.tgt.x + Math.sin(ORB.ph) * Math.sin(ORB.th) * ORB.r, ORB.tgt.y + Math.cos(ORB.ph) * ORB.r, ORB.tgt.z + Math.sin(ORB.ph) * Math.cos(ORB.th) * ORB.r);
  cam.position.y = Math.max(cam.position.y, tinggi(cam.position.x, cam.position.z) + 3); cam.lookAt(ORB.tgt);
  for (let i = 0; i < LP.count; i++) LP.setY(i, ombak(LX[i], LZ[i], t) - (LS ? clamp((LS[i] + 1.9) / 3, 0, 1) * 1.4 : 0));
  LP.needsUpdate = true; LG.computeVertexNormals(); pola.offset.set(t * .004, t * .002);
  airMengalir(t);
  AWAN.forEach(w => { const a = w.a + t * .004; w.g.position.x = Math.sin(a) * w.d; w.g.position.z = Math.cos(a) * w.d - 80; });
  letakTokoh(t);
  RUMAH.forEach(({g, lahir}, i) => { const p = seg(t, lahir, lahir + .6), s = 3.2 * Math.max(.001, E.back(p)); g.scale.setScalar(s); });
  const nR = Math.max(1, RUMAH.length);
  WARGA.forEach(g => { const u = g.userData, no = u.no;
    let ax, az; if (RUMAH.length) { const p = PETAK[no % nR]; ax = p.x; az = p.z; } else { const a = no * 2.4; ax = PUSAT[0] + Math.cos(a) * (11 + (no % 5) * 2.5); az = PUSAT[1] + Math.sin(a) * (11 + (no % 5) * 2.5); }
    const a = u.r * 6.28 + t * (.12 + u.r2 * .15) * (u.r3 < .5 ? 1 : -1), rad = RUMAH.length ? 4.5 + u.r2 * 2.5 : 1.5 + u.r2 * 2;
    const x = ax + Math.cos(a) * rad, z = az + Math.sin(a) * rad, jatuh = seg(t, u.lahir, u.lahir + .7);
    g.position.set(x, tinggi(x, z) + .1 + (1 - E.out(jatuh)) * 14, z); g.rotation.y = -a + (u.r3 < .5 ? Math.PI : 0);
    u.B.position.y = Math.abs(Math.sin(t * 7 + u.r * 20)) * .18; u.kep.rotation.z = Math.sin(t * 2 + u.r * 9) * .08; g.visible = t > u.lahir - .05; });
  REN.render(scene, cam); requestAnimationFrame(loop); }

function ukur() { const w = innerWidth, h = innerHeight, hp = w <= 820, geserX = hp ? 0 : 392, geserY = hp ? Math.round(h * .34) : 0;
  REN.setSize(w, h); cam.aspect = (w + geserX) / (h + geserY); cam.setViewOffset(w + geserX, h + geserY, geserX, geserY, w, h); cam.updateProjectionMatrix(); }
ukur(); addEventListener('resize', ukur);
const LS = (() => { const a = new Float32Array(LP.count); for (let i = 0; i < LP.count; i++) a[i] = pantaiS(LX[i], LZ[i]); return a; })();
$('#lipat').addEventListener('click', () => document.body.classList.toggle('tutup'));
muat(true).then(() => { $('#muat').classList.add('hilang'); requestAnimationFrame(loop);
  setInterval(() => { if (!document.hidden) muat(false); }, CFG.data_url ? 30000 : 60000); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) muat(false); });
