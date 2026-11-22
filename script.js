(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. Web Audio API Vintage Sound Engine (Vinyl Crackle, Typewriter, Wax Seal)
     ========================================================================== */
  let audioCtx = null;
  let crackleInterval = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playWaxSealOpenSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [293.66, 440.0, 587.33].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.05, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.15);
    });
  }

  function playTypewriterClick(isBell = false) {
    const soundCheck = document.getElementById('typewriter-sound-checkbox');
    if (soundCheck && !soundCheck.checked) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (isBell) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.5, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
      return;
    }

    const bufferSize = ctx.sampleRate * 0.025;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.004));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 450, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  function triggerVinylPop() {
    const crackleCheck = document.getElementById('vinyl-crackle-checkbox');
    if (!crackleCheck || !crackleCheck.checked) return;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.012);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.002));
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2100 + Math.random() * 900, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.015 + Math.random() * 0.02, now);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  function startVinylCrackleLoop() {
    stopVinylCrackleLoop();
    crackleInterval = window.setInterval(() => {
      if (Math.random() < 0.65) {
        triggerVinylPop();
      }
    }, 180);
  }

  function stopVinylCrackleLoop() {
    if (crackleInterval) {
      clearInterval(crackleInterval);
      crackleInterval = null;
    }
  }

  /* ==========================================================================
     2. Living Sky, Drifting Clouds & Star Constellation Canvas (#sky-canvas)
     ========================================================================== */
  const skyCanvas = document.getElementById('sky-canvas');
  const skyCtx = skyCanvas ? skyCanvas.getContext('2d') : null;
  let skyWidth = window.innerWidth;
  let skyHeight = window.innerHeight;
  let showConstellation = false;
  let currentSkyMood = 'sunset';

  const clouds = [];
  const stars = [];
  const interactiveStars = [];

  const skyWhispers = [
    '«كل غيمة بتعدي في السما بتفكرني بضحكتك وهدوء روحك يا مريم.» (سيف)',
    '«ياما عيون شاغلوني.. لكن ولا شغلوني.. إلّا عيونك إنتِ يا مريم.»',
    '«لو كانت السما كتاب، كان اسمك يا مريم هو العنوان الوحيد لكل صفحاته.»',
    '«بحبك قد المسافة بين الأرض وأعلى غيمة في السما.. وأكتر بكتير.»',
    '«معاكِ عرفت ليه أم كلثوم قالت: لقيتني بحب وأدوب في الحب وصبح وليل على بابه.»',
    '«أنتِ قهوتي الدافية في يوم شتا غائم، وأنتِ الوردة اللي مبتدبلش أبداً.»',
    '«يوم ما اعترفنا لبعض، حسيت إن السما كلها نورت عشاننا يا مريم.»',
    '«عيونكِ هي الوطن القديم اللي كنت بدور عليه في كل الكتب والروايات.»'
  ];
  let whisperIdx = 0;

  function initSkyEntities() {
    if (!skyCanvas) return;
    skyWidth = skyCanvas.width = window.innerWidth;
    skyHeight = skyCanvas.height = window.innerHeight;

    stars.length = 0;
    const starCount = Math.min(85, Math.floor((skyWidth * skyHeight) / 14000));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * skyWidth,
        y: Math.random() * (skyHeight * 0.75),
        r: 0.7 + Math.random() * 1.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.025
      });
    }

    clouds.length = 0;
    const cloudCount = skyWidth < 640 ? 5 : 8;
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: (i / cloudCount) * skyWidth + (Math.random() * 100 - 50),
        y: 65 + Math.random() * (skyHeight * 0.55),
        scale: (skyWidth < 640 ? 0.55 : 0.75) + Math.random() * 0.75,
        speed: 0.12 + Math.random() * 0.2,
        alpha: 0.11 + Math.random() * 0.13
      });
    }
  }

  function drawSoftCloud(ctx, cloud) {
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);

    let tint = '246, 224, 205';
    if (currentSkyMood === 'dawn') tint = '240, 246, 255';
    if (currentSkyMood === 'night') tint = '210, 198, 224';

    const grad = ctx.createRadialGradient(0, 0, 15, 0, 10, 165);
    grad.addColorStop(0, `rgba(${tint}, ${cloud.alpha * 1.45})`);
    grad.addColorStop(0.55, `rgba(${tint}, ${cloud.alpha * 0.75})`);
    grad.addColorStop(1, `rgba(${tint}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.arc(65, 12, 75, 0, Math.PI * 2);
    ctx.arc(-65, 16, 70, 0, Math.PI * 2);
    ctx.arc(115, 24, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawConstellation(ctx) {
    if (!showConstellation) return;
    const cx = skyWidth * 0.5;
    const cy = Math.min(195, skyHeight * 0.25);

    const pts = [
      { x: cx, y: cy + 34 },
      { x: cx - 42, y: cy + 4 },
      { x: cx - 60, y: cy - 30 },
      { x: cx - 34, y: cy - 54 },
      { x: cx, y: cy - 30 },
      { x: cx + 34, y: cy - 54 },
      { x: cx + 60, y: cy - 30 },
      { x: cx + 42, y: cy + 4 },
      { x: cx, y: cy + 34 }
    ];

    ctx.save();
    ctx.strokeStyle = 'rgba(229, 190, 122, 0.6)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    pts.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    pts.forEach((p) => {
      ctx.fillStyle = '#f9e6c7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      ctx.fill();

      const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 14);
      glow.addColorStop(0, 'rgba(229, 190, 122, 0.7)');
      glow.addColorStop(1, 'rgba(229, 190, 122, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.font = 'bold 21px "Aref Ruqaa", "Amiri", serif';
    ctx.fillStyle = '#f6ecdc';
    ctx.textAlign = 'center';
    ctx.fillText('مريم ♥ سيف', cx, cy - 8);
    ctx.restore();
  }

  function renderSkyFrame() {
    if (!skyCtx) return;
    skyCtx.clearRect(0, 0, skyWidth, skyHeight);

    const starVisibility = currentSkyMood === 'dawn' ? 0.45 : 0.9;
    stars.forEach((s) => {
      s.phase += s.speed;
      const alpha = (0.3 + 0.7 * Math.abs(Math.sin(s.phase))) * starVisibility;
      skyCtx.fillStyle = `rgba(249, 234, 208, ${alpha.toFixed(2)})`;
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      skyCtx.fill();
    });

    drawConstellation(skyCtx);

    clouds.forEach((c) => {
      if (!prefersReducedMotion) {
        c.x += c.speed;
        if (c.x - 220 > skyWidth) {
          c.x = -220;
        }
      }
      drawSoftCloud(skyCtx, c);
    });

    for (let i = interactiveStars.length - 1; i >= 0; i--) {
      const item = interactiveStars[i];
      item.life -= 0.016;
      if (item.life <= 0) {
        interactiveStars.splice(i, 1);
        continue;
      }
      skyCtx.save();
      skyCtx.fillStyle = `rgba(229, 190, 122, ${item.life})`;
      skyCtx.beginPath();
      skyCtx.arc(item.x, item.y, (1 - item.life) * 28 + 3, 0, Math.PI * 2);
      skyCtx.strokeStyle = `rgba(246, 236, 220, ${item.life})`;
      skyCtx.lineWidth = 1.4;
      skyCtx.stroke();
      skyCtx.restore();
    }

    if (!prefersReducedMotion && !document.hidden) {
      requestAnimationFrame(renderSkyFrame);
    }
  }

  initSkyEntities();
  renderSkyFrame();

  window.addEventListener('resize', () => {
    initSkyEntities();
    if (prefersReducedMotion) renderSkyFrame();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !prefersReducedMotion) {
      requestAnimationFrame(renderSkyFrame);
    }
  });

  // Sky Mood Switcher
  document.querySelectorAll('.mood-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.mood-chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      currentSkyMood = chip.dataset.mood || 'sunset';
      document.documentElement.setAttribute('data-sky-mood', currentSkyMood);
      if (prefersReducedMotion) renderSkyFrame();
    });
  });

  // Constellation Button
  const constellationBtn = document.getElementById('toggle-constellation-btn');
  if (constellationBtn) {
    constellationBtn.addEventListener('click', () => {
      showConstellation = !showConstellation;
      constellationBtn.classList.toggle('is-active', showConstellation);
      const whisperText = document.getElementById('sky-whisper-text');
      if (whisperText && showConstellation) {
        whisperText.textContent = '✨ ارتسمت نجوم «مريم ♥ سيف» الآن في قلب السماء وبين الغيوم ✨';
      }
      if (prefersReducedMotion) renderSkyFrame();
    });
  }

  // Click or Tap anywhere in Hero Sky to spawn a star ripple & cycle romantic whispers
  const heroClickZone = document.getElementById('sky-observatory');
  if (heroClickZone) {
    heroClickZone.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      interactiveStars.push({ x: e.clientX, y: e.clientY, life: 1 });
      whisperIdx = (whisperIdx + 1) % skyWhispers.length;
      const whisperText = document.getElementById('sky-whisper-text');
      if (whisperText) {
        whisperText.textContent = skyWhispers[whisperIdx];
      }
      if (prefersReducedMotion) renderSkyFrame();
    });
  }

  /* ==========================================================================
     3. Damascus Rose Petals Canvas (#petals-canvas)
     ========================================================================== */
  const petalsCanvas = document.getElementById('petals-canvas');
  const petalsCtx = petalsCanvas ? petalsCanvas.getContext('2d') : null;
  const activePetals = [];
  let petalsAnimating = false;

  function resizePetalsCanvas() {
    if (!petalsCanvas) return;
    petalsCanvas.width = window.innerWidth;
    petalsCanvas.height = window.innerHeight;
  }
  resizePetalsCanvas();
  window.addEventListener('resize', resizePetalsCanvas);

  function spawnRosePetals(count = 24) {
    if (!petalsCanvas || prefersReducedMotion) return;
    const colors = ['#8b1e2b', '#a82838', '#c44554', '#5e1019', '#d98a6c'];
    const actualCount = window.innerWidth < 640 ? Math.min(count, 20) : count;
    for (let i = 0; i < actualCount; i++) {
      activePetals.push({
        x: Math.random() * petalsCanvas.width,
        y: -20 - Math.random() * 140,
        size: 8 + Math.random() * 9,
        vy: 1.3 + Math.random() * 1.9,
        vx: -0.8 + Math.random() * 1.6,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (!petalsAnimating) {
      petalsAnimating = true;
      requestAnimationFrame(animatePetals);
    }
  }

  function animatePetals() {
    if (!petalsCtx || !petalsCanvas) return;
    petalsCtx.clearRect(0, 0, petalsCanvas.width, petalsCanvas.height);

    for (let i = activePetals.length - 1; i >= 0; i--) {
      const p = activePetals[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.y * 0.02) * 0.5;
      p.angle += p.spin;

      petalsCtx.save();
      petalsCtx.translate(p.x, p.y);
      petalsCtx.rotate(p.angle);
      petalsCtx.fillStyle = p.color;
      petalsCtx.beginPath();
      petalsCtx.moveTo(0, -p.size);
      petalsCtx.bezierCurveTo(p.size, -p.size * 0.6, p.size * 0.9, p.size * 0.8, 0, p.size);
      petalsCtx.bezierCurveTo(-p.size * 0.9, p.size * 0.8, -p.size, -p.size * 0.6, 0, -p.size);
      petalsCtx.fill();
      petalsCtx.restore();

      if (p.y > petalsCanvas.height + 30) {
        activePetals.splice(i, 1);
      }
    }

    if (activePetals.length > 0 && !document.hidden) {
      requestAnimationFrame(animatePetals);
    } else {
      petalsAnimating = false;
      petalsCtx.clearRect(0, 0, petalsCanvas.width, petalsCanvas.height);
    }
  }

  const heroPetalBtn = document.getElementById('hero-petal-shower-btn');
  if (heroPetalBtn) {
    heroPetalBtn.addEventListener('click', () => spawnRosePetals(30));
  }

  /* ==========================================================================
     4. 1964 Sono Cairo Gramophone & "إلّا عيونك إنتَ" Mobile-Safe Audio Controller
     ========================================================================== */
  const audioEl = document.getElementById('seret-audio');
  const vinylDisc = document.getElementById('vinyl-disc');
  const tonearmSvg = document.getElementById('tonearm-svg');
  const mainPlayBtn = document.getElementById('main-turntable-play-btn');
  const playLabel = document.getElementById('turntable-play-label');
  const headerAudioBtn = document.getElementById('header-audio-toggle');
  const headerAudioLabel = document.getElementById('header-audio-label');
  const seekSlider = document.getElementById('audio-seek-slider');
  const timeReadout = document.getElementById('audio-time-readout');
  const lyricLines = Array.from(document.querySelectorAll('.lyric-line'));
  const cueButtons = Array.from(document.querySelectorAll('.cue-btn'));
  let celebratedVerse = false;
  let pendingSeekTime = 137;

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  function updateTurntableUI(isPlaying) {
    if (vinylDisc) vinylDisc.classList.toggle('is-spinning', isPlaying);
    if (tonearmSvg) tonearmSvg.classList.toggle('is-engaged', isPlaying);
    if (playLabel) playLabel.textContent = isPlaying ? 'إيقاف مؤقت' : 'تشغيل';
    if (headerAudioBtn) headerAudioBtn.classList.toggle('is-playing', isPlaying);
    if (headerAudioLabel) {
      headerAudioLabel.textContent = isPlaying ? 'إيقاف «إلّا عيونك إنتَ»' : 'تشغيل «إلّا عيونك إنتَ»';
    }
    if (isPlaying) {
      startVinylCrackleLoop();
    } else {
      stopVinylCrackleLoop();
    }
  }

  function applySafeSeek(targetSeconds) {
    if (!audioEl) return;
    pendingSeekTime = targetSeconds;
    if (audioEl.readyState >= 1) {
      try {
        audioEl.currentTime = targetSeconds;
        pendingSeekTime = null;
      } catch (_) {}
    }
  }

  function seekAndPlay(targetSeconds) {
    if (!audioEl) return;
    getAudioContext();
    applySafeSeek(targetSeconds);
    audioEl.play().then(() => {
      if (pendingSeekTime !== null) {
        try {
          audioEl.currentTime = pendingSeekTime;
          pendingSeekTime = null;
        } catch (_) {}
      }
      updateTurntableUI(true);
    }).catch(() => {});
  }

  function toggleAudioPlayback() {
    if (!audioEl) return;
    getAudioContext();
    if (audioEl.paused) {
      if (audioEl.currentTime < 1 && pendingSeekTime !== null) {
        applySafeSeek(pendingSeekTime);
      }
      audioEl.play().then(() => {
        if (pendingSeekTime !== null) {
          try {
            audioEl.currentTime = pendingSeekTime;
            pendingSeekTime = null;
          } catch (_) {}
        }
        updateTurntableUI(true);
      }).catch(() => {});
    } else {
      audioEl.pause();
      updateTurntableUI(false);
    }
  }

  if (audioEl) {
    const handleMetadataReady = () => {
      if (seekSlider && audioEl.duration) {
        seekSlider.max = Math.floor(audioEl.duration);
      }
      if (pendingSeekTime !== null) {
        try {
          audioEl.currentTime = pendingSeekTime;
          pendingSeekTime = null;
        } catch (_) {}
      }
    };

    audioEl.addEventListener('loadedmetadata', handleMetadataReady);
    audioEl.addEventListener('canplay', handleMetadataReady);

    audioEl.addEventListener('timeupdate', () => {
      const cur = audioEl.currentTime;
      const dur = audioEl.duration || 180;
      if (seekSlider) seekSlider.value = cur;
      if (timeReadout) timeReadout.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

      lyricLines.forEach((line) => {
        const start = parseFloat(line.dataset.start || '0');
        const end = parseFloat(line.dataset.end || '999');
        const active = cur >= start && cur < end;
        line.classList.toggle('is-active-line', active);
      });

      if (cur >= 152 && cur <= 155 && !celebratedVerse) {
        celebratedVerse = true;
        spawnRosePetals(24);
      }
      if (cur < 150 || cur > 165) {
        celebratedVerse = false;
      }
    });

    audioEl.addEventListener('ended', () => {
      updateTurntableUI(false);
    });
  }

  if (mainPlayBtn) mainPlayBtn.addEventListener('click', toggleAudioPlayback);
  if (headerAudioBtn) headerAudioBtn.addEventListener('click', toggleAudioPlayback);

  const heroPlayVerseBtn = document.getElementById('hero-play-verse-btn');
  if (heroPlayVerseBtn) {
    heroPlayVerseBtn.addEventListener('click', () => {
      const gramophoneSection = document.getElementById('seret-el-hob');
      if (gramophoneSection) gramophoneSection.scrollIntoView({ behavior: 'smooth' });
      seekAndPlay(137);
    });
  }

  if (seekSlider && audioEl) {
    seekSlider.addEventListener('input', () => {
      pendingSeekTime = null;
      audioEl.currentTime = parseFloat(seekSlider.value);
    });
  }

  cueButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      cueButtons.forEach((b) => b.classList.remove('is-active-cue'));
      btn.classList.add('is-active-cue');
      const target = parseFloat(btn.dataset.seek || '137');
      seekAndPlay(target);
    });
  });

  lyricLines.forEach((line) => {
    line.addEventListener('click', () => {
      const target = parseFloat(line.dataset.start || '0');
      seekAndPlay(target);
    });
  });

  const customAudioInput = document.getElementById('custom-audio-input');
  if (customAudioInput && audioEl) {
    customAudioInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      pendingSeekTime = 0;
      audioEl.src = url;
      audioEl.currentTime = 0;
      audioEl.play().then(() => updateTurntableUI(true)).catch(() => {});
    });
  }

  /* ==========================================================================
     5. Wax-Sealed Envelope Opening Ceremony (#envelope-overlay)
     ========================================================================== */
  const envelopeOverlay = document.getElementById('envelope-overlay');
  const openWaxSealBtn = document.getElementById('open-wax-seal-btn');
  const reopenEnvelopeBtn = document.getElementById('reopen-envelope-btn');

  if (openWaxSealBtn && envelopeOverlay) {
    openWaxSealBtn.addEventListener('click', () => {
      playWaxSealOpenSound();
      envelopeOverlay.classList.add('is-cracking');
      spawnRosePetals(28);

      // Start Umm Kulthum at "ياما عيون شاغلوني.. إلا عيونك إنتَ" (02:17 = 137s)
      seekAndPlay(137);

      setTimeout(() => {
        envelopeOverlay.classList.add('is-opened');
        envelopeOverlay.classList.remove('is-cracking');
      }, 420);
    });
  }

  if (reopenEnvelopeBtn && envelopeOverlay) {
    reopenEnvelopeBtn.addEventListener('click', () => {
      envelopeOverlay.classList.remove('is-opened');
    });
  }

  /* ==========================================================================
     6. The Open Leather-Bound Novel ("مخطوطة سيف ومريم" - 5+ Chapters & Touch Swipe)
     ========================================================================== */
  const defaultChapters = [
    {
      badge: 'الفصل الأول',
      title: 'صدفةٌ أجمل من كل المواعيد',
      rightBody:
        'قبل أن أتعرف عليكِ يا مريم، كانت الأيام تمر عاديةً مثل صفحات كتابٍ بلا عنوان. وحين ظهرتِ، تغيّر لون السماء، وصار لكل تفصيلةٍ صغيرة معنىً مختلف، كأن عمري كله كان تمهيداً للحظة التي ألتقي فيها بكِ.',
      motif: 'السماء والغيوم',
      leftBody:
        'حين اعترفنا لبعضنا بالحب، شعرتُ أن الدنيا كلها هدأت فجأة، ولم يبقَ فيها سوى صوت ضحكتكِ ودفء كلامكِ. أحببتكِ لا كعادةٍ عابرة، بل كحقيقةٍ وحيدة يطمئن لها قلبي كل يوم أكثر من اليوم الذي قبله.',
      quote: '«أنتِ القصيدة التي لم يكتبها شاعرٌ بعد، والكتاب الذي لا أملّ من قراءته طوال عمري.»'
    },
    {
      badge: 'الفصل الثاني',
      title: 'إلّا عيونكِ أنتِ.. سيرة الحب',
      rightBody:
        'كثيراً ما سمعتُ أم كلثوم وهي تغني سيرة الحب، لكنني لم أفهم معنى «ياما عيون شاغلوني لكن ولا شغلوني.. إلّا عيونك إنتَ دول بس اللي خدوني وبحبك أمروني» إلا حين نظرتُ إلى عينيكِ يا مريم.',
      motif: 'صوت القاهرة ١٩٦٤',
      leftBody:
        'في عينيكِ هدوءٌ غريب يأسرني، وحنانٌ يأمر قلبي بالحب دون أن يطلب. كل نغمةٍ في لحن بليغ حمدي كأنها عُزفت لتكون خلفيةً لحديثنا الطويل وضحكاتنا التي لا تنتهي.',
      quote: '«إلّا عيونك إنتَ.. دول بس اللي خدوني.. وبحبك أمروني.. أمروني أحب.»'
    },
    {
      badge: 'الفصل الثالث',
      title: 'حبيبتي القارئة وعاشقة القديم',
      rightBody:
        'أحب فيكِ شغفكِ بالكتب والكتابة، وحنينكِ لكل ما هو قديمٌ وأصيل. تشبهين الرسائل المكتوبة بالحبر على ورقٍ عتيق، والروايات الكلاسيكية التي تترك في القلب أثراً دافئاً لا يمحوه الزمن.',
      motif: 'الكتب والحبر',
      leftBody:
        'معكِ يا مريم، حتى الصمت يشبه قراءة فصلٍ جميل في مقهى هادئ. كل كلمةٍ تكتبينها أو تحبينها تزيدني إعجاباً بعقلكِ وروحكِ النقية التي لا تشبه أحداً في هذا الزمان.',
      quote: '«لو جُمعت كل كتب العاشقين في مكتبةٍ واحدة، لكان اسمكِ يا مريم هو السطر الأجمل فيها.»'
    },
    {
      badge: 'الفصل الرابع',
      title: 'رائحة القهوة، الورد، وغيوم السماء',
      rightBody:
        'أصبح كل فنجان قهوةٍ يذكرني بكِ، وكل وردةٍ بلدية أراها أتخيلها بين يديكِ، وكلما رفعتُ رأسي إلى السماء وتأملتُ الغيوم المسافرة، ابتسمتُ لأنني أعرف كم تحبين هذا المشهد.',
      motif: 'القهوة والورد',
      leftBody:
        'أحب تفاصيلكِ الصغيرة يا مريم: حبكِ للقهوة، وللورد، وللسماء، وللكتابة، ولكل شيءٍ يحمل روحاً ومعنى. هذه التفاصيل هي التي جعلتني أقع في حبكِ من أول لحظة.',
      quote: '«بين فنجان قهوةٍ، ووردةٍ حمراء، وغيمةٍ في السماء.. يسكن حبنا أنا وأنتِ.»'
    },
    {
      badge: 'الفصل الخامس',
      title: 'فصولٌ قادمة نكتبها معاً',
      rightBody:
        'هذا الكتاب يا مريم ليس نهاية الحكاية، بل هو الصفحة الأولى من عمرٍ طويل أتمناه معكِ. سنقرأ كتباً كثيرة معاً، ونشرب قهوتنا في أماكن نحبها، ونسمع أم كلثوم تحت سماءٍ مليئة بالغيوم.',
      motif: 'عهدٌ أبدي',
      leftBody:
        'شكراً لأنكِ دخلتِ حياتي يا مريم، وشكراً لأنكِ بادلتِني هذا الحب الكبير. سيبقى قلبي دائماً بيتكِ، وستبقين دائماً حبيبتي وأجمل قدرٍ كتبه الله لي.',
      quote: '«لقيتني بحب.. وأدوب في الحب.. وصبح وليل على بابه (سيف لمريم).»'
    }
  ];

  let savedCustomChapters = [];
  try {
    const raw = localStorage.getItem('seif_mariam_custom_chapters');
    if (raw) savedCustomChapters = JSON.parse(raw);
  } catch (_) {}

  const allChapters = [...defaultChapters, ...savedCustomChapters];
  let currentChapterIndex = 0;

  function renderBookChapter(index) {
    currentChapterIndex = (index + allChapters.length) % allChapters.length;
    const ch = allChapters[currentChapterIndex];

    const badgeEl = document.getElementById('book-chapter-badge');
    const titleEl = document.getElementById('book-right-title');
    const rightBodyEl = document.getElementById('book-right-body');
    const motifEl = document.getElementById('book-chapter-motif');
    const leftBodyEl = document.getElementById('book-left-body');
    const quoteEl = document.getElementById('book-left-quote');
    const rightNumEl = document.getElementById('book-right-page-num');
    const leftNumEl = document.getElementById('book-left-page-num');

    if (badgeEl) badgeEl.textContent = ch.badge;
    if (titleEl) titleEl.textContent = ch.title;
    if (rightBodyEl) rightBodyEl.textContent = ch.rightBody;
    if (motifEl) motifEl.textContent = ch.motif;
    if (leftBodyEl) leftBodyEl.textContent = ch.leftBody;
    if (quoteEl) quoteEl.textContent = ch.quote;
    if (rightNumEl) rightNumEl.textContent = `صفحة ${currentChapterIndex * 2 + 1}`;
    if (leftNumEl) leftNumEl.textContent = `صفحة ${currentChapterIndex * 2 + 2}`;

    renderChapterTabs();
  }

  function renderChapterTabs() {
    const tabsContainer = document.getElementById('book-chapter-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    allChapters.forEach((ch, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `chapter-tab-btn${idx === currentChapterIndex ? ' is-current' : ''}`;
      btn.textContent = ch.badge;
      btn.addEventListener('click', () => renderBookChapter(idx));
      tabsContainer.appendChild(btn);
    });
  }

  renderBookChapter(0);

  const prevChapterBtn = document.getElementById('prev-chapter-btn');
  const nextChapterBtn = document.getElementById('next-chapter-btn');
  if (prevChapterBtn) {
    prevChapterBtn.addEventListener('click', () => renderBookChapter(currentChapterIndex - 1));
  }
  if (nextChapterBtn) {
    nextChapterBtn.addEventListener('click', () => renderBookChapter(currentChapterIndex + 1));
  }

  // Mobile Touch Swipe on Book Spread
  const bookSpreadEl = document.getElementById('book-spread');
  if (bookSpreadEl) {
    let touchStartX = 0;
    let touchStartY = 0;
    bookSpreadEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    bookSpreadEl.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx > 0) {
          renderBookChapter(currentChapterIndex + 1);
        } else {
          renderBookChapter(currentChapterIndex - 1);
        }
      }
    }, { passive: true });
  }

  /* ==========================================================================
     7. The Literary Café Table — Coffee Brewer & Vintage Typewriter
     ========================================================================== */
  const coffeeData = {
    turkish: {
      color: '#3b2216',
      title: 'قهوة تركي بالحبهان، على نغم أم كلثوم',
      text: '«يقولون إن القهوة تضبط المزاج، لكن الحقيقة يا مريم أن كلمةً واحدة منكِ في أول اليوم تفعل بقلبي ما لا تفعله كل مقاهي القاهرة القديمة.»'
    },
    latte: {
      color: '#9c6b49',
      title: 'سبانيش لاتيه بالغيم، حلوٌ كابتسامتكِ',
      text: '«رغوة اللاتيه تشبه الغيوم التي تحبين تأملها في السماء، وحلاوتها تذكرني بأول مرة اعترفنا فيها لبعضنا وقلبي طار من الفرحة يا مريم.»'
    },
    espresso: {
      color: '#22120b',
      title: 'إسبريسو كلاسيك، عميقٌ كنظرة عينيكِ',
      text: '«مركزٌ، صادق، ولا يشبه أي شيء آخر.. تماماً مثل حبكِ في قلبي يا مريم، ومثل نظرة عينيكِ التي أمرتني بالحب من أول لحظة.»'
    },
    mocha: {
      color: '#593322',
      title: 'موكا بالقرفة والورد، دفء الشتاء والكتب',
      text: '«تخيلي كتاباً قديماً مفتوحاً، وفنجان موكا دافئاً، ووردةً بلدية على الطاولة، وأنا وأنتِ نحكي لساعات دون أن نشعر بالوقت.»'
    }
  };

  document.querySelectorAll('.coffee-choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.coffee-choice-btn').forEach((b) => b.classList.remove('is-brewed'));
      btn.classList.add('is-brewed');
      const key = btn.dataset.coffee || 'turkish';
      const info = coffeeData[key] || coffeeData.turkish;

      const liquidEl = document.getElementById('coffee-liquid-ellipse');
      const titleEl = document.getElementById('napkin-title');
      const textEl = document.getElementById('napkin-text');

      if (liquidEl) liquidEl.setAttribute('fill', info.color);
      if (titleEl) titleEl.textContent = info.title;
      if (textEl) textEl.textContent = info.text;
    });
  });

  // Vintage Mechanical Typewriter
  const typewriterLetters = [
    {
      title: 'رسالة رقم ١: عن عينيكِ وسيرة الحب',
      body: 'حبيبتي مريم..\nكلما غنّت أم كلثوم «إلّا عيونك إنتَ دول بس اللي خدوني»، ابتسمتُ وقلتُ في سري: صدقتِ يا ست الكل، عيون مريم وحدها هي التي أخذت قلبي وأمرته بالحب.\n(حبيبكِ سيف)'
    },
    {
      title: 'رسالة رقم ٢: إلى عاشقة الكتب والغيوم',
      body: 'مريم الجميلة..\nأحب فيكِ روحكِ التي تحب الكتب والكتابة، وتبحث عن الجمال في الغيوم، وفي الورد، وفي الأشياء القديمة الأصيلة. وجودكِ في حياتي جعل كل يومٍ أشبه بروايةٍ رومانسية لا أريد لها أن تنتهي.\n(سيف)'
    },
    {
      title: 'رسالة رقم ٣: فنجان قهوة ووعدٌ أبدي',
      body: 'إلى أغلى اسمٍ في قلبي..\nأعدكِ يا مريم أن نحتسي قهوتنا معاً تحت كل سماء، وأن أهديكِ ورداً يشبه رقتكِ، وأن أبقى دائماً الحبيب الذي يرى في عينيكِ أجمل وطن.\n(بحبك أوي، سيف)'
    },
    {
      title: 'رسالة رقم ٤: يوم اعترفنا لبعضنا',
      body: 'يا مريم..\nاللحظة التي اعترفنا فيها بحبنا لبعض هي اللحظة التي بدأ فيها تاريخي الحقيقي. قبلها كان مجرد وقتٍ يمر، وبعدها صار كل نفسٍ في عمري ينبض باسمكِ.\n(سيف)'
    }
  ];

  let currentLetterIdx = 0;
  let typingTimer = null;

  function typeOutLetter(title, text) {
    const titleEl = document.getElementById('typewriter-letter-title');
    const outputEl = document.getElementById('typewriter-text');
    if (!outputEl) return;

    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }

    if (titleEl) titleEl.textContent = title;
    outputEl.textContent = '';

    if (prefersReducedMotion) {
      outputEl.textContent = text;
      return;
    }

    let charIdx = 0;
    typingTimer = window.setInterval(() => {
      if (charIdx < text.length) {
        outputEl.textContent += text[charIdx];
        if (text[charIdx] !== ' ' && charIdx % 2 === 0) {
          playTypewriterClick(false);
        }
        charIdx++;
      } else {
        clearInterval(typingTimer);
        typingTimer = null;
        playTypewriterClick(true);
      }
    }, 38);
  }

  const initialTitleEl = document.getElementById('typewriter-letter-title');
  const initialOutputEl = document.getElementById('typewriter-text');
  if (initialTitleEl && initialOutputEl) {
    initialTitleEl.textContent = typewriterLetters[0].title;
    initialOutputEl.textContent = typewriterLetters[0].body;
  }

  const nextTypedLetterBtn = document.getElementById('next-typed-letter-btn');
  if (nextTypedLetterBtn) {
    nextTypedLetterBtn.addEventListener('click', () => {
      currentLetterIdx = (currentLetterIdx + 1) % typewriterLetters.length;
      const item = typewriterLetters[currentLetterIdx];
      typeOutLetter(item.title, item.body);
    });
  }

  const customTypewriterForm = document.getElementById('custom-typewriter-form');
  const customTypewriterInput = document.getElementById('custom-typewriter-input');
  if (customTypewriterForm && customTypewriterInput) {
    customTypewriterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = customTypewriterInput.value.trim();
      if (!val) return;

      const customTitle = 'رسالة خاصة مطبوعة الآن';
      typeOutLetter(customTitle, `${val}\n(مريم ♥ سيف)`);

      const newChapterNumber = allChapters.length + 1;
      const newChapter = {
        badge: `فصل مضاف (${newChapterNumber})`,
        title: 'سطرٌ جديد في مخطوطة حبنا',
        rightBody: val,
        motif: 'آلة كاتبة وذكرى',
        leftBody: 'حُفظت هذه الكلمات في كتاب سيف ومريم لتبقى شاهدةً على حبنا في كل وقت.',
        quote: '«كل كلمةٍ نكتبها معاً تتحول إلى وردةٍ لا تذبل.»'
      };
      allChapters.push(newChapter);
      savedCustomChapters.push(newChapter);
      try {
        localStorage.setItem('seif_mariam_custom_chapters', JSON.stringify(savedCustomChapters));
      } catch (_) {}
      renderBookChapter(allChapters.length - 1);
      customTypewriterInput.value = '';
    });
  }

  /* ==========================================================================
     8. The Pressed Damascus Rose Herbarium (#rose-herbarium)
     ========================================================================== */
  const roseSpecimens = [
    {
      name: 'وردة العيون التي أمرتني',
      latin: 'Rosa Damascena • عيون مريم',
      reason: 'لأن عينيكِ هما الحقيقة الوحيدة التي جعلتني أفهم معنى غناء أم كلثوم: «إلّا عيونك إنتَ دول بس اللي خدوني وبحبك أمروني».'
    },
    {
      name: 'وردة الكتب والحبر العتيق',
      latin: 'Folium Litterarum • شغف القراءة',
      reason: 'لأنكِ تحبين الكتب والكتابة، وعقلكِ مليءٌ بالحكايات الجميلة، والحديث معكِ يشبه قراءة أروع كتابٍ في العالم.'
    },
    {
      name: 'وردة السماء والغيوم المسافرة',
      latin: 'Nubes Coeli • سماء مريم',
      reason: 'لأن روحكِ صافيةٌ وواسعة مثل السماء، وحضوركِ رقيقٌ وهادئ مثل الغيوم التي تسبح وقت الغروب.'
    },
    {
      name: 'وردة القهوة الدافئة',
      latin: 'Coffea Arabica • مزاج الصباح',
      reason: 'لأنكِ تشبهين أول رشفةٍ من فنجان قهوةٍ مضبوط في صباحٍ شتوي، تمنحين قلبي دفئاً وراحةً لا توصف.'
    },
    {
      name: 'وردة الحنين والأشياء القديمة',
      latin: 'Memoria Antiqua • سحر الكلاسيك',
      reason: 'لأنكِ تعشقين كل ما هو قديمٌ وأصيل، وقلبكِ يحمل نقاء زمن الفن الجميل ورسائل العشاق الكلاسيكية.'
    },
    {
      name: 'وردة الاعتراف بالحب',
      latin: 'Amor Aeternus • سيف ومريم',
      reason: 'لأن اللحظة التي اعترفنا فيها بحبنا لبعضنا كانت أسعد لحظةٍ في حياتي، ولأنني أحبكِ أكثر مما تتخيلين.'
    }
  ];

  const twentyLoveNotes = [
    '«أحبكِ يا مريم لأنكِ جمعتِ رقة الورد، وعمق الكتب، ودفء القهوة، واتساع السماء في روحٍ واحدة.»',
    '«ياما عيون شاغلوني.. لكن ولا شغلوني.. إلّا عيونك إنتِ يا مريم.»',
    '«لو كان الحب كتاباً، لكنتِ أنتِ كل فصوله، وأنا القارئ الذي لا يكتفي منكِ أبداً.»',
    '«كل وردةٍ بلدية في الدنيا تغار من رقة حضوركِ وجمال ابتسامتكِ.»',
    '«مع كل فنجان قهوة، أدعو الله أن يديمكِ لقلبي حبيبةً وونيسةً طوال العمر.»',
    '«حين أنظر إلى الغيوم في السماء، أشعر أن السماء تبتسم لأنكِ تحتها يا مريم.»',
    '«أحبكِ بالطريقة القديمة: حبٌّ صادق، عميق، لا يتغير مع الأيام بل يزداد جمالاً.»',
    '«صوتكِ في أذني أجمل من كل المقدمات الموسيقية لبليغ حمدي وأم كلثوم.»',
    '«أنتِ الصفحة التي كنتُ أبحث عنها في كل كتابٍ قرأته قبل أن أعرفكِ.»',
    '«من يوم ما اعترفنا لبعض، وأنا حاسس إن الدنيا كلها بقت ورد وغيوم وموسيقى.»',
    '«عيونكِ يا مريم هي البداية والنهاية لكل قصيدة حبٍ في قلبي.»',
    '«بحبك أوي يا مريم.. حب يكفي كل السنين اللي فاتت وكل السنين اللي جاية.»'
  ];

  function createPressedRoseSVG(index) {
    const hueShift = index % 2 === 0 ? '#8b1e2b' : '#731622';
    return `
      <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 27V44" stroke="#4d5d3b" stroke-width="2" stroke-linecap="round"/>
        <path d="M24 35C19 32 15 33 14 36C18 38 22 37 24 35Z" fill="#5c6e46"/>
        <path d="M24 32C29 29 33 30 34 33C30 35 26 34 24 32Z" fill="#5c6e46"/>
        <circle cx="24" cy="18" r="11" fill="${hueShift}" opacity="0.16"/>
        <path d="M24 8C18 8 14 13 15 19C16 24 20 27 24 27C28 27 32 24 33 19C34 13 30 8 24 8Z" fill="${hueShift}"/>
        <path d="M24 11C20 11 18 14 19 18C20 21 22 23 24 23C26 23 28 21 29 18C30 14 28 11 24 11Z" stroke="#f6ecdc" stroke-width="1.3"/>
        <circle cx="24" cy="17" r="2.5" fill="#e5be7a"/>
      </svg>
    `;
  }

  const rosesGrid = document.getElementById('roses-grid');
  if (rosesGrid) {
    roseSpecimens.forEach((spec, idx) => {
      const card = document.createElement('article');
      card.className = 'rose-specimen-sheet is-bloomed';
      card.innerHTML = `
        <div>
          <div class="rose-svg-wrap">
            ${createPressedRoseSVG(idx)}
            <span style="font-family:var(--font-typewriter);font-size:0.82rem;color:var(--ink-muted);">${spec.latin}</span>
          </div>
          <h3 class="rose-tag-name">${spec.name}</h3>
          <p class="rose-reason-text">${spec.reason}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        card.classList.toggle('is-bloomed');
        spawnRosePetals(10);
      });
      rosesGrid.appendChild(card);
    });
  }

  const bloomAllRosesBtn = document.getElementById('bloom-all-roses-btn');
  if (bloomAllRosesBtn) {
    bloomAllRosesBtn.addEventListener('click', () => {
      document.querySelectorAll('.rose-specimen-sheet').forEach((el) => el.classList.add('is-bloomed'));
      spawnRosePetals(28);
    });
  }

  let noteCursor = 0;
  const drawRandomRoseBtn = document.getElementById('draw-random-rose-btn');
  const randomRoseQuoteEl = document.getElementById('random-rose-quote');
  if (drawRandomRoseBtn && randomRoseQuoteEl) {
    drawRandomRoseBtn.addEventListener('click', () => {
      noteCursor = (noteCursor + 1) % twentyLoveNotes.length;
      randomRoseQuoteEl.textContent = twentyLoveNotes[noteCursor];
      spawnRosePetals(14);
    });
  }

  /* ==========================================================================
     9. The Eternal Love Vow & Mobile-Safe Playful Dodge Button (#eternal-vow)
     ========================================================================== */
  const acceptVowBtn = document.getElementById('accept-vow-btn');
  const playfulThinkBtn = document.getElementById('playful-think-btn');
  const vowCelebrationBox = document.getElementById('vow-celebration-box');

  const playfulExcuses = [
    'الغيوم في السما بتقول مفيش تفكير!',
    'أم كلثوم قالت: وبحبك أمروني.. أمروني أحب!',
    'فنجان القهوة هيبرد يا مريم!',
    'الورد البلدي كله بيشهد إننا بنحب بعض أوي!',
    'عيونكِ هي اللي أمرت، مفيش رجوع!',
    'طب ينفع تكسفي سيف اللي بيحبك قد السما؟',
    'طبعاً موافقة وبحبك يا سيف ♥'
  ];
  let dodgeStep = 0;

  function triggerVowCelebration() {
    if (vowCelebrationBox) {
      vowCelebrationBox.classList.add('is-visible');
    }
    playWaxSealOpenSound();
    spawnRosePetals(42);
  }

  if (acceptVowBtn) {
    acceptVowBtn.addEventListener('click', triggerVowCelebration);
  }

  if (playfulThinkBtn) {
    const handlePlayfulDodge = () => {
      if (dodgeStep >= playfulExcuses.length - 1) {
        playfulThinkBtn.textContent = playfulExcuses[playfulExcuses.length - 1];
        playfulThinkBtn.style.transform = 'translate(0, 0)';
        playfulThinkBtn.className = 'btn-primary-rose';
        triggerVowCelebration();
        return;
      }
      playfulThinkBtn.textContent = playfulExcuses[dodgeStep];
      dodgeStep++;
      const maxX = window.innerWidth < 640 ? 32 : 75;
      const maxY = window.innerWidth < 640 ? 14 : 24;
      const offsetX = (Math.random() - 0.5) * maxX;
      const offsetY = (Math.random() - 0.5) * maxY;
      playfulThinkBtn.style.transform = `translate(${offsetX.toFixed(0)}px, ${offsetY.toFixed(0)}px)`;
    };

    playfulThinkBtn.addEventListener('mouseenter', handlePlayfulDodge);
    playfulThinkBtn.addEventListener('click', handlePlayfulDodge);
  }
})();
