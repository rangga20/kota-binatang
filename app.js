/* ============ KOTA BINATANG — Live ============
   Pulau 3D (sama dengan video "Awal Mula Kota Binatang") + data warga & kas Koin dari data.json.
   data.json diperbarui otomatis oleh GitHub Actions (scripts/ambil_instagram.py).
   Koin = poin fiktif, BUKAN uang / Rupiah. Desain Joko & Agus masih SEMENTARA. Nama: Kota Bhinneka, Pulau Nusantara (Part 2). */
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
const KELAPA = [];   /* pohon kelapa pantai (diisi kode pulau) */

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
  return {n, buah: buah.length, daftar, mD, mT, mBuah, daftarBuah: buah}; })();

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
  pk.forEach(([x, z, h, c, r]) => KELAPA.push(Object.assign(kelapa(PANTAI, x, tanah(x, z) - .1, z, h, c, r), {px: x, pz: z, tinggi: h})));
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


/* ===== dari video Part 2: rakit & bangunan Kota Bhinneka ===== */
const N_WARGA = 109;
const _ca = new THREE.Color(), _cb = new THREE.Color();
const campur = (a, b, k) => '#' + _ca.set(a).lerp(_cb.set(b), clamp(k, 0, 1)).getHexString();
const papan = tekstur(256, 256, (x, w, h) => { x.fillStyle = '#D69A5B'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#CC9052' : '#DCA466'; x.fillRect(0, i * 64 + 3, w, 58); x.fillStyle = '#9C6635'; x.fillRect(0, i * 64, w, 4); }
  x.fillStyle = '#8A5A2E'; for (const px of [22, 234]) for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(px, i * 64 + 32, 5, 0, 7); x.fill(); } });
const KAYU = MAT('#FFFFFF', {map: papan}), KAYU2 = MAT('#B87A42');
/* ---------- KOTA BHINNEKA: tempat & bangunan (koordinat sama dengan website) ---------- */
const JK = [-1.2, 25.4], AG = [1.2, 25.4], KAS_P = [-3.5, 26.8], PAPAN_P = [0.2, 21.6];
const GERBANG_POS = [-18, -15], GERBANG_ARAH = .47, LUMBUNG_POS = [-16, -26], LUMBUNG_ARAH = -1.2, PUSAT_KOTA = [-30, -40], KEBUN_POS = [-44, -27];
const KELAPA_KOTA = [[-40, -6], [-43.5, -9.5], [-36.5, -9.5]];
const CELAH = a => Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < .42;   /* celah lingkaran menghadap kamera */
const FD = V(Math.sin(GERBANG_ARAH), 0, Math.cos(GERBANG_ARAH)), FK = V(FD.z, 0, -FD.x);   /* arah depan & kanan gerbang */
function cat(w) { return MAT(w); }
/* teks di papan (kanvas) */
function teksPapan(w, h, baris, latar = '#FFF1D6', tinta = '#5A3418') { return tekstur(w, h, (x) => { x.fillStyle = latar; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#2B2238'; x.lineWidth = h * .06; x.strokeRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = tinta;
  baris.forEach(([s, uk, y]) => { x.font = `700 ${uk}px 'Fredoka', sans-serif`; x.fillText(s, w / 2, y, w * .92); }); }); }
function atapPelana(lebar, tinggi, panjang, mat, induk, y = 0) {   /* prisma segitiga memanjang di sumbu x */
  const sh = new THREE.Shape(); sh.moveTo(-lebar / 2, 0); sh.lineTo(lebar / 2, 0); sh.lineTo(0, tinggi); sh.lineTo(-lebar / 2, 0);
  const g = new THREE.ExtrudeGeometry(sh, {depth: panjang, bevelEnabled: false}); g.translate(0, 0, -panjang / 2); g.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.y = y; garis(m, 1.04); m.castShadow = true; if (induk) induk.add(m); return m; }

/* gerbang & plang kota (desain Agus) */
const GERBANG = (() => { const g = new THREE.Group(), kayu = MAT('#C98A4B'), batuM = MAT('#B8AFA6'), merah = MAT('#D9A066'), emas = MAT('#FFD447'), putihM = MAT('#FFFFFF');
  const b = {tiang: [], hias: [], cat: []}, catM = MAT('#E5484D');
  for (const s of [-1, 1]) { const t = new THREE.Group(); t.position.x = s * 3.7; g.add(t);
    balok(1.4, .8, 1.4, batuM, 0, .4, 0, t, 1.05); balok(.8, 6.2, .8, MAT('#D9A066'), 0, 3.9, 0, t); { const ov = new THREE.Group(); ov.position.y = .8; t.add(ov); balok(.86, 6.2, .86, catM, 0, 3.1, 0, ov, 0); b.cat.push(ov); }   /* cat merah naik dari bawah */ balok(1.05, .35, 1.05, emas, 0, 6.9, 0, t, 1.05);
    for (const dz of [-.75, .75]) { bola(.32, MAT('#6BD86F'), 0, .95, dz, 1, .8, 1, t, 1.08); bola(.12, MAT(s > 0 ? '#FF7EB6' : '#FFD447'), 0, 1.25, dz, 1, 1, 1, t, 0); }
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.2, 6), MAT('#6B4A2E')); tb.position.y = 8.2; garis(tb, 1.2); t.add(tb);
    const bendera = new THREE.Group(); bendera.position.set(0, 8.9, 0); t.add(bendera);
    balok(1.2, .32, .04, MAT('#E5484D'), .62, .16, 0, bendera, 0); balok(1.2, .32, .04, putihM, .62, -.16, 0, bendera, 0); b.hias.push(bendera); b.tiang.push(t); }
  const atas = new THREE.Group(); g.add(atas); b.atas = atas;
  balok(9.6, .55, 1.2, kayu, 0, 7.25, 0, atas); balok(8.6, .3, 1.0, merah, 0, 7.7, 0, atas);
  b.atap = atapPelana(1.9, 1.3, 10.2, MAT('#8A4A2E'), atas, 7.85);
  const papan = new THREE.Group(); papan.position.set(0, 5.55, .45); g.add(papan); b.papan = papan;
  balok(7.4, 1.9, .3, MAT('#FFFFFF', {map: teksPapan(1024, 264, [['KOTA BHINNEKA', 150, 112], ['Pulau Nusantara', 58, 212]])}), 0, 0, 0, papan, 1.04);
  for (const s of [-1, 1]) { const tl = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 6), MAT('#6B4A2E')); tl.position.set(s * 3, 1.3, 0); papan.add(tl); }
  g.bagian = b; g.merah = merah; scene.add(g); return g; })();
function letakGerbang(b, cat = seg(b, .82, 1)) { const G = GERBANG, p = G.bagian; G.position.set(GERBANG_POS[0], tanah(...GERBANG_POS) - .05, GERBANG_POS[1]); G.rotation.y = GERBANG_ARAH; G.visible = b > 0;
  p.tiang.forEach((t, i) => { const k = E.back(seg(b, i * .08, .3)); t.scale.set(1, Math.max(.001, k), 1); });
  p.atas.visible = b > .3; p.atas.position.y = (1 - E.out(seg(b, .3, .5))) * 7;
  p.atap.scale.setScalar(Math.max(.001, E.back(seg(b, .5, .65))));
  p.papan.visible = b > .65; p.papan.scale.setScalar(Math.max(.001, E.back(seg(b, .65, .8))));
  G.merah.color = C(campur('#D9A066', '#E5484D', cat)); p.cat.forEach(ov => { ov.visible = cat > .005; ov.scale.y = Math.max(.001, cat); }); p.hias.forEach(h => h.visible = b > .9); }

/* lumbung: rumah panggung penyimpan makanan (desain Agus) */
const LUMBUNG = (() => { const g = new THREE.Group(), b = {}; const kayu = MAT('#B87A42'), jerami = MAT('#E8C25A');
  b.tiang = new THREE.Group(); g.add(b.tiang);
  for (const x of [-2, 2]) for (const z of [-1.6, 1.6]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, 1.7, 10), kayu); t.position.set(x, .85, z); garis(t, 1.08); b.tiang.add(t); }
  b.lantai = balok(5, .32, 4, MAT('#9A6534'), 0, 1.8, 0, g);
  b.dinding = new THREE.Group(); g.add(b.dinding);
  balok(4.4, 2.4, 3.4, KAYU, 0, 3.15, 0, b.dinding); balok(1.1, 1.7, .08, MAT('#5A3418'), 0, 2.8, 1.72, b.dinding, 0);
  balok(1.3, .16, .1, MAT('#FFD447'), 0, 3.72, 1.74, b.dinding, 0);
  const tangga = new THREE.Group(); tangga.position.set(0, 0, 2.6); tangga.rotation.x = -.45; b.dinding.add(tangga);
  for (const s of [-1, 1]) balok(.12, 2.4, .12, kayu, s * .45, 1.1, 0, tangga, 1.1); for (let i = 0; i < 4; i++) balok(.9, .1, .1, kayu, 0, .3 + i * .5, 0, tangga, 1.1);
  b.atap = new THREE.Group(); g.add(b.atap); b.atap.position.y = 4.3;
  const at = atapPelana(5.6, 2.6, 5.2, jerami, b.atap, 0); at.rotation.y = Math.PI / 2;
  const sign = balok(2.6, .8, .12, MAT('#FFFFFF', {map: teksPapan(512, 160, [['LUMBUNG', 92, 84]])}), 0, 1.0, 2.0, b.atap, 1.04);
  /* persediaan makanan di depan lumbung */
  b.makan = []; const r = rng(808);
  const kr = (x, z, isi) => { const k = new THREE.Group(); k.position.set(x, 0, z); g.add(k);
    const kb = new THREE.Mesh(new THREE.CylinderGeometry(.55, .42, .55, 14), MAT('#C9934F')); kb.position.y = .28; garis(kb, 1.06); k.add(kb);
    for (let i = 0; i < 5; i++) { const a = i * 1.26, w = isi === 'ikan' ? '#7FC8FF' : isi === 'kelapa' ? '#7A4A22' : isi === 'wortel' ? '#FF8A2A' : '#7ED957';
      bola(.2, MAT(w), Math.cos(a) * .25, .62 + (i % 2) * .1, Math.sin(a) * .25, isi === 'ikan' ? 1.6 : 1, isi === 'wortel' ? 1.5 : 1, 1, k, 1.08); }
    b.makan.push(k); };
  [['wortel', -2.6, 3.3], ['ikan', -1.4, 3.6], ['kelapa', 1.4, 3.6], ['sayur', 2.6, 3.3], ['ikan', -2.0, 4.6], ['kelapa', 0, 4.4], ['wortel', 2.0, 4.6], ['sayur', -.9, 5.4], ['kelapa', .9, 5.4]].forEach(([s, x, z]) => kr(x, z, s));
  scene.add(g); return Object.assign(g, {bagian: b}); })();
function letakLumbung(b, makan = 0) { const L = LUMBUNG, p = L.bagian; L.position.set(LUMBUNG_POS[0], tanah(...LUMBUNG_POS), LUMBUNG_POS[1]); L.rotation.y = LUMBUNG_ARAH; L.visible = b > 0;
  p.tiang.scale.set(1, Math.max(.001, E.back(seg(b, 0, .25))), 1); p.lantai.visible = b > .2; p.lantai.scale.setScalar(Math.max(.001, E.back(seg(b, .2, .4))));
  p.dinding.visible = b > .38; p.dinding.scale.set(1, Math.max(.001, E.back(seg(b, .38, .65))), 1);
  p.atap.visible = b > .62; p.atap.position.y = 4.3 + (1 - E.out(seg(b, .62, .85))) * 6;
  p.makan.forEach((k, i) => { const s = E.back(seg(makan, i / 9, i / 9 + .2)); k.visible = s > .01; k.scale.setScalar(Math.max(.001, s)); }); }

/* kebun sayur */
const KEBUN = (() => { const g = new THREE.Group(), tanam = [], tanahM = MAT('#9A6A44'), r = rng(909);
  for (let i = 0; i < 5; i++) { const z = -3.2 + i * 1.6; balok(11, .3, .95, tanahM, 0, .12, z, g, 1.03);
    for (let j = 0; j < 7; j++) { const x = -4.8 + j * 1.6, p = new THREE.Group(); p.position.set(x, .3, z); g.add(p);
      const jenis = (i + j) % 3; if (jenis === 0) { const w = new THREE.Mesh(new THREE.ConeGeometry(.16, .5, 10), MAT('#FF8A2A')); w.rotation.x = Math.PI; w.position.y = .05; p.add(w); }
      for (let k = 0; k < 3; k++) { const d = bola(.16, MAT(jenis === 1 ? '#9BE36B' : '#4CC05E'), (k - 1) * .14, .3, 0, .6, 1.6, .6, p, 1.1); d.rotation.z = (k - 1) * .5; }
      if (jenis === 1) bola(.32, MAT('#B5EA8A'), 0, .3, 0, 1, .85, 1, p, 1.06);
      tanam.push(p); } }
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28, x = Math.cos(a) * 6.8, z = Math.sin(a) * 4.8; const t = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 1, 6), MAT('#B87A42')); t.position.set(x, .5, z); garis(t, 1.15); g.add(t); }
  scene.add(g); return Object.assign(g, {tanam}); })();
function letakKebun(tumbuh) { KEBUN.visible = true; KEBUN.position.set(KEBUN_POS[0], tanah(...KEBUN_POS), KEBUN_POS[1]); KEBUN.rotation.y = .3;
  KEBUN.tanam.forEach((p, i) => { const s = E.back(seg(tumbuh, (i % 7) / 10, (i % 7) / 10 + .4)); p.scale.setScalar(Math.max(.001, .25 + s * .75)); }); }

/* kebun kelapa di dekat gerbang (untuk dipetik) */
const KELAPA_K = KELAPA_KOTA.map(([x, z], i) => kelapa(PANTAI, x, tanah(x, z) - .1, z, 8.5, 0, i * 2));

/* tenda-tenda warga melingkar + api unggun di tengah kota */
const TENDA = (() => { const L = [], warna = ['#FF8A8A', '#FFD447', '#7FC8FF', '#9BE36B', '#C69CFF', '#FFB347'];
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + .13; if (CELAH(a)) continue; const x = PUSAT_KOTA[0] + Math.cos(a) * 13, z = PUSAT_KOTA[1] + Math.sin(a) * 13, g = new THREE.Group();
    const m = atapPelana(3.2, 2.4, 3.4, MAT(warna[i % 6]), g, 0); m.rotation.y = Math.PI / 2;
    const pintu = new THREE.Mesh(new THREE.CircleGeometry(.75, 3), MAT('#3A2A4A')); pintu.rotation.z = Math.PI / 2; pintu.position.set(0, .55, 1.72); g.add(pintu);
    g.position.set(x, tanah(x, z), z); g.rotation.y = Math.atan2(PUSAT_KOTA[0] - x, PUSAT_KOTA[1] - z); scene.add(g); L.push(g); }
  return L; })();
function letakTenda(b) { TENDA.forEach((g, i) => { const s = E.back(seg(b, i / 14, i / 14 + .2)); g.visible = s > .01; g.scale.setScalar(Math.max(.001, s)); }); }
const API = (() => { const g = new THREE.Group(), r = rng(515);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, b = new THREE.Mesh(new THREE.DodecahedronGeometry(.42, 0), batu); b.position.set(Math.cos(a) * 1.25, .15, Math.sin(a) * 1.25); garis(b, 1.1); g.add(b); }
  for (let i = 0; i < 3; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, 1.9, 8), MAT('#8A5A2E')); k.rotation.set(Math.PI / 2 - .35, i * 2.1, 0); k.position.y = .35; garis(k, 1.1); g.add(k); }
  const nyala = new THREE.Group(); nyala.position.y = .4; g.add(nyala);
  [['#FF6A2A', .62, 1.9], ['#FFB02E', .45, 1.45], ['#FFF0A0', .26, .95]].forEach(([w, r0, h]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r0, h, 12), BASIC(w)); c.position.y = h / 2; nyala.add(c); });
  const cahaya = new THREE.PointLight(C('#FF9A4A'), 0, 34, 1.6); cahaya.position.y = 1.6; g.add(cahaya);
  const pijar = new THREE.Sprite(new THREE.SpriteMaterial({map: tekstur(128, 128, (x) => { const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,190,90,.9)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); pijar.scale.set(9, 9, 1); pijar.position.y = 1.2; g.add(pijar);
  const bara = Array.from({length: 14}, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), BASIC('#FFD36A')); g.add(s); return s; });
  scene.add(g); return Object.assign(g, {nyala, cahaya, pijar, bara}); })();
function letakApi(t, k) { API.visible = true; API.position.set(PUSAT_KOTA[0], tanah(...PUSAT_KOTA), PUSAT_KOTA[1]);
  API.nyala.visible = API.pijar.visible = k > .01; API.nyala.scale.set(k * (1 + Math.sin(t * 13) * .06), k * (1 + Math.sin(t * 9.3) * .16 + Math.sin(t * 17) * .06), k * (1 + Math.cos(t * 11) * .06));
  API.nyala.children.forEach((c, i) => c.rotation.y = t * (1 + i));
  API.cahaya.intensity = k * (2.4 + Math.sin(t * 15) * .25); API.pijar.material.opacity = k * (.75 + Math.sin(t * 7) * .1);
  API.bara.forEach((s, i) => { const p = (t * .55 + i / 14) % 1, a = i * 2.4; s.visible = k > .5; s.position.set(Math.cos(a) * .4 * (1 + p), .8 + p * 4.5, Math.sin(a) * .4 * (1 + p)); s.scale.setScalar(1 - p); }); }

/* kertas desain Agus (biru) */
function kertas(gambar) { const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), MAT('#FFFFFF', {side: THREE.DoubleSide, map: tekstur(512, 380, (x, w, h) => {
    x.fillStyle = '#2F6FD6'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2;
    for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
    x.strokeStyle = '#FFFFFF'; x.fillStyle = '#FFFFFF'; x.lineWidth = 6; x.lineJoin = 'round'; gambar(x, w, h);
    x.strokeStyle = '#2B2238'; x.lineWidth = 14; x.strokeRect(0, 0, w, h); })}));
  g.add(m); const e = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 2.02), BASIC('#2B2238', {side: THREE.DoubleSide})); e.position.z = -.01; g.add(e); scene.add(g); return g; }
const DESAIN1 = kertas((x) => { x.strokeRect(120, 120, 34, 210); x.strokeRect(358, 120, 34, 210); x.strokeRect(96, 100, 320, 26);
  x.beginPath(); x.moveTo(90, 100); x.lineTo(256, 48); x.lineTo(422, 100); x.stroke(); x.strokeRect(150, 140, 212, 54);
  x.font = "700 30px 'Fredoka', sans-serif"; x.textAlign = 'center'; x.fillText('KOTA BHINNEKA', 256, 168);
  x.font = "600 24px 'Fredoka', sans-serif"; x.fillText('GERBANG · desain Agus', 256, 362); });
const DESAIN2 = kertas((x) => { for (const px of [150, 362]) x.strokeRect(px - 8, 250, 16, 80); x.strokeRect(120, 236, 272, 18); x.strokeRect(146, 150, 220, 86);
  x.beginPath(); x.moveTo(110, 152); x.lineTo(256, 60); x.lineTo(402, 152); x.closePath(); x.stroke(); x.strokeRect(236, 180, 40, 56);
  x.font = "600 24px 'Fredoka', sans-serif"; x.textAlign = 'center'; x.fillText('LUMBUNG · desain Agus', 256, 362); });
