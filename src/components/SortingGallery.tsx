import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Sliders, Edit3, Sparkles } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

// Pantheon Column Component
const PantheonColumn: React.FC<{
  val: number;
  maxVal: number;
  isActive: boolean;
  isSorted: boolean;
  isPivot: boolean;
}> = ({ val, maxVal, isActive, isSorted, isPivot }) => {
  const heightRatio = maxVal > 0 ? val / maxVal : 0.1;
  const totalHeight = 110; // Max height for SVG column shaft
  const colHeight = Math.max(20, heightRatio * totalHeight);
  
  let strokeColor = '#2d2d2d';
  let fillColor = '#fcfaf2';
  
  if (isActive) {
    fillColor = '#722f37'; // Burgundy
  } else if (isPivot) {
    fillColor = '#1b365d'; // Navy
  } else if (isSorted) {
    fillColor = '#2e5a44'; // Forest Green
  }

  const yBase = 130;
  const yTop = yBase - colHeight; // Correlates to value!
  const hasCapital = heightRatio >= 0.85;
  const isStump = heightRatio < 0.45;

  return (
    <div className="flex flex-col items-center justify-end h-full w-full">
      <svg width="34" height="150" className="overflow-visible">
        <g transform="translate(17, 0)">
          {/* Base at the bottom */}
          <rect x="-13" y={yBase - 8} width="26" height="8" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="-10" y={yBase - 12} width="20" height="4" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />

          {/* Capital or Shaft */}
          {isStump ? (
            // Ruined stump with jagged crack top at yTop
            <>
              <path
                d={`M -7 118 L -7 ${yTop + 6} L -3 ${yTop} L 1 ${yTop + 5} L 7 ${yTop + 2} L 7 118 Z`}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
              <line x1="-3" y1="118" x2="-3" y2={yTop + 3} stroke={strokeColor} strokeWidth="1" strokeDasharray="1,1" />
              <line x1="3" y1="118" x2="3" y2={yTop + 3} stroke={strokeColor} strokeWidth="1" strokeDasharray="1,1" />
              {/* Crumbled debris on ground */}
              <circle cx="-16" cy={yBase - 4} r="2.5" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
              <circle cx="16" cy={yBase - 5} r="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
            </>
          ) : (
            // Taller column
            <>
              <path
                d={
                  hasCapital
                    ? `M -7 ${yTop + 6} L 7 ${yTop + 6} L 7 118 L -7 118 Z`
                    : `M -7 ${yTop + 8} L -3 ${yTop} L 2 ${yTop + 6} L 7 ${yTop + 2} L 7 118 L -7 118 Z` // jagged top at yTop
                }
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
              <line x1="-3" y1={hasCapital ? yTop + 6 : yTop + 4} x2="-3" y2="118" stroke={strokeColor} strokeWidth="1" />
              <line x1="0" y1={hasCapital ? yTop + 6 : yTop + 4} x2="0" y2="118" stroke={strokeColor} strokeWidth="1" />
              <line x1="3" y1={hasCapital ? yTop + 6 : yTop + 4} x2="3" y2="118" stroke={strokeColor} strokeWidth="1" />

              {/* Capital at the very top (yTop) */}
              {hasCapital && (
                <g>
                  <rect x="-11" y={yTop} width="22" height="6" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
                  <circle cx="-9" cy={yTop + 1} r="2.5" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                  <circle cx="9" cy={yTop + 1} r="2.5" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                </g>
              )}
            </>
          )}
        </g>
        <text x="17" y="146" textAnchor="middle" className="fill-[#1c1c1c] font-mono text-[9px] font-bold">
          {val}
        </text>
      </svg>
    </div>
  );
};

