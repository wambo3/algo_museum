import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Grid, HelpCircle, MapPin, Eye } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

// Cell interface
interface GridCell {
  r: number;
  c: number;
  type: 'empty' | 'wall' | 'weight' | 'start' | 'end';
  cost: number;
  visited?: boolean;
  isVisiting?: boolean;
  isPath?: boolean;
  gScore?: number;
  fScore?: number;
  parent?: string;
}

const ROWS = 15;
const COLS = 20;

// Helper to construct empty grid
const createInitialGrid = (startR = 3, startC = 3, endR = 11, endC = 16): GridCell[][] => {
  const g: GridCell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < COLS; c++) {
      let type: 'empty' | 'wall' | 'weight' | 'start' | 'end' = 'empty';
      if (r === startR && c === startC) type = 'start';
      else if (r === endR && c === endC) type = 'end';

      row.push({
        r,
        c,
        type,
        cost: 1,
      });
    }
    g.push(row);
  }
  return g;
};

// Heuristic for A* (Manhattan Distance)
const manhattanDistance = (node: GridCell, target: GridCell) => {
  return Math.abs(node.r - target.r) + Math.abs(node.c - target.c);
};

// Pseudocodes
const bfsPseudocode = [
  { text: "procedure BFS(start, target)", indent: 0 },
  { text: "create empty queue Q", indent: 1 },
  { text: "enqueue start; mark start as visited", indent: 1 },
  { text: "while Q is not empty do", indent: 1 },
  { text: "u := dequeue Q", indent: 2 },
  { text: "if u is target return path", indent: 2 },
  { text: "for each neighbor v of u do", indent: 2 },
  { text: "if v is not visited and not wall then", indent: 3 },
  { text: "mark v as visited; parent[v] := u", indent: 4 },
  { text: "enqueue v", indent: 4 },
];

const bfsPython = [
  { text: "def bfs(grid, start, target):", indent: 0 },
  { text: "queue = [start]", indent: 1 },
  { text: "visited = {start}", indent: 1 },
  { text: "parent = {}", indent: 1 },
  { text: "while queue:", indent: 1 },
  { text: "curr = queue.pop(0)", indent: 2 },
  { text: "if curr == target:", indent: 2 },
  { text: "return reconstruct_path(parent, target)", indent: 3 },
  { text: "for neighbor in get_neighbors(grid, curr):", indent: 2 },
  { text: "if neighbor not in visited and not is_wall(neighbor):", indent: 3 },
  { text: "visited.add(neighbor)", indent: 4 },
  { text: "parent[neighbor] = curr", indent: 4 },
  { text: "queue.append(neighbor)", indent: 4 },
];

const dfsPseudocode = [
  { text: "procedure DFS(start, target)", indent: 0 },
  { text: "create empty stack S", indent: 1 },
  { text: "push start", indent: 1 },
  { text: "while S is not empty do", indent: 1 },
  { text: "u := pop S", indent: 2 },
  { text: "if u is not visited then", indent: 2 },
  { text: "mark u as visited", indent: 3 },
  { text: "if u is target return path", indent: 3 },
  { text: "for each neighbor v of u do", indent: 3 },
  { text: "if v is not visited and not wall then", indent: 4 },
  { text: "parent[v] := u; push v", indent: 5 },
];

const dfsPython = [
  { text: "def dfs(grid, start, target):", indent: 0 },
  { text: "stack = [start]", indent: 1 },
  { text: "visited = set()", indent: 1 },
  { text: "parent = {}", indent: 1 },
  { text: "while stack:", indent: 1 },
  { text: "curr = stack.pop()", indent: 2 },
  { text: "if curr not in visited:", indent: 2 },
  { text: "visited.add(curr)", indent: 3 },
  { text: "if curr == target: return reconstruct(parent, target)", indent: 3 },
  { text: "for neighbor in get_neighbors(grid, curr):", indent: 3 },
  { text: "if neighbor not in visited:", indent: 4 },
  { text: "parent[neighbor] = curr", indent: 5 },
  { text: "stack.append(neighbor)", indent: 5 },
];

const dijkstraPseudocode = [
  { text: "procedure Dijkstra(start, target)", indent: 0 },
  { text: "dist[start] := 0; dist[v] := infinity for others", indent: 1 },
  { text: "create priority queue PQ with all nodes", indent: 1 },
  { text: "while PQ is not empty do", indent: 1 },
  { text: "u := node in PQ with minimum dist[u]", indent: 2 },
  { text: "remove u from PQ", indent: 2 },
  { text: "if u is target return path", indent: 2 },
  { text: "for each neighbor v of u in PQ do", indent: 2 },
  { text: "alt := dist[u] + cost(u, v)", indent: 3 },
  { text: "if alt < dist[v] then", indent: 3 },
  { text: "dist[v] := alt; parent[v] := u", indent: 4 },
];

