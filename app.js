/* The Climate of a Street — interactive figures. All numbers are read from data/*.json. */
(() => {
"use strict";
const NS = "http://www.w3.org/2000/svg";
const TC = {S1:"#009E73",S2:"#56B4E9",S3:"#E69F00",S4:"#D55E00"}, TCT = {S1:"#00805D",S2:"#2F86B8",S3:"#A87200",S4:"#C04F00"};
const T4 = ["S1","S2","S3","S4"];
const NAME = {en:{S1:"open & green",S2:"tall & spaced",S3:"mid-density, less green",S4:"dense low-rise, enclosed, least green"},
              ko:{S1:"트이고 녹지가 많은 거리",S2:"높고 간격이 넓은 거리",S3:"중밀도, 녹지가 적은 거리",S4:"저층 밀집, 둘러싸이고 녹지가 가장 적은 거리"}};
let LANG = "en"; const D = {}; const renders = [];
const L = (en, ko) => LANG === "ko" ? ko : en;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function txt(parent, x, y, s, a = {}) { const t = el("text", Object.assign({x, y, "font-size": 13, fill: "#1C2629"}, a), parent); t.textContent = s; return t; }
function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
const sgn = (v, d) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
const num = (v, d) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(d);
function get(path) { let v = D.values; for (const p of path.split(".").reduce((a, b, i, arr) => a, [])) {}
  if (path in D.values) return D.values[path];
  const [a, ...rest] = path.split("."); let o = D.values[a]; for (const r of rest) o = o && o[r]; return o; }
function fmt(v, f) {
  const x = Array.isArray(v) ? v[0] : v;
  switch (f) {
    case "sg1": return sgn(x, 1); case "sg2": return sgn(x, 2);
    case "f0": return num(x, 0); case "f1": return num(x, 1); case "f2": return num(x, 2); case "f3": return num(x, 3);
    case "int": return Math.round(x).toString(); case "int,": return Math.round(x).toLocaleString("en-US");
    case "pct0": return Math.round(100 * x) + "%"; case "pct1": return (100 * x).toFixed(1) + "%";
    case "pct0i0": return Math.round(100 * v[0]) + "%";
    case "ci1": return `[${num(v[1], 1)}, ${num(v[2], 1)}]`; case "ci2": return `[${num(v[1], 2)}, ${num(v[2], 2)}]`;
  } return String(x);
}

/* ---------- language ---------- */
function setLang(l, rerender = true) {
  LANG = l; document.documentElement.dataset.l = l; document.documentElement.lang = l;
  $$(".lang button").forEach(b => b.classList.toggle("on", b.dataset.set === l));
  try { localStorage.setItem("lang", l); } catch (e) {}
  try { const u = new URL(location.href); u.searchParams.set("lang", l); history.replaceState(null, "", u); } catch (e) {}
  if (rerender) renders.forEach(f => f());
}
$$(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.set)));
(function initLang() {
  let l = null; try { l = new URL(location.href).searchParams.get("lang") || (location.hash === "#ko" ? "ko" : location.hash === "#en" ? "en" : null); } catch (e) {}
  if (!l) { try { l = localStorage.getItem("lang"); } catch (e) {} }
  if (!l) l = (navigator.language || "").startsWith("ko") ? "ko" : "en";
  setLang(l === "ko" ? "ko" : "en", false);
})();

/* ---------- fill numbers ---------- */
function fillNumbers() {
  $$("[data-v]").forEach(s => { const v = get(s.dataset.v); if (v === undefined) { s.textContent = "??"; s.style.background = "#fdd"; return; } s.textContent = fmt(v, s.dataset.f); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); countUp(e.target); }), {threshold: .4});
  $$("[data-count]").forEach(s => { s.textContent = fmt(get(s.dataset.count), s.dataset.f) + (s.dataset.u || ""); io.observe(s); });
}
function countUp(s) {
  const v = get(s.dataset.count), x = Array.isArray(v) ? v[0] : v, f = s.dataset.f, u = s.dataset.u || "", t0 = performance.now(), dur = 900;
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); s.textContent = fmt(x * e, f) + u; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- 1. stripe of 62 nights ---------- */
function ramp(g) { const t = Math.max(0, Math.min(1, (g - 0.1) / 0.7)); const a = [253,232,214], b = [213,94,0], c = [110,40,0];
  const m = t < .6 ? a.map((v, i) => v + (b[i] - v) * t / .6) : b.map((v, i) => v + (c[i] - v) * (t - .6) / .4); return `rgb(${m.map(Math.round)})`; }
let selNight = null;
function renderStripe() {
  const svg = $("#stripe"); clear(svg); const n = D.nights.length, w = 1000 / n;
  D.nights.forEach((d, i) => { const r = el("rect", {x: i * w, y: 4, width: w - 1, height: 84, fill: ramp(d.g), rx: 1.5}, svg);
    if (selNight === i) r.classList.add("sel");
    r.addEventListener("click", () => { selNight = i; renderStripe(); showNight(i); }); });
  const ls = Math.max(13, Math.min(30, 13 * 700 / (svg.clientWidth || 700)));
  txt(svg, 0, 116, L("1 July", "7월 1일"), {fill: "#4F5E63", "font-size": ls});
  txt(svg, 31 * w, 116, L("1 August", "8월 1일"), {fill: "#4F5E63", "font-size": ls});
  txt(svg, 1000, 116, L("31 August", "8월 31일"), {fill: "#4F5E63", "font-size": ls, "text-anchor": "end"});
  const fs = Math.max(22, Math.min(46, 22 * 700 / (svg.clientWidth || 700)));
  txt(svg, 500, 46 + fs / 3, L("S4 warmer than S1 on 62 of 62 nights", "62일 밤 중 62일, S4가 S1보다 따뜻"), {"text-anchor": "middle", fill: "#fff", "font-size": fs, "font-weight": 900, "pointer-events": "none"});
  if (selNight !== null) showNight(selNight);
}
function showNight(i) {
  const d = D.nights[i], dt = new Date(d.d + "T00:00:00");
  const ds = LANG === "ko" ? `${dt.getMonth() + 1}월 ${dt.getDate()}일 밤` : `Night of ${dt.toLocaleDateString("en-GB", {day: "numeric", month: "long"})}`;
  $("#nightinfo").innerHTML = `<b>${ds}</b>: ${L("S4 streets", "S4 거리가")} <b>${sgn(d.g, 2)} °C</b> ${L("warmer than S1, all else equal", "S1보다 따뜻 (다른 조건이 같을 때)")} · 95% ${L("CI", "신뢰구간")} [${num(d.lo, 2)}, ${num(d.hi, 2)}]`;
}