// Define Algorithms
const bubbleSortDef: AlgorithmDefinition<number[], number[]> = {
  name: "The Sorting Hall (Bubble Sort)",
  description: "Sorting is the process of arranging data into a meaningful sequence (like alphabetical or smallest to largest). It is a core operation in computer science: without it, searching through records or listing items would be incredibly slow. Bubble Sort repeatedly compares side-by-side elements, swapping them if out of order.",
  complexity: { time: "O(N²)", space: "O(1)" },
  history: "Bubble Sort was first described by Edward Friend in 1956. While simple, it represents the foundational concept of iterative comparison sorting. John von Neumann (pictured) pioneered automated sorting research, including Merge Sort, in 1945 to optimize early calculations on ENIAC vacuum-tube computers.",
  funFact: "Because elements 'bubble up' to their correct positions, early programmers called it the 'sinking sort' before the term 'bubble' became standard.",
  defaultInput: [],
  pseudocode: [
    { text: "procedure bubbleSort(A : list of sortable items)", indent: 0 },
    { text: "n := length(A)", indent: 1 },
    { text: "repeat", indent: 1 },
    { text: "swapped := false", indent: 2 },
    { text: "for i := 1 to n-1 inclusive do", indent: 2 },
    { text: "if A[i-1] > A[i] then", indent: 3 },
    { text: "swap(A[i-1], A[i])", indent: 4 },
    { text: "swapped := true", indent: 4 },
    { text: "until not swapped", indent: 1 },
  ],
  run: function* (input: number[]) {
    const a = [...input];
    const n = a.length;
    const sorted: number[] = [];

    yield {
      line: 1,
      explanation: `Let's begin. We have a custom dataset of ${n} numbers to sort. We'll start Bubble Sort which compares side-by-side values.`,
      variables: { n, swapped: 'false' },
      state: [...a],
      meta: { activeIndices: [], sortedIndices: [] }
    };

    let swapped = true;
    let limit = n;
    while (swapped) {
      swapped = false;
      yield {
        line: 3,
        explanation: "Starting a new pass. We reset the 'swapped' flag to false. If we complete this pass without any swaps, the list is fully sorted!",
        variables: { limit, swapped: 'false' },
        state: [...a],
        meta: { activeIndices: [], sortedIndices: [...sorted] }
      };

      for (let i = 1; i < limit; i++) {
        yield {
          line: 5,
          explanation: `Comparing elements at positions ${i - 1} and ${i}: ${a[i - 1]} and ${a[i]}.`,
          variables: { i, 'A[i-1]': a[i - 1], 'A[i]': a[i], swapped: swapped ? 'true' : 'false' },
          state: [...a],
          meta: { activeIndices: [i - 1, i], sortedIndices: [...sorted] }
        };

        if (a[i - 1] > a[i]) {
          yield {
            line: 6,
            explanation: `Since ${a[i - 1]} is greater than ${a[i]}, they are out of order. We swap them!`,
            variables: { i, 'A[i-1]': a[i - 1], 'A[i]': a[i], swapped: swapped ? 'true' : 'false' },
            state: [...a],
            meta: { activeIndices: [i - 1, i], sortedIndices: [...sorted] }
          };

          const temp = a[i - 1];
          a[i - 1] = a[i];
          a[i] = temp;

          swapped = true;
          yield {
            line: 7,
            explanation: `Swapped! We set the 'swapped' flag to true so we know another pass will be needed.`,
            variables: { i, 'A[i-1]': a[i - 1], 'A[i]': a[i], swapped: 'true' },
            state: [...a],
            meta: { activeIndices: [i - 1, i], sortedIndices: [...sorted] }
          };
        }
      }

      sorted.unshift(limit - 1);
      limit--;
    }

    const allIndices = Array.from({ length: n }, (_, idx) => idx);
    yield {
      line: 9,
      explanation: "No swaps occurred during the last pass. The entire array is now sorted in ascending order!",
      variables: { limit: 0, swapped: 'false' },
      state: [...a],
      meta: { activeIndices: [], sortedIndices: allIndices }
    };
  }
};

const bubbleSortPython = [
  { text: "def bubble_sort(arr):", indent: 0 },
  { text: "n = len(arr)", indent: 1 },
  { text: "for i in range(n):", indent: 1 },
  { text: "swapped = False", indent: 2 },
  { text: "for j in range(0, n - i - 1):", indent: 2 },
  { text: "if arr[j] > arr[j + 1]:", indent: 3 },
  { text: "arr[j], arr[j + 1] = arr[j + 1], arr[j]", indent: 4 },
  { text: "swapped = True", indent: 4 },
  { text: "if not swapped:", indent: 2 },
  { text: "break", indent: 3 },
];

