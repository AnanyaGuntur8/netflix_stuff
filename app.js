(() => {
  const FRAME_COUNT = 31;
  const animationFrames = Array.from(
    { length: FRAME_COUNT },
    (_, i) => `animation/${i + 1}.png`
  );

  const sample = [
    'https://picsum.photos/1200/700?random=1',
    'https://picsum.photos/1200/700?random=2',
    'https://picsum.photos/1200/700?random=3',
    'https://picsum.photos/1200/700?random=4',
    'https://picsum.photos/1200/700?random=5'
  ];

  const poster = document.getElementById('poster');
  const poster2 = document.getElementById('poster2');
  const heroBg = document.getElementById('heroBg');
  const heroPlay = document.getElementById('heroPlay');
  const episode1 = document.getElementById('episode1');
  const showCard = document.getElementById('showCard');
  const playerModal = document.getElementById('playerModal');
  const playerEl = playerModal.querySelector('.player');
  const slideContainer = document.getElementById('slideContainer');
  const playPause = document.getElementById('playPause');
  const closeBtn = document.getElementById('closeBtn');
  const progress = document.getElementById('progress');
  const progressHandle = document.getElementById('progressHandle');
  const progressBar = document.getElementById('progressBar');
  const speedSelect = document.getElementById('speedSelect');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeTotal = document.getElementById('timeTotal');
  const rewindBtn = document.getElementById('rewindBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const fileInput = document.getElementById('fileInput');
  const pasteUrlsBtn = document.getElementById('pasteUrlsBtn');
  const navbar = document.querySelector('.navbar');
  const iconPlay = playPause.querySelector('.icon-play');
  const iconPause = playPause.querySelector('.icon-pause');

  let imageList = sample.slice();
  let preloaded = [];
  let canvas = null;
  let ctx = null;
  let frameStage = null;
  let stageW = 0;
  let stageH = 0;
  let idx = 0;
  let playing = false;
  let rafId = null;
  let lastFrameTime = 0;
  let uiTimer = null;

  function setPoster(url) {
    poster.style.backgroundImage = `url(${url})`;
    poster2.style.backgroundImage = `url(${url})`;
    heroBg.style.backgroundImage = `url(${url})`;
  }

  function frameDelay() {
    return Number(speedSelect.value) || 2000;
  }

  function formatTime(ms) {
    const secs = Math.floor(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function totalDuration() {
    return preloaded.length * frameDelay();
  }

  async function preloadImages(sources) {
    const images = await Promise.all(
      sources.map(async (src) => {
        const img = new Image();
        img.src = src;
        img.decoding = 'async';
        await img.decode();
        return img;
      })
    );
    return images;
  }

  function computeStageSize(images) {
    let maxW = 0;
    let maxH = 0;
    for (const img of images) {
      maxW = Math.max(maxW, img.naturalWidth);
      maxH = Math.max(maxH, img.naturalHeight);
    }
    const maxViewW = window.innerWidth * 0.9;
    const maxViewH = window.innerHeight * 0.78;
    const scale = Math.min(maxViewW / maxW, maxViewH / maxH);
    return {
      width: Math.round(maxW * scale),
      height: Math.round(maxH * scale)
    };
  }

  function ensureCanvas() {
    if (canvas) return;
    slideContainer.innerHTML = '';
    frameStage = document.createElement('div');
    frameStage.className = 'frame-stage';
    canvas = document.createElement('canvas');
    canvas.className = 'frame-canvas';
    frameStage.appendChild(canvas);
    slideContainer.appendChild(frameStage);
    ctx = canvas.getContext('2d', { alpha: false });
  }

  function resizeCanvas() {
    if (!canvas || !preloaded.length) return;
    const { width, height } = computeStageSize(preloaded);
    const dpr = window.devicePixelRatio || 1;
    stageW = width;
    stageH = height;
    frameStage.style.width = `${width}px`;
    frameStage.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function drawFrame(i) {
    if (!ctx || !preloaded[i]) return;
    const img = preloaded[i];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, stageW, stageH);
    const scale = Math.min(stageW / img.naturalWidth, stageH / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (stageW - dw) / 2;
    const dy = (stageH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function updateProgress(frameFraction = 0) {
    if (!preloaded.length) return;
    const pct = ((idx + frameFraction) / preloaded.length) * 100;
    progress.style.width = `${pct}%`;
    progressHandle.style.left = `${pct}%`;
  }

  function updateTimeDisplay(frameFraction = 0) {
    timeCurrent.textContent = formatTime((idx + frameFraction) * frameDelay());
    timeTotal.textContent = formatTime(totalDuration());
  }

  function showFrame(i, frameFraction = 0) {
    if (!preloaded.length) return;
    idx = i;
    ensureCanvas();
    if (!stageW) resizeCanvas();
    drawFrame(idx);
    updateProgress(frameFraction);
    updateTimeDisplay(frameFraction);
  }

  async function buildPlayer() {
    slideContainer.innerHTML = '<div class="loading">Loading…</div>';
    try {
      preloaded = await preloadImages(imageList);
    } catch {
      preloaded = [];
    }
    if (!preloaded.length) {
      slideContainer.innerHTML = '<div class="loading">Could not load episode.</div>';
      return false;
    }
    canvas = null;
    ctx = null;
    frameStage = null;
    stageW = 0;
    stageH = 0;
    showFrame(0);
    return true;
  }

  function setPlayIcon(isPlaying) {
    iconPlay.classList.toggle('hidden', isPlaying);
    iconPause.classList.toggle('hidden', !isPlaying);
  }

  function showUI() {
    playerEl.classList.add('show-ui', 'show-cursor');
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => {
      if (playing) playerEl.classList.remove('show-ui', 'show-cursor');
    }, 3000);
  }

  async function enterFullscreen() {
    try {
      const el = playerModal;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch { /* unsupported */ }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
  }

  async function showPlayer() {
    playerModal.classList.remove('hidden');
    playerModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('player-open');

    const ready = await buildPlayer();
    if (!ready) return;

    await enterFullscreen();
    showUI();
    playing = true;
    setPlayIcon(true);
    lastFrameTime = 0;
    startLoop();
  }

  function hidePlayer() {
    stopLoop();
    exitFullscreen();
    playerModal.classList.add('hidden');
    playerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('player-open');
    playerEl.classList.remove('show-ui', 'show-cursor');
  }

  function nextFrame() {
    if (!preloaded.length) return;
    showFrame((idx + 1) % preloaded.length);
  }

  function prevFrame() {
    if (!preloaded.length) return;
    showFrame(idx > 0 ? idx - 1 : preloaded.length - 1);
  }

  function playbackLoop(timestamp) {
    if (!playing) return;
    if (!lastFrameTime) lastFrameTime = timestamp;

    const delay = frameDelay();
    let elapsed = timestamp - lastFrameTime;

    while (elapsed >= delay) {
      lastFrameTime += delay;
      elapsed -= delay;
      idx = (idx + 1) % preloaded.length;
      drawFrame(idx);
    }

    const frameFraction = elapsed / delay;
    updateProgress(frameFraction);
    updateTimeDisplay(frameFraction);
    rafId = requestAnimationFrame(playbackLoop);
  }

  function startLoop() {
    stopLoop();
    playing = true;
    setPlayIcon(true);
    lastFrameTime = 0;
    rafId = requestAnimationFrame(playbackLoop);
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    playing = false;
    setPlayIcon(false);
    playerEl.classList.add('show-ui', 'show-cursor');
    updateProgress(0);
    updateTimeDisplay(0);
  }

  function togglePlay() {
    if (playing) stopLoop();
    else startLoop();
    showUI();
  }

  function probeImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function initImages() {
    if (await probeImage(animationFrames[0])) {
      imageList = animationFrames.slice();
      speedSelect.value = '2000';
    }
    setPoster(imageList[0]);
  }

  initImages();

  window.addEventListener('resize', () => {
    if (playerModal.classList.contains('hidden') || !preloaded.length) return;
    resizeCanvas();
    drawFrame(idx);
  });

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  heroPlay.addEventListener('click', () => showPlayer());
  episode1.addEventListener('click', (e) => { e.stopPropagation(); showPlayer(); });
  showCard.addEventListener('click', () => showPlayer());

  closeBtn.addEventListener('click', hidePlayer);
  playPause.addEventListener('click', togglePlay);
  rewindBtn.addEventListener('click', () => { prevFrame(); lastFrameTime = 0; showUI(); });
  forwardBtn.addEventListener('click', () => { nextFrame(); lastFrameTime = 0; showUI(); });

  speedSelect.addEventListener('change', () => {
    lastFrameTime = 0;
    updateTimeDisplay(0);
  });

  playerEl.addEventListener('mousemove', showUI);
  playerEl.addEventListener('click', (e) => {
    if (e.target.closest('.player-controls, .player-top')) return;
    togglePlay();
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    imageList = files.map(f => URL.createObjectURL(f));
    setPoster(imageList[0]);
    showPlayer();
  });

  pasteUrlsBtn.addEventListener('click', () => {
    const tpl = document.getElementById('urlPromptTpl');
    const frag = tpl.content.cloneNode(true);
    const prompt = frag.querySelector('.url-prompt');
    document.body.appendChild(prompt);
    const addBtn = prompt.querySelector('#addUrls');
    const cancelBtn = prompt.querySelector('#cancelUrls');
    const textarea = prompt.querySelector('#urls');

    addBtn.addEventListener('click', () => {
      const lines = textarea.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (lines.length) {
        imageList = lines.slice();
        setPoster(imageList[0]);
        document.body.removeChild(prompt);
        showPlayer();
      }
    });
    cancelBtn.addEventListener('click', () => document.body.removeChild(prompt));
  });

  document.addEventListener('keydown', (e) => {
    if (playerModal.classList.contains('hidden')) return;
    if (e.key === 'Escape') hidePlayer();
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    }
    if (e.key === 'ArrowRight') { nextFrame(); lastFrameTime = 0; showUI(); }
    if (e.key === 'ArrowLeft') { prevFrame(); lastFrameTime = 0; showUI(); }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !playerModal.classList.contains('hidden')) {
      hidePlayer();
    }
  });

  progressBar.addEventListener('click', (e) => {
    if (!preloaded.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newIdx = Math.min(preloaded.length - 1, Math.floor(pct * preloaded.length));
    showFrame(newIdx);
    lastFrameTime = performance.now();
    showUI();
  });

  window._photoShow = { setPoster, showPlayer, imageList };

})();
