// EDIT THIS ARRAY to swap in Dallas's real beats.
// Put MP3s in assets/audio/, then set src to that file and placeholder to false.
const beats = [
  { title: "223", detail: "140 BPM", src: "assets/audio/223-140bpm.mp3", hidden: false },
  { title: "BEN", detail: "131 BPM", src: "assets/audio/ben-131bpm.mp3", hidden: false },
  { title: "BLUE STRIP", detail: "145 BPM", src: "assets/audio/blue-strip-145bpm.mp3", hidden: false },
  { title: "CANCER", detail: "134 BPM", src: "assets/audio/cancer-134bpm.mp3", hidden: false },
  { title: "FIRST LAB", detail: "BPM —", src: "assets/audio/first-lab.mp3", hidden: false },
  { title: "HEARTEATER", detail: "150 BPM", src: "assets/audio/hearteater-150bpm.mp3", hidden: false },
  { title: "LIQUID", detail: "140 BPM", src: "assets/audio/liquid-140bpm.mp3", hidden: false },
  { title: "LUCID", detail: "135 BPM", src: "assets/audio/lucid-135bpm.mp3", hidden: false },
  { title: "MEMO", detail: "137 BPM", src: "assets/audio/memo-137bpm.mp3", hidden: false },
  { title: "MOONLIT", detail: "145 BPM", src: "assets/audio/moonlit-145bpm.mp3", hidden: false },
  { title: "SLATE", detail: "140 BPM", src: "assets/audio/slate-140bpm.mp3", hidden: false },
  { title: "SUNRISE", detail: "140 BPM", src: "assets/audio/sunrise-140bpm.mp3", hidden: false },
  { title: "ZEN", detail: "BPM —", src: "assets/audio/zen.mp3", hidden: false }
];

const audio = new Audio();
audio.preload = "metadata";
const list = document.querySelector("#track-list");
const template = document.querySelector("#track-template");
const status = document.querySelector("#status");
let currentIndex = -1;
let rows = [];
let demoUrls = [];
let audioContext;
let analyser;
let sourceNode;
const manageMode = new URLSearchParams(location.search).get("manage") === "1";
const localHidden = manageMode ? JSON.parse(localStorage.getItem("sannt-hidden") || "[]") : [];

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function createDemoWav(seed, duration = 18) {
  const rate = 22050;
  const samples = rate * duration;
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const write = (offset, text) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, "data"); view.setUint32(40, samples * 2, true);
  const bpm = 124 + seed * 4;
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const beat = (t * bpm / 60) % 1;
    const kick = Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-beat * 18)) * t) * Math.exp(-beat * 12);
    const hatPhase = (t * bpm / 30) % 1;
    const noise = (Math.sin(i * (12.9898 + seed)) * 43758.5453 % 1) * Math.exp(-hatPhase * 45);
    const notes = [55, 65.41, 73.42, 49];
    const note = notes[Math.floor(t / (60 / bpm * 4)) % notes.length] * (1 + seed * .015);
    const bass = Math.sin(2 * Math.PI * note * t) * .34;
    const fade = Math.min(1, t * 3, (duration - t) * 2);
    const sample = Math.max(-1, Math.min(1, (kick * .6 + bass + noise * .07) * fade));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

beats.forEach((beat, index) => {
  const row = template.content.firstElementChild.cloneNode(true);
  if (beat.hidden || localHidden.includes(beat.title)) row.hidden = true;
  row.querySelector(".track-number").textContent = String(index + 1).padStart(2, "0");
  row.querySelector(".track-title").textContent = beat.title;
  row.querySelector(".track-note").textContent = beat.detail;
  const play = row.querySelector(".play-button");
  play.dataset.index = index;
  play.setAttribute("aria-label", `Play ${beat.title}`);
  const download = row.querySelector(".download");
  row.querySelector(".rate").dataset.index = index;
  if (beat.placeholder) {
    const url = createDemoWav(beat.seed);
    demoUrls.push(url);
    beat.playSrc = url;
    download.href = url;
    download.download = `${beat.title.toLowerCase().replaceAll(" ", "-")}-demo.wav`;
  } else {
    beat.playSrc = beat.src;
    download.href = beat.src;
    download.download = `${beat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.mp3`;
  }
  list.append(row);
  rows.push(row);
});

document.querySelector("#track-count").textContent = `${String(rows.filter(row => !row.hidden).length).padStart(2, "0")} tracks`;