function pegangKertas(K, ag, buka) { const [x, y, z] = ag; K.visible = buka > .01; K.position.set(x, y + 1.55, z + .9); K.rotation.set(-.12, 0, 0); K.scale.set(Math.max(.001, E.back(buka)), Math.max(.001, E.back(buka)), 1); }


/* ================= KOTA BHINNEKA: seperti akhir video Part 2 (gerbang, lumbung, kebun, tenda & api unggun) ================= */
scene.add(JOKO.root);
const SKALA_TOKOH = 1.3;                       // Joko & Agus
const PUSAT = [PUSAT_KOTA[0], PUSAT_KOTA[1] + 3.4];   // depan api unggun di tengah kota, tempat Joko & Agus
const SKALA_WARGA = SKALA_TOKOH * 1.24;        // tinggi badan warga = tinggi Joko & Agus

/* papan nama kota di pantai: "KOTA BHINNEKA" (usulan Agus, Part 2) */
const PAPAN_POS = [0, 19.6];
{ const P = new THREE.Group(); P.position.set(PAPAN_POS[0], tinggi(...PAPAN_POS) - .1, PAPAN_POS[1]); P.scale.setScalar(SKALA_TOKOH); scene.add(P);
  const tx = tekstur(512, 256, (x, w, h) => { x.fillStyle = '#E8B878'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#DDAA68' : '#ECC088'; x.fillRect(0, i * 64 + 3, w, 58); }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#5A3418'; x.font = "700 86px 'Fredoka', sans-serif"; x.fillText('KOTA', w / 2, 82); x.font = "700 92px 'Fredoka', sans-serif"; x.fillText('BHINNEKA', w / 2, 172, w * .92); });
  for (const s of [-1, 1]) balok(.22, 3.2, .22, MAT('#B87A42'), s * 1.5, 1.6, 0, P);
  balok(3.6, 1.8, .2, MAT('#FFFFFF', {map: tx}), 0, 2.6, .05, P, 1.03); }

/* peti kas kota berisi Koin — sama seperti di video */
const KAS_POS = [PUSAT_KOTA[0] + 3.8, PUSAT_KOTA[1] + 4.6];
{ const K = new THREE.Group(); K.position.set(KAS_POS[0], tinggi(...KAS_POS), KAS_POS[1]); K.rotation.y = -.35; K.scale.setScalar(SKALA_TOKOH); scene.add(K);
  const emas = MAT('#FFC83D', {emissive: C('#7A5200'), emissiveIntensity: .2});
  balok(1.8, 1.0, 1.2, MAT('#B9773F'), 0, .5, 0, K); balok(1.86, .18, 1.26, emas, 0, .5, 0, K, 0);
  const tutup = new THREE.Group(); tutup.position.set(0, 1, -.6); tutup.rotation.x = -1.3; K.add(tutup);
  const tm = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.8, 20, 1, false, 0, Math.PI), MAT('#C9874F')); tm.rotation.z = Math.PI / 2; tm.position.z = .6; garis(tm, 1.04); tutup.add(tm);
  balok(.3, .36, .1, emas, 0, .75, .63, K, 1.1); bola(.7, emas, 0, .95, 0, 1.15, .35, .75, K, 0);
  for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .06, 20), emas); c.position.set(-.5 + i * .17, 1.12 + (i % 2) * .06, -.1 + (i % 3) * .12); c.rotation.set(.3 * i, i, .4); garis(c, 1.12); K.add(c); } }

/* ================= JENIS BINATANG (24) ================= */
const JENIS = [
  {id: 'kelinci', n: 'Kelinci', e: '🐰', w: '#F4F0FA', t: 'panjang', a: '#FFB3C7'}, {id: 'beruang', n: 'Beruang', e: '🐻', w: '#A0704A', t: 'bulat', a: '#D9B38C'},
  {id: 'panda', n: 'Panda', e: '🐼', w: '#FFFFFF', t: 'bulat', a: '#2B2238', hitam: 1}, {id: 'rubah', n: 'Rubah', e: '🦊', w: '#FF8F4A', t: 'runcing', a: '#FFF1E0'},
  {id: 'babi', n: 'Babi', e: '🐷', w: '#FFB3C1', t: 'kecil', a: '#FF8FA3', moncong: 1}, {id: 'bebek', n: 'Bebek', e: '🦆', w: '#FFE14D', t: 'none', a: '#FF9A3C', paruh: 1},
  {id: 'katak', n: 'Katak', e: '🐸', w: '#7ED957', t: 'mata', a: '#C9F2A8'}, {id: 'sapi', n: 'Sapi', e: '🐮', w: '#FFFFFF', t: 'tanduk', a: '#2B2238', bintik: 1},
  {id: 'ayam', n: 'Ayam', e: '🐔', w: '#FFFFFF', t: 'jengger', a: '#FF4D4D', paruh: 1}, {id: 'tikus', n: 'Tikus', e: '🐭', w: '#B8B8C8', t: 'besar', a: '#FFB3C7'},
  {id: 'anjing', n: 'Anjing', e: '🐶', w: '#E0B07A', t: 'lipat', a: '#8A5A3A'}, {id: 'koala', n: 'Koala', e: '🐨', w: '#A8B0BC', t: 'besar', a: '#E8ECF2'},
  {id: 'harimau', n: 'Harimau', e: '🐯', w: '#FFA43A', t: 'bulat', a: '#2B2238', loreng: 1}, {id: 'domba', n: 'Domba', e: '🐑', w: '#FFF8EC', t: 'lipat', a: '#5A4A4A', bulu: 1},
  {id: 'pinguin', n: 'Pinguin', e: '🐧', w: '#2E3A5A', t: 'none', a: '#FFFFFF', paruh: 1}, {id: 'kucing', n: 'Kucing', e: '🐱', w: '#C9C9D2', t: 'runcing', a: '#FFB3C7', kumis: 1},
  {id: 'singa', n: 'Singa', e: '🦁', w: '#F2B04A', t: 'bulat', a: '#B5652A', surai: 1}, {id: 'gajah', n: 'Gajah', e: '🐘', w: '#A9B4C8', t: 'gajah', a: '#FFD9E0', belalai: 1},
  {id: 'jerapah', n: 'Jerapah', e: '🦒', w: '#FFD27A', t: 'osikon', a: '#B5702A', bintik: 1}, {id: 'hamster', n: 'Hamster', e: '🐹', w: '#F2B77A', t: 'bulat', a: '#FFF1DA', gembul: 1},
  {id: 'burunghantu', n: 'Burung Hantu', e: '🦉', w: '#9A7A5A', t: 'jumbai', a: '#F2E2C2', paruh: 1, mataBesar: 1}, {id: 'kurakura', n: 'Kura-kura', e: '🐢', w: '#8ED16A', t: 'none', a: '#3E8E4A', tempurung: 1},
  {id: 'rakun', n: 'Rakun', e: '🦝', w: '#9A9AA6', t: 'runcing', a: '#3A3A48', topeng: 1}, {id: 'monyet', n: 'Monyet', e: '🐵', w: '#B07A4A', t: 'samping', a: '#F2D2A8', mukaMonyet: 1}];
const JENIS_ID = Object.fromEntries(JENIS.map(j => [j.id, j]));
const _matCache = {}; const M = w => _matCache[w] || (_matCache[w] = MAT(w));
/* bentuk satuan bersama (hemat memori: ratusan warga memakai geometri yang sama, cukup diskalakan) */
const _GB = new THREE.SphereGeometry(1, 22, 16), _GK = new THREE.ConeGeometry(1, 1, 14), _GT = new THREE.CylinderGeometry(1, 1, 1, 12), _GS = new THREE.TorusGeometry(1, .2, 6, 16, Math.PI);
function bb(r, m, x, y, z, sx = 1, sy = 1, sz = 1, p, tp = 1.06) { const o = new THREE.Mesh(_GB, m); o.position.set(x, y, z); o.scale.set(r * sx, r * sy, r * sz); if (tp) garis(o, tp); o.castShadow = true; if (p) p.add(o); return o; }
function kk(r, h, m, x, y, z, p, tp = 1.1) { const o = new THREE.Mesh(_GK, m); o.position.set(x, y, z); o.scale.set(r, h, r); if (tp) garis(o, tp); if (p) p.add(o); return o; }
function tb(r, h, m, x, y, z, p, tp = 1.12) { const o = new THREE.Mesh(_GT, m); o.position.set(x, y, z); o.scale.set(r, h, r); if (tp) garis(o, tp); if (p) p.add(o); return o; }
function senyum(p, r, y, z, m) { const o = new THREE.Mesh(_GS, m); o.scale.set(r, r, r); o.rotation.z = Math.PI; o.position.set(0, y, z); p.add(o); return o; }
const PERUT = {kelinci: '#FFFFFF', beruang: '#D9B38C', panda: '#FFFFFF', rubah: '#FFF6EA', babi: '#FFCAD4', bebek: '#FFF3A6', katak: '#DDF7C2', sapi: '#FFFFFF', ayam: '#FFFFFF',
  tikus: '#E6E6EF', anjing: '#FFF1DC', koala: '#E8ECF2', harimau: '#FFF6EA', domba: '#FFFFFF', pinguin: '#FFFFFF', kucing: '#F4F4F8', singa: '#FFE9C2', gajah: '#BFC9DA',
  jerapah: '#FFF0C8', hamster: '#FFF7EA', burunghantu: '#F2E2C2', kurakura: '#F2E6A0', rakun: '#E6E6EE', monyet: '#F2D2A8'};

