/* Snakes & Ladders - Vanilla JS implementation */

(function() {
  const boardEl = document.getElementById('board');
  const overlayEl = document.getElementById('overlay');
  const tokensEl = document.getElementById('tokens');
  const rollBtn = document.getElementById('rollBtn');
  const resetBtn = document.getElementById('resetBtn');
  const currentPlayerLabel = document.getElementById('currentPlayer');
  const diceFace = document.getElementById('diceFace');
  const logEl = document.getElementById('log');
  const modalEl = document.getElementById('modal');
  const modalMessageEl = document.getElementById('modalMessage');
  const modalCloseBtn = document.getElementById('modalClose');

  const ladders = {
    3: 22,
    5: 8,
    11: 26,
    20: 29,
    28: 55,
    36: 44,
    51: 67,
    71: 91,
  };

  const snakes = {
    17: 4,
    19: 7,
    21: 9,
    43: 34,
    49: 30,
    62: 19,
    64: 60,
    74: 53,
    89: 68,
    95: 24,
    99: 78,
  };

  const players = [
    { id: 0, name: 'Player 1', pos: 1, color: 'p1' },
    { id: 1, name: 'Player 2', pos: 1, color: 'p2' },
  ];
  let currentPlayerIndex = 0;
  let isAnimating = false;

  // Cells matrix for quick lookup by [row][col]
  const cells = [];

  function writeLog(text) {
    const item = document.createElement('div');
    item.className = 'log__item';
    item.textContent = text;
    logEl.prepend(item);
  }

  function initBoard() {
    boardEl.innerHTML = '';
    cells.length = 0;
    for (let r = 0; r < 10; r++) {
      cells[r] = [];
      for (let c = 0; c < 10; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        const num = numberForGridPosition(r, c);
        const label = document.createElement('div');
        label.className = 'cell__num';
        label.textContent = String(num);
        cell.appendChild(label);
        boardEl.appendChild(cell);
        cells[r][c] = cell;
      }
    }
  }

  function numberForGridPosition(rowIndexFromTop, colIndexFromLeft) {
    // Convert grid position to number with serpentine pattern (1 at bottom-left)
    const rowFromBottom = 9 - rowIndexFromTop;
    const base = rowFromBottom * 10;
    if (rowFromBottom % 2 === 0) {
      // left to right
      return base + colIndexFromLeft + 1;
    } else {
      // right to left
      return base + (10 - colIndexFromLeft);
    }
  }

  function gridPositionForNumber(num) {
    // Convert number to grid position (row index from top, col index from left)
    const rowFromBottom = Math.floor((num - 1) / 10);
    const row = 9 - rowFromBottom;
    const offset = (num - 1) % 10;
    const col = rowFromBottom % 2 === 0 ? offset : 9 - offset;
    return { row, col };
  }

  function getCellCenter(num) {
    const { row, col } = gridPositionForNumber(num);
    const cell = cells[row][col];
    const boardRect = boardEl.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const overlayRect = tokensEl.getBoundingClientRect();
    const cx = cellRect.left - boardRect.left - (overlayRect.left - boardRect.left) + cellRect.width / 2;
    const cy = cellRect.top - boardRect.top - (overlayRect.top - boardRect.top) + cellRect.height / 2;
    return { x: cx, y: cy };
  }

  function createOrGetChip(player) {
    let chip = tokensEl.querySelector(`[data-player="${player.id}"]`);
    if (!chip) {
      chip = document.createElement('div');
      chip.className = `chip chip--${player.color}`;
      chip.dataset.player = String(player.id);
      tokensEl.appendChild(chip);
    }
    return chip;
  }

  function positionChips() {
    // Offset tokens a little if in same cell
    const locationToPlayers = new Map();
    for (const p of players) {
      const key = String(p.pos);
      const arr = locationToPlayers.get(key) || [];
      arr.push(p);
      locationToPlayers.set(key, arr);
    }
    for (const p of players) {
      const chip = createOrGetChip(p);
      const { x, y } = getCellCenter(p.pos);
      const stack = locationToPlayers.get(String(p.pos)) || [];
      let dx = 0, dy = 0;
      if (stack.length > 1) {
        const idx = stack.findIndex(s => s.id === p.id);
        const spread = 12;
        dx = (idx - (stack.length - 1) / 2) * spread;
        dy = 10;
        chip.classList.add('chip--stacked');
      } else {
        chip.classList.remove('chip--stacked');
      }
      chip.style.transform = `translate(${x + dx}px, ${y + dy}px)`;
    }
  }

  function drawOverlay() {
    overlayEl.innerHTML = '';
    // Size svg to tokens box
    const rect = tokensEl.getBoundingClientRect();
    overlayEl.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    overlayEl.setAttribute('width', String(rect.width));
    overlayEl.setAttribute('height', String(rect.height));

    // Ladders as straight lines
    for (const [fromStr, to] of Object.entries(ladders)) {
      const from = Number(fromStr);
      const a = getCellCenter(from);
      const b = getCellCenter(to);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      line.classList.add('ladder');
      overlayEl.appendChild(line);
    }

    // Snakes as curved paths
    for (const [fromStr, to] of Object.entries(snakes)) {
      const from = Number(fromStr);
      const a = getCellCenter(from);
      const b = getCellCenter(to);
      const midX = (a.x + b.x) / 2;
      const ctrl1 = `${(a.x + midX) / 2},${a.y - 40}`;
      const ctrl2 = `${(b.x + midX) / 2},${b.y + 40}`;
      const d = `M ${a.x},${a.y} C ${ctrl1} ${ctrl2} ${b.x},${b.y}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.classList.add('snake');
      overlayEl.appendChild(path);
    }
  }

  function setTurnLabel() {
    const p = players[currentPlayerIndex];
    currentPlayerLabel.textContent = `${p.name}'s turn`;
  }

  function randomDice() { return Math.floor(Math.random() * 6) + 1; }

  async function animateStepTo(player, toPos) {
    return new Promise(resolve => {
      const chip = createOrGetChip(player);
      const { x, y } = getCellCenter(toPos);
      chip.style.transition = 'transform 180ms ease';
      requestAnimationFrame(() => {
        chip.style.transform = `translate(${x}px, ${y}px)`;
      });
      setTimeout(resolve, 190);
    });
  }

  async function movePlayerBy(player, steps) {
    if (player.pos + steps > 100) {
      writeLog(`${player.name} rolled ${steps} but needs exact ${100 - player.pos}.`);
      return;
    }
    for (let i = 1; i <= steps; i++) {
      const next = player.pos + 1;
      await animateStepTo(player, next);
      player.pos = next;
    }
  }

  async function maybeSnakeOrLadder(player) {
    const pos = player.pos;
    if (ladders[pos]) {
      await delay(220);
      writeLog(`${player.name} climbs ladder from ${pos} → ${ladders[pos]}`);
      player.pos = ladders[pos];
      await animateStepTo(player, player.pos);
    } else if (snakes[pos]) {
      await delay(220);
      writeLog(`${player.name} bitten by snake at ${pos} → ${snakes[pos]}`);
      player.pos = snakes[pos];
      await animateStepTo(player, player.pos);
    }
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function handleRoll() {
    if (isAnimating) return;
    isAnimating = true;
    rollBtn.disabled = true;
    const player = players[currentPlayerIndex];
    const roll = randomDice();
    diceFace.textContent = String(roll);
    writeLog(`${player.name} rolls ${roll}`);

    await movePlayerBy(player, roll);
    await maybeSnakeOrLadder(player);

    positionChips();

    if (player.pos === 100) {
      writeLog(`${player.name} wins!`);
      showModal(`${player.name} wins! 🎉`);
      isAnimating = false;
      rollBtn.disabled = true;
      return;
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setTurnLabel();
    rollBtn.disabled = false;
    isAnimating = false;
  }

  function showModal(message) {
    modalMessageEl.textContent = message;
    modalEl.hidden = false;
  }

  function closeModal() { modalEl.hidden = true; }

  function resetGame() {
    for (const p of players) { p.pos = 1; }
    currentPlayerIndex = 0;
    diceFace.textContent = '-';
    rollBtn.disabled = false;
    setTurnLabel();
    positionChips();
    drawOverlay();
    writeLog('Game reset');
  }

  function onResize() {
    // Redraw overlay and reposition chips on resize for accurate alignment
    positionChips();
    drawOverlay();
  }

  // Initialize
  initBoard();
  setTurnLabel();
  positionChips();
  drawOverlay();

  rollBtn.addEventListener('click', handleRoll);
  resetBtn.addEventListener('click', resetGame);
  modalCloseBtn.addEventListener('click', () => { closeModal(); resetGame(); });
  window.addEventListener('resize', () => { requestAnimationFrame(onResize); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!modalEl.hidden) { e.preventDefault(); closeModal(); resetGame(); return; }
      if (!rollBtn.disabled) { e.preventDefault(); handleRoll(); }
    }
  });
})();