const dijkstraPython = [
  { text: "def dijkstra(grid, start, target):", indent: 0 },
  { text: "dist = {node: float('inf') for node in grid}", indent: 1 },
  { text: "dist[start] = 0", indent: 1 },
  { text: "pq = [(0, start)]", indent: 1 },
  { text: "while pq:", indent: 1 },
  { text: "d, u = heappop(pq)", indent: 2 },
  { text: "if d > dist[u]: continue", indent: 2 },
  { text: "if u == target: return reconstruct(parent, target)", indent: 2 },
  { text: "for v, weight in neighbors(u):", indent: 2 },
  { text: "alt = dist[u] + weight", indent: 3 },
  { text: "if alt < dist[v]:", indent: 3 },
  { text: "dist[v] = alt; parent[v] = u", indent: 4 },
  { text: "heappush(pq, (alt, v))", indent: 4 },
];

const aStarPseudocode = [
  { text: "procedure A*(start, target)", indent: 0 },
  { text: "gScore[start] := 0; fScore[start] := h(start)", indent: 1 },
  { text: "create openSet containing start", indent: 1 },
  { text: "while openSet is not empty do", indent: 1 },
  { text: "u := node in openSet with lowest fScore[u]", indent: 2 },
  { text: "if u is target return path", indent: 2 },
  { text: "remove u from openSet; add u to closedSet", indent: 2 },
  { text: "for each neighbor v of u do", indent: 2 },
  { text: "tentative_g := gScore[u] + cost(u, v)", indent: 3 },
  { text: "if tentative_g < gScore[v] then", indent: 3 },
  { text: "gScore[v] := tentative_g; parent[v] := u", indent: 4 },
  { text: "fScore[v] := gScore[v] + h(v); add to openSet", indent: 4 },
];

const aStarPython = [
  { text: "def a_star(grid, start, target):", indent: 0 },
  { text: "gScore = {node: float('inf') for node in grid}", indent: 1 },
  { text: "gScore[start] = 0", indent: 1 },
  { text: "fScore = {node: float('inf') for node in grid}", indent: 1 },
  { text: "fScore[start] = heuristic(start, target)", indent: 1 },
  { text: "openSet = [(fScore[start], start)]", indent: 1 },
  { text: "while openSet:", indent: 1 },
  { text: "f, u = heappop(openSet)", indent: 2 },
  { text: "if u == target: return reconstruct(parent, target)", indent: 2 },
  { text: "for v, weight in neighbors(u):", indent: 2 },
  { text: "tentative = gScore[u] + weight", indent: 3 },
  { text: "if tentative < gScore[v]:", indent: 3 },
  { text: "gScore[v] = tentative", indent: 4 },
  { text: "fScore[v] = tentative + h(v, target)", indent: 4 },
  { text: "heappush(openSet, (fScore[v], v))", indent: 4 },
];

