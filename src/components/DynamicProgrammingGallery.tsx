import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Table, Edit3 } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

// Interfaces for DP
interface DPState {
  matrix: number[][];
  focusedCell?: { row: number; col: number };
  solvedCells?: Array<{ row: number; col: number }>;
  itemsSelected?: string[];
  lcsResultString?: string;
}

interface KnapsackItem {
  name: string;
  weight: number;
  value: number;
}

interface KnapsackInput {
  items: KnapsackItem[];
  capacity: number;
}

interface LcsInput {
  strA: string;
  strB: string;
}

// Pseudocodes
const knapsackPseudocode = [
  { text: "procedure Knapsack(val, wt, W)", indent: 0 },
  { text: "n := length(val)", indent: 1 },
  { text: "create table dp[n+1][W+1] initialized to 0", indent: 1 },
  { text: "for i := 1 to n do", indent: 1 },
  { text: "for w := 0 to W do", indent: 2 },
  { text: "if wt[i-1] <= w then", indent: 3 },
  { text: "dp[i][w] := max(val[i-1] + dp[i-1][w-wt[i-1]], dp[i-1][w])", indent: 4 },
  { text: "else", indent: 3 },
  { text: "dp[i][w] := dp[i-1][w]", indent: 4 },
];

const knapsackPython = [
  { text: "def knapsack(weights, values, W):", indent: 0 },
  { text: "n = len(weights)", indent: 1 },
  { text: "K = [[0 for x in range(W + 1)] for x in range(n + 1)]", indent: 1 },
  { text: "for i in range(n + 1):", indent: 1 },
  { text: "for w in range(W + 1):", indent: 2 },
  { text: "if i == 0 or w == 0:", indent: 3 },
  { text: "K[i][w] = 0", indent: 4 },
  { text: "elif weights[i-1] <= w:", indent: 3 },
  { text: "K[i][w] = max(values[i-1] + K[i-1][w-weights[i-1]], K[i-1][w])", indent: 4 },
  { text: "else:", indent: 3 },
  { text: "K[i][w] = K[i-1][w]", indent: 4 },
  { text: "return K[n][W]", indent: 1 },
];

const lcsPseudocode = [
  { text: "procedure LCS(A, B)", indent: 0 },
  { text: "m := length(A); n := length(B)", indent: 1 },
  { text: "create table dp[m+1][n+1] initialized to 0", indent: 1 },
  { text: "for i := 1 to m do", indent: 1 },
  { text: "for j := 1 to n do", indent: 2 },
  { text: "if A[i-1] == B[j-1] then", indent: 3 },
  { text: "dp[i][j] := 1 + dp[i-1][j-1]", indent: 4 },
  { text: "else", indent: 3 },
  { text: "dp[i][j] := max(dp[i-1][j], dp[i][j-1])", indent: 4 },
];

const lcsPython = [
  { text: "def lcs(X, Y):", indent: 0 },
  { text: "m = len(X)", indent: 1 },
  { text: "n = len(Y)", indent: 1 },
  { text: "L = [[0] * (n + 1) for i in range(m + 1)]", indent: 1 },
  { text: "for i in range(m + 1):", indent: 1 },
  { text: "for j in range(n + 1):", indent: 2 },
  { text: "if i == 0 or j == 0:", indent: 3 },
  { text: "L[i][j] = 0", indent: 4 },
  { text: "elif X[i-1] == Y[j-1]:", indent: 3 },
  { text: "L[i][j] = L[i-1][j-1] + 1", indent: 4 },
  { text: "else:", indent: 3 },
  { text: "L[i][j] = max(L[i-1][j], L[i][j-1])", indent: 4 },
  { text: "return L[m][n]", indent: 1 },
];