/* ---------- 3. two streets ---------- */
let tMode = "pair", tIdx = 14, playing = null;
function series() {
  const T = D.two;
  if (tMode === "pair") return {s1: T.s1.t, s4: T.s4.t, med: T.med, n: 72, start: 12};
  const rot = a => [...a.slice(12), ...a.slice(0, 12)];
  return {s1: rot(T.avg.S1), s4: rot(T.avg.S4), med: null, n: 24, start: 12};
}
function hourOf(i, S) { return (S.start + i) % 24; }
function drawStreet(g, x0, type, hour, gapT) {
  const V = D.values, H = V[`${type}.height_100m`], cov = V[`${type}.coverage_100m`], ndvi = V[`${type}.ndvi_30m`], bvf = V[`${type}.bvf`];
  const W = 440, gy = 250, sc = 4.2;                      // px per metre
  const night = hour < 6 || hour >= 20, dusk = hour >= 18 && hour < 20 || hour >= 6 && hour < 8;
  const sky = night ? "#14243B" : dusk ? "#F3D9B8" : "#DCEBF7";
  el("rect", {x: x0, y: 20, width: W, height: gy - 20, fill: sky, rx: 10}, g);
  // sun / moon
  if (!night) { const f = (hour - 6) / 14, sx = x0 + 30 + f * (W - 60), sy = 210 - Math.sin(Math.PI * f) * 160; el("circle", {cx: sx, cy: sy, r: 13, fill: "#FFC94A"}, g); }
  else el("circle", {cx: x0 + W - 50, cy: 55, r: 10, fill: "#E8EDF5"}, g);
  // sky arc split by BVF (drawn as the open part)
  const cx = x0 + W / 2, R = 120, open = 1 - bvf, a0 = Math.PI * (1 - open) / 2;
  el("path", {d: `M ${cx - R} ${gy} A ${R} ${R} 0 0 1 ${cx + R} ${gy}`, fill: "none", stroke: "#C9553A", "stroke-width": 5, opacity: .85}, g);
  el("path", {d: `M ${cx + R * Math.cos(Math.PI - a0)} ${gy - R * Math.sin(Math.PI - a0)} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(a0)} ${gy - R * Math.sin(a0)}`, fill: "none", stroke: "#6EB4F7", "stroke-width": 7}, g);
  // buildings: street width shrinks as coverage grows
  const street = 200 - 300 * (cov - 0.13), bh = H * sc, bw = (W - street) / 2 - 10;
  const bcol = night ? "#2E3A4C" : "#C9C3B6";
  for (const side of [0, 1]) {
    const bx = side ? cx + street / 2 : x0 + 10;
    if (type === "S1") { el("rect", {x: bx + (side ? 30 : 0), y: gy - bh, width: bw - 30, height: bh, fill: bcol}, g); }
    else { el("rect", {x: bx, y: gy - bh, width: bw, height: bh, fill: bcol}, g);
           for (let k = 0; k < 3; k++) el("rect", {x: bx + 8 + k * (bw - 20) / 3, y: gy - bh + 8, width: 10, height: 10, fill: night ? "#F2D27A" : "#9FB3C8", opacity: night ? .8 : .6}, g); }
  }
  // trees in proportion to NDVI
  const nt = Math.round(ndvi * 9);
  for (let k = 0; k < nt; k++) { const tx = cx - street / 2 + 18 + k * (street - 36) / Math.max(1, nt - 1), tr = 16 + 6 * (k % 2);
    el("rect", {x: tx - 2, y: gy - 30, width: 4, height: 30, fill: "#6B4E2E"}, g); el("circle", {cx: tx, cy: gy - 34 - tr / 2, r: tr, fill: "#2E9A42", opacity: .9}, g); }
  el("rect", {x: x0, y: gy, width: W, height: 8, fill: "#6F767A"}, g);
  // heat arrows at night
  if (night || dusk) {
    for (let k = -1; k <= 1; k++) { const ax = cx + k * street / 4;
      if (type === "S1") el("path", {d: `M ${ax} ${gy - 6} L ${ax} 60`, stroke: "#FF8A3D", "stroke-width": 3, fill: "none", "marker-end": "url(#arr)", opacity: .9}, g);
      else el("path", {d: `M ${ax} ${gy - 6} L ${ax + 26 * (k || 1)} ${gy - bh * .45} L ${ax - 18 * (k || 1)} ${gy - bh * .85} L ${ax} ${gy - bh - 20}`, stroke: "#FF8A3D", "stroke-width": 3, fill: "none", "marker-end": "url(#arr)", opacity: .9}, g); }
  }
  txt(g, x0 + 14, 44, type, {"font-size": 22, "font-weight": 900, fill: night ? "#fff" : TCT[type]});
  txt(g, x0 + 52, 44, NAME[LANG][type], {"font-size": 13, fill: night ? "#E8EDF5" : "#4F5E63"});
  if (gapT !== null) txt(g, x0 + W - 14, 44, gapT.toFixed(1) + " °C", {"font-size": 24, "font-weight": 900, "text-anchor": "end", fill: night ? "#fff" : "#1C2629"});
}
function renderTwo() {
  const S = series(), svg = $("#streets"); clear(svg);
  const defs = el("defs", {}, svg), m = el("marker", {id: "arr", viewBox: "0 0 10 10", refX: 5, refY: 5, markerWidth: 4, markerHeight: 4, orient: "auto-start-reverse"}, defs);
  el("path", {d: "M0 0 L10 5 L0 10 z", fill: "#FF8A3D"}, m);
  const i = Math.min(tIdx, S.n - 1), h = hourOf(i, S), narrow = svg.clientWidth && svg.clientWidth < 600;
  svg.setAttribute("viewBox", narrow ? "0 0 480 540" : "0 0 1000 300");
  drawStreet(el("g", {}, svg), 20, "S1", h, S.s1[i]); drawStreet(el("g", narrow ? {transform: "translate(-520,265)"} : {}, svg), 540, "S4", h, S.s4[i]);
  // chart
  const c = $("#tchart"); clear(c);
  const all = [...S.s1, ...S.s4, ...(S.med || [])], lo = Math.floor(Math.min(...all)), hi = Math.ceil(Math.max(...all));
  const X = k => 50 + 930 * k / (S.n - 1), Y = v => 200 - 180 * (v - lo) / (hi - lo);
  for (let k = 0; k < S.n; k++) { const hh = hourOf(k, S); if (hh >= 0 && hh <= 5) el("rect", {x: X(k) - 930 / (S.n - 1) / 2, y: 20, width: 930 / (S.n - 1), height: 180, fill: "#ECE8E0"}, c); }
  for (let v = lo; v <= hi; v++) { if ((v - lo) % (hi - lo > 8 ? 2 : 1)) continue; el("line", {x1: 50, x2: 980, y1: Y(v), y2: Y(v), stroke: "#E2DED6"}, c); txt(c, 44, Y(v) + 4, v + (v === hi ? " °C" : ""), {"text-anchor": "end", fill: "#8A979B", "font-size": 12}); }
  const line = (a, col, w, dash) => { const p = a.slice(0, i + 1).map((v, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(""); el("path", {d: p, stroke: col, "stroke-width": w, fill: "none", "stroke-dasharray": dash || "", "stroke-linejoin": "round"}, c);
    el("path", {d: a.map((v, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(""), stroke: col, "stroke-width": w, fill: "none", opacity: .15}, c); };
  if (S.med) line(S.med, "#4F5E63", 1.5, "5 4"); line(S.s1, TC.S1, 3); line(S.s4, TC.S4, 3);
  el("line", {x1: X(i), x2: X(i), y1: 20, y2: 200, stroke: "#1C2629", "stroke-width": 1.2}, c);
  for (let k = 0; k < S.n; k++) { const hh = hourOf(k, S); if (hh === 0) { txt(c, X(k), 218, tMode === "pair" ? L(["23 Aug", "24 Aug", "25 Aug"][Math.floor(k / 24)] + " 00h", ["8월 23일", "8월 24일", "8월 25일"][Math.floor(k / 24)] + " 0시") : L("midnight", "자정"), {"text-anchor": "middle", fill: "#8A979B", "font-size": 12}); } }
  const gap = S.s4[i] - S.s1[i], hs = String(h).padStart(2, "0") + ":00";
  $("#tread").innerHTML = `<span>${tMode === "pair" ? (L("Day ", "") + (Math.floor((i + 12) / 24) + 1) + L("", "일째")) + " · " : ""}<b>${hs}</b></span><span class="tt1">S1 ${S.s1[i].toFixed(1)} °C</span><span class="tt4">S4 ${S.s4[i].toFixed(1)} °C</span><span>${L("gap", "차이")} <b>${sgn(gap, 1)} °C</b></span>`;
  const T = D.two;
  $("#tcap").innerHTML = tMode === "pair"
    ? L(`Raw air temperature from two sensors of the same device model, noon 22 Aug to noon 25 Aug 2025, every hour present: S1 in ${T.s1.gu}, S4 in ${T.s4.gu}. Each sits near its type's average summer night gap from the city median (S4 ${sgn(T.s4.gap, 2)} vs ${sgn(T.type_mean.S4, 2)} °C; S1 ${sgn(T.s1.gap, 2)} vs ${sgn(T.type_mean.S1, 2)} °C). Dashed: median of all Seoul sensors. Shaded: 00–05 h. Raw, not adjusted for location.`,
        `같은 기종 센서 두 개의 실제 기온, 2025년 8월 22일 정오–25일 정오, 결측 없음: S1은 ${T.s1.gu}, S4는 ${T.s4.gu}. 각 센서의 여름밤 도시 중앙값 대비 차이는 자기 유형 평균에 가깝습니다(S4 ${sgn(T.s4.gap, 2)} 대 ${sgn(T.type_mean.S4, 2)} °C, S1 ${sgn(T.s1.gap, 2)} 대 ${sgn(T.type_mean.S1, 2)} °C). 점선: 서울 전체 센서 중앙값. 음영: 00–05시. 위치 보정 전 원자료.`)
    : L(`Average raw air temperature by hour, all S1 sensors (n = ${D.values["S1.n"]}) and all S4 sensors (n = ${D.values["S4.n"]}), July–August 2025, drawn from noon to noon. Raw, not adjusted for location.`,
        `시간대별 평균 기온, S1 센서 전체(${D.values["S1.n"]}개)와 S4 센서 전체(${D.values["S4.n"]}개), 2025년 7–8월, 정오부터 다음 날 정오까지. 위치 보정 전 원자료.`);
  const sl = $("#tslider"); sl.max = S.n - 1; sl.value = i;
}
function initTwo() {
  $("#tslider").addEventListener("input", e => { tIdx = +e.target.value; renderTwo(); });
  $$("[data-mode]").forEach(b => b.addEventListener("click", () => { tMode = b.dataset.mode; $$("[data-mode]").forEach(x => x.classList.toggle("on", x === b)); tIdx = tMode === "pair" ? 14 : 14; renderTwo(); }));
  $("#play").addEventListener("click", () => {
    if (playing) { clearInterval(playing); playing = null; return; }
    const n = series().n; if (tIdx >= n - 1) tIdx = 0;
    playing = setInterval(() => { tIdx++; if (tIdx >= n - 1) { clearInterval(playing); playing = null; } renderTwo(); }, tMode === "pair" ? 140 : 300);
  });
  renders.push(renderTwo); renderTwo();
}

/* ---------- canyon (teaching model) ---------- */
let cH = 15, cW = 20;
function renderCanyon() {
  const svg = $("#canyon"); clear(svg); const gy = 270, sc = Math.min(4, 230 / Math.max(cH, 10), 380 / cW);
  const sw = cW * sc, bh = cH * sc, cx = 350;
  el("rect", {x: 0, y: 0, width: 700, height: gy, fill: "#DCEBF7", rx: 8}, svg);
  const beta = Math.atan(2 * cH / cW), svf = Math.cos(beta);
  // sky wedge visible from street centre
  const R = 250, a = Math.PI / 2 - beta;
  el("path", {d: `M ${cx} ${gy} L ${cx - R * Math.sin(a)} ${gy - R * Math.cos(a)} A ${R} ${R} 0 0 1 ${cx + R * Math.sin(a)} ${gy - R * Math.cos(a)} Z`, fill: "#6EB4F7", opacity: .35}, svg);
  el("line", {x1: cx, y1: gy, x2: cx - sw / 2, y2: gy - bh, stroke: "#4F5E63", "stroke-dasharray": "4 4"}, svg);
  el("line", {x1: cx, y1: gy, x2: cx + sw / 2, y2: gy - bh, stroke: "#4F5E63", "stroke-dasharray": "4 4"}, svg);
  el("rect", {x: 0, y: gy - bh, width: cx - sw / 2, height: bh, fill: "#C9C3B6"}, svg);
  el("rect", {x: cx + sw / 2, y: gy - bh, width: 700 - cx - sw / 2, height: bh, fill: "#C9C3B6"}, svg);
  el("rect", {x: 0, y: gy, width: 700, height: 30, fill: "#6F767A"}, svg);
  el("circle", {cx, cy: gy - 4, r: 5, fill: "#1C2629"}, svg);
  txt(svg, 20, 34, L("Open sky seen from the street centre", "거리 중앙에서 보이는 하늘"), {"font-size": 15, fill: "#1E3557"});
  txt(svg, 20, 70, Math.round(svf * 100) + "%", {"font-size": 38, "font-weight": 900, fill: "#1E3557"});
  txt(svg, 680, 34, "H/W = " + (cH / cW).toFixed(2), {"font-size": 15, "text-anchor": "end", fill: "#1E3557"});
  $("#hv").textContent = cH; $("#wv").textContent = cW; $("#hsl").value = cH; $("#wsl").value = cW;
}
function initCanyon() {
  $("#hsl").addEventListener("input", e => { cH = +e.target.value; renderCanyon(); });
  $("#wsl").addEventListener("input", e => { cW = +e.target.value; renderCanyon(); });
  const match = t => { const bvf = D.values[`${t}.bvf`], ratio = Math.tan(Math.acos(1 - bvf)) / 2; cW = 20; cH = Math.max(3, Math.round(ratio * cW)); renderCanyon(); };
  $("#setS1").addEventListener("click", () => match("S1")); $("#setS4").addEventListener("click", () => match("S4"));
  renders.push(renderCanyon); renderCanyon();
}

/* ---------- AI steps ---------- */
const STEPS = [
  {ic: "pano", en: ["Collect", "For every sensor, Google Street View panoramas within 100 m were gathered: 5,461 in total."], ko: ["모으기", "센서마다 100 m 안의 구글 스트리트뷰 파노라마를 모았습니다. 모두 5,461장입니다."]},
  {ic: "fish", en: ["Look up", "Each panorama is turned into an upward fisheye: the view you would get lying on the road and looking at the sky."], ko: ["올려다보기", "파노라마를 위로 향한 어안 이미지로 바꿉니다. 도로에 누워 하늘을 올려다본 모습입니다."]},
  {ic: "lab", en: ["Label", "An AI image model, SegFormer-B4 (Xie et al., 2021), trained on the public ADE20K scene set (Zhou et al., 2017), marks every pixel as sky, building, tree or other."], ko: ["표시하기", "AI 이미지 모델 SegFormer-B4(Xie et al., 2021)가 모든 픽셀을 하늘, 건물, 나무, 기타로 구분합니다. 공개 장면 데이터 ADE20K(Zhou et al., 2017)로 학습된 모델입니다."]},
  {ic: "bvf", en: ["Measure", "BVF is the share of the sky dome hidden by buildings, weighted the way the sky exchanges heat with the ground (cosine-weighted). It is averaged over the panoramas around each sensor."], ko: ["재기", "BVF는 하늘 돔 가운데 건물이 가리는 비율입니다. 하늘과 지면이 열을 주고받는 방식에 맞게(코사인 가중) 계산하고, 센서 주변 파노라마의 값을 평균합니다."]},
  {ic: "sun", en: ["Follow the sun", "On the same fisheyes we trace the July–August sun path and count hours of direct sun, building shade and tree shade."], ko: ["해 따라가기", "같은 어안 이미지 위에 7–8월 태양 경로를 그리고, 직사광선, 건물 그늘, 나무 그늘 시간을 셉니다."]}];
let stepSel = 0;
function icon(kind) {
  const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 80 80");
  const c = (a) => el("circle", Object.assign({cx: 40, cy: 40, r: 34}, a), s);
  if (kind === "pano") { el("rect", {x: 4, y: 24, width: 72, height: 32, rx: 4, fill: "#DCEBF7"}, s); for (let k = 0; k < 5; k++) el("rect", {x: 6 + k * 14, y: 36 + (k % 2) * 6, width: 10, height: 20 - (k % 2) * 6, fill: "#C9C3B6"}, s); }
  else if (kind === "fish") { c({fill: "#DCEBF7"}); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; el("path", {d: `M ${40 + 34 * Math.cos(a)} ${40 + 34 * Math.sin(a)} L ${40 + 22 * Math.cos(a + .3)} ${40 + 22 * Math.sin(a + .3)} L ${40 + 22 * Math.cos(a + .7)} ${40 + 22 * Math.sin(a + .7)} L ${40 + 34 * Math.cos(a + .8)} ${40 + 34 * Math.sin(a + .8)} Z`, fill: "#B9B2A4"}, s); } }
  else if (kind === "lab") { c({fill: "#6EB4F7"}); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; el("path", {d: `M ${40 + 34 * Math.cos(a)} ${40 + 34 * Math.sin(a)} L ${40 + 22 * Math.cos(a + .3)} ${40 + 22 * Math.sin(a + .3)} L ${40 + 22 * Math.cos(a + .7)} ${40 + 22 * Math.sin(a + .7)} L ${40 + 34 * Math.cos(a + .8)} ${40 + 34 * Math.sin(a + .8)} Z`, fill: k % 3 ? "#C9553A" : "#2E9A42"}, s); } }
  else if (kind === "bvf") { c({fill: "#6EB4F7"}); el("path", {d: "M40 40 L74 40 A34 34 0 0 1 22 69 Z", fill: "#C9553A"}, s); const t = el("text", {x: 40, y: 45, "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: "#fff"}, s); t.textContent = "BVF"; }
  else { c({fill: "#DCEBF7"}); el("path", {d: "M10 52 Q40 6 70 52", stroke: "#E69F00", "stroke-width": 3, fill: "none", "stroke-dasharray": "3 3"}, s); el("circle", {cx: 40, cy: 29, r: 7, fill: "#FFC94A"}, s); }
  return s;
}
function renderSteps() {
  const box = $("#steps"); box.innerHTML = "";
  STEPS.forEach((st, i) => { const d = document.createElement("div"); d.className = "step" + (i === stepSel ? " on" : ""); d.appendChild(icon(st.ic));
    const t = document.createElement("div"); t.innerHTML = `<b>${i + 1}</b> ${st[LANG][0]}`; d.appendChild(t); d.addEventListener("click", () => { stepSel = i; renderSteps(); }); box.appendChild(d); });
  const st = STEPS[stepSel]; $("#stepbody").innerHTML = `<b>${stepSel + 1}. ${st[LANG][0]}</b><p>${st[LANG][1]}</p>` + (stepSel === 3 ? codeHTML(0) : "");
}

/* ---------- types scatter + versions ---------- */
let dotSel = null;
function renderScatter() {
  const svg = $("#scatter"); clear(svg);
  const X = b => 50 + 530 * b / 0.7, Y = n => 380 - 350 * n / 0.8;
  for (let v = 0; v <= 0.7001; v += 0.1) { el("line", {x1: X(v), x2: X(v), y1: 30, y2: 380, stroke: "#E2DED6"}, svg); txt(svg, X(v), 398, v.toFixed(1), {"text-anchor": "middle", fill: "#8A979B", "font-size": 12}); }
  for (let v = 0; v <= 0.8001; v += 0.2) { el("line", {x1: 50, x2: 580, y1: Y(v), y2: Y(v), stroke: "#E2DED6"}, svg); txt(svg, 44, Y(v) + 4, v.toFixed(1), {"text-anchor": "end", fill: "#8A979B", "font-size": 12}); }
  txt(svg, 580, 416, L("BVF: sky blocked by buildings →", "BVF: 건물이 가리는 하늘 →"), {"text-anchor": "end", fill: "#4F5E63", "font-size": 13});
  txt(svg, 50, 20, L("↑ greenery within 30 m (NDVI)", "↑ 30 m 안의 녹지 (NDVI)"), {fill: "#4F5E63", "font-size": 13});
  D.sensors.forEach((s, i) => { const c = el("circle", {cx: X(s[0]), cy: Y(s[1]), r: dotSel === i ? 7 : 3.6, fill: TC[s[2]], opacity: dotSel === null || dotSel === i ? .85 : .35, stroke: dotSel === i ? "#1C2629" : "none", "stroke-width": 2, style: "cursor:pointer"}, svg);
    c.addEventListener("click", () => { dotSel = i; renderScatter(); }); });
  const cen = D.versions.cen; T4.forEach(t => { el("circle", {cx: X(cen[t].bvf), cy: Y(cen[t].ndvi_30m), r: 9, fill: "#fff", stroke: "#1C2629", "stroke-width": 2}, svg); txt(svg, X(cen[t].bvf) + 12, Y(cen[t].ndvi_30m) - 8, t, {"font-weight": 900, fill: TCT[t], "font-size": 16}); });
  $("#typelist").innerHTML = T4.map(t => `<div style="margin:4px 0"><span class="tchip c${t[1]}">${t}</span> <b>${NAME[LANG][t]}</b> <span class="small">· ${D.values[t + ".n"]} ${L("sensors", "개 센서")}</span></div>`).join("");
  if (dotSel !== null) { const s = D.sensors[dotSel];
    $("#dotinfo").innerHTML = `<span class="tchip c${s[2][1]}">${s[2]}</span> ${L("One sensor", "센서 하나")} · BVF ${s[0].toFixed(2)} · NDVI ${s[1].toFixed(2)}<br>${L("Night (00–05 h)", "밤 (00–05시)")}: <b>${sgn(s[3], 2)} °C</b> · ${L("Afternoon (14–16 h)", "오후 (14–16시)")}: <b>${sgn(s[4], 2)} °C</b> <span class="small">${L("vs city median, raw summer mean", "도시 중앙값 대비, 여름 평균 원자료")}</span>`; }
  else $("#dotinfo").innerHTML = `<span class="small">${L("White circles: the centre of each type. Tap a dot to see one sensor.", "흰 원: 각 유형의 중심. 점을 눌러 센서 하나를 보세요.")}</span>`;
}
function renderVersions() {
  const svg = $("#versions"); clear(svg); const V = D.versions.ver;
  const X = a => 60 + 600 * (a - 0.4) / 0.6, ys = V.map(v => v[3]), ymax = Math.max(...ys) * 1.1, Y = g => 260 - 230 * g / ymax;
  for (let a = 0.4; a <= 1.0001; a += 0.1) { el("line", {x1: X(a), x2: X(a), y1: 30, y2: 260, stroke: "#E2DED6"}, svg); txt(svg, X(a), 278, a.toFixed(1), {"text-anchor": "middle", fill: "#8A979B", "font-size": 12}); }
  txt(svg, 660, 296, L("stability (median ARI) →", "안정성 (ARI 중앙값) →"), {"text-anchor": "end", fill: "#4F5E63", "font-size": 12});
  txt(svg, 60, 20, L("↑ added prediction, night", "↑ 추가 예측력, 밤"), {fill: "#4F5E63", "font-size": 12});
  V.forEach(v => { const chosen = v[0] === "G" && v[1] === 4;
    el("circle", {cx: X(v[2]), cy: Y(v[3]), r: chosen ? 9 : 6, fill: v[5] ? "#1E3557" : "#fff", stroke: chosen ? "#D55E00" : "#1E3557", "stroke-width": chosen ? 3 : 1.4}, svg); });
}

/* ---------- 24-h profile ---------- */
let pYear = "p25", pHour = 21;
function renderProfile() {
  const svg = $("#profile"); clear(svg); const P = D.profile[pYear];
  const X = h => 70 + 900 * h / 23, Y = v => 190 - 150 * v / 0.8;
  el("rect", {x: X(0), y: 20, width: X(5) - X(0), height: 320, fill: "#ECE8E0"}, svg); el("rect", {x: X(14), y: 20, width: X(16) - X(14), height: 320, fill: "#FBE9DA"}, svg);
  txt(svg, X(0) + 4, 36, L("night 00–05 h", "밤 00–05시"), {fill: "#4F5E63", "font-size": 12}); txt(svg, X(14) + 4, 36, L("afternoon", "오후"), {fill: "#4F5E63", "font-size": 12});
  for (let v = -0.8; v <= 0.4001; v += 0.2) { el("line", {x1: 70, x2: 970, y1: Y(v), y2: Y(v), stroke: Math.abs(v) < 1e-6 ? "#1C2629" : "#E2DED6"}, svg); txt(svg, 64, Y(v) + 4, sgn(v, 1), {"text-anchor": "end", fill: "#8A979B", "font-size": 12}); }
  txt(svg, 74, Y(0) - 6, L("city median", "도시 중앙값"), {fill: "#4F5E63", "font-size": 12});
  for (let h = 0; h < 24; h += 3) txt(svg, X(h), 362, String(h).padStart(2, "0") + ":00", {"text-anchor": "middle", fill: "#8A979B", "font-size": 12});
  T4.forEach(t => { el("path", {d: P[t].map((v, h) => `${h ? "L" : "M"}${X(h)},${Y(v)}`).join(""), stroke: TC[t], "stroke-width": t === "S1" || t === "S4" ? 3.5 : 2, fill: "none", opacity: t === "S1" || t === "S4" ? 1 : .6}, svg);
    txt(svg, 976, Y(P[t][23]) + 4, t, {fill: TCT[t], "font-weight": 900, "font-size": 14}); });
  el("line", {x1: X(pHour), x2: X(pHour), y1: 20, y2: 340, stroke: "#1C2629"}, svg);
  T4.forEach(t => el("circle", {cx: X(pHour), cy: Y(P[t][pHour]), r: 5, fill: TC[t], stroke: "#fff", "stroke-width": 1.5}, svg));
  const g = P.S4[pHour] - P.S1[pHour];
  $("#hread").innerHTML = `<b>${String(pHour).padStart(2, "0")}:00</b>` + T4.map(t => `<span class="tt${t[1]}">${t} ${sgn(P[t][pHour], 2)}</span>`).join("") + `<span>S4 − S1 <b>${sgn(g, 2)} °C</b> <span class="small">${L("observed", "관측")}</span></span>`;
}
function initProfile() {
  $("#hslider").addEventListener("input", e => { pHour = +e.target.value; renderProfile(); });
  $$("[data-yr]").forEach(b => b.addEventListener("click", () => { pYear = b.dataset.yr; $$("[data-yr]").forEach(x => x.classList.toggle("on", x === b)); renderProfile(); }));
  renders.push(renderProfile); renderProfile();
}

/* ---------- ladder ---------- */
function ciPlot(svg, rows, opts) {
  clear(svg); const {x0, x1, lo, hi, y0, rh, labw} = opts, X = v => x0 + (x1 - x0) * (v - lo) / (hi - lo);
  for (let v = lo; v <= hi + 1e-9; v += opts.step) { el("line", {x1: X(v), x2: X(v), y1: y0 - 10, y2: y0 + rows.length * rh, stroke: Math.abs(v) < 1e-9 ? "#1C2629" : "#E2DED6"}, svg); txt(svg, X(v), y0 + rows.length * rh + 16, v.toFixed(1), {"text-anchor": "middle", fill: "#8A979B", "font-size": 12}); }
  rows.forEach((r, i) => { const y = y0 + i * rh + rh / 2, g = el("g", {class: "frow"}, svg);
    el("rect", {class: "bg", x: 0, y: y - rh / 2, width: x1 + 10, height: rh, fill: i === opts.sel ? "#fff" : "transparent"}, g);
    txt(g, 8, y + 4, r.label, {"font-size": 13, "font-weight": i === 0 ? 700 : 400});
    [["night", "#1E3557", -5], ["afternoon", "#E39A5B", 5]].forEach(([k, col, dy]) => { const v = r[k]; if (!v) return;
      el("line", {x1: X(v[1]), x2: X(v[2]), y1: y + dy, y2: y + dy, stroke: col, "stroke-width": 2.5}, g); el("circle", {cx: X(v[0]), cy: y + dy, r: 5, fill: col}, g); });
    if (opts.onClick) g.addEventListener("click", () => opts.onClick(i)); });
  const ly = y0 - 22; el("circle", {cx: x0, cy: ly, r: 5, fill: "#1E3557"}, svg); txt(svg, x0 + 9, ly + 4, L("night 00–05 h", "밤 00–05시"), {"font-size": 12});
  el("circle", {cx: x0 + 130, cy: ly, r: 5, fill: "#E39A5B"}, svg); txt(svg, x0 + 139, ly + 4, L("afternoon 14–16 h", "오후 14–16시"), {"font-size": 12});
}
function renderLadder() {
  const V = D.values, steps = [["T", L("Street type only", "거리 유형만")], ["T+L", L("+ location", "+ 위치")], ["T+L+B", L("+ buildings", "+ 건물")], ["T+L+B+D", L("+ sensor device", "+ 센서 기기")]];
  ciPlot($("#ladder"), steps.map(([k, l]) => ({label: l, night: V[`ladder.night.${k}`], afternoon: V[`ladder.afternoon.${k}`]})), {x0: 220, x1: 680, lo: 0, hi: 1.2, step: 0.2, y0: 40, rh: 44});
}
/* ---------- forest ---------- */
const FEX = {
  "Main model": ["S4 vs S1 with location, building and device controls; robust standard errors.", "위치, 건물, 기기를 통제한 S4 대 S1 비교, 강건 표준오차."],
  "One device type only (V02)": ["The network uses two sensor models that read about 0.5 °C apart. Here only one model is used.", "센서망은 약 0.5 °C 차이 나는 두 기종을 씁니다. 한 기종만 썼습니다."],
  "Strictest 284 sensors": ["Only sensors that pass every doubt at once: pole-mounted, known height, one device type, no redevelopment nearby, photos from 2017 or later.", "모든 의문을 한꺼번에 통과한 센서만: 기둥 설치, 높이 확인, 한 기종, 주변 재개발 없음, 2017년 이후 사진."],
  "Matched S1–S4 pairs": ["Each S1 site is paired with its most similar S4 site on the controls, and the remaining differences are corrected for.", "각 S1 지점을 통제 변수가 가장 비슷한 S4 지점과 짝지은 뒤, 남은 차이를 보정했습니다."],
  "Machine-learning controls": ["A flexible model absorbs the controls instead of a straight-line one (Chernozhukov et al., 2018).", "직선 모형 대신 유연한 모형이 통제 변수를 흡수합니다(Chernozhukov et al., 2018)."],
  "Other clustering (Gaussian mixture)": ["The types are rebuilt with a different method (Gaussian mixture).", "다른 방법(Gaussian mixture)으로 유형을 다시 만들었습니다."],
  "Map-coordinate surface added": ["A smooth surface over map coordinates removes any broad city-wide pattern.", "지도 좌표에 대한 완만한 면을 넣어 도시 전체의 넓은 패턴을 제거합니다."],
  "2026, same 455 sites": ["The next summer, at the same places.", "다음 여름, 같은 장소."],
  "2026, 180 new sites": ["The next summer, at places the types were never fitted on.", "다음 여름, 유형을 만들 때 쓰지 않은 장소."]};
const FKO = {"Main model": "기본 모형", "One device type only (V02)": "한 기종만 (V02)", "Strictest 284 sensors": "가장 엄격한 284개 센서", "Matched S1–S4 pairs": "S1–S4 짝 비교", "Machine-learning controls": "머신러닝 통제", "Other clustering (Gaussian mixture)": "다른 군집 방법", "Map-coordinate surface added": "좌표 기반 공간 패턴", "2026, same 455 sites": "2026년, 같은 455개 지점", "2026, 180 new sites": "2026년, 새 180개 지점"};
let fSel = 0;
function renderForest() {
  const F = D.values.forest;
  ciPlot($("#forest"), F.map(r => ({label: LANG === "ko" ? FKO[r.label] : r.label, night: r.night, afternoon: r.afternoon})), {x0: 330, x1: 980, lo: 0, hi: 1.2, step: 0.2, y0: 40, rh: 38, sel: fSel, onClick: i => { fSel = i; renderForest(); }});
  const r = F[fSel], ex = FEX[r.label];
  $("#fexplain").innerHTML = `<b>${LANG === "ko" ? FKO[r.label] : r.label}</b>: ${ex ? ex[LANG === "ko" ? 1 : 0] : ""}<br><span class="small">${L("Night", "밤")} ${sgn(r.night[0], 2)} [${num(r.night[1], 2)}, ${num(r.night[2], 2)}] · ${L("Afternoon", "오후")} ${sgn(r.afternoon[0], 2)} [${num(r.afternoon[1], 2)}, ${num(r.afternoon[2], 2)}] °C</span>`;
}
/* ---------- tropical nights bars ---------- */
function renderTrop() {
  const svg = $("#tropbars"); clear(svg); const tn = D.trop, X = v => 60 + 560 * v / 45;
  T4.forEach((t, i) => { const y = 20 + i * 48;
    txt(svg, 10, y + 18, t, {"font-weight": 900, fill: TCT[t], "font-size": 16});
    el("rect", {x: 60, y, width: X(tn[`2025.${t}`]) - 60, height: 22, fill: TC[t], rx: 3}, svg); txt(svg, X(tn[`2025.${t}`]) + 6, y + 17, tn[`2025.${t}`].toFixed(1), {"font-weight": 700, "font-size": 15});
    el("rect", {x: 60, y: y + 26, width: X(tn[`2026.${t}`]) - 60, height: 8, fill: TC[t], opacity: .5, rx: 2}, svg); txt(svg, X(tn[`2026.${t}`]) + 6, y + 34, tn[`2026.${t}`].toFixed(1), {"font-size": 12, fill: "#4F5E63"}); });
}
/* ---------- street map ---------- */
const SMON = {X: true, S1: true, S2: true, S3: true, S4: true}; let zs = {k: 1, x: 0, y: 0};
function initStreetMap() {
  const box = $("#streetmap"), inner = $("#smi"); const B = D.base;
  const base = document.createElementNS(NS, "svg"); base.setAttribute("viewBox", `0 0 ${B.w} ${B.h}`); base.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const pth = (arrs, a) => el("path", Object.assign({d: arrs.map(r => "M" + r.map(p => p.join(",")).join("L") + "Z").join("")}, a), base);
  pth(B.city, {fill: "#FFFFFF", stroke: "#4F5E63", "stroke-width": 40}); pth(B.forest, {fill: "#E4ECDD", "fill-rule": "evenodd"}); pth(B.water, {fill: "#CFE2EE", "fill-rule": "evenodd"});
  pth(B.gu, {fill: "none", stroke: "#D6D1C7", "stroke-width": 25});
  inner.appendChild(base);
  ["X", "S1", "S2", "S3", "S4"].forEach(k => { const im = document.createElement("img"); im.src = `img/streets_${k}.png`; im.alt = ""; im.id = "sm_" + k; im.loading = "lazy"; inner.appendChild(im); });
  const apply = () => { inner.style.transform = `translate(${zs.x}px,${zs.y}px) scale(${zs.k})`; };
  const zoomAt = (cx, cy, f) => { const nk = Math.max(1, Math.min(8, zs.k * f)); zs.x = cx - (cx - zs.x) * nk / zs.k; zs.y = cy - (cy - zs.y) * nk / zs.k; zs.k = nk; clamp(); apply(); };
  const clamp = () => { const w = box.clientWidth, h = box.clientHeight; zs.x = Math.min(0, Math.max(w - w * zs.k, zs.x)); zs.y = Math.min(0, Math.max(h - h * zs.k, zs.y)); };
  box.addEventListener("wheel", e => { e.preventDefault(); const r = box.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.2 : 1 / 1.2); }, {passive: false});
  const pts = new Map(); let last = null, lastD = null;
  box.addEventListener("pointerdown", e => { box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); });
  box.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { zs.x += e.clientX - prev[0]; zs.y += e.clientY - prev[1]; clamp(); apply(); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); const r = box.getBoundingClientRect();
      if (lastD) zoomAt((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, d / lastD); lastD = d; } });
  const up = e => { pts.delete(e.pointerId); lastD = null; }; box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
  box.addEventListener("dblclick", e => { const r = box.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, 2); });
  renders.push(renderStreetLegend); renderStreetLegend();
}
function renderStreetLegend() {
  const V = D.values, cols = {S4: "#D55E00", S3: "#E3B25A", S2: "#7FC0E8", S1: "#5DBB9D", X: "#CFCAC0"};
  $("#slegend").innerHTML = ["S4", "S3", "S2", "S1", "X"].map(k => `<button class="btn ${SMON[k] ? "on" : ""}" data-sm="${k}"><i style="background:${cols[k]}"></i>${k === "X" ? L("expressways", "고속도로") : `${k} ${(100 * V[k + ".share"]).toFixed(1)}%`}</button>`).join("") +
    `<button class="btn" id="smreset">${L("Reset zoom", "확대 초기화")}</button><span class="note" style="align-self:center">© OpenStreetMap contributors</span>`;
  $$("[data-sm]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.sm; SMON[k] = !SMON[k]; $("#sm_" + k).style.display = SMON[k] ? "" : "none"; renderStreetLegend(); }));
  $("#smreset").addEventListener("click", () => { zs = {k: 1, x: 0, y: 0}; $("#smi").style.transform = ""; });
}
/* ---------- residents bars ---------- */
function renderRes() {
  const V = D.values, svg = $("#resbars"); clear(svg); const X = v => 220 + 420 * v / 0.5;
  [[L("All residents", "전체 주민"), V["res.all"], "#B9B5AD"], [L("People aged 65+", "65세 이상"), V["res.old"], "#B9B5AD"], [L("수급자", "수급자"), V["res.rec"], "#D55E00"]].forEach(([l, v, c], i) => {
    const y = 14 + i * 42; txt(svg, 0, y + 17, l, {"font-size": 15, "font-weight": i === 2 ? 700 : 400}); el("rect", {x: 220, y, width: X(v) - 220, height: 24, fill: c, rx: 3}, svg);
    txt(svg, X(v) + 6, y + 18, (100 * v).toFixed(1) + "%", {"font-size": 15, "font-weight": i === 2 ? 700 : 400}); });
  txt(svg, 220, 146, L("Share of street length that is S4 in the 동 where each group lives", "각 집단이 사는 동에서 S4 거리가 차지하는 비율"), {"font-size": 12, fill: "#4F5E63"});
}
/* ---------- dong map + search ---------- */
let dMode = "cls", dSel = null;
const DC = {neither: "#ECE9E3", streets: "#F3BF95", people: "#B7C3D6", both: "#B3470A"};
function seqCol(t, a, b) { const A = a.match(/\w\w/g).map(h => parseInt(h, 16)), Bc = b.match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${A.map((v, i) => Math.round(v + (Bc[i] - v) * t))})`; }
function dongFill(f) {
  if (dMode === "cls") return DC[f.cls];
  if (dMode === "s4") return seqCol(Math.min(1, f.sh[3] / 0.9), "FDF0E6", "B3470A");
  return seqCol(Math.min(1, f.rate / 0.14), "EEF2F7", "1E3557");
}
function renderDong() {
  const G = D.dong, svg = $("#dongmap"); svg.setAttribute("viewBox", `0 0 ${G.w} ${G.h}`); clear(svg);
  G.f.forEach((f, i) => { const p = el("path", {d: f.g.map(r => "M" + r.map(q => q.join(",")).join("L") + "Z").join(""), fill: dongFill(f)}, svg);
    if (dSel === i) p.classList.add("sel"); p.addEventListener("click", () => selectDong(i)); const t = el("title", {}, p); t.textContent = `${f.gu} ${f.n}`; });
  el("path", {d: D.base.forest.map(r => "M" + r.map(p => p.join(",")).join("L") + "Z").join(""), fill: "#E4ECDD", opacity: .85, "fill-rule": "evenodd", "pointer-events": "none"}, svg);
  el("path", {d: D.base.water.map(r => "M" + r.map(p => p.join(",")).join("L") + "Z").join(""), fill: "#CFE2EE", "fill-rule": "evenodd", "pointer-events": "none"}, svg);
  el("path", {d: D.base.gu.map(r => "M" + r.map(p => p.join(",")).join("L") + "Z").join(""), fill: "none", stroke: "#8A979B", "stroke-width": 30, "pointer-events": "none"}, svg);
  if (dSel !== null) { const f = G.f[dSel]; el("path", {d: f.g.map(r => "M" + r.map(q => q.join(",")).join("L") + "Z").join(""), fill: "none", stroke: "#1C2629", "stroke-width": 90, "pointer-events": "none"}, svg); }
  const lg = $("#dlegend");
  if (dMode === "cls") lg.innerHTML = [["both", L(`Priority: top quarter on both (${D.values.prio_n})`, `우선 검토: 둘 다 상위 25% (${D.values.prio_n})`)], ["streets", L("Top quarter for S4 streets only", "S4 거리만 상위 25%")], ["people", L("Top quarter for 수급자 only", "수급자만 상위 25%")], ["neither", L("Neither", "해당 없음")], ["forest", L("Forest and mountain (drawn over the 동)", "숲과 산 (동 위에 표시)")]].map(([k, l]) => `<span><i style="background:${k === "forest" ? "#E4ECDD" : DC[k]};height:12px;width:14px"></i> ${l}</span>`).join("");
  else if (dMode === "s4") lg.innerHTML = `<span>${L("S4 share of street length", "S4 거리 비율")}: 0% <i style="width:90px;height:10px;background:linear-gradient(90deg,#FDF0E6,#B3470A)"></i> 90%</span>`;
  else lg.innerHTML = `<span>${L("수급자 per registered resident", "등록 인구 대비 수급자")}: 0% <i style="width:90px;height:10px;background:linear-gradient(90deg,#EEF2F7,#1E3557)"></i> 14%</span>`;
  renderCard();
}
function selectDong(i) { dSel = i; renderDong(); }
function renderCard() {
  const box = $("#dcard"); if (dSel === null) { box.innerHTML = `<div class="card"><span class="small">${L("Tap a 동 or search above. Try 수유3동.", "동을 누르거나 위에서 검색하세요. 예: 수유3동")}</span></div>`; return; }
  const f = D.dong.f[dSel], n = D.dong.f.length;
  const clsT = {neither: L("Neither", "해당 없음"), streets: L("Top quarter for S4 streets", "S4 거리 상위 25%"), people: L("Top quarter for 수급자", "수급자 상위 25%"), both: L("Priority 동: top quarter on both", "우선 검토 동: 둘 다 상위 25%")}[f.cls];
  const mix = T4.map((t, k) => `<i style="flex:${Math.max(0, f.sh[k] || 0)};background:${TC[t]}"></i>`).join("") + `<i style="flex:${Math.max(0, 1 - f.sh.reduce((a, b) => a + (b || 0), 0))};background:#CFCAC0"></i>`;
  box.innerHTML = `<div class="card" style="border-left-color:${DC[f.cls]}"><h4>${f.n} <span class="small">${f.gu}${f.en ? " · " + f.en : ""}</span></h4>
    <div class="mix">${mix}</div><div class="small">${T4.map((t, k) => `<span class="tt${t[1]}">${t}</span> ${Math.round(100 * (f.sh[k] || 0))}%`).join(" · ")} · ${L("expressways", "고속도로")} ${Math.round(100 * Math.max(0, 1 - f.sh.reduce((a, b) => a + (b || 0), 0)))}%</div>
    <p style="margin:.5em 0 .2em"><b>S4 ${Math.round(100 * f.sh[3])}%</b> ${L(`of street length · rank ${f.r1} of ${n}`, `· ${n}개 동 중 ${f.r1}위`)} · ${f.km} km</p>
    <p style="margin:.2em 0"><b>${L("수급자", "수급자")} ${(100 * f.rate).toFixed(1)}%</b> ${L(`of registered residents · rank ${f.r2} of ${n}`, `(등록 인구 대비) · ${f.r2}위`)}</p>
    <p style="margin:.2em 0"><b>${clsT}</b></p>
    <p class="note">${L("동 averages. A single street can be very different from its 동.", "동 평균값입니다. 같은 동 안에서도 거리마다 크게 다를 수 있습니다.")}</p></div>`;
}
function initDong() {
  $$("[data-dm]").forEach(b => b.addEventListener("click", () => { dMode = b.dataset.dm; $$("[data-dm]").forEach(x => x.classList.toggle("on", x === b)); renderDong(); }));
  const q = $("#dq"), sg = $("#dsugg");
  q.addEventListener("input", () => { const s = q.value.trim().toLowerCase(); if (!s) { sg.style.display = "none"; return; }
    const hits = D.dong.f.map((f, i) => [f, i]).filter(([f]) => f.n.includes(s) || (f.en || "").toLowerCase().includes(s) || f.gu.includes(s)).slice(0, 12);
    sg.innerHTML = hits.map(([f, i]) => `<div data-i="${i}">${f.n} <span class="small">${f.gu}${f.en ? " · " + f.en : ""}</span></div>`).join("") || `<div class="small">${L("No match", "결과 없음")}</div>`;
    sg.style.display = "block"; $$("#dsugg [data-i]").forEach(d => d.addEventListener("click", () => { selectDong(+d.dataset.i); sg.style.display = "none"; q.value = D.dong.f[+d.dataset.i].n; })); });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) sg.style.display = "none"; });
  renders.push(renderDong); renderDong();
}
/* ---------- inset ---------- */
function renderInset() {
  const I = D.inset, svg = $("#inset"); clear(svg); svg.setAttribute("viewBox", `0 0 ${I.w} ${I.h}`);
  const P = (a, close) => a.map(r => "M" + r.map(p => p.join(",")).join("L") + (close ? "Z" : "")).join("");
  el("rect", {x: 0, y: 0, width: I.w, height: I.h, fill: "#fff"}, svg);
  el("path", {d: P(I.ring, true), fill: "#FBEFE6"}, svg);
  const col = {X: "#D9D5CD", S1: "#93CDB9", S2: "#A6D0EC", S3: "#EBC98B", S4: "#D55E00"};
  ["X", "S1", "S2", "S3", "S4"].forEach(k => el("path", {d: P(I.segs[k] || [], false), stroke: col[k], "stroke-width": k === "S4" ? 9 : 7, fill: "none", "stroke-linecap": "round"}, svg));
  el("path", {d: P(I.ring, true), fill: "none", stroke: "#1E3557", "stroke-width": 10}, svg);
  el("rect", {x: I.w - 560, y: I.h - 70, width: 500, height: 14, fill: "#4F5E63"}, svg); txt(svg, I.w - 310, I.h - 85, "500 m", {"text-anchor": "middle", "font-size": 60, fill: "#4F5E63"});
}
/* ---------- code ---------- */
const CODE = [
  {t: ["1 · BVF from a labelled fisheye", "1 · 라벨이 붙은 어안 이미지에서 BVF 계산"], c: `<span class="cm"># label: 2-D array of classes on an upward fisheye (equidistant lens)
# r: distance of each pixel from the image centre, R: image radius</span>
theta = (r / R) * np.pi / 2                      <span class="cm"># zenith angle of each pixel</span>
w = np.cos(theta) * np.sin(theta) / theta        <span class="cm"># cosine-weighted solid angle per pixel</span>
bvf = (w * (label == BUILDING)).sum() / w.sum()  <span class="cm"># share of the sky dome hidden by buildings</span>`},
  {t: ["2 · The outcome: each hour, a sensor minus the city", "2 · 결과 변수: 매시간 센서 값 − 도시 값"], c: `hourly["dev"] = hourly["t"] - hourly.groupby("time")["t"].transform("median")
night = hourly[hourly.time.dt.hour.between(0, 5)].groupby("serial")["dev"].mean()
afternoon = hourly[hourly.time.dt.hour.between(14, 16)].groupby("serial")["dev"].mean()`},
  {t: ["3 · Four types from four measures", "3 · 네 지표로 만든 네 유형"], c: `X = StandardScaler().fit_transform(sites[["bvf", "ndvi_30m", "height_100m", "coverage_100m"]])
types = KMeans(n_clusters=4, n_init=50, random_state=0).fit_predict(X)
<span class="cm"># repeated for 10 measure sets x k = 3..8, each version scored on rules written down first</span>`},
  {t: ["4 · The main model", "4 · 기본 모형"], c: `smf.ols("dev_night ~ C(type, Treatment('S1'))"
        " + elev + water_1km + forest_1km + ndvi_500m + C(gu)"     <span class="cm"># location</span>
        " + height_500 + height_sd_500 + coverage_500 + far_500"   <span class="cm"># buildings</span>
        " + device",                                               <span class="cm"># sensor model</span>
        data=sites).fit(cov_type="HC1")`},
  {t: ["5 · Residents: resampling whole 구", "5 · 주민 분석: 구 단위 재표본"], c: `share = lambda d, w: (d.S4 * d[w]).sum() / d[w].sum()
gap = share(dong, "recipients") - share(dong, "night_pop")
boot = [ (lambda b: share(b, "recipients") - share(b, "night_pop"))(
           pd.concat([dong[dong.gu == g] for g in rng.choice(gus, len(gus))]))
         for _ in range(2000) ]
ci = np.percentile(boot, [2.5, 97.5])`}];
function codeHTML(i) { return `<pre><code>${CODE[i].c}</code></pre><p class="note">${L("Simplified excerpt for reading.", "읽기 쉽게 줄인 코드입니다.")}</p>`; }
function renderCode() { $("#codeblocks").innerHTML = CODE.map((c, i) => `<h3>${c.t[LANG === "ko" ? 1 : 0]}</h3>${codeHTML(i)}`).join(""); }
/* ---------- references ---------- */
const REFS = [
  ["Cameron, A. C., Gelbach, J. B., &amp; Miller, D. L. (2008). Bootstrap-based improvements for inference with clustered errors. <i>Review of Economics and Statistics</i>, 90(3), 414–427.", "10.1162/rest.90.3.414"],
  ["Chan, T.-C., Lee, P.-H., Lee, Y.-T., &amp; Tang, J.-H. (2024). Exploring the spatial association between the distribution of temperature and urban morphology with green view index. <i>PLOS ONE</i>, 19(5), e0301921.", "10.1371/journal.pone.0301921"],
  ["Chernozhukov, V., Chetverikov, D., Demirer, M., Duflo, E., Hansen, C., Newey, W., & Robins, J. (2018). Double/debiased machine learning for treatment and structural parameters. <i>The Econometrics Journal</i>, 21(1), C1–C68.", "10.1111/ectj.12097"],
  ["Cinelli, C., & Hazlett, C. (2020). Making sense of sensitivity: Extending omitted variable bias. <i>Journal of the Royal Statistical Society: Series B</i>, 82(1), 39–67.", "10.1111/rssb.12348"],
  ["Gong, F.-Y., Zeng, Z.-C., Zhang, F., Li, X., Ng, E., &amp; Norford, L. K. (2018). Mapping sky, tree, and building view factors of street canyons in a high-density urban environment. <i>Building and Environment</i>, 134, 155–167.", "10.1016/j.buildenv.2018.02.042"],
  ["Hawker, L., Uhe, P., Paulo, L., Sosa, J., Savage, J., Sampson, C., & Neal, J. (2022). A 30 m global map of elevation with forests and buildings removed. <i>Environmental Research Letters</i>, 17(2), 024016.", "10.1088/1748-9326/ac4d4f"],
  ["Hoffman, J. S., Shandas, V., &amp; Pendleton, N. (2020). The effects of historical housing policies on resident exposure to intra-urban heat: A study of 108 US urban areas. <i>Climate</i>, 8(1), 12.", "10.3390/cli8010012"],
  ["Holm, S. (1979). A simple sequentially rejective multiple test procedure. <i>Scandinavian Journal of Statistics</i>, 6(2), 65–70. https://www.jstor.org/stable/4615733", null],
  ["Korea Meteorological Administration. 열대야일수 (tropical nights). 기상자료개방포털. https://data.kma.go.kr/climate/tropicalNight/selectTropicalNightChart.do", null],
  ["Li, X., Ratti, C., &amp; Seiferling, I. (2018). Quantifying the shade provision of street trees in urban landscape: A case study in Boston, USA, using Google Street View. <i>Landscape and Urban Planning</i>, 169, 81–91.", "10.1016/j.landurbplan.2017.08.011"],
  ["Lin, B.-S., Chang, H.-C., Chen, C.-W., Huang, I.-H., Pardthaisong, L., &amp; Hsieh, C.-I. (2024). Effects of street spatial structure on micrometeorological condition and air quality—A case study of Taipei City. <i>Forests</i>, 15(12), 2221.", "10.3390/f15122221"],
  ["Middel, A., Lukasczyk, J., &amp; Maciejewski, R. (2017). Sky view factors from synthetic fisheye photos for thermal comfort routing—A case study in Phoenix, Arizona. <i>Urban Planning</i>, 2(1), 19–30.", "10.17645/up.v2i1.855"],
  ["Oh, J., Kang, S., Lee, H., & Kim, H. (2022). 한국 수도권 지역 열대야 현상의 온도 기준과 사망 위험 [Cut-off point temperature of hot night and heat-related mortality risk in the capital area of South Korea]. <i>Journal of Climate Change Research</i>, 13(6), 781–791.", "10.15531/KSCCR.2022.13.6.781"],
  ["Oke, T. R. (1981). Canyon geometry and the nocturnal urban heat island: Comparison of scale model and field observations. <i>Journal of Climatology</i>, 1(3), 237–254.", "10.1002/joc.3370010304"],
  ["Wong, N. H., &amp; Jusuf, S. K. (2010). Air temperature distribution and the influence of sky view factor in a green Singapore estate. <i>Journal of Urban Planning and Development</i>, 136(3), 261–272.", "10.1061/(ASCE)UP.1943-5444.0000014"],
  ["Xie, E., Wang, W., Yu, Z., Anandkumar, A., Alvarez, J. M., & Luo, P. (2021). SegFormer: Simple and efficient design for semantic segmentation with transformers. <i>Advances in Neural Information Processing Systems</i>, 34, 12077–12090.", null],
  ["Zhou, B., Zhao, H., Puig, X., Fidler, S., Barriuso, A., & Torralba, A. (2017). Scene parsing through ADE20K dataset. <i>CVPR 2017</i>, 633–641.", "10.1109/CVPR.2017.544"]];
