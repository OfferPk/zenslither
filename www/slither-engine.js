/**
 * ZenSlither - Core Game Logic & Constraint Solver Engine
 *
 * Slitherlink (Fences / Takegaki / Loopy) rules:
 * 1. An N x N grid of cells with (N+1) x (N+1) lattice vertices (pins).
 * 2. Numbers in cells (0, 1, 2, 3) indicate how many of the 4 edges around that cell are in the loop.
 * 3. Empty cells (without numbers) can have any number of edges in the loop.
 * 4. The edges in the loop must form a single, continuous, non-intersecting closed loop.
 * 5. Every vertex in the grid must have degree 0 or 2 (no dead ends, no branches).
 */

const EDGE_EMPTY = 0;
const EDGE_LINE = 1;
const EDGE_CROSS = 2;

class SlitherEngine {
  constructor(level) {
    this.level = level;
    this.size = level.size; // N cells, (N+1) pins
    this.clues = level.clues; // N x N array (-1 for empty, 0..3 for clue)

    // Horizontal edges: (N+1) rows x N columns
    this.hEdges = Array.from({ length: this.size + 1 }, () =>
      Array(this.size).fill(EDGE_EMPTY)
    );

    // Vertical edges: N rows x (N+1) columns
    this.vEdges = Array.from({ length: this.size }, () =>
      Array(this.size + 1).fill(EDGE_EMPTY)
    );

    this.history = [];
  }

  isInsideH(r, c) {
    return r >= 0 && r <= this.size && c >= 0 && c < this.size;
  }

  isInsideV(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c <= this.size;
  }

  getHEdge(r, c) {
    if (!this.isInsideH(r, c)) return null;
    return this.hEdges[r][c];
  }

  getVEdge(r, c) {
    if (!this.isInsideV(r, c)) return null;
    return this.vEdges[r][c];
  }

  setHEdge(r, c, state, recordHistory = true) {
    if (!this.isInsideH(r, c)) return false;
    const prev = this.hEdges[r][c];
    if (prev === state) return false;

    if (recordHistory) {
      this.history.push({ type: 'H', r, c, prev, next: state });
    }
    this.hEdges[r][c] = state;
    return true;
  }

  setVEdge(r, c, state, recordHistory = true) {
    if (!this.isInsideV(r, c)) return false;
    const prev = this.vEdges[r][c];
    if (prev === state) return false;

    if (recordHistory) {
      this.history.push({ type: 'V', r, c, prev, next: state });
    }
    this.vEdges[r][c] = state;
    return true;
  }

  toggleHEdge(r, c, autoCross = false) {
    if (!this.isInsideH(r, c)) return null;
    const current = this.hEdges[r][c];
    let next;
    if (current === EDGE_EMPTY) next = EDGE_LINE;
    else if (current === EDGE_LINE) next = EDGE_CROSS;
    else next = EDGE_EMPTY;

    this.setHEdge(r, c, next, true);

    if (next === EDGE_LINE && autoCross) {
      // Check vertices (r, c) and (r, c+1)
      this.checkAndAutoCrossVertex(r, c);
      this.checkAndAutoCrossVertex(r, c + 1);
    }

    return next;
  }

  toggleVEdge(r, c, autoCross = false) {
    if (!this.isInsideV(r, c)) return null;
    const current = this.vEdges[r][c];
    let next;
    if (current === EDGE_EMPTY) next = EDGE_LINE;
    else if (current === EDGE_LINE) next = EDGE_CROSS;
    else next = EDGE_EMPTY;

    this.setVEdge(r, c, next, true);

    if (next === EDGE_LINE && autoCross) {
      // Check vertices (r, c) and (r+1, c)
      this.checkAndAutoCrossVertex(r, c);
      this.checkAndAutoCrossVertex(r + 1, c);
    }

    return next;
  }