function setupAnalyser() {
  // Browsers frequently silence MediaElementSource audio on file:// pages.
  // Keep direct audio playback for local previews; enable analysis on HTTP(S).
  if (location.protocol === "file:") return false;
  if (audioContext) return true;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = .86;
  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
  return true;
}

function setPlayingUI(isPlaying) {
  rows.forEach((row, index) => {
    const active = index === currentIndex && isPlaying;
    row.classList.toggle("is-playing", active);
    row.querySelector(".play-button").setAttribute("aria-label", `${active ? "Pause" : "Play"} ${beats[index].title}`);
  });
}

async function toggleTrack(index) {
  const analyserReady = setupAnalyser();
  if (analyserReady && audioContext.state === "suspended") await audioContext.resume();
  if (currentIndex === index) {
    if (audio.paused) await audio.play(); else audio.pause();
    return;
  }
  currentIndex = index;
  audio.src = beats[index].playSrc;
  audio.load();
  try { await audio.play(); }
  catch { showStatus("Could not play this file. Check its path and format."); }
}

list.addEventListener("click", event => {
  const button = event.target.closest(".play-button");
  if (button) toggleTrack(Number(button.dataset.index));
});

list.addEventListener("input", event => {
  if (!event.target.matches(".progress")) return;
  const index = rows.indexOf(event.target.closest(".track"));
  if (index !== currentIndex || !audio.duration) return;
  audio.currentTime = (event.target.value / 1000) * audio.duration;
});

audio.addEventListener("play", () => setPlayingUI(true));
audio.addEventListener("pause", () => setPlayingUI(false));
audio.addEventListener("ended", () => setPlayingUI(false));
audio.addEventListener("timeupdate", () => {
  if (currentIndex < 0) return;
  const progress = rows[currentIndex].querySelector(".progress");
  const fraction = audio.duration ? audio.currentTime / audio.duration : 0;
  progress.value = fraction * 1000;
  progress.style.setProperty("--fill", `${fraction * 100}%`);
  rows[currentIndex].querySelector(".track-time").textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

audio.addEventListener("loadedmetadata", () => {
  if (currentIndex >= 0) rows[currentIndex].querySelector(".track-time").textContent = `0:00 / ${formatTime(audio.duration)}`;
});

document.querySelector("[data-scroll-to-tracks]").addEventListener("click", () => document.querySelector("#beats").scrollIntoView({ behavior: "smooth" }));

function showStatus(message) {
  status.textContent = message;
  status.classList.add("show");
  setTimeout(() => status.classList.remove("show"), 3000);
}

// Restrained audio-reactive field: actual analyser data drives pulse size and line movement.
const canvas = document.querySelector("#visualizer");
const ctx = canvas.getContext("2d");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let energy = 0;
let phase = 0;

function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  const w = innerWidth;
  const h = innerHeight;
  ctx.clearRect(0, 0, w, h);
  let target = 0;
  let high = 0;
  if (analyser && !audio.paused) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    target = data.slice(0, 18).reduce((sum, value) => sum + value, 0) / (18 * 255);
    high = data.slice(30, 80).reduce((sum, value) => sum + value, 0) / (50 * 255);
  }
  energy += (target - energy) * (target > energy ? .2 : .035);
  phase += .003 + high * .018;
  const x = w * (.72 + Math.sin(phase) * .035);
  const y = h * (.42 + Math.cos(phase * .7) * .035);
  const radius = Math.min(w, h) * (.22 + energy * .62);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(255, 77, 36, ${.08 + energy * .2})`);
  glow.addColorStop(.45, `rgba(126, 36, 19, ${.035 + energy * .08})`);
  glow.addColorStop(1, "rgba(9, 9, 9, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const px = (i / 80) * w;
    const wave = Math.sin(i * .3 + phase * 5) * (8 + high * 42);
    const py = h * .72 + wave;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = `rgba(240, 237, 231, ${.025 + energy * .08})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  requestAnimationFrame(draw);
}

resizeCanvas();
addEventListener("resize", resizeCanvas);
if (!reducedMotion) draw();
addEventListener("beforeunload", () => demoUrls.forEach(URL.revokeObjectURL));