/* binatang lucu tapi bercirikan hewan aslinya: moncong, telinga, ekor, kaki, motif bulu */
function buatBinatang(J, r, o = {}) { const g = new THREE.Group(), B = new THREE.Group(); g.add(B); const id = J.id;
  const w = M(/^#[0-9a-fA-F]{6}$/.test(o.warna || '') ? o.warna : J.w), a = M(J.a), gelap = M('#1E1A2A'), putih = M('#FFFFFF'), pink = M('#FF9DB5'), oranye = M('#FF9A3C'), pr = M(PERUT[id] || '#FFFFFF');
  const burung = id === 'bebek' || id === 'ayam' || id === 'pinguin' || id === 'burunghantu';
  /* ----- badan ----- */
  const sy = id === 'pinguin' ? 1.16 : id === 'katak' ? .86 : 1;
  bb(.62, w, 0, .58, 0, 1, 1.05 * sy, .92, B);
  if (!J.tempurung) bb(.42, pr, 0, .52, .36, 1, 1.05 * sy, .55, B, 0);
  if (J.tempurung) { bb(.42, pr, 0, .55, .3, 1, 1.05, .6, B, 0);   /* perut kuning + tempurung berpola */
    bb(.74, a, 0, .74, -.24, 1, .84, .9, B, 1.05); const tm = M('#5FB86A');
    bb(.2, tm, 0, 1.36, -.32, 1, .32, 1, B, 0); for (let i = 0; i < 6; i++) { const s = i / 6 * 6.28; bb(.17, tm, Math.cos(s) * .42, .78 + Math.sin(s) * .32, -.82 + Math.abs(Math.cos(s)) * .2, 1, 1, .32, B, 0).rotation.y = Math.cos(s) * .5; }
    const rim = tb(.76, .12, M('#2F7A3A'), 0, .38, -.24, B, 1.04); rim.scale.z = .68; }
  if (J.bulu) { for (let i = 0; i < 10; i++) bb(.28, w, Math.cos(i * .628) * .52, .62 + Math.sin(i * .628) * .46, -.08, 1, 1, .9, B, 1.05); bb(.32, w, 0, .5, -.42, 1.2, 1, .7, B, 1.05); }
  if (id === 'panda') bb(.63, a, 0, .98, -.02, 1, .34, .93, B, 0);   /* pita hitam di bahu */
  if (J.loreng) for (const p of [1.0, 1.55, 2.1, 2.65]) for (const s of [-1, 1]) { const f = s * p; bb(.06, a, Math.sin(f) * .6, .66, Math.cos(f) * .55, 1, 3.3, 1, B, 0).rotation.y = f; }
  const bercak = (n, m, seed, sk = 1) => { const q = rng(seed); for (let i = 0; i < n; i++) { let f = (q() - .5) * 5.4; if (Math.abs(f) < .55) f += f < 0 ? -.7 : .7; const y = .3 + q() * .65, k = Math.sqrt(Math.max(.1, 1 - ((y - .58) / .65) ** 2));
    bb(.13 * sk * (.8 + q() * .5), m, Math.sin(f) * .6 * k, y, Math.cos(f) * .56 * k, 1, .85, .4, B, 0).rotation.y = f; } };
  if (id === 'sapi') bercak(5, a, 71, 1.6);
  if (id === 'jerapah') bercak(9, a, 73, 1.1);
  if (id === 'burunghantu') for (let i = 0; i < 6; i++) bb(.045, M('#8A6A4A'), (i % 3 - 1) * .16, .42 + Math.floor(i / 3) * .2, .56, 1.6, .7, .4, B, 0);
  if (id === 'sapi') bb(.11, M('#FFC83D'), 0, 1.0, .5, 1, 1, 1, B, 1.08);   /* lonceng */
  if (id === 'anjing') { const kl = tb(.48, .1, M('#E5484D'), 0, 1.08, .02, B, 1.06); kl.scale.z = .44; bb(.07, M('#FFC83D'), 0, .98, .48, 1, 1, .6, B, 1.1); }   /* kalung + plakat */
  /* ----- leher (jerapah) ----- */
  const leher = id === 'jerapah' ? .72 : 0;
  if (leher) { tb(.24, 1.2, w, 0, 1.45, .04, B); bb(.1, a, .2, 1.32, .14, 1, 1.4, .5, B, 0).rotation.y = .9; bb(.09, a, -.19, 1.68, .13, 1, 1.3, .5, B, 0).rotation.y = -.9; bb(.08, a, .03, 1.9, .24, 1, 1.1, .5, B, 0);
    for (let i = 0; i < 6; i++) balok(.07, .16, .14, a, 0, 1.05 + i * .2, -.23, B, 1.08); }
  /* ----- kepala ----- */
  const kep = new THREE.Group(); kep.position.y = 1.3 + leher + (id === 'pinguin' ? .12 : 0) - (id === 'katak' ? .12 : 0); B.add(kep);
  if (J.surai) { for (let i = 0; i < 14; i++) { const s = i * .449; bb(.32, a, Math.cos(s) * .66, .4 + Math.sin(s) * .62, -.14, 1, 1, .7, kep, 1.05); }
    for (let i = 0; i < 10; i++) { const s = i * .628 + .3; bb(.24, M('#C9783A'), Math.cos(s) * .5, .4 + Math.sin(s) * .48, -.02, 1, 1, .7, kep, 0); } }
  bb(.62, id === 'domba' ? a : w, 0, .4, 0, 1.08, .95, 1, kep);
  let ez = .54;   /* kedalaman mata */
  if (J.mukaMonyet) { for (const s of [-1, 1]) bb(.24, a, s * .17, .47, .42, 1, 1.1, .6, kep, 0); bb(.3, a, 0, .25, .44, 1.25, .78, .62, kep, 0); ez = .6; }
  if (id === 'pinguin') { for (const s of [-1, 1]) bb(.26, putih, s * .2, .43, .4, 1, 1.2, .62, kep, 0); bb(.33, putih, 0, .24, .4, 1.3, .78, .66, kep, 0); ez = .6; }
  if (J.topeng) { bb(.48, putih, 0, .34, .3, 1.15, .76, .7, kep, 0); bb(.2, a, 0, .5, .44, 2.6, .78, .72, kep, 0); bb(.07, a, 0, .66, .52, 1, 2.4, .5, kep, 0); ez = .6; }
  if (id === 'burunghantu') { for (const s of [-1, 1]) bb(.3, a, s * .22, .45, .4, 1, 1, .5, kep, 0); bb(.08, M('#6A4A2E'), 0, .62, .52, 1, 2.2, .5, kep, 0); }
  if (id === 'harimau' || id === 'rubah' || id === 'singa') for (const s of [-1, 1]) bb(.22, pr, s * .3, .24, .4, 1, .78, .7, kep, 0);   /* pipi putih */
  if (id === 'anjing') bb(.21, a, .24, .5, .42, 1, 1.1, .6, kep, 0);   /* belang di satu mata */
  if (id === 'sapi') bb(.24, a, -.32, .62, .3, 1, .9, .6, kep, 0);
  if (id === 'jerapah') { bb(.12, a, .36, .7, .26, 1, .8, .5, kep, 0); bb(.1, a, -.3, .82, .2, 1, .8, .5, kep, 0); }
  if (J.loreng) { for (const x of [-.13, 0, .13]) bb(.045, a, x, .82, .41, 1, 2.4 - Math.abs(x) * 6, .6, kep, 0); for (const s of [-1, 1]) for (const y of [.42, .3]) bb(.035, a, s * .6, y, .18, 2.6, 1, 1, kep, 0); }
  /* mata */
  for (const s of [-1, 1]) {
    if (J.t !== 'mata') { if (J.mataBesar) bb(.2, putih, s * .25, .5, .5, 1, 1, .4, kep, 1.08);
    if (id === 'domba' || id === 'panda') bb(.13, putih, s * .24, .48, ez - .02, 1, 1.2, .5, kep, 0);
    if (J.hitam) bb(.17, a, s * .24, .46, .48, 1.1, 1.35, .5, kep, 0);
    bb(.1, gelap, s * .24, .48, J.mataBesar ? .6 : ez, 1, 1.25, .6, kep, 0);
    bb(.035, putih, s * .24 + .03, .53, (J.mataBesar ? .6 : ez) + .06, 1, 1, 1, kep, 0); }
    const p = new THREE.Mesh(_GB, BASIC('#FF7E9A', {transparent: true, opacity: .5})); p.scale.set(.12, .06, .03); p.position.set(s * .42, .26, .48); kep.add(p);
    if (J.gembul) bb(.24, M('#FFF1DA'), s * .4, .2, .36, 1, .85, .8, kep, 1.06); }
  /* moncong, hidung, mulut */
  const MZ = (m, sx, sy2, sz, y = .27, z = .5) => bb(.26, m, 0, y, z, sx, sy2, sz, kep, 1.05);
  const hd = (rr, m, y, z, sx = 1.3, sy2 = .9) => bb(rr, m, 0, y, z, sx, sy2, .8, kep, 0);
  const kumis = (y, z, L = .42) => { for (const s of [-1, 1]) for (const dy of [.04, -.04]) { const km = tb(.008, L, gelap, s * .38, y + dy, z, kep, 0); km.rotation.z = Math.PI / 2 + s * dy * 3; } };
  const gigi = (y, z) => balok(.1, .1, .03, putih, 0, y, z, kep, 1.12);
  const mulutJ = (y, z, rr = .07) => senyum(kep, rr, y, z, gelap);
  if (id === 'beruang' || id === 'panda') { MZ(id === 'panda' ? putih : a, 1.12, .8, .78); hd(.09, gelap, .35, .69); mulutJ(.19, .67); }
  else if (id === 'koala') { hd(.15, M('#3A3A48'), .3, .6, .9, 1.35); mulutJ(.1, .58, .06); }
  else if (id === 'anjing') { MZ(pr, 1.05, .78, 1.1, .26, .52); hd(.1, gelap, .35, .8); mulutJ(.17, .74, .08); bb(.07, M('#FF6A8A'), 0, .12, .74, 1, .5, .6, kep, 0); }
  else if (id === 'rubah') { MZ(pr, .9, .68, 1.4, .25, .52); hd(.07, gelap, .3, .87); mulutJ(.17, .8, .06); }
  else if (id === 'kucing' || id === 'harimau' || id === 'singa') { for (const s of [-1, 1]) bb(.13, pr, s * .1, .26, .55, 1, .85, .8, kep, 0); bb(.06, id === 'singa' ? M('#6A3A2A') : pink, 0, .34, .63, 1.4, .8, .8, kep, 0); mulutJ(.17, .6, .05); kumis(.27, .58); }
  else if (id === 'tikus') { MZ(w, .82, .72, 1.3, .27, .52); hd(.06, pink, .3, .85); gigi(.15, .74); kumis(.28, .7, .5); }
  else if (id === 'kelinci' || id === 'hamster') { for (const s of [-1, 1]) bb(.12, pr, s * .09, .26, .55, 1, .85, .8, kep, 0); hd(.055, pink, .34, .63); gigi(.15, .6); if (id === 'kelinci') kumis(.27, .58, .34); }
  else if (J.moncong) { const sn = tb(.21, .16, a, 0, .28, .6, kep, 1.08); sn.rotation.x = Math.PI / 2; for (const s of [-1, 1]) bb(.04, M('#C25A72'), s * .07, .28, .69, 1, 1.3, .5, kep, 0); mulutJ(.1, .58, .06); }
  else if (id === 'sapi') { MZ(M('#FFB3C1'), 1.3, .82, .8, .2, .5); for (const s of [-1, 1]) bb(.05, gelap, s * .12, .23, .7, 1, 1.3, .6, kep, 0); }
  else if (id === 'jerapah') { MZ(pr, 1.12, .82, .85, .22, .5); for (const s of [-1, 1]) bb(.035, gelap, s * .09, .28, .72, 1, 1.4, .6, kep, 0); mulutJ(.12, .7, .06); }
  else if (id === 'domba') { MZ(M('#6E5E5E'), .9, .7, .7, .24, .52); hd(.05, M('#2B2238'), .3, .7); mulutJ(.16, .69, .05); }
  else if (id === 'monyet') { for (const s of [-1, 1]) bb(.03, gelap, s * .06, .3, .66, 1, 1.3, .6, kep, 0); mulutJ(.17, .64, .08); }
  else if (id === 'rakun') { MZ(putih, .9, .7, 1.1, .26, .5); hd(.075, gelap, .33, .79); mulutJ(.17, .73, .05); kumis(.27, .64, .36); }
  else if (id === 'katak') { const mk = mulutJ(.24, .6, .24); mk.scale.y = .13; mk.scale.z = .1; }
  else if (id === 'kurakura') { mulutJ(.2, .6, .12); }
  else if (J.belalai) { let y = .3, z = .6; for (let i = 0; i < 7; i++) { bb(.15 - i * .012, w, 0, y, z, 1, 1, 1, kep, 1.08); y -= i < 4 ? .13 : -.08; z += .07; }
    for (const s of [-1, 1]) { const ga = kk(.05, .24, putih, s * .2, .12, .5, kep); ga.rotation.x = 1.9; } mulutJ(.08, .5, .06); }
  if (id === 'bebek') { bb(.2, oranye, 0, .27, .66, 1.35, .36, 1.2, kep, 1.08); bb(.16, M('#F07A20'), 0, .19, .62, 1.2, .26, 1.05, kep, 0); for (let k = 0; k < 3; k++) bb(.08, w, (k - 1) * .06, 1.02 + (k === 1 ? .06 : 0), .05, 1, 1.6, 1, kep, 1.1); }
  if (id === 'ayam') { kk(.09, .24, M('#FFB02E'), 0, .3, .7, kep).rotation.x = Math.PI / 2; bb(.08, M('#FF4D4D'), 0, .14, .62, 1, 1.5, .8, kep, 1.08); }
  if (id === 'pinguin') { kk(.08, .26, oranye, 0, .3, .7, kep).rotation.x = Math.PI / 2; }
  if (id === 'burunghantu') { kk(.07, .2, M('#E8A23A'), 0, .32, .62, kep).rotation.x = 2.1; }
  /* telinga */
  for (const s of [-1, 1]) { const tw = J.t;
    if (tw === 'panjang') { const e = bb(.15, w, s * .2, 1.15, -.05, 1, 3, .7, kep); e.rotation.z = -s * .12; bb(.08, a, s * .21, 1.15, .04, 1, 2.6, .4, kep, 0).rotation.z = -s * .12; }
    else if (tw === 'bulat') { bb(id === 'hamster' ? .15 : .2, J.hitam ? a : (J.surai ? a : w), s * .45, .88, -.05, 1, 1, .6, kep); bb(id === 'hamster' ? .09 : .11, J.hitam ? a : id === 'hamster' ? pink : pr, s * .45, .87, .04, 1, 1, .4, kep, 0); }
    else if (tw === 'besar') { const bs = id === 'koala' ? .36 : .3; bb(bs, w, s * .54, .82, -.05, 1, 1, .45, kep); bb(bs * .62, a, s * .54, .82, .04, 1, 1, .3, kep, 0); }
    else if (tw === 'kecil') { const e = kk(.17, .32, w, s * .36, .92, .06, kep); e.rotation.set(.55, 0, -s * .35); }
    else if (tw === 'runcing') { const eg = new THREE.Group(); eg.position.set(s * .37, .86, 0); eg.rotation.z = -s * .2; kep.add(eg);
      kk(.2, .5, w, 0, .25, 0, eg); kk(.12, .32, id === 'kucing' ? pink : id === 'rubah' ? M('#FFF6EA') : putih, 0, .2, .1, eg, 0); if (id === 'rubah') kk(.09, .17, gelap, 0, .43, 0, eg, 1.08); }
    else if (tw === 'mata') { bb(.2, w, s * .26, .85, .2, 1, 1, 1, kep); bb(.12, putih, s * .26, .87, .33, 1, 1, .5, kep, 0); bb(.08, gelap, s * .26, .88, .38, 1, 1.1, .5, kep, 0); bb(.03, putih, s * .26 + .03, .92, .43, 1, 1, 1, kep, 0); }
    else if (tw === 'tanduk') { const e = kk(.08, .32, M('#FFE9A8'), s * .3, 1.0, 0, kep); e.rotation.z = -s * .35; bb(.13, w, s * .58, .7, 0, 1.5, .6, .6, kep).rotation.z = s * .3; }
    else if (tw === 'jengger' && s > 0) { for (let k = 0; k < 3; k++) bb(.11, a, 0, 1.0 + Math.sin(k) * .05, -.15 + k * .15, 1, 1.2, 1, kep, 1.1); }
    else if (tw === 'lipat') { const e = bb(.2, a, s * .52, .6, 0, .6, 1.5, .85, kep); e.rotation.z = s * .3; }
    else if (tw === 'gajah') { const e = bb(.5, w, s * .7, .42, -.08, .3, 1.15, 1.05, kep); e.rotation.y = -s * .3; bb(.34, a, s * .74, .42, -.02, .24, .9, .8, kep, 0).rotation.y = -s * .3; }
    else if (tw === 'osikon') { const e = tb(.05, .35, w, s * .2, 1.12, 0, kep); e.rotation.z = -s * .15; bb(.09, a, s * .23, 1.3, 0, 1, 1, 1, kep, 1.1); bb(.13, w, s * .55, .78, 0, 1.5, .6, .6, kep).rotation.z = s * .3; }
    else if (tw === 'jumbai') { const e = kk(.13, .4, w, s * .36, 1.0, 0, kep); e.rotation.z = -s * .35; }
    else if (tw === 'samping') { bb(.22, w, s * .64, .45, 0, .6, 1, 1, kep); bb(.13, a, s * .66, .45, .04, .5, 1, 1, kep, 0); } }
  if (id === 'domba') { for (let i = 0; i < 7; i++) { const s = i / 7 * 6.28; bb(.18, w, Math.cos(s) * .34, .92 + Math.sin(s * 2) * .03, Math.sin(s) * .3 - .04, 1, .9, 1, kep, 1.05); } bb(.2, w, 0, 1.02, .02, 1, .9, 1, kep, 1.05); }
  /* ----- kaki ----- */
  const kakiM = J.hitam || J.topeng || id === 'domba' ? a : id === 'rubah' ? M('#5A3A2A') : w;
  for (const s of [-1, 1]) {
    if (id === 'bebek' || id === 'pinguin') bb(.16, oranye, s * .28, -.08, .22, 1.25, .35, 1.6, B);
    else if (id === 'katak') { bb(.17, w, s * .32, -.06, .2, 1.3, .45, 1.5, B); for (let k = 0; k < 3; k++) bb(.06, w, s * .32 + (k - 1) * .11, -.08, .42, 1, .6, 1, B, 1.1); }
    else if (id === 'ayam' || id === 'burunghantu') { tb(.04, .2, M('#FFB02E'), s * .26, .02, .1, B, 1.15); for (let k = 0; k < 3; k++) { const tj = bb(.045, M('#FFB02E'), s * .26 + (k - 1) * .07, -.09, .2, 1, .6, 2.6, B, 1.1); tj.rotation.y = (k - 1) * .4; } }
    else if (id === 'sapi' || id === 'domba' || id === 'jerapah' || id === 'babi') { bb(.15, kakiM, s * .3, .03, .14, 1, .8, 1.15, B); tb(.13, .12, M('#4A3A3A'), s * .3, -.09, .15, B, 1.08); }
    else if (id === 'gajah') { tb(.2, .32, w, s * .3, .02, .14, B, 1.06); for (let k = 0; k < 3; k++) bb(.045, putih, s * .3 + (k - 1) * .1, -.08, .33, 1, .8, .6, B, 0); }
    else if (id === 'kurakura') bb(.17, w, s * .34, -.02, .16, 1.1, .7, 1.2, B);
    else { bb(.16, kakiM, s * .3, -.02, .14, 1, .7, 1.3, B); if (id === 'kelinci') bb(.15, kakiM, s * .3, -.06, .3, .9, .4, 1.4, B, 0); } }
  /* ----- lengan / sayap ----- */
  const armM = J.hitam ? a : id === 'domba' ? w : w, tanganM = J.hitam || J.topeng || id === 'domba' ? a : id === 'monyet' ? a : id === 'rubah' ? M('#5A3A2A') : id === 'pinguin' ? w : w;
  const lg = [-1, 1].map(s => { const l = lengan(B, s, .55, .98, .2, .46, armM, tanganM);
    if (burung) { const sp = bb(.2, w, s * .03, -.26, -.08, .42, 1.55, 1.15, l, 1.06); sp.rotation.z = s * .1; if (id === 'burunghantu') bb(.1, M('#7A5A3A'), s * .04, -.5, -.08, .4, 1.2, 1, l, 0); }
    return l; });
  /* ----- ekor (bergoyang) ----- */
  const ekor = new THREE.Group(); ekor.position.set(0, .42, -.48); B.add(ekor);
  const rantai = (n, f, m, tp = 1.08) => { for (let i = 0; i < n; i++) { const u = i / (n - 1), [x, y, z, rr] = f(u); bb(rr, typeof m === 'function' ? m(i) : m, x, y, z, 1, 1, 1, ekor, tp); } };
  switch (id) {
    case 'kelinci': bb(.2, putih, 0, .06, -.06, 1, 1, 1, ekor); break;
    case 'beruang': case 'panda': case 'koala': case 'hamster': bb(.1, id === 'beruang' ? w : putih, 0, .02, -.04, 1, 1, 1, ekor); break;
    case 'rubah': bb(.27, w, 0, .12, -.36, .85, .85, 1.55, ekor).rotation.x = .5; bb(.17, putih, 0, .36, -.74, 1, 1, 1.1, ekor); break;
    case 'kucing': rantai(9, u => [0, u * .85, -.06 - Math.sin(u * 1.7) * .42, .065], w); break;
    case 'harimau': rantai(10, u => [0, u * .8, -.06 - Math.sin(u * 1.7) * .46, .075], i => i % 2 ? a : w); break;
    case 'singa': rantai(8, u => [0, u * .5 - .1, -.06 - u * .5, .045], w); bb(.12, a, 0, .45, -.6, 1, 1.2, 1, ekor); break;
    case 'anjing': rantai(6, u => [0, u * .6, -.04 - Math.sin(u * 1.4) * .26, .085 - u * .02], w); break;
    case 'babi': { const c = new THREE.Mesh(new THREE.TorusGeometry(.1, .035, 6, 14, Math.PI * 1.7), w); c.rotation.y = Math.PI / 2; c.position.z = -.08; garis(c, 1.15); ekor.add(c); break; }
    case 'sapi': case 'jerapah': case 'gajah': rantai(6, u => [0, -u * .55, -.04 - u * .12, .04], w); bb(.09, id === 'gajah' ? M('#5A5A6A') : id === 'jerapah' ? a : gelap, 0, -.62, -.18, 1, 1.5, 1, ekor); break;
    case 'monyet': rantai(14, u => { const q = u * 4.4; return [0, -.1 + u * .7 + (u > .6 ? Math.sin((u - .6) * 9) * .15 : 0), -.08 - u * .55 + (u > .6 ? Math.cos((u - .6) * 9) * .12 - .12 : 0), .07]; }, w); break;
    case 'rakun': rantai(7, u => [0, .05 + u * .38, -.14 - u * .58, .17 - u * .035], i => i % 2 ? a : w); break;
    case 'tikus': rantai(12, u => [Math.sin(u * 6) * .12, -.32 + u * .3 + Math.sin(u * 3) * .12, -.05 - u * .7, .035], pink); break;
    case 'ayam': for (let k = 0; k < 3; k++) { const b2 = bb(.14, w, (k - 1) * .13, .3, -.08, .55, 1.7, .5, ekor, 1.06); b2.rotation.set(-.5, 0, (k - 1) * -.5); } break;
    case 'bebek': kk(.12, .26, w, 0, .12, -.08, ekor).rotation.x = -.9; break;
    case 'pinguin': bb(.1, w, 0, -.15, -.02, 1.2, .6, 1, ekor); break;
    case 'burunghantu': bb(.16, w, 0, -.08, -.06, 1.25, .5, 1.3, ekor); break;
    case 'domba': bb(.15, w, 0, .08, -.02, 1, 1, 1, ekor, 1.05); break;
    case 'kurakura': kk(.06, .16, w, 0, -.15, -.04, ekor).rotation.x = -2; break; }
  hiasWarga(B, kep, J, o, w);
  const bayang = new THREE.Mesh(new THREE.CircleGeometry(.75, 20), new THREE.MeshBasicMaterial({color: 0x2B2238, transparent: true, opacity: .18, depthWrite: false}));
  bayang.rotation.x = -Math.PI / 2; bayang.position.y = -.12; g.add(bayang);
  g.userData = {B, kep, lg, ekor, jenis: J, r: r(), r2: r(), r3: r(), lahir: -99, atas: 3.05 + leher}; return g; }

/* ===== pilihan tampilan warga ber-KTP: warna, kelamin, rambut, aksesori ===== */
const WARNA_BULU = ['#FF8A8A', '#FFB347', '#FFE066', '#9BE36B', '#6FD6C4', '#7FC8FF', '#8F9BFF', '#C69CFF', '#FF9AD5', '#FFFFFF', '#B8B8C8', '#8B5A3C', '#3A3A48'];
const WARNA_RAMBUT = ['#2B2238', '#5A3A22', '#B5652A', '#F2D06B', '#FF8FB8', '#6FA8FF', '#FFFFFF', '#9BE36B'];
const RAMBUT = [{id: 'none', n: 'Tanpa', e: '⭕'}, {id: 'jambul', n: 'Jambul', e: '🌀'}, {id: 'poni', n: 'Poni', e: '💇'}, {id: 'kuncir', n: 'Kuncir dua', e: '🎀'},
  {id: 'panjang', n: 'Panjang', e: '👱'}, {id: 'keriting', n: 'Keriting', e: '🌸'}, {id: 'mohawk', n: 'Mohawk', e: '🦔'}, {id: 'sanggul', n: 'Sanggul', e: '🍡'}];
const AKSESORI = [{id: 'kacamata', n: 'Kacamata', e: '👓'}, {id: 'kacamatahitam', n: 'Kacamata hitam', e: '🕶️'}, {id: 'pita', n: 'Pita', e: '🎀'}, {id: 'mahkota', n: 'Mahkota', e: '👑'},
  {id: 'kupluk', n: 'Kupluk', e: '🧢'}, {id: 'topipet', n: 'Topi pet', e: '⛑️'}, {id: 'syal', n: 'Syal', e: '🧣'}, {id: 'dasi', n: 'Dasi kupu', e: '🎩'},
  {id: 'kalung', n: 'Kalung', e: '📿'}, {id: 'bunga', n: 'Bunga', e: '🌼'}, {id: 'headphone', n: 'Headphone', e: '🎧'}, {id: 'tas', n: 'Tas', e: '🎒'}];
function hiasWarga(B, kep, J, o, w) { const gelap = M('#1E1A2A');
  /* kelamin: alis (laki-laki) atau bulu mata (perempuan) */
  for (const s of [-1, 1]) {
    if (o.kelamin === 'L') { const al = balok(.2, .05, .05, gelap, s * .25, .66, .55, kep, 0); al.rotation.z = -s * .15; }
    if (o.kelamin === 'P') for (let i = 0; i < 3; i++) { const bm = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .12, 5), gelap); bm.position.set(s * (.24 + (i - 1) * .07), .62, .55); bm.rotation.z = s * (.3 + (i - 1) * .45); kep.add(bm); } }
  /* rambut */
  const hc = M(o.warnaRambut || '#5A3A22'), rb = o.rambut || 'none';
  if (rb === 'jambul') { for (let i = 0; i < 3; i++) bola(.16, hc, (i - 1) * .13, 1.0, .12, 1, 1.2, 1, kep); bola(.14, hc, 0, 1.12, .28, 1, 1, 1, kep); }
  else if (rb === 'poni') { for (let i = 0; i < 5; i++) bola(.15, hc, (i - 2) * .17, .86 - Math.abs(i - 2) * .05, .45 - Math.abs(i - 2) * .06, 1, .8, .8, kep); bola(.6, hc, 0, .62, -.05, 1.08, .7, 1.02, kep); }
  else if (rb === 'kuncir') { bola(.6, hc, 0, .62, -.05, 1.08, .7, 1.02, kep); for (const s of [-1, 1]) { bola(.22, hc, s * .72, .52, -.12, 1, 1.25, 1, kep); bola(.08, M('#FF5C7A'), s * .62, .62, -.1, 1, 1, 1, kep); } }
  else if (rb === 'panjang') { bola(.62, hc, 0, .6, -.06, 1.1, .75, 1.04, kep); bola(.58, hc, 0, .1, -.32, 1.12, 1.25, .55, kep); }
  else if (rb === 'keriting') { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; bola(.2, hc, Math.cos(a) * .42, .95 + Math.sin(i * 2.1) * .06, Math.sin(a) * .36 - .05, 1, 1, 1, kep); } bola(.24, hc, 0, 1.08, 0, 1, 1, 1, kep); }
  else if (rb === 'mohawk') { for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.11, .34, 6), hc); c.position.set(0, 1.08 - Math.abs(i - 1.5) * .05, .28 - i * .2); c.rotation.x = -.3 + i * .15; garis(c, 1.1); kep.add(c); } }
  else if (rb === 'sanggul') { bola(.6, hc, 0, .62, -.05, 1.08, .7, 1.02, kep); bola(.26, hc, 0, 1.14, -.12, 1, 1, 1, kep); }
  /* aksesori (maks 3) */
  for (const ak of (o.aksesori || []).slice(0, 3)) {
    if (ak === 'kacamata') { const km = M('#3A2A4A'); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.17, .045, 8, 24), km); r.position.set(s * .24, .48, .68); kep.add(r); } balok(.16, .045, .045, km, 0, .5, .7, kep, 0); }
    else if (ak === 'kacamatahitam') { for (const s of [-1, 1]) bola(.17, M('#22202E'), s * .24, .48, .6, 1.15, .85, .3, kep, 1.06); balok(.18, .04, .04, M('#22202E'), 0, .52, .64, kep, 0); }
    else if (ak === 'pita') { const pm = M('#FF5C7A'); for (const s of [-1, 1]) bola(.15, pm, .32 + s * .14, 1.0, .18, 1.1, .8, .5, kep, 1.08); bola(.07, pm, .32, 1.0, .22, 1, 1, 1, kep, 1.1); }
    else if (ak === 'mahkota') { const em = M('#FFC83D'); const c = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .22, 16, 1, true), em); c.position.set(0, 1.08, 0); garis(c, 1.06); kep.add(c);
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; bola(.06, M('#FF5C7A'), Math.cos(a) * .29, 1.24, Math.sin(a) * .29, 1, 1, 1, kep, 1.1); } }
    else if (ak === 'kupluk') { bola(.6, M('#6FA8FF'), 0, .72, -.02, 1.1, .7, 1.05, kep); bola(.14, M('#FFFFFF'), 0, 1.22, -.02, 1, 1, 1, kep); balok(1.26, .14, 1.0, M('#FFFFFF'), 0, .62, -.02, kep, 0).scale.set(1, 1, 1); }
    else if (ak === 'topipet') { bola(.58, M('#E5484D'), 0, .76, -.04, 1.08, .62, 1.05, kep); const v = balok(.7, .05, .42, M('#E5484D'), 0, .76, .62, kep, 1.08); v.rotation.x = .12; }
    else if (ak === 'syal') { const sy = M('#E5484D'); const t = new THREE.Mesh(new THREE.TorusGeometry(.46, .12, 10, 28), sy); t.rotation.x = Math.PI / 2; t.position.set(0, 1.15, 0); garis(t, 1.06); B.add(t); balok(.22, .5, .1, sy, .22, .85, .5, B, 1.06); }
    else if (ak === 'dasi') { const dm = M('#3C6CD6'); for (const s of [-1, 1]) { const d = bola(.12, dm, s * .13, 1.12, .52, 1.2, .8, .5, B, 1.08); } bola(.06, dm, 0, 1.12, .56, 1, 1, 1, B, 1.1); }
    else if (ak === 'kalung') { const t = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 8, 28), M('#FFC83D')); t.rotation.x = Math.PI / 2 - .25; t.position.set(0, 1.1, .05); B.add(t); bola(.08, M('#7FC8FF'), 0, .97, .48, 1, 1.2, .6, B, 1.1); }
    else if (ak === 'bunga') { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; bola(.08, M('#FFFFFF'), -.42 + Math.cos(a) * .1, .92 + Math.sin(a) * .1, .3, 1, 1, .5, kep, 1.1); } bola(.06, M('#FFC83D'), -.42, .92, .34, 1, 1, 1, kep, 0); }
    else if (ak === 'headphone') { const hm = M('#3A3A48'); const t = new THREE.Mesh(new THREE.TorusGeometry(.66, .05, 8, 24, Math.PI), hm); t.position.set(0, .4, 0); kep.add(t); for (const s of [-1, 1]) bola(.17, M('#FF5C7A'), s * .66, .4, 0, .6, 1, 1, kep, 1.08); }
    else if (ak === 'tas') { balok(.7, .7, .3, M('#FFB347'), 0, .75, -.66, B, 1.05); balok(.5, .2, .06, M('#E8742A'), 0, .6, -.82, B, 0); } } }