function renderRefs() { $("#reflist").innerHTML = REFS.map(([t, d]) => `<li>${t}${d ? ` <a href="https://doi.org/${d}" target="_blank" rel="noopener">doi:${d}</a>` : ""}</li>`).join(""); }
/* ---------- glossary + tooltips ---------- */
const GL = {
  bvf: ["BVF (building view factor)", "The share of the sky dome hidden by buildings, seen from the street, cosine-weighted.", "거리에서 본 하늘 돔 가운데 건물이 가리는 비율(코사인 가중)."],
  ndvi: ["NDVI", "A satellite measure of green vegetation, from −1 to 1; higher is greener.", "위성으로 잰 식생 지수(−1~1). 높을수록 푸릅니다."],
  med: ["City median / 도시 중앙값", "The middle reading of all Seoul sensors at that hour.", "그 시간 서울 전체 센서 값의 가운데 값."],
  aee: ["All else equal / 다른 조건이 같을 때", "After accounting for location, buildings and sensor device.", "위치, 건물, 센서 기기를 보정한 뒤."],
  ci: ["95% CI / 95% 신뢰구간", "The range that would contain the true value in 95 of 100 repeated samples.", "표본을 거듭 뽑을 때 100번 중 95번 참값을 포함하는 범위."],
  trop: ["Tropical night / 열대야", "Night minimum (18:01–09:00) of 25 °C or above (KMA).", "밤 최저기온(18:01–09:00)이 25 °C 이상인 날 (기상청)."],
  sug: ["수급자", "Recipient of basic livelihood support (국민기초생활보장).", "국민기초생활보장 수급자."],
  dong: ["행정동", "Administrative neighbourhood; Seoul had 424 in the 2018 boundaries used here.", "행정동. 이 연구가 쓴 2018년 경계 기준 서울 424개."]};
