import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface HashChallengeData {
  keys: number[];
  tableSize: number;
  targetKey: number;
  correctAnswer: number;
}

export const ChallengeGallery: React.FC = () => {
  const [activeChallenge, setActiveChallenge] = useState<'quicksort' | 'hashing'>('quicksort');

  // Quick Sort Challenge State
  const [qsN, setQsN] = useState<number>(6);
  const [qsAnswer, setQsAnswer] = useState<string>('');
  const [qsResult, setQsResult] = useState<string | null>(null);
  const [qsSuccess, setQsSuccess] = useState(false);

  // Hashing Challenge State
  const [hashData, setHashData] = useState<HashChallengeData | null>(null);
  const [hashAnswer, setHashAnswer] = useState<string>('');
  const [hashResult, setHashResult] = useState<string | null>(null);
  const [hashSuccess, setHashSuccess] = useState(false);

  // Generate random Quick Sort challenge
  const generateQsChallenge = () => {
    const randomN = Math.floor(Math.random() * 4) + 5; // size 5 to 8
    setQsN(randomN);
    setQsAnswer('');
    setQsResult(null);
    setQsSuccess(false);
  };

  const handleQsValidate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(qsAnswer.trim());
    if (isNaN(parsed)) {
      alert("Please enter a valid number.");
      return;
    }

    // Formula for sorted Lomuto worst case comparisons: N * (N - 1) / 2
    const correct = (qsN * (qsN - 1)) / 2;

    if (parsed === correct) {
      setQsSuccess(true);
      setQsResult(`Correct. An already sorted array of size ${qsN} triggers the worst-case Lomuto recursion, executing exactly ${correct} comparisons.`);
    } else {
      setQsSuccess(false);
      setQsResult(`Incorrect. For size ${qsN}, the worst-case Lomuto partition performs ${correct} comparisons. Formula: N * (N - 1) / 2.`);
    }
  };

  // Generate random Hash collision challenge
  const generateHashChallenge = () => {
    const size = 10;
    const numKeys = 5;
    const keys: number[] = [];
    while (keys.length < numKeys) {
      const val = Math.floor(Math.random() * 90) + 10;
      if (!keys.includes(val)) keys.push(val);
    }

    // Compute placements using linear probing open addressing
    const table = Array(size).fill(null);
    keys.forEach(k => {
      let initialIdx = k % size;
      for (let i = 0; i < size; i++) {
        let idx = (initialIdx + i) % size;
        if (table[idx] === null) {
          table[idx] = k;
          break;
        }
      }
    });

    const targetIdx = Math.floor(Math.random() * numKeys);
    const targetKey = keys[targetIdx];
    const correctAnswer = table.indexOf(targetKey);

    setHashData({
      keys,
      tableSize: size,
      targetKey,
      correctAnswer
    });
    setHashAnswer('');
    setHashResult(null);
    setHashSuccess(false);
  };

  const handleHashValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashData) return;

    const parsed = parseInt(hashAnswer.trim());
    if (isNaN(parsed)) {
      alert("Please enter a valid index number.");
      return;
    }

    if (parsed === hashData.correctAnswer) {
      setHashSuccess(true);
      setHashResult(`Correct. Resolving linear probing collisions sequentially places key ${hashData.targetKey} at index slot ${hashData.correctAnswer}.`);
    } else {
      setHashSuccess(false);
      setHashResult(`Incorrect. The correct slot index for ${hashData.targetKey} is ${hashData.correctAnswer}. Trace placements sequentially to verify.`);
    }
  };

  useEffect(() => {
    generateQsChallenge();
    generateHashChallenge();
  }, []);

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8 animate-fade-in text-[#1c1c1c]">
      {/* Tab select bar */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-[#2d2d2d] bg-[#f4f0e6]">
        <div className="flex items-center gap-3">
          <Award className="text-[#1b365d]" size={20} />
          <h3 className="text-sm font-bold font-serif text-[#1c1c1c]">Interactive Challenge Rooms</h3>
        </div>

        <div className="flex bg-[#fcfaf2] border border-[#2d2d2d] p-1">
          <button
            onClick={() => setActiveChallenge('quicksort')}
            className={`px-4 py-1.5 text-xs font-bold transition-all ${
              activeChallenge === 'quicksort' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
            }`}
          >
            Worst-case Quick Sort
          </button>
          <button
            onClick={() => setActiveChallenge('hashing')}
            className={`px-4 py-1.5 text-xs font-bold transition-all ${
              activeChallenge === 'hashing' ? 'bg-[#f4f0e6] text-[#1c1c1c]' : 'text-[#5a5a5a]'
            }`}
          >
            Hash Index Collision
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Quick Sort Challenge Card */}
        {activeChallenge === 'quicksort' && (
          <div className="glass-panel border-[#2d2d2d] p-8 space-y-6 bg-[#f4f0e6]">
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-[#2d2d2d]/30 pb-3">
                <h2 className="text-lg font-serif font-bold text-[#1c1c1c]">
                  Pivot Unbalance Challenge
                </h2>
                <button
                  onClick={generateQsChallenge}
                  className="p-2 border border-[#2d2d2d] bg-[#fcfaf2] text-[#5a5a5a] hover:text-[#1c1c1c]"
                  title="Generate New Question"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <p className="text-xs text-[#5a5a5a] leading-relaxed">
                Lomuto partitioning selects the rightmost element as pivot. On sorted arrays, this partition yields maximally unbalanced splits, creating O(N^2) quadratic runtime.
              </p>
              
              <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-xs space-y-2 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-[#1b365d]">Active Objective</span>
                <p>For an already sorted array of size <strong>N = {qsN}</strong>, how many character/value comparison checks will Lomuto Partition Quick Sort execute in total?</p>
              </div>
            </div>

            <form onSubmit={handleQsValidate} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[#5a5a5a] uppercase">Your Answer</label>
                <input
                  type="text"
                  value={qsAnswer}
                  onChange={(e) => setQsAnswer(e.target.value)}
                  placeholder="Enter comparison count"
                  className="bg-slate-950 border border-slate-850 text-slate-200 text-sm py-2.5 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-full font-mono text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1b365d] hover:bg-[#152a4a] text-white font-bold text-xs transition-colors"
              >
                Validate Answer
              </button>
            </form>

            {qsResult && (
              <div className={`p-4 border flex gap-3 text-xs leading-relaxed ${
                qsSuccess
                  ? 'bg-[#2e5a44]/10 border-[#2e5a44] text-[#2e5a44]'
                  : 'bg-[#a13d2d]/10 border-[#a13d2d] text-[#a13d2d]'
              } animate-fade-in`}>
                <div className="mt-0.5 flex-shrink-0">
                  {qsSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>
                  <h4 className="font-bold mb-1">{qsSuccess ? 'Challenge Complete' : 'Challenge Failed'}</h4>
                  <p>{qsResult}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hashing Challenge Card */}
        {activeChallenge === 'hashing' && hashData && (
          <div className="glass-panel border-[#2d2d2d] p-8 space-y-6 bg-[#f4f0e6]">
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-[#2d2d2d]/30 pb-3">
                <h2 className="text-lg font-serif font-bold text-[#1c1c1c]">
                  Open Addressing Probe Challenge
                </h2>
                <button
                  onClick={generateHashChallenge}
                  className="p-2 border border-[#2d2d2d] bg-[#fcfaf2] text-[#5a5a5a] hover:text-[#1c1c1c]"
                  title="Generate New Question"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <p className="text-xs text-[#5a5a5a] leading-relaxed">
                Linear probing resolves collisions by checking the next sequential slot. Index = (hash(key) + i) % size.
              </p>
              
              <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-xs space-y-2 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-[#1b365d]">Active Objective</span>
                <p>We insert the following keys sequentially into an empty table of size <strong>{hashData.tableSize}</strong>: <strong className="font-mono text-xs">[{hashData.keys.join(', ')}]</strong>.</p>
                <p>Using linear probing collision resolution, what index slot will contain key <strong>{hashData.targetKey}</strong>?</p>
              </div>
            </div>

            <form onSubmit={handleHashValidate} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[#5a5a5a] uppercase">Your Answer (0 to 9)</label>
                <input
                  type="text"
                  value={hashAnswer}
                  onChange={(e) => setHashAnswer(e.target.value)}
                  placeholder="Enter index slot"
                  className="bg-slate-950 border border-slate-850 text-slate-200 text-sm py-2.5 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-full font-mono text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1b365d] hover:bg-[#152a4a] text-white font-bold text-xs transition-colors"
              >
                Validate Answer
              </button>
            </form>

            {hashResult && (
              <div className={`p-4 border flex gap-3 text-xs leading-relaxed ${
                hashSuccess
                  ? 'bg-[#2e5a44]/10 border-[#2e5a44] text-[#2e5a44]'
                  : 'bg-[#a13d2d]/10 border-[#a13d2d] text-[#a13d2d]'
              } animate-fade-in`}>
                <div className="mt-0.5 flex-shrink-0">
                  {hashSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>
                  <h4 className="font-bold mb-1">{hashSuccess ? 'Challenge Complete' : 'Challenge Failed'}</h4>
                  <p>{hashResult}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ChallengeGallery;