/* papan nama di atas kepala warga ber-KTP */
function papanNama(teks, y = 3.05) { const c = kanvas(512, 128), x = c.getContext('2d'); x.font = "700 64px 'Fredoka', sans-serif";
  const w = Math.min(500, x.measureText(teks).width + 60); x.fillStyle = '#FFFFFF'; x.strokeStyle = '#2B2238'; x.lineWidth = 8;
  x.beginPath(); x.roundRect((512 - w) / 2, 18, w, 92, 46); x.fill(); x.stroke(); x.fillStyle = '#2B2238'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(teks, 256, 66, 460);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, transparent: true, depthWrite: false})); s.scale.set(2.2, .55, 1); s.position.y = y; return s; }

/* tempat berdiri warga: melingkari api unggun di tengah kota (celah ke arah depan supaya Joko & Agus terlihat) */
const PALEM = [[-4.4, 23.6], [6.5, 21], [-9, 18], [11, 14], [-14, 10], [3, 15], [-6, 8], [15, 3], [-24, 12], [22, 12]];
const BUKIT = [[0, -2, 17], [-11, 4, 9], [12, 2, 10], [-3, -14, 12], [8, -10, 8]];
const TEMPAT = (() => { const p = [];
  [4.6, 6.6, 8.7, 10.6, 16.2, 18.4, 20.6, 22.8, 25].forEach((rr, k) => { const n = Math.floor(rr * 6.283 / 2.3);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rr, x = PUSAT_KOTA[0] + Math.cos(a) * rr, z = PUSAT_KOTA[1] + Math.sin(a) * rr;
      if (CELAH(a) || Math.hypot(x - PUSAT[0], z - PUSAT[1]) < 3.2 || Math.hypot(x - KAS_POS[0], z - KAS_POS[1]) < 2.6) continue;
      if (Math.hypot(x - LUMBUNG_POS[0], z - LUMBUNG_POS[1]) < 5 || Math.hypot(x - KEBUN_POS[0], z - KEBUN_POS[1]) < 8 || pantaiS(x, z) < 4) continue;
      p.push([x, z, k * 1000 + i]); } });
  return p.sort((a, b) => a[2] - b[2]); })();
/* bangunan Kota Bhinneka (hasil akhir Part 2) + rakit warga di pantai */
letakGerbang(1); letakLumbung(1, 1); letakKebun(1); letakTenda(1);
KELAPA_K.forEach((g, i) => KELAPA.push(Object.assign(g, {px: KELAPA_KOTA[i][0], pz: KELAPA_KOTA[i][1], tinggi: 8.5})));
/* benda padat untuk mode jalan-jalan: [x, z, jari-jari] */
const BENDA = [...[-1, 1].map(s => [GERBANG_POS[0] + FK.x * s * 3.7, GERBANG_POS[1] + FK.z * s * 3.7, 1.1]), [LUMBUNG_POS[0], LUMBUNG_POS[1], 3.1],
  ...TENDA.map(g => [g.position.x, g.position.z, 1.9]), [PUSAT_KOTA[0], PUSAT_KOTA[1], 1.8], ...KELAPA_KOTA.map(([x, z]) => [x, z, 1.1])];
const MAKS_TAMPIL = Math.min(TEMPAT.length, HP ? 60 : 110);
const WARGA = [];   // objek yang tampil (urutan = urutan tempat)

/* Joko & Agus di depan papan, seperti akhir video */
function letakTokoh(t) {
  JOKO.root.scale.setScalar(SKALA_TOKOH); AGUS.root.scale.setScalar(SKALA_TOKOH);
  const jx = PUSAT[0] - 1.4, gx = PUSAT[0] + 1.4, z = PUSAT[1];
  pose(JOKO, {t, x: jx, y: tinggi(jx, z) + JOKO.alas * SKALA_TOKOH + Math.abs(Math.sin(t * 3)) * .12, z, yaw: .1, senang: .9, la: [[0, .2], lambai(t, .6 + .4 * Math.max(0, Math.sin(t * .7)))]});
  pose(AGUS, {t, x: gx, y: tinggi(gx, z) + AGUS.alas * SKALA_TOKOH + Math.abs(Math.sin(t * 3 + 1)) * .12, z, yaw: -.1, senang: .9, la: [[0, .2], [0, .2 + Math.max(0, Math.sin(t * .9 + 1)) * 1.6]]}); }

/* ================= DATA ================= */
let CFG = {nilai_koin: {follow: 500, like: 100, share: 1000, repost: 2000, saweria: 5000}, followers_awal: 0, saweria: 0, instagram_url: ''};
let DATA = null, WARGA_N = -1, KTP_N = -1;
const fmt = n => Math.round(n).toLocaleString('id-ID');
const nomorKtp = no => 'KB-' + String(no).padStart(5, '0');
function hitung(d) { const v = CFG.nilai_koin, ktp = d.ktp || [], ktpTotal = d.ktp_total || ktp.length, keluar = (CFG.pengeluaran || []).reduce((s, p) => s + (+p.koin || 0), 0);
  const pengikut = Math.max(0, (d.followers || 0) - (CFG.followers_awal || 0)), warga = pengikut + ktpTotal, saw = (d.saweria != null ? d.saweria : CFG.saweria) || 0;
  const rinci = [['Follow', pengikut, v.follow], ['Like', d.likes || 0, v.like], ['Share', d.shares || 0, v.share], ['Repost', d.reposts || 0, v.repost], ['Saweria', saw, v.saweria]];
  const masuk = rinci.reduce((s, [, n, k]) => s + n * k, 0); return {warga, ktp, ktpTotal, masuk, keluar, kas: masuk - keluar, rinci}; }

/* daftar yang tampil: warga ber-KTP dulu (dekat Joko), lalu warga acak */
function daftarTampil(h) { const L = h.ktp.slice().sort((a, b) => a.no - b.no).map(k => ({kunci: 'k' + k.no + JSON.stringify(opsiKtp(k)), J: JENIS_ID[k.jenis] || JENIS[0], nama: k.nama, seed: k.no * 131 + 7, o: opsiKtp(k)}));
  for (let i = 0; L.length < Math.min(h.warga, MAKS_TAMPIL); i++) { const r = rng(i * 7919 + 13); L.push({kunci: 'a' + i, J: JENIS[Math.floor(r() * JENIS.length)], seed: i * 7919 + 13}); }
  return L.slice(0, MAKS_TAMPIL); }

let tAnim = 0;
function terapkan(d, awal) { DATA = d; const h = hitung(d), L = daftarTampil(h);
  const lama = new Map(WARGA.map(g => [g.userData.kunci, g])); WARGA.length = 0;
  L.forEach((it, i) => { let g = lama.get(it.kunci);
    if (g) lama.delete(it.kunci);
    else { g = buatBinatang(it.J, rng(it.seed), it.o || {}); g.scale.setScalar(SKALA_WARGA); g.userData.kunci = it.kunci; g.userData.lahir = awal ? -99 : tAnim + (WARGA.length % 12) * .2;
      if (it.nama) g.add(papanNama(it.nama, g.userData.atas)); scene.add(g); }
    g.userData.slot = i; WARGA.push(g); });
  lama.forEach(g => scene.remove(g));
  const kabar = [];
  if (!awal && WARGA_N >= 0 && h.warga > WARGA_N) kabar.push(`+${fmt(h.warga - WARGA_N)} warga baru! 🎉`);
  if (!awal && KTP_N >= 0 && h.ktpTotal > KTP_N) kabar.push(`+${fmt(h.ktpTotal - KTP_N)} KTP baru! 🪪`);
  if (kabar.length) toast(kabar.join('  ·  '));
  WARGA_N = h.warga; KTP_N = h.ktpTotal;
  isiPanel(d, h); }

function isiPanel(d, h) {
  $('#nWarga').textContent = fmt(h.warga); $('#nKas').textContent = fmt(h.kas); $('#nKtp').textContent = fmt(h.ktpTotal);
  $('#rinci').innerHTML = ''; h.rinci.forEach(([nama, n, k]) => { const tr = document.createElement('tr');
    [nama, `${fmt(n)} × ${fmt(k)}`, fmt(n * k)].forEach((s, i) => { const td = document.createElement('td'); td.textContent = s; if (i === 2) td.className = 'kn'; tr.appendChild(td); }); $('#rinci').appendChild(tr); });
  const baris = (tb, sel, kelas) => { const tr = document.createElement('tr'); if (kelas) tr.className = kelas; sel.forEach((s, i) => { const td = document.createElement('td'); td.textContent = s; if (i === sel.length - 1) td.className = 'kn'; tr.appendChild(td); }); tb.appendChild(tr); };
  baris($('#rinci'), ['Total pemasukan', '', fmt(h.masuk)], 'total');
  const tk = $('#keluar'); tk.innerHTML = ''; (CFG.pengeluaran || []).forEach(p => baris(tk, [p.nama, '−' + fmt(+p.koin || 0)]));
  if (!(CFG.pengeluaran || []).length) baris(tk, ['Belum ada pengeluaran', '0']);
  baris(tk, ['Sisa kas', fmt(h.kas)], 'total');
  const ul = $('#usulan'); ul.innerHTML = ''; (d.usulan || []).slice(0, 5).forEach((u, i) => { const li = document.createElement('li');
    const n = document.createElement('span'); n.className = 'un'; n.textContent = u.nama; const l = document.createElement('span'); l.className = 'ul'; l.textContent = `❤ ${fmt(u.like || 0)}`;
    li.append(n, l); if (i === 0) li.className = 'top'; ul.appendChild(li); });
  if (!(d.usulan || []).length) { const li = document.createElement('li'); li.className = 'kosong'; li.textContent = 'Belum ada usulan. Tulis di komentar: mau bangun apa lagi?'; ul.appendChild(li); }
  const wb = $('#wargaBaru'); wb.innerHTML = '';
  h.ktp.slice().sort((a, b) => b.no - a.no).slice(0, 8).forEach(k => { const s = document.createElement('span'); s.className = 'chip'; const J = JENIS_ID[k.jenis] || JENIS[0];
    s.textContent = `${J.e} ${k.nama} · ${nomorKtp(k.no)}`; wb.appendChild(s); });
  if (!h.ktp.length) wb.textContent = 'Belum ada warga ber-KTP. Jadilah yang pertama!';
  $('#lebih').textContent = h.warga > MAKS_TAMPIL ? `(${fmt(MAKS_TAMPIL)} warga tampil di kota, ${fmt(h.warga - MAKS_TAMPIL)} lainnya sedang menjelajah pulau)` : '';
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

/* ================= KTP WARGA (fiktif, untuk permainan) ================= */
const KTP_SIMPAN = 'ktp_kota_binatang';
const ktpUrl = () => CFG.data_url ? CFG.data_url.replace(/data\.json.*$/, 'ktp') : '';
const PIL = {jenis: null, kelamin: 'L', warna: '', rambut: 'none', warnaRambut: WARNA_RAMBUT[1], aksesori: []};
const opsiPil = () => ({kelamin: PIL.kelamin, warna: PIL.warna, rambut: PIL.rambut, warnaRambut: PIL.warnaRambut, aksesori: PIL.aksesori.slice()});
/* pratinjau 3D: bisa diputar dengan digeser */
const PRATINJAU = (() => { const ren = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true}); ren.setPixelRatio(2); ren.setSize(240, 260);
  ren.outputEncoding = THREE.sRGBEncoding; ren.domElement.id = 'pratinjau';
  const sc = new THREE.Scene(), kam = new THREE.PerspectiveCamera(30, 240 / 260, .1, 50); kam.position.set(0, 2.0, 6.4); kam.lookAt(0, 1.5, 0);
  const l = new THREE.DirectionalLight(C('#FFF3DC'), 1.05); l.position.set(3, 4, 5); sc.add(l, new THREE.HemisphereLight(C('#CDEFFF'), C('#F6E3B8'), .45));
  let model = null, putar = 0, seret = null, diamP = 9;
  ren.domElement.addEventListener('pointerdown', e => { seret = e.clientX; diamP = 0; ren.domElement.setPointerCapture(e.pointerId); });
  ren.domElement.addEventListener('pointermove', e => { if (seret == null) return; putar += (e.clientX - seret) * .012; seret = e.clientX; });
  ['pointerup', 'pointercancel'].forEach(n => ren.domElement.addEventListener(n, () => seret = null));
  return {el: ren.domElement,
    set(J, o) { if (model) sc.remove(model); model = J ? buatBinatang(J, rng(3), o) : null; if (model) { model.position.y = .2; sc.add(model); } },
    gambar(t, depan) { if (model) { const u = model.userData; if (seret == null) diamP += 1 / 60;
        model.rotation.y = depan ? 0 : putar + (diamP > 2 ? Math.sin(t * .7) * .5 : 0); u.B.position.y = depan ? 0 : Math.abs(Math.sin(t * 3)) * .06;
        const k = depan ? 0 : Math.max(0, Math.sin(t * 1.3)); u.lg[1].rotation.set(-.2 * k, 0, .12 + k * (2.4 + Math.sin(t * 9) * .3)); u.lg[0].rotation.set(0, 0, -.2); }
      ren.render(sc, kam); }}; })();
$('#wadahPratinjau').appendChild(PRATINJAU.el);
const segarkan = () => { PRATINJAU.set(PIL.jenis || JENIS[0], opsiPil());
  $('#namaJenis').textContent = PIL.jenis ? `${PIL.jenis.e} ${PIL.jenis.n}` : 'Pilih binatang di bawah'; $('#hitAks').textContent = `${PIL.aksesori.length}/3`; };
function pilihan(wadah, daftar, isi, klik, aktif) { const w = $(wadah); w.innerHTML = '';
  daftar.forEach(d => { const b = document.createElement('button'); b.type = 'button'; isi(b, d); b.onclick = () => { klik(d); tandai(); segarkan(); }; b._d = d; w.appendChild(b); });
  const tandai = () => w.querySelectorAll('button').forEach(b => b.classList.toggle('on', aktif(b._d))); tandai(); return tandai; }
const tombolIkon = (b, d) => { b.className = 'jenis'; b.innerHTML = `<span>${d.e}</span>`; b.appendChild(document.createTextNode(d.n)); };
const tombolWarna = (b, d) => { b.className = 'warna'; b.style.background = d || 'conic-gradient(#FF8A8A,#FFE066,#9BE36B,#7FC8FF,#C69CFF,#FF8A8A)'; b.title = d ? d : 'Warna asli'; if (!d) b.textContent = 'asli'; };
pilihan('#gridJenis', JENIS, tombolIkon, d => PIL.jenis = d, d => PIL.jenis === d);
pilihan('#gridKelamin', [{id: 'L', n: 'Laki-laki', e: '👦'}, {id: 'P', n: 'Perempuan', e: '👧'}], tombolIkon, d => PIL.kelamin = d.id, d => PIL.kelamin === d.id);
pilihan('#gridWarna', ['', ...WARNA_BULU], tombolWarna, d => PIL.warna = d, d => PIL.warna === d);
pilihan('#gridRambut', RAMBUT, tombolIkon, d => PIL.rambut = d.id, d => PIL.rambut === d.id);
pilihan('#gridWarnaRambut', WARNA_RAMBUT, tombolWarna, d => PIL.warnaRambut = d, d => PIL.warnaRambut === d);
pilihan('#gridAksesori', AKSESORI, tombolIkon, d => { const i = PIL.aksesori.indexOf(d.id);
  if (i >= 0) PIL.aksesori.splice(i, 1); else if (PIL.aksesori.length < 3) PIL.aksesori.push(d.id); else toast('Maksimal 3 aksesori ya'); }, d => PIL.aksesori.includes(d.id));