function renderGloss() { $("#gloss").innerHTML = Object.values(GL).map(g => `<dt>${g[0]}</dt><dd>${LANG === "ko" ? g[2] : g[1]}</dd>`).join(""); }
function initTips() {
  const tip = $("#tip");
  document.addEventListener("click", e => { const t = e.target.closest(".term"); if (!t) { tip.style.display = "none"; return; }
    const g = GL[t.dataset.t]; tip.innerHTML = `<b>${g[0]}</b><br>${LANG === "ko" ? g[2] : g[1]}`; const r = t.getBoundingClientRect();
    tip.style.display = "block"; tip.style.left = Math.min(innerWidth - 300, Math.max(8, r.left)) + "px"; tip.style.top = (r.bottom + 6) + "px"; });
  addEventListener("scroll", () => tip.style.display = "none", {passive: true});
}
/* ---------- email (assembled in the browser) ---------- */
function initMail() { $$(".mail").forEach(s => { const a = document.createElement("a"), m = s.dataset.u + "@" + s.dataset.d; a.href = "mai" + "lto:" + m; a.textContent = m; s.appendChild(a); }); }

/* ---------- equations ---------- */
const v = (k, html) => `<span class="v" data-k="${k}" tabindex="0">${html}</span>`;
const EQ = [
 {t: ["1 · The outcome: each sensor against the city, each hour", "1 · 결과 변수: 매시간 도시 전체와 비교한 센서"], at: "#hours",
  f: () => `${v("dit", "Δ<sub>i,t</sub>")} = ${v("Tit", "T<sub>i,t</sub>")} − ${v("med", "median<sub>j</sub>")} ${v("Tjt", "T<sub>j,t</sub>")}<br>${v("Dn", "Δ̄<sub>i</sub><sup>night</sup>")} = mean ${v("tn", "<sub>t ∈ 00–05 h</sub>")} ${v("dit", "Δ<sub>i,t</sub>")}`,
  vars: {dit: ["the gap: how much warmer (+) or cooler (−) sensor i was than the city at hour t", "차이: 시각 t에 센서 i가 도시보다 얼마나 따뜻(+)하거나 시원(−)했는지"],
         Tit: ["air temperature at sensor i, hour t (°C)", "시각 t, 센서 i의 기온 (°C)"],
         med: ["the median over all Seoul sensors j at that same hour", "같은 시각 서울 전체 센서 j의 중앙값"],
         Tjt: ["air temperature at every other sensor j at the same hour", "같은 시각 다른 모든 센서 j의 기온"],
         Dn: ["sensor i's summer night value: the average gap over 00–05 h, July–August", "센서 i의 여름밤 값: 7–8월 00–05시 차이의 평균"],
         tn: ["the night window, 00:00 to 05:59; the afternoon window is 14–16 h", "밤 시간대 00:00–05:59. 오후 시간대는 14–16시"]},
  src: ["Our design. Comparing each sensor with the whole network at the same hour removes the weather all streets share, so a cloudy night or a heatwave doesn't swamp the street effect.", "우리의 설계입니다. 같은 시각 센서망 전체와 비교하면 모든 거리가 함께 겪는 날씨가 빠져, 흐린 밤이나 폭염이 거리 효과를 덮지 않습니다."],
  adapt: ["We use the median rather than the mean so a few faulty sensors can't pull the reference.", "평균 대신 중앙값을 써서, 고장 난 센서 몇 개가 기준을 끌어당기지 못하게 했습니다."]},
 {t: ["2 · BVF: how much sky the buildings hide", "2 · BVF: 건물이 가리는 하늘"], at: "#ai",
  f: () => `${v("bvf", "BVF")} = ${v("sum", "Σ<sub>p</sub>")} ${v("w", "w<sub>p</sub>")} · ${v("ind", "𝟙[label<sub>p</sub> = building]")} / ${v("sum", "Σ<sub>p</sub>")} ${v("w", "w<sub>p</sub>")}<br>${v("w", "w<sub>p</sub>")} = cos ${v("th", "θ<sub>p</sub>")} · sin ${v("th", "θ<sub>p</sub>")} / ${v("th", "θ<sub>p</sub>")}`,
  vars: {bvf: ["building view factor: share of the sky dome hidden by buildings, 0 to 1", "건물 조망 계수: 하늘 돔 가운데 건물이 가리는 비율, 0–1"],
         sum: ["sum over every pixel p of the upward fisheye image", "위로 향한 어안 이미지의 모든 픽셀 p에 대한 합"],
         w: ["pixel weight: how much that patch of sky exchanges heat with the ground", "픽셀 가중치: 그 하늘 조각이 지면과 열을 주고받는 정도"],
         ind: ["1 if the AI labelled the pixel as building, otherwise 0", "AI가 픽셀을 건물로 표시하면 1, 아니면 0"],
         th: ["zenith angle: 0° straight up, 90° at the horizon", "천정각: 바로 위는 0°, 지평선은 90°"]},
  src: ["Building on Gong et al. (2018), who mapped sky, tree and building view factors of Hong Kong's street canyons from Google Street View with deep learning, and on fisheye methods from Street View panoramas (Li, Ratti &amp; Seiferling, 2018; Middel et al., 2017). The cosine weighting follows the radiative definition of a view factor.", "Gong 외(2018)가 구글 스트리트뷰와 딥러닝으로 홍콩 가로 협곡의 하늘·나무·건물 조망 계수를 지도화한 연구와, 스트리트뷰 파노라마로 어안 이미지를 만드는 방법(Li, Ratti &amp; Seiferling, 2018; Middel 외, 2017)을 바탕으로 했습니다. 코사인 가중은 조망 계수의 복사 정의를 따릅니다."],
  adapt: ["We label pixels with SegFormer-B4 (Xie et al., 2021), average BVF over all panoramas within 100 m of each sensor, and keep building-blocked sky separate from tree-blocked sky.", "픽셀 라벨은 SegFormer-B4(Xie 외, 2021)로 붙이고, 센서마다 100 m 안 모든 파노라마의 BVF를 평균하며, 건물이 가린 하늘과 나무가 가린 하늘을 따로 셉니다."]},
 {t: ["3 · Hours of sun, building shade and tree shade", "3 · 직사광선, 건물 그늘, 나무 그늘 시간"], at: "#ai",
  f: () => `${v("hs", "H<sub>sun</sub>")} = ${v("sh", "Σ<sub>h</sub>")} ${v("ind2", "𝟙[label at (α<sub>h</sub>, ε<sub>h</sub>) = sky]")} · ${v("dh", "Δh")}`,
  vars: {hs: ["hours of direct sun per day at the street (similarly for building shade and tree shade)", "거리의 하루 직사광선 시간 (건물 그늘, 나무 그늘도 같은 방식)"],
         sh: ["sum over time steps h across the day, July–August sun path in Seoul", "하루 동안의 시간 단계 h에 대한 합, 서울 7–8월 태양 경로"],
         ind2: ["1 if the fisheye pixel where the sun sits (azimuth α, elevation ε) is sky", "태양이 있는 위치(방위각 α, 고도 ε)의 어안 픽셀이 하늘이면 1"],
         dh: ["length of each time step", "각 시간 단계의 길이"]},
  src: ["Adapted from Street View sun-path methods for street shade (Li, Ratti &amp; Seiferling, 2018, Boston).", "스트리트뷰로 거리 그늘을 구한 태양 경로 방법(Li, Ratti &amp; Seiferling, 2018, 보스턴)을 응용했습니다."],
  adapt: ["We trace Seoul's summer sun path and split the blocked hours into building shade and tree shade. Photos are mostly from spring 2018, so tree shade is under-counted.", "서울 여름 태양 경로를 그리고, 가려진 시간을 건물 그늘과 나무 그늘로 나눴습니다. 사진이 대부분 2018년 봄이라 나무 그늘은 적게 잡힙니다."]},
 {t: ["4 · Four types: k-means", "4 · 네 유형: k-means"], at: "#types",
  f: () => `min ${v("C", "C<sub>1..k</sub>")} ${v("sk", "Σ<sub>k</sub>")} ${v("si", "Σ<sub>i ∈ C<sub>k</sub></sub>")} ‖ ${v("z", "z<sub>i</sub>")} − ${v("mu", "μ<sub>k</sub>")} ‖²`,
  vars: {C: ["the groups (types) to find; k = 4 here", "찾으려는 그룹(유형). 여기서는 k = 4"],
         sk: ["sum over the groups", "그룹들에 대한 합"], si: ["sum over the sensor sites in group k", "그룹 k에 속한 센서 지점들에 대한 합"],
         z: ["site i's four measures, each standardised: BVF, greenery within 30 m (NDVI), building height and coverage within 100 m", "지점 i의 네 지표(표준화): BVF, 30 m 안 녹지(NDVI), 100 m 안 건물 높이와 건폐율"],
         mu: ["the centre of group k (the white circles on the scatter)", "그룹 k의 중심 (산점도의 흰 원)"]},
  src: ["Standard k-means clustering: put each site in the group whose centre is closest.", "표준 k-means 군집: 각 지점을 중심이 가장 가까운 그룹에 넣습니다."],
  adapt: ["Before running, we wrote down the rules a typology had to pass, then tested 60 versions (10 measure sets × 3–8 groups). The separation is weak (silhouette 0.29), so we rely on stability, prediction and replication.", "돌리기 전에 유형 분류가 통과해야 할 기준을 적어 두고, 60가지 버전(지표 조합 10개 × 3–8개 그룹)을 시험했습니다. 구분은 약한 편이라(실루엣 0.29) 안정성, 예측력, 재현성에 기댑니다."]},
 {t: ["5 · The main model", "5 · 기본 모형"], at: "#hold",
  f: () => `${v("Di", "Δ̄<sub>i</sub>")} = ${v("a", "α")} + ${v("b", "Σ<sub>k</sub> β<sub>k</sub>")} ${v("type", "𝟙[type<sub>i</sub> = k]")} + ${v("L", "γ′L<sub>i</sub>")} + ${v("B", "δ′B<sub>i</sub>")} + ${v("D", "θ D<sub>i</sub>")} + ${v("e", "ε<sub>i</sub>")}`,
  vars: {Di: ["sensor i's summer night (or afternoon) gap from the city", "센서 i의 여름밤(또는 오후) 도시 대비 차이"],
         a: ["the baseline: an S1 street", "기준값: S1 거리"],
         b: ["the type effects, each compared with S1; β for S4 is the headline +0.45 °C at night", "S1과 비교한 유형별 효과. S4의 β가 밤 +0.45 °C"],
         type: ["1 if sensor i is on a street of type k (S2, S3 or S4)", "센서 i가 유형 k(S2, S3, S4) 거리에 있으면 1"],
         L: ["location controls: elevation, water and forest nearby, wider greenery, 구", "위치 통제: 고도, 주변 수변과 숲, 넓은 범위 녹지, 구"],
         B: ["building controls within 500 m: mean height, height variation, coverage, floor area ratio", "500 m 안 건물 통제: 평균 높이, 높이 편차, 건폐율, 용적률"],
         D: ["sensor device family (V02 or OC3), which read about 0.5 °C apart", "센서 기종(V02 또는 OC3). 약 0.5 °C 차이"],
         e: ["everything else; standard errors are robust to unequal spread (HC1)", "그 밖의 모든 것. 표준오차는 이분산에 강건(HC1)"]},
  src: ["Ordinary least squares with heteroskedasticity-robust standard errors, a standard regression set-up.", "이분산에 강건한 표준오차를 쓴 최소제곱 회귀, 표준적인 회귀 설계입니다."],
  adapt: ["The device term was added after our audit found the two sensor families read differently and were unevenly spread over the types. It shrank the night gap from +0.50 to +0.45 °C.", "두 센서 기종의 측정값이 다르고 유형별로 고르게 퍼져 있지 않다는 점을 자체 점검에서 발견한 뒤 기기 항을 넣었습니다. 밤 차이가 +0.50에서 +0.45 °C로 줄었습니다."]},
 {t: ["6 · Tropical nights", "6 · 열대야"], at: "#tropical",
  f: () => `${v("TN", "TN<sub>i</sub>")} = ${v("sn", "Σ<sub>n</sub>")} ${v("ind3", "𝟙[ min<sub>t ∈ 18–08 h</sub> T<sub>i,t</sub> ≥ c ]")} ,&nbsp; ${v("c", "c = 25 °C + offset")}`,
  vars: {TN: ["number of tropical nights at sensor i over the 61 nights of July–August", "7–8월 61일 밤 동안 센서 i의 열대야 일수"],
         sn: ["sum over nights n", "밤 n에 대한 합"],
         ind3: ["1 if the night's lowest hourly temperature stayed at or above c", "그날 밤 가장 낮은 시간 기온이 c 이상이면 1"],
         c: ["the threshold: KMA's 25 °C plus an offset (+0.71 °C in 2025) so the network's median sensor counts the same nights as KMA's Seoul station", "기준: 기상청 25 °C에 보정값(2025년 +0.71 °C)을 더해, 센서망 중앙 센서가 기상청 서울 관측소와 같은 밤 수를 세도록 함"]},
  src: ["The Korea Meteorological Administration's definition: night minimum (18:01–09:00) of 25 °C or more.", "기상청 정의: 밤 최저기온(18:01–09:00) 25 °C 이상."],
  adapt: ["Street sensors read warmer at night than the official station, so a raw 25 °C would over-count. We calibrated one offset per summer and used sensors with at least 40 complete nights.", "거리 센서는 밤에 공식 관측소보다 따뜻하게 재므로, 25 °C를 그대로 쓰면 과대 집계됩니다. 여름마다 보정값 하나를 정하고, 온전한 밤이 40일 이상인 센서만 썼습니다."]},
 {t: ["7 · Who lives along S4 streets", "7 · S4 거리 곁에 사는 사람"], at: "#who",
  f: () => `${v("Sg", "S4<sub>g</sub>")} = ${v("sd", "Σ<sub>d</sub>")} ${v("sdd", "s<sub>d</sub>")} ${v("wg", "w<sub>g,d</sub>")} / ${v("sd", "Σ<sub>d</sub>")} ${v("wg", "w<sub>g,d</sub>")} ,&nbsp; ${v("gap", "gap = S4<sub>수급자</sub> − S4<sub>all</sub>")}`,
  vars: {Sg: ["the S4 share of street length in the 동 where group g lives, on average", "집단 g가 사는 동의 평균 S4 거리 비율"],
         sd: ["sum over Seoul's 424 행정동", "서울 424개 행정동에 대한 합"],
         sdd: ["the share of 동 d's street length that is S4", "동 d의 거리 길이 중 S4 비율"],
         wg: ["how many people of group g live in 동 d (수급자, people aged 65+, or everyone at night)", "동 d에 사는 집단 g의 인원 (수급자, 65세 이상, 또는 밤 인구 전체)"],
         gap: ["the difference in percentage points; its 95% interval comes from resampling whole 구 2,000 times", "%p 차이. 95% 구간은 구 전체를 2,000번 다시 뽑아 구함"]},
  src: ["A population-weighted exposure share, with a cluster bootstrap for the interval (resampling whole clusters; see Cameron, Gelbach &amp; Miller, 2008).", "인구 가중 노출 비율과, 신뢰구간을 위한 군집 부트스트랩(군집 전체를 재표본; Cameron, Gelbach &amp; Miller, 2008 참고)."],
  adapt: ["Resampling whole 구 rather than single 동 widens the interval, because neighbouring 동 are alike. We report the wider one.", "이웃한 동은 서로 비슷하므로, 동 하나씩이 아니라 구 전체를 다시 뽑으면 구간이 넓어집니다. 더 넓은 쪽을 보고합니다."]},
 {t: ["8 · How strong would a hidden cause have to be?", "8 · 숨은 원인은 얼마나 강해야 할까?"], at: "#hold",
  f: () => `${v("RV", "RV")} = ½ ( √( ${v("f", "f")}⁴ + 4${v("f", "f")}² ) − ${v("f", "f")}² ) ,&nbsp; ${v("f", "f")} = ${v("tt", "|t|")} / √${v("df", "df")}`,
  vars: {RV: ["robustness value: the share of leftover variation, in both street type and temperature, a hidden cause would need to explain to erase the gap. Ours: about 30%", "강건성 값: 차이를 없애려면 숨은 원인이 거리 유형과 기온 양쪽에서 설명해야 할 남은 변동의 비율. 우리 값: 약 30%"],
         f: ["partial Cohen's f of the S4 coefficient", "S4 계수의 부분 Cohen's f"],
         tt: ["the t-statistic of the S4 coefficient", "S4 계수의 t 통계량"],
         df: ["residual degrees of freedom", "잔차 자유도"]},
  src: ["Cinelli &amp; Hazlett (2020), Making sense of sensitivity.", "Cinelli &amp; Hazlett (2020), Making sense of sensitivity."],
  adapt: ["For scale: the measured control most tied to S4 membership, mean building height within 500 m, explains only about 6–7% of the leftover variation in type.", "비교하면, S4 소속과 가장 관련된 측정 통제 변수인 500 m 안 평균 건물 높이는 유형의 남은 변동 가운데 약 6–7%만 설명합니다."]},
 {t: ["9 · Many tests at once: Holm's correction", "9 · 여러 검정을 한꺼번에: Holm 보정"], at: "#hold",
  f: () => `${v("pk", "p<sub>(1)</sub> ≤ … ≤ p<sub>(m)</sub>")} ;&nbsp; reject ${v("Hk", "H<sub>(k)</sub>")} while ${v("pk", "p<sub>(k)</sub>")} ≤ ${v("al", "α")} / (${v("m", "m")} − k + 1)`,
  vars: {pk: ["the p-values of all tests, sorted from smallest to largest", "모든 검정의 p값을 작은 것부터 정렬"],
         Hk: ["the k-th hypothesis in that order", "그 순서의 k번째 가설"],
         al: ["the error rate allowed for the whole family of tests, 0.05", "검정 전체에 허용한 오류율, 0.05"],
         m: ["the number of tests: 85 here", "검정의 수: 여기서는 85"]},
  src: ["Holm (1979), a sequentially rejective procedure that controls the chance of any false alarm across all tests.", "Holm (1979): 모든 검정에서 한 번이라도 잘못 기각할 확률을 통제하는 순차 기각 방법."],
  adapt: ["Applied to every S4-versus-S1 test we ran (85). The largest adjusted p-value is 0.014.", "우리가 돌린 모든 S4 대 S1 검정(85개)에 적용했습니다. 가장 큰 보정 p값은 0.014입니다."]},
 {t: ["10 · Sky in an ideal street (teaching model)", "10 · 이상적인 거리의 하늘 (설명용 모형)"], at: "#two",
  f: () => `${v("svf", "SVF")} = cos ( arctan ( 2 ${v("H", "H")} / ${v("W", "W")} ) )`,
  vars: {svf: ["sky view factor at the centre of the street floor", "거리 바닥 중앙의 하늘 조망 계수"], H: ["wall height (m)", "벽 높이 (m)"], W: ["street width (m)", "거리 폭 (m)"]},
  src: ["Oke (1981): the textbook result for a long, symmetric street canyon.", "Oke (1981): 길고 대칭인 가로 협곡의 교과서적 결과."],
  adapt: ["Used only in the 'try it yourself' model. Real streets have gaps, trees and slopes, which is why we measured BVF from photos.", "'직접 해 보기' 모형에만 썼습니다. 실제 거리에는 틈, 나무, 경사가 있어 BVF는 사진으로 쟀습니다."]}];