// Runners
const knapsackRunner = function* (input: KnapsackInput) {
  const { items, capacity: W } = input;
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

  yield {
    line: 1,
    explanation: "Welcome to the Knapsack 0/1 exhibit. We want to maximize the value of items placed in our backpack without exceeding its capacity.",
    variables: { items: n, capacity: W },
    state: { matrix: dp.map(row => [...row]) },
  };

  yield {
    line: 3,
    explanation: "We initialize our memoization table with dimensions (items + 1) x (capacity + 1). All values default to 0 representing base cases.",
    variables: { items: n, capacity: W },
    state: { matrix: dp.map(row => [...row]) },
  };

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= W; w++) {
      let explanation = '';
      let line = 5;
      const solved: Array<{ row: number; col: number }> = [];

      if (item.weight <= w) {
        line = 7;
        const takeValue = item.value + dp[i - 1][w - item.weight];
        const leaveValue = dp[i - 1][w];
        
        dp[i][w] = Math.max(takeValue, leaveValue);
        
        solved.push({ row: i - 1, col: w });
        solved.push({ row: i - 1, col: w - item.weight });

        explanation = `Evaluating item '${item.name}' (weight: ${item.weight}, value: ${item.value}) for sub-capacity ${w}. Since it fits, we choose between leaving it (value: ${leaveValue}) or taking it (value: ${item.value} + dp[${i - 1}][${w - item.weight}] = ${takeValue}). We choose the maximum: ${dp[i][w]}.`;
      } else {
        line = 9;
        dp[i][w] = dp[i - 1][w];
        solved.push({ row: i - 1, col: w });
        explanation = `Evaluating item '${item.name}' (weight: ${item.weight}, value: ${item.value}) for sub-capacity ${w}. Since its weight exceeds capacity, we must leave it. We carry forward value from cell above: dp[${i-1}][${w}] = ${dp[i][w]}.`;
      }

      yield {
        line,
        explanation,
        variables: { i, w, 'item.weight': item.weight, 'item.value': item.value, 'dp[i][w]': dp[i][w] },
        state: { matrix: dp.map(row => [...row]), focusedCell: { row: i, col: w }, solvedCells: solved }
      };
    }
  }

  // Backtrack to find items taken
  let res = dp[n][W];
  let w = W;
  const taken: string[] = [];
  for (let i = n; i > 0 && res > 0; i--) {
    if (res !== dp[i - 1][w]) {
      taken.push(items[i - 1].name);
      res -= items[i - 1].value;
      w -= items[i - 1].weight;
    }
  }

  yield {
    line: 1,
    explanation: `Table fully populated. Maximum value achievable is ${dp[n][W]}. Backtracking reveals items included: ${taken.join(', ') || 'None'}.`,
    variables: { max_value: dp[n][W], items_taken: taken.join(', ') },
    state: { matrix: dp.map(row => [...row]), itemsSelected: taken }
  };
};

const lcsRunner = function* (input: LcsInput) {
  const { strA, strB } = input;
  const m = strA.length;
  const n = strB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  yield {
    line: 1,
    explanation: `Longest Common Subsequence (LCS) finds the longest sequence of characters that appear in the same order in both strings "${strA}" and "${strB}".`,
    variables: { lenA: m, lenB: n },
    state: { matrix: dp.map(row => [...row]) },
  };

  yield {
    line: 3,
    explanation: "Initialize our memoization grid with zeros for base cases (empty string prefixes).",
    variables: { lenA: m, lenB: n },
    state: { matrix: dp.map(row => [...row]) },
  };

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      let explanation = '';
      let line = 5;
      const solved: Array<{ row: number; col: number }> = [];

      if (strA[i - 1] === strB[j - 1]) {
        line = 7;
        dp[i][j] = dp[i - 1][j - 1] + 1;
        solved.push({ row: i - 1, col: j - 1 });
        explanation = `Characters at index ${i - 1} of A ('${strA[i - 1]}') and index ${j - 1} of B ('${strB[j - 1]}') match! We add 1 to the diagonal score: dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}.`;
      } else {
        line = 9;
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        solved.push({ row: i - 1, col: j });
        solved.push({ row: i, col: j - 1 });
        explanation = `Characters at index ${i - 1} of A ('${strA[i - 1]}') and index ${j - 1} of B ('${strB[j - 1]}') mismatch. We take the maximum of adjacent cells: max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = ${dp[i][j]}.`;
      }

      yield {
        line,
        explanation,
        variables: { i, j, 'A[i-1]': strA[i - 1], 'B[j-1]': strB[j - 1], 'dp[i][j]': dp[i][j] },
        state: { matrix: dp.map(row => [...row]), focusedCell: { row: i, col: j }, solvedCells: solved }
      };
    }
  }

  // Backtrack to build result subsequence string
  let tempA = m;
  let tempB = n;
  const lcsChars: string[] = [];

  while (tempA > 0 && tempB > 0) {
    if (strA[tempA - 1] === strB[tempB - 1]) {
      lcsChars.unshift(strA[tempA - 1]);
      tempA--;
      tempB--;
    } else if (dp[tempA - 1][tempB] > dp[tempA][tempB - 1]) {
      tempA--;
    } else {
      tempB--;
    }
  }

  const resultStr = lcsChars.join('');

  yield {
    line: 1,
    explanation: `Grid populated. The longest common subsequence is "${resultStr}" with length ${dp[m][n]}.`,
    variables: { lcs_length: dp[m][n], lcs: resultStr },
    state: { matrix: dp.map(row => [...row]), lcsResultString: resultStr }
  };
};