segarkan();
function bukaKtp() { $('#modal').classList.add('on'); const simpan = JSON.parse(localStorage.getItem(KTP_SIMPAN) || 'null');
  $('#formKtp').style.display = simpan ? 'none' : ''; $('#hasilKtp').style.display = simpan ? '' : 'none';
  if (simpan) gambarKartu(simpan); else segarkan(); }
$('#bKtp').onclick = bukaKtp; $('#tutupModal').onclick = () => $('#modal').classList.remove('on');
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').classList.remove('on'); });
$('#kirimKtp').onclick = async () => { const nama = $('#namaKtp').value.trim().replace(/\s+/g, ' '), psn = $('#pesanKtp');
  psn.className = 'salah';
  if (nama.length < 2) { psn.textContent = 'Tulis nama panggilan (minimal 2 huruf).'; $('#namaKtp').focus(); return; }
  if (!PIL.jenis) { psn.textContent = 'Pilih dulu binatangmu.'; return; }
  if (!$('#setuju').checked) { psn.textContent = 'Centang dulu kotak persetujuan.'; return; }
  if (!ktpUrl()) { psn.textContent = 'Pendaftaran KTP belum aktif.'; return; }
  psn.className = ''; psn.textContent = 'Membuat KTP…'; $('#kirimKtp').disabled = true;
  try { const r = await fetch(ktpUrl(), {method: 'POST', headers: {'content-type': 'text/plain'}, body: JSON.stringify(Object.assign({nama, jenis: PIL.jenis.id}, opsiPil()))}); const j = await r.json();
    if (!j.ok) { psn.className = 'salah'; psn.textContent = j.pesan || 'Gagal membuat KTP.'; return; }
    psn.textContent = ''; $('#bKtp').textContent = '🪪 Lihat KTP-ku'; localStorage.setItem(KTP_SIMPAN, JSON.stringify(j.ktp));
    $('#formKtp').style.display = 'none'; $('#hasilKtp').style.display = ''; gambarKartu(j.ktp);
    toast(`Selamat datang, ${j.ktp.nama}! 🪪`); tampilTombolJalan(); muat(false); }
  catch (e) { psn.className = 'salah'; psn.textContent = 'Gagal terhubung. Coba lagi sebentar lagi.'; }
  finally { $('#kirimKtp').disabled = false; } };
const opsiKtp = k => ({kelamin: k.kelamin || '', warna: k.warna || '', rambut: k.rambut || 'none', warnaRambut: k.warnaRambut || '', aksesori: k.aksesori || []});
/* kartu KTP digambar di kanvas → bisa disimpan sebagai gambar */
function gambarKartu(k) { const J = JENIS_ID[k.jenis] || JENIS[0], c = $('#kartu'), x = c.getContext('2d'), W2 = c.width, H2 = c.height;
  PRATINJAU.set(J, opsiKtp(k)); PRATINJAU.gambar(0, true);
  x.clearRect(0, 0, W2, H2); x.fillStyle = '#2B2238'; x.beginPath(); x.roundRect(0, 8, W2, H2 - 8, 40); x.fill();
  const g = x.createLinearGradient(0, 0, W2, H2); g.addColorStop(0, '#9AD8FF'); g.addColorStop(1, '#C8F0D8'); x.fillStyle = g; x.beginPath(); x.roundRect(0, 0, W2, H2 - 8, 40); x.fill();
  x.lineWidth = 8; x.strokeStyle = '#2B2238'; x.stroke();
  x.fillStyle = '#FFD447'; x.beginPath(); x.roundRect(0, 0, W2, 120, [40, 40, 0, 0]); x.fill(); x.stroke();
  x.fillStyle = '#2B2238'; x.textAlign = 'center'; x.font = "700 46px 'Fredoka', sans-serif"; x.fillText('KARTU TANDA PENDUDUK', W2 / 2, 58); x.font = "600 30px 'Fredoka', sans-serif"; x.fillText('Kota ??? · Kota Binatang', W2 / 2, 98);
  x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(40, 150, 300, 360, 30); x.fill(); x.stroke(); x.drawImage(PRATINJAU.el, 50, 160, 280, 303);
  x.textAlign = 'left'; const kel = k.kelamin === 'P' ? 'Perempuan' : k.kelamin === 'L' ? 'Laki-laki' : '-';
  const baris = [['NIK', nomorKtp(k.no)], ['Nama', k.nama], ['Jenis binatang', J.n], ['Jenis kelamin', kel], ['Warga sejak', new Date(k.t).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})]];
  baris.forEach(([a, b], i) => { const y = 188 + i * 64; x.fillStyle = '#5A4E68'; x.font = "600 26px 'Fredoka', sans-serif"; x.fillText(a, 380, y); x.fillStyle = '#2B2238'; x.font = "700 36px 'Fredoka', sans-serif"; x.fillText(b, 380, y + 36, W2 - 410); });
  x.fillStyle = '#2B2238'; x.font = "500 22px 'Fredoka', sans-serif"; x.textAlign = 'center'; x.fillText('KTP fiktif untuk permainan · bukan dokumen resmi · Koin bukan Rupiah', W2 / 2, H2 - 34);
  $('#unduhKtp').href = c.toDataURL('image/png'); $('#unduhKtp').download = `KTP-${nomorKtp(k.no)}-${k.nama.replace(/[^\w-]+/g, '_')}.png`;
  $('#ktpku').textContent = `${J.e} ${k.nama} · ${nomorKtp(k.no)}`; }
{ const s = JSON.parse(localStorage.getItem(KTP_SIMPAN) || 'null'); if (s) { $('#bKtp').textContent = '🪪 Lihat KTP-ku'; } }

/* ================= KAMERA (geser putar, cubit/scroll zoom) ================= */
const PRESET = {kota: {th: .12, ph: 1.0, r: HP ? 70 : 58, tgt: [PUSAT_KOTA[0], 2, PUSAT_KOTA[1] + 2]}, dekat: {th: .05, ph: 1.25, r: HP ? 30 : 24, tgt: [PUSAT[0], 2.6, PUSAT[1] - 1]},
  pantai: {th: .22, ph: 1.12, r: HP ? 62 : 52, tgt: [0, 3, 18]},
  gunung: {th: .3, ph: 1.12, r: 150, tgt: [GUNUNG[0] + 8, 18, GUNUNG[1] + 20]}, pulau: {th: .6, ph: .82, r: 300, tgt: [0, 0, -70]}};
const ORB = {th: PRESET.kota.th, ph: PRESET.kota.ph, r: PRESET.kota.r, tgt: V(...PRESET.kota.tgt)}, ORB_T = {th: ORB.th, ph: ORB.ph, r: ORB.r, tgt: ORB.tgt.clone()};
let diam = 0; const jari = new Map();
const el = REN.domElement;
el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); jari.set(e.pointerId, [e.clientX, e.clientY]); diam = 0; });
el.addEventListener('pointermove', e => { if (!jari.has(e.pointerId)) return; const [px, py] = jari.get(e.pointerId);
  if (JL.aktif && jari.size === 1) { JL.kamYaw -= (e.clientX - px) * .006; JL.kamPitch = clamp(JL.kamPitch + (e.clientY - py) * .004, -.05, 1.35); jari.set(e.pointerId, [e.clientX, e.clientY]); return; }
  if (jari.size === 1) { ORB_T.th -= (e.clientX - px) * .005; ORB_T.ph = clamp(ORB_T.ph - (e.clientY - py) * .004, .3, 1.42); }
  else if (jari.size === 2) { const [a, b] = [...jari.values()], d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); jari.set(e.pointerId, [e.clientX, e.clientY]);
    const [c, d] = [...jari.values()], d1 = Math.hypot(c[0] - d[0], c[1] - d[1]), f = d0 / Math.max(1, d1);
    if (JL.aktif) JL.jarak = clamp(JL.jarak * f, 4, JARAK_MAKS); else ORB_T.r = clamp(ORB_T.r * f, 12, 260); return; }
  jari.set(e.pointerId, [e.clientX, e.clientY]); diam = 0; });
['pointerup', 'pointercancel'].forEach(n => el.addEventListener(n, e => jari.delete(e.pointerId)));
el.addEventListener('wheel', e => { e.preventDefault(); if (JL.aktif) { JL.jarak = clamp(JL.jarak * Math.exp(e.deltaY * .001), 4, JARAK_MAKS); return; } ORB_T.r = clamp(ORB_T.r * Math.exp(e.deltaY * .001), 12, 260); diam = 0; }, {passive: false});
document.querySelectorAll('[data-kam]').forEach(b => b.addEventListener('click', () => { const p = PRESET[b.dataset.kam];
  ORB_T.th = ORB.th + Math.atan2(Math.sin(p.th - ORB.th), Math.cos(p.th - ORB.th)); ORB_T.ph = p.ph; ORB_T.r = p.r; ORB_T.tgt.set(...p.tgt); diam = 0;
  document.querySelectorAll('[data-kam]').forEach(x => x.classList.toggle('on', x === b)); }));

/* ================= JALAN-JALAN: warga ber-KTP mengendalikan binatangnya sendiri ================= */
const BUKIT_PENUH = [[0, -2, 17, .32], [-11, 4, 9, .45], [12, 2, 10, .4], [-3, -14, 12, .55], [8, -10, 8, .7]];
function tanahJalan(x, z) { let y = tinggi(x, z);     /* tanah + permukaan bukit-bukit hijau di dekat pantai */
  for (const [bx, bz, r, s] of BUKIT_PENUH) { const d = Math.hypot(x - bx, z - bz); if (d < r) y = Math.max(y, tanah(bx, bz) - r * s * .35 + s * Math.sqrt(r * r - d * d)); }
  return y; }
function zona(x, z) { const s = pantaiS(x, z), [ds, j] = dekatSungai(x, z);
  if (Math.hypot(x - SUNGAI[0].x, z - SUNGAI[0].z) < 11) return '💦 Air Terjun';
  if (Math.hypot(x - GERBANG_POS[0], z - GERBANG_POS[1]) < 6.5) return '🏛️ Gerbang Kota'; if (Math.hypot(x - LUMBUNG_POS[0], z - LUMBUNG_POS[1]) < 6.5) return '🏠 Lumbung';
  if (Math.hypot(x - KEBUN_POS[0], z - KEBUN_POS[1]) < 8) return '🥕 Kebun'; if (Math.hypot(x - PUSAT_KOTA[0], z - PUSAT_KOTA[1]) < 16) return '🏕️ Tengah Kota';
  if (KELAPA_KOTA.some(([a, b]) => Math.hypot(x - a, z - b) < 7)) return '🥥 Kebun Kelapa';
  if (_gunung(x, z) > 14) return '⛰️ Gunung'; if (ds < SUNGAI[j].w + 1.5) return '🏞️ Sungai';
  if (s < 20) return '🏖️ Pantai'; if (diLahan(x, z, 1.05)) return '🏙️ Kota Bhinneka';
  if (_gunung(x, z) > 6) return '🪨 Kaki Gunung'; return '🌳 Hutan'; }
const _vJ = V(0, 0, 0);
const JARAK_MAKS = 64;   /* kamera jalan-jalan boleh mundur jauh untuk menikmati pemandangan */
const JL = {aktif: false, g: null, x: 0, z: 27, y: 0, vy: 0, arah: Math.PI, laju: 0, l: 0, s: 0, no: 0, em: null, kamYaw: 0, kamPitch: .32, jarak: 12, kunci: {}, joy: [0, 0], sapa: false, zona: ''};
function ktpSaya() { return JSON.parse(localStorage.getItem(KTP_SIMPAN) || 'null'); }
function tampilTombolJalan() { const ada = !!ktpSaya(); $('#bJalan').style.display = ada ? '' : 'none'; $('#bJalan2').style.display = ada ? '' : 'none'; }
function mulaiJelajah() { const k = ktpSaya(); if (!k) { bukaKtp(); return; }
  $('#modal').classList.remove('on');
  if (JL.g) scene.remove(JL.g);
  JL.g = buatBinatang(JENIS_ID[k.jenis] || JENIS[0], rng(k.no * 131 + 7), opsiKtp(k)); JL.g.scale.setScalar(SKALA_WARGA); JL.g.add(papanNama(k.nama, JL.g.userData.atas)); scene.add(JL.g);
  JL.kunciSaya = 'k' + k.no + '{'; JL.x = PUSAT_KOTA[0] + (Math.random() - .5) * 3; JL.z = PUSAT_KOTA[1] + 9 + Math.random() * 1.5;   /* sedikit acak supaya pemain bareng tidak bertumpuk */ JL.y = tanahJalan(JL.x, JL.z); JL.vy = 0; JL.arah = Math.PI; JL.kamYaw = Math.PI; JL.kamPitch = .32; JL.jarak = 12; JL.sapa = false; JL.s = 0; JL.em = null; JL.ob = null; JL.alat = null; JL.no = k.no; berhentiMancing('');
  JL.aktif = true; document.body.classList.add('jelajah'); ukur(); toast(`Ayo jalan-jalan, ${k.nama}! 🐾`); sambungMP(); }