function renderEq() {
  $("#eqcards").innerHTML = EQ.map((e, i) => `<div class="fig eq" id="eq${i + 1}">
    <h3 style="margin-top:0">${e.t[LANG === "ko" ? 1 : 0]}</h3>
    <div class="formula" data-i="${i}">${e.f()}</div>
    <div class="eqrow"><b>${L("Where it comes from", "출처")}</b><p>${e.src[LANG === "ko" ? 1 : 0]}</p></div>
    <div class="eqrow"><b>${L("How we adapted it", "우리가 바꾼 점")}</b><p>${e.adapt[LANG === "ko" ? 1 : 0]}${e.chk ? ` <span class="chk">check: ${e.chk}</span>` : ""}</p></div>
    <a class="small" href="${e.at}">${L("See it in use ↑", "쓰인 곳 보기 ↑")}</a></div>`).join("");
}
function eqTip(el) {
  const i = +el.closest(".formula").dataset.i, d = EQ[i].vars[el.dataset.k]; if (!d) return;
  const tip = $("#tip"); tip.innerHTML = `<b>${el.innerHTML}</b><br>${d[LANG === "ko" ? 1 : 0]}`;
  const r = el.getBoundingClientRect(); tip.style.display = "block"; tip.style.left = Math.min(innerWidth - 300, Math.max(8, r.left)) + "px"; tip.style.top = (r.bottom + 6) + "px";
  $$(".v.on").forEach(x => x.classList.remove("on")); $$(`.formula[data-i="${i}"] .v[data-k="${el.dataset.k}"]`).forEach(x => x.classList.add("on"));
}
document.addEventListener("click", e => { const t = e.target.closest(".v"); if (t) { e.stopPropagation(); eqTip(t); } else $$(".v.on").forEach(x => x.classList.remove("on")); }, true);
document.addEventListener("keydown", e => { if (e.key === "Enter" && document.activeElement.classList.contains("v")) eqTip(document.activeElement); });

