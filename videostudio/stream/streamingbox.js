// === Galaxy Background ===
const galaxy = document.getElementById("galaxyCanvas");
const ctx = galaxy.getContext("2d");
let w, h;
function resize() { w = galaxy.width = window.innerWidth; h = galaxy.height = window.innerHeight; }
window.addEventListener("resize", resize);
resize();
const stars = Array.from({ length: 250 }, () => ({
  x: Math.random() * w, y: Math.random() * h,
  size: Math.random() * 2,
  color: Math.random() > 0.5 ? "#00ffff" : "#ff00ff",
  flicker: Math.random() * 2
}));
function drawGalaxy() {
  ctx.clearRect(0,0,w,h);
  for (let s of stars) {
    ctx.globalAlpha = 0.6 + Math.sin(Date.now()/400 + s.flicker)*0.3;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.size,0,Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(drawGalaxy);
}
drawGalaxy();

// === Elements ===
const captureFeed = document.getElementById("captureFeed");
const webcamFeed = document.getElementById("webcamFeed");
const startCaptureBtn = document.getElementById("startCaptureBtn");
const stopCaptureBtn = document.getElementById("stopCaptureBtn");
const startWebcamBtn = document.getElementById("startWebcamBtn");
const stopWebcamBtn = document.getElementById("stopWebcamBtn");

let captureStream = null, webcamStream = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterDest = audioCtx.createMediaStreamDestination();

// === Audio Gains ===
const gainCapture = audioCtx.createGain();
const gainWebcam = audioCtx.createGain();
const gainBoard = audioCtx.createGain();

// === Start/Stop Capture ===
startCaptureBtn.addEventListener("click", async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    const id = videoDevices.at(1).deviceId;
    captureStream =  await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: { exact: id },
            width: { ideal: 1920 },
            height: { ideal: 1080 } 
          },
          audio: false
        });
    captureFeed.srcObject = captureStream;
    startCaptureBtn.disabled = true; stopCaptureBtn.disabled = false;
  } catch (err) { console.error(err); alert("Capture-Card-Fehler."); }
});
stopCaptureBtn.addEventListener("click", () => {
  if (captureStream) captureStream.getTracks().forEach(t => t.stop());
  captureFeed.srcObject = null;
  startCaptureBtn.disabled = false; stopCaptureBtn.disabled = true;
});

// === Start/Stop Webcam ===
startWebcamBtn.addEventListener("click", async () => {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    webcamFeed.srcObject = webcamStream;
    const audTracks = webcamStream.getAudioTracks();
    if (audTracks.length) {
      const s = audioCtx.createMediaStreamSource(new MediaStream(audTracks));
      s.connect(gainWebcam).connect(masterDest);
    }
    startWebcamBtn.disabled = true; stopWebcamBtn.disabled = false;
  } catch (err) { console.error(err); alert("Webcam-Fehler."); }
});
stopWebcamBtn.addEventListener("click", () => {
  if (webcamStream) webcamStream.getTracks().forEach(t => t.stop());
  webcamFeed.srcObject = null;
  startWebcamBtn.disabled = false; stopWebcamBtn.disabled = true;
});

// === Draggable & Resizable PIP ===
const pip = document.getElementById("pipWrapper");
const handle = pip.querySelector(".pipHandle");
let dragging = false, startX, startY, origX, origY;
handle.addEventListener("pointerdown", e => {
  dragging = true;
  startX = e.clientX; startY = e.clientY;
  const r = pip.getBoundingClientRect();
  origX = r.left; origY = r.top;
  pip.setPointerCapture(e.pointerId);
});
window.addEventListener("pointermove", e => {
  if (!dragging) return;
  const dx = e.clientX - startX, dy = e.clientY - startY;
  pip.style.left = origX + dx + "px";
  pip.style.top = origY + dy + "px";
  pip.style.right = "auto"; pip.style.bottom = "auto";
  pip.style.position = "absolute";
});
window.addEventListener("pointerup", () => dragging = false);

// === Soundboard ===
const sndButtons = document.querySelectorAll(".snd");
const customFile = document.getElementById("customSoundFile");
const addCustom = document.getElementById("addCustom");
const customList = document.getElementById("customList");

function playSound(url) {
  var audio = document.getElementById("soundSource");
  var source = document.getElementById("audioElement");

  source.src = url;
}

sndButtons.forEach(b => b.addEventListener("click", () => playSound(b.dataset.src)));
addCustom.addEventListener("click", () => {
  const f = customFile.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const btn = document.createElement("button");
  btn.className = "snd";
  btn.textContent = f.name.split(".")[0];
  btn.onclick = () => playSound(url);
  customList.appendChild(btn);
});




    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .catch(err => logMsg(`⚠️ Zugriff verweigert oder keine Geräte: ${err}`));

