import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Edit3 } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

interface StringState {
  text: string;
  pattern: string;
  textIdx: number;
  patternIdx: number;
  matchIndices: number[];
  comparisonStatus: 'match' | 'mismatch' | 'none' | 'hashMatch' | 'hashMismatch';
  foundIndices: number[];
  kmpPiTable?: number[];
  rabinKarpHashes?: { patternHash: number; textHash: number; step: number };
  actionMessage: string;
}

const kmpPseudocode = [
  { text: "procedure KMP(text, pattern)", indent: 0 },
  { text: "pi := computeLPS(pattern)", indent: 1 },
  { text: "i := 0; j := 0", indent: 1 },
  { text: "while i < length(text) do", indent: 1 },
  { text: "if pattern[j] == text[i] then i++, j++", indent: 2 },
  { text: "if j == length(pattern) then return match at i-j; j := pi[j-1]", indent: 2 },
  { text: "else if i < length(text) and pattern[j] != text[i] then", indent: 2 },
  { text: "if j != 0 then j := pi[j-1]", indent: 3 },
  { text: "else i := i + 1", indent: 3 },
];

const kmpPython = [
  { text: "def kmp_search(text, pattern):", indent: 0 },
  { text: "n, m = len(text), len(pattern)", indent: 1 },
  { text: "pi = compute_lps(pattern)", indent: 1 },
  { text: "i = j = 0", indent: 1 },
  { text: "while i < n:", indent: 1 },
  { text: "if pattern[j] == text[i]: i += 1; j += 1", indent: 2 },
  { text: "if j == m:", indent: 2 },
  { text: "print('Match at', i - j)", indent: 3 },
  { text: "j = pi[j - 1]", indent: 3 },
  { text: "elif i < n and pattern[j] != text[i]:", indent: 2 },
  { text: "if j != 0: j = pi[j - 1]", indent: 3 },
  { text: "else: i += 1", indent: 3 },
];

const rabinKarpPseudocode = [
  { text: "procedure RabinKarp(text, pattern)", indent: 0 },
  { text: "pHash := hash(pattern); tHash := hash(text[0..m-1])", indent: 1 },
  { text: "for s := 0 to n - m do", indent: 1 },
  { text: "if pHash == tHash then", indent: 2 },
  { text: "if text[s..s+m-1] == pattern then match found at s", indent: 3 },
  { text: "if s < n - m then", indent: 2 },
  { text: "tHash := rollHash(tHash, text[s], text[s+m])", indent: 3 },
];

const rabinKarpPython = [
  { text: "def rabin_karp(text, pattern):", indent: 0 },
  { text: "n, m = len(text), len(pattern)", indent: 1 },
  { text: "p_hash = hash(pattern) % 101", indent: 1 },
  { text: "t_hash = hash(text[:m]) % 101", indent: 1 },
  { text: "for s in range(n - m + 1):", indent: 1 },
  { text: "if p_hash == t_hash:", indent: 2 },
  { text: "if text[s:s+m] == pattern:", indent: 3 },
  { text: "print('Match found at', s)", indent: 4 },
  { text: "if s < n - m:", indent: 2 },
  { text: "t_hash = roll_hash(t_hash, text[s], text[s+m])", indent: 3 },
];

const stringAlgoDef: AlgorithmDefinition<StringState, any> = {
  name: "String Matchers",
  description: "String matching algorithms locate patterns inside body texts. KMP uses prefix skips to achieve linear time, while Rabin-Karp uses rolling hashes.",
  complexity: { time: "O(N + M)", space: "O(M)" },
  history: "The Knuth-Morris-Pratt algorithm was conceived in 1970 by Donald Knuth and Vaughan Pratt, and independently by James H. Morris. It was published jointly in 1977. Rabin-Karp was developed by Michael O. Rabin and Richard M. Karp in 1987.",
  funFact: "KMP was inspired by a theorem on automata design, avoiding backtracking by remembering the matched history.",
  pseudocode: kmpPseudocode,
  run: function* () {
    yield {
      line: 1,
      explanation: "Welcome to the String Matching exhibit. Enter custom text/patterns and watch KMP skip checks or Rabin-Karp compare hashes.",
      variables: {},
      state: { text: '', pattern: '', textIdx: -1, patternIdx: -1, matchIndices: [], comparisonStatus: 'none', foundIndices: [], actionMessage: 'Ready' }
    };
  },
  defaultInput: null
};

const computeSimpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  return hash % 101;
};

export const StringGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'kmp' | 'rabinKarp'>('kmp');
  const [showPlacard, setShowPlacard] = useState(true);
  const [text, setText] = useState('AABACAABACABAC');
  const [pattern, setPattern] = useState('AABAC');

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<StringState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initAlgorithm = (t = text, p = pattern) => {
    setIsPlaying(false);
    if (t.length < p.length || p.length === 0) {
      setSteps([]);
      return;
    }

    const collectedSteps: AlgorithmStep<StringState>[] = [];
    const n = t.length;
    const m = p.length;

    if (selectedAlgo === 'kmp') {
      const pi = Array(m).fill(0);
      let len = 0;
      let k = 1;
      
      while (k < m) {
        if (p[k] === p[len]) {
          len++;
          pi[k] = len;
          k++;
        } else {
          if (len !== 0) {
            len = pi[len - 1];
          } else {
            pi[k] = 0;
            k++;
          }
        }
      }

      collectedSteps.push({
        line: 2,
        explanation: `Starting KMP. First, we compute the Longest Prefix Suffix (LPS) table for pattern "${p}". LPS Table: [${pi.join(', ')}].`,
        variables: { text: t, pattern: p, 'pi_table': `[${pi.join(',')}]` },
        state: { text: t, pattern: p, textIdx: 0, patternIdx: 0, matchIndices: [], comparisonStatus: 'none', foundIndices: [], kmpPiTable: pi, actionMessage: 'LPS Computed' }
      });

      let i = 0;
      let j = 0;
      const found: number[] = [];

      while (i < n) {
        collectedSteps.push({
          line: 4,
          explanation: `Comparing character in Text at index ${i} ('${t[i]}') with Pattern index ${j} ('${p[j]}').`,
          variables: { i, j, 'text[i]': t[i], 'pattern[j]': p[j] },
          state: { text: t, pattern: p, textIdx: i, patternIdx: j, matchIndices: Array.from({ length: j }, (_, k) => i - j + k), comparisonStatus: t[i] === p[j] ? 'match' : 'mismatch', foundIndices: [...found], kmpPiTable: pi, actionMessage: 'Character Check' }
        });

        if (p[j] === t[i]) {
          i++;
          j++;
          
          if (j === m) {
            found.push(i - j);
            const matchStart = i - j;
            j = pi[j - 1];

            collectedSteps.push({
              line: 6,
              explanation: `Pattern match found starting at index ${matchStart}! Recording result. Sliding pattern index j to pi[j-1] = ${j} for sub-checks.`,
              variables: { i, j, matchStart, found: found.join(', ') },
              state: { text: t, pattern: p, textIdx: i - 1, patternIdx: m - 1, matchIndices: Array.from({ length: m }, (_, k) => matchStart + k), comparisonStatus: 'match', foundIndices: [...found], kmpPiTable: pi, actionMessage: 'Match Found' }
            });
          }
        } else {
          if (j !== 0) {
            const oldJ = j;
            j = pi[j - 1];
            
            collectedSteps.push({
              line: 8,
              explanation: `Mismatch! Pattern index j slips back using LPS table: j := pi[${oldJ - 1}] = ${j}. Text pointer i stays at ${i}.`,
              variables: { i, oldJ, newJ: j },
              state: { text: t, pattern: p, textIdx: i, patternIdx: j, matchIndices: Array.from({ length: j }, (_, k) => i - j + k), comparisonStatus: 'none', foundIndices: [...found], kmpPiTable: pi, actionMessage: 'LPS Shift' }
            });
          } else {
            i++;
            collectedSteps.push({
              line: 9,
              explanation: `Mismatch at start of pattern (j = 0). Incrementing text index i to ${i}.`,
              variables: { i, j },
              state: { text: t, pattern: p, textIdx: i, patternIdx: 0, matchIndices: [], comparisonStatus: 'none', foundIndices: [...found], kmpPiTable: pi, actionMessage: 'Shift Text Pointer' }
            });
          }
        }
      }

      collectedSteps.push({
        line: 4,
        explanation: `Text end reached. KMP Search completed. Matches found at positions: ${found.join(', ') || 'None'}.`,
        variables: { foundCount: found.length },
        state: { text: t, pattern: p, textIdx: n, patternIdx: 0, matchIndices: [], comparisonStatus: 'none', foundIndices: [...found], kmpPiTable: pi, actionMessage: 'Search Finished' }
      });
    } else {
      // Rabin-Karp
      const pHash = computeSimpleHash(p);
      let tHash = computeSimpleHash(t.substring(0, m));
      const found: number[] = [];

      collectedSteps.push({
        line: 2,
        explanation: `Calculating initial hashes. Pattern hash = ${pHash}, first Text substring hash ("${t.substring(0, m)}") = ${tHash}.`,
        variables: { pHash, tHash, window: `"${t.substring(0, m)}"` },
        state: { text: t, pattern: p, textIdx: 0, patternIdx: 0, matchIndices: [], comparisonStatus: 'none', foundIndices: [], rabinKarpHashes: { patternHash: pHash, textHash: tHash, step: 0 }, actionMessage: 'Hash Init' }
      });

      for (let s = 0; s <= n - m; s++) {
        const textWindow = t.substring(s, s + m);
        const hashMatch = pHash === tHash;

        collectedSteps.push({
          line: 4,
          explanation: `Comparing hashes for slide s = ${s}. Window: "${textWindow}". Pattern hash: ${pHash}, Window hash: ${tHash}. ${hashMatch ? 'Hashes match!' : 'Hashes mismatch.'}`,
          variables: { slide: s, pHash, tHash, match: String(hashMatch) },
          state: { text: t, pattern: p, textIdx: s, patternIdx: 0, matchIndices: [], comparisonStatus: hashMatch ? 'hashMatch' : 'hashMismatch', foundIndices: [...found], rabinKarpHashes: { patternHash: pHash, textHash: tHash, step: s }, actionMessage: 'Hash Check' }
        });

        if (hashMatch) {
          let match = true;
          for (let j = 0; j < m; j++) {
            collectedSteps.push({
              line: 5,
              explanation: `Hash matches. Verifying characters inside window: comparing '${t[s + j]}' and '${p[j]}'.`,
              variables: { slide: s, j, textChar: t[s + j], patternChar: p[j] },
              state: { text: t, pattern: p, textIdx: s + j, patternIdx: j, matchIndices: Array.from({ length: j + 1 }, (_, k) => s + k), comparisonStatus: t[s + j] === p[j] ? 'match' : 'mismatch', foundIndices: [...found], rabinKarpHashes: { patternHash: pHash, textHash: tHash, step: s }, actionMessage: 'Char Verification' }
            });

            if (t[s + j] !== p[j]) {
              match = false;
              break;
            }
          }

          if (match) {
            found.push(s);
            collectedSteps.push({
              line: 5,
              explanation: `All characters matched! Pattern occurrence confirmed at index ${s}.`,
              variables: { slide: s, found: found.join(', ') },
              state: { text: t, pattern: p, textIdx: s, patternIdx: 0, matchIndices: Array.from({ length: m }, (_, k) => s + k), comparisonStatus: 'match', foundIndices: [...found], rabinKarpHashes: { patternHash: pHash, textHash: tHash, step: s }, actionMessage: 'Match' }
            });
          }
        }

        if (s < n - m) {
          const oldChar = t[s];
          const newChar = t[s + m];
          
          tHash = (tHash - oldChar.charCodeAt(0) + newChar.charCodeAt(0)) % 101;
          if (tHash < 0) tHash += 101;

          collectedSteps.push({
            line: 7,
            explanation: `Rolling hash window right. Subtracting character '${oldChar}', adding '${newChar}'. New window hash: ${tHash}.`,
            variables: { slide: s, oldChar, newChar, nextHash: tHash },
            state: { text: t, pattern: p, textIdx: s + 1, patternIdx: 0, matchIndices: [], comparisonStatus: 'none', foundIndices: [...found], rabinKarpHashes: { patternHash: pHash, textHash: tHash, step: s + 1 }, actionMessage: 'Rolling Hash' }
          });
        }
      }

      collectedSteps.push({
        line: 3,
        explanation: `Finished sliding text. Rabin-Karp completed. Found occurrences at: ${found.join(', ') || 'None'}.`,
        variables: { foundCount: found.length },
        state: { text: t, pattern: p, textIdx: n, patternIdx: 0, matchIndices: [], comparisonStatus: 'none', foundIndices: [...found], rabinKarpHashes: { patternHash: pHash, textHash: tHash, step: n - m }, actionMessage: 'Finished' }
      });
    }

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    initAlgorithm();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedAlgo, text, pattern]);

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

  const def = stringAlgoDef;
  const codeLines = selectedAlgo === 'kmp' ? kmpPseudocode : rabinKarpPseudocode;
  const pythonCode = selectedAlgo === 'kmp' ? kmpPython : rabinKarpPython;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="String Matchers"
        description="String matching algorithms scan large texts to locate all occurrences of a smaller target pattern. Instead of checking every single letter sequentially, they use smart mathematical skips or signature hashes."
        history="Donald Knuth (pictured) and Vaughan Pratt conceived the KMP algorithm in 1970 to build faster text search compilers. Michael Rabin and Richard Karp followed in 1987 with rolling hashes to evaluate multiple words simultaneously."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Rolling Hash']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/a/ae/Donald_Knuth_at_Stanford_in_2005.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready.',
    variables: {},
    state: { text, pattern, textIdx: -1, patternIdx: -1, matchIndices: [], comparisonStatus: 'none', foundIndices: [], actionMessage: 'Ready' }
  };

  const textIdx = currentStep.state?.textIdx ?? -1;
  const patternIdx = currentStep.state?.patternIdx ?? -1;
  const matchIndices = currentStep.state?.matchIndices || [];
  const comparisonStatus = currentStep.state?.comparisonStatus || 'none';
  const foundIndices = currentStep.state?.foundIndices || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Edit3 className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
                setShowPlacard(true);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="kmp">Knuth-Morris-Pratt (KMP)</option>
              <option value="rabinKarp">Rabin-Karp (Rolling Hash)</option>
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
              disabled={steps.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                steps.length === 0
                  ? 'opacity-40 cursor-not-allowed border-slate-850 text-slate-500'
                  : isPlaying
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700'
                  : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-700'
              }`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Search String'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Speed</span>
            <input
              type="range"
              min="50"
              max="1500"
              step="50"
              value={1550 - speed}
              onChange={(e) => setSpeed(1550 - parseInt(e.target.value))}
              className="w-20 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* Text Grid Boxes */}
        <div className="flex-1 glass-panel rounded-3xl p-8 flex flex-col justify-between items-center relative overflow-hidden bg-[#f4f0e6] min-h-[360px]">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#1b365d]">Text & Pattern Alignment</span>
          </div>

          {/* Color State indicators */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#fcfaf2] border border-[#2d2d2d]"></span>
              <span>Default</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d]/10 border border-[#1b365d]/40"></span>
              <span>Evaluating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#2e5a44]/20 border border-[#2e5a44]/40"></span>
              <span>Match</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#722f37]/20 border border-[#722f37]/40"></span>
              <span>Mismatch</span>
            </div>
          </div>

          {/* Text grid alignment */}
          <div className="flex-1 w-full flex flex-col justify-center items-center gap-8 mt-6">
            {/* The Text string */}
            <div className="space-y-2 w-full max-w-xl">
              <span className="text-[9px] font-black uppercase text-[#5a5a5a] tracking-wider block">Input Text (N={text.length})</span>
              <div className="flex flex-wrap gap-1">
                {text.split('').map((char, idx) => {
                  const isPointer = textIdx === idx;
                  const isFound = foundIndices.some(startIdx => idx >= startIdx && idx < startIdx + pattern.length);
                  const isMatched = matchIndices.includes(idx);
                  
                  let cellBg = 'bg-[#fcfaf2] border-[#2d2d2d]';
                  let charColor = 'text-[#1c1c1c]';

                  if (isPointer) {
                    if (comparisonStatus === 'match') {
                      cellBg = 'bg-[#2e5a44]/15 border-[#2e5a44]';
                      charColor = 'text-[#2e5a44] font-bold';
                    } else if (comparisonStatus === 'mismatch') {
                      cellBg = 'bg-[#722f37]/15 border-[#722f37]';
                      charColor = 'text-[#722f37] font-bold';
                    } else {
                      cellBg = 'bg-[#1b365d]/15 border-[#1b365d]';
                      charColor = 'text-[#1b365d] font-bold';
                    }
                  } else if (isMatched) {
                    cellBg = 'bg-indigo-500/10 border-indigo-500/30';
                    charColor = 'text-indigo-800';
                  } else if (isFound) {
                    cellBg = 'bg-[#2e5a44]/25 border-[#2e5a44]/40';
                    charColor = 'text-[#2e5a44]';
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-8 h-8 border flex items-center justify-center font-mono font-bold text-xs ${cellBg} ${charColor}`}>
                        {char}
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 mt-1">{idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pattern string */}
            <div className="space-y-2 w-full max-w-xl">
              <span className="text-[9px] font-black uppercase text-[#5a5a5a] tracking-wider block">Pattern Search (M={pattern.length})</span>
              <div className="flex gap-1" style={{ marginLeft: `${Math.max(0, textIdx - patternIdx) * 36}px`, transition: 'margin 0.3s ease' }}>
                {pattern.split('').map((char, idx) => {
                  const isPointer = patternIdx === idx;
                  let cellBg = 'bg-[#fcfaf2] border-[#2d2d2d]';
                  let charColor = 'text-[#5a5a5a]';

                  if (isPointer) {
                    if (comparisonStatus === 'match') {
                      cellBg = 'bg-[#2e5a44]/15 border-[#2e5a44]';
                      charColor = 'text-[#2e5a44] font-bold';
                    } else if (comparisonStatus === 'mismatch') {
                      cellBg = 'bg-[#722f37]/15 border-[#722f37]';
                      charColor = 'text-[#722f37] font-bold';
                    } else {
                      cellBg = 'bg-[#1b365d]/15 border-[#1b365d]';
                      charColor = 'text-[#1b365d] font-bold';
                    }
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-8 h-8 border flex items-center justify-center font-mono font-bold text-xs ${cellBg} ${charColor}`}>
                        {char}
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 mt-1">{idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RK hashes / KMP Pi sub hud */}
          {(currentStep.state?.kmpPiTable || currentStep.state?.rabinKarpHashes) && (
            <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center mt-4 animate-fade-in flex items-center justify-center gap-3 text-xs">
              {selectedAlgo === 'kmp' ? (
                <>
                  <span className="text-[#1b365d] font-bold">KMP LPS (Prefix Table):</span>
                  <span className="font-mono text-[#1c1c1c] bg-[#fcfaf2] border border-[#2d2d2d] px-3 py-1">
                    [{currentStep.state.kmpPiTable?.join(', ')}]
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[#1b365d] font-bold">RK Hashes:</span>
                  <span className="font-mono text-[#1c1c1c] bg-[#fcfaf2] border border-[#2d2d2d] px-3 py-1">
                    Pattern: {currentStep.state.rabinKarpHashes?.patternHash} | Text Window: {currentStep.state.rabinKarpHashes?.textHash}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Input parameters workbench */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-col gap-4 bg-[#f4f0e6]">
          <div className="flex items-center gap-1.5 border-b border-[#2d2d2d]/30 pb-2">
            <Edit3 size={15} className="text-[#1b365d]" />
            <h4 className="text-sm font-bold text-[#1c1c1c] font-serif">String Search Parameters</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="block text-[#5a5a5a] font-bold uppercase tracking-wider text-[9px]">Text String</label>
              <input
                type="text"
                maxLength={20}
                value={text}
                onChange={(e) => setText(e.target.value.toUpperCase())}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-full font-mono uppercase tracking-widest text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#5a5a5a] font-bold uppercase tracking-wider text-[9px]">Pattern Target</label>
              <input
                type="text"
                maxLength={8}
                value={pattern}
                onChange={(e) => setPattern(e.target.value.toUpperCase())}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-full font-mono uppercase tracking-widest text-center"
              />
            </div>
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
            pseudocode={codeLines}
            pythonCode={pythonCode}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default StringGallery;