/* ---------- Beyond Seoul ---------- */
const CITIES = [
 {id: "seoul", n: ["Seoul", "서울"], lat: 37.57, lon: 126.98, me: true,
  like: ["This study.", "이 연구."], did: ["723 street sensors, Street View BVF, satellite greenery; two summers.", "거리 센서 723개, 스트리트뷰 BVF, 위성 녹지, 두 여름."], found: ["S4 streets +0.45 °C at night, all else equal.", "S4 거리 밤 +0.45 °C (다른 조건이 같을 때)."], tr: ["", ""]},
 {id: "hk", n: ["Hong Kong", "홍콩"], lat: 22.32, lon: 114.17, ref: "Gong et al., 2018",
  like: ["Very dense, high-rise, steep hills: Seoul's closest match in form.", "매우 고밀, 고층, 가파른 산: 형태 면에서 서울과 가장 가까운 도시."],
  did: ["Mapped sky, tree and building view factors of street canyons from Google Street View with deep learning.", "구글 스트리트뷰와 딥러닝으로 가로 협곡의 하늘·나무·건물 조망 계수를 지도화."],
  found: ["Street View estimates agreed closely with field fisheye photos (R² above 0.95); a 3D-GIS model overestimated open sky by 0.11 on average, mostly because it leaves out street trees.", "스트리트뷰 추정치가 현장 어안 사진과 잘 맞았고(R² 0.95 이상), 3D-GIS 모형은 주로 가로수를 빼먹어 하늘을 평균 0.11 과대평가."],
  tr: ["Our BVF follows this approach, and their warning about trees is why we measured from photos rather than building models alone.", "우리 BVF는 이 방법을 따르며, 나무에 대한 이들의 지적이 건물 모형만이 아니라 사진으로 잰 이유입니다."]},
 {id: "tpe", n: ["Taipei", "타이베이"], lat: 25.03, lon: 121.56, ref: "Chan et al., 2024; Lin et al., 2024",
  like: ["A dense basin city ringed by mountains, like Seoul.", "서울처럼 산으로 둘러싸인 고밀 분지 도시."],
  did: ["Chan et al. extracted greenery, building and sky view factors from Street View with a neural network and related them to monthly temperature (2018–2021). Lin et al. measured six street canyons on hot and cool days.", "Chan 외는 신경망으로 스트리트뷰에서 녹시율, 건물·하늘 조망 계수를 뽑아 월별 기온(2018–2021)과 연결. Lin 외는 더운 날과 선선한 날 여섯 개 가로 협곡을 측정."],
  found: ["More street-level greenery went with lower temperatures; in the canyons, street-tree shade lowered air temperature by about 0.5 °C and mean radiant temperature by about 2 °C.", "거리 수준 녹지가 많을수록 기온이 낮았고, 가로수 그늘은 기온을 약 0.5 °C, 평균 복사 온도를 약 2 °C 낮췄음."],
  tr: ["Same direction as our afternoon greenery result; a similar city to test our street types in.", "우리 오후 녹지 결과와 같은 방향. 우리 거리 유형을 시험해 볼 만한 비슷한 도시."]},
 {id: "sg", n: ["Singapore", "싱가포르"], lat: 1.35, lon: 103.82, ref: "Wong & Jusuf, 2010",
  like: ["Dense and green but tropical and mostly flat: a useful contrast.", "고밀하고 푸르지만 열대이고 대체로 평탄함: 좋은 대조군."],
  did: ["Measured air temperature and sky view factor across the One-North estate, November 2007 to March 2008.", "2007년 11월–2008년 3월 One-North 지구에서 기온과 하늘 조망 계수를 측정."],
  found: ["Dense-greenery areas were 2.4 K cooler by day and 1.1 K at night than less-green areas; trees reduced open sky without making nights warmer.", "녹지가 많은 곳은 적은 곳보다 낮에 2.4 K, 밤에 1.1 K 시원했고, 나무는 하늘을 가리면서도 밤을 덥게 만들지 않았음."],
  tr: ["Supports separating building-blocked sky (BVF) from tree-blocked sky, as we did.", "우리처럼 건물이 가린 하늘(BVF)과 나무가 가린 하늘을 나누는 것을 뒷받침."]},
 {id: "bos", n: ["Boston", "보스턴"], lat: 42.36, lon: -71.06, ref: "Li, Ratti & Seiferling, 2018",
  like: ["Different form and climate; shares the method.", "형태와 기후는 다르지만 방법을 공유."],
  did: ["Turned Street View panoramas into upward fisheyes to estimate how much shade street trees give.", "스트리트뷰 파노라마를 위로 향한 어안 이미지로 바꿔 가로수 그늘의 양을 추정."],
  found: ["Street-level photos capture tree shade that building-height models miss.", "거리 사진은 건물 높이 모형이 놓치는 나무 그늘을 잡아냄."],
  tr: ["The basis of our sun-path and shade step.", "우리 태양 경로·그늘 단계의 바탕."]},
 {id: "phx", n: ["Phoenix", "피닉스"], lat: 33.45, lon: -112.07, ref: "Middel et al., 2017",
  like: ["A hot desert city; shares the fisheye method.", "더운 사막 도시. 어안 방법을 공유."],
  did: ["Generated fisheye views to map sky view factor at 5 m resolution for thermal-comfort routing.", "어안 이미지를 만들어 5 m 해상도의 하늘 조망 계수를 지도화하고 열쾌적 경로 안내에 활용."],
  found: ["Fine-scale sky openness varies a lot within a neighbourhood, with buildings and trees both mattering.", "동네 안에서도 하늘 개방도가 크게 달랐고, 건물과 나무 모두 중요했음."],
  tr: ["Same idea as our 'Find your 동' card, at a finer scale: show people where shade and open sky are.", "'우리 동 찾기'와 같은 생각을 더 세밀하게: 그늘과 열린 하늘이 어디 있는지 보여 줌."]},
 {id: "us", n: ["108 US cities", "미국 108개 도시"], lat: 39.5, lon: -96, ref: "Hoffman, Shandas & Pendleton, 2020",
  like: ["Many cities at once; the equity question.", "여러 도시를 한꺼번에. 형평성 질문."],
  did: ["Compared satellite land surface temperature in neighbourhoods 'redlined' in the 1930s with their neighbours.", "1930년대 레드라이닝된 동네의 위성 지표면 온도를 이웃 동네와 비교."],
  found: ["In 94% of the areas studied, formerly redlined neighbourhoods were hotter, by as much as 7 °C at the surface.", "연구 지역의 94%에서 과거 레드라이닝된 동네가 더 뜨거웠고, 지표면 온도 차이는 최대 7 °C."],
  tr: ["Surface temperature, not air temperature, and a history Seoul doesn't share. But the same question: who lives where it is hottest?", "기온이 아니라 지표면 온도이고, 서울과 다른 역사입니다. 그래도 같은 질문: 가장 더운 곳에는 누가 사는가?"]}];
