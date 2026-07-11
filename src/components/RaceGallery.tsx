import React, { useState, useEffect, useRef } from 'react';
import { Swords, RefreshCw } from 'lucide-react';

interface MiniCell {
  r: number;
  c: number;
  type: 'empty' | 'wall' | 'start' | 'end';
  visited?: boolean;
  isPath?: boolean;
}

const MINI_ROWS = 10;
const MINI_COLS = 12;

const createMiniGrid = (walls: Array<[number, number]> = []): MiniCell[][] => {
  const g: MiniCell[][] = [];
  for (let r = 0; r < MINI_ROWS; r++) {
    const row: MiniCell[] = [];
    for (let c = 0; c < MINI_COLS; c++) {
      let type: 'empty' | 'wall' | 'start' | 'end' = 'empty';
      if (r === 2 && c === 2) type = 'start';
      else if (r === 7 && c === 9) type = 'end';
      else if (walls.some(([wr, wc]) => wr === r && wc === c)) type = 'wall';

      row.push({ r, c, type });
    }
    g.push(row);
  }
  return g;
};

const manhattanDist = (r1: number, c1: number, r2: number, c2: number) => {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
};

// --- PATHFINDING GENERATORS ---

function* dijkstraGen(grid: MiniCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell, visited: false, isPath: false })));
  let queue: Array<[number, number, number]> = [[2, 2, 0]];
  const visited: Record<string, boolean> = { '2-2': true };
  const parent: Record<string, string> = {};
  let visitedCount = 0;

  while (queue.length > 0) {
    queue.sort((a, b) => a[2] - b[2]);
    const [ur, uc, ucost] = queue.shift()!;
    g[ur][uc].visited = true;
    visitedCount++;
    
    if (ur === 7 && uc === 9) {
      let curr = '7-9';
      while (curr) {
        const [r, c] = curr.split('-').map(Number);
        g[r][c].isPath = true;
        curr = parent[curr];
      }
      yield { grid: g, visitedCount, done: true };
      return;
    }

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = ur + dr;
      const nc = uc + dc;
      if (nr >= 0 && nr < MINI_ROWS && nc >= 0 && nc < MINI_COLS) {
        if (g[nr][nc].type !== 'wall' && !visited[`${nr}-${nc}`]) {
          visited[`${nr}-${nc}`] = true;
          parent[`${nr}-${nc}`] = `${ur}-${uc}`;
          queue.push([nr, nc, ucost + 1]);
        }
      }
    }
    yield { grid: g, visitedCount, done: false };
  }
  yield { grid: g, visitedCount, done: true };
}

function* astarGen(grid: MiniCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell, visited: false, isPath: false })));
  let queue: Array<[number, number, number, number]> = [[2, 2, 0, manhattanDist(2, 2, 7, 9)]];
  const visited: Record<string, boolean> = { '2-2': true };
  const parent: Record<string, string> = {};
  let visitedCount = 0;

  while (queue.length > 0) {
    queue.sort((a, b) => a[3] - b[3]);
    const [ur, uc, ucost] = queue.shift()!;
    g[ur][uc].visited = true;
    visitedCount++;

    if (ur === 7 && uc === 9) {
      let curr = '7-9';
      while (curr) {
        const [r, c] = curr.split('-').map(Number);
        g[r][c].isPath = true;
        curr = parent[curr];
      }
      yield { grid: g, visitedCount, done: true };
      return;
    }

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = ur + dr;
      const nc = uc + dc;
      if (nr >= 0 && nr < MINI_ROWS && nc >= 0 && nc < MINI_COLS) {
        if (g[nr][nc].type !== 'wall' && !visited[`${nr}-${nc}`]) {
          visited[`${nr}-${nc}`] = true;
          parent[`${nr}-${nc}`] = `${ur}-${uc}`;
          const nextG = ucost + 1;
          const f = nextG + manhattanDist(nr, nc, 7, 9);
          queue.push([nr, nc, nextG, f]);
        }
      }
    }
    yield { grid: g, visitedCount, done: false };
  }
  yield { grid: g, visitedCount, done: true };
}