const knapsackDef: AlgorithmDefinition<DPState, KnapsackInput> = {
  name: "Knapsack 0/1 Solver",
  description: "Given weights and values of items, put these items in a knapsack of capacity W to get the maximum total value. Dynamic programming breaks this down into optimal sub-capacities.",
  complexity: { time: "O(N * W)", space: "O(N * W)" },
  history: "The knapsack problem has been studied for over a century, with early formulations dating back to 1897. The term 'knapsack problem' was coined by mathematician Tobias Dantzig. Dynamic programming solutions were popularized by Richard Bellman in the 1950s.",
  funFact: "The 0/1 property means items cannot be divided; you either take an item in its entirety or leave it.",
  pseudocode: knapsackPseudocode,
  run: knapsackRunner,
  defaultInput: {
    items: [
      { name: 'Book', weight: 1, value: 15 },
      { name: 'Ring', weight: 2, value: 20 },
      { name: 'Laptop', weight: 3, value: 30 },
      { name: 'Flask', weight: 1, value: 10 },
    ],
    capacity: 5
  }
};

const lcsDef: AlgorithmDefinition<DPState, LcsInput> = {
  name: "Longest Common Subsequence (LCS)",
  description: "Find the longest subsequence common to two sequences. Subsequences do not need to occupy consecutive positions, unlike substrings.",
  complexity: { time: "O(M * N)", space: "O(M * N)" },
  history: "LCS was first defined by mathematician and computer scientist David Sankoff in 1972 in the context of sequence alignment for molecular biology.",
  funFact: "LCS forms the mathematical backbone of the 'diff' utility used in Git to compare versions of source code files.",
  pseudocode: lcsPseudocode,
  run: lcsRunner,
  defaultInput: {
    strA: "BATMAN",
    strB: "CATAMARAN"
  }
};