  /**
   * Return incident edges for vertex (vr, vc)
   * 0 <= vr <= N, 0 <= vc <= N
   */
  getIncidentEdges(vr, vc) {
    const list = [];
    // Up: V(vr - 1, vc)
    if (vr > 0) {
      list.push({ type: 'V', r: vr - 1, c: vc, state: this.vEdges[vr - 1][vc], other: { r: vr - 1, c: vc } });
    }
    // Down: V(vr, vc)
    if (vr < this.size) {
      list.push({ type: 'V', r: vr, c: vc, state: this.vEdges[vr][vc], other: { r: vr + 1, c: vc } });
    }
    // Left: H(vr, vc - 1)
    if (vc > 0) {
      list.push({ type: 'H', r: vr, c: vc - 1, state: this.hEdges[vr][vc - 1], other: { r: vr, c: vc - 1 } });
    }
    // Right: H(vr, vc)
    if (vc < this.size) {
      list.push({ type: 'H', r: vr, c: vc, state: this.hEdges[vr][vc], other: { r: vr, c: vc + 1 } });
    }
    return list;
  }

  getVertexDegree(vr, vc) {
    const edges = this.getIncidentEdges(vr, vc);
    return edges.filter(e => e.state === EDGE_LINE).length;
  }

  checkAndAutoCrossVertex(vr, vc) {
    const edges = this.getIncidentEdges(vr, vc);
    const lineCount = edges.filter(e => e.state === EDGE_LINE).length;
    if (lineCount === 2) {
      for (const edge of edges) {
        if (edge.state === EDGE_EMPTY) {
          if (edge.type === 'H') {
            this.setHEdge(edge.r, edge.c, EDGE_CROSS, true);
          } else {
            this.setVEdge(edge.r, edge.c, EDGE_CROSS, true);
          }
        }
      }
    }
  }

  /**
   * Return the 4 bounding edges of cell (r, c)
   */
  getCellEdges(r, c) {
    if (r < 0 || r >= this.size || c < 0 || c >= this.size) return [];
    return [
      { type: 'H', r: r, c: c, state: this.hEdges[r][c] },         // Top
      { type: 'H', r: r + 1, c: c, state: this.hEdges[r + 1][c] }, // Bottom
      { type: 'V', r: r, c: c, state: this.vEdges[r][c] },         // Left
      { type: 'V', r: r, c: c + 1, state: this.vEdges[r][c + 1] }  // Right
    ];
  }

  getCellLineCount(r, c) {
    return this.getCellEdges(r, c).filter(e => e.state === EDGE_LINE).length;
  }

  getCellCrossCount(r, c) {
    return this.getCellEdges(r, c).filter(e => e.state === EDGE_CROSS).length;
  }

  isCellSatisfied(r, c) {
    const clue = this.clues[r][c];
    if (clue < 0) return true;
    return this.getCellLineCount(r, c) === clue;
  }

  undo() {
    if (this.history.length === 0) return false;
    const action = this.history.pop();
    if (action.type === 'H') {
      this.hEdges[action.r][action.c] = action.prev;
    } else {
      this.vEdges[action.r][action.c] = action.prev;
    }
    return true;
  }