// Generator Definitions
const bfsRunner = function* (grid: GridCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  let startNode: GridCell | null = null;
  let endNode: GridCell | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c].type === 'start') startNode = g[r][c];
      if (g[r][c].type === 'end') endNode = g[r][c];
    }
  }

  if (!startNode || !endNode) return;

  yield {
    line: 1,
    explanation: "Breadth-First Search (BFS) is an unweighted search algorithm. It guarantees the shortest path on uniform grids by exploring layer by layer (radial expansion).",
    variables: { queue: 'empty', visited: 0 },
    state: g.map(row => row.map(cell => ({ ...cell }))),
  };

  const queue: GridCell[] = [startNode];
  startNode.visited = true;
  startNode.isVisiting = true;

  yield {
    line: 3,
    explanation: `Enqueued start node at (${startNode.r}, ${startNode.c}) and marked it as visited.`,
    variables: { queue: `[(${startNode.r},${startNode.c})]`, visited: 1 },
    state: g.map(row => row.map(cell => ({ ...cell }))),
  };

  const parents: Record<string, string> = {};
  let found = false;

  while (queue.length > 0) {
    const u = queue.shift()!;
    u.isVisiting = false;
    u.visited = true;

    yield {
      line: 5,
      explanation: `Dequeueing node (${u.r}, ${u.c}) to inspect its neighbors.`,
      variables: { queue: queue.map(n => `(${n.r},${n.c})`).slice(0, 3).join(',') + (queue.length > 3 ? '...' : ''), 'current.r': u.r, 'current.c': u.c },
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };

    if (u.r === endNode.r && u.c === endNode.c) {
      found = true;
      yield {
        line: 6,
        explanation: "Reached the target destination node.",
        variables: { queue: queue.map(n => `(${n.r},${n.c})`).slice(0, 3).join(','), found: 'true' },
        state: g.map(row => row.map(cell => ({ ...cell }))),
      };
      break;
    }

    const rowDirs = [-1, 1, 0, 0];
    const colDirs = [0, 0, -1, 1];

    for (let i = 0; i < 4; i++) {
      const nr = u.r + rowDirs[i];
      const nc = u.c + colDirs[i];

      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const neighbor = g[nr][nc];
        if (!neighbor.visited && neighbor.type !== 'wall' && !neighbor.isVisiting) {
          neighbor.isVisiting = true;
          parents[`${nr}-${nc}`] = `${u.r}-${u.c}`;
          queue.push(neighbor);

          yield {
            line: 9,
            explanation: `Neighbor (${nr}, ${nc}) is unvisited and passable. Adding it to queue and marking parent as (${u.r}, ${u.c}).`,
            variables: { 'neighbor.r': nr, 'neighbor.c': nc, queueSize: queue.length },
            state: g.map(row => row.map(cell => ({ ...cell }))),
          };
        }
      }
    }
  }

  if (found) {
    let currKey = `${endNode.r}-${endNode.c}`;
    const startKey = `${startNode.r}-${startNode.c}`;
    
    while (currKey && currKey !== startKey) {
      const [r, c] = currKey.split('-').map(Number);
      g[r][c].isPath = true;
      const parentKey = parents[currKey];
      currKey = parentKey;

      yield {
        line: 6,
        explanation: `Tracing path backward: visiting step at (${r}, ${c}).`,
        variables: { node: `(${r},${c})` },
        state: g.map(row => row.map(cell => ({ ...cell }))),
      };
    }
    startNode.isPath = true;
    yield {
      line: 6,
      explanation: "Shortest path reconstructed successfully!",
      variables: { found: 'true' },
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  } else {
    yield {
      line: 4,
      explanation: "No path exists from start to target because all passage nodes are blocked.",
      variables: { found: 'false' },
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  }
};

const dfsRunner = function* (grid: GridCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  let startNode: GridCell | null = null;
  let endNode: GridCell | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c].type === 'start') startNode = g[r][c];
      if (g[r][c].type === 'end') endNode = g[r][c];
    }
  }

  if (!startNode || !endNode) return;

  yield {
    line: 1,
    explanation: "Depth-First Search (DFS) searches deeply along path branches. It does NOT guarantee the shortest path, but has deep exploratory characteristics.",
    variables: { stack: 'empty' },
    state: g.map(row => row.map(cell => ({ ...cell }))),
  };

  const stack: GridCell[] = [startNode];
  const parents: Record<string, string> = {};
  let found = false;

  while (stack.length > 0) {
    const u = stack.pop()!;
    if (u.visited) continue;

    u.visited = true;
    u.isVisiting = false;

    yield {
      line: 5,
      explanation: `Pop node (${u.r}, ${u.c}) from stack and mark as visited.`,
      variables: { stackSize: stack.length, 'current.r': u.r, 'current.c': u.c },
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };

    if (u.r === endNode.r && u.c === endNode.c) {
      found = true;
      break;
    }

    const rowDirs = [-1, 1, 0, 0];
    const colDirs = [0, 0, -1, 1];

    for (let i = 0; i < 4; i++) {
      const nr = u.r + rowDirs[i];
      const nc = u.c + colDirs[i];

      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const neighbor = g[nr][nc];
        if (!neighbor.visited && neighbor.type !== 'wall') {
          neighbor.isVisiting = true;
          parents[`${nr}-${nc}`] = `${u.r}-${u.c}`;
          stack.push(neighbor);

          yield {
            line: 11,
            explanation: `Pushing neighbor (${nr}, ${nc}) to stack. Set parent to (${u.r}, ${u.c}).`,
            variables: { 'neighbor.r': nr, 'neighbor.c': nc, stackSize: stack.length },
            state: g.map(row => row.map(cell => ({ ...cell }))),
          };
        }
      }
    }
  }

  if (found) {
    let currKey = `${endNode.r}-${endNode.c}`;
    const startKey = `${startNode.r}-${startNode.c}`;
    while (currKey && currKey !== startKey) {
      const [r, c] = currKey.split('-').map(Number);
      g[r][c].isPath = true;
      currKey = parents[currKey];
      yield {
        line: 8,
        explanation: `Backtracing path: (${r}, ${c}).`,
        variables: {},
        state: g.map(row => row.map(cell => ({ ...cell }))),
      };
    }
    startNode.isPath = true;
    yield {
      line: 8,
      explanation: "DFS path discovered.",
      variables: {},
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  } else {
    yield {
      line: 4,
      explanation: "No path exists from start to target.",
      variables: {},
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  }
};

const dijkstraRunner = function* (grid: GridCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  let startNode: GridCell | null = null;
  let endNode: GridCell | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c].type === 'start') startNode = g[r][c];
      if (g[r][c].type === 'end') endNode = g[r][c];
      g[r][c].gScore = Infinity;
    }
  }

  if (!startNode || !endNode) return;

  startNode.gScore = 0;
  
  yield {
    line: 1,
    explanation: "Dijkstra's Algorithm is a weighted search. It finds the shortest path by evaluating nodes based on accumulated cost. Terrain (mud nodes) cost more to cross.",
    variables: { pqSize: 1 },
    state: g.map(row => row.map(cell => ({ ...cell }))),
  };

  const pq: GridCell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c].type !== 'wall') {
        pq.push(g[r][c]);
      }
    }
  }

  const parents: Record<string, string> = {};
  let found = false;

  while (pq.length > 0) {
    pq.sort((a, b) => (a.gScore ?? Infinity) - (b.gScore ?? Infinity));
    const u = pq.shift()!;

    if (u.gScore === Infinity) {
      break;
    }

    u.visited = true;
    u.isVisiting = false;

    yield {
      line: 5,
      explanation: `Removing node (${u.r}, ${u.c}) from PQ. It has the lowest cost value of ${u.gScore}.`,
      variables: { 'current.r': u.r, 'current.c': u.c, cost: u.gScore },
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };

    if (u.r === endNode.r && u.c === endNode.c) {
      found = true;
      break;
    }

    const rowDirs = [-1, 1, 0, 0];
    const colDirs = [0, 0, -1, 1];

    for (let i = 0; i < 4; i++) {
      const nr = u.r + rowDirs[i];
      const nc = u.c + colDirs[i];

      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const neighbor = g[nr][nc];
        if (pq.includes(neighbor)) {
          const cost = neighbor.type === 'weight' ? 5 : 1;
          const alt = u.gScore! + cost;

          yield {
            line: 9,
            explanation: `Inspecting neighbor (${nr}, ${nc}). Cost of crossing this node is ${cost}. New potential score: ${alt}.`,
            variables: { 'neighbor.r': nr, 'neighbor.c': nc, alt, 'current_g': neighbor.gScore },
            state: g.map(row => row.map(cell => ({ ...cell }))),
          };

          if (alt < neighbor.gScore!) {
            neighbor.gScore = alt;
            neighbor.isVisiting = true;
            parents[`${nr}-${nc}`] = `${u.r}-${u.c}`;

            yield {
              line: 11,
              explanation: `Alternative path to (${nr}, ${nc}) is cheaper! Updating neighbor score to ${alt} and setting parent.`,
              variables: { 'neighbor.r': nr, 'neighbor.c': nc, newScore: alt },
              state: g.map(row => row.map(cell => ({ ...cell }))),
            };
          }
        }
      }
    }
  }

  if (found) {
    let currKey = `${endNode.r}-${endNode.c}`;
    const startKey = `${startNode.r}-${startNode.c}`;
    while (currKey && currKey !== startKey) {
      const [r, c] = currKey.split('-').map(Number);
      g[r][c].isPath = true;
      currKey = parents[currKey];
      yield {
        line: 7,
        explanation: `Backtracing Dijkstra path: (${r}, ${c}).`,
        variables: {},
        state: g.map(row => row.map(cell => ({ ...cell }))),
      };
    }
    startNode.isPath = true;
    yield {
      line: 7,
      explanation: "Weighted shortest path constructed! Notice how it avoids mud (weight) nodes if going around them is cheaper.",
      variables: {},
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  } else {
    yield {
      line: 4,
      explanation: "No path exists from start to target.",
      variables: {},
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  }
};

const aStarRunner = function* (grid: GridCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  let startNode: GridCell | null = null;
  let endNode: GridCell | null = null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c].type === 'start') startNode = g[r][c];
      if (g[r][c].type === 'end') endNode = g[r][c];
      g[r][c].gScore = Infinity;
      g[r][c].fScore = Infinity;
    }
  }

  if (!startNode || !endNode) return;

  startNode.gScore = 0;
  startNode.fScore = manhattanDistance(startNode, endNode);

  yield {
    line: 1,
    explanation: "A* Algorithm uses heuristics to guide the search. The score f = g (actual cost) + h (estimated distance to goal). This makes it prioritize nodes heading towards the target.",
    variables: { openSetSize: 1 },
    state: g.map(row => row.map(cell => ({ ...cell }))),
  };

  const openSet: GridCell[] = [startNode];
  const closedSet: GridCell[] = [];
  const parents: Record<string, string> = {};
  let found = false;

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.fScore ?? Infinity) - (b.fScore ?? Infinity));
    const u = openSet.shift()!;

    u.visited = true;
    u.isVisiting = false;

    yield {
      line: 5,
      explanation: `Selected (${u.r}, ${u.c}) from Open Set because it has the lowest fScore = g(${u.gScore}) + h(${u.fScore! - u.gScore!}) = ${u.fScore}.`,
      variables: { 'current.r': u.r, 'current.c': u.c, g: u.gScore, f: u.fScore },
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };

    if (u.r === endNode.r && u.c === endNode.c) {
      found = true;
      break;
    }

    closedSet.push(u);

    const rowDirs = [-1, 1, 0, 0];
    const colDirs = [0, 0, -1, 1];

    for (let i = 0; i < 4; i++) {
      const nr = u.r + rowDirs[i];
      const nc = u.c + colDirs[i];

      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const neighbor = g[nr][nc];
        if (neighbor.type === 'wall' || closedSet.includes(neighbor)) continue;

        const terrainCost = neighbor.type === 'weight' ? 5 : 1;
        const tentativeG = u.gScore! + terrainCost;

        yield {
          line: 9,
          explanation: `Evaluating neighbor (${nr}, ${nc}). Tentative gScore = ${tentativeG}. Previous neighbor gScore = ${neighbor.gScore}.`,
          variables: { 'neighbor.r': nr, 'neighbor.c': nc, tentativeG },
          state: g.map(row => row.map(cell => ({ ...cell }))),
        };

        if (tentativeG < neighbor.gScore!) {
          parents[`${nr}-${nc}`] = `${u.r}-${u.c}`;
          neighbor.gScore = tentativeG;
          const h = manhattanDistance(neighbor, endNode);
          neighbor.fScore = tentativeG + h;
          neighbor.isVisiting = true;

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }

          yield {
            line: 11,
            explanation: `Path is shorter! Set parent. Neighbor scores: g=${tentativeG}, h=${h}, f=${neighbor.fScore}.`,
            variables: { 'neighbor.r': nr, 'neighbor.c': nc, fScore: neighbor.fScore },
            state: g.map(row => row.map(cell => ({ ...cell }))),
          };
        }
      }
    }
  }

  if (found) {
    let currKey = `${endNode.r}-${endNode.c}`;
    const startKey = `${startNode.r}-${startNode.c}`;
    while (currKey && currKey !== startKey) {
      const [r, c] = currKey.split('-').map(Number);
      g[r][c].isPath = true;
      currKey = parents[currKey];
      yield {
        line: 6,
        explanation: `Backtracing A* path: (${r}, ${c}).`,
        variables: {},
        state: g.map(row => row.map(cell => ({ ...cell }))),
      };
    }
    startNode.isPath = true;
    yield {
      line: 6,
      explanation: "A* Path constructed successfully!",
      variables: {},
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  } else {
    yield {
      line: 4,
      explanation: "No path exists from start to target.",
      variables: {},
      state: g.map(row => row.map(cell => ({ ...cell }))),
    };
  }
};