let citySel = "hk";
function renderWorld() {
  const svg = $("#worldmap"); clear(svg); const X = lon => 60 + (lon + 130) / 290 * 560, Y = lat => 350 - (lat + 5) / 60 * 320;
  for (let lat = 0; lat <= 50; lat += 10) { el("line", {x1: 60, x2: 630, y1: Y(lat), y2: Y(lat), stroke: "#E2DED6"}, svg); txt(svg, 54, Y(lat) + 4, lat + "°N", {"text-anchor": "end", "font-size": 11, fill: "#8A979B"}); }
  for (let lon = -120; lon <= 150; lon += 30) el("line", {x1: X(lon), x2: X(lon), y1: Y(55), y2: Y(-5), stroke: "#EEEBE5"}, svg);
  txt(svg, X(-100), Y(52), L("Americas", "아메리카"), {"font-size": 12, fill: "#8A979B", "text-anchor": "middle"}); txt(svg, X(115), Y(52), L("East and Southeast Asia", "동아시아·동남아시아"), {"font-size": 12, fill: "#8A979B", "text-anchor": "middle"});
  const seoul = CITIES[0];
  CITIES.forEach(c => { if (!c.me) el("line", {x1: X(seoul.lon), y1: Y(seoul.lat), x2: X(c.lon), y2: Y(c.lat), stroke: c.id === citySel ? "#1E3557" : "#D6D1C7", "stroke-width": c.id === citySel ? 2 : 1, "stroke-dasharray": "4 4"}, svg); });
  CITIES.forEach(c => { const g = el("g", {style: "cursor:pointer"}, svg), on = c.id === citySel;
    el("circle", {cx: X(c.lon), cy: Y(c.lat), r: c.me ? 11 : on ? 10 : 7, fill: c.me ? "#D55E00" : on ? "#1E3557" : "#fff", stroke: "#1E3557", "stroke-width": 2}, g);
    const right = c.lon < 0 || c.id === "seoul" || c.id === "tpe";
    txt(g, X(c.lon) + (right ? 14 : -14), Y(c.lat) + 4, c.n[LANG === "ko" ? 1 : 0], {"font-size": 13, "font-weight": on || c.me ? 700 : 400, "text-anchor": right ? "start" : "end"});
    g.addEventListener("click", () => { if (!c.me) { citySel = c.id; renderWorld(); } }); });
  const c = CITIES.find(x => x.id === citySel), k = LANG === "ko" ? 1 : 0;
  $("#citycard").innerHTML = `<div class="card" style="border-left-color:#1E3557;margin-top:0"><h4>${c.n[k]} <span class="small">${c.ref}</span></h4>
    <p><b>${L("Like Seoul?", "서울과 닮은 점")}</b> ${c.like[k]}</p><p><b>${L("What they did", "무엇을 했나")}</b> ${c.did[k]}</p>
    <p><b>${L("What they found", "무엇을 찾았나")}</b> ${c.found[k]}</p><p><b>${L("What it means here", "우리에게 주는 의미")}</b> ${c.tr[k]}</p></div>`;
}

/* ---------- debate positions ---------- */
const POS = [
 {k: "A", t: ["Hottest streets first", "가장 더운 거리부터"],
  why: ["Cooling is physical: the most degrees gained per won come where streets are hottest. Heat reaches everyone who walks, works or waits there, not only residents.", "냉각은 물리적인 일입니다. 같은 예산으로 가장 많은 온도를 낮출 수 있는 곳은 가장 더운 거리입니다. 더위는 그곳에 사는 사람만이 아니라 걷고, 일하고, 기다리는 모든 사람에게 닿습니다."],
  data: ["S4 is 41.8% of Seoul's mapped streets: the target is large.", "S4는 서울 거리의 41.8%: 대상이 큽니다."],
  weak: ["Spreads money across 3,000 km of street and ignores who is most harmed.", "3,000 km의 거리에 예산을 흩고, 누가 가장 피해를 입는지를 보지 않습니다."]},
 {k: "B", t: ["Most vulnerable people first", "가장 취약한 사람부터"],
  why: ["Heat does not harm people equally. Age, illness, poor housing and low income decide who gets sick. Public money should go first to those with the least means to protect themselves.", "더위는 사람을 똑같이 해치지 않습니다. 나이, 질병, 열악한 주거, 낮은 소득이 누가 아플지를 정합니다. 공공 예산은 스스로를 지킬 수단이 가장 적은 사람에게 먼저 가야 합니다."],
  data: ["Seoul's night-heat mortality risk rises from a 22 °C night minimum (Oh et al., 2022).", "서울의 밤 더위 사망 위험은 밤 최저기온 22 °C부터 높아집니다(Oh 외, 2022)."],
  weak: ["Street fixes may not reach people whose problem is the room they sleep in; person-level help (cooling centres, bills) may do more.", "자는 방이 문제인 사람에게는 거리 개선이 닿지 않을 수 있습니다. 사람 단위 지원(쉼터, 냉방비)이 더 효과적일 수 있습니다."]},
 {k: "C", t: ["Where both meet", "둘이 겹치는 곳"],
  why: ["Where hot streets and need overlap, one project serves both aims. It is easy to explain and to map.", "더운 거리와 필요가 겹치는 곳에서는 사업 하나가 두 목표를 함께 채웁니다. 설명하기 쉽고 지도로 보이기 쉽습니다."],
  data: ["42 priority 동: top quarter for both S4 street share and 수급자 rate.", "우선 검토 동 42곳: S4 거리 비율과 수급자 비율이 모두 상위 25%."],
  weak: ["The list depends on the cut-off (a top third or top fifth gives a different list), and 동 averages hide individuals.", "목록은 기준선에 따라 달라지고(상위 1/3이나 1/5이면 목록이 바뀜), 동 평균은 개인을 가립니다."]},
 {k: "D", t: ["Citywide rules over projects", "사업보다 도시 전체 규칙"],
  why: ["Every rebuilt street is a chance. Rules on setbacks, street-wall height and planting shape all of them at little public cost, and treat every neighbourhood the same.", "다시 지어지는 모든 거리가 기회입니다. 후퇴선, 가로벽 높이, 식재 규칙은 공공 비용을 거의 들이지 않고 모든 거리를 바꾸며, 모든 동네를 똑같이 대합니다."],
  data: ["Night warmth follows enclosure (BVF); enclosure is set when blocks are built.", "밤의 따뜻함은 둘러싸임(BVF)을 따르고, 둘러싸임은 블록이 지어질 때 정해집니다."],
  weak: ["Slow: rules change streets over decades, while heatwaves come every summer.", "느립니다. 규칙은 수십 년에 걸쳐 거리를 바꾸지만, 폭염은 매년 옵니다."]}];