function selesaiJelajah() { berhentiMancing(''); if (JL.alat) { scene.remove(JL.alat.garis, JL.alat.pel); JL.alat = null; } putusMP(); DEKAT = []; aturTajuk(0, 0, 0, 0, 0, 0); _hitDekat = 0; JL.aktif = false; document.body.classList.remove('jelajah'); ukur(); if (JL.g) { scene.remove(JL.g); JL.g = null; } diam = 0; }
$('#bJalan').onclick = mulaiJelajah; $('#bJalan2').onclick = mulaiJelajah; $('#bKeluar').onclick = selesaiJelajah;
addEventListener('keydown', e => { if (!JL.aktif || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; JL.kunci[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); lompat(); } if (e.code === 'KeyF') tekanMancing(); if (e.code === 'Escape') selesaiJelajah();
  if (e.code === 'Equal' || e.code === 'NumpadAdd') aturZoom(-1); if (e.code === 'Minus' || e.code === 'NumpadSubtract') aturZoom(1); if (/Arrow/.test(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { JL.kunci[e.code] = false; });
addEventListener('blur', () => { JL.kunci = {}; });
/* lompat: dulu tidak pernah jalan karena binatang berdiri sedikit DI ATAS tanah (lantai = tanah + .14×skala) */
function diLantai() { return JL.y <= tanahJalan(JL.x, JL.z) + .14 * SKALA_WARGA + .06; }
function lompat() { if (!JL.aktif || PANCING.fase) return; if (JL.s === 1) { JL.vy = 5; return; } if (diLantai()) JL.vy = 10.5; }
function aturZoom(arah) { JL.jarak = clamp(JL.jarak * (arah > 0 ? 1.35 : 1 / 1.35), 4, JARAK_MAKS); }
$('#bZoomJauh').addEventListener('click', () => aturZoom(1)); $('#bZoomDekat').addEventListener('click', () => aturZoom(-1));
$('#bPancing').addEventListener('pointerdown', e => { e.preventDefault(); tekanMancing(); });
$('#bLompat').addEventListener('pointerdown', e => { e.preventDefault(); lompat(); });
/* joystick layar sentuh */
{ const J = $('#joystik'), T = $('#tombolJoy'); let id = null, pusat = null;
  J.addEventListener('pointerdown', e => { id = e.pointerId; J.setPointerCapture(id); const r = J.getBoundingClientRect(); pusat = [r.left + r.width / 2, r.top + r.height / 2]; gerak(e); });
  const gerak = e => { if (e.pointerId !== id) return; let dx = e.clientX - pusat[0], dy = e.clientY - pusat[1]; const m = Math.hypot(dx, dy), R = 48; if (m > R) { dx *= R / m; dy *= R / m; }
    T.style.transform = `translate(${dx}px,${dy}px)`; JL.joy = [dx / R, dy / R]; };
  J.addEventListener('pointermove', gerak);
  ['pointerup', 'pointercancel'].forEach(n => J.addEventListener(n, e => { if (e.pointerId !== id) return; id = null; JL.joy = [0, 0]; T.style.transform = ''; })); }
let DEKAT = [], _hitDekat = 0;
function terhalang(x, y, z) { return tinggi(x, z) > y - .6; }   /* kamera hanya maju karena tanah; pohon yang menghalangi disembunyikan */
/* tajuk pohon yang menghalangi pandangan disembunyikan sementara (seperti di game) */
const _M4 = new THREE.Matrix4(), _NOL = new THREE.Matrix4().makeScale(0, 0, 0), _Q = new THREE.Quaternion(), _P = V(0, 0, 0), _S = V(1, 1, 1);
let SEMBUNYI = new Set();
function matTajuk(i, tepi) { const [x, y, z, k] = HUTAN.daftar[i]; _P.set(x, y + 2.5 * k, z); _S.set(1.5 * k, 1.3 * k, 1.5 * k).multiplyScalar(tepi ? 1.07 : 1); return _M4.compose(_P, _Q, _S); }
function aturTajuk(px, py, pz, cx, cy, cz) { if (!HUTAN.mD) return; const baru = new Set();
  for (const d of DEKAT) { const [a, b, c, k] = d, i = d.i;
    for (let f = 0; f <= 1.001; f += .1) { const dx = (lerp(px, cx, f) - a) / (1.5 * k + .8), dy = (lerp(py, cy, f) - (b + 2.5 * k)) / (1.3 * k + .8), dz = (lerp(pz, cz, f) - c) / (1.5 * k + .8);
      if (dx * dx + dy * dy + dz * dz < 1) { baru.add(i); break; } } }
  let ubah = false;
  for (const i of SEMBUNYI) if (!baru.has(i)) { HUTAN.mD.setMatrixAt(i, matTajuk(i, false)); HUTAN.mT.setMatrixAt(i, matTajuk(i, true)); ubah = true; }
  for (const i of baru) if (!SEMBUNYI.has(i)) { HUTAN.mD.setMatrixAt(i, _NOL); HUTAN.mT.setMatrixAt(i, _NOL); ubah = true; }
  KELAPA.forEach(g => { let tutup = false;   /* daun kelapa yang menghalangi kamera ikut disembunyikan */
    for (let f = .15; f <= 1.001 && !tutup; f += .1) { const x = lerp(px, cx, f), y = lerp(py, cy, f), z = lerp(pz, cz, f);
      if (Math.hypot(x - g.px, z - g.pz) < 4.2 && y > tinggi(g.px, g.pz) + g.tinggi * .45) tutup = true; }
    g.visible = !tutup; });
  SEMBUNYI = baru; if (ubah) { HUTAN.mD.instanceMatrix.needsUpdate = true; HUTAN.mT.instanceMatrix.needsUpdate = true; aturBuah(); } }
let BUAH_HILANG = new Set();
function aturBuah() { if (!HUTAN.mBuah) return; const pohon = [...SEMBUNYI].map(i => HUTAN.daftar[i]), baru = new Set();
  HUTAN.daftarBuah.forEach(([x, y, z], j) => { if (pohon.some(([a, , c, k]) => Math.hypot(x - a, z - c) < 1.6 * k + .5)) baru.add(j); });
  for (const j of BUAH_HILANG) if (!baru.has(j)) { const [x, y, z] = HUTAN.daftarBuah[j]; _P.set(x, y, z); _S.set(1.4, 1.4, 1.4); HUTAN.mBuah.setMatrixAt(j, _M4.compose(_P, _Q, _S)); }
  for (const j of baru) if (!BUAH_HILANG.has(j)) HUTAN.mBuah.setMatrixAt(j, _NOL);
  BUAH_HILANG = baru; HUTAN.mBuah.instanceMatrix.needsUpdate = true; }
function kameraBebas(px, py, pz, cx, cy, cz) {   /* seberapa jauh kamera boleh mundur sebelum terhalang (0..1) */
  for (let i = 1; i <= 12; i++) { const f = i / 12; if (terhalang(lerp(px, cx, f), lerp(py, cy, f), lerp(pz, cz, f))) return f - 1 / 12; }
  return 1; }
function langkahJelajah(t, dt) { const K = JL.kunci;
  if (--_hitDekat <= 0) { _hitDekat = 10; DEKAT = []; (HUTAN.daftar || []).forEach((d, i) => { if (Math.abs(d[0] - JL.x) < 24 && Math.abs(d[2] - JL.z) < 24) { const e = d.slice(); e.i = i; DEKAT.push(e); } }); }
  let ix = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + JL.joy[0], iz = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0) + JL.joy[1];
  const m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; }
  if (m > .05 && PANCING.fase) berhentiMancing('');   /* jalan = berhenti memancing */
  const lari = K.ShiftLeft || K.ShiftRight || Math.hypot(...JL.joy) > .92, renang = JL.s === 1, cepat = (renang ? (lari ? 7.5 : 5) : (lari ? 15 : 9)) * Math.min(1, Math.hypot(ix, iz));
  JL.laju = lerp(JL.laju, cepat, 1 - Math.exp(-dt * 8));
  if (m > .05) { /* arah gerak mengikuti arah kamera */
    const sy = Math.sin(JL.kamYaw), cy = Math.cos(JL.kamYaw), wx = -iz * sy - ix * cy, wz = -iz * cy + ix * sy, tuju = Math.atan2(wx, wz);   /* maju = menjauhi kamera, kanan = kanan layar */
    JL.arah += Math.atan2(Math.sin(tuju - JL.arah), Math.cos(tuju - JL.arah)) * Math.min(1, dt * 10);
    const langkahX = Math.sin(JL.arah) * JL.laju * dt, langkahZ = Math.cos(JL.arah) * JL.laju * dt;
    const bisa = (nx, nz) => { if (pantaiS(nx, nz) < -RENANG_MAKS && pantaiS(nx, nz) < pantaiS(JL.x, JL.z)) return 'air'; if (tanahJalan(nx, nz) - tanahJalan(JL.x, JL.z) > Math.hypot(nx - JL.x, nz - JL.z) * 2.3 + 1.3) return 'terjal';
      const tabrak = (a, b, r) => { const dB = Math.hypot(nx - a, nz - b); return dB < r && dB < Math.hypot(JL.x - a, JL.z - b); };   /* menjauh dari benda selalu boleh */
      if (DEKAT.some(([a, , b, k]) => tabrak(a, b, .3 * k + .55)) || PALEM.some(([a, b]) => tabrak(a, b, 1.1)) || tabrak(KAS_POS[0], KAS_POS[1], 1.6) || tabrak(PAPAN_POS[0], PAPAN_POS[1], 1.4) || BENDA.some(([a, b, r]) => tabrak(a, b, r))) return 'tabrak';
      return ''; };
    const h = bisa(JL.x + langkahX, JL.z + langkahZ); let jalan = !h;
    if (!h) { JL.x += langkahX; JL.z += langkahZ; }
    else if (h !== 'air') for (const sd of [.5, -.5, 1, -1, 1.4, -1.4]) {          /* terhalang: coba melangkah serong (menyelinap) */
      const L = JL.laju * dt * Math.cos(sd) * .9, dx = Math.sin(JL.arah + sd) * L, dz = Math.cos(JL.arah + sd) * L;
      if (!bisa(JL.x + dx, JL.z + dz)) { JL.x += dx; JL.z += dz; jalan = true; break; } }
    if (jalan) {}
    else if (h === 'air' && !JL._air) { JL._air = true; toast('Jangan berenang terlalu jauh dari pantai ya! 🛟'); setTimeout(() => JL._air = false, 4000); }
    else if (h === 'terjal' && !JL._terjal) { JL._terjal = true; toast('Terlalu terjal! Coba lewat jalan lain ⛰️'); setTimeout(() => JL._terjal = false, 4000); } }
  else JL.laju = lerp(JL.laju, 0, 1 - Math.exp(-dt * 8));
  const dasar = tanahJalan(JL.x, JL.z), lantai = dasar + .14 * SKALA_WARGA, air = airDi(JL.x, JL.z, t), apung = air - APUNG;   /* berenang: badan rebah di permukaan */
  if (air - dasar > DALAM_RENANG + (JL.s === 1 ? -.08 : .08)) {   /* air cukup dalam: mengapung (sedikit histeresis supaya tidak berkedip) */
    if (JL.s !== 1) { JL.s = 1; if (JL.vy < -2) JL.vy *= .3; }
    JL.vy += (apung - JL.y) * 30 * dt - JL.vy * 4 * dt; JL.y += JL.vy * dt; if (JL.y < dasar - .3) { JL.y = dasar - .3; JL.vy = 0; } }
  else { if (JL.s === 1) JL.s = 0; JL.vy -= 26 * dt; JL.y += JL.vy * dt; if (JL.y < lantai) { JL.y = lantai; JL.vy = 0; } }
  JL.l = JL.laju; JL.g.position.set(JL.x, JL.y, JL.z); JL.g.rotation.y = JL.arah;
  langkahMancing(dt); poseKarakter(JL, t, dt, JL.s !== 1 && JL.y > lantai + .05);
  /* kamera mengikuti dari belakang */
  const cx = JL.x - Math.sin(JL.kamYaw) * Math.cos(JL.kamPitch) * JL.jarak, cz = JL.z - Math.cos(JL.kamYaw) * Math.cos(JL.kamPitch) * JL.jarak;
  let cyy = JL.y + 2.2 + Math.sin(JL.kamPitch) * JL.jarak; cyy = Math.max(cyy, tanahJalan(cx, cz) + 1.2, airDi(cx, cz, t) + .9);   /* kamera tidak masuk ke dalam air */
  let fb = kameraBebas(JL.x, JL.y + 2.2, JL.z, cx, cyy, cz);
  if (fb < .9) { const rendah = Math.max(JL.y + 1.5, tanahJalan(cx, cz) + 1.1), f2 = kameraBebas(JL.x, JL.y + 2.2, JL.z, cx, rendah, cz);   /* coba kamera lebih rendah, di bawah tajuk */
    if (f2 > fb + .15) { cyy = rendah; fb = f2; } }
  fb = Math.max(.42, fb); JL.fb = lerp(JL.fb || 1, fb, fb < (JL.fb || 1) ? 1 - Math.exp(-dt * 14) : 1 - Math.exp(-dt * 2));
  const kx = lerp(JL.x, cx, JL.fb), ky = lerp(JL.y + 2.2, cyy, JL.fb), kz = lerp(JL.z, cz, JL.fb);
  const kk = 1 - Math.exp(-dt * 6); cam.position.lerp(_vJ.set(kx, ky, kz), kk); aturTajuk(JL.x, JL.y + 2.4, JL.z, cam.position.x, cam.position.y, cam.position.z); cam.lookAt(JL.x, JL.y + 2.2 + Math.min(1.6, JL.jarak * .06), JL.z);   /* sedikit ke atas: gelembung obrolan tetap terlihat */
  if (m > .05 && !jari.size) JL.kamYaw += Math.atan2(Math.sin(JL.arah - JL.kamYaw), Math.cos(JL.arah - JL.kamYaw)) * Math.min(1, dt * 1.2);   /* kamera pelan-pelan ke belakang binatang */
  const zn = zona(JL.x, JL.z); if (zn !== JL.zona) { JL.zona = zn; $('#lokasi').textContent = zn; }
  if (!JL.sapa && Math.hypot(JL.x - PUSAT[0], JL.z - PUSAT[1] - .6) < 4.2) { JL.sapa = true; const k = ktpSaya(); toast(`Joko: "Halo, ${k ? k.nama : 'warga'}! Selamat datang di Kota Bhinneka!" 🎩`); }
  if (JL.sapa && Math.hypot(JL.x - PUSAT[0], JL.z - PUSAT[1]) > 12) JL.sapa = false; }

/* ===== SENSOR OBROLAN Kota Binatang (dipakai server main-bareng & website) =====
   - kata kasar/jorok/judi diganti bintang (****), termasuk ejaan akal-akalan: k0nt0l, kooontol, k o n t o l, a.n.j.e.n.g
   - link, nomor HP, email, & akun medsos disembunyikan (melindungi anak-anak dari ajakan keluar game)
   - kata binatang biasa (anjing, babi, monyet) TIDAK disensor karena ini kota binatang */
const SENSOR_DALAM = ['kontol', 'memek', 'ngentot', 'entot', 'ngewe', 'jancok', 'jancuk', 'dancok', 'bangsat', 'bajingan', 'keparat', 'brengsek', 'goblok', 'goblog',
  'tolol', 'kampret', 'pepek', 'titit', 'peler', 'lonte', 'pelacur', 'jembut', 'pukimak', 'kimak', 'puki', 'ngaceng', 'sange', 'bugil', 'telanjang', 'bokep',
  'onani', 'masturbasi', 'porno', 'porn', 'hentai', 'fuck', 'fck', 'shit', 'bitch', 'pussy', 'dick', 'cock', 'penis', 'vagina', 'nigga', 'nigger', 'retard',
  'slut', 'whore', 'anjeng', 'anjrit', 'bacot', 'bangke', 'judol', 'togel', 'gacor', 'slot88', 'maxwin', 'narkoba', 'bunuhdiri'];
const SENSOR_UTUH = ['asu', 'tai', 'taik', 'cuk', 'jing', 'njing', 'kntl', 'mmk', 'ngntd', 'bgst', 'bgsd', 'tll', 'gblk', 'sex', 'seks', 'bego', 'dungu', 'idiot',
  'sialan', 'coli', 'sabu', 'ganja', 'kafir', 'nazi', 'pantek', 'setan lu', 'ass', 'fk', 'wtf', 'stfu', 'slot', 'judi', 'mati lu', 'mampus', 'babi lu', 'anjing lu', 'anjing lo', 'monyet lu', 'monyet lo'];
const _LEET = {'0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', '6': 'g', '2': 'z'};
const _norm = s => s.toLowerCase().replace(/[0-9!|@$]/g, c => _LEET[c] || c).replace(/[^a-z]/g, '');
const _rapat = s => s.replace(/(.)\1+/g, '$1');                     // kooontoool -> kontol
const _cocok = n => n && (SENSOR_DALAM.some(k => n.includes(k) || _rapat(n).includes(k)) || SENSOR_UTUH.includes(n) || SENSOR_UTUH.includes(_rapat(n)));
const _bintang = s => s.replace(/[^\s]/g, '*');

function sensorTeks(teks) {
  let t = String(teks || '').normalize('NFKC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  /* link, email, nomor HP, akun medsos */
  t = t.replace(/\b(?:https?:\/\/|www\.)\S+/gi, '***').replace(/\b\S+\.(?:com|net|org|id|co|io|me|ly|gg|xyz|site|link|top|vip|app|tk)\b\S*/gi, '***')
       .replace(/\S+@\S+/g, '***').replace(/(?:\+?\d[\d\s.-]{6,}\d)/g, '***').replace(/(^|\s)@\w{2,}/g, '$1***')
       .replace(/\b(?:wa|whatsapp|ig|instagram|tiktok|telegram|tele|line|discord|fb|facebook)\s*[:=]\s*\S+/gi, '***');
  /* kata per kata (tanda baca di tengah dibuang dulu: a.n.j.e.n.g, k-o-n-t-o-l) */
  const kata = t.split(' ');
  for (let i = 0; i < kata.length; i++) if (_cocok(_norm(kata[i]))) kata[i] = _bintang(kata[i]);
  /* pasangan dua kata (mis. "anjing lu", "mati lu") */
  for (let i = 0; i + 1 < kata.length; i++) { const dua = _norm(kata[i]) + ' ' + _norm(kata[i + 1]);
    if (SENSOR_UTUH.includes(dua)) { kata[i] = _bintang(kata[i]); kata[i + 1] = _bintang(kata[i + 1]); } }
  /* huruf dipisah spasi: "k o n t o l" -> gabungkan deretan kata satu huruf lalu cek */
  for (let i = 0; i < kata.length; i++) { if (_norm(kata[i]).length !== 1) continue; let j = i; while (j < kata.length && _norm(kata[j]).length === 1) j++;
    if (j - i >= 3) { const g = kata.slice(i, j).map(_norm).join(''); if (_cocok(g)) for (let q = i; q < j; q++) kata[q] = _bintang(kata[q]); } i = j; }
  t = kata.join(' ');
  /* teriakan / spam huruf: "aaaaaaaa" -> "aaa", huruf besar semua dikecilkan */
  t = t.replace(/(.)\1{4,}/g, '$1$1$1'); if (t.length > 8 && t === t.toUpperCase() && /[A-Z]/.test(t)) t = t.toLowerCase();
  return t;
}
/* ================= AKSI: berenang, memancing, emote beranimasi, gelembung obrolan, efek ================= */
/* Dipakai untuk binatang sendiri (JL) dan pemain lain (MP.pemain) — gerakannya sama persis di semua layar. */
const RENANG_MAKS = 17;            // seberapa jauh boleh berenang dari garis pantai (satuan pulau)
const DALAM_RENANG = .62;          // kedalaman air (dari dasar) mulai berenang
const APUNG = .85;                 // badan rebah: kaki sedalam ini di bawah permukaan
function airDi(x, z, t) { return ombak(x, z, t) - clamp((pantaiS(x, z) + 1.9) / 3, 0, 1) * 1.4; }   /* permukaan laut, sama dengan mesh laut */

/* ---------- efek kecil (hati, not, cipratan, bintang) ---------- */
const EFEK = [];
function tambahEfek(obj, dur, fn, induk = scene) { induk.add(obj); EFEK.push({obj, dur, fn, k0: tAnim, induk}); return obj; }
function langkahEfek() { for (let i = EFEK.length - 1; i >= 0; i--) { const e = EFEK[i], k = (tAnim - e.k0) / e.dur;
    if (k >= 1) { e.induk.remove(e.obj); if (e.obj.material) e.obj.material.dispose(); EFEK.splice(i, 1); continue; } e.fn(e.obj, k); } }
const _cacheEmoji = new Map();
function spriteEmoji(teks, warna = '#FFFFFF', uk = 200) { const k = teks + warna; if (!_cacheEmoji.has(k)) _cacheEmoji.set(k, spriteTeks(teks, warna, uk).material.map);
  return new THREE.Sprite(new THREE.SpriteMaterial({map: _cacheEmoji.get(k), transparent: true, depthWrite: false})); }
const _GEO_HATI = (() => { const s = new THREE.Shape(); s.moveTo(0, -.55); s.bezierCurveTo(-.15, -.4, -.62, -.15, -.62, .17); s.bezierCurveTo(-.62, .45, -.38, .6, -.2, .6);
  s.bezierCurveTo(-.08, .6, 0, .5, 0, .4); s.bezierCurveTo(0, .5, .08, .6, .2, .6); s.bezierCurveTo(.38, .6, .62, .45, .62, .17); s.bezierCurveTo(.62, -.15, .15, -.4, 0, -.55);
  const g = new THREE.ExtrudeGeometry(s, {depth: .18, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 3, curveSegments: 10}); g.center(); return g; })();
const _GEO_CINCIN = new THREE.RingGeometry(.55, .78, 28).rotateX(-Math.PI / 2), _GEO_TETES = new THREE.SphereGeometry(.09, 8, 6);
function hatiMelayang(p) { const g = p.g;
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(_GEO_HATI, MAT(i % 2 ? '#FF4D6A' : '#FF7A93', {transparent: true})), a = g.rotation.y + (i - 2) * .45, d = .6 + i * .12;
    const x0 = g.position.x + Math.sin(a) * d * .6, z0 = g.position.z + Math.cos(a) * d * .6, y0 = g.position.y + 2.2, tunda = i * .12, sp = .9 + (i % 3) * .2;
    tambahEfek(m, 2.2, (o, k) => { const q = clamp((k * 2.2 - tunda) / 2), s = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * .55 * (1 - Math.max(0, q - .75) * 4);
      o.visible = q > 0; o.position.set(x0 + Math.sin(q * 9 + i) * .25, y0 + q * 3.2 * sp, z0); o.scale.setScalar(Math.max(.001, s)); o.rotation.y = q * 4 + i; o.material.opacity = 1 - Math.max(0, q - .7) / .3; }); } }
function teksMelayang(p, teks, warna, n = 3, naik = 2.6, dur = 1.8) { const g = p.g;
  for (let i = 0; i < n; i++) { const s = spriteEmoji(teks, warna, 170), a = (i - (n - 1) / 2) * .9, tunda = i * .25;
    tambahEfek(s, dur + n * .25, (o, k) => { const q = clamp((k * (dur + n * .25) - tunda) / dur); o.visible = q > 0;
      o.position.set(g.position.x + Math.cos(g.rotation.y) * a, g.position.y + 4.4 + q * naik, g.position.z - Math.sin(g.rotation.y) * a);
      const uk = Math.sin(Math.min(1, q * 5) * Math.PI / 2) * 1.3; o.scale.set(uk, uk, 1); o.material.opacity = 1 - Math.max(0, q - .65) / .35; }); } }
function percik(x, y, z, besar = 1) { const m = new THREE.Mesh(_GEO_CINCIN, new THREE.MeshBasicMaterial({color: '#FFFFFF', transparent: true, depthWrite: false}));
  tambahEfek(m, .9, (o, k) => { o.position.set(x, y + .04, z); o.scale.setScalar((.6 + k * 2.2) * besar); o.material.opacity = (1 - k) * .85; });
  if (besar > 1.2) for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(_GEO_TETES, new THREE.MeshBasicMaterial({color: '#E8FBFF', transparent: true})), a = i / 9 * 6.28, v = 2 + (i % 3);
    tambahEfek(d, .7, (o, k) => { o.position.set(x + Math.cos(a) * k * 1.6, y + v * k - 6 * k * k, z + Math.sin(a) * k * 1.6); o.material.opacity = 1 - k; }); } }
function awanSedih(p) { const grp = new THREE.Group(), abu = MAT('#9AA6B8', {transparent: true});
  [[0, 0, .5], [-.45, -.08, .38], [.45, -.06, .4], [.2, .2, .36]].forEach(([x, y, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), abu); b.position.set(x, y, 0); grp.add(b); });
  let tetes = 0;
  tambahEfek(grp, 3, (o, k) => { const g = p.g; o.position.set(g.position.x, g.position.y + 5.6 + Math.sin(k * 12) * .05, g.position.z); o.scale.setScalar(Math.min(1, k * 6) * (1 - Math.max(0, k - .85) * 6));
    if (k * 3 > tetes * .22 + .3 && k < .85) { tetes++; const d = new THREE.Mesh(_GEO_TETES, BASIC('#5FB4FF', {transparent: true})), x = g.position.x + (Math.random() - .5) * .9, z = g.position.z + (Math.random() - .5) * .9, y0 = g.position.y + 5.2;
      tambahEfek(d, .5, (o2, k2) => o2.position.set(x, y0 - k2 * 2.2, z)); } }); }

