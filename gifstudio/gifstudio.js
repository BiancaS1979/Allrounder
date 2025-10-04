// Buttons
document.getElementById("loadGifBtn").addEventListener("click", handleGifUpload);

// globals
let frames = []; // raw frames from gifuct (keeps original metadata)
let frameCanvases = []; // DOM canvases in current order
let selectedIndex = -1;
let startIndex = 0, endIndex = -1; // trimming (inclusive). endIndex = -1 -> end
let markers = []; // {index,label}

const frameContainer = document.getElementById("frameContainer");
const selectedPreview = document.getElementById("selectedPreview");
const previewArea = document.getElementById("previewArea");
const previewSection = document.getElementById("previewSection");
const downloadGifBtn = document.getElementById("downloadGifBtn");
const speedRange = document.getElementById("speedRange");

// load & decompose GIF
async function handleGifUpload() {
  const file = document.getElementById("gifInput").files[0];
  if (!file) return alert("Bitte GIF wählen.");
  const buffer = await file.arrayBuffer();
  const gif = gifuct.parseGIF(buffer);
  frames = gifuct.decompressFrames(gif, true); // frames[i].dims, .patch
  buildFrameUI();
}

// build thumbnails & per-frame tools
function buildFrameUI() {
  frameContainer.innerHTML = "";
  frameCanvases = [];
  frames.forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "frame";
    // canvas
    const c = document.createElement("canvas");
    c.width = f.dims.width; c.height = f.dims.height;
    const ctx = c.getContext("2d");
    const imageData = ctx.createImageData(f.dims.width, f.dims.height);
    imageData.data.set(f.patch);
    ctx.putImageData(imageData, 0, 0);
    // click selects frame
    c.addEventListener("click", () => selectFrame(i));
    // tools
    const tools = document.createElement("div");
    tools.className = "tool-buttons";
    tools.innerHTML = `
      <button onclick="selectFrame(${i})">🔎</button>
      <button onclick="rotateFrame(${i},90)">↻</button>
      <button onclick="flipFrame(${i},'h')">↔</button>
      <button onclick="flipFrame(${i},'v')">↕</button>
      <button onclick="saveFrame(${i})">💾</button>
      <button onclick="deleteFrame(${i})">❌</button>
    `;
    div.appendChild(c);
    div.appendChild(tools);
    frameContainer.appendChild(div);
    frameCanvases.push(c);
  });

  // reset trim indexes
  startIndex = 0;
  endIndex = frameCanvases.length - 1;
  selectedIndex = -1;
  markers = [];
  renderMarkerList();
  enableFrameSorting();
}

// selection
function selectFrame(i) {
  selectedIndex = i;
  // draw to small preview canvas (scale)
  const c = frameCanvases[i];
  const sp = selectedPreview;
  sp.width = Math.min(320, c.width);
  sp.height = Math.min(240, c.height);
  const sctx = sp.getContext("2d");
  sctx.clearRect(0,0,sp.width,sp.height);
  // draw scaled maintaining aspect
  const ratio = Math.min(sp.width / c.width, sp.height / c.height);
  const dw = c.width * ratio, dh = c.height * ratio;
  sctx.drawImage(c, 0, 0, c.width, c.height, (sp.width-dw)/2, (sp.height-dh)/2, dw, dh);

  // show set start/end quick hints
  document.getElementById("setStartBtn").onclick = () => { startIndex = selectedIndex; alert("Start gesetzt: " + startIndex); }
  document.getElementById("setEndBtn").onclick = () => { endIndex = selectedIndex; alert("Ende gesetzt: " + endIndex); }
  document.getElementById("rotateBtn").onclick = () => { rotateFrame(selectedIndex,90); selectFrame(selectedIndex); }
  document.getElementById("flipHBtn").onclick = () => { flipFrame(selectedIndex,'h'); selectFrame(selectedIndex); }
  document.getElementById("flipVBtn").onclick = () => { flipFrame(selectedIndex,'v'); selectFrame(selectedIndex); }
  document.getElementById("saveFrameBtn").onclick = () => saveFrame(selectedIndex);
  document.getElementById("delFrameBtn").onclick = () => { deleteFrame(selectedIndex); selectedIndex = -1; }
}

// frame operations
function rotateFrame(i,deg){
  const c = frameCanvases[i];
  const tmp = document.createElement("canvas");
  tmp.width = c.width; tmp.height = c.height;
  tmp.getContext("2d").drawImage(c,0,0);
  const angle = (deg * Math.PI)/180;
  // swap dims
  c.width = tmp.height; c.height = tmp.width;
  const ctx = c.getContext("2d");
  ctx.save();
  ctx.translate(c.width/2, c.height/2);
  ctx.rotate(angle);
  ctx.drawImage(tmp, -tmp.width/2, -tmp.height/2);
  ctx.restore();
}
function flipFrame(i,dir){
  const c = frameCanvases[i];
  const tmp = document.createElement("canvas");
  tmp.width = c.width; tmp.height = c.height;
  tmp.getContext("2d").drawImage(c,0,0);
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  ctx.save();
  if(dir==='h'){ ctx.scale(-1,1); ctx.drawImage(tmp,-c.width,0); }
  else { ctx.scale(1,-1); ctx.drawImage(tmp,0,-c.height); }
  ctx.restore();
}
function saveFrame(i){
  const c = frameCanvases[i];
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `frame_${i+1}.png`;
  a.click();
}
function deleteFrame(i){
  const nodes = Array.from(document.querySelectorAll(".frame"));
  if(!nodes[i]) return;
  nodes[i].remove();
  // remove from canvases array
  frameCanvases.splice(i,1);
  frames.splice(i,1);
  // rebuild indexes by re-binding click handlers
  rebuildCanvasBindings();
  // adjust trim indexes
  if(endIndex >= frameCanvases.length) endIndex = frameCanvases.length-1;
  if(startIndex >= frameCanvases.length) startIndex = 0;
  renderMarkerList();
}