const quickSortDef: AlgorithmDefinition<number[], number[]> = {
  name: "The Sorting Hall (Quick Sort)",
  description: "Sorting is the process of arranging data into a meaningful sequence (like alphabetical or smallest to largest). It is a core operation in computer science: without it, searching through records or listing items would be incredibly slow. Quick Sort recursively partitions array sub-ranges around a selected pivot.",
  complexity: { time: "O(N log N)", space: "O(log N)" },
  history: "Quick Sort was developed in 1959 by Tony Hoare while researching Russian translation structures at Moscow State University. John von Neumann (pictured) pioneered the study of divide-and-conquer systems like Merge Sort, paving the way for recursion design paradigms.",
  funFact: "Hoare originally thought the algorithm was so simple that it wasn't worth publishing, until a colleague convinced him it was a major breakthrough.",
  defaultInput: [],
  pseudocode: [
    { text: "procedure quickSort(A, low, high)", indent: 0 },
    { text: "if low < high then", indent: 1 },
    { text: "p := partition(A, low, high)", indent: 2 },
    { text: "quickSort(A, low, p - 1)", indent: 2 },
    { text: "quickSort(A, p + 1, high)", indent: 2 },
    { text: "", indent: 0 },
    { text: "procedure partition(A, low, high)", indent: 0 },
    { text: "pivot := A[high]", indent: 1 },
    { text: "i := low - 1", indent: 1 },
    { text: "for j := low to high - 1 do", indent: 1 },
    { text: "if A[j] < pivot then", indent: 2 },
    { text: "i := i + 1; swap(A[i], A[j])", indent: 3 },
    { text: "swap(A[i + 1], A[high])", indent: 1 },
    { text: "return i + 1", indent: 1 },
  ],
  run: function* (input: number[]) {
    const a = [...input];
    const n = a.length;
    const sorted: number[] = [];

    yield {
      line: 1,
      explanation: "Let's perform Quick Sort. We will use Lomuto partitioning, which selects the rightmost element as the pivot and divides the array.",
      variables: { low: 0, high: n - 1 },
      state: [...a],
      meta: { activeIndices: [], sortedIndices: [] }
    };

    function* quickSortHelper(low: number, high: number): Generator<AlgorithmStep<number[]>, void, unknown> {
      if (low < high) {
        yield {
          line: 2,
          explanation: `Sub-array range [${low} to ${high}] is valid. Let's partition it around a pivot.`,
          variables: { low, high },
          state: [...a],
          meta: { activeIndices: Array.from({ length: high - low + 1 }, (_, index) => low + index), sortedIndices: [...sorted] }
        };

        const pivot = a[high];
        let i = low - 1;

        yield {
          line: 8,
          explanation: `Choosing pivot: A[${high}] = ${pivot}. Pointer i starts at ${i}.`,
          variables: { low, high, pivot, i },
          state: [...a],
          meta: { pivotIndex: high, activeIndices: [], sortedIndices: [...sorted] }
        };

        for (let j = low; j < high; j++) {
          yield {
            line: 10,
            explanation: `Comparing J: A[${j}] = ${a[j]} against pivot ${pivot}.`,
            variables: { low, high, pivot, i, j, 'A[j]': a[j] },
            state: [...a],
            meta: { pivotIndex: high, activeIndices: [j], sortedIndices: [...sorted] }
          };

          if (a[j] < pivot) {
            i++;
            yield {
              line: 12,
              explanation: `Since ${a[j]} is smaller than pivot ${pivot}, we increment i to ${i} and swap A[${i}] (${a[i]}) and A[${j}] (${a[j]}).`,
              variables: { low, high, pivot, i, j },
              state: [...a],
              meta: { pivotIndex: high, activeIndices: [i, j], sortedIndices: [...sorted] }
            };

            const temp = a[i];
            a[i] = a[j];
            a[j] = temp;

            yield {
              line: 12,
              explanation: "Swap complete. Numbers smaller than pivot are gathered on the left side.",
              variables: { low, high, pivot, i, j },
              state: [...a],
              meta: { pivotIndex: high, activeIndices: [i, j], sortedIndices: [...sorted] }
            };
          }
        }

        yield {
          line: 13,
          explanation: `Partition finished. We swap the pivot A[${high}] (${a[high]}) with A[${i + 1}] (${a[i + 1]}) to place pivot in its final, sorted position.`,
          variables: { low, high, pivot, i, p: i + 1 },
          state: [...a],
          meta: { pivotIndex: high, activeIndices: [i + 1, high], strokeColor: '#2d2d2d', sortedIndices: [...sorted] }
        };

        const temp = a[i + 1];
        a[i + 1] = a[high];
        a[high] = temp;
        const p = i + 1;
        sorted.push(p);

        yield {
          line: 14,
          explanation: `Pivot is now locked at position ${p} (value: ${a[p]}). It is in its correct sorted location.`,
          variables: { low, high, p, pivot: a[p] },
          state: [...a],
          meta: { sortedIndices: [...sorted] }
        };

        yield* quickSortHelper(low, p - 1);
        yield* quickSortHelper(p + 1, high);
      } else {
        if (low >= 0 && low < n) {
          if (!sorted.includes(low)) sorted.push(low);
          yield {
            line: 2,
            explanation: `Base case reached. Index ${low} has size <= 1, so it is sorted automatically.`,
            variables: { low, high },
            state: [...a],
            meta: { sortedIndices: [...sorted] }
          };
        }
      }
    }

    yield* quickSortHelper(0, n - 1);

    const allIndices = Array.from({ length: n }, (_, idx) => idx);
    yield {
      line: 1,
      explanation: "Quick Sort finished! Recursion completed and the entire array is now sorted.",
      variables: {},
      state: [...a],
      meta: { activeIndices: [], sortedIndices: allIndices }
    };
  }
};

