import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Share2, Plus } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  capacity: number;
  flow: number;
}

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  activePath?: string[];
  bottleneck?: number;
  residualMatrix?: Record<string, Record<string, number>>;
  maxFlow?: number;
  actionMessage: string;
}

const fordFulkersonPseudocode = [
  { text: "procedure FordFulkerson(G, source, sink)", indent: 0 },
  { text: "initialize flow on all edges to 0", indent: 1 },
  { text: "while there exists path P from source to sink in residual G_f do", indent: 1 },
  { text: "find bottleneck capacity c_f(P) = min(c_f(u, v)) for (u, v) in P", indent: 2 },
  { text: "for each edge (u, v) in P do", indent: 2 },
  { text: "flow(u, v) := flow(u, v) + c_f(P)", indent: 3 },
  { text: "flow(v, u) := flow(v, u) - c_f(P)", indent: 3 },
  { text: "return max_flow", indent: 1 },
];

const flowPython = [
  { text: "def ford_fulkerson(graph, source, sink):", indent: 0 },
  { text: "max_flow = 0", indent: 1 },
  { text: "while bfs(graph, source, sink, parent):", indent: 1 },
  { text: "path_flow = float('inf')", indent: 2 },
  { text: "s = sink", indent: 2 },
  { text: "while s != source:", indent: 2 },
  { text: "path_flow = min(path_flow, residual[parent[s]][s])", indent: 3 },
  { text: "s = parent[s]", indent: 3 },
  { text: "v = sink", indent: 2 },
  { text: "while v != source:", indent: 2 },
  { text: "u = parent[v]", indent: 3 },
  { text: "residual[u][v] -= path_flow", indent: 3 },
  { text: "residual[v][u] += path_flow", indent: 3 },
  { text: "v = parent[v]", indent: 3 },
  { text: "max_flow += path_flow", indent: 2 },
  { text: "return max_flow", indent: 1 },
];

const flowAlgoDef: AlgorithmDefinition<FlowState, any> = {
  name: "Network Flow (Ford-Fulkerson)",
  description: "Network flow algorithms calculate the maximum amount of flow that can go from a Source (S) to a Sink (T) through capacity-constrained links.",
  complexity: { time: "O(E * MaxFlow)", space: "O(V + E)" },
  history: "The Ford-Fulkerson algorithm was published in 1956 by L. R. Ford Jr. and D. R. Fulkerson. It was formulated during research on railways networks for the US Air Force.",
  funFact: "In network flow, the 'Max-Flow Min-Cut' theorem proves that the maximum flow is exactly equal to the capacity of the bottleneck cut-set separating source and sink.",
  pseudocode: fordFulkersonPseudocode,
  run: function* () {
    yield {
      line: 1,
      explanation: "Welcome to the Network Flow gallery. Watch augment paths carry flow and capacities adjust in the residual graph.",
      variables: {},
      state: { nodes: [], edges: [], actionMessage: 'Ready' }
    };
  },
  defaultInput: null
};

const createPresetFlowGraph = (): { nodes: FlowNode[]; edges: FlowEdge[] } => {
  return {
    nodes: [
      { id: 'S', label: 'S (Source)', x: 80, y: 180 },
      { id: 'A', label: 'A', x: 220, y: 80 },
      { id: 'B', label: 'B', x: 220, y: 280 },
      { id: 'C', label: 'C', x: 380, y: 80 },
      { id: 'D', label: 'D', x: 380, y: 280 },
      { id: 'T', label: 'T (Sink)', x: 520, y: 180 },
    ],
    edges: [
      { id: 'S-A', source: 'S', target: 'A', capacity: 10, flow: 0 },
      { id: 'S-B', source: 'S', target: 'B', capacity: 10, flow: 0 },
      { id: 'A-C', source: 'A', target: 'C', capacity: 4, flow: 0 },
      { id: 'A-D', source: 'A', target: 'D', capacity: 8, flow: 0 },
      { id: 'B-D', source: 'B', target: 'D', capacity: 9, flow: 0 },
      { id: 'C-T', source: 'C', target: 'T', capacity: 10, flow: 0 },
      { id: 'D-C', source: 'D', target: 'C', capacity: 6, flow: 0 },
      { id: 'D-T', source: 'D', target: 'T', capacity: 10, flow: 0 },
    ]
  };
};