/* ---------- emote: badan ikut bergerak ---------- */
const EMOTE_DUR = {lambai: 2.6, hati: 2.6, tawa: 2.4, tepuk: 2.4, joget: 4.2, duduk: 30, sedih: 3, lompat: 1.2};
function mulaiEmote(p, jenis) { if (!EMOTE_DUR[jenis]) return; p.em = {j: jenis, T: 0, dur: EMOTE_DUR[jenis], tepuk: 0};
  if (jenis === 'hati') hatiMelayang(p); else if (jenis === 'tawa') teksMelayang(p, 'Ha!', '#FFD447', 3, 2, 1.4);
  else if (jenis === 'joget') teksMelayang(p, '♪', '#7ED957', 5, 3.2, 2.2); else if (jenis === 'sedih') awanSedih(p);
  else if (jenis === 'lompat') teksMelayang(p, '★', '#FFD447', 3, 1.6, 1); }
function poseEmote(p, u, t, dt) { const e = p.em; if (!e) return false; e.T += dt; const k = e.T, sisa = e.dur - k, mulus = clamp(Math.min(k * 5, sisa * 4));
  if (sisa <= 0) { p.em = null; return false; }
  const L = u.lg[0].rotation, R = u.lg[1].rotation, mix = (r, x, y, z) => r.set(lerp(r.x, x, mulus), lerp(r.y, y, mulus), lerp(r.z, z, mulus));
  if (e.j === 'lambai') { mix(R, -.25, 0, 2.55 + Math.sin(k * 11) * .4); u.kep.rotation.z = Math.sin(k * 5.5) * .12 * mulus; u.B.rotation.z = Math.sin(k * 5.5) * .04; }
  else if (e.j === 'hati') { mix(L, -1.25, 0, .75); mix(R, -1.25, 0, -.75); u.kep.rotation.z = Math.sin(k * 2.4) * .2 * mulus; u.B.rotation.z = Math.sin(k * 2.4) * .07 * mulus; u.B.position.y = Math.abs(Math.sin(k * 4.8)) * .06; }
  else if (e.j === 'tawa') { mix(L, -.7, 0, .55); mix(R, -.7, 0, -.55); u.kep.rotation.x = (-.32 + Math.sin(k * 22) * .07) * mulus; u.B.rotation.x = -.12 * mulus; u.B.position.y = Math.abs(Math.sin(k * 22)) * .07 * mulus; }
  else if (e.j === 'tepuk') { const c = Math.sin(k * 15); mix(L, -1.35, 0, .2 + c * .32); mix(R, -1.35, 0, -.2 - c * .32); u.B.position.y = Math.abs(c) * .04;
    if (c > .97 && k - e.tepuk > .3) { e.tepuk = k; const g = p.g, a = g.rotation.y, s = spriteEmoji('✦', '#FFFFFF', 200), x = g.position.x + Math.sin(a) * 1.5, z = g.position.z + Math.cos(a) * 1.5, y = g.position.y + 2.2;
      tambahEfek(s, .35, (o, q) => { o.position.set(x, y, z); o.scale.setScalar(.4 + q * 1.1); o.material.opacity = 1 - q; }); } }
  else if (e.j === 'joget') { mix(L, -.2, 0, -2.3 + Math.sin(k * 8) * .6); mix(R, -.2, 0, 2.3 + Math.sin(k * 8 + Math.PI) * .6); u.B.rotation.z = Math.sin(k * 8) * .22 * mulus;
    u.B.rotation.y = Math.sin(k * 4) * .55 * mulus; u.B.position.y = Math.abs(Math.sin(k * 8)) * .25 * mulus; u.kep.rotation.z = -Math.sin(k * 8) * .15 * mulus; }
  else if (e.j === 'duduk') { mix(L, -.5, 0, -.25); mix(R, -.5, 0, .25); u.B.position.y = -.42 * mulus; u.B.rotation.x = -.1 * mulus; u.kep.rotation.z = Math.sin(k * .9) * .08; }
  else if (e.j === 'sedih') { mix(L, .15, 0, -.05); mix(R, .15, 0, .05); u.kep.rotation.x = .42 * mulus; u.B.rotation.x = .16 * mulus; u.kep.rotation.z = Math.sin(k * 1.6) * .06; }
  else if (e.j === 'lompat') { mix(L, 0, 0, -2.6); mix(R, 0, 0, 2.6); }
  return true; }

/* ---------- pose dasar: jalan, lari, di udara, berenang, memancing ---------- */
function poseKarakter(p, t, dt, diUdara) { const u = p.g.userData, jalan = Math.min(1, p.l / 9), lari = p.l > 11, fase = t * (lari ? 16 : 11) + (p.no || 0);
  u.B.rotation.y = 0; u.kep.rotation.x = 0; u.kep.rotation.z = 0;
  if (p.s === 1) {   /* berenang gaya bebas: badan condong, lengan mengayuh bergantian */
    const fs = t * (lari ? 7 : 5) + (p.no || 0), ayuh = Math.max(.25, jalan);
    u.B.position.y = Math.sin(t * 2.6 + (p.no || 0)) * .06; u.B.rotation.x = .75 + .45 * jalan; u.B.rotation.z = Math.sin(fs) * .14 * ayuh;   /* badan rebah di permukaan */
    u.lg[0].rotation.set(jalan > .15 ? -(fs % 6.283) : -1.2 + Math.sin(t * 3) * .5, 0, -.35); u.lg[1].rotation.set(jalan > .15 ? -((fs + Math.PI) % 6.283) : -1.2 - Math.sin(t * 3) * .5, 0, .35);
    u.kep.rotation.x = -.55 - .35 * jalan; }   /* kepala menengadah, melihat ke depan */
  else {
    u.B.position.y = diUdara ? .1 : Math.abs(Math.sin(fase)) * .22 * jalan; u.B.rotation.z = Math.sin(fase) * .06 * jalan; u.B.rotation.x = .08 * jalan;
    u.lg[0].rotation.set(Math.sin(fase) * .9 * jalan, 0, -.2); u.lg[1].rotation.set(-Math.sin(fase) * .9 * jalan, 0, .2);
    if (diUdara) { u.lg[0].rotation.z = -1.3; u.lg[1].rotation.z = 1.3; } }
  if (p.s === 2) { u.lg[1].rotation.set(-1.05 + (p.tarikan || 0), 0, .05); u.lg[0].rotation.set(-.8, 0, .55); u.B.rotation.x = .05; }
  if (p.s === 3) { u.lg[1].rotation.set(-2.4, 0, .05); u.lg[0].rotation.set(-2.2, 0, -.05); u.B.rotation.x = -.15; }
  if (u.ekor) u.ekor.rotation.y = Math.sin(fase * (jalan ? 1 : .3) + t * 3) * .35;
  if (p.l > .6 && p.em && p.em.j === 'duduk') p.em = null;     /* bergerak = berdiri lagi */
  if (p.s !== 1 || !p.em || p.em.j === 'lambai' || p.em.j === 'hati' || p.em.j === 'sedih') poseEmote(p, u, t, dt);
  aturAlat(p, t);
  if (p.ob) { p.ob.T -= dt; const s = clamp(Math.min((6.5 - p.ob.T) * 6, p.ob.T * 3)); p.ob.spr.scale.set(p.ob.w * s, p.ob.h * s, 1); if (p.ob.T <= 0) { p.g.remove(p.ob.spr); p.ob.spr.material.map.dispose(); p.ob.spr.material.dispose(); p.ob = null; } }
  if (p.s === 1 && p.l > 1.5) { p._pc = (p._pc || 0) - dt; if (p._pc <= 0) { p._pc = .28; const a = p.g.rotation.y; percik(p.g.position.x + Math.sin(a) * .9, airDi(p.g.position.x, p.g.position.z, t), p.g.position.z + Math.cos(a) * .9, .8); } }
  if ((p.s === 1) !== !!p._diAir) { p._diAir = p.s === 1; if (p._diAir) percik(p.g.position.x, airDi(p.g.position.x, p.g.position.z, t), p.g.position.z, 1.8); } }

/* ---------- gelembung obrolan di atas kepala ---------- */
function gelembungObrol(p, teks) { if (!p || !p.g) return;
  if (p.ob) { p.g.remove(p.ob.spr); p.ob.spr.material.map.dispose(); p.ob.spr.material.dispose(); }
  const c = kanvas(512, 256), x = c.getContext('2d'); x.font = "600 38px 'Fredoka', sans-serif";
  const kata = teks.split(' '), baris = []; let b = '';
  for (const w of kata) { const coba = b ? b + ' ' + w : w; if (x.measureText(coba).width > 440 && b) { baris.push(b); b = w; } else b = coba; } if (b) baris.push(b);
  const n = Math.min(3, baris.length); if (baris.length > 3) baris[2] = baris[2].slice(0, 22) + '…';
  const lebar = Math.min(480, Math.max(...baris.slice(0, n).map(s => x.measureText(s).width)) + 48), tinggiK = n * 46 + 34, x0 = (512 - lebar) / 2, y0 = 200 - tinggiK;
  x.fillStyle = '#FFFFFF'; x.strokeStyle = '#2B2238'; x.lineWidth = 7; x.beginPath(); x.roundRect(x0, y0, lebar, tinggiK, 26); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(236, 196); x.lineTo(256, 236); x.lineTo(276, 196); x.closePath(); x.fill(); x.stroke(); x.fillRect(238, 190, 36, 8);
  x.fillStyle = '#2B2238'; x.textAlign = 'center'; x.textBaseline = 'middle'; baris.slice(0, n).forEach((s, i) => x.fillText(s, 256, y0 + 17 + 23 + i * 46));
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tx, transparent: true, depthWrite: false})); spr.position.y = p.g.userData.atas + .95; spr.renderOrder = 5;
  p.g.add(spr); p.ob = {spr, T: 6.5, w: 2.8, h: 1.4}; }

/* ---------- memancing ---------- */
const IKAN_JENIS = [   /* b = bobot peluang, uk = ukuran (cm) bila ikan; e = emoji bila bukan ikan */
  {n: 'Ikan Teri', b: 20, w: '#B8C7D9', uk: [5, 9]}, {n: 'Ikan Kembung', b: 17, w: '#6A93C9', uk: [15, 26]}, {n: 'Ikan Badut', b: 10, w: '#FF8A2A', uk: [8, 11], belang: true},
  {n: 'Ikan Kakap Merah', b: 9, w: '#E8494A', uk: [25, 60]}, {n: 'Ikan Tongkol', b: 9, w: '#3E5C8A', uk: [30, 70]}, {n: 'Ikan Buntal', b: 7, w: '#E8D06A', uk: [10, 25], bulat: true},
  {n: 'Kepiting', b: 7, e: '🦀'}, {n: 'Bintang Laut', b: 5, e: '⭐'}, {n: 'Cumi-cumi', b: 5, e: '🦑'}, {n: 'Ikan Pari', b: 3, w: '#8A7A6A', uk: [40, 90], pipih: true},
  {n: 'Sepatu Bot Tua', b: 6, e: '🥾'}, {n: 'Ikan Hiu Kecil', b: 1, w: '#7A8A99', uk: [60, 110], langka: true}];
function modelIkan(i) { const J = IKAN_JENIS[i] || IKAN_JENIS[0];
  if (J.e) { const s = spriteEmoji(J.e, '#FFFFFF', 190); s.scale.set(1.4, 1.4, 1); return s; }
  const g = new THREE.Group(), m = MAT(J.w), perut = MAT('#F4F1E8');
  const badan = bola(.42, m, 0, 0, 0, J.pipih ? 1.5 : .55, J.pipih ? .25 : J.bulat ? .9 : .6, J.bulat ? .9 : 1.25, g, 1.08); badan.rotation.y = J.pipih ? Math.PI / 2 : 0;
  if (!J.pipih) bola(.3, perut, 0, -.1, .05, .45, .35, 1, g, 0);
  const ekor = new THREE.Mesh(new THREE.ConeGeometry(.26, .45, 4), m); ekor.rotation.x = -Math.PI / 2; ekor.scale.set(.25, 1, 1.2); ekor.position.z = J.pipih ? -.55 : -.62; garis(ekor, 1.1); g.add(ekor);
  if (J.belang) [-.15, .2].forEach(z => bola(.43, MAT('#FFFFFF'), 0, 0, z, .57, .62, .12, g, 0));
  [-1, 1].forEach(s => { bola(.07, MAT('#FFFFFF'), s * .2, .1, .3, 1, 1, 1, g, 0); bola(.04, MAT('#2B2238'), s * .25, .1, .33, 1, 1, 1, g, 0); });
  g.scale.setScalar(J.langka ? 1.5 : 1); return g; }
function pilihIkan() { const tot = IKAN_JENIS.reduce((a, j) => a + j.b, 0); let r = Math.random() * tot; for (let i = 0; i < IKAN_JENIS.length; i++) { r -= IKAN_JENIS[i].b; if (r <= 0) return i; } return 0; }
const _JORAN_M = MAT('#8A5A3A'), _GARIS_M = new THREE.LineBasicMaterial({color: '#3A3340'});
function aturAlat(p, t) { const pakai = p.s === 2 || p.s === 3;
  if (!pakai) { if (p.alat) { p.g.remove(p.alat.joran); scene.remove(p.alat.garis, p.alat.pel); p.alat = null; } return; }
  if (!p.alat) { const joran = new THREE.Group(), batang = new THREE.Mesh(new THREE.CylinderGeometry(.035, .06, 2.6, 8), _JORAN_M); batang.position.y = 1.3; joran.add(batang);
    const gul = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .12, 12), MAT('#5A5A66')); gul.rotation.z = Math.PI / 2; gul.position.y = .35; joran.add(gul);
    const ujung = new THREE.Object3D(); ujung.position.y = 2.6; joran.add(ujung); joran.ujung = ujung; joran.position.set(.6, .8, .55); p.g.add(joran);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 3), 3)); const garis = new THREE.Line(geo, _GARIS_M); garis.frustumCulled = false;
    const pel = new THREE.Group(); bola(.13, MAT('#FF4D6A'), 0, .06, 0, 1, 1, 1, pel); bola(.13, MAT('#FFFFFF'), 0, -.06, 0, 1, .6, 1, pel, 0); scene.add(garis, pel); p.alat = {joran, garis, pel}; }
  const A = p.alat; A.joran.rotation.x = p.s === 3 ? .25 : 1.0 + (p.tarikan || 0) * .8;
  const a = p.g.rotation.y, jauh = p.lempar === undefined ? 1 : p.lempar, bx = p.g.position.x + Math.sin(a) * 7 * jauh, bz = p.g.position.z + Math.cos(a) * 7 * jauh;
  const makan = p.makan ? Math.max(0, Math.sin(t * 18)) * .28 : 0, by = p.s === 3 ? null : airDi(bx, bz, t) + .05 - makan + Math.sin(t * 2.2 + (p.no || 0)) * .03;
  p.g.updateMatrixWorld(); const tip = A.joran.ujung.getWorldPosition(_vA.set(0, 0, 0));
  const pel = A.pel.position; if (p.s === 3) pel.set(tip.x, tip.y - 1.2, tip.z); else if (jauh < 1) pel.set(lerp(tip.x, bx, jauh), lerp(tip.y, by, jauh) + Math.sin(jauh * Math.PI) * 2.5, lerp(tip.z, bz, jauh)); else pel.set(bx, by, bz);
  const P = A.garis.geometry.attributes.position, kendur = p.s === 3 ? 0 : 1.1;
  for (let i = 0; i < 16; i++) { const f = i / 15; P.setXYZ(i, lerp(tip.x, pel.x, f), lerp(tip.y, pel.y, f) - Math.sin(f * Math.PI) * kendur * (p.makan ? .2 : 1), lerp(tip.z, pel.z, f)); }
  P.needsUpdate = true; }
const _vA = V(0, 0, 0);
function pamerIkan(p, i) { const m = modelIkan(i); m.position.set(0, p.g.userData.atas + 1.45, .2);
  tambahEfek(m, 2.4, (o, k) => { const s = Math.sin(Math.min(1, k * 6) * Math.PI / 2) / SKALA_WARGA * 2; if (o.isSprite) o.scale.set(s * 1.1, s * 1.1, 1); else { o.scale.setScalar(s); o.rotation.z = Math.sin(k * 30) * .3 * (1 - k); o.rotation.y = Math.PI / 2; }
    o.position.y = p.g.userData.atas + 1.45 + Math.sin(k * 6) * .08; }, p.g); }

/* ---------- memancing milik sendiri (tombol F / 🎣) ---------- */
const PANCING = {fase: '', T: 0, ikan: -1};
const TANGKAPAN_SIMPAN = 'ikan_kota_binatang';
function catatanIkan() { return JSON.parse(localStorage.getItem(TANGKAPAN_SIMPAN) || 'null') || {total: 0, jenis: {}, terbesar: null}; }
function tampilTangkapan() { const c = catatanIkan(), el = $('#tangkap'); el.innerHTML = `🎣 <b>${c.total}</b><span class="rinci"> tangkapan` + (c.terbesar ? ` · terbesar ${c.terbesar.n} ${c.terbesar.cm} cm` : '') + '</span>'; el.style.display = c.total ? '' : 'none'; }
function airDepan(x, z, a) { const bx = x + Math.sin(a) * 7, bz = z + Math.cos(a) * 7; return pantaiS(bx, bz) < -1.2 && airDi(bx, bz, tAnim) - tanahJalan(bx, bz) > .35; }
function tekanMancing() { if (!JL.aktif) return;
  if (!PANCING.fase) {
    if (JL.s === 1) { toast('Naik ke darat dulu untuk memancing 🎣'); return; }
    if (JL.y > tanahJalan(JL.x, JL.z) + .14 * SKALA_WARGA + .1) return;
    let a = null; for (const d of [0, .3, -.3, .6, -.6, .9, -.9, 1.3, -1.3, 1.8, -1.8, 2.4, -2.4, Math.PI]) if (airDepan(JL.x, JL.z, JL.arah + d)) { a = JL.arah + d; break; }
    if (a === null) { toast('Cari tepi pantai dulu, lalu hadap ke laut 🌊🎣'); return; }
    JL.arah = a; JL.kamYaw = a; PANCING.fase = 'lempar'; PANCING.T = 0; JL.s = 2; JL.lempar = 0; JL.em = null; return; }
  if (PANCING.fase === 'makan') { PANCING.fase = 'tarik'; PANCING.T = 0; JL.makan = false; PANCING.ikan = pilihIkan(); return; }
  if (PANCING.fase === 'lempar' || PANCING.fase === 'tunggu') berhentiMancing('Pancing digulung lagi.'); }
