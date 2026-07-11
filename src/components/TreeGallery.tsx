import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, GitBranch, Plus, Trash2 } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

// Node interface for BST/AVL
interface TreeNode {
  val: number;
  id: string;
  left: TreeNode | null;
  right: TreeNode | null;
  height: number;
  color?: 'red' | 'black';
  x?: number;
  y?: number;
}

interface TreeState {
  bstRoot: TreeNode | null;
  highlightedNodeIds: string[];
  activeRotationNodes?: string[];
  actionMessage: string;
}

const bstPseudocode = [
  { text: "procedure BST_Insert(root, key)", indent: 0 },
  { text: "if root is null return Node(key)", indent: 1 },
  { text: "if key < root.val then", indent: 1 },
  { text: "root.left := BST_Insert(root.left, key)", indent: 2 },
  { text: "else", indent: 1 },
  { text: "root.right := BST_Insert(root.right, key)", indent: 2 },
  { text: "return root", indent: 1 },
];

const bstPython = [
  { text: "def bst_insert(root, key):", indent: 0 },
  { text: "if not root:", indent: 1 },
  { text: "return Node(key)", indent: 2 },
  { text: "if key < root.val:", indent: 1 },
  { text: "root.left = bst_insert(root.left, key)", indent: 2 },
  { text: "else:", indent: 1 },
  { text: "root.right = bst_insert(root.right, key)", indent: 2 },
  { text: "return root", indent: 1 },
];

const avlPseudocode = [
  { text: "procedure AVL_Insert(node, key)", indent: 0 },
  { text: "node := BST_Insert(node, key)", indent: 1 },
  { text: "updateHeight(node)", indent: 1 },
  { text: "balance := getBalance(node)", indent: 1 },
  { text: "if balance > 1 and key < node.left.val then return rightRotate(node)", indent: 1 },
  { text: "if balance < -1 and key > node.right.val then return leftRotate(node)", indent: 1 },
  { text: "if balance > 1 and key > node.left.val then LR_Rotate(node)", indent: 1 },
  { text: "if balance < -1 and key < node.right.val then RL_Rotate(node)", indent: 1 },
];

const avlPython = [
  { text: "def avl_insert(root, key):", indent: 0 },
  { text: "if not root: return Node(key)", indent: 1 },
  { text: "root = bst_insert(root, key)", indent: 1 },
  { text: "root.height = 1 + max(height(root.left), height(root.right))", indent: 1 },
  { text: "balance = get_balance(root)", indent: 1 },
  { text: "if balance > 1 and key < root.left.val: return right_rotate(root)", indent: 1 },
  { text: "if balance < -1 and key > root.right.val: return left_rotate(root)", indent: 1 },
  { text: "if balance > 1 and key > root.left.val:", indent: 1 },
  { text: "root.left = left_rotate(root.left); return right_rotate(root)", indent: 2 },
  { text: "if balance < -1 and key < root.right.val:", indent: 1 },
  { text: "root.right = right_rotate(root.right); return left_rotate(root)", indent: 2 },
  { text: "return root", indent: 1 },
];

const copyTree = (node: TreeNode | null): TreeNode | null => {
  if (!node) return null;
  return {
    val: node.val,
    id: node.id,
    height: node.height,
    color: node.color,
    left: copyTree(node.left),
    right: copyTree(node.right)
  };
};

const calculateTreeCoordinates = (
  node: TreeNode | null,
  x: number,
  y: number,
  spacing: number,
  depth = 0
) => {
  if (!node) return;
  node.x = x;
  node.y = y;
  const yStep = 60;
  const nextSpacing = spacing / 1.7;

  if (node.left) {
    calculateTreeCoordinates(node.left, x - spacing, y + yStep, nextSpacing, depth + 1);
  }
  if (node.right) {
    calculateTreeCoordinates(node.right, x + spacing, y + yStep, nextSpacing, depth + 1);
  }
};

const treeAlgoDef: AlgorithmDefinition<TreeState, any> = {
  name: "Self-Balancing Binary Trees",
  description: "Binary search trees maintain sorted keys for fast O(log N) lookups. AVL trees maintain balance under inserts via single and double rotations.",
  complexity: { time: "O(log N)", space: "O(N)" },
  history: "The AVL tree was invented in 1962 by Soviet mathematicians Georgy Adelson-Velsky and Evgenii Landis. It was the first self-balancing binary search tree structure in computer science.",
  funFact: "AVL trees are named strictly after their creators' initials: Adelson-Velsky and Landis.",
  pseudocode: avlPseudocode,
  run: function* () {
    yield {
      line: 1,
      explanation: "Welcome to the Tree structures exhibit. Insert values to observe balancing rotations.",
      variables: {},
      state: { bstRoot: null, highlightedNodeIds: [], actionMessage: 'Ready' }
    };
  },
  defaultInput: null
};

