// Simple Pong game
// Controls: left paddle - mouse or ArrowUp/ArrowDown. Space to pause/resume.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const playerScoreEl = document.getElementById('playerScore');
  const computerScoreEl = document.getElementById('computerScore');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Paddles
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 100;
  const PADDLE_MARGIN = 10;

  const player = {
    x: PADDLE_MARGIN,
    y: (HEIGHT - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: 6
  };

  const computer = {
    x: WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
    y: (HEIGHT - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 4 // AI max speed
  };

  // Ball
  const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 8,
    speed: 5,
    vx: 0,
    vy: 0
  };

  // Game state
  let playerScore = 0;
  let computerScore = 0;
  let running = true;
  let paused = false;
  let lastTime = 0;
  let keys = { ArrowUp: false, ArrowDown: false };

  // Utility draw functions
  function drawRect(x, y, w, h, color = '#fff') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color = '#fff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawText(text, x, y, size = 20, color = '#fff') {
    ctx.fillStyle = color;
    ctx.font = `${size}px Arial`;
    ctx.fillText(text, x, y);
  }

  function resetBall(servingToPlayer = true) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = 5;
    // Angle between -45 and 45 degrees, flip horizontally to serve to given side
    const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
    ball.vx = (servingToPlayer ? -1 : 1) * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
  }

  function start() {
    resetBall(Math.random() > 0.5);
    updateScoreboard();
    requestAnimationFrame(loop);
  }

  function updateScoreboard() {
    playerScoreEl.textContent = playerScore;
    computerScoreEl.textContent = computerScore;
  }

  // Collision helpers
  function rectCircleColliding(px, py, pw, ph, cx, cy, cr) {
    // Closest point on rect to circle center
    const closestX = Math.max(px, Math.min(cx, px + pw));
    const closestY = Math.max(py, Math.min(cy, py + ph));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) <= cr * cr;
  }

  // Input: mouse move controls left paddle
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    player.y = Math.max(0, Math.min(HEIGHT - player.height, mouseY - player.height / 2));
  });

  // Arrow keys control
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      paused = !paused;
      if (!paused) {
        // resume animation frame loop if needed
        lastTime = performance.now();
        requestAnimationFrame(loop);
      }
      e.preventDefault();
      return;
    }
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      keys[e.code] = true;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      keys[e.code] = false;
      e.preventDefault();
    }
  });

  function update(dt) {
    if (paused) return;

    // Player keyboard control
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));

    // Simple AI: move toward ball with limited speed
    const targetY = ball.y - computer.height / 2;
    const deltaY = targetY - computer.y;
    const aiStep = Math.sign(deltaY) * Math.min(Math.abs(deltaY), computer.speed);
    computer.y += aiStep;
    computer.y = Math.max(0, Math.min(HEIGHT - computer.height, computer.y));

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collision (top / bottom)
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -1;
    } else if (ball.y + ball.radius >= HEIGHT) {
      ball.y = HEIGHT - ball.radius;
      ball.vy *= -1;
    }

    // Paddle collisions
    // Left paddle
    if (ball.vx < 0) {
      if (rectCircleColliding(player.x, player.y, player.width, player.height, ball.x, ball.y, ball.radius)) {
        // Compute bounce angle based on where the ball hit the paddle
        const relativeY = (ball.y - (player.y + player.height / 2));
        const normalized = relativeY / (player.height / 2); // -1 .. 1
        const maxBounce = Math.PI / 3; // 60 degrees
        const bounceAngle = normalized * maxBounce;
        const speed = Math.min(12, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.05);
        ball.vx = Math.cos(bounceAngle) * speed;
        ball.vy = Math.sin(bounceAngle) * speed;
        if (ball.vx > 0) ball.vx = -ball.vx; // ensure it goes to the right direction
        // nudge ball out of paddle to avoid sticking
        ball.x = player.x + player.width + ball.radius + 0.5;
      }
    } else {
      // Right paddle
      if (rectCircleColliding(computer.x, computer.y, computer.width, computer.height, ball.x, ball.y, ball.radius)) {
        const relativeY = (ball.y - (computer.y + computer.height / 2));
        const normalized = relativeY / (computer.height / 2);
        const maxBounce = Math.PI / 3;
        const bounceAngle = normalized * maxBounce;
        const speed = Math.min(12, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.05);
        ball.vx = -Math.cos(bounceAngle) * speed;
        ball.vy = Math.sin(bounceAngle) * speed;
        if (ball.vx < 0) ball.vx = -ball.vx; // ensure it goes to the left direction
        ball.x = computer.x - ball.radius - 0.5;
      }
    }

    // Score: left miss => computer scores; right miss => player scores
    if (ball.x - ball.radius <= 0) {
      // Computer scores
      computerScore++;
      updateScoreboard();
      paused = true;
      setTimeout(() => {
        paused = false;
        resetBall(false); // serve to computer side
      }, 700);
    } else if (ball.x + ball.radius >= WIDTH) {
      // Player scores
      playerScore++;
      updateScoreboard();
      paused = true;
      setTimeout(() => {
        paused = false;
        resetBall(true); // serve to player side
      }, 700);
    }
  }

  function drawNet() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    const dashHeight = 10;
    const gap = 10;
    let y = 0;
    while (y < HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, y);
      ctx.lineTo(WIDTH / 2, Math.min(HEIGHT, y + dashHeight));
      ctx.stroke();
      y += dashHeight + gap;
    }
    ctx.restore();
  }

  function render() {
    // Clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background subtle
    ctx.fillStyle = '#021425';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Net
    drawNet();

    // Paddles
    drawRect(player.x, player.y, player.width, player.height, '#e9fbff');
    drawRect(computer.x, computer.y, computer.width, computer.height, '#ffd166');

    // Ball
    drawCircle(ball.x, ball.y, ball.radius, '#00d7ff');

    // Small HUD (scores are outside in DOM; but show in canvas too)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, WIDTH, 40);
    ctx.fillStyle = '#bfefff';
    ctx.font = '14px Arial';
    ctx.fillText('Player', 8, 26);
    ctx.fillText('Computer', WIDTH - 92, 26);

    // Pause overlay
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Paused', WIDTH / 2, HEIGHT / 2);
      ctx.textAlign = 'start';
    }
  }

  function loop(timestamp) {
    if (!running) return;
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / (1000 / 60); // normalized to ~60fps steps
    lastTime = timestamp;

    update(dt);
    render();

    if (!paused) requestAnimationFrame(loop);
    else requestAnimationFrame(loop); // keep rendering during pause to show overlay
  }

  // Start
  start();

  // Expose for debug in console if needed
  window.__pong = { player, computer, ball, resetBall };
})();