function renderPositions() {
  const k = LANG === "ko" ? 1 : 0;
  $("#positions").innerHTML = `<div class="posgrid">` + POS.map(p => `<div class="pos"><div class="pk">${p.k}</div><h4>${p.t[k]}</h4>
    <p>${p.why[k]}</p><p class="small"><b>${L("From the data", "자료에서")}:</b> ${p.data[k]}</p><p class="small"><b>${L("Weak point", "약점")}:</b> ${p.weak[k]}</p></div>`).join("") + `</div>`;
}
function initComments() {
  const box = $("#cusdis_thread"), note = $("#cnote");
  if (box.dataset.appId === "CUSDIS_APP_ID") { note.innerHTML = L("The comment box opens when the site goes live.", "댓글 창은 사이트가 공개되면 열립니다."); return; }
  const s = document.createElement("script"); s.src = "https://cusdis.com/js/cusdis.es.js"; s.async = true; s.defer = true;
  s.onerror = () => { note.textContent = L("Comments could not load here.", "이곳에서는 댓글을 불러올 수 없습니다."); };
  document.body.appendChild(s);
}

/* ---------- tap-to-translate terms ---------- */
// In the English page, Korean terms get an English gloss; in the Korean page, English terms get a Korean gloss.
const GK = { // Korean term -> English gloss
  "행정동": "administrative neighbourhood (dong); Seoul had 424 in the 2018 boundaries used here",
  "동": "neighbourhood (dong), the smallest administrative unit; Seoul had 424",
  "구": "district (gu); Seoul has 25",
  "국민기초생활보장": "National Basic Livelihood Security, Korea's main public assistance programme",
  "수급자": "recipient of basic livelihood support (Korea's main public assistance)",
  "생활인구": "people present in an area at a given hour, estimated by Seoul from mobile-network and public data",
  "등록인구": "registered population", "주민등록인구": "registered resident population",
  "쪽방": "very small single-room rentals, often a few square metres, home to some of Seoul's poorest residents",
  "반지하": "semi-basement flat", "고시원": "very small rented rooms, originally for exam students, now low-cost housing",
  "열대야": "tropical night", "서울 열린데이터광장": "Seoul Open Data Plaza, the city's open-data portal",
  "국토교통부": "Ministry of Land, Infrastructure and Transport", "통계청": "Statistics Korea", "기상청": "Korea Meteorological Administration",
  "공공누리": "Korea Open Government License", "GIS건물통합정보": "the national integrated GIS building dataset",
  "서울시 정보통신과": "Seoul city's ICT division, which runs the sensor network", "기상자료개방포털": "KMA's open weather-data portal"};
const GE = { // English term -> Korean gloss
  "BVF": "건물 조망 계수: 거리에서 본 하늘 가운데 건물이 가리는 비율",
  "NDVI": "정규식생지수: 위성으로 잰 초록 식생의 양 (−1~1)",
  "SVF": "하늘 조망 계수: 거리에서 보이는 하늘의 비율",
  "S-DoT": "서울시 도시데이터 센서(Smart Seoul Data of Things): 거리의 기온 등을 재는 IoT 센서망",
  "SegFormer-B4": "이미지의 모든 픽셀을 하늘, 건물, 나무 등으로 분류하는 AI 모델", "SegFormer": "이미지의 모든 픽셀을 분류하는 AI 모델",
  "ADE20K": "AI 학습용 공개 장면 이미지 데이터셋 (150개 분류)", "k-means": "가장 가까운 중심을 기준으로 자료를 묶는 군집 방법",
  "Gaussian mixture": "자료를 여러 정규분포의 합으로 보고 묶는 군집 방법", "HC1": "이분산에 강건한 표준오차의 한 종류",
  "Holm": "여러 검정을 함께 할 때 오류를 통제하는 보정 방법", "Sentinel-2": "유럽 우주청의 지구 관측 위성 (해상도 10 m)",
  "OpenStreetMap": "누구나 편집하는 공개 세계 지도", "Google Street View": "구글의 거리 파노라마 사진 서비스",
  "R²": "결정계수: 모형이 설명하는 변동의 비율", "κ": "카파: 우연을 넘어선 일치 정도", "ARI": "조정 랜드 지수: 두 군집 결과가 얼마나 같은지",
  "FABDEM": "숲과 건물을 지운 30 m 해상도 지형 고도 자료", "V02": "S-DoT 센서 기종 중 하나", "OC3": "S-DoT 센서 기종 중 하나",
  "redlining": "미국에서 1930년대 특정 동네에 대출을 거부했던 차별 정책", "LCZ": "국지 기후대: 도시 기후 연구용 표준 지역 분류",
  "p값": "우연만으로 이만한 결과가 나올 확률"};
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GU = {"종로구":"Jongno-gu","중구":"Jung-gu","용산구":"Yongsan-gu","성동구":"Seongdong-gu","광진구":"Gwangjin-gu","동대문구":"Dongdaemun-gu","중랑구":"Jungnang-gu","성북구":"Seongbuk-gu","강북구":"Gangbuk-gu","도봉구":"Dobong-gu","노원구":"Nowon-gu","은평구":"Eunpyeong-gu","서대문구":"Seodaemun-gu","마포구":"Mapo-gu","양천구":"Yangcheon-gu","강서구":"Gangseo-gu","구로구":"Guro-gu","금천구":"Geumcheon-gu","영등포구":"Yeongdeungpo-gu","동작구":"Dongjak-gu","관악구":"Gwanak-gu","서초구":"Seocho-gu","강남구":"Gangnam-gu","송파구":"Songpa-gu","강동구":"Gangdong-gu"};
const multi = Object.keys(GK).filter(k => k.includes(" ")).sort((a, b) => b.length - a.length).map(esc);
const RK = new RegExp(`(?<![\\p{Script=Hangul}0-9])(${multi.join("|")}${multi.length ? "|" : ""}[\\p{Script=Hangul}][\\p{Script=Hangul}0-9·]*)(?![\\p{Script=Hangul}])`, "gu");
function glossKo(t) {
  if (GK[t]) return GK[t];
  if (GU[t]) return `${GU[t]}, one of Seoul's 25 districts (gu)`;
  const hits = (D.dong ? D.dong.f : []).filter(f => f.n === t);
  if (hits.length) {
    const f = hits[0], name = f.en ? f.en.replace(/\(.*?\)/g, "") : null;
    const where = hits.map(h => GU[h.gu] || h.gu).join(" / ");
    return `${name ? name + ", a" : "A"} neighbourhood (dong) in ${where}` + (hits.length === 1 ? `. S4 streets: ${Math.round(100 * f.sh[3])}% of street length; 수급자: ${(100 * f.rate).toFixed(1)}% of residents.` : ".");
  }
  return null;
}
const RE = new RegExp(`(?<![A-Za-z0-9-])(${Object.keys(GE).sort((a, b) => b.length - a.length).map(esc).join("|")})(?![A-Za-z0-9-])`, "g");
const SKIP = "svg,script,style,code,pre,textarea,input,button,.v,.term,.gt,.tchip,.bar,h1,.mail,.formula,.refs";
function wrapTerms(root = document.body) {
  const DYN = "#positions,#reflist,#citycard,#eqcards,#dcard,#typelist,#fexplain,#stepbody,#nightinfo,#codeblocks,#gloss,#dotinfo,#tread,#tcap,#pollbtns,#pollnote";
  [["en", RK, GK, ".en"], ["ko", RE, GE, ".ko"]].forEach(([cls, rx, dict, sel]) => {
    root.querySelectorAll(sel + (LANG === cls ? "," + DYN : "")).forEach(scope => {
      const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {acceptNode: n => n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
      const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => { rx.lastIndex = 0; if (!rx.test(n.nodeValue)) return; rx.lastIndex = 0;
        const frag = document.createDocumentFragment(); let last = 0, any = false; n.nodeValue.replace(rx, (m, t, off) => {
          const g = cls === "en" ? glossKo(t) : dict[t]; if (!g) return m; any = true;
          frag.appendChild(document.createTextNode(n.nodeValue.slice(last, off)));
          const s = document.createElement("span"); s.className = "gt"; s.dataset.g = g; s.textContent = t; s.tabIndex = 0; frag.appendChild(s); last = off + m.length; });
        if (!any) return;
        frag.appendChild(document.createTextNode(n.nodeValue.slice(last))); n.parentNode.replaceChild(frag, n); });
    });
  });
}
document.addEventListener("click", e => { const t = e.target.closest(".gt"); if (!t) return; e.stopPropagation();
  const tip = $("#tip"); tip.innerHTML = `<b>${t.textContent}</b><br>${t.dataset.g}`; const r = t.getBoundingClientRect();
  tip.style.display = "block"; tip.style.left = Math.min(innerWidth - 300, Math.max(8, r.left)) + "px"; tip.style.top = (r.bottom + 6) + "px"; }, true);

/* ---------- visitor poll (anonymous counters, no sign-up) ---------- */
const PNS = "https://abacus.jasoncameron.dev", PKEY = "floweringwisdom-climate-of-a-street";
let myVote = null; try { myVote = localStorage.getItem("cos-vote"); } catch (e) {}
let pollCounts = null, pollErr = false;
function getCount(k) { return fetch(`${PNS}/get/${PKEY}/debate-${k}`).then(r => r.status === 404 ? {value: 0} : r.json()).then(j => +j.value || 0); }
function loadResults() {
  Promise.all(POS.map(p => getCount(p.k))).then(v => { pollCounts = {}; POS.forEach((p, i) => pollCounts[p.k] = v[i]); pollErr = false; drawPoll(); })
    .catch(() => { pollErr = true; drawPoll(); });
}
function vote(p) {
  if (myVote) return;
  myVote = p; try { localStorage.setItem("cos-vote", p); } catch (e) {}
  fetch(`${PNS}/hit/${PKEY}/debate-${p}`).then(r => r.json()).then(() => loadResults()).catch(() => { pollErr = true; drawPoll(); });
  drawPoll();
}
function drawPoll() {
  const k = LANG === "ko" ? 1 : 0;
  $("#pollbtns").innerHTML = POS.map(p => `<button data-p="${p.k}" class="${myVote === p.k ? "on" : ""}" ${myVote ? "disabled" : ""}><b>${p.k}</b>${p.t[k]}${myVote === p.k ? " ✓" : ""}</button>`).join("");
  $$("#pollbtns button").forEach(b => b.addEventListener("click", () => vote(b.dataset.p)));
  const c = pollCounts || {}, tot = Object.values(c).reduce((a, b) => a + b, 0);
  $("#pollres").innerHTML = pollErr ? `<p class="small">${L("Results can't load here; they show on the live site.", "이곳에서는 결과를 불러올 수 없습니다. 공개 사이트에서 보입니다.")}</p>`
    : `<div class="small" style="margin-bottom:4px">${L("Votes so far", "지금까지의 투표")}: ${pollCounts ? tot : "…"}</div>` + POS.map(p => { const v = c[p.k] || 0, pc = tot ? Math.round(100 * v / tot) : 0;
      return `<div class="pbar"><b>${p.k}</b><div class="t"><i style="width:${pc}%"></i></div><span class="num">${pc}%</span></div>`; }).join("");
  $("#pollnote").textContent = (myVote ? L("Thanks for voting. One vote per browser. ", "투표해 주셔서 감사합니다. 브라우저당 한 표입니다. ") : "") +
    L("An informal, anonymous visitor poll, not a survey.", "설문 조사가 아닌 비공식 익명 방문자 투표입니다.");
}
function renderPoll() { drawPoll(); if (!pollCounts && !pollErr) loadResults(); }
/* ---------- boot ---------- */
const files = ["values", "nights", "profile", "two", "sensors", "versions", "trop", "dong", "base", "inset"];
Promise.all(files.map(f => fetch(`data/${f}.json`).then(r => r.json()))).then(arr => {
  files.forEach((f, i) => D[f] = arr[i]);
  fillNumbers();
  addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(() => { renderStripe(); renderTwo(); }, 200); });
  renders.push(renderStripe, renderSteps, renderScatter, renderVersions, renderLadder, renderForest, renderTrop, renderRes, renderInset, renderCode, renderRefs, renderGloss, renderEq, renderWorld, renderPositions, renderPoll, () => wrapTerms());
  renderStripe(); renderSteps(); renderScatter(); renderVersions(); renderLadder(); renderForest(); renderTrop(); renderRes(); renderInset(); renderCode(); renderRefs(); renderGloss(); renderEq(); renderWorld(); renderPositions(); renderPoll(); wrapTerms();
  initTwo(); initCanyon(); initProfile(); initStreetMap(); initDong(); initTips(); initMail();
}).catch(e => { document.body.insertAdjacentHTML("afterbegin", `<p style="background:#fdd;padding:10px">Data failed to load: ${e}</p>`); console.error(e); });
})();