  reset() {
    this.history = [];
    for (let r = 0; r <= this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.hEdges[r][c] = EDGE_EMPTY;
      }
    }
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c <= this.size; c++) {
        this.vEdges[r][c] = EDGE_EMPTY;
      }
    }
  }

  /**
   * Count total lines on the board
   */
  getTotalLines() {
    let count = 0;
    for (let r = 0; r <= this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.hEdges[r][c] === EDGE_LINE) count++;
      }
    }
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c <= this.size; c++) {
        if (this.vEdges[r][c] === EDGE_LINE) count++;
      }
    }
    return count;
  }

  /**
   * Find all connected components of lines and identify any loops.
   */
  getComponents() {
    const adj = new Map();
    const key = (vr, vc) => `${vr},${vc}`;

    let totalEdges = 0;

    // Collect all vertices and active line edges
    for (let r = 0; r <= this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.hEdges[r][c] === EDGE_LINE) {
          totalEdges++;
          const u = key(r, c);
          const v = key(r, c + 1);
          if (!adj.has(u)) adj.set(u, []);
          if (!adj.has(v)) adj.set(v, []);
          adj.get(u).push(v);
          adj.get(v).push(u);
        }
      }
    }

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c <= this.size; c++) {
        if (this.vEdges[r][c] === EDGE_LINE) {
          totalEdges++;
          const u = key(r, c);
          const v = key(r + 1, c);
          if (!adj.has(u)) adj.set(u, []);
          if (!adj.has(v)) adj.set(v, []);
          adj.get(u).push(v);
          adj.get(v).push(u);
        }
      }
    }

    if (totalEdges === 0) {
      return { totalEdges: 0, components: [], isSingleLoop: false };
    }

    // Traverse components
    const visited = new Set();
    const components = [];

    for (const start of adj.keys()) {
      if (visited.has(start)) continue;

      const compNodes = [];
      const queue = [start];
      visited.add(start);

      let compEdgeCount = 0;
      let allDegree2 = true;

      while (queue.length > 0) {
        const u = queue.shift();
        compNodes.push(u);
        const neighbors = adj.get(u) || [];
        compEdgeCount += neighbors.length;
        if (neighbors.length !== 2) {
          allDegree2 = false;
        }

        for (const v of neighbors) {
          if (!visited.has(v)) {
            visited.add(v);
            queue.push(v);
          }
        }
      }

      // Each undirected edge was counted twice
      compEdgeCount = compEdgeCount / 2;
      const isClosedCycle = allDegree2 && compNodes.length >= 4 && compEdgeCount === compNodes.length;
      components.push({
        nodes: compNodes,
        edgeCount: compEdgeCount,
        isClosedCycle
      });
    }

    const isSingleLoop = components.length === 1 && components[0].isClosedCycle;

    return {
      totalEdges,
      components,
      isSingleLoop
    };
  }

  getViolations() {
    const violations = {
      overCluedCells: [],
      underCluedCells: [],
      degreeViolations: [],
      prematureLoops: []
    };

    // 1. Cell violations
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const clue = this.clues[r][c];
        if (clue >= 0) {
          const lines = this.getCellLineCount(r, c);
          const crosses = this.getCellCrossCount(r, c);
          if (lines > clue) {
            violations.overCluedCells.push({ r, c, clue, lines });
          } else if (4 - crosses < clue) {
            violations.underCluedCells.push({ r, c, clue, available: 4 - crosses });
          }
        }
      }
    }

    // 2. Vertex degree violations
    for (let vr = 0; vr <= this.size; vr++) {
      for (let vc = 0; vc <= this.size; vc++) {
        const degree = this.getVertexDegree(vr, vc);
        if (degree > 2) {
          violations.degreeViolations.push({ vr, vc, degree });
        }
      }
    }

    // 3. Check for multiple loops
    const { components } = this.getComponents();
    if (components.length > 1) {
      for (const comp of components) {
        if (comp.isClosedCycle) {
          violations.prematureLoops.push(comp);
        }
      }
    }

    return violations;
  }

  isLevelCompleted() {
    // 1. Total lines must be at least 4
    const totalLines = this.getTotalLines();
    if (totalLines < 4) return false;

    // 2. Every vertex must have degree 0 or 2
    for (let vr = 0; vr <= this.size; vr++) {
      for (let vc = 0; vc <= this.size; vc++) {
        const degree = this.getVertexDegree(vr, vc);
        if (degree !== 0 && degree !== 2) return false;
      }
    }

    // 3. Must be exactly one single closed loop
    const { isSingleLoop } = this.getComponents();
    if (!isSingleLoop) return false;

    // 4. All cell clues must be satisfied
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const clue = this.clues[r][c];
        if (clue >= 0 && this.getCellLineCount(r, c) !== clue) {
          return false;
        }
      }
    }

    return true;
  }

  getHint() {
    // 1. Check existing violations first
    const violations = this.getViolations();
    if (violations.overCluedCells.length > 0) {
      const v = violations.overCluedCells[0];
      return {
        type: 'violation',
        message: `Cell (${v.r + 1}, ${v.c + 1}) has ${v.lines} lines, exceeding its clue of ${v.clue}.`,
        cell: { r: v.r, c: v.c }
      };
    }
    if (violations.degreeViolations.length > 0) {
      const v = violations.degreeViolations[0];
      return {
        type: 'violation',
        message: `Lattice pin at (${v.vr + 1}, ${v.vc + 1}) has ${v.degree} lines. Pins can only connect at most 2 lines.`,
        pin: { vr: v.vr, vc: v.vc }
      };
    }
    if (violations.underCluedCells.length > 0) {
      const v = violations.underCluedCells[0];
      return {
        type: 'violation',
        message: `Cell (${v.r + 1}, ${v.c + 1}) cannot satisfy clue ${v.clue} because too many edges are crossed out.`,
        cell: { r: v.r, c: v.c }
      };
    }

    // 2. Zero-clue deduction: All 4 surrounding edges must be crossed out
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.clues[r][c] === 0) {
          const edges = this.getCellEdges(r, c);
          const emptyEdge = edges.find(e => e.state === EDGE_EMPTY);
          if (emptyEdge) {
            return {
              type: 'deduction',
              action: 'cross',
              message: `A cell with clue 0 can have no lines around it. Its edges can safely be crossed out.`,
              edge: emptyEdge
            };
          }
        }
      }
    }

    // 3. Cell clue satisfied: remaining empty edges must be crossed out
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const clue = this.clues[r][c];
        if (clue > 0 && this.getCellLineCount(r, c) === clue) {
          const edges = this.getCellEdges(r, c);
          const emptyEdge = edges.find(e => e.state === EDGE_EMPTY);
          if (emptyEdge) {
            return {
              type: 'deduction',
              action: 'cross',
              message: `Cell (${r + 1}, ${c + 1}) already has all ${clue} required lines. Its remaining edges can be crossed out.`,
              edge: emptyEdge
            };
          }
        }
      }
    }

    // 4. Forced lines on cell: available non-cross edges equal remaining clue
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const clue = this.clues[r][c];
        if (clue > 0) {
          const lines = this.getCellLineCount(r, c);
          const needed = clue - lines;
          if (needed > 0) {
            const edges = this.getCellEdges(r, c);
            const emptyEdges = edges.filter(e => e.state === EDGE_EMPTY);
            if (emptyEdges.length === needed) {
              return {
                type: 'deduction',
                action: 'line',
                message: `Cell (${r + 1}, ${c + 1}) needs ${needed} more line(s) and only has ${emptyEdges.length} available edge(s).`,
                edge: emptyEdges[0]
              };
            }
          }
        }
      }
    }

    // 5. Pin with degree 2: remaining incident edges must be crossed out
    for (let vr = 0; vr <= this.size; vr++) {
      for (let vc = 0; vc <= this.size; vc++) {
        const edges = this.getIncidentEdges(vr, vc);
        const lineCount = edges.filter(e => e.state === EDGE_LINE).length;
        if (lineCount === 2) {
          const empty = edges.find(e => e.state === EDGE_EMPTY);
          if (empty) {
            return {
              type: 'deduction',
              action: 'cross',
              message: `The pin at (${vr + 1}, ${vc + 1}) already connects 2 loop lines. Its other edges must be crossed out.`,
              edge: empty
            };
          }
        }
      }
    }

    // 6. Pin with degree 1: cannot dead-end, must extend along the only available edge
    for (let vr = 0; vr <= this.size; vr++) {
      for (let vc = 0; vc <= this.size; vc++) {
        const edges = this.getIncidentEdges(vr, vc);
        const lineCount = edges.filter(e => e.state === EDGE_LINE).length;
        if (lineCount === 1) {
          const emptyEdges = edges.filter(e => e.state === EDGE_EMPTY);
          if (emptyEdges.length === 1) {
            return {
              type: 'deduction',
              action: 'line',
              message: `The line at pin (${vr + 1}, ${vc + 1}) cannot dead-end and must continue through its only open path.`,
              edge: emptyEdges[0]
            };
          }
        }
      }
    }

    // 7. Corner 3 deduction: in grid corner (0,0), (0,N-1), (N-1,0), (N-1,N-1)
    const corners = [
      { r: 0, c: 0, edges: [{ type: 'H', r: 0, c: 0 }, { type: 'V', r: 0, c: 0 }] },
      { r: 0, c: this.size - 1, edges: [{ type: 'H', r: 0, c: this.size - 1 }, { type: 'V', r: 0, c: this.size }] },
      { r: this.size - 1, c: 0, edges: [{ type: 'H', r: this.size, c: 0 }, { type: 'V', r: this.size - 1, c: 0 }] },
      { r: this.size - 1, c: this.size - 1, edges: [{ type: 'H', r: this.size, c: this.size - 1 }, { type: 'V', r: this.size - 1, c: this.size }] }
    ];

    for (const corner of corners) {
      if (this.clues[corner.r][corner.c] === 3) {
        for (const e of corner.edges) {
          const curr = e.type === 'H' ? this.hEdges[e.r][e.c] : this.vEdges[e.r][e.c];
          if (curr === EDGE_EMPTY) {
            return {
              type: 'deduction',
              action: 'line',
              message: `A 3 in a grid corner always requires both outer corner edges to be part of the loop.`,
              edge: e
            };
          }
        }
      }
    }

    return {
      type: 'info',
      message: 'Look closely at cells with 3s or pins where lines must continue to avoid dead ends.',
      edge: null
    };
  }
}