function berhentiMancing(pesan) { PANCING.fase = ''; JL.s = 0; JL.makan = false; JL.tarikan = 0; JL.lempar = undefined; if (pesan) toast(pesan); $('#seru').style.display = 'none'; }
function langkahMancing(dt) { if (!PANCING.fase) return; PANCING.T += dt; const P = PANCING;
  if (P.fase === 'lempar') { JL.tarikan = P.T < .35 ? -P.T * 2.2 : Math.max(0, -.77 + (P.T - .35) * 5); JL.lempar = clamp((P.T - .35) / .55);
    if (P.T > .9) { P.fase = 'tunggu'; P.T = 0; P.tunggu = 2.5 + Math.random() * 5; JL.tarikan = 0; JL.lempar = undefined; const a = JL.arah; percik(JL.x + Math.sin(a) * 7, airDi(JL.x + Math.sin(a) * 7, JL.z + Math.cos(a) * 7, tAnim), JL.z + Math.cos(a) * 7, .7); } }
  else if (P.fase === 'tunggu' && P.T > P.tunggu) { P.fase = 'makan'; P.T = 0; JL.makan = true; $('#seru').style.display = ''; }
  else if (P.fase === 'makan' && P.T > 1.7) { P.fase = 'tunggu'; P.T = 0; P.tunggu = 2 + Math.random() * 4; JL.makan = false; $('#seru').style.display = 'none'; toast('Yah, ikannya kabur! Tunggu umpan dimakan lagi 🐟'); }
  else if (P.fase === 'tarik') { $('#seru').style.display = 'none'; JL.s = 3;
    if (P.T > .7) { const J = IKAN_JENIS[P.ikan], cm = J.uk ? Math.round(J.uk[0] + Math.random() * (J.uk[1] - J.uk[0])) : 0, c = catatanIkan();
      c.total++; c.jenis[J.n] = (c.jenis[J.n] || 0) + 1; if (cm && (!c.terbesar || cm > c.terbesar.cm)) c.terbesar = {n: J.n, cm}; localStorage.setItem(TANGKAPAN_SIMPAN, JSON.stringify(c)); tampilTangkapan();
      pamerIkan(JL, P.ikan); percik(JL.x + Math.sin(JL.arah) * 7, airDi(JL.x, JL.z, tAnim), JL.z + Math.cos(JL.arah) * 7, 1.6);
      toast(J.e ? `Dapat ${J.n}! ${J.e}` : `Dapat ${J.n} ${cm} cm! 🎣${J.langka ? ' Langka sekali!' : ''}`); kirimIkan(P.ikan); P.fase = 'pamer'; P.T = 0; } }
  else if (P.fase === 'pamer' && P.T > 2.2) berhentiMancing(''); }

/* ================= MAIN BARENG: pemain lain terlihat langsung + obrolan dekat & global ================= */
/* Sambungan WebSocket ke Worker "kota-binatang-main" (config.json → main_url).
   - saat jalan-jalan: masuk sebagai PEMAIN (KTP) → kirim posisi, emote, obrolan, tangkapan ikan
   - di halaman awal: masuk sebagai PENONTON → melihat pemain berjalan di peta kota & membaca obrolan global
   Semua obrolan disensor di server; sensorTeks() di sini hanya lapisan kedua sebelum dikirim & ditampilkan. */
const MP = {ws: null, mau: false, peran: '', pemain: new Map(), kirimT: 0, terakhir: '', ulang: 0, jeda: null, online: 0, saya: 0};
const mainUrl = () => (CFG.main_url || '').replace(/^http/, 'ws').replace(/\/?$/, '') + '/main';
function aturTeman() { const n = MP.pemain.size, el = $('#teman');
  el.textContent = !MP.ws || MP.ws.readyState !== 1 ? '🔌 Menyambung ke ruang main bareng…' : n ? `👥 ${n} warga jalan-jalan bersamamu` : '👥 Belum ada warga lain — ajak temanmu!';
  const o = $('#nOnline'); if (MP.peran === 'lihat' && MP.ws && MP.ws.readyState === 1) { o.textContent = n ? `🟢 ${n} warga sedang jalan-jalan — klik untuk melihat` : ''; o.style.display = n ? '' : 'none'; o.classList.toggle('klik', !!n); } }
function buka(peran) { if (!CFG.main_url) { $('#teman').style.display = 'none'; return; }
  if (MP.ws && MP.peran === peran && MP.ws.readyState <= 1) return;
  tutupWs(); MP.peran = peran; MP.mau = true; clearTimeout(MP.jeda);
  const k = ktpSaya(); if (peran === 'main' && !k) return;
  let ws; try { ws = new WebSocket(mainUrl()); } catch (e) { return; }
  MP.ws = ws; aturTeman();
  ws.onopen = () => { MP.ulang = 0; ws.send(JSON.stringify(peran === 'main' ? {t: 'masuk', no: k.no, x: JL.x, z: JL.z, y: JL.y, a: JL.arah} : {t: 'lihat'})); aturTeman(); };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (_) { return; } terima(m); };
  ws.onclose = () => { if (MP.ws && MP.ws !== ws) return;   /* sambungan lama yang sudah diganti */
    MP.ws = null; hapusSemuaTeman(); aturTeman();
    if (MP.mau && MP.peran === peran && (peran === 'lihat' ? !JL.aktif && !document.hidden : JL.aktif)) { const tunggu = Math.min(30000, 2000 * 2 ** MP.ulang++); MP.jeda = setTimeout(() => buka(peran), tunggu); }
    if (!MP.mau && JL.aktif) $('#teman').textContent = '🐾 Jalan-jalan sendiri'; }; }
function terima(m) {
  if (m.t === 'halo') { MP.saya = m.saya; hapusSemuaTeman(); m.pemain.forEach(tambahTeman); aturTeman(); $('#logObrol').innerHTML = ''; $('#feedObrol').innerHTML = ''; (m.obrolan || []).forEach(o => tulisObrol(o, true)); }
  else if (m.t === 'baru') { tambahTeman(m.p); aturTeman(); if (JL.aktif) { toast(`${m.p.nama} ikut jalan-jalan! 🐾`); tulisSistem(`🐾 ${m.p.nama} ikut jalan-jalan`); } }
  else if (m.t === 'p') { const p = MP.pemain.get(m.no); if (p) Object.assign(p.tuju, {x: m.x, z: m.z, y: m.y, a: m.a, l: m.l}), p.s = m.s || 0; }
  else if (m.t === 'e') { const p = MP.pemain.get(m.no); if (p) mulaiEmote(p, m.e); }
  else if (m.t === 'ikan') { const p = MP.pemain.get(m.no), J = IKAN_JENIS[m.i]; if (p) { p.s = 3; pamerIkan(p, m.i); } if (J && p) tulisSistem(`🎣 ${p.nama} dapat ${J.n}!`); }
  else if (m.t === 'o') { tulisObrol(m); const p = m.no === MP.saya ? (JL.aktif ? JL : null) : MP.pemain.get(m.no); if (p) gelembungObrol(p, sensorTeks(m.teks)); }
  else if (m.t === 'info') toast(m.pesan);
  else if (m.t === 'pergi') { const p = MP.pemain.get(m.no); if (p && JL.aktif) tulisSistem(`👋 ${p.nama} pulang`); hapusTeman(m.no); aturTeman(); }
  else if (m.t === 'tolak' || m.t === 'penuh') { toast(m.pesan); if (!m.ulang) MP.mau = false; else MP.ulang = Math.max(MP.ulang, 3); } }
function tutupWs() { clearTimeout(MP.jeda); if (MP.ws) { const w = MP.ws; MP.ws = null; try { w.close(1000); } catch (e) {} } hapusSemuaTeman(); }
function sambungMP() { buka('main'); }
function putusMP() { MP.mau = false; tutupWs(); setTimeout(() => { if (!JL.aktif) buka('lihat'); }, 300); }
function tambahTeman(p) { hapusTeman(p.no);
  const g = buatBinatang(JENIS_ID[p.jenis] || JENIS[0], rng(p.no * 131 + 7), opsiKtp(p.gaya || {})); g.scale.setScalar(SKALA_WARGA); g.add(papanNama(p.nama, g.userData.atas)); scene.add(g);
  const q = {no: p.no, nama: p.nama, g, x: p.x, z: p.z, y: p.y || tanahJalan(p.x, p.z), a: p.a || 0, l: 0, s: p.s || 0, tuju: {x: p.x, z: p.z, y: p.y, a: p.a || 0, l: 0}, em: null, ob: null, alat: null};
  g.position.set(q.x, q.y, q.z); MP.pemain.set(p.no, q); }
function hapusTeman(no) { const p = MP.pemain.get(no); if (p) { if (p.alat) scene.remove(p.alat.garis, p.alat.pel); scene.remove(p.g); MP.pemain.delete(no); } }
function hapusSemuaTeman() { [...MP.pemain.keys()].forEach(hapusTeman); }

/* ---------- emote ---------- */
const EMOTE_TOMBOL = {Digit1: 'lambai', Digit2: 'hati', Digit3: 'tawa', Digit4: 'tepuk', Digit5: 'joget', Digit6: 'duduk', Digit7: 'sedih', KeyE: 'lambai'};
function kirimEmote(jenis) { if (!JL.aktif || !JL.g || PANCING.fase) return; mulaiEmote(JL, jenis); if (jenis === 'lompat') lompat();
  if (MP.ws && MP.ws.readyState === 1 && MP.peran === 'main') MP.ws.send(JSON.stringify({t: 'e', e: jenis})); $('#emote').classList.remove('buka'); }
document.querySelectorAll('#emote [data-e]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); kirimEmote(b.dataset.e); }));
$('#bEmote').addEventListener('pointerdown', e => { e.preventDefault(); $('#emote').classList.toggle('buka'); });
addEventListener('keydown', e => { if (!JL.aktif) return;
  if (document.activeElement === $('#isiObrol')) { if (e.key === 'Escape') { $('#isiObrol').blur(); } return; }
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'Enter' || e.code === 'KeyT') { e.preventDefault(); bukaObrol(); return; }
  const m = EMOTE_TOMBOL[e.code]; if (m) kirimEmote(m); });
function kirimIkan(i) { if (MP.ws && MP.ws.readyState === 1 && MP.peran === 'main') MP.ws.send(JSON.stringify({t: 'ikan', i})); }

/* ---------- obrolan ---------- */
let RUANG = 'g';
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function barisObrol(o) { const J = JENIS_ID[o.jenis] || JENIS[0]; return `<b>${o.k === 'd' ? '📍' : ''}${J.e} ${escHtml(o.nama)}:</b> ${escHtml(sensorTeks(o.teks))}`; }
function tambahBaris(wadah, html, kelas, maks) { const d = document.createElement('div'); d.className = kelas; d.innerHTML = html; wadah.appendChild(d); while (wadah.children.length > maks) wadah.firstChild.remove(); wadah.scrollTop = wadah.scrollHeight; }
function tulisObrol(o) { tambahBaris($('#logObrol'), barisObrol(o), o.k === 'd' ? 'dekat' : '', 60); if (o.k !== 'd') tambahBaris($('#feedObrol'), barisObrol(o), '', 8);
  $('#feedJudul').style.display = $('#feedObrol').children.length ? '' : 'none'; if (JL.aktif && !$('#obrol').classList.contains('buka')) $('#bObrol').classList.add('baru'); }
function tulisSistem(teks) { tambahBaris($('#logObrol'), escHtml(teks), 'sistem', 60); }
function bukaObrol() { $('#obrol').classList.add('buka'); $('#bObrol').classList.remove('baru'); $('#isiObrol').focus(); JL.kunci = {}; }
$('#bObrol').addEventListener('click', () => { const b = $('#obrol').classList.toggle('buka'); $('#bObrol').classList.remove('baru'); if (b && !matchMedia('(pointer:coarse)').matches) $('#isiObrol').focus(); });
document.querySelectorAll('#ruang [data-r]').forEach(b => b.addEventListener('click', () => { RUANG = b.dataset.r; document.querySelectorAll('#ruang [data-r]').forEach(x => x.classList.toggle('on', x === b));
  $('#isiObrol').placeholder = RUANG === 'g' ? 'Tulis untuk semua warga…' : 'Tulis untuk warga di dekatmu…'; $('#isiObrol').focus(); }));
$('#formObrol').addEventListener('submit', e => { e.preventDefault(); const el = $('#isiObrol'), teks = sensorTeks(el.value);
  if (!teks.replace(/[*\s]/g, '')) return;
  if (!MP.ws || MP.ws.readyState !== 1 || MP.peran !== 'main') { toast('Belum tersambung ke ruang main bareng'); return; }
  MP.ws.send(JSON.stringify({t: 'o', k: RUANG, teks})); el.value = ''; if (matchMedia('(pointer:coarse)').matches) el.blur(); });
$('#isiObrol').addEventListener('blur', () => { JL.kunci = {}; });

/* ---------- tiap frame: kirim posisi sendiri, gerakkan pemain lain ---------- */
function langkahBareng(t, dt) {
  if (JL.aktif) {   /* kirim posisi sendiri ±8x per detik, hanya bila berubah (atau tiap 3 detik supaya tetap terlihat) */
    MP.kirimT -= dt;
    if (MP.ws && MP.ws.readyState === 1 && MP.peran === 'main' && MP.kirimT <= 0) { const r = v => Math.round(v * 100) / 100;
      const s = JSON.stringify({t: 'p', x: r(JL.x), z: r(JL.z), y: r(JL.y), a: r(JL.arah), l: r(JL.laju), s: JL.s});
      if (s !== MP.terakhir || MP.kirimT < -3) { MP.ws.send(s); MP.terakhir = s; MP.kirimT = .125; } } }
  const k = 1 - Math.exp(-dt * (MP.peran === 'lihat' ? 5 : 10));
  MP.pemain.forEach(p => { const T = p.tuju;
    if (Math.hypot(T.x - p.x, T.z - p.z) > 25) { p.x = T.x; p.z = T.z; p.y = T.y; }
    p.x = lerp(p.x, T.x, k); p.z = lerp(p.z, T.z, k); p.y = lerp(p.y, T.y, k); p.l = lerp(p.l, T.l, k);
    p.a += Math.atan2(Math.sin(T.a - p.a), Math.cos(T.a - p.a)) * k;
    p.g.position.set(p.x, p.y, p.z); p.g.rotation.y = p.a;
    poseKarakter(p, t, dt, p.s !== 1 && p.y > tanahJalan(p.x, p.z) + .14 * SKALA_WARGA + .1); }); }
/* halaman awal: klik "N warga sedang jalan-jalan" → kamera terbang ke salah satu pemain */
let _lihatKe = 0;
$('#nOnline').addEventListener('click', () => { const ps = [...MP.pemain.values()]; if (!ps.length) return; const p = ps[_lihatKe++ % ps.length];
  ORB_T.tgt.set(p.x, p.y + 2, p.z); ORB_T.r = HP ? 34 : 28; ORB_T.ph = 1.1; diam = -20; toast(`Itu ${p.nama}! 🐾`); });
/* jumlah yang sedang jalan-jalan, untuk panel (cadangan bila sambungan penonton belum terbuka) */
async function cekOnline() { if (!CFG.main_url || document.hidden) return;
  if (!JL.aktif && (!MP.ws || MP.peran !== 'lihat')) buka('lihat');
  if (MP.ws && MP.ws.readyState === 1) return;
  try { const j = await fetch(CFG.main_url.replace(/\/?$/, '') + '/jumlah').then(r => r.json()); MP.online = j.online || 0;
    const el = $('#nOnline'); el.textContent = MP.online ? `🟢 ${MP.online} warga sedang jalan-jalan sekarang` : ''; el.style.display = MP.online ? '' : 'none'; } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (MP.peran === 'lihat') { MP.mau = false; tutupWs(); } } else if (!JL.aktif) buka('lihat'); });
tampilTangkapan();

/*================= LOOP ================= */
let t0 = performance.now(), tl = t0;
function loop(now) { const t = (now - t0) / 1000, dt = clamp((now - tl) / 1000, 0, .05); tl = now; tAnim = t; diam += dt;
  if (JL.aktif) langkahJelajah(t, dt); langkahBareng(t, dt); langkahEfek(); if (!JL.aktif) {
  if (diam > 8 && !jari.size) ORB_T.th += dt * .03 * Math.cos(t * .05);           // goyang pelan kiri-kanan
  const k = 1 - Math.exp(-dt * 5); ORB.th = lerp(ORB.th, ORB_T.th, k); ORB.ph = lerp(ORB.ph, ORB_T.ph, k); ORB.r = lerp(ORB.r, ORB_T.r, k); ORB.tgt.lerp(ORB_T.tgt, k);
  cam.position.set(ORB.tgt.x + Math.sin(ORB.ph) * Math.sin(ORB.th) * ORB.r, ORB.tgt.y + Math.cos(ORB.ph) * ORB.r, ORB.tgt.z + Math.sin(ORB.ph) * Math.cos(ORB.th) * ORB.r);
  cam.position.y = Math.max(cam.position.y, tinggi(cam.position.x, cam.position.z) + 2, .8); cam.lookAt(ORB.tgt); }
  for (let i = 0; i < LP.count; i++) LP.setY(i, ombak(LX[i], LZ[i], t) - (LS ? clamp((LS[i] + 1.9) / 3, 0, 1) * 1.4 : 0));
  LP.needsUpdate = true; LG.computeVertexNormals(); pola.offset.set(t * .004, t * .002);
  airMengalir(t); letakApi(t, 1);
  AWAN.forEach(w => { const a = w.a + t * .004; w.g.position.x = Math.sin(a) * w.d; w.g.position.z = Math.cos(a) * w.d - 80; });
  letakTokoh(t);
  WARGA.forEach(g => { const u = g.userData, [bx, bz] = TEMPAT[u.slot];
    const a = u.r * 6.28 + t * (.25 + u.r2 * .25), x = bx + Math.cos(a) * .35, z = bz + Math.sin(a) * .25, jatuh = seg(t, u.lahir, u.lahir + .8);
    g.position.set(x, tinggi(x, z) + .14 * SKALA_WARGA + (1 - E.out(jatuh)) * 16, z);
    g.rotation.y = Math.atan2(PUSAT_KOTA[0] - x, PUSAT_KOTA[1] - z) + Math.sin(t * .6 + u.r * 9) * .25;
    const lompat = Math.max(0, Math.sin(t * 2.2 + u.r * 40)); u.B.position.y = (lompat > .93 ? (lompat - .93) * 6 : 0) + Math.abs(Math.sin(t * 5 + u.r * 20)) * .04;
    u.kep.rotation.z = Math.sin(t * 2 + u.r * 9) * .08; if (u.ekor) u.ekor.rotation.y = Math.sin(t * 4 + u.r * 30) * .3; g.visible = t > u.lahir - .05 && !(u.kunci && ((JL.aktif && u.kunci.startsWith(JL.kunciSaya)) || (u.kunci[0] === 'k' && MP.pemain.has(parseInt(u.kunci.slice(1))))));   /* yang sedang jalan-jalan tidak ikut berdiri di kerumunan */
    const lb = clamp((Math.sin(t * .45 + u.r * 30) - .75) * 5, 0, 1), ayun = Math.sin(t * 2.4 + u.r * 7) * .12;
    u.lg[0].rotation.set(ayun, 0, -.2); u.lg[1].rotation.set(-ayun - .2 * lb, 0, .2 + lb * (2.4 + Math.sin(t * 9 + u.r) * .3)); });
  if ($('#modal').classList.contains('on') && $('#formKtp').style.display !== 'none') PRATINJAU.gambar(t);
  REN.render(scene, cam); requestAnimationFrame(loop); }

function ukur() { const w = innerWidth, h = innerHeight, hp = w <= 820, jl = document.body.classList.contains('jelajah'), geserX = hp || jl ? 0 : 392, geserY = hp && !jl ? Math.round(h * .34) : 0;
  REN.setSize(w, h); cam.aspect = (w + geserX) / (h + geserY); cam.setViewOffset(w + geserX, h + geserY, geserX, geserY, w, h); cam.updateProjectionMatrix(); }
ukur(); addEventListener('resize', ukur);
const LS = (() => { const a = new Float32Array(LP.count); for (let i = 0; i < LP.count; i++) a[i] = pantaiS(LX[i], LZ[i]); return a; })();
$('#lipat').addEventListener('click', () => document.body.classList.toggle('tutup'));
muat(true).then(() => { $('#muat').classList.add('hilang'); requestAnimationFrame(loop);
  setInterval(() => { if (!document.hidden) muat(false); }, CFG.data_url ? 30000 : 60000); cekOnline(); setInterval(cekOnline, 30000); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) muat(false); });
tampilTombolJalan();
