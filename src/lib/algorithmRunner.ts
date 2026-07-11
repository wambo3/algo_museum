export interface AlgorithmStep<S = any> {
  line: number; // 1-indexed line of pseudocode to highlight
  explanation: string; // Narration for the curator guide
  variables: Record<string, string | number | boolean | null | undefined | string[]>; // State variables
  state: S; // Snapshot of the main visualization structures
  meta?: {
    activeIndices?: number[]; // indices of array bars being compared/modified
    pivotIndex?: number;
    sortedIndices?: number[];
    visitedNodes?: string[]; // nodes visited in graph
    activeNodes?: string[]; // current nodes in BFS/DFS queue or stack
    activeEdges?: string[]; // edge IDs in focus (e.g. "A-B")
    path?: string[]; // path nodes
    focusedCell?: { row: number; col: number }; // cell in DP table
    solvedCells?: Array<{ row: number; col: number }>;
    points?: Array<{ x: number; y: number; type: 'hull' | 'candidate' | 'normal' }>;
    sweepAngle?: number;
    sweepLineX?: number;
    [key: string]: any;
  };
}

export interface PseudocodeLine {
  text: string;
  indent: number;
}

export interface AlgorithmDefinition<S = any, I = any> {
  name: string;
  description: string;
  complexity: {
    time: string;
    space: string;
  };
  history: string; // Museum placard historical note
  funFact: string; // Curator "Did you know?"
  pseudocode: PseudocodeLine[];
  // Generator function that yields steps
  run: (input: I) => Generator<AlgorithmStep<S>, void, unknown>;
  defaultInput: I;
}
