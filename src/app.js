/**
 * ZenSlither - Main Game Application Controller
 */

(() => {
  // State
  let currentLevelIndex = 0;
  let engine = null;
  let completedLevels = new Set();
  let autoCross = true;
  let currentMode = 'cycle'; // 'cycle' or 'line' or 'cross'
  let isDragging = false;
  let dragStartEdge = null;
  let hintEdge = null;

  // DOM Elements
  const packNameEl = document.getElementById('pack-name');
  const levelNameEl = document.getElementById('level-name');
  const btnPrevLevel = document.getElementById('btn-prev-level');
  const btnNextLevel = document.getElementById('btn-next-level');
  const btnSound = document.getElementById('btn-sound');
  const btnLevels = document.getElementById('btn-levels');
  const btnUndo = document.getElementById('btn-undo');
  const btnReset = document.getElementById('btn-reset');
  const btnHint = document.getElementById('btn-hint');
  const btnAutoCross = document.getElementById('btn-autocross');
  const hintBanner = document.getElementById('hint-banner');
  const hintText = document.getElementById('hint-text');
  const btnCloseHint = document.getElementById('btn-close-hint');
  const modalLevels = document.getElementById('modal-levels');
  const btnCloseLevels = document.getElementById('btn-close-levels');
  const packContainer = document.getElementById('pack-container');
  const modalVictory = document.getElementById('modal-victory');
  const btnNextVictory = document.getElementById('btn-next-victory');
  const boardSvg = document.getElementById('board-svg');
  const gameMessageEl = document.getElementById('game-message');
  const segmentCountEl = document.getElementById('segment-count');

  // Load progress from localStorage
  function loadProgress() {
    try {
      const saved = localStorage.getItem('zenslither_completed');
      if (saved) {
        completedLevels = new Set(JSON.parse(saved));
      }
      const lastLevel = localStorage.getItem('zenslither_level');
      if (lastLevel !== null) {
        const idx = parseInt(lastLevel, 10);
        if (!isNaN(idx) && idx >= 0 && idx < LEVELS.length) {
          currentLevelIndex = idx;
        }
      }
      const savedAutoCross = localStorage.getItem('zenslither_autocross');
      if (savedAutoCross !== null) {
        autoCross = savedAutoCross === 'true';
      }
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem('zenslither_completed', JSON.stringify([...completedLevels]));
      localStorage.setItem('zenslither_level', String(currentLevelIndex));
      localStorage.setItem('zenslither_autocross', String(autoCross));
    } catch (e) {}
  }

  function init() {
    loadProgress();
    updateSoundBtn();
    updateAutoCrossBtn();
    loadLevel(currentLevelIndex);
    attachEvents();
  }

  function updateSoundBtn() {
    btnSound.textContent = sounds.enabled ? '🔊' : '🔇';
    btnSound.setAttribute('aria-pressed', String(sounds.enabled));
  }

  function updateAutoCrossBtn() {
    if (autoCross) {
      btnAutoCross.classList.add('active');
    } else {
      btnAutoCross.classList.remove('active');
    }
    btnAutoCross.setAttribute('aria-pressed', String(autoCross));
  }

  function updateBoardStats() {
    const totalLines = engine ? engine.getTotalLines() : 0;
    segmentCountEl.textContent = `${totalLines} ${totalLines === 1 ? 'segment' : 'segments'}`;
    gameMessageEl.textContent = totalLines === 0
      ? 'Choose an edge to begin your loop.'
      : 'Your loop is taking shape.';
  }

  function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    currentLevelIndex = index;
    saveProgress();

    const level = LEVELS[index];
    engine = new SlitherEngine(level);
    hintEdge = null;
    hideHint();

    packNameEl.textContent = level.packName;
    levelNameEl.textContent = `Level ${level.id} (${level.size}×${level.size})`;

    btnPrevLevel.disabled = index === 0;
    btnNextLevel.disabled = index === LEVELS.length - 1;

    renderBoard();
  }

  function renderBoard() {
    const size = engine.size;
    const padding = 24;
    const cellSize = 64;
    const svgWidth = padding * 2 + size * cellSize;
    const svgHeight = padding * 2 + size * cellSize;

    boardSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    boardSvg.innerHTML = '';

    const violations = engine.getViolations();
    const overClueSet = new Set(violations.overCluedCells.map(c => `${c.r},${c.c}`));
    const underClueSet = new Set(violations.underCluedCells.map(c => `${c.r},${c.c}`));

    // 1. Render Cell Clues
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const clue = engine.clues[r][c];
        if (clue >= 0) {
          const cx = padding + (c + 0.5) * cellSize;
          const cy = padding + (r + 0.5) * cellSize;

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', cx);
          text.setAttribute('y', cy);
          text.setAttribute('class', 'cell-clue');
          text.textContent = clue;

          if (engine.isCellSatisfied(r, c)) {
            text.classList.add('satisfied');
          }
          if (overClueSet.has(`${r},${c}`) || underClueSet.has(`${r},${c}`)) {
            text.classList.add('violated');
          }

          boardSvg.appendChild(text);
        }
      }
    }

    // 2. Render Horizontal Edges
    for (let r = 0; r <= size; r++) {
      for (let c = 0; c < size; c++) {
        const x1 = padding + c * cellSize;
        const y1 = padding + r * cellSize;
        const x2 = padding + (c + 1) * cellSize;
        const y2 = y1;

        const state = engine.getHEdge(r, c);

        // Visual Edge
        const visual = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        visual.setAttribute('x1', x1);
        visual.setAttribute('y1', y1);
        visual.setAttribute('x2', x2);
        visual.setAttribute('y2', y2);
        visual.setAttribute('class', 'edge-visual');
        visual.dataset.type = 'H';
        visual.dataset.r = r;
        visual.dataset.c = c;

        if (state === EDGE_LINE) {
          visual.classList.add('line');
        } else if (state === EDGE_CROSS) {
          visual.classList.add('cross-mark');
        }

        if (hintEdge && hintEdge.type === 'H' && hintEdge.r === r && hintEdge.c === c) {
          visual.classList.add('highlight-edge');
        }

        // Hitbox
        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hitbox.setAttribute('x1', x1);
        hitbox.setAttribute('y1', y1);
        hitbox.setAttribute('x2', x2);
        hitbox.setAttribute('y2', y2);
        hitbox.setAttribute('class', 'edge-hitbox');
        hitbox.dataset.type = 'H';
        hitbox.dataset.r = r;
        hitbox.dataset.c = c;

        boardSvg.appendChild(hitbox);
        boardSvg.appendChild(visual);

        // Render Cross Glyph if CROSS
        if (state === EDGE_CROSS) {
          const crossText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          crossText.setAttribute('x', (x1 + x2) / 2);
          crossText.setAttribute('y', y1);
          crossText.setAttribute('class', 'edge-cross-glyph');
          crossText.textContent = '×';
          boardSvg.appendChild(crossText);
        }
      }
    }

    // 3. Render Vertical Edges
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size; c++) {
        const x1 = padding + c * cellSize;
        const y1 = padding + r * cellSize;
        const x2 = x1;
        const y2 = padding + (r + 1) * cellSize;

        const state = engine.getVEdge(r, c);

        // Visual Edge
        const visual = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        visual.setAttribute('x1', x1);
        visual.setAttribute('y1', y1);
        visual.setAttribute('x2', x2);
        visual.setAttribute('y2', y2);
        visual.setAttribute('class', 'edge-visual');
        visual.dataset.type = 'V';
        visual.dataset.r = r;
        visual.dataset.c = c;

        if (state === EDGE_LINE) {
          visual.classList.add('line');
        } else if (state === EDGE_CROSS) {
          visual.classList.add('cross-mark');
        }

        if (hintEdge && hintEdge.type === 'V' && hintEdge.r === r && hintEdge.c === c) {
          visual.classList.add('highlight-edge');
        }

        // Hitbox
        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hitbox.setAttribute('x1', x1);
        hitbox.setAttribute('y1', y1);
        hitbox.setAttribute('x2', x2);
        hitbox.setAttribute('y2', y2);
        hitbox.setAttribute('class', 'edge-hitbox');
        hitbox.dataset.type = 'V';
        hitbox.dataset.r = r;
        hitbox.dataset.c = c;

        boardSvg.appendChild(hitbox);
        boardSvg.appendChild(visual);

        // Render Cross Glyph if CROSS
        if (state === EDGE_CROSS) {
          const crossText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          crossText.setAttribute('x', x1);
          crossText.setAttribute('y', (y1 + y2) / 2);
          crossText.setAttribute('class', 'edge-cross-glyph');
          crossText.textContent = '×';
          boardSvg.appendChild(crossText);
        }
      }
    }

    // 4. Render Lattice Pins (Dots)
    for (let vr = 0; vr <= size; vr++) {
      for (let vc = 0; vc <= size; vc++) {
        const px = padding + vc * cellSize;
        const py = padding + vr * cellSize;

        const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pin.setAttribute('cx', px);
        pin.setAttribute('cy', py);
        pin.setAttribute('r', 4.5);
        pin.setAttribute('class', 'pin');

        const degree = engine.getVertexDegree(vr, vc);
        if (degree === 2) {
          pin.classList.add('active');
        }

        boardSvg.appendChild(pin);
      }
    }
    updateBoardStats();
  }

  function handleEdgeInteraction(type, r, c) {
    let nextState;
    if (type === 'H') {
      nextState = engine.toggleHEdge(r, c, autoCross);
    } else {
      nextState = engine.toggleVEdge(r, c, autoCross);
    }

    if (nextState === EDGE_LINE) {
      sounds.playLine();
    } else if (nextState === EDGE_CROSS) {
      sounds.playCross();
    } else {
      sounds.playClear();
    }

    // Check if any neighboring cell just reached satisfaction
    const checkCells = [];
    if (type === 'H') {
      if (r > 0 && r - 1 < engine.size && c < engine.size) checkCells.push([r - 1, c]);
      if (r < engine.size && c < engine.size) checkCells.push([r, c]);
    } else {
      if (r < engine.size && c > 0 && c - 1 < engine.size) checkCells.push([r, c - 1]);
      if (r < engine.size && c < engine.size) checkCells.push([r, c]);
    }

    for (const [cr, cc] of checkCells) {
      if (engine.isCellSatisfied(cr, cc) && engine.clues[cr][cc] > 0) {
        sounds.playClueChime();
        break;
      }
    }

    hintEdge = null;
    renderBoard();
    checkVictory();
  }

  function checkVictory() {
    if (engine.isLevelCompleted()) {
      sounds.playVictory();
      completedLevels.add(LEVELS[currentLevelIndex].id);
      saveProgress();

      setTimeout(() => {
        showVictoryModal();
      }, 350);
    }
  }

  function showVictoryModal() {
    modalVictory.classList.remove('hidden');
  }

  function hideVictoryModal() {
    modalVictory.classList.add('hidden');
  }

  function showHint() {
    const hint = engine.getHint();
    if (!hint) return;
    hintText.textContent = hint.message;
    hintEdge = hint.edge || null;
    hintBanner.classList.remove('hidden');
    renderBoard();
    sounds.playTap();
  }

  function hideHint() {
    hintBanner.classList.add('hidden');
    hintEdge = null;
    renderBoard();
  }

  function renderLevelSelector() {
    packContainer.innerHTML = '';

    // Group levels by pack
    const packs = {};
    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      if (!packs[level.packId]) {
        packs[level.packId] = {
          id: level.packId,
          name: level.packName,
          size: level.size,
          levels: []
        };
      }
      packs[level.packId].levels.push({ index: i, level });
    }

    for (const packKey in packs) {
      const pack = packs[packKey];
      const section = document.createElement('div');
      section.className = 'pack-section';

      const title = document.createElement('div');
      title.className = 'pack-title';
      title.innerHTML = `<span>${pack.name} (${pack.size}×${pack.size})</span>`;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'level-grid';

      for (const item of pack.levels) {
        const btn = document.createElement('button');
        btn.className = 'level-select-btn';
        btn.textContent = item.level.id;

        if (item.index === currentLevelIndex) {
          btn.classList.add('current');
        }
        if (completedLevels.has(item.level.id)) {
          btn.classList.add('completed');
        }

        btn.addEventListener('click', () => {
          modalLevels.classList.add('hidden');
          loadLevel(item.index);
          sounds.playTap();
        });

        grid.appendChild(btn);
      }

      section.appendChild(grid);
      packContainer.appendChild(section);
    }
  }

  function attachEvents() {
    // Sound toggle
    btnSound.addEventListener('click', () => {
      sounds.toggleSound();
      updateSoundBtn();
    });

    // Level navigation
    btnPrevLevel.addEventListener('click', () => {
      if (currentLevelIndex > 0) {
        loadLevel(currentLevelIndex - 1);
        sounds.playTap();
      }
    });

    btnNextLevel.addEventListener('click', () => {
      if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
        sounds.playTap();
      }
    });

    // Action buttons
    btnUndo.addEventListener('click', () => {
      if (engine.undo()) {
        sounds.playClear();
        hintEdge = null;
        renderBoard();
      }
    });

    btnReset.addEventListener('click', () => {
      engine.reset();
      sounds.playClear();
      hintEdge = null;
      hideHint();
      renderBoard();
    });

    btnHint.addEventListener('click', () => {
      showHint();
    });

    btnCloseHint.addEventListener('click', () => {
      hideHint();
    });

    btnAutoCross.addEventListener('click', () => {
      autoCross = !autoCross;
      saveProgress();
      updateAutoCrossBtn();
      sounds.playTap();
    });

    // Level selector modal
    btnLevels.addEventListener('click', () => {
      renderLevelSelector();
      modalLevels.classList.remove('hidden');
      sounds.playTap();
    });

    btnCloseLevels.addEventListener('click', () => {
      modalLevels.classList.add('hidden');
    });

    modalLevels.addEventListener('click', (e) => {
      if (e.target === modalLevels) {
        modalLevels.classList.add('hidden');
      }
    });

    // Victory modal
    btnNextVictory.addEventListener('click', () => {
      hideVictoryModal();
      if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
      } else {
        renderLevelSelector();
        modalLevels.classList.remove('hidden');
      }
    });

    modalVictory.addEventListener('click', (e) => {
      if (e.target === modalVictory) {
        hideVictoryModal();
      }
    });

    // Board Touch / Pointer Interaction
    boardSvg.addEventListener('pointerdown', (e) => {
      const hitbox = e.target.closest('.edge-hitbox');
      if (!hitbox) return;

      const type = hitbox.dataset.type;
      const r = parseInt(hitbox.dataset.r, 10);
      const c = parseInt(hitbox.dataset.c, 10);
      if (isNaN(r) || isNaN(c)) return;

      isDragging = true;
      dragStartEdge = `${type}_${r}_${c}`;
      handleEdgeInteraction(type, r, c);
    });

    boardSvg.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;
      const hitbox = target.closest('.edge-hitbox');
      if (!hitbox) return;

      const type = hitbox.dataset.type;
      const r = parseInt(hitbox.dataset.r, 10);
      const c = parseInt(hitbox.dataset.c, 10);
      if (isNaN(r) || isNaN(c)) return;

      const edgeKey = `${type}_${r}_${c}`;
      if (edgeKey !== dragStartEdge) {
        // Only toggle if currently empty (drawing continuous line path)
        const currentState = type === 'H' ? engine.getHEdge(r, c) : engine.getVEdge(r, c);
        if (currentState === EDGE_EMPTY) {
          dragStartEdge = edgeKey;
          handleEdgeInteraction(type, r, c);
        }
      }
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
      dragStartEdge = null;
    });

    window.addEventListener('pointercancel', () => {
      isDragging = false;
      dragStartEdge = null;
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' || e.key === 'Z') {
        if (engine.undo()) {
          sounds.playClear();
          renderBoard();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        engine.reset();
        sounds.playClear();
        renderBoard();
      } else if (e.key === 'h' || e.key === 'H') {
        showHint();
      } else if (e.key === 'ArrowRight') {
        if (currentLevelIndex < LEVELS.length - 1) {
          loadLevel(currentLevelIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentLevelIndex > 0) {
          loadLevel(currentLevelIndex - 1);
        }
      }
    });
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