function* bfsGen(grid: MiniCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell, visited: false, isPath: false })));
  let queue: Array<[number, number]> = [[2, 2]];
  const visited: Record<string, boolean> = { '2-2': true };
  const parent: Record<string, string> = {};
  let visitedCount = 0;

  while (queue.length > 0) {
    const [ur, uc] = queue.shift()!;
    g[ur][uc].visited = true;
    visitedCount++;

    if (ur === 7 && uc === 9) {
      let curr = '7-9';
      while (curr) {
        const [r, c] = curr.split('-').map(Number);
        g[r][c].isPath = true;
        curr = parent[curr];
      }
      yield { grid: g, visitedCount, done: true };
      return;
    }

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = ur + dr;
      const nc = uc + dc;
      if (nr >= 0 && nr < MINI_ROWS && nc >= 0 && nc < MINI_COLS) {
        if (g[nr][nc].type !== 'wall' && !visited[`${nr}-${nc}`]) {
          visited[`${nr}-${nc}`] = true;
          parent[`${nr}-${nc}`] = `${ur}-${uc}`;
          queue.push([nr, nc]);
        }
      }
    }
    yield { grid: g, visitedCount, done: false };
  }
  yield { grid: g, visitedCount, done: true };
}

function* dfsGen(grid: MiniCell[][]) {
  const g = grid.map(row => row.map(cell => ({ ...cell, visited: false, isPath: false })));
  let stack: Array<[number, number]> = [[2, 2]];
  const visited: Record<string, boolean> = { '2-2': true };
  const parent: Record<string, string> = {};
  let visitedCount = 0;

  while (stack.length > 0) {
    const [ur, uc] = stack.pop()!;
    g[ur][uc].visited = true;
    visitedCount++;

    if (ur === 7 && uc === 9) {
      let curr = '7-9';
      while (curr) {
        const [r, c] = curr.split('-').map(Number);
        g[r][c].isPath = true;
        curr = parent[curr];
      }
      yield { grid: g, visitedCount, done: true };
      return;
    }

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = ur + dr;
      const nc = uc + dc;
      if (nr >= 0 && nr < MINI_ROWS && nc >= 0 && nc < MINI_COLS) {
        if (g[nr][nc].type !== 'wall' && !visited[`${nr}-${nc}`]) {
          visited[`${nr}-${nc}`] = true;
          parent[`${nr}-${nc}`] = `${ur}-${uc}`;
          stack.push([nr, nc]);
        }
      }
    }
    yield { grid: g, visitedCount, done: false };
  }
  yield { grid: g, visitedCount, done: true };
}

// --- SORTING GENERATORS ---

function* bubbleSortRaceGen(arr: number[]) {
  const a = [...arr];
  const n = a.length;
  let comparisons = 0;
  let swapped = true;
  let limit = n;

  while (swapped) {
    swapped = false;
    for (let i = 1; i < limit; i++) {
      comparisons++;
      if (a[i - 1] > a[i]) {
        const temp = a[i - 1];
        a[i - 1] = a[i];
        a[i] = temp;
        swapped = true;
      }
      yield { array: [...a], comparisons, done: false };
    }
    limit--;
  }
  yield { array: [...a], comparisons, done: true };
}

function* quickSortRaceGen(arr: number[]) {
  const a = [...arr];
  let comparisons = 0;
  const stack: Array<[number, number]> = [[0, a.length - 1]];
  
  while (stack.length > 0) {
    const [low, high] = stack.pop()!;
    if (low < high) {
      const pivot = a[high];
      let i = low - 1;
      for (let j = low; j < high; j++) {
        comparisons++;
        if (a[j] < pivot) {
          i++;
          const t = a[i];
          a[i] = a[j];
          a[j] = t;
        }
        yield { array: [...a], comparisons, done: false };
      }
      const t = a[i + 1];
      a[i + 1] = a[high];
      a[high] = t;
      const p = i + 1;

      stack.push([low, p - 1]);
      stack.push([p + 1, high]);
    }
  }
  yield { array: [...a], comparisons, done: true };
}

function* mergeSortRaceGen(arr: number[]) {
  const a = [...arr];
  let comparisons = 0;
  const n = a.length;

  for (let width = 1; width < n; width = 2 * width) {
    for (let i = 0; i < n; i = i + 2 * width) {
      const left = i;
      const mid = Math.min(i + width - 1, n - 1);
      const right = Math.min(i + 2 * width - 1, n - 1);
      
      const L = a.slice(left, mid + 1);
      const R = a.slice(mid + 1, right + 1);
      let lIdx = 0, rIdx = 0, k = left;
      while (lIdx < L.length && rIdx < R.length) {
        comparisons++;
        if (L[lIdx] <= R[rIdx]) {
          a[k] = L[lIdx];
          lIdx++;
        } else {
          a[k] = R[rIdx];
          rIdx++;
        }
        k++;
        yield { array: [...a], comparisons, done: false };
      }
      while (lIdx < L.length) {
        a[k] = L[lIdx];
        lIdx++;
        k++;
        yield { array: [...a], comparisons, done: false };
      }
      while (rIdx < R.length) {
        a[k] = R[rIdx];
        rIdx++;
        k++;
        yield { array: [...a], comparisons, done: false };
      }
    }
  }
  yield { array: [...a], comparisons, done: true };
}