const quickSortPython = [
  { text: "def quick_sort(arr, low, high):", indent: 0 },
  { text: "if low < high:", indent: 1 },
  { text: "p = partition(arr, low, high)", indent: 2 },
  { text: "quick_sort(arr, low, p - 1)", indent: 2 },
  { text: "quick_sort(arr, p + 1, high)", indent: 2 },
  { text: "", indent: 0 },
  { text: "def partition(arr, low, high):", indent: 0 },
  { text: "pivot = arr[high]", indent: 1 },
  { text: "i = low - 1", indent: 1 },
  { text: "for j in range(low, high):", indent: 1 },
  { text: "if arr[j] < pivot:", indent: 2 },
  { text: "i += 1", indent: 3 },
  { text: "arr[i], arr[j] = arr[j], arr[i]", indent: 3 },
  { text: "arr[i + 1], arr[high] = arr[high], arr[i + 1]", indent: 1 },
  { text: "return i + 1", indent: 1 },
];

const mergeSortDef: AlgorithmDefinition<number[], number[]> = {
  name: "The Sorting Hall (Merge Sort)",
  description: "Sorting is the process of arranging data into a meaningful sequence (like alphabetical or smallest to largest). It is a core operation in computer science: without it, searching through records or listing items would be incredibly slow. Merge Sort recursively divides the array in half and merges them back in order.",
  complexity: { time: "O(N log N)", space: "O(N)" },
  history: "Merge Sort was invented by mathematician John von Neumann (pictured) in 1945. It is a stable sort, meaning it preserves the original relative order of equal elements. Von Neumann designed it to optimize database processing on EDVAC computer systems.",
  funFact: "Neumann wrote the original code for Merge Sort on the EDVAC computer, one of the earliest electronic computational systems, using a deck of punched cards.",
  defaultInput: [],
  pseudocode: [
    { text: "procedure mergeSort(A, left, right)", indent: 0 },
    { text: "if left < right then", indent: 1 },
    { text: "mid := (left + right) / 2", indent: 2 },
    { text: "mergeSort(A, left, mid)", indent: 2 },
    { text: "mergeSort(A, mid + 1, right)", indent: 2 },
    { text: "merge(A, left, mid, right)", indent: 2 },
    { text: "", indent: 0 },
    { text: "procedure merge(A, left, mid, right)", indent: 0 },
    { text: "create temporary arrays L and R", indent: 1 },
    { text: "copy values to L and R", indent: 1 },
    { text: "merge elements back to A in sorted order", indent: 1 },
  ],
  run: function* (input: number[]) {
    const a = [...input];
    const n = a.length;
    const sorted: number[] = [];

    yield {
      line: 1,
      explanation: "Merge Sort splits the array in halves recursively, then merges them together in sorted order.",
      variables: { left: 0, right: n - 1 },
      state: [...a],
      meta: { activeIndices: [], sortedIndices: [] }
    };

    function* mergeHelper(left: number, right: number): Generator<AlgorithmStep<number[]>, void, unknown> {
      if (left < right) {
        const mid = Math.floor((left + right) / 2);
        yield {
          line: 3,
          explanation: `Splitting array between index ${left} and ${right}. Middle point is ${mid}.`,
          variables: { left, right, mid },
          state: [...a],
          meta: { activeIndices: [left, right], sortedIndices: [...sorted] }
        };

        yield* mergeHelper(left, mid);
        yield* mergeHelper(mid + 1, right);

        yield {
          line: 6,
          explanation: `Merging left sub-array [${left}..${mid}] and right sub-array [${mid + 1}..${right}].`,
          variables: { left, mid, right },
          state: [...a],
          meta: { activeIndices: Array.from({ length: right - left + 1 }, (_, index) => left + index), sortedIndices: [...sorted] }
        };

        const L = a.slice(left, mid + 1);
        const R = a.slice(mid + 1, right + 1);
        
        let i = 0, j = 0, k = left;
        while (i < L.length && j < R.length) {
          yield {
            line: 11,
            explanation: `Comparing temporary elements: L[${i}] (${L[i]}) and R[${j}] (${R[j]}). Copying the smaller value back to position ${k}.`,
            variables: { left, mid, right, i, j, k, 'L[i]': L[i], 'R[j]': R[j] },
            state: [...a],
            meta: { activeIndices: [k, left + i, mid + 1 + j], sortedIndices: [...sorted] }
          };

          if (L[i] <= R[j]) {
            a[k] = L[i];
            i++;
          } else {
            a[k] = R[j];
            j++;
          }
          k++;
        }

        while (i < L.length) {
          a[k] = L[i];
          i++;
          k++;
          yield {
            line: 11,
            explanation: `Copying remaining elements from left temporary array back to index ${k - 1}.`,
            variables: { left, mid, right, i, j, k: k - 1 },
            state: [...a],
            meta: { activeIndices: [k - 1], sortedIndices: [...sorted] }
          };
        }

        while (j < R.length) {
          a[k] = R[j];
          j++;
          k++;
          yield {
            line: 11,
            explanation: `Copying remaining elements from right temporary array back to index ${k - 1}.`,
            variables: { left, mid, right, i, j, k: k - 1 },
            state: [...a],
            meta: { activeIndices: [k - 1], sortedIndices: [...sorted] }
          };
        }

        if (left === 0 && right === n - 1) {
          for (let sIdx = 0; sIdx < n; sIdx++) {
            sorted.push(sIdx);
          }
        }
      }
    }

    yield* mergeHelper(0, n - 1);

    const allIndices = Array.from({ length: n }, (_, idx) => idx);
    yield {
      line: 1,
      explanation: "Merge Sort finished! All halves are beautifully merged back together in perfect order.",
      variables: {},
      state: [...a],
      meta: { activeIndices: [], sortedIndices: allIndices }
    };
  }
};