export const DynamicProgrammingGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'knapsack' | 'lcs'>('knapsack');
  const [showPlacard, setShowPlacard] = useState(true);

  // Knapsack settings
  const [capacity, setCapacity] = useState(5);
  const [knapsackItems] = useState<KnapsackItem[]>([
    { name: 'A', weight: 1, value: 10 },
    { name: 'B', weight: 2, value: 15 },
    { name: 'C', weight: 3, value: 40 },
    { name: 'D', weight: 2, value: 25 },
  ]);

  // LCS settings
  const [strA, setStrA] = useState('STONE');
  const [strB, setStrB] = useState('LONGEST');

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<DPState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAlgoDefinition = () => {
    return selectedAlgo === 'knapsack' ? knapsackDef : lcsDef;
  };

  const getPythonCode = () => {
    return selectedAlgo === 'knapsack' ? knapsackPython : lcsPython;
  };

  const initAlgorithm = () => {
    setIsPlaying(false);
    const collectedSteps: AlgorithmStep<DPState>[] = [];

    if (selectedAlgo === 'knapsack') {
      const generator = knapsackRunner({ items: knapsackItems, capacity });
      let res = generator.next();
      while (!res.done) {
        if (res.value) collectedSteps.push(res.value);
        res = generator.next();
      }
    } else {
      const generator = lcsRunner({ strA, strB });
      let res = generator.next();
      while (!res.done) {
        if (res.value) collectedSteps.push(res.value);
        res = generator.next();
      }
    }

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    initAlgorithm();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedAlgo, knapsackItems, capacity, strA, strB]);

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

  const def = getAlgoDefinition();

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="The Dynamic Programming Vault"
        description="Dynamic Programming is a mathematical method for solving complex optimization problems by breaking them down into simpler, overlapping subproblems. It solves each subproblem just once and remembers the answer, rather than recalculating it."
        history="Richard Bellman (pictured) developed dynamic programming in the 1950s while at RAND Corporation. He chose the name 'dynamic programming' to hide the fact that he was doing mathematical research from a secretary of defense who disliked math."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Memoization']}
        imageUrl="https://upload.wikimedia.org/wikipedia/en/7/7a/Richard_Ernest_Bellman.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready to solve.',
    variables: {},
    state: { matrix: [[]] }
  };

  const matrix = currentStep.state?.matrix || [[]];
  const focusedCell = currentStep.state?.focusedCell;
  const solvedCells = currentStep.state?.solvedCells || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Table className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
                setShowPlacard(true);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="knapsack">Knapsack 0/1 Solver</option>
              <option value="lcs">Longest Common Subsequence (LCS)</option>
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
              {isPlaying ? 'Pause' : 'Solve DP Table'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Speed</span>
            <input
              type="range"
              min="100"
              max="1500"
              step="100"
              value={1600 - speed}
              onChange={(e) => setSpeed(1600 - parseInt(e.target.value))}
              className="w-20 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* DP Matrix Table View */}
        <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col justify-center items-center relative overflow-hidden bg-[#f4f0e6] min-h-[360px]">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#1b365d]">Memoization Matrix Grid</span>
          </div>

          {/* Color Indicators */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#fcfaf2] border border-[#2d2d2d]"></span>
              <span>Computed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#722f37] text-white flex items-center justify-center text-[8px]">Active</span>
              <span>Target Cell</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d]/10 border border-[#1b365d]/40"></span>
              <span>Subproblem Input Dependency</span>
            </div>
          </div>

          {/* The Grid Table */}
          <div className="flex-1 flex items-center justify-center w-full mt-10 overflow-auto">
            <table className="border-collapse border border-[#2d2d2d] bg-[#fcfaf2]">
              <thead>
                <tr>
                  <th className="border border-[#2d2d2d] p-2 bg-[#f4f0e6] font-mono text-[10px] text-slate-500">
                    {selectedAlgo === 'knapsack' ? 'Items' : 'Str A'}
                  </th>
                  {matrix[0]?.map((_, colIdx) => (
                    <th key={colIdx} className="border border-[#2d2d2d] p-2 bg-[#f4f0e6] font-mono text-[10px] text-[#1c1c1c] text-center w-12">
                      {selectedAlgo === 'knapsack' ? `w:${colIdx}` : (colIdx === 0 ? 'Ø' : strB[colIdx - 1])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="border border-[#2d2d2d] p-2 bg-[#f4f0e6] font-bold text-xs font-serif text-[#1c1c1c] max-w-[100px] truncate">
                      {selectedAlgo === 'knapsack'
                        ? (rIdx === 0 ? 'Ø' : knapsackItems[rIdx - 1]?.name)
                        : (rIdx === 0 ? 'Ø' : strA[rIdx - 1])}
                    </td>
                    {row.map((cell, cIdx) => {
                      const isFocused = focusedCell?.row === rIdx && focusedCell?.col === cIdx;
                      const isDependency = solvedCells.some(cell => cell.row === rIdx && cell.col === cIdx);

                      let cellBg = 'bg-[#fcfaf2]';
                      let cellText = 'text-[#1c1c1c]';

                      if (isFocused) {
                        cellBg = 'bg-[#722f37]';
                        cellText = 'text-white font-bold';
                      } else if (isDependency) {
                        cellBg = 'bg-[#1b365d]/10';
                        cellText = 'text-[#1b365d] font-bold';
                      }

                      return (
                        <td
                          key={cIdx}
                          className={`border border-[#2d2d2d] p-2.5 text-center font-mono text-xs ${cellBg} ${cellText}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input variables */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-col gap-4 bg-[#f4f0e6]">
          <div className="flex items-center gap-1.5 border-b border-[#2d2d2d]/30 pb-2">
            <Edit3 size={15} className="text-[#1b365d]" />
            <h4 className="text-sm font-bold text-[#1c1c1c] font-serif">Configure DP Datasets</h4>
          </div>

          {selectedAlgo === 'knapsack' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="block text-[#5a5a5a] font-bold uppercase tracking-wider text-[9px]">Knapsack Weight Capacity</label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-850 h-1.5 rounded-lg"
                />
                <span className="text-xs font-mono font-bold text-[#1c1c1c] block">Capacity: {capacity}</span>
              </div>
              <div className="space-y-2">
                <label className="block text-[#5a5a5a] font-bold uppercase tracking-wider text-[9px]">Items list (Max 4 items)</label>
                <div className="flex gap-2 text-[10px] font-mono">
                  {knapsackItems.map((item, idx) => (
                    <div key={idx} className="bg-[#fcfaf2] border border-[#2d2d2d] p-2 flex flex-col items-center flex-1">
                      <span className="font-bold text-[#1c1c1c]">{item.name}</span>
                      <span className="text-slate-500">w:{item.weight} v:{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="block text-[#5a5a5a] font-bold uppercase tracking-wider text-[9px]">String A</label>
                <input
                  type="text"
                  maxLength={8}
                  value={strA}
                  onChange={(e) => setStrA(e.target.value.toUpperCase())}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-full font-mono uppercase tracking-widest text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[#5a5a5a] font-bold uppercase tracking-wider text-[9px]">String B</label>
                <input
                  type="text"
                  maxLength={8}
                  value={strB}
                  onChange={(e) => setStrB(e.target.value.toUpperCase())}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-full font-mono uppercase tracking-widest text-center"
                />
              </div>
            </div>
          )}
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
export default DynamicProgrammingGallery;