export const RaceGallery: React.FC = () => {
  const [raceType, setRaceType] = useState<'pathfinding' | 'sorting'>('pathfinding');

  // Algorithm selectors
  const [leftPathAlgo, setLeftPathAlgo] = useState<'dijkstra' | 'astar' | 'bfs' | 'dfs'>('dijkstra');
  const [rightPathAlgo, setRightPathAlgo] = useState<'dijkstra' | 'astar' | 'bfs' | 'dfs'>('astar');
  
  const [leftSortAlgo, setLeftSortAlgo] = useState<'bubble' | 'quick' | 'merge'>('bubble');
  const [rightSortAlgo, setRightSortAlgo] = useState<'dijkstra' | 'quick' | 'merge'>('quick'); // fallback select name mapping

  // Dataset selectors
  const [pathDataset, setPathDataset] = useState<'divider' | 'empty' | 'random' | 'deadend'>('divider');
  const [sortDataset, setSortDataset] = useState<'random' | 'sorted' | 'reverse' | 'nearly'>('random');

  // Visualizer states
  const [leftGrid, setLeftGrid] = useState<MiniCell[][]>(() => createMiniGrid([[4,2],[4,3],[4,4],[4,5],[4,6],[4,7]]));
  const [rightGrid, setRightGrid] = useState<MiniCell[][]>(() => createMiniGrid([[4,2],[4,3],[4,4],[4,5],[4,6],[4,7]]));
  const [leftVisitedCount, setLeftVisitedCount] = useState(0);
  const [rightVisitedCount, setRightVisitedCount] = useState(0);

  const [leftArray, setLeftArray] = useState<number[]>([35, 12, 85, 22, 60, 18, 90, 5]);
  const [rightArray, setRightArray] = useState<number[]>([35, 12, 85, 22, 60, 18, 90, 5]);
  const [leftComparisons, setLeftComparisons] = useState(0);
  const [rightComparisons, setRightComparisons] = useState(0);

  const [isRacing, setIsRacing] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply chosen datasets
  const applyDatasets = () => {
    setIsRacing(false);
    setWinnerMessage(null);
    setLeftVisitedCount(0);
    setRightVisitedCount(0);
    setLeftComparisons(0);
    setRightComparisons(0);

    if (raceType === 'pathfinding') {
      let walls: Array<[number, number]> = [];
      if (pathDataset === 'divider') {
        walls = [[4,2],[4,3],[4,4],[4,5],[4,6],[4,7]];
      } else if (pathDataset === 'deadend') {
        walls = [[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[4,5],[4,6],[4,7],[4,8],[4,9]];
      } else if (pathDataset === 'random') {
        for (let r = 0; r < MINI_ROWS; r++) {
          for (let c = 0; c < MINI_COLS; c++) {
            if ((r === 2 && c === 2) || (r === 7 && c === 9)) continue;
            if (Math.random() < 0.25) walls.push([r, c]);
          }
        }
      }
      setLeftGrid(createMiniGrid(walls));
      setRightGrid(createMiniGrid(walls));
    } else {
      let arr = [35, 12, 85, 22, 60, 18, 90, 5];
      if (sortDataset === 'sorted') {
        arr = [5, 12, 18, 22, 35, 60, 85, 90];
      } else if (sortDataset === 'reverse') {
        arr = [90, 85, 60, 35, 22, 18, 12, 5];
      } else if (sortDataset === 'nearly') {
        arr = [5, 12, 18, 60, 35, 22, 85, 90]; // 60, 35 out of order
      } else if (sortDataset === 'random') {
        arr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 85) + 10);
      }
      setLeftArray([...arr]);
      setRightArray([...arr]);
    }
  };

  useEffect(() => {
    applyDatasets();
  }, [raceType, pathDataset, sortDataset]);

  const startRace = () => {
    setIsRacing(true);
    setWinnerMessage(null);
    setLeftVisitedCount(0);
    setRightVisitedCount(0);
    setLeftComparisons(0);
    setRightComparisons(0);

    if (timerRef.current) clearInterval(timerRef.current);

    if (raceType === 'pathfinding') {
      const leftGen = leftPathAlgo === 'bfs' ? bfsGen(leftGrid) 
        : leftPathAlgo === 'dfs' ? dfsGen(leftGrid)
        : leftPathAlgo === 'astar' ? astarGen(leftGrid)
        : dijkstraGen(leftGrid);

      const rightGen = rightPathAlgo === 'bfs' ? bfsGen(rightGrid) 
        : rightPathAlgo === 'dfs' ? dfsGen(rightGrid)
        : rightPathAlgo === 'astar' ? astarGen(rightGrid)
        : dijkstraGen(rightGrid);

      let leftFinished = false;
      let rightFinished = false;

      timerRef.current = setInterval(() => {
        if (!leftFinished) {
          const lStep = leftGen.next();
          if (lStep.done || lStep.value?.done) {
            leftFinished = true;
          }
          if (lStep.value) {
            setLeftGrid([...lStep.value.grid]);
            setLeftVisitedCount(lStep.value.visitedCount);
          }
        }

        if (!rightFinished) {
          const rStep = rightGen.next();
          if (rStep.done || rStep.value?.done) {
            rightFinished = true;
          }
          if (rStep.value) {
            setRightGrid([...rStep.value.grid]);
            setRightVisitedCount(rStep.value.visitedCount);
          }
        }

        if (leftFinished && rightFinished) {
          setIsRacing(false);
          clearInterval(timerRef.current!);
          setWinnerMessage("Race Track Finished");
        }
      }, 150);
    } else {
      // Sorting
      const leftGen = leftSortAlgo === 'quick' ? quickSortRaceGen(leftArray)
        : leftSortAlgo === 'merge' ? mergeSortRaceGen(leftArray)
        : bubbleSortRaceGen(leftArray);

      const rightGen = rightSortAlgo === 'quick' ? quickSortRaceGen(rightArray)
        : rightSortAlgo === 'merge' ? mergeSortRaceGen(rightArray)
        : bubbleSortRaceGen(rightArray);

      let leftFinished = false;
      let rightFinished = false;

      timerRef.current = setInterval(() => {
        if (!leftFinished) {
          const lStep = leftGen.next();
          if (lStep.done || lStep.value?.done) {
            leftFinished = true;
          }
          if (lStep.value) {
            setLeftArray([...lStep.value.array]);
            setLeftComparisons(lStep.value.comparisons);
          }
        }

        if (!rightFinished) {
          const rStep = rightGen.next();
          if (rStep.done || rStep.value?.done) {
            rightFinished = true;
          }
          if (rStep.value) {
            setRightArray([...rStep.value.array]);
            setRightComparisons(rStep.value.comparisons);
          }
        }

        if (leftFinished && rightFinished) {
          setIsRacing(false);
          clearInterval(timerRef.current!);
          setWinnerMessage("Sorting Complete");
        }
      }, 150);
    }
  };

  const resetRace = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    applyDatasets();
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8 animate-fade-in text-[#1c1c1c]">
      {/* Race Select Config Panel */}
      <div className="glass-panel rounded-2xl p-5 border-[#2d2d2d] bg-[#f4f0e6] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2d2d2d]/30 pb-3">
          <div className="flex items-center gap-3">
            <Swords className="text-[#1b365d]" size={20} />
            <span className="text-sm font-serif font-bold text-[#1c1c1c]">Comparative Sandbox Arena</span>
          </div>

          <div className="flex bg-[#fcfaf2] border border-[#2d2d2d] p-1">
            <button
              onClick={() => {
                setRaceType('pathfinding');
                resetRace();
              }}
              className={`px-4 py-1.5 text-xs font-bold transition-all ${
                raceType === 'pathfinding' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
              }`}
            >
              Pathfinding Mode
            </button>
            <button
              onClick={() => {
                setRaceType('sorting');
                resetRace();
              }}
              className={`px-4 py-1.5 text-xs font-bold transition-all ${
                raceType === 'sorting' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
              }`}
            >
              Sorting Mode
            </button>
          </div>
        </div>

        {/* Dynamic Model Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
          {/* Left Model Select */}
          <div className="space-y-1.5">
            <span className="block text-[9px] uppercase tracking-wider text-[#1b365d]">Left Candidate</span>
            {raceType === 'pathfinding' ? (
              <select
                value={leftPathAlgo}
                onChange={(e) => setLeftPathAlgo(e.target.value as any)}
                disabled={isRacing}
                className="bg-slate-900 border border-slate-800 text-slate-250 py-2 px-3 w-full"
              >
                <option value="dijkstra">Dijkstra Search</option>
                <option value="astar">A* Heuristics</option>
                <option value="bfs">BFS Breadth First</option>
                <option value="dfs">DFS Depth First</option>
              </select>
            ) : (
              <select
                value={leftSortAlgo}
                onChange={(e) => setLeftSortAlgo(e.target.value as any)}
                disabled={isRacing}
                className="bg-slate-900 border border-slate-800 text-slate-255 py-2 px-3 w-full"
              >
                <option value="bubble">Bubble Sort</option>
                <option value="quick">Quick Sort (Lomuto)</option>
                <option value="merge">Merge Sort (Stable)</option>
              </select>
            )}
          </div>

          {/* Right Model Select */}
          <div className="space-y-1.5">
            <span className="block text-[9px] uppercase tracking-wider text-[#722f37]">Right Candidate</span>
            {raceType === 'pathfinding' ? (
              <select
                value={rightPathAlgo}
                onChange={(e) => setRightPathAlgo(e.target.value as any)}
                disabled={isRacing}
                className="bg-slate-900 border border-slate-800 text-slate-250 py-2 px-3 w-full"
              >
                <option value="dijkstra">Dijkstra Search</option>
                <option value="astar">A* Heuristics</option>
                <option value="bfs">BFS Breadth First</option>
                <option value="dfs">DFS Depth First</option>
              </select>
            ) : (
              <select
                value={rightSortAlgo}
                onChange={(e) => setRightSortAlgo(e.target.value as any)}
                disabled={isRacing}
                className="bg-slate-900 border border-slate-800 text-slate-255 py-2 px-3 w-full"
              >
                <option value="bubble">Bubble Sort</option>
                <option value="quick">Quick Sort (Lomuto)</option>
                <option value="merge">Merge Sort (Stable)</option>
              </select>
            )}
          </div>

          {/* Dataset Selector */}
          <div className="space-y-1.5">
            <span className="block text-[9px] uppercase tracking-wider text-[#5a5a5a]">Test Dataset</span>
            {raceType === 'pathfinding' ? (
              <select
                value={pathDataset}
                onChange={(e) => setPathDataset(e.target.value as any)}
                disabled={isRacing}
                className="bg-slate-900 border border-slate-800 text-slate-250 py-2 px-3 w-full"
              >
                <option value="divider">Divider Obstacle Wall</option>
                <option value="empty">Empty Canvas Grid</option>
                <option value="random">Random scattered Blocks</option>
                <option value="deadend">U-Shape Dead End</option>
              </select>
            ) : (
              <select
                value={sortDataset}
                onChange={(e) => setSortDataset(e.target.value as any)}
                disabled={isRacing}
                className="bg-slate-900 border border-slate-800 text-slate-255 py-2 px-3 w-full"
              >
                <option value="random">Random Shuffled Set</option>
                <option value="sorted">Already Sorted Set</option>
                <option value="reverse">Reverse Sorted Set</option>
                <option value="nearly">Nearly Sorted Set</option>
              </select>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#2d2d2d]/10">
          <button
            onClick={startRace}
            disabled={isRacing}
            className="px-6 py-2 bg-[#1b365d] hover:bg-[#152a4a] text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Swords size={13} />
            Start Exhibition Race
          </button>
          <button
            onClick={resetRace}
            className="p-2 border border-[#2d2d2d] bg-[#fcfaf2] text-[#5a5a5a] hover:text-[#1c1c1c] transition-all"
            title="Reload Configs"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Side-by-Side Arenas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Arena */}
        <div className="glass-panel border-[#2d2d2d] p-6 flex flex-col items-center justify-between min-h-[360px] bg-[#f4f0e6]">
          <div className="w-full flex items-center justify-between border-b border-[#2d2d2d]/30 pb-3">
            <h3 className="text-sm font-serif font-extrabold uppercase text-[#1b365d] tracking-wider">
              {raceType === 'pathfinding' ? `${leftPathAlgo.toUpperCase()} Search` : `${leftSortAlgo.toUpperCase()} Sort`}
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#fcfaf2] border border-[#2d2d2d] text-[#1c1c1c] px-2 py-0.5">
              {raceType === 'pathfinding' ? `Visited: ${leftVisitedCount}` : `Comparisons: ${leftComparisons}`}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center w-full my-6">
            {raceType === 'pathfinding' ? (
              <div className="grid gap-0.5 p-1 bg-[#fcfaf2] border border-[#2d2d2d]">
                {leftGrid.map((row, r) => (
                  <div key={r} className="flex gap-0.5">
                    {row.map((cell, c) => {
                      let cellBg = 'bg-[#fcfaf2] border border-[#2d2d2d]/10';
                      if (cell.type === 'start') cellBg = 'bg-[#1b365d]';
                      else if (cell.type === 'end') cellBg = 'bg-[#722f37]';
                      else if (cell.type === 'wall') cellBg = 'bg-[#5a5a5a]';
                      else if (cell.isPath) cellBg = 'bg-[#2e5a44]';
                      else if (cell.visited) cellBg = 'bg-[#1b365d]/10 border border-[#1b365d]/20';

                      return <div key={c} className={`w-[18px] h-[18px] ${cellBg}`} />;
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex items-end justify-center gap-1.5 h-36 max-w-xs">
                {leftArray.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${(val / 95) * 80 + 10}%` }}
                      className="bg-[#1b365d]/30 border border-[#1b365d] w-full"
                    />
                    <span className="text-[8px] font-mono text-center text-slate-650 mt-1">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Arena */}
        <div className="glass-panel border-[#2d2d2d] p-6 flex flex-col items-center justify-between min-h-[360px] bg-[#f4f0e6]">
          <div className="w-full flex items-center justify-between border-b border-[#2d2d2d]/30 pb-3">
            <h3 className="text-sm font-serif font-extrabold uppercase text-[#722f37] tracking-wider">
              {raceType === 'pathfinding' ? `${rightPathAlgo.toUpperCase()} Search` : `${rightSortAlgo.toUpperCase()} Sort`}
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#fcfaf2] border border-[#2d2d2d] text-[#1c1c1c] px-2 py-0.5">
              {raceType === 'pathfinding' ? `Visited: ${rightVisitedCount}` : `Comparisons: ${rightComparisons}`}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center w-full my-6">
            {raceType === 'pathfinding' ? (
              <div className="grid gap-0.5 p-1 bg-[#fcfaf2] border border-[#2d2d2d]">
                {rightGrid.map((row, r) => (
                  <div key={r} className="flex gap-0.5">
                    {row.map((cell, c) => {
                      let cellBg = 'bg-[#fcfaf2] border border-[#2d2d2d]/10';
                      if (cell.type === 'start') cellBg = 'bg-[#1b365d]';
                      else if (cell.type === 'end') cellBg = 'bg-[#722f37]';
                      else if (cell.type === 'wall') cellBg = 'bg-[#5a5a5a]';
                      else if (cell.isPath) cellBg = 'bg-[#2e5a44]';
                      else if (cell.visited) cellBg = 'bg-[#722f37]/10 border border-[#722f37]/20';

                      return <div key={c} className={`w-[18px] h-[18px] ${cellBg}`} />;
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex items-end justify-center gap-1.5 h-36 max-w-xs">
                {rightArray.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${(val / 95) * 80 + 10}%` }}
                      className="bg-[#722f37]/35 border border-[#722f37] w-full"
                    />
                    <span className="text-[8px] font-mono text-center text-slate-650 mt-1">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outcome HUD */}
      {winnerMessage && (
        <div className="w-full glass-panel border-[#2d2d2d] p-6 text-center text-sm font-bold text-[#1c1c1c] bg-[#f4f0e6] max-w-md mx-auto animate-fade-in space-y-2">
          <div className="text-[9px] uppercase text-[#5a5a5a]">Race Outcome</div>
          <div className="text-lg font-serif font-black text-[#722f37]">{winnerMessage}</div>
          <div className="text-[#5a5a5a] text-xs leading-normal">
            {raceType === 'pathfinding'
              ? `Left algorithm visited ${leftVisitedCount} nodes. Right algorithm visited ${rightVisitedCount} nodes.`
              : `Left algorithm took ${leftComparisons} comparisons. Right algorithm took ${rightComparisons} comparisons.`}
          </div>
        </div>
      )}
    </div>
  );
};
export default RaceGallery;
