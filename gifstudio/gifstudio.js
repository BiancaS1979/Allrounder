// gifstudio.js – Background Removal (stabile Browser-kompatible Version)
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gifCanvas");
  const ctx = canvas.getContext("2d");
  const gifInput = document.getElementById("gifInput");
  const decodeBtn = document.getElementById("decodeBtn");
  const playBtn = document.getElementById("playBtn");
  const rotateBtn = document.getElementById("rotateBtn");
  const flipBtn = document.getElementById("flipBtn");
  const saveFramesBtn = document.getElementById("saveFramesBtn");
  const keyColorInput = document.getElementById("keyColor");
  const tolInput = document.getElementById("tolerance");
  const tolVal = document.getElementById("tolVal");
  const bgImageInput = document.getElementById("bgImageInput");
  const bgReplaceColor = document.getElementById("bgReplaceColor");
  const previewReplaceBtn = document.getElementById("previewReplaceBtn");
  const applyAllBtn = document.getElementById("applyAllBtn");
  const revertBtn = document.getElementById("revertBtn");
  const frameStrip = document.getElementById("frameStrip");

  let frames = [];
  let originalFrames = null;
  let currentFrame = 0;
  let playing = false;
  let playInterval = null;

  async function fileToArrayBuffer(file) {
    return await file.arrayBuffer();
  }

  async function decodeWithImageDecoder(arrayBuffer) {
    try {
      const decoder = new ImageDecoder({ data: arrayBuffer, type: "image/gif" });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      if (!track || !track.frameCount) return null;
      const out = [];
      for (let i = 0; i < track.frameCount; i++) {
        const res = await decoder.decode({ frameIndex: i });
        const bmp = await createImageBitmap(res.image);
        out.push({ bitmap: bmp, delay: res.duration || 200 });
      }
      return out;
    } catch (err) {
      console.warn("Decoder fehlgeschlagen:", err);
      return null;
    }
  }

  async function decodeArrayBuffer(arrayBuffer) {
    const res = await decodeWithImageDecoder(arrayBuffer);
    if (!res || !res.length) throw new Error("Konnte GIF nicht zerlegen.");
    return res;
  }

  decodeBtn.addEventListener("click", async () => {
    const file = gifInput.files[0];
    if (!file) return alert("Bitte ein GIF auswählen.");
    try {
      const ab = await fileToArrayBuffer(file);
      frames = await decodeArrayBuffer(ab);
      originalFrames = frames.map(f => ({ bitmap: f.bitmap, delay: f.delay }));
      currentFrame = 0;
      renderCurrent();
      renderStrip();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Zerlegen – siehe Konsole.");
    }
  });

  function renderCurrent() {
    if (!frames.length) return;
    const img = frames[currentFrame].bitmap;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }

  function renderStrip() {
    frameStrip.innerHTML = "";
    frames.forEach((f, i) => {
      const c = document.createElement("canvas");
      c.width = 60;
      c.height = 60;
      const cx = c.getContext("2d");
      const scale = Math.min(c.width / f.bitmap.width, c.height / f.bitmap.height);
      const dw = f.bitmap.width * scale;
      const dh = f.bitmap.height * scale;
      cx.drawImage(f.bitmap, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
      const img = document.createElement("img");
      img.src = c.toDataURL();
      img.title = `Frame ${i + 1}`;
      img.onclick = () => {
        currentFrame = i;
        renderCurrent();
      };
      frameStrip.appendChild(img);
    });
  }

  playBtn.addEventListener("click", () => {
    if (!frames.length) return;
    if (playing) {
      clearInterval(playInterval);
      playing = false;
    } else {
      playing = true;
      playInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % frames.length;
        renderCurrent();
      }, frames[currentFrame]?.delay || 200);
    }
  });

  rotateBtn.addEventListener("click", rotateAll);
  flipBtn.addEventListener("click", flipAll);

  async function rotateAll() {
    frames = await Promise.all(
      frames.map(async f => {
        const tmp = document.createElement("canvas");
        tmp.width = f.bitmap.height;
        tmp.height = f.bitmap.width;
        const tctx = tmp.getContext("2d");
        tctx.translate(tmp.width / 2, tmp.height / 2);
        tctx.rotate(Math.PI / 2);
        tctx.drawImage(f.bitmap, -f.bitmap.width / 2, -f.bitmap.height / 2);
        return { bitmap: await createImageBitmap(tmp), delay: f.delay };
      })
    );
    currentFrame = 0;
    renderCurrent();
    renderStrip();
  }

  async function flipAll() {
    frames = await Promise.all(
      frames.map(async f => {
        const tmp = document.createElement("canvas");
        tmp.width = f.bitmap.width;
        tmp.height = f.bitmap.height;
        const tctx = tmp.getContext("2d");
        tctx.translate(tmp.width, 0);
        tctx.scale(-1, 1);
        tctx.drawImage(f.bitmap, 0, 0);
        return { bitmap: await createImageBitmap(tmp), delay: f.delay };
      })
    );
    currentFrame = 0;
    renderCurrent();
    renderStrip();
  }

  saveFramesBtn.addEventListener("click", async () => {
    for (let i = 0; i < frames.length; i++) {
      const c = document.createElement("canvas");
      c.width = frames[i].bitmap.width;
      c.height = frames[i].bitmap.height;
      c.getContext("2d").drawImage(frames[i].bitmap, 0, 0);
      const link = document.createElement("a");
      link.href = c.toDataURL("image/png");
      link.download = `frame_${i + 1}.png`;
      link.click();
    }
  });

  // 🔹 Hintergrundbearbeitung
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substr(0, 2), 16),
      g: parseInt(h.substr(2, 2), 16),
      b: parseInt(h.substr(4, 2), 16)
    };
  }

  function colorDist(a, b) {
    return Math.sqrt(
      Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2)
    );
  }

  async function removeBackground(bitmap, keyColor, tolerance) {
    const c = document.createElement("canvas");
    c.width = bitmap.width;
    c.height = bitmap.height;
    const cx = c.getContext("2d");
    cx.drawImage(bitmap, 0, 0);
    const img = cx.getImageData(0, 0, c.width, c.height);
    const data = img.data;
    const key = hexToRgb(keyColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const dist = colorDist({ r, g, b }, key);
      if (dist < tolerance) data[i + 3] = 0;
    }
    cx.putImageData(img, 0, 0);
    return await createImageBitmap(c);
  }

  async function applyBackground(bitmap, bgColor, bgImg) {
    const c = document.createElement("canvas");
    c.width = bitmap.width;
    c.height = bitmap.height;
    const cx = c.getContext("2d");
    if (bgImg) {
      cx.drawImage(bgImg, 0, 0, c.width, c.height);
    } else {
      cx.fillStyle = bgColor;
      cx.fillRect(0, 0, c.width, c.height);
    }
    cx.drawImage(bitmap, 0, 0);
    return await createImageBitmap(c);
  }

  previewReplaceBtn.addEventListener("click", async () => {
    if (!frames.length) return alert("Erst ein GIF laden.");
    const key = keyColorInput.value;
    const tol = parseInt(tolInput.value);
    const bgCol = bgReplaceColor.value;

    let bgImg = null;
    if (bgImageInput.files[0]) {
      const file = bgImageInput.files[0];
      bgImg = await createImageBitmap(file);
    }

    const removed = await removeBackground(frames[currentFrame].bitmap, key, tol);
    const merged = await applyBackground(removed, bgCol, bgImg);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = merged.width;
    canvas.height = merged.height;
    ctx.drawImage(merged, 0, 0);
  });

  applyAllBtn.addEventListener("click", async () => {
    if (!frames.length) return alert("Erst zerlegen.");
    const key = keyColorInput.value;
    const tol = parseInt(tolInput.value);
    const bgCol = bgReplaceColor.value;

    let bgImg = null;
    if (bgImageInput.files[0]) {
      const file = bgImageInput.files[0];
      bgImg = await createImageBitmap(file);
    }

    frames = await Promise.all(
      frames.map(async f => {
        const removed = await removeBackground(f.bitmap, key, tol);
        const merged = await applyBackground(removed, bgCol, bgImg);
        return { bitmap: merged, delay: f.delay };
      })
    );
    currentFrame = 0;
    renderCurrent();
    renderStrip();
  });

  revertBtn.addEventListener("click", () => {
    if (!originalFrames) return;
    frames = originalFrames.map(f => ({ bitmap: f.bitmap, delay: f.delay }));
    currentFrame = 0;
    renderCurrent();
    renderStrip();
  });

  tolInput.addEventListener("input", () => (tolVal.textContent = tolInput.value));
});