const bfsAlgoDef: AlgorithmDefinition<GridCell[][], GridCell[][]> = {
  name: "Breadth-First Search",
  description: "Explores all node neighbors at the present depth level before moving on to nodes at the next depth level.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  history: "BFS was formulated by Edward F. Moore in 1959 in the context of finding paths through mazes, and independently developed by C.Y. Lee in 1961 for routing wires on circuit boards.",
  funFact: "BFS guarantees the shortest path on unweighted graphs. It behaves like ripples on a pond spreading outwards from the origin.",
  pseudocode: bfsPseudocode,
  run: bfsRunner,
  defaultInput: [],
};

const dfsAlgoDef: AlgorithmDefinition<GridCell[][], GridCell[][]> = {
  name: "Depth-First Search",
  description: "Explores as deep as possible along each branch before backtracking.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  history: "DFS was studied in the 19th century by French mathematician Charles Pierre Trémaux as a strategy for solving mazes (the Trémaux algorithm).",
  funFact: "DFS behaves like a blind explorer walking down a corridor until hitting a wall, then turning back to try the next available doorway.",
  pseudocode: dfsPseudocode,
  run: dfsRunner,
  defaultInput: [],
};

const dijkstraAlgoDef: AlgorithmDefinition<GridCell[][], GridCell[][]> = {
  name: "Dijkstra's Algorithm",
  description: "Computes the shortest path from a single source to all other nodes on weighted graphs.",
  complexity: { time: "O((V + E) log V)", space: "O(V)" },
  history: "Conceived by Edsger W. Dijkstra in 1956 and published in 1959. Dijkstra designed it in just 20 minutes to demonstrate the power of computing to non-programmers.",
  funFact: "Dijkstra's original paper did not use a priority queue, meaning its complexity was O(V²). Later refinements optimized it using binary heaps.",
  pseudocode: dijkstraPseudocode,
  run: dijkstraRunner,
  defaultInput: [],
};

