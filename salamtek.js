(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. Celebration Sound Chime (Web Audio API)
     ========================================================================== */
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playChime(notes = [392, 523.25]) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.9);
    });
  }

  /* ==========================================================================
     2. Celebration Rose Petals & Golden Sparkles Canvas
     ========================================================================== */
  const canvas = document.getElementById('celebration-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const particles = [];
  let animRunning = false;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function spawnCelebration(count = 36) {
    if (!canvas || prefersReducedMotion) return;
    const palette = ['#be123c', '#f472b6', '#c084fc', '#fbbf24', '#34d399', '#f6f3ff'];
    const actualCount = window.innerWidth < 640 ? Math.min(count, 30) : count;

    for (let i = 0; i < actualCount; i++) {
      const isSparkle = i % 3 === 0;
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 140,
        size: isSparkle ? 4 + Math.random() * 5 : 8 + Math.random() * 9,
        vy: 1.5 + Math.random() * 2.4,
        vx: -1.1 + Math.random() * 2.2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.07,
        color: palette[Math.floor(Math.random() * palette.length)],
        isSparkle
      });
    }

    if (!animRunning) {
      animRunning = true;
      requestAnimationFrame(tickParticles);
    }
  }

  function tickParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.y * 0.02) * 0.55;
      p.angle += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;

      if (p.isSparkle) {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size, -p.size * 0.6, p.size * 0.9, p.size * 0.8, 0, p.size);
        ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.8, -p.size, -p.size * 0.6, 0, -p.size);
        ctx.fill();
      }
      ctx.restore();

      if (p.y > canvas.height + 35) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0 && !document.hidden) {
      requestAnimationFrame(tickParticles);
    } else {
      animRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  const showerBtn = document.getElementById('shower-celebration-btn');
  if (showerBtn) {
    showerBtn.addEventListener('click', () => {
      playChime([523.25, 659.25]);
      spawnCelebration(48);
    });
  }

  /* ==========================================================================
     3. Dual Music Controller (Elissa "حالة حب" & Umm Kulthum "إلّا عيونك إنتَ")
     ========================================================================== */
  const elissaAudio = document.getElementById('audio-elissa');
  const ummAudio = document.getElementById('audio-umm');
  const playElissaBtn = document.getElementById('play-elissa-btn');
  const topPlayElissaBtn = document.getElementById('top-play-elissa-btn');
  const elissaLabel = document.getElementById('elissa-btn-label');
  const playUmmBtn = document.getElementById('play-umm-btn');
  const ummLabel = document.getElementById('umm-btn-label');

  function syncAudioButtons() {
    const elissaPlaying = elissaAudio && !elissaAudio.paused;
    const ummPlaying = ummAudio && !ummAudio.paused;

    if (playElissaBtn) playElissaBtn.classList.toggle('is-active', elissaPlaying);
    if (topPlayElissaBtn) topPlayElissaBtn.classList.toggle('is-active', elissaPlaying);
    if (elissaLabel) elissaLabel.textContent = elissaPlaying ? '❚❚ إيقاف «حالة حب»' : '♪ شغّلي «حالة حب» • إليسا';

    if (playUmmBtn) playUmmBtn.classList.toggle('is-active', ummPlaying);
    if (ummLabel) ummLabel.textContent = ummPlaying ? '❚❚ إيقاف «إلّا عيونك إنتَ»' : '♪ شغّلي «إلّا عيونك إنتَ» • أم كلثوم';
  }

  function startTrack(audioEl, startSeconds) {
    if (!audioEl) return;
    getAudioCtx();
    if (audioEl === elissaAudio && ummAudio && !ummAudio.paused) ummAudio.pause();
    if (audioEl === ummAudio && elissaAudio && !elissaAudio.paused) elissaAudio.pause();

    if (audioEl.currentTime < 1 && startSeconds > 0) {
      if (audioEl.readyState >= 1) {
        try { audioEl.currentTime = startSeconds; } catch (_) {}
      } else {
        audioEl.addEventListener('loadedmetadata', () => {
          try { audioEl.currentTime = startSeconds; } catch (_) {}
        }, { once: true });
      }
    }
    audioEl.play().then(syncAudioButtons).catch(() => {});
  }

  function toggleElissa() {
    if (!elissaAudio) return;
    if (elissaAudio.paused) {
      startTrack(elissaAudio, 15);
    } else {
      elissaAudio.pause();
      syncAudioButtons();
    }
  }

  function toggleUmm() {
    if (!ummAudio) return;
    if (ummAudio.paused) {
      startTrack(ummAudio, 137);
    } else {
      ummAudio.pause();
      syncAudioButtons();
    }
  }

  if (playElissaBtn) playElissaBtn.addEventListener('click', toggleElissa);
  if (topPlayElissaBtn) topPlayElissaBtn.addEventListener('click', toggleElissa);
  if (playUmmBtn) playUmmBtn.addEventListener('click', toggleUmm);

  if (elissaAudio) elissaAudio.addEventListener('ended', syncAudioButtons);
  if (ummAudio) ummAudio.addEventListener('ended', syncAudioButtons);

  /* ==========================================================================
     4. Interactive 3-Step Cast Unwrapping Experience
     ========================================================================== */
  const castSvg = document.getElementById('cast-svg');
  const freedEmblem = document.getElementById('freed-emblem');
  const progressFill = document.getElementById('unwrap-progress-fill');
  const statusMsg = document.getElementById('unwrap-status-msg');
  const unwrapBtn = document.getElementById('unwrap-cast-btn');
  const unwrapBtnText = document.getElementById('unwrap-btn-text');

  let unwrapStep = 0;

  function advanceUnwrap() {
    if (unwrapStep >= 3) {
      // Reset so Mariam can enjoy unwrapping again if she wants
      unwrapStep = 0;
      if (castSvg) {
        castSvg.classList.remove('step-1', 'step-2', 'is-freed');
      }
      if (freedEmblem) freedEmblem.classList.remove('is-visible');
      if (progressFill) progressFill.style.width = '0%';
      if (statusMsg) statusMsg.textContent = 'اضغطي على الزر ٣ مرات عشان نفك الجبس ونحتفل سوا';
      if (unwrapBtnText) unwrapBtnText.textContent = 'فكّي أول لفة من الجبس (0 / 3)';
      return;
    }

    unwrapStep++;

    if (unwrapStep === 1) {
      if (castSvg) castSvg.classList.add('step-1');
      if (progressFill) progressFill.style.width = '33%';
      if (statusMsg) statusMsg.textContent = 'فكّينا أول لفة.. أخيراً ارتاحت رجلك الحلوة يا مريم! (1 / 3)';
      if (unwrapBtnText) unwrapBtnText.textContent = 'فكّي اللفة التانية (1 / 3)';
      playChime([392, 493.88]);
      spawnCelebration(20);
    } else if (unwrapStep === 2) {
      if (castSvg) castSvg.classList.add('step-2');
      if (progressFill) progressFill.style.width = '66%';
      if (statusMsg) statusMsg.textContent = 'كمان لفة واحدة بس.. والورد والقهوة مستنيينك! (2 / 3)';
      if (unwrapBtnText) unwrapBtnText.textContent = 'فكّي آخر لفة واحتفلي! (2 / 3)';
      playChime([440, 554.37, 659.25]);
      spawnCelebration(30);
    } else if (unwrapStep === 3) {
      if (castSvg) castSvg.classList.add('is-freed');
      if (freedEmblem) freedEmblem.classList.add('is-visible');
      if (progressFill) progressFill.style.width = '100%';
      if (statusMsg) statusMsg.textContent = 'ألف حمد الله على السلامة يا مريم ♥ أخيراً اتفك الجبس!';
      if (unwrapBtnText) unwrapBtnText.textContent = 'إعادة لحظة فك الجبس ✨';
      playChime([523.25, 659.25, 783.99, 1046.5]);
      spawnCelebration(70);
      // Automatically start Elissa "حالة حب" upon celebration
      startTrack(elissaAudio, 15);
    }
  }

  if (unwrapBtn) unwrapBtn.addEventListener('click', advanceUnwrap);
  if (castSvg) {
    castSvg.style.cursor = 'pointer';
    castSvg.addEventListener('click', advanceUnwrap);
  }

  /* ==========================================================================
     5. VIP Date Ticket Claim
     ========================================================================== */
  const claimBtn = document.getElementById('claim-ticket-btn');
  const claimLabel = document.getElementById('claim-ticket-label');
  const stampBadge = document.getElementById('ticket-stamp-badge');

  function applyTicketClaimed() {
    if (stampBadge) stampBadge.classList.add('is-stamped');
    if (claimLabel) claimLabel.textContent = 'التذكرة محجوزة لعيون مريم ♥';
  }

  try {
    if (localStorage.getItem('mariam_cast_ticket_claimed') === '1') {
      applyTicketClaimed();
    }
  } catch (_) {}

  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      applyTicketClaimed();
      try {
        localStorage.setItem('mariam_cast_ticket_claimed', '1');
      } catch (_) {}
      playChime([523.25, 659.25, 783.99]);
      spawnCelebration(45);
    });
  }

  /* ==========================================================================
     6. Post-Cast Wishlist Checklist
     ========================================================================== */
  const wishBtns = Array.from(document.querySelectorAll('.wish-item-btn'));
  const wishReactionBar = document.getElementById('wish-reaction-bar');
  let savedWishes = [];

  try {
    const raw = localStorage.getItem('mariam_post_cast_wishes');
    if (raw) savedWishes = JSON.parse(raw);
  } catch (_) {}

  function renderWishState(btn, checked) {
    btn.classList.toggle('is-checked', checked);
    const circle = btn.querySelector('.wish-check-circle');
    if (circle) circle.textContent = checked ? '✓' : '';
  }

  wishBtns.forEach((btn) => {
    const id = btn.dataset.wish;
    if (savedWishes.includes(id)) {
      renderWishState(btn, true);
    }

    btn.addEventListener('click', () => {
      const isNowChecked = !btn.classList.contains('is-checked');
      renderWishState(btn, isNowChecked);

      if (isNowChecked) {
        if (!savedWishes.includes(id)) savedWishes.push(id);
        if (wishReactionBar && btn.dataset.reply) {
          wishReactionBar.textContent = btn.dataset.reply;
        }
        playChime([493.88, 659.25]);
        spawnCelebration(18);
      } else {
        savedWishes = savedWishes.filter((w) => w !== id);
      }

      try {
        localStorage.setItem('mariam_post_cast_wishes', JSON.stringify(savedWishes));
      } catch (_) {}
    });
  });
})();
