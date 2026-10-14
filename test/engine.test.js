const { describe, it } = require('node:test');
const assert = require('node:assert');
const { SlitherEngine, SlitherSolver, EDGE_EMPTY, EDGE_LINE, EDGE_CROSS } = require('../src/slither-engine');
const { LEVELS } = require('../src/levels');

describe('ZenSlither Engine Tests', () => {
  it('should initialize board with correct dimensions and empty edges', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);
    assert.strictEqual(engine.size, 5);
    assert.strictEqual(engine.hEdges.length, 6);
    assert.strictEqual(engine.hEdges[0].length, 5);
    assert.strictEqual(engine.vEdges.length, 5);
    assert.strictEqual(engine.vEdges[0].length, 6);
    assert.strictEqual(engine.getTotalLines(), 0);
  });

  it('should cycle edge states: EMPTY -> LINE -> CROSS -> EMPTY', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);

    assert.strictEqual(engine.getHEdge(0, 0), EDGE_EMPTY);
    engine.toggleHEdge(0, 0);
    assert.strictEqual(engine.getHEdge(0, 0), EDGE_LINE);
    engine.toggleHEdge(0, 0);
    assert.strictEqual(engine.getHEdge(0, 0), EDGE_CROSS);
    engine.toggleHEdge(0, 0);
    assert.strictEqual(engine.getHEdge(0, 0), EDGE_EMPTY);
  });

  it('should support undo and reset', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);

    engine.setHEdge(0, 0, EDGE_LINE);
    engine.setVEdge(0, 0, EDGE_LINE);
    assert.strictEqual(engine.getTotalLines(), 2);

    engine.undo();
    assert.strictEqual(engine.getTotalLines(), 1);
    assert.strictEqual(engine.getVEdge(0, 0), EDGE_EMPTY);

    engine.reset();
    assert.strictEqual(engine.getTotalLines(), 0);
  });

  it('should auto-cross remaining incident edges on vertex reaching degree 2', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);

    // Vertex at (1, 1) has 4 incident edges: V(0, 1), V(1, 1), H(1, 0), H(1, 1)
    engine.setVEdge(0, 1, EDGE_LINE);
    assert.strictEqual(engine.getVertexDegree(1, 1), 1);

    // Toggle H(1, 0) to LINE with autoCross = true
    engine.toggleHEdge(1, 0, true);
    assert.strictEqual(engine.getVertexDegree(1, 1), 2);

    // The remaining incident edges V(1, 1) and H(1, 1) should be automatically marked CROSS
    assert.strictEqual(engine.getVEdge(1, 1), EDGE_CROSS);
    assert.strictEqual(engine.getHEdge(1, 1), EDGE_CROSS);
  });

  it('should verify level completion with precomputed solution', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);

    assert.strictEqual(engine.isLevelCompleted(), false);

    // Apply solution
    for (const [r, c] of level1.solution.H) {
      engine.setHEdge(r, c, EDGE_LINE);
    }
    for (const [r, c] of level1.solution.V) {
      engine.setVEdge(r, c, EDGE_LINE);
    }

    assert.strictEqual(engine.isLevelCompleted(), true);
    const { isSingleLoop } = engine.getComponents();
    assert.strictEqual(isSingleLoop, true);
  });

  it('should provide smart deductive hints for 0 clues', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);

    // Cell (0, 0) has clue 0 in level 1
    const hint = engine.getHint();
    assert.ok(hint);
    assert.strictEqual(hint.type, 'deduction');
    assert.strictEqual(hint.action, 'cross');
  });

  it('should detect premature short closed loop as violation', () => {
    const level1 = LEVELS[0];
    const engine = new SlitherEngine(level1);

    // Form a tiny 1x1 loop at (2, 2)
    engine.setHEdge(2, 2, EDGE_LINE);
    engine.setHEdge(3, 2, EDGE_LINE);
    engine.setVEdge(2, 2, EDGE_LINE);
    engine.setVEdge(2, 3, EDGE_LINE);

    const comp = engine.getComponents();
    assert.strictEqual(comp.components.length, 1);
    assert.strictEqual(comp.components[0].isClosedCycle, true);
    // But it does not satisfy all clues of level 1, so isLevelCompleted is false
    assert.strictEqual(engine.isLevelCompleted(), false);
  });

  it('should verify that all 50 levels have valid solution shapes', () => {
    assert.strictEqual(LEVELS.length, 50);
    for (const level of LEVELS) {
      assert.ok(level.size >= 5 && level.size <= 9);
      assert.ok(level.solution.H.length > 0);
      assert.ok(level.solution.V.length > 0);
      assert.strictEqual(level.clues.length, level.size);
    }
  });
});