// Scroll becomes part of the artwork: it grades, zooms, and shifts the fixed image.
let scrollFrame = 0;
function updateScrollScene() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, scrollY / max);
  document.documentElement.style.setProperty("--scroll", progress.toFixed(4));
  scrollFrame = 0;
}
addEventListener("scroll", () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollScene);
}, { passive: true });
updateScrollScene();

const ratingDialog = document.querySelector("#rating-dialog");
const ratingTrack = document.querySelector("#rating-track");
const ratingValue = document.querySelector("#rating-value");
const ratingComment = document.querySelector("#rating-comment");
let ratingIndex = -1;
let selectedRating = 0;
list.addEventListener("click", event => {
  const rateButton = event.target.closest(".rate");
  if (!rateButton) return;
  ratingIndex = Number(rateButton.dataset.index);
  selectedRating = 0;
  ratingTrack.textContent = beats[ratingIndex].title.toLowerCase();
  ratingValue.textContent = "0";
  ratingComment.value = "";
  ratingDialog.querySelectorAll(".stars button").forEach(button => button.classList.remove("active"));
  ratingDialog.showModal();
});
ratingDialog.querySelector(".stars").addEventListener("click", event => {
  const button = event.target.closest("[data-rating]");
  if (!button) return;
  selectedRating = Number(button.dataset.rating);
  ratingValue.textContent = String(selectedRating);
  ratingDialog.querySelectorAll(".stars button").forEach(item => {
    const value = Number(item.dataset.rating);
    item.classList.toggle("active", selectedRating === 0 ? value === 0 : value > 0 && value <= selectedRating);
  });
});
ratingDialog.querySelector(".send-rating").addEventListener("click", () => {
  if (ratingIndex < 0) return;
  const subject = `Beat feedback: ${beats[ratingIndex].title} (${selectedRating}/5)`;
  const body = `Beat: ${beats[ratingIndex].title}\nRating: ${selectedRating}/5\n\nComment:\n${ratingComment.value.trim() || "No comment"}`;
  location.href = `mailto:dndarsey@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Gentle pointer parallax gives the hero sculpture a tactile studio-object feel.
addEventListener("pointermove", event => {
  document.documentElement.style.setProperty("--pointer-x", (event.clientX / innerWidth).toFixed(3));
  document.documentElement.style.setProperty("--pointer-y", (event.clientY / innerHeight).toFixed(3));
}, { passive: true });

// The sculpture occasionally becomes aware, follows the visitor, then settles.
const eye = document.querySelector(".eye");
let eyeTimer;
function scheduleEye() {
  clearTimeout(eyeTimer);
  eyeTimer = setTimeout(() => {
    if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return scheduleEye();
    const enraged = Math.random() < .28;
    eye.classList.add("awake");
    if (enraged) {
      setTimeout(() => {
        eye.classList.add("angry");
        document.body.classList.add("rage");
      }, 1800);
    }
    setTimeout(() => {
      eye.classList.remove("awake", "angry");
      document.body.classList.remove("rage");
      scheduleEye();
    }, enraged ? 7800 : 4700);
  }, 6500 + Math.random() * 8500);
}
scheduleEye();

if (manageMode) {
  document.body.classList.add("manage-mode");
  const panel = document.createElement("aside");
  panel.className = "manage-panel";
  panel.innerHTML = `<div class="manage-head"><strong>owner view</strong><button type="button" data-close>×</button></div><p>Changes preview only on this device. Copy the settings and send them back to publish.</p><div class="manage-list"></div><button type="button" class="copy-settings">copy hide settings</button>`;
  const manageList = panel.querySelector(".manage-list");
  beats.forEach(beat => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" ${localHidden.includes(beat.title) ? "" : "checked"}><span>${beat.title}</span>`;
    label.querySelector("input").addEventListener("change", event => {
      const saved = new Set(JSON.parse(localStorage.getItem("sannt-hidden") || "[]"));
      if (event.target.checked) saved.delete(beat.title); else saved.add(beat.title);
      localStorage.setItem("sannt-hidden", JSON.stringify([...saved]));
      location.reload();
    });
    manageList.append(label);
  });
  panel.querySelector("[data-close]").addEventListener("click", () => panel.remove());
  panel.querySelector(".copy-settings").addEventListener("click", async () => {
    const settings = localStorage.getItem("sannt-hidden") || "[]";
    try { await navigator.clipboard.writeText(settings); showStatus("Hide settings copied"); }
    catch { showStatus(`Hidden: ${settings}`); }
  });
  document.body.append(panel);
}
