import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Hash, Plus, Trash2 } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

interface HashState {
  buckets: Array<number[] | null>;
  activeBucketIdx: number;
  highlightedIndices: number[];
  probeSequence: number[];
  actionMessage: string;
}

const chainingPseudocode = [
  { text: "procedure Chain_Insert(table, key)", indent: 0 },
  { text: "idx := hash(key) % size", indent: 1 },
  { text: "bucket := table[idx]", indent: 1 },
  { text: "if key is not in bucket then", indent: 1 },
  { text: "prepend key to bucket", indent: 2 },
  { text: "return success", indent: 1 },
];

const chainingPython = [
  { text: "def chain_insert(table, key, size):", indent: 0 },
  { text: "idx = key % size", indent: 1 },
  { text: "bucket = table[idx]", indent: 1 },
  { text: "if key not in bucket:", indent: 1 },
  { text: "bucket.insert(0, key)", indent: 2 },
  { text: "return True", indent: 1 },
];

const probingPseudocode = [
  { text: "procedure Probe_Insert(table, key)", indent: 0 },
  { text: "for i := 0 to size - 1 do", indent: 1 },
  { text: "idx := (hash(key) + i) % size", indent: 2 },
  { text: "if table[idx] is empty then", indent: 2 },
  { text: "table[idx] := key", indent: 3 },
  { text: "return success", indent: 3 },
  { text: "return error (table full)", indent: 1 },
];

const probingPython = [
  { text: "def probe_insert(table, key, size):", indent: 0 },
  { text: "for i in range(size):", indent: 1 },
  { text: "idx = (key + i) % size", indent: 2 },
  { text: "if table[idx] is None:", indent: 2 },
  { text: "table[idx] = key", indent: 3 },
  { text: "return True", indent: 3 },
  { text: "return False", indent: 1 },
];

const hashAlgoDef: AlgorithmDefinition<HashState, any> = {
  name: "Hash Table Collisions",
  description: "Hash tables provide fast O(1) average lookups by converting keys into indexes. Collisions occur when multiple keys map to the same bucket index.",
  complexity: { time: "O(1) average", space: "O(N)" },
  history: "The concept of hashing was invented in 1953 by IBM researcher Hans Peter Luhn. He suggested using chaining for collision resolution. Open addressing was later introduced by IBM's Gene Amdahl.",
  funFact: "Hans Peter Luhn also invented the checksum algorithm used to validate credit card numbers (the Luhn algorithm).",
  pseudocode: chainingPseudocode,
  run: function* () {
    yield {
      line: 1,
      explanation: "Welcome to the Hash Table exhibit. Configure sizes, insert keys, and watch collision resolution strategies in action.",
      variables: {},
      state: { buckets: Array(10).fill(null), activeBucketIdx: -1, highlightedIndices: [], probeSequence: [], actionMessage: 'Ready' }
    };
  },
  defaultInput: null
};