export const TreeGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'bst' | 'avl'>('avl');
  const [showPlacard, setShowPlacard] = useState(true);
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState<number>(25);

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<TreeState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const height = (n: TreeNode | null): number => (n ? n.height : 0);
  const getBalance = (n: TreeNode | null): number => (n ? height(n.left) - height(n.right) : 0);

  const rightRotate = (y: TreeNode): TreeNode => {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.height = Math.max(height(y.left), height(y.right)) + 1;
    x.height = Math.max(height(x.left), height(x.right)) + 1;

    return x;
  };

  const leftRotate = (x: TreeNode): TreeNode => {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.height = Math.max(height(x.left), height(x.right)) + 1;
    y.height = Math.max(height(y.left), height(y.right)) + 1;

    return y;
  };

  const insertBST = (node: TreeNode | null, val: number, stepsList: AlgorithmStep<TreeState>[], rootCopy: TreeNode | null): TreeNode => {
    const newNodeId = `node-${val}`;
    if (!node) {
      const newNode: TreeNode = { val, id: newNodeId, left: null, right: null, height: 1 };
      return newNode;
    }

    if (val < node.val) {
      stepsList.push({
        line: 3,
        explanation: `Comparing key ${val} < node ${node.val}. Traversal branch heads to the left sub-child.`,
        variables: { key: val, parentVal: node.val, dir: 'left' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], actionMessage: 'Traversing Left' }
      });
      node.left = insertBST(node.left, val, stepsList, rootCopy);
    } else {
      stepsList.push({
        line: 5,
        explanation: `Comparing key ${val} >= node ${node.val}. Traversal branch heads to the right sub-child.`,
        variables: { key: val, parentVal: node.val, dir: 'right' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], actionMessage: 'Traversing Right' }
      });
      node.right = insertBST(node.right, val, stepsList, rootCopy);
    }

    node.height = Math.max(height(node.left), height(node.right)) + 1;
    return node;
  };

  const insertAVL = (node: TreeNode | null, val: number, stepsList: AlgorithmStep<TreeState>[], rootCopy: TreeNode | null): TreeNode => {
    const newNodeId = `node-${val}`;
    if (!node) {
      const newNode: TreeNode = { val, id: newNodeId, left: null, right: null, height: 1 };
      return newNode;
    }

    if (val < node.val) {
      stepsList.push({
        line: 2,
        explanation: `Comparing key ${val} < node ${node.val}. Traversal branch heads to the left sub-child.`,
        variables: { key: val, parentVal: node.val, dir: 'left' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], actionMessage: 'Traversing Left' }
      });
      node.left = insertAVL(node.left, val, stepsList, rootCopy);
    } else {
      stepsList.push({
        line: 2,
        explanation: `Comparing key ${val} >= node ${node.val}. Traversal branch heads to the right sub-child.`,
        variables: { key: val, parentVal: node.val, dir: 'right' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], actionMessage: 'Traversing Right' }
      });
      node.right = insertAVL(node.right, val, stepsList, rootCopy);
    }

    node.height = Math.max(height(node.left), height(node.right)) + 1;
    const balance = getBalance(node);

    stepsList.push({
      line: 3,
      explanation: `Recalculated heights: node ${node.val} height is now ${node.height}. Node balance factor is ${balance}.`,
      variables: { val: node.val, balance, height: node.height },
      state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], actionMessage: 'Checking Balance' }
    });

    // LL Case
    if (balance > 1 && val < node.left!.val) {
      stepsList.push({
        line: 5,
        explanation: `Balance factor is ${balance} > 1 and new key ${val} is left of ${node.left!.val}. Triggering RIGHT single rotation on node ${node.val}.`,
        variables: { node: node.val, balance, case: 'Left-Left' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], activeRotationNodes: [node.id, node.left!.id], actionMessage: 'Rotating Right' }
      });
      return rightRotate(node);
    }

    // RR Case
    if (balance < -1 && val > node.right!.val) {
      stepsList.push({
        line: 6,
        explanation: `Balance factor is ${balance} < -1 and new key ${val} is right of ${node.right!.val}. Triggering LEFT single rotation on node ${node.val}.`,
        variables: { node: node.val, balance, case: 'Right-Right' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], activeRotationNodes: [node.id, node.right!.id], actionMessage: 'Rotating Left' }
      });
      return leftRotate(node);
    }

    // LR Case
    if (balance > 1 && val > node.left!.val) {
      stepsList.push({
        line: 7,
        explanation: `Balance factor is ${balance} > 1 and new key ${val} is right of ${node.left!.val}. Triggering Left-Right DOUBLE rotation (Left rotation on ${node.left!.val}, then Right on ${node.val}).`,
        variables: { node: node.val, balance, case: 'Left-Right' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], activeRotationNodes: [node.id, node.left!.id], actionMessage: 'Double Rotating LR' }
      });
      node.left = leftRotate(node.left!);
      return rightRotate(node);
    }

    // RL Case
    if (balance < -1 && val < node.right!.val) {
      stepsList.push({
        line: 8,
        explanation: `Balance factor is ${balance} < -1 and new key ${val} is left of ${node.right!.val}. Triggering Right-Left DOUBLE rotation (Right rotation on ${node.right!.val}, then Left on ${node.val}).`,
        variables: { node: node.val, balance, case: 'Right-Left' },
        state: { bstRoot: copyTree(rootCopy), highlightedNodeIds: [node.id], activeRotationNodes: [node.id, node.right!.id], actionMessage: 'Double Rotating RL' }
      });
      node.right = rightRotate(node.right!);
      return leftRotate(node);
    }

    return node;
  };

  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(inputValue) || inputValue < 1 || inputValue > 99) {
      alert("Please enter a value between 1 and 99.");
      return;
    }

    setIsPlaying(false);
    const stepsList: AlgorithmStep<TreeState>[] = [];
    const rootCopy = copyTree(root);

    stepsList.push({
      line: 1,
      explanation: `Preparing to insert key ${inputValue} into tree. Starting search traversal from root node.`,
      variables: { key: inputValue },
      state: { bstRoot: rootCopy, highlightedNodeIds: [], actionMessage: 'Start Insert' }
    });

    let newRoot: TreeNode;
    if (selectedAlgo === 'bst') {
      newRoot = insertBST(rootCopy, inputValue, stepsList, rootCopy);
    } else {
      newRoot = insertAVL(rootCopy, inputValue, stepsList, rootCopy);
    }

    // Add final complete state step
    stepsList.push({
      line: 1,
      explanation: `Insertion complete! Node containing value ${inputValue} successfully integrated.`,
      variables: { key: inputValue },
      state: { bstRoot: newRoot, highlightedNodeIds: [`node-${inputValue}`], actionMessage: 'Insert Complete' }
    });

    setSteps(stepsList);
    setCurrentStepIdx(0);
    setRoot(newRoot);
  };

  const handleClearTree = () => {
    setIsPlaying(false);
    setRoot(null);
    setSteps([]);
    setCurrentStepIdx(0);
  };

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

  const def = treeAlgoDef;
  const pythonCode = selectedAlgo === 'bst' ? bstPython : avlPython;
  const activePseudocode = selectedAlgo === 'bst' ? bstPseudocode : avlPseudocode;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="Tree Structures"
        description="Tree structures represent hierarchical relationships between parent and child nodes. Self-balancing binary trees automatically adjust themselves during insertions to keep search times fast."
        history="Georgy Adelson-Velsky (pictured) and Evgenii Landis created the AVL tree in 1962. It was the first self-balancing binary search tree structure in computer science history, guaranteeing logarithmic search speed."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Self-Balancing']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/9/9f/Adelson-Velsky-G.Moscow-1980.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready to insert nodes.',
    variables: {},
    state: { bstRoot: root, highlightedNodeIds: [], actionMessage: 'Ready' }
  };

  const renderedBstRoot = currentStep.state?.bstRoot || null;
  const highlightedNodeIds = currentStep.state?.highlightedNodeIds || [];
  const activeRotationNodes = currentStep.state?.activeRotationNodes || [];

  // Recalculate layout locations recursively
  if (renderedBstRoot) {
    calculateTreeCoordinates(renderedBstRoot, 280, 40, 110);
  }

  // Flatten nodes/edges list for SVG rendering
  const nodes: TreeNode[] = [];
  const edges: Array<{ id: string; parent: TreeNode; child: TreeNode }> = [];

  const traverse = (node: TreeNode | null) => {
    if (!node) return;
    nodes.push(node);
    if (node.left) {
      edges.push({ id: `${node.id}-${node.left.id}`, parent: node, child: node.left });
      traverse(node.left);
    }
    if (node.right) {
      edges.push({ id: `${node.id}-${node.right.id}`, parent: node, child: node.right });
      traverse(node.right);
    }
  };

  traverse(renderedBstRoot);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <GitBranch className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
                setShowPlacard(true);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="avl">AVL Self-Balancing Tree</option>
              <option value="bst">Binary Search Tree (BST)</option>
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
              min="100"
              max="1500"
              step="100"
              value={1600 - speed}
              onChange={(e) => setSpeed(1600 - parseInt(e.target.value))}
              className="w-20 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* Tree Render SVG canvas */}
        <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden bg-[#f4f0e6] min-h-[360px] flex flex-col justify-between p-4">
          <div className="absolute top-4 left-6 flex flex-col gap-1 text-[10px] text-[#5a5a5a] pointer-events-none select-none">
            <span className="text-[#1b365d] font-extrabold uppercase">Balanced Tree Visualizer</span>
            <span>• Labels inside nodes indicate keys [Heights in brackets]</span>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#fcfaf2] border border-[#2d2d2d] rounded-full"></span>
              <span>Default Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d]/10 border border-[#1b365d] rounded-full"></span>
              <span>Traversing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#722f37] border border-[#722f37] rounded-full"></span>
              <span>Rotated Pivots</span>
            </div>
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center min-h-[260px]">
            {nodes.length === 0 ? (
              <div className="text-slate-500 text-xs italic">Tree is empty. Insert a value to build nodes.</div>
            ) : (
              <svg className="w-full h-full min-h-[300px]">
                {/* Draw Edges */}
                {edges.map((e) => (
                  <line
                    key={e.id}
                    x1={e.parent.x}
                    y1={e.parent.y}
                    x2={e.child.x}
                    y2={e.child.y}
                    className="stroke-[#5a5a5a]/30 stroke-[2] transition-all duration-300"
                  />
                ))}

                {/* Draw Nodes */}
                {nodes.map((n) => {
                  const isHighlighted = highlightedNodeIds.includes(n.id);
                  const isRotating = activeRotationNodes.includes(n.id);

                  let circleFill = 'fill-[#fcfaf2]';
                  let strokeColor = 'stroke-[#2d2d2d]';

                  if (isRotating) {
                    circleFill = 'fill-[#722f37]/10';
                    strokeColor = 'stroke-[#722f37]';
                  } else if (isHighlighted) {
                    circleFill = 'fill-[#1b365d]/10';
                    strokeColor = 'stroke-[#1b365d]';
                  }

                  return (
                    <g key={n.id} transform={`translate(${n.x}, ${n.y})`} className="transition-transform duration-500">
                      <circle r="16" className={`${circleFill} ${strokeColor} stroke-[2.5]`} />
                      <text textAnchor="middle" dy="4" className="fill-[#1c1c1c] font-mono text-[10px] font-bold">
                        {n.val}
                      </text>
                      {/* Height badge */}
                      <text textAnchor="middle" dy="25" className="fill-[#5a5a5a] font-mono text-[8px] font-semibold">
                        [{n.height}]
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Sub-hud */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center mt-2 text-xs font-bold text-[#1b365d] flex justify-between items-center">
            <span>Action: {currentStep.state?.actionMessage || 'Ready'}</span>
            <span>Balanced Factor: {renderedBstRoot ? getBalance(renderedBstRoot) : 0}</span>
          </div>
        </div>

        {/* Input form panel */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <Plus size={15} className="text-[#1b365d]" />
              Insert Tree Node
            </h4>
            <p className="text-slate-500 text-xs">Enter a value (1 to 99) to insert it into the active binary structure.</p>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleInsertSubmit} className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="99"
                value={inputValue}
                onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors w-20 text-center font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all"
              >
                Insert Value
              </button>
            </form>
            <button
              onClick={handleClearTree}
              className="px-4 py-2 border border-transparent hover:border-[#a13d2d]/25 text-[#5a5a5a] hover:text-[#a13d2d] text-xs font-bold transition-all flex items-center gap-1"
            >
              <Trash2 size={13} />
              Clear Tree
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
            pseudocode={activePseudocode}
            pythonCode={pythonCode}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default TreeGallery;