/**
 * SlitherSolver: Depth-first constraint propagation solver
 * Verifies solution uniqueness for level generation and testing.
 */
class SlitherSolver {
  constructor(size, clues) {
    this.size = size;
    this.clues = clues;
    this.engine = new SlitherEngine({ size, clues });
  }

  solve(maxSolutions = 2) {
    const size = this.size;
    const clues = this.clues;
    const solutions = [];
    const engine = this.engine;

    function snapshot() {
      return {
        h: engine.hEdges.map(r => [...r]),
        v: engine.vEdges.map(r => [...r])
      };
    }

    function restore(snap) {
      for (let r = 0; r <= size; r++) {
        for (let c = 0; c < size; c++) {
          engine.hEdges[r][c] = snap.h[r][c];
        }
      }
      for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size; c++) {
          engine.vEdges[r][c] = snap.v[r][c];
        }
      }
    }

    function propagate() {
      let changed = true;
      while (changed) {
        changed = false;

        // 1. Cell clues
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const clue = clues[r][c];
            if (clue >= 0) {
              const edges = engine.getCellEdges(r, c);
              let lines = 0;
              let empties = [];
              let crosses = 0;
              for (const e of edges) {
                if (e.state === EDGE_LINE) lines++;
                else if (e.state === EDGE_CROSS) crosses++;
                else empties.push(e);
              }

              if (lines > clue) return false;
              if (4 - crosses < clue) return false;

              if (lines === clue && empties.length > 0) {
                for (const e of empties) {
                  if (e.type === 'H') engine.hEdges[e.r][e.c] = EDGE_CROSS;
                  else engine.vEdges[e.r][e.c] = EDGE_CROSS;
                  changed = true;
                }
              } else if (clue - lines === empties.length && empties.length > 0) {
                for (const e of empties) {
                  if (e.type === 'H') engine.hEdges[e.r][e.c] = EDGE_LINE;
                  else engine.vEdges[e.r][e.c] = EDGE_LINE;
                  changed = true;
                }
              }
            }
          }
        }

        // 2. Vertex constraints
        for (let vr = 0; vr <= size; vr++) {
          for (let vc = 0; vc <= size; vc++) {
            const edges = engine.getIncidentEdges(vr, vc);
            let lines = 0;
            let empties = [];
            for (const e of edges) {
              if (e.state === EDGE_LINE) lines++;
              else if (e.state === EDGE_EMPTY) empties.push(e);
            }

            if (lines > 2) return false;
            if (lines === 2 && empties.length > 0) {
              for (const e of empties) {
                if (e.type === 'H') engine.hEdges[e.r][e.c] = EDGE_CROSS;
                else engine.vEdges[e.r][e.c] = EDGE_CROSS;
                changed = true;
              }
            } else if (lines === 1 && empties.length === 1) {
              const e = empties[0];
              if (e.type === 'H') engine.hEdges[e.r][e.c] = EDGE_LINE;
              else engine.vEdges[e.r][e.c] = EDGE_LINE;
              changed = true;
            } else if (lines === 1 && empties.length === 0) {
              return false; // dead end
            } else if (lines === 0 && empties.length === 1) {
              const e = empties[0];
              if (e.type === 'H') engine.hEdges[e.r][e.c] = EDGE_CROSS;
              else engine.vEdges[e.r][e.c] = EDGE_CROSS;
              changed = true;
            }
          }
        }

        // 3. Premature loop check
        const { components } = engine.getComponents();
        for (const comp of components) {
          if (comp.isClosedCycle) {
            if (!engine.isLevelCompleted()) {
              return false;
            }
          }
        }
      }
      return true;
    }

    // Collect all unassigned edges
    function getNextUnassignedEdge() {
      // Find edge that has incident lines or is near a clue
      let bestEdge = null;
      let maxScore = -1;

      for (let r = 0; r <= size; r++) {
        for (let c = 0; c < size; c++) {
          if (engine.hEdges[r][c] === EDGE_EMPTY) {
            let score = 0;
            if (engine.getVertexDegree(r, c) > 0) score += 5;
            if (engine.getVertexDegree(r, c + 1) > 0) score += 5;
            if (r > 0 && r - 1 < size && c < size && clues[r - 1][c] >= 0) score += 2;
            if (r < size && c < size && clues[r][c] >= 0) score += 2;
            if (score > maxScore) {
              maxScore = score;
              bestEdge = { type: 'H', r, c };
            }
          }
        }
      }

      for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size; c++) {
          if (engine.vEdges[r][c] === EDGE_EMPTY) {
            let score = 0;
            if (engine.getVertexDegree(r, c) > 0) score += 5;
            if (engine.getVertexDegree(r + 1, c) > 0) score += 5;
            if (r < size && c > 0 && c - 1 < size && clues[r][c - 1] >= 0) score += 2;
            if (r < size && c < size && clues[r][c] >= 0) score += 2;
            if (score > maxScore) {
              maxScore = score;
              bestEdge = { type: 'V', r, c };
            }
          }
        }
      }

      return bestEdge;
    }

    function search() {
      if (solutions.length >= maxSolutions) return;

      const snap = snapshot();
      if (!propagate()) {
        restore(snap);
        return;
      }

      if (engine.isLevelCompleted()) {
        solutions.push(snapshot());
        restore(snap);
        return;
      }

      const edge = getNextUnassignedEdge();
      if (!edge) {
        restore(snap);
        return;
      }

      // Branch 1: Try LINE
      const snapBeforeBranch = snapshot();
      if (edge.type === 'H') engine.hEdges[edge.r][edge.c] = EDGE_LINE;
      else engine.vEdges[edge.r][edge.c] = EDGE_LINE;
      search();
      restore(snapBeforeBranch);

      if (solutions.length >= maxSolutions) return;

      // Branch 2: Try CROSS
      if (edge.type === 'H') engine.hEdges[edge.r][edge.c] = EDGE_CROSS;
      else engine.vEdges[edge.r][edge.c] = EDGE_CROSS;
      search();
      restore(snap);
    }

    search();
    return solutions;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EDGE_EMPTY,
    EDGE_LINE,
    EDGE_CROSS,
    SlitherEngine,
    SlitherSolver
  };
}