export const FlowGallery: React.FC = () => {
  const [showPlacard, setShowPlacard] = useState(true);
  const [graph, setGraph] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }>(() => createPresetFlowGraph());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<FlowState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const generateFlowSteps = () => {
    setIsPlaying(false);
    const collectedSteps: AlgorithmStep<FlowState>[] = [];
    const nodes = graph.nodes.map(n => ({ ...n }));
    const edges = graph.edges.map(e => ({ ...e, flow: 0 }));

    collectedSteps.push({
      line: 2,
      explanation: "Initializing all flow values on edges to 0/capacity. We prepare to look for augment paths using BFS (Edmonds-Karp).",
      variables: { maxFlow: 0 },
      state: { nodes, edges: edges.map(e => ({ ...e })), actionMessage: 'Flow Initialized' }
    });

    const residual: Record<string, Record<string, number>> = {};
    nodes.forEach(n => {
      residual[n.id] = {};
      nodes.forEach(m => {
        residual[n.id][m.id] = 0;
      });
    });

    edges.forEach(e => {
      residual[e.source][e.target] = e.capacity;
    });

    const findAugmentPath = (): string[] | null => {
      const visited: Record<string, boolean> = {};
      const queue: string[] = ['S'];
      visited['S'] = true;
      const parent: Record<string, string> = {};

      while (queue.length > 0) {
        const u = queue.shift()!;
        if (u === 'T') {
          const path: string[] = [];
          let curr = 'T';
          while (curr) {
            path.unshift(curr);
            curr = parent[curr];
          }
          return path;
        }

        for (const v in residual[u]) {
          const resCap = residual[u][v];
          if (!visited[v] && resCap > 0) {
            visited[v] = true;
            parent[v] = u;
            queue.push(v);
          }
        }
      }
      return null;
    };

    let path = findAugmentPath();
    let maxFlow = 0;

    while (path) {
      let bottleneck = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        bottleneck = Math.min(bottleneck, residual[u][v]);
      }

      collectedSteps.push({
        line: 3,
        explanation: `BFS discovered an augment path: ${path.join(' -> ')}. Finding the bottleneck edge capacity.`,
        variables: { path: path.join(','), maxFlow },
        state: { nodes, edges: edges.map(e => ({ ...e })), activePath: [...path], bottleneck, actionMessage: 'Augment Path Found' }
      });

      collectedSteps.push({
        line: 4,
        explanation: `The bottleneck is ${bottleneck}. We will add this flow to the network.`,
        variables: { bottleneck, maxFlow },
        state: { nodes, edges: edges.map(e => ({ ...e })), activePath: [...path], bottleneck, actionMessage: `Bottleneck: ${bottleneck}` }
      });

      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        
        residual[u][v] -= bottleneck;
        residual[v][u] += bottleneck;

        const forwardEdge = edges.find(e => e.source === u && e.target === v);
        if (forwardEdge) {
          forwardEdge.flow += bottleneck;
        } else {
          const backwardEdge = edges.find(e => e.source === v && e.target === u);
          if (backwardEdge) {
            backwardEdge.flow -= bottleneck;
          }
        }
      }

      maxFlow += bottleneck;

      collectedSteps.push({
        line: 6,
        explanation: `Augmented flow values! Added +${bottleneck} flow to the path. Current total flow: ${maxFlow}.`,
        variables: { bottleneck, maxFlow },
        state: { nodes, edges: edges.map(e => ({ ...e })), activePath: [...path], bottleneck, maxFlow, actionMessage: 'Residual Flow Shifted' }
      });

      path = findAugmentPath();
    }

    collectedSteps.push({
      line: 8,
      explanation: `No more augment paths exist in the residual network. Ford-Fulkerson complete. Maximum Flow = ${maxFlow}.`,
      variables: { maxFlow },
      state: { nodes, edges: edges.map(e => ({ ...e })), maxFlow, actionMessage: `Max Flow: ${maxFlow}` }
    });

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    generateFlowSteps();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [graph]);

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

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(rect.width - 20, e.clientX - rect.left));
    const y = Math.max(20, Math.min(rect.height - 20, e.clientY - rect.top));

    const nextNodes = graph.nodes.map(n => {
      if (n.id === draggedNodeId) {
        return { ...n, x, y };
      }
      return n;
    });

    setGraph({ ...graph, nodes: nextNodes });
  };

  const handleSVGMouseUp = () => {
    setDraggedNodeId(null);
  };

  const def = flowAlgoDef;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="Network Flows"
        description="Network flow algorithms calculate the optimal routing of commodities (such as water, cargo boxes, or internet data packets) through a connected pipeline grid with capacity limitations on each link."
        history="Delbert Fulkerson (pictured) and Lester Ford developed their flow-solving algorithm in 1956 at RAND Corporation while mapping railway traffic constraints. Their work established the Max-Flow Min-Cut theorem of logistics."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Augment Path']}
        imageUrl="https://upload.wikimedia.org/wikipedia/en/2/25/Delbert_Ray_Fulkerson.png"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready.',
    variables: {},
    state: { nodes: graph.nodes, edges: graph.edges, actionMessage: 'Ready' }
  };

  const activeNodes = currentStep.state?.nodes || graph.nodes;
  const activeEdges = currentStep.state?.edges || graph.edges;
  const activePath = currentStep.state?.activePath || [];
  const maxFlow = currentStep.state?.maxFlow;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Share2 className="text-[#1b365d]" size={18} />
            <select className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors">
              <option value="ford">Ford-Fulkerson Flow Solver</option>
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
              {isPlaying ? 'Pause' : 'Solve Flow'}
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

        {/* Network Flow SVG */}
        <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden bg-[#f4f0e6] min-h-[360px] flex flex-col justify-between">
          <div className="absolute top-4 left-6 flex flex-col gap-1 text-[10px] text-[#5a5a5a] pointer-events-none select-none">
            <span className="text-[#1b365d] font-extrabold uppercase">Source (S) to Sink (T) Capacity Grid</span>
            <span>• Drag nodes to clean up graph alignment</span>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#5a5a5a]"></span>
              <span>Capacity Link</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#1b365d]"></span>
              <span>Augment Path Edge</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <svg
            ref={svgRef}
            className="flex-1 w-full h-full cursor-crosshair min-h-[280px]"
            onMouseMove={handleSVGMouseMove}
            onMouseUp={handleSVGMouseUp}
          >
            {/* Draw links */}
            {activeEdges.map((e) => {
              const uNode = activeNodes.find(n => n.id === e.source);
              const vNode = activeNodes.find(n => n.id === e.target);
              if (!uNode || !vNode) return null;

              const inAugmentPath = activePath.includes(e.source) && activePath.includes(e.target) && 
                activePath.indexOf(e.target) === activePath.indexOf(e.source) + 1;

              let strokeColor = 'stroke-[#5a5a5a]/30';
              let strokeWidth = 'stroke-[2.5]';

              if (inAugmentPath) {
                strokeColor = 'stroke-[#1b365d]';
                strokeWidth = 'stroke-[4.5]';
              } else if (e.flow > 0) {
                strokeColor = 'stroke-indigo-600/70';
              }

              const midX = (uNode.x + vNode.x) / 2;
              const midY = (uNode.y + vNode.y) / 2;

              return (
                <g key={e.id}>
                  <line
                    x1={uNode.x}
                    y1={uNode.y}
                    x2={vNode.x}
                    y2={vNode.y}
                    className={`${strokeColor} ${strokeWidth} transition-all duration-300`}
                  />
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-18" y="-8" width="36" height="16" fill="#fcfaf2" stroke="#2d2d2d" strokeWidth="1" />
                    <text
                      textAnchor="middle"
                      dy="4"
                      className="fill-[#1c1c1c] font-mono text-[8.5px] font-bold"
                    >
                      {e.flow}/{e.capacity}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Draw nodes */}
            {activeNodes.map((n) => {
              const inAugmentPath = activePath.includes(n.id);
              let circleFill = 'fill-[#fcfaf2]';
              let circleStroke = 'stroke-[#2d2d2d]';

              if (n.id === 'S') {
                circleFill = 'fill-[#1b365d]/10';
                circleStroke = 'stroke-[#1b365d]';
              } else if (n.id === 'T') {
                circleFill = 'fill-[#722f37]/10';
                circleStroke = 'stroke-[#722f37]';
              } else if (inAugmentPath) {
                circleStroke = 'stroke-[#1b365d]';
              }

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedNodeId(n.id);
                  }}
                  className="cursor-pointer"
                >
                  <circle r="16" className={`${circleFill} ${circleStroke} stroke-[2.5] hover:scale-105 transition-transform`} />
                  <text textAnchor="middle" dy="4" className="fill-[#1c1c1c] font-serif font-bold text-[10px] select-none">
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Output HUD */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center text-xs font-bold text-[#1b365d] flex items-center justify-between">
            <span>Flow State:</span>
            <span>{maxFlow !== undefined ? `Max Flow: ${maxFlow}` : 'Idle'}</span>
          </div>
        </div>

        {/* Builder configs */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <Plus size={15} className="text-[#1b365d]" />
              Configure Graph Presets
            </h4>
            <p className="text-slate-500 text-xs">Load standard Source-Sink network parameters to solve max flow values.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGraph(createPresetFlowGraph())}
              className="px-4 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all"
            >
              Load Default Network
            </button>
            <button
              onClick={() => setGraph({ nodes: [], edges: [] })}
              className="px-4 py-2 border border-transparent hover:border-[#a13d2d]/25 text-[#5a5a5a] hover:text-[#a13d2d] text-xs font-bold transition-all"
            >
              Clear Canvas
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
            pythonCode={flowPython}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default FlowGallery;