// rebuild binding after reorder/delete
function rebuildCanvasBindings(){
  const canv = document.querySelectorAll(".frame canvas");
  frameCanvases = Array.from(canv);
  frameCanvases.forEach((c, idx) => {
    c.onclick = () => selectFrame(idx);
  });
}

// Sortable (drag & drop)
function enableFrameSorting(){
  Sortable.create(frameContainer, {
    animation:150,
    ghostClass:'dragging',
    onEnd: function(evt){
      // reorder frameCanvases array to match DOM
      rebuildCanvasBindings();
      // update markers to refer to new order: (simpler approach) clear markers
      markers = markers.map(m => ({...m, index: Math.max(0, Math.min(frameCanvases.length-1, m.index))}));
      renderMarkerList();
    }
  });
}

// Trim helpers
function resetTrim(){
  startIndex = 0;
  endIndex = frameCanvases.length - 1;
  alert("Trim zurückgesetzt");
}

// markers
document.getElementById("addMarkerBtn").addEventListener("click", ()=>{
  const label = document.getElementById("markerLabel").value.trim() || ("Marker " + (markers.length+1));
  if(selectedIndex < 0){ alert("Wähle erst ein Frame aus"); return; }
  markers.push({index:selectedIndex, label});
  renderMarkerList();
});
function renderMarkerList(){
  const ul = document.getElementById("markerList");
  ul.innerHTML = "";
  markers.forEach((m,i)=>{
    const li = document.createElement("li");
    li.textContent = `#${i+1} - Frame ${m.index} : ${m.label}`;
    const jump = document.createElement("button"); jump.textContent = "▶"; jump.onclick = ()=> { selectFrame(m.index); };
    const del = document.createElement("button"); del.textContent = "✖"; del.onclick = ()=> { markers.splice(i,1); renderMarkerList(); };
    li.appendChild(jump); li.appendChild(del);
    ul.appendChild(li);
  });
}

// generate GIF using current frame order and trim range
function generateGif(){
  const canvases = Array.from(document.querySelectorAll(".frame canvas"));
  if(canvases.length === 0) return alert("Keine Frames vorhanden!");
  const s = Math.max(0, Math.min(startIndex, canvases.length-1));
  const e = (endIndex === -1) ? canvases.length-1 : Math.max(0, Math.min(endIndex, canvases.length-1));
  if(s > e) return alert("Ungültiger Trim: Start > Ende");
  const gif = new GIF({workers:2, quality:10, width: canvases[0].width, height: canvases[0].height});
  for(let i=s;i<=e;i++){
    gif.addFrame(canvases[i], {delay: 100});
  }
  gif.on("finished", blob => {
    const url = URL.createObjectURL(blob);
    previewArea.innerHTML = "";
    const img = document.createElement("img"); img.src = url;
    previewArea.appendChild(img);
    previewSection.style.display = "block";
    downloadGifBtn.style.display = "inline-block";
    downloadGifBtn.onclick = ()=> {
      const a = document.createElement("a"); a.href = url; a.download = "trimmed.gif"; a.click();
    };
  });
  gif.render();
}

// play preview only range
let playInterval = null, playing=false, currentFrame=0;
function playPreview(){
  const canvases = Array.from(document.querySelectorAll(".frame canvas"));
  if(canvases.length===0) return alert("Keine Frames geladen!");
  const s = Math.max(0, Math.min(startIndex, canvases.length-1));
  const e = (endIndex===-1) ? canvases.length-1 : Math.max(0, Math.min(endIndex, canvases.length-1));
  if(s>e) return alert("Ungültiger Trim (s>e)");
  const previewImg = document.createElement("img");
  previewArea.innerHTML = ""; previewArea.appendChild(previewImg); previewSection.style.display = "block";

  if(playing){ clearInterval(playInterval); playing=false; return; }
  playing=true; currentFrame=s;
  const delay = parseInt(speedRange.value,10) || 120;
  playInterval = setInterval(()=>{
    const idx = currentFrame;
    previewImg.src = canvases[idx].toDataURL();
    currentFrame++; if(currentFrame>e) currentFrame=s;
  }, delay);
}

// frame-level save/delete handlers attached above already (saveFrame/deleteFrame)

// small utility: rotateAll/flipAll on all canvases
function rotateAll(deg){ document.querySelectorAll(".frame canvas").forEach((_,i) => rotateFrame(i,deg)); }
function flipAll(dir){ document.querySelectorAll(".frame canvas").forEach((_,i) => flipFrame(i,dir)); }

// expose some functions to global scope (buttons inline rely on them)
window.rotateFrame = rotateFrame;
window.flipFrame = flipFrame;
window.saveFrame = saveFrame;
window.deleteFrame = deleteFrame;
window.rotateAll = rotateAll;
window.flipAll = flipAll;
window.generateGif = generateGif;
window.playPreview = playPreview;
window.resetTrim = resetTrim;
