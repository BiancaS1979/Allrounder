// === Video-Editor Magenta & Aqua Edition (Dark Fade + Glitter Transition) ===
const videoUpload = document.getElementById("videoUpload");
const playAllBtn = document.getElementById("playAllBtn");
const timeline = document.getElementById("timeline");
const videoPlayer = document.getElementById("videoPlayer");
const canvas = document.getElementById("transitionCanvas");
const ctx = canvas.getContext("2d");

let clips = [];
let currentClipIndex = 0;
let progressBars = [];
let playingAll = false;

// === Clips hinzufügen ===
videoUpload.addEventListener("change", (e) => {
  const newFiles = Array.from(e.target.files).map(f => URL.createObjectURL(f));
  clips.push(...newFiles);
  renderTimeline();
});

// === Timeline aktualisieren ===
function renderTimeline() {
  timeline.innerHTML = "";
  progressBars = [];

  clips.forEach((clip, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "clip-preview";

    const label = document.createElement("span");
    label.textContent = `Clip ${index + 1}`;
    label.style.position = "absolute";
    label.style.top = "4px";
    label.style.left = "6px";
    label.style.fontSize = "0.8em";
    label.style.color = "aqua";

    const vid = document.createElement("video");
    vid.src = clip;
    vid.muted = true;
    vid.addEventListener("click", () => {
      currentClipIndex = index;
      playClip(index);
      highlightActiveClip();
    });

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    progressBars.push(bar);

    wrapper.appendChild(vid);
    wrapper.appendChild(label);
    wrapper.appendChild(bar);
    timeline.appendChild(wrapper);
  });
}

// === Aktiven Clip hervorheben ===
function highlightActiveClip() {
  const allClips = document.querySelectorAll(".clip-preview");
  allClips.forEach((el, idx) => {
    el.style.borderColor = idx === currentClipIndex ? "magenta" : "aqua";
  });
}

// === Einzelclip abspielen ===
function playClip(index) {
  if (clips[index]) {
    videoPlayer.src = clips[index];
    videoPlayer.play();
    highlightActiveClip();
  }
}

// === Fortschrittsanzeige ===
videoPlayer.addEventListener("timeupdate", () => {
  if (progressBars[currentClipIndex]) {
    const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBars[currentClipIndex].style.width = `${percent}%`;
  }
});

// === Alles abspielen ===
playAllBtn.addEventListener("click", () => {
  if (!clips.length) return alert("Keine Clips geladen!");
  currentClipIndex = 0;
  playingAll = true;
  resetProgressBars();
  playClip(0);
});

// === Clipende → Übergang + Nächster Clip ===
videoPlayer.addEventListener("ended", () => {
  if (playingAll && currentClipIndex < clips.length - 1) {
    showDarkFade(() => showGlitterTransition(() => {
      currentClipIndex++;
      playClip(currentClipIndex);
      showLightFade();
    }));
  } else {
    playingAll = false;
  }
});

// === Fortschrittsbalken zurücksetzen ===
function resetProgressBars() {
  progressBars.forEach(bar => bar.style.width = "0%");
}

// === Schwarze Einblendung ===
function showDarkFade(callback) {
  canvas.width = videoPlayer.clientWidth;
  canvas.height = videoPlayer.clientHeight;
  canvas.style.display = "block";

  let opacity = 0;
  const fadeSpeed = 0.03;

  function fade() {
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    opacity += fadeSpeed;
    if (opacity < 1) requestAnimationFrame(fade);
    else callback && callback();
  }
  fade();
}

// === Glitzerwirbel (kräftiger & dichter) ===
function showGlitterTransition(callback) {
  let particles = [];
  for (let i = 0; i < 500; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      color: Math.random() > 0.5 ? "magenta" : "aqua",
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 6,
      speedY: (Math.random() - 0.5) * 6,
      alpha: 1
    });
  }

  let frame = 0;
  function animate() {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= 0.02;
    });

    frame++;
    if (frame < 70) requestAnimationFrame(animate);
    else callback && callback();
  }
  animate();
}

// === Helle Einblendung nach dem Übergang ===
function showLightFade() {
  let opacity = 1;
  const fadeSpeed = 0.03;

  function fadeOut() {
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    opacity -= fadeSpeed;
    if (opacity > 0) requestAnimationFrame(fadeOut);
    else {
      canvas.style.display = "none";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  fadeOut();
}