export const HashGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'chaining' | 'probing'>('chaining');
  const [showPlacard, setShowPlacard] = useState(true);
  const [size, setSize] = useState<number>(8);
  const [buckets, setBuckets] = useState<Array<number[] | null>>(() => Array(8).fill(null).map(() => []));
  const [inputVal, setInputVal] = useState<number>(14);

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<HashState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(400);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initTable = (newSize = size) => {
    setIsPlaying(false);
    setBuckets(Array(newSize).fill(null).map(() => (selectedAlgo === 'chaining' ? [] : null)));
    setSteps([]);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    initTable();
  }, [selectedAlgo, size]);

  const generateInsertSteps = (key: number) => {
    setIsPlaying(false);
    const collectedSteps: AlgorithmStep<HashState>[] = [];
    const tableCopy = buckets.map(b => (b ? [...b] : null));
    const initialIdx = key % size;

    if (selectedAlgo === 'chaining') {
      collectedSteps.push({
        line: 1,
        explanation: `Starting Chaining Insertion for key ${key}. We calculate hash code index = key % size = ${key} % ${size} = ${initialIdx}.`,
        variables: { key, size, hashIdx: initialIdx },
        state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: initialIdx, highlightedIndices: [initialIdx], probeSequence: [], actionMessage: 'Hashing Key' }
      });

      const bucket = tableCopy[initialIdx] || [];
      const duplicate = bucket.includes(key);

      collectedSteps.push({
        line: 3,
        explanation: `Inspecting bucket index ${initialIdx}. Checking if key ${key} is already present.`,
        variables: { key, hashIdx: initialIdx, duplicate: String(duplicate) },
        state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: initialIdx, highlightedIndices: [initialIdx], probeSequence: [], actionMessage: 'Inspecting Bucket' }
      });

      if (!duplicate) {
        if (!tableCopy[initialIdx]) tableCopy[initialIdx] = [];
        tableCopy[initialIdx]!.unshift(key);

        collectedSteps.push({
          line: 5,
          explanation: `Key ${key} is not in the bucket. We insert it at the head of the chain.`,
          variables: { key, hashIdx: initialIdx },
          state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: initialIdx, highlightedIndices: [initialIdx], probeSequence: [], actionMessage: 'Key Prepended' }
        });
      }
    } else {
      // Probing
      let inserted = false;
      const sequence: number[] = [];

      for (let i = 0; i < size; i++) {
        const idx = (initialIdx + i) % size;
        sequence.push(idx);

        collectedSteps.push({
          line: 3,
          explanation: `Probe step i = ${i}. Calculating target slot: (hash + i) % size = (${initialIdx} + ${i}) % ${size} = ${idx}.`,
          variables: { key, probeStep: i, hashIdx: idx },
          state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: idx, highlightedIndices: [idx], probeSequence: [...sequence], actionMessage: `Probing Slot ${idx}` }
        });

        const slot = tableCopy[idx];
        if (slot === null) {
          tableCopy[idx] = [key];
          inserted = true;

          collectedSteps.push({
            line: 5,
            explanation: `Slot ${idx} is empty! Storing key ${key} here. Insertion complete in ${i + 1} probes.`,
            variables: { key, probeStep: i, hashIdx: idx },
            state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: idx, highlightedIndices: [idx], probeSequence: [...sequence], actionMessage: 'Key Inserted' }
          });
          break;
        } else {
          collectedSteps.push({
            line: 4,
            explanation: `Slot ${idx} contains value [${slot[0]}]. Collision detected! Probing next index...`,
            variables: { key, probeStep: i, collisionVal: slot[0] },
            state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: idx, highlightedIndices: [idx], probeSequence: [...sequence], actionMessage: 'Collision' }
          });
        }
      }

      if (!inserted) {
        collectedSteps.push({
          line: 7,
          explanation: "Unable to insert. The open addressing probe sequence checked all slots and found the hash table is fully saturated.",
          variables: { key },
          state: { buckets: tableCopy.map(b => (b ? [...b] : null)), activeBucketIdx: -1, highlightedIndices: [], probeSequence: [...sequence], actionMessage: 'Table Full' }
        });
      }
    }

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(inputVal) || inputVal < 0 || inputVal > 999) {
      alert("Please enter a key between 0 and 999.");
      return;
    }
    generateInsertSteps(inputVal);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            if (steps[prev]?.state?.buckets) {
              setBuckets(steps[prev].state.buckets);
            }
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

  const def = hashAlgoDef;
  const codeLines = selectedAlgo === 'chaining' ? chainingPseudocode : probingPseudocode;
  const pythonCode = selectedAlgo === 'chaining' ? chainingPython : probingPython;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="Bucket Hashing"
        description="Hashing maps arbitrary keys (like names or words) directly to fixed-size array index slots. This enables computers to store, update, and search for data in constant time, rather than scanning the entire dataset sequentially."
        history="Hans Peter Luhn (pictured) of IBM proposed hashing in 1953 as a way to quickly index chemical structures. It revolutionized retrieval speeds, serving as the core infrastructure of modern web accounts and lookup indexes."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Open Addressing']}
        imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDBcQFYdjOaiTWeRfHkjisnYIDnkV-d12jzQ0XcHDNCvOwWb0vjFxnqq154mYEtwt2RUkdEFkZ533iryjdi-kqFo9uOxAJhoaYZrNU6g&s=10"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready. Enter a key and click Insert to watch hashing.',
    variables: {},
    state: { buckets, activeBucketIdx: -1, highlightedIndices: [], probeSequence: [], actionMessage: 'Ready' }
  };

  const renderBuckets = currentStep.state?.buckets || buckets;
  const activeBucketIdx = currentStep.state?.activeBucketIdx ?? -1;
  const probeSequence = currentStep.state?.probeSequence || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Hash className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
                setShowPlacard(true);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="chaining">Separate Chaining (Lists)</option>
              <option value="probing">Open Addressing (Linear Probing)</option>
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
              {isPlaying ? 'Pause' : 'Play Insertion'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Speed</span>
            <input
              type="range"
              min="50"
              max="1200"
              step="50"
              value={1250 - speed}
              onChange={(e) => setSpeed(1250 - parseInt(e.target.value))}
              className="w-20 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* Dynamic Buckets Visualizer */}
        <div className="flex-1 glass-panel rounded-3xl p-8 flex flex-col justify-between items-center relative overflow-hidden bg-[#f4f0e6] min-h-[360px]">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#1b365d]">Hash Array Buckets</span>
          </div>

          {/* Table index display */}
          <div className="flex-1 w-full flex flex-col justify-center items-center gap-4 mt-8">
            <div className="flex flex-wrap gap-3 items-start justify-center max-w-lg">
              {renderBuckets.map((bucket, idx) => {
                const isActive = activeBucketIdx === idx;
                const wasProbed = probeSequence.includes(idx);
                
                let cardBg = 'bg-[#fcfaf2] border-[#2d2d2d]';
                let indicatorColor = 'text-[#5a5a5a]';

                if (isActive) {
                  cardBg = 'bg-[#722f37]/10 border-[#722f37]';
                  indicatorColor = 'text-[#722f37] font-bold';
                } else if (wasProbed) {
                  cardBg = 'bg-[#1b365d]/10 border-[#1b365d]/40';
                  indicatorColor = 'text-[#1b365d]';
                }

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-14 border p-2 text-center transition-all duration-200 ${cardBg}`}>
                      <span className={`text-[10px] font-mono font-extrabold block mb-1 ${indicatorColor}`}>
                        [{idx}]
                      </span>
                      
                      <div className="flex flex-col gap-1.5 items-center justify-center min-h-[40px] pt-1">
                        {bucket === null || bucket.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-400 italic">Ø</span>
                        ) : (
                          bucket.map((val, bIdx) => (
                            <div key={bIdx} className="bg-[#1b365d] text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                              {val}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-hud */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Formula: <strong className="text-[#1b365d] font-mono">h(key) = key % {size}</strong></span>
            <span className="text-[#1b365d]">Action: {currentStep.state?.actionMessage || 'Ready'}</span>
          </div>
        </div>

        {/* Configurations */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <Plus size={15} className="text-[#1b365d]" />
              Configure Hash Table
            </h4>
            <p className="text-slate-500 text-xs">Set table capacity size, and insert keys to observe separate list chains or collision probing.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Size</span>
              <input
                type="range"
                min="5"
                max="12"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-20 accent-cyan-500 bg-slate-850 h-1.5 rounded-lg"
              />
              <span className="text-slate-800 font-mono font-bold bg-[#fcfaf2] border border-[#2d2d2d] px-2.5 py-1 rounded-lg text-xs">{size}</span>
            </div>

            <form onSubmit={handleInsert} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="999"
                value={inputVal}
                onChange={(e) => setInputVal(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors w-20 font-mono text-center"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all"
              >
                Insert Key
              </button>
            </form>
            <button
              onClick={() => initTable()}
              className="px-4 py-2 border border-transparent hover:border-[#a13d2d]/25 text-[#5a5a5a] hover:text-[#a13d2d] text-xs font-bold transition-all flex items-center gap-1"
            >
              <Trash2 size={13} />
              Reset Table
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
export default HashGallery;