const mergeSortPython = [
  { text: "def merge_sort(arr, l, r):", indent: 0 },
  { text: "if l < r:", indent: 1 },
  { text: "m = (l + r) // 2", indent: 2 },
  { text: "merge_sort(arr, l, m)", indent: 2 },
  { text: "merge_sort(arr, m + 1, r)", indent: 2 },
  { text: "merge(arr, l, m, r)", indent: 2 },
  { text: "", indent: 0 },
  { text: "def merge(arr, l, m, r):", indent: 0 },
  { text: "n1 = m - l + 1", indent: 1 },
  { text: "n2 = r - m", indent: 1 },
  { text: "L = arr[l:m+1]; R = arr[m+1:r+1]", indent: 1 },
];

export const SortingGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'bubble' | 'quick' | 'merge'>('bubble');
  const [showPlacard, setShowPlacard] = useState(true);
  const [array, setArray] = useState<number[]>([45, 12, 85, 32, 70, 22, 60, 18, 90, 5]);
  const [customInput, setCustomInput] = useState('');
  
  // Execution state
  const [steps, setSteps] = useState<AlgorithmStep<number[] | null>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600); // ms delay

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAlgoDefinition = () => {
    if (selectedAlgo === 'bubble') return bubbleSortDef;
    if (selectedAlgo === 'quick') return quickSortDef;
    return mergeSortDef;
  };

  const getPythonCode = () => {
    if (selectedAlgo === 'bubble') return bubbleSortPython;
    if (selectedAlgo === 'quick') return quickSortPython;
    return mergeSortPython;
  };

  const initAlgorithm = (customArr?: number[]) => {
    const targetArr = customArr || array;
    const def = getAlgoDefinition();
    const generator = def.run(targetArr);
    const collectedSteps: AlgorithmStep<number[]>[] = [];
    
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
        setCurrentStepIdx((prev) => {
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

  const handleRandomize = () => {
    const size = 12;
    const randomArr = Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
    setArray(randomArr);
    initAlgorithm(randomArr);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput
      .split(',')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num) && num > 0 && num <= 100);

    if (parsed.length > 2 && parsed.length <= 20) {
      setArray(parsed);
      initAlgorithm(parsed);
    } else {
      alert("Please enter between 3 and 20 numbers, values from 1 to 100 separated by commas.");
    }
  };

  const def = getAlgoDefinition();

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="The Sorting Hall"
        description="Sorting is the foundational process of arranging unordered data elements (like numbers, names, or values) into a logical sequence (ascending or descending). Sorting is a core building block of computing: without it, operations like searching, filtering, or compiling data would be computationally prohibitive."
        history="John von Neumann (pictured) published the first automated sorting method, Merge Sort, in 1945 for the EDVAC computer. Tony Hoare followed in 1959 with Quick Sort, and Edward Friend designed Bubble Sort in 1956, starting a major research field in complexity minimization."
        complexity={def.complexity}
        terms={selectedAlgo === 'quick' ? ['Time Complexity', 'Space Complexity', 'Lomuto Partition'] : ['Time Complexity', 'Space Complexity']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/5/5e/JohnvonNeumann-LosAlamos.gif"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready to sort.',
    variables: {},
    state: array,
    meta: { activeIndices: [], sortedIndices: [] }
  };

  const activeIndices = currentStep.meta?.activeIndices || [];
  const sortedIndices = currentStep.meta?.sortedIndices || [];
  const pivotIndex = currentStep.meta?.pivotIndex;
  const currentArray = currentStep.state || array;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area (8 cols on large screens) */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        {/* Gallery Control Bar */}
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Sliders className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
                setShowPlacard(true);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="bubble">Bubble Sort</option>
              <option value="quick">Quick Sort</option>
              <option value="merge">Merge Sort</option>
            </select>
          </div>

          {/* Stepper Buttons */}
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
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIdx(prev => Math.max(0, prev - 1));
              }}
              disabled={currentStepIdx === 0}
              className="p-2.5 rounded-xl border border-[#2d2d2d] bg-slate-950/60 hover:text-[#1c1c1c] text-[#5a5a5a] disabled:opacity-30 transition-all"
              title="Step Backward"
            >
              <SkipBack size={16} />
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
              {isPlaying ? 'Pause' : 'Play Exhibit'}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1));
              }}
              disabled={currentStepIdx >= steps.length - 1}
              className="p-2.5 rounded-xl border border-[#2d2d2d] bg-slate-950/60 hover:text-[#1c1c1c] text-[#5a5a5a] disabled:opacity-30 transition-all"
              title="Step Forward"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Speed</span>
            <input
              type="range"
              min="50"
              max="1500"
              step="50"
              value={1550 - speed}
              onChange={(e) => setSpeed(1550 - parseInt(e.target.value))}
              className="w-24 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* Sorting Visualization Box */}
        <div className="flex-1 min-h-[300px] glass-panel rounded-3xl p-8 flex flex-col justify-between items-center relative overflow-hidden bg-[#f4f0e6]">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#1b365d]">Interactive Canvas</span>
          </div>

          {/* Visual State Indicators */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#5a5a5a]"></span>
              <span>Default</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#722f37]"></span>
              <span>Comparing/Swapping</span>
            </div>
            {selectedAlgo === 'quick' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#1b365d]"></span>
                <span>Pivot</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#2e5a44]"></span>
              <span>Sorted</span>
            </div>
          </div>

          {/* The Array Bars as illustrated Pantheon columns */}
          <div className="flex-1 w-full flex items-end justify-center gap-2.5 max-w-lg mt-8 mb-4 h-48">
            {currentArray.map((val, idx) => {
              const isActive = activeIndices.includes(idx);
              const isSorted = sortedIndices.includes(idx);
              const isPivot = pivotIndex === idx;
              const maxVal = Math.max(...currentArray);
              return (
                <PantheonColumn
                  key={idx}
                  val={val}
                  maxVal={maxVal}
                  isActive={isActive}
                  isSorted={isSorted}
                  isPivot={isPivot}
                />
              );
            })}
          </div>

          {/* Step description sub-hud */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-[#5a5a5a]">Step: {currentStepIdx + 1} / {steps.length}</span>
            <span className="text-[#1b365d]">{((currentStepIdx / Math.max(1, steps.length - 1)) * 100).toFixed(0)}% Complete</span>
          </div>
        </div>

        {/* Custom Input controls */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <Edit3 size={15} className="text-[#1b365d]" />
              Configure Custom Dataset
            </h4>
            <p className="text-slate-500 text-xs">Generate custom arrays or input comma-separated values (up to 20 numbers).</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRandomize}
              className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 hover:bg-indigo-500/25 hover:text-indigo-850 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              Random List
            </button>

            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="40, 20, 80, 10, 50"
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors w-40"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Curator & Code Side Panel (4 cols on large screens) */}
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
export default SortingGallery;