const aStarAlgoDef: AlgorithmDefinition<GridCell[][], GridCell[][]> = {
  name: "A* Search Algorithm",
  description: "An extension of Dijkstra's algorithm that uses heuristics to achieve better performance.",
  complexity: { time: "O(E) worst case", space: "O(V)" },
  history: "Developed in 1968 at the Stanford Research Institute by Peter Hart, Nils Nilsson, and Bertram Raphael to improve the pathfinding capabilities of the Shakey robot.",
  funFact: "A* is the ultimate standard for pathfinding in video games (such as RTS games like Starcraft) because it converges on the target rapidly.",
  pseudocode: aStarPseudocode,
  run: aStarRunner,
  defaultInput: [],
};

export const PathfindingGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'bfs' | 'dfs' | 'dijkstra' | 'astar'>('astar');
  const [showPlacard, setShowPlacard] = useState(true);
  const [grid, setGrid] = useState<GridCell[][]>(() => createInitialGrid());
  const [mouseMode, setMouseMode] = useState<'wall' | 'weight' | 'clear' | 'start' | 'end'>('wall');
  const [isMouseDown, setIsMouseDown] = useState(false);
  
  // Running state
  const [steps, setSteps] = useState<AlgorithmStep<GridCell[][] | null>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(150); // ms delay

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAlgoDefinition = () => {
    if (selectedAlgo === 'bfs') return bfsAlgoDef;
    if (selectedAlgo === 'dfs') return dfsAlgoDef;
    if (selectedAlgo === 'dijkstra') return dijkstraAlgoDef;
    return aStarAlgoDef;
  };

  const getPythonCode = () => {
    if (selectedAlgo === 'bfs') return bfsPython;
    if (selectedAlgo === 'dfs') return dfsPython;
    if (selectedAlgo === 'dijkstra') return dijkstraPython;
    return aStarPython;
  };

  const initAlgorithm = (targetGrid?: GridCell[][]) => {
    const activeGrid = targetGrid || grid;
    const def = getAlgoDefinition();
    const generator = def.run(activeGrid);
    const collectedSteps: AlgorithmStep<GridCell[][]>[] = [];

    let result = generator.next();
    while (!result.done) {
      if (result.value) {
        collectedSteps.push(result.value);
      }
      result = generator.next();
    }

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    initAlgorithm();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedAlgo]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps, speed]);

  const handleCellClick = (r: number, c: number) => {
    setIsPlaying(false);
    
    let startCoord = { r: 3, c: 3 };
    let endCoord = { r: 11, c: 16 };
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (grid[row][col].type === 'start') startCoord = { r: row, c: col };
        if (grid[row][col].type === 'end') endCoord = { r: row, c: col };
      }
    }

    const nextGrid: GridCell[][] = grid.map(row => row.map(cell => {
      if (cell.r === r && cell.c === c) {
        if (mouseMode === 'start') {
          return { ...cell, type: 'start' as const, cost: 1 };
        } else if (mouseMode === 'end') {
          return { ...cell, type: 'end' as const, cost: 1 };
        } else if (mouseMode === 'wall') {
          if (cell.type === 'start' || cell.type === 'end') return cell;
          return { ...cell, type: 'wall' as const, cost: 1 };
        } else if (mouseMode === 'weight') {
          if (cell.type === 'start' || cell.type === 'end') return cell;
          return { ...cell, type: 'weight' as const, cost: 5 };
        } else {
          if (cell.type === 'start' || cell.type === 'end') return cell;
          return { ...cell, type: 'empty' as const, cost: 1 };
        }
      }

      if (mouseMode === 'start' && grid[r][c].type !== 'end') {
        if (cell.r === startCoord.r && cell.c === startCoord.c) {
          return { ...cell, type: 'empty' as const };
        }
      }
      if (mouseMode === 'end' && grid[r][c].type !== 'start') {
        if (cell.r === endCoord.r && cell.c === endCoord.c) {
          return { ...cell, type: 'empty' as const };
        }
      }

      return cell;
    }));

    setGrid(nextGrid);
    initAlgorithm(nextGrid);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isMouseDown) return;
    if (mouseMode === 'start' || mouseMode === 'end') return;
    handleCellClick(r, c);
  };

  const handleClearAll = () => {
    setIsPlaying(false);
    const nextGrid = createInitialGrid();
    setGrid(nextGrid);
    initAlgorithm(nextGrid);
  };

  const handleClearPath = () => {
    setIsPlaying(false);
    const nextGrid = grid.map(row => row.map(cell => ({
      ...cell,
      visited: false,
      isVisiting: false,
      isPath: false,
      gScore: undefined,
      fScore: undefined,
    })));
    setGrid(nextGrid);
    initAlgorithm(nextGrid);
  };

  const handleGenerateMaze = () => {
    setIsPlaying(false);
    let startR = 3, startC = 3, endR = 11, endC = 16;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].type === 'start') { startR = r; startC = c; }
        if (grid[r][c].type === 'end') { endR = r; endC = c; }
      }
    }

    const nextGrid = createInitialGrid(startR, startC, endR, endC);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (nextGrid[r][c].type === 'start' || nextGrid[r][c].type === 'end') continue;
        if (Math.random() < 0.35) {
          nextGrid[r][c].type = 'wall';
        } else if (Math.random() < 0.15) {
          nextGrid[r][c].type = 'weight';
          nextGrid[r][c].cost = 5;
        }
      }
    }

    setGrid(nextGrid);
    initAlgorithm(nextGrid);
  };

  const def = getAlgoDefinition();

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="Pathfinding & Grids"
        description="Pathfinding algorithms calculate the shortest route between a Start point and a Destination point across a grid containing wall obstacles and weighted mud terrains. They simulate how entities navigate physical space."
        history="Edsger W. Dijkstra (pictured) conceived his shortest path algorithm in 1956 in just 20 minutes while shopping with his fiancée. The A* algorithm was subsequently designed in 1968 by Hart, Nilsson, and Raphael to incorporate heuristics, speeding up path calculation in robotics."
        complexity={def.complexity}
        terms={selectedAlgo === 'astar' ? ['Time Complexity', 'Space Complexity', 'Heuristic'] : ['Time Complexity', 'Space Complexity']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Edsger_Wybe_Dijkstra.jpg/500px-Edsger_Wybe_Dijkstra.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready to search.',
    variables: {},
    state: grid,
  };

  const activeGrid = currentStep.state || grid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        {/* Controls */}
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Grid className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="astar">A* Heuristic Search</option>
              <option value="dijkstra">Dijkstra's Algorithm</option>
              <option value="bfs">Breadth-First Search (BFS)</option>
              <option value="dfs">Depth-First Search (DFS)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIdx(0);
              }}
              disabled={currentStepIdx === 0}
              className="p-2.5 rounded-xl border border-[#2d2d2d] bg-slate-950/60 hover:text-[#1c1c1c] text-[#5a5a5a] disabled:opacity-30 transition-all"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isPlaying
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700'
                  : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-700'
              }`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Find Path'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Speed</span>
            <input
              type="range"
              min="10"
              max="600"
              step="10"
              value={610 - speed}
              onChange={(e) => setSpeed(610 - parseInt(e.target.value))}
              className="w-20 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* The Grid Canvas */}
        <div
          className="flex-1 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center relative overflow-hidden bg-[#f4f0e6] select-none min-h-[360px]"
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => setIsMouseDown(false)}
        >
          {/* Legend */}
          <div className="w-full flex justify-between items-center mb-4 text-[10px] font-bold text-[#5a5a5a] flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d] flex items-center justify-center text-white"><MapPin size={9} /></span>
              <span>Start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#722f37] flex items-center justify-center text-white"><Eye size={9} /></span>
              <span>Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#fcfaf2] border border-[#2d2d2d]"></span>
              <span>Empty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#5a5a5a] border border-[#2d2d2d]"></span>
              <span>Wall</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#b58900]/30 border border-[#b58900]/60 text-[#b58900] font-extrabold flex items-center justify-center text-[8px]">5</span>
              <span>Mud (Weight 5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d]/10 border border-[#1b365d]/40"></span>
              <span>Frontier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d]/5 border border-indigo-500/20"></span>
              <span>Visited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#2e5a44] border border-[#2e5a44]"></span>
              <span>Final Path</span>
            </div>
          </div>

          {/* Grid Render */}
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            <div className="grid gap-0.5 p-1 bg-[#fcfaf2] border border-[#2d2d2d]">
              {activeGrid.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-0.5">
                  {row.map((cell, cIdx) => {
                    let cellBg = 'bg-[#fcfaf2] hover:bg-[#eae5d8] border border-[#2d2d2d]/10';
                    let content = null;

                    if (cell.type === 'start') {
                      cellBg = 'bg-[#1b365d] text-white';
                      content = <MapPin size={11} />;
                    } else if (cell.type === 'end') {
                      cellBg = 'bg-[#722f37] text-white';
                      content = <Eye size={11} />;
                    } else if (cell.type === 'wall') {
                      cellBg = 'bg-[#5a5a5a] border-[#2d2d2d]';
                    } else if (cell.type === 'weight') {
                      cellBg = 'bg-[#b58900]/20 text-[#b58900] font-extrabold flex items-center justify-center text-[9px] border border-[#b58900]/25';
                      content = <span>5</span>;
                    } else if (cell.isPath) {
                      cellBg = 'bg-[#2e5a44] border-[#2d2d2d] text-white';
                    } else if (cell.isVisiting) {
                      cellBg = 'bg-[#1b365d]/20 border border-[#1b365d]/40';
                    } else if (cell.visited) {
                      cellBg = 'bg-[#1b365d]/10 border border-[#1b365d]/20';
                    }

                    return (
                      <div
                        key={cIdx}
                        className={`w-[22px] h-[22px] flex items-center justify-center cursor-crosshair transition-all duration-200 ${cellBg}`}
                        onMouseDown={() => handleCellClick(cell.r, cell.c)}
                        onMouseEnter={() => handleCellMouseEnter(cell.r, cell.c)}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom dataset control box */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <HelpCircle size={15} className="text-[#1b365d]" />
              Configure Grid Landscape
            </h4>
            <p className="text-slate-500 text-xs">Draw walls/mud and move nodes. Generate a random maze to test search behavior.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[#fcfaf2] border border-[#2d2d2d] p-1">
              <button
                onClick={() => setMouseMode('wall')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mouseMode === 'wall' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
                }`}
              >
                Wall
              </button>
              <button
                onClick={() => setMouseMode('weight')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mouseMode === 'weight' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
                }`}
              >
                Mud
              </button>
              <button
                onClick={() => setMouseMode('clear')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mouseMode === 'clear' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
                }`}
              >
                Clear
              </button>
              <button
                onClick={() => setMouseMode('start')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mouseMode === 'start' ? 'bg-[#1b365d]/10 text-[#1b365d]' : 'text-[#5a5a5a]'
                }`}
              >
                Start
              </button>
              <button
                onClick={() => setMouseMode('end')}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  mouseMode === 'end' ? 'bg-[#722f37]/10 text-[#722f37]' : 'text-[#5a5a5a]'
                }`}
              >
                Goal
              </button>
            </div>

            <button
              onClick={handleGenerateMaze}
              className="px-4 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all"
            >
              Generate Maze
            </button>
            <button
              onClick={handleClearPath}
              className="px-4 py-2 border border-[#2d2d2d] bg-[#fcfaf2] text-[#5a5a5a] hover:text-[#1c1c1c] text-xs font-bold transition-all"
            >
              Reset Path
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 border border-transparent hover:border-[#a13d2d]/25 text-[#5a5a5a] hover:text-[#a13d2d] text-xs font-bold transition-all"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Curator & Code Side Panel */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="flex-1 min-h-[300px]">
          <CuratorGuide
            explanation={currentStep.explanation}
            history={def.history}
            funFact={def.funFact}
            complexity={def.complexity}
            algorithmName={def.name}
          />
        </div>
        <div className="flex-1 min-h-[300px]">
          <CodeDebugger
            pseudocode={def.pseudocode}
            pythonCode={getPythonCode()}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default PathfindingGallery;
