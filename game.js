(function () {
  'use strict';

  // ─── DOM refs ────────────────────────────────────────────────
  const canvas       = document.getElementById('game');
  const ctx          = canvas.getContext('2d');
  const scoreEl      = document.getElementById('score-value');
  const highscoreEl  = document.getElementById('highscore-value');
  const startOverlay   = document.getElementById('start-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const pauseOverlay   = document.getElementById('pause-overlay');
  const finalScoreEl   = document.getElementById('final-score');
  const finalHighscoreEl = document.getElementById('final-highscore');
  const newHighscoreEl = document.getElementById('new-highscore');
  const restartBtn     = document.getElementById('restart-btn');

  // ─── Config ──────────────────────────────────────────────────
  const GRID_COUNT         = 20;
  const BASE_MOVE_INTERVAL = 130;   // ms between moves at score 0
  const MIN_MOVE_INTERVAL  = 55;    // fastest speed
  const SPEED_RAMP         = 2.5;   // ms faster per point

  // ─── State ───────────────────────────────────────────────────
  let cellSize, canvasSize;
  let snake, direction, nextDirections, food;
  let score, highScore, lastMoveTime;
  let state; // 'start' | 'playing' | 'paused' | 'gameover'
  let foodPulse = 0;
  let particles = [];

  // ─── Sizing ──────────────────────────────────────────────────
  function resize() {
    const pad  = 80;
    const maxW = Math.min(window.innerWidth - 24, 600);
    const maxH = window.innerHeight - pad - 24;
    const maxDim = Math.min(maxW, maxH);
    cellSize   = Math.floor(maxDim / GRID_COUNT);
    canvasSize = cellSize * GRID_COUNT;
    canvas.width  = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width  = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px';
  }

  // ─── Init ────────────────────────────────────────────────────
  function init() {
    highScore = parseInt(localStorage.getItem('snake_highscore') || '0', 10);
    highscoreEl.textContent = highScore;
    resize();
    resetGame();
    state = 'start';
    showOverlay(startOverlay);
    requestAnimationFrame(gameLoop);
  }

  function resetGame() {
    const mid = Math.floor(GRID_COUNT / 2);
    snake = [
      { x: mid,     y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    direction      = { x: 1, y: 0 };
    nextDirections = [];
    score          = 0;
    scoreEl.textContent = '0';
    lastMoveTime   = 0;
    particles      = [];
    placeFood();
  }

  function placeFood() {
    const free = [];
    for (let x = 0; x < GRID_COUNT; x++) {
      for (let y = 0; y < GRID_COUNT; y++) {
        if (!snake.some(s => s.x === x && s.y === y)) {
          free.push({ x, y });
        }
      }
    }
    if (free.length === 0) { gameOver(); return; }
    food = free[Math.floor(Math.random() * free.length)];
  }

  // ─── Overlays ────────────────────────────────────────────────
  function showOverlay(el) { el.classList.remove('hidden'); }
  function hideOverlay(el) { el.classList.add('hidden'); }

  // ─── Movement ────────────────────────────────────────────────
  function getMoveInterval() {
    return Math.max(MIN_MOVE_INTERVAL, BASE_MOVE_INTERVAL - score * SPEED_RAMP);
  }

  function queueDirection(dx, dy) {
    const last = nextDirections.length > 0
      ? nextDirections[nextDirections.length - 1]
      : direction;
    if (last.x === -dx && last.y === -dy) return;
    if (last.x ===  dx && last.y ===  dy) return;
    if (nextDirections.length < 3) {
      nextDirections.push({ x: dx, y: dy });
    }
  }

  function moveSnake() {
    if (nextDirections.length > 0) {
      direction = nextDirections.shift();
    }

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
      gameOver();
      return;
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // Eat food?
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      spawnParticles(food.x, food.y);
      placeFood();
    } else {
      snake.pop();
    }
  }

  // ─── Particles ───────────────────────────────────────────────
  function spawnParticles(gx, gy) {
    const cx = (gx + 0.5) * cellSize;
    const cy = (gy + 0.5) * cellSize;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#22c55e' : '#4ade80',
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ─── Game Over ───────────────────────────────────────────────
  function gameOver() {
    state = 'gameover';
    let isNew = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snake_highscore', highScore);
      highscoreEl.textContent = highScore;
      isNew = true;
    }
    finalScoreEl.textContent    = score;
    finalHighscoreEl.textContent = 'Best: ' + highScore;
    if (isNew && score > 0) {
      newHighscoreEl.classList.remove('hidden');
    } else {
      newHighscoreEl.classList.add('hidden');
    }
    showOverlay(gameoverOverlay);
  }

  // ─── Rendering ───────────────────────────────────────────────
  function draw(timestamp) {
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth   = 0.5;
    for (let i = 1; i < GRID_COUNT; i++) {
      const p = i * cellSize;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, canvasSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(canvasSize, p); ctx.stroke();
    }

    if (state === 'start') return;

    // Food glow
    foodPulse += 0.04;
    const glowSize  = 0.6 + Math.sin(foodPulse) * 0.15;
    const fx        = (food.x + 0.5) * cellSize;
    const fy        = (food.y + 0.5) * cellSize;
    const foodRadius = cellSize * 0.35;

    // Outer glow
    const glow = ctx.createRadialGradient(fx, fy, foodRadius * 0.5, fx, fy, cellSize * 1.4);
    glow.addColorStop(0,   'rgba(239, 68, 68, 0.2)');
    glow.addColorStop(0.5, 'rgba(249, 115, 22, 0.08)');
    glow.addColorStop(1,   'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, cellSize * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Food body
    const foodGrad = ctx.createRadialGradient(
      fx - foodRadius * 0.3, fy - foodRadius * 0.3, foodRadius * 0.1,
      fx, fy, foodRadius * glowSize
    );
    foodGrad.addColorStop(0,   '#fca5a5');
    foodGrad.addColorStop(0.4, '#ef4444');
    foodGrad.addColorStop(1,   '#dc2626');
    ctx.fillStyle = foodGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, foodRadius * glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    const gap     = 1.5;
    const cornerR = cellSize * 0.22;

    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const sx  = seg.x * cellSize + gap;
      const sy  = seg.y * cellSize + gap;
      const sw  = cellSize - gap * 2;
      const sh  = cellSize - gap * 2;

      if (i === 0) {
        ctx.fillStyle   = '#16a34a';
        ctx.shadowColor = 'rgba(34,197,94,0.3)';
        ctx.shadowBlur  = 8;
      } else {
        const ratio = i / (snake.length - 1);
        const alpha = 1 - ratio * 0.35;
        const r = Math.round(34  * alpha + 20 * (1 - alpha));
        const g = Math.round(197 * alpha + 80 * (1 - alpha));
        const b = Math.round(94  * alpha + 50 * (1 - alpha));
        ctx.fillStyle   = `rgb(${r},${g},${b})`;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;
      }

      // Rounded rect
      ctx.beginPath();
      ctx.moveTo(sx + cornerR, sy);
      ctx.lineTo(sx + sw - cornerR, sy);
      ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + cornerR);
      ctx.lineTo(sx + sw, sy + sh - cornerR);
      ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - cornerR, sy + sh);
      ctx.lineTo(sx + cornerR, sy + sh);
      ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - cornerR);
      ctx.lineTo(sx, sy + cornerR);
      ctx.quadraticCurveTo(sx, sy, sx + cornerR, sy);
      ctx.closePath();
      ctx.fill();

      // Eyes on head
      if (i === 0) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur  = 0;
        const eyeR      = cellSize * 0.07;
        const eyeOffset = cellSize * 0.2;
        const cx = seg.x * cellSize + cellSize / 2;
        const cy = seg.y * cellSize + cellSize / 2;
        let e1x, e1y, e2x, e2y;

        if (direction.x === 1) {
          e1x = cx + eyeOffset; e1y = cy - eyeOffset * 0.7;
          e2x = cx + eyeOffset; e2y = cy + eyeOffset * 0.7;
        } else if (direction.x === -1) {
          e1x = cx - eyeOffset; e1y = cy - eyeOffset * 0.7;
          e2x = cx - eyeOffset; e2y = cy + eyeOffset * 0.7;
        } else if (direction.y === -1) {
          e1x = cx - eyeOffset * 0.7; e1y = cy - eyeOffset;
          e2x = cx + eyeOffset * 0.7; e2y = cy - eyeOffset;
        } else {
          e1x = cx - eyeOffset * 0.7; e1y = cy + eyeOffset;
          e2x = cx + eyeOffset * 0.7; e2y = cy + eyeOffset;
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── Game Loop ───────────────────────────────────────────────
  function gameLoop(timestamp) {
    if (state === 'playing') {
      if (!lastMoveTime) lastMoveTime = timestamp;
      const interval = getMoveInterval();
      if (timestamp - lastMoveTime >= interval) {
        moveSnake();
        lastMoveTime = timestamp;
      }
      updateParticles();
    }
    draw(timestamp);
    requestAnimationFrame(gameLoop);
  }

  // ─── Input ───────────────────────────────────────────────────
  function startGame() {
    resetGame();
    hideOverlay(startOverlay);
    hideOverlay(gameoverOverlay);
    hideOverlay(pauseOverlay);
    state        = 'playing';
    lastMoveTime = 0;
  }

  document.addEventListener('keydown', function (e) {
    if (state === 'start') {
      if (e.key === 'Tab') return;
      e.preventDefault();
      startGame();
      return;
    }

    if (state === 'gameover') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startGame();
      }
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (state === 'playing') {
        state = 'paused';
        showOverlay(pauseOverlay);
      } else if (state === 'paused') {
        state        = 'playing';
        lastMoveTime = 0;
        hideOverlay(pauseOverlay);
      }
      return;
    }

    if (state !== 'playing') return;

    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); queueDirection(0, -1); break;
      case 'ArrowDown':  case 's': case 'S': e.preventDefault(); queueDirection(0,  1); break;
      case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); queueDirection(-1, 0); break;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); queueDirection(1,  0); break;
    }
  });

  // Touch controls
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

  canvas.parentElement.addEventListener('touchstart', function (e) {
    if (state === 'gameover' || state === 'start') return;
    const touch    = e.touches[0];
    touchStartX    = touch.clientX;
    touchStartY    = touch.clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  canvas.parentElement.addEventListener('touchend', function (e) {
    if (state === 'start') { startGame(); return; }
    if (state !== 'playing') return;

    const touch = e.changedTouches[0];
    const dx    = touch.clientX - touchStartX;
    const dy    = touch.clientY - touchStartY;
    const dt    = Date.now() - touchStartTime;

    if (dt > 500) return;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? 1 : -1, 0);
    } else {
      queueDirection(0, dy > 0 ? 1 : -1);
    }
  }, { passive: true });

  // Click handlers
  startOverlay.addEventListener('click', function () {
    if (state === 'start') startGame();
  });

  restartBtn.addEventListener('click', function () {
    startGame();
  });

  window.addEventListener('resize', function () {
    resize();
  });

  // ─── Boot ────────────────────────────────────────────────────
  init();
})();
