import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Share2, Plus } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
}

interface GraphStepState {
  nodes: Node[];
  edges: Edge[];
  mstEdges: string[]; // Edge IDs
  activeEdgeId?: string;
  disjointSets?: Record<string, string>; // for Kruskal
  visitedNodes?: string[]; // for Prim
  actionMessage: string;
}

const createPresetGraph = (type: 'default' | 'mst' | 'disconnected'): GraphState => {
  if (type === 'mst') {
    return {
      nodes: [
        { id: 'A', label: 'A', x: 150, y: 100 },
        { id: 'B', label: 'B', x: 350, y: 80 },
        { id: 'C', label: 'C', x: 200, y: 250 },
        { id: 'D', label: 'D', x: 450, y: 220 },
        { id: 'E', label: 'E', x: 320, y: 350 },
      ],
      edges: [
        { id: 'A-B', source: 'A', target: 'B', weight: 4 },
        { id: 'A-C', source: 'A', target: 'C', weight: 2 },
        { id: 'B-C', source: 'B', target: 'C', weight: 5 },
        { id: 'B-D', source: 'B', target: 'D', weight: 10 },
        { id: 'C-D', source: 'C', target: 'D', weight: 3 },
        { id: 'C-E', source: 'C', target: 'E', weight: 6 },
        { id: 'D-E', source: 'D', target: 'E', weight: 4 },
      ]
    };
  } else if (type === 'disconnected') {
    return {
      nodes: [
        { id: 'A', label: 'A', x: 100, y: 150 },
        { id: 'B', label: 'B', x: 250, y: 100 },
        { id: 'C', label: 'C', x: 250, y: 220 },
        { id: 'D', label: 'D', x: 450, y: 100 },
        { id: 'E', label: 'E', x: 450, y: 250 },
      ],
      edges: [
        { id: 'A-B', source: 'A', target: 'B', weight: 3 },
        { id: 'A-C', source: 'A', target: 'C', weight: 5 },
        { id: 'B-C', source: 'B', target: 'C', weight: 2 },
        { id: 'D-E', source: 'D', target: 'E', weight: 4 },
      ]
    };
  }

  return {
    nodes: [
      { id: 'A', label: 'A', x: 150, y: 150 },
      { id: 'B', label: 'B', x: 300, y: 80 },
      { id: 'C', label: 'C', x: 450, y: 150 },
      { id: 'D', label: 'D', x: 370, y: 280 },
      { id: 'E', label: 'E', x: 220, y: 280 },
    ],
    edges: [
      { id: 'A-B', source: 'A', target: 'B', weight: 2 },
      { id: 'B-C', source: 'B', target: 'C', weight: 3 },
      { id: 'C-D', source: 'C', target: 'D', weight: 1 },
      { id: 'D-E', source: 'D', target: 'E', weight: 5 },
      { id: 'E-A', source: 'E', target: 'A', weight: 7 },
      { id: 'B-D', source: 'B', target: 'D', weight: 4 },
      { id: 'B-E', source: 'B', target: 'E', weight: 2 },
    ]
  };
};

const kruskalPseudocode = [
  { text: "procedure Kruskal(G)", indent: 0 },
  { text: "create forest F, initially empty", indent: 1 },
  { text: "for each vertex v in G do makeSet(v)", indent: 1 },
  { text: "sort edges of G by weight in ascending order", indent: 1 },
  { text: "for each edge (u, v) in sorted edges do", indent: 1 },
  { text: "if findSet(u) != findSet(v) then", indent: 2 },
  { text: "add edge (u, v) to F", indent: 3 },
  { text: "unionSet(u, v)", indent: 3 },
  { text: "return F", indent: 1 },
];

const kruskalPython = [
  { text: "def kruskal(vertices, edges):", indent: 0 },
  { text: "mst = []", indent: 1 },
  { text: "parent = {v: v for v in vertices}", indent: 1 },
  { text: "sorted_edges = sorted(edges, key=lambda e: e.weight)", indent: 1 },
  { text: "for edge in sorted_edges:", indent: 1 },
  { text: "u, v = edge.source, edge.target", indent: 2 },
  { text: "if find(parent, u) != find(parent, v):", indent: 2 },
  { text: "mst.append(edge)", indent: 3 },
  { text: "union(parent, u, v)", indent: 3 },
  { text: "return mst", indent: 1 },
];

const primPseudocode = [
  { text: "procedure Prim(G, start)", indent: 0 },
  { text: "create MST tree T, initially empty", indent: 1 },
  { text: "visited := {startNode}", indent: 1 },
  { text: "while visited != G.vertices do", indent: 1 },
  { text: "find cheapest edge (u, v) such that u in visited and v not in visited", indent: 2 },
  { text: "add edge (u, v) to T", indent: 2 },
  { text: "add v to visited", indent: 2 },
  { text: "return T", indent: 1 },
];

const primPython = [
  { text: "def prim(vertices, edges, start):", indent: 0 },
  { text: "mst = []", indent: 1 },
  { text: "visited = {start}", indent: 1 },
  { text: "pq = get_edges(start)", indent: 1 },
  { text: "while pq:", indent: 1 },
  { text: "edge = heappop(pq)", indent: 2 },
  { text: "u, v = edge.source, edge.target", indent: 2 },
  { text: "if v not in visited:", indent: 2 },
  { text: "visited.add(v)", indent: 3 },
  { text: "mst.append(edge)", indent: 3 },
  { text: "for e in get_edges(v): heappush(pq, e)", indent: 3 },
  { text: "return mst", indent: 1 },
];

const kruskalAlgoDef: AlgorithmDefinition<GraphStepState, any> = {
  name: "Kruskal's MST Algorithm",
  description: "A greedy algorithm that finds a Minimum Spanning Tree (MST) for a connected weighted graph. It sorts all edges and adds them one by one, skipping edges that would create a cycle.",
  complexity: { time: "O(E log E)", space: "O(V + E)" },
  history: "First published by Joseph Kruskal in 1956. Joseph was a mathematician and statistician who also contributed to multidimensional scaling. Kruskal's algorithm remains a textbook standard for demonstrating disjoint-set union data structures.",
  funFact: "Kruskal's algorithm works perfectly on disconnected graphs too, returning a Minimum Spanning Forest instead of a single tree.",
  pseudocode: kruskalPseudocode,
  run: function* () { yield { line: 1, explanation: "Starting Kruskal's algorithm.", variables: {}, state: { nodes: [], edges: [], mstEdges: [], actionMessage: 'Ready' } }; },
  defaultInput: null
};

const primAlgoDef: AlgorithmDefinition<GraphStepState, any> = {
  name: "Prim's MST Algorithm",
  description: "An alternative greedy MST algorithm. It starts from a single arbitrary vertex and grows the spanning tree node-by-node by choosing the cheapest outward edge at each step.",
  complexity: { time: "O(E log V)", space: "O(V)" },
  history: "Conceived by mathematician Vojtech Jarnik in 1930, and later independently rediscovered and popularized by Robert C. Prim in 1957. Computer scientist Edsger Dijkstra also rediscovered it in 1959.",
  funFact: "Prim's algorithm is mathematically dual to Dijkstra's shortest path solver; the only difference is that Prim minimizes the edge weight itself rather than the total path distance from source.",
  pseudocode: primPseudocode,
  run: function* () { yield { line: 1, explanation: "Starting Prim's algorithm.", variables: {}, state: { nodes: [], edges: [], mstEdges: [], actionMessage: 'Ready' } }; },
  defaultInput: null
};

export const GraphGallery: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'kruskal' | 'prim'>('kruskal');
  const [showPlacard, setShowPlacard] = useState(true);
  const [graph, setGraph] = useState<GraphState>(() => createPresetGraph('default'));
  
  // Custom Node Builder States
  const [nodeInputId, setNodeInputId] = useState('F');
  const [edgeSourceId, setEdgeSourceId] = useState('A');
  const [edgeTargetId, setEdgeTargetId] = useState('B');
  const [edgeWeightInput, setEdgeWeightInput] = useState(3);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<GraphStepState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Solves & builds execution steps dynamically
  const generateGraphSteps = () => {
    setIsPlaying(false);
    const collectedSteps: AlgorithmStep<GraphStepState>[] = [];
    const nodes = graph.nodes.map(n => ({ ...n }));
    const edges = graph.edges.map(e => ({ ...e }));

    if (nodes.length === 0) {
      setSteps([]);
      return;
    }

    if (selectedAlgo === 'kruskal') {
      // 1. Initial State
      const parentMap: Record<string, string> = {};
      nodes.forEach(n => {
        parentMap[n.id] = n.id;
      });

      collectedSteps.push({
        line: 2,
        explanation: "Initializing Kruskal's MST solver. We create an empty forest F and put each vertex in its own disjoint set.",
        variables: { edgeCount: edges.length, mstCount: 0 },
        state: { nodes, edges, mstEdges: [], disjointSets: { ...parentMap }, actionMessage: 'Forest Initialized' }
      });

      // 2. Sort Edges
      const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
      collectedSteps.push({
        line: 4,
        explanation: `Sorting all edges by weight in ascending order. Sorted sequence: ${sortedEdges.map(e => `${e.source}-${e.target}(w:${e.weight})`).join(', ')}.`,
        variables: { edgeCount: edges.length },
        state: { nodes, edges, mstEdges: [], disjointSets: { ...parentMap }, actionMessage: 'Edges Sorted' }
      });

      const find = (id: string): string => {
        let curr = id;
        while (parentMap[curr] !== curr) {
          curr = parentMap[curr];
        }
        return curr;
      };

      const union = (id1: string, id2: string) => {
        const root1 = find(id1);
        const root2 = find(id2);
        if (root1 !== root2) {
          parentMap[root1] = root2;
        }
      };

      const mstEdgeIds: string[] = [];

      for (let k = 0; k < sortedEdges.length; k++) {
        const edge = sortedEdges[k];
        const u = edge.source;
        const v = edge.target;

        const rootU = find(u);
        const rootV = find(v);

        collectedSteps.push({
          line: 5,
          explanation: `Checking edge ${u} - ${v} with weight ${edge.weight}. Checking disjoint sets for vertices.`,
          variables: { edgeId: edge.id, weight: edge.weight, rootU, rootV },
          state: { nodes, edges, mstEdges: [...mstEdgeIds], activeEdgeId: edge.id, disjointSets: { ...parentMap }, actionMessage: `Checking Edge: ${edge.id}` }
        });

        if (rootU !== rootV) {
          mstEdgeIds.push(edge.id);
          union(u, v);

          collectedSteps.push({
            line: 7,
            explanation: `Since findSet(${u}) = '${rootU}' and findSet(${v}) = '${rootV}' are different, adding this edge doesn't create a cycle. Add edge to MST and union sets.`,
            variables: { edgeId: edge.id, weight: edge.weight },
            state: { nodes, edges, mstEdges: [...mstEdgeIds], activeEdgeId: edge.id, disjointSets: { ...parentMap }, actionMessage: `Edge Accepted: ${edge.id}` }
          });
        } else {
          collectedSteps.push({
            line: 5,
            explanation: `Edge ${u} - ${v} shares the same set root '${rootU}'. Adding this edge would form a cycle! Skipping it.`,
            variables: { edgeId: edge.id, weight: edge.weight },
            state: { nodes, edges, mstEdges: [...mstEdgeIds], activeEdgeId: edge.id, disjointSets: { ...parentMap }, actionMessage: `Edge Rejected (Cycle): ${edge.id}` }
          });
        }
      }

      collectedSteps.push({
        line: 9,
        explanation: `Completed Kruskal's solver. Found Spanning Tree containing ${mstEdgeIds.length} edges.`,
        variables: { mstSize: mstEdgeIds.length },
        state: { nodes, edges, mstEdges: [...mstEdgeIds], disjointSets: { ...parentMap }, actionMessage: 'MST Found' }
      });
    } else {
      // Prim's algorithm
      const startNode = nodes[0].id;
      const visited: string[] = [startNode];
      const mstEdgeIds: string[] = [];

      collectedSteps.push({
        line: 3,
        explanation: `Starting Prim's algorithm at arbitrary node '${startNode}'. Marking node '${startNode}' as visited.`,
        variables: { visitedCount: 1 },
        state: { nodes, edges, mstEdges: [], visitedNodes: [...visited], actionMessage: `Init Prim at ${startNode}` }
      });

      while (visited.length < nodes.length) {
        // Find cheapest outward edge connecting visited to unvisited
        let cheapestEdge: Edge | null = null;
        let bestWeight = Infinity;

        // Collect all edges that cross boundary
        for (let j = 0; j < edges.length; j++) {
          const e = edges[j];
          const hasSource = visited.includes(e.source);
          const hasTarget = visited.includes(e.target);

          if ((hasSource && !hasTarget) || (!hasSource && hasTarget)) {
            if (e.weight < bestWeight) {
              bestWeight = e.weight;
              cheapestEdge = e;
            }
          }
        }

        if (!cheapestEdge) {
          // Graph is disconnected
          break;
        }

        const nextNode = visited.includes(cheapestEdge.source) ? cheapestEdge.target : cheapestEdge.source;

        collectedSteps.push({
          line: 5,
          explanation: `Cheapest outward boundary edge is '${cheapestEdge.source} - ${cheapestEdge.target}' with weight ${cheapestEdge.weight}.`,
          variables: { bestEdge: cheapestEdge.id, weight: cheapestEdge.weight, nextNode },
          state: { nodes, edges, mstEdges: [...mstEdgeIds], activeEdgeId: cheapestEdge.id, visitedNodes: [...visited], actionMessage: `Selected boundary edge ${cheapestEdge.id}` }
        });

        visited.push(nextNode);
        mstEdgeIds.push(cheapestEdge.id);

        collectedSteps.push({
          line: 7,
          explanation: `Adding edge '${cheapestEdge.id}' to the MST. Marking node '${nextNode}' as visited. Visited set is now {${visited.join(', ')}}.`,
          variables: { visitedSize: visited.length },
          state: { nodes, edges, mstEdges: [...mstEdgeIds], activeEdgeId: cheapestEdge.id, visitedNodes: [...visited], actionMessage: `Node Visited: ${nextNode}` }
        });
      }

      collectedSteps.push({
        line: 8,
        explanation: "All reachable nodes visited. Prim's MST completed successfully.",
        variables: { mstSize: mstEdgeIds.length },
        state: { nodes, edges, mstEdges: [...mstEdgeIds], visitedNodes: [...visited], actionMessage: 'MST Found' }
      });
    }

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    generateGraphSteps();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [graph, selectedAlgo]);

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

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    const id = nodeInputId.trim().toUpperCase();
    if (!id || id.length > 3) {
      alert("Please enter a valid node label (max 3 characters).");
      return;
    }
    if (graph.nodes.some(n => n.id === id)) {
      alert("Node already exists.");
      return;
    }

    const nextNode: Node = {
      id,
      label: id,
      x: Math.floor(Math.random() * 200) + 100,
      y: Math.floor(Math.random() * 200) + 100
    };

    setGraph({
      ...graph,
      nodes: [...graph.nodes, nextNode]
    });
  };

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (edgeSourceId === edgeTargetId) {
      alert("Source and Target nodes must be different.");
      return;
    }
    const edgeId = `${edgeSourceId}-${edgeTargetId}`;
    const reverseEdgeId = `${edgeTargetId}-${edgeSourceId}`;

    if (graph.edges.some(e => e.id === edgeId || e.id === reverseEdgeId)) {
      alert("Edge already exists.");
      return;
    }

    const nextEdge: Edge = {
      id: edgeId,
      source: edgeSourceId,
      target: edgeTargetId,
      weight: edgeWeightInput
    };

    setGraph({
      ...graph,
      edges: [...graph.edges, nextEdge]
    });
  };

  const def = selectedAlgo === 'kruskal' ? kruskalAlgoDef : primAlgoDef;
  const pythonCode = selectedAlgo === 'kruskal' ? kruskalPython : primPython;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="Graph Landscapes"
        description="Graphs model connections between individual points (vertices) using link lines (edges), representing networks like airlines or social groups. Minimum Spanning Tree (MST) solvers connect all nodes with the lowest possible edge cost."
        history="Leonhard Euler (pictured) laid the foundations of Graph Theory in 1736 with his analysis of the Seven Bridges of Königsberg. Joseph Kruskal and Robert Prim subsequently developed MST algorithms in the mid-1950s to optimize telecommunication line grids."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Greedy Algorithm']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/d/d7/Leonhard_Euler.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready to solve.',
    variables: {},
    state: { nodes: graph.nodes, edges: graph.edges, mstEdges: [], actionMessage: 'Ready' }
  };

  const activeNodes = currentStep.state?.nodes || graph.nodes;
  const activeEdges = currentStep.state?.edges || graph.edges;
  const mstEdges = currentStep.state?.mstEdges || [];
  const activeEdgeId = currentStep.state?.activeEdgeId;
  const visitedNodes = currentStep.state?.visitedNodes || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        {/* Controls */}
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Share2 className="text-[#1b365d]" size={18} />
            <select
              value={selectedAlgo}
              onChange={(e) => {
                setSelectedAlgo(e.target.value as any);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="kruskal">Kruskal's MST Algorithm</option>
              <option value="prim">Prim's MST Algorithm</option>
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
              {isPlaying ? 'Pause' : 'Solve MST'}
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

        {/* SVG Drawing Canvas */}
        <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden bg-[#f4f0e6] min-h-[360px] flex flex-col justify-between p-4">
          <div className="absolute top-4 left-6 flex flex-col gap-1 text-[10px] text-[#5a5a5a] pointer-events-none select-none">
            <span className="text-[#1b365d] font-extrabold uppercase">Interactive Graph Canvas</span>
            <span>• Drag nodes to reposition them</span>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#5a5a5a]"></span>
              <span>Default Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#2e5a44] h-1.5"></span>
              <span>MST Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#722f37] h-1.5"></span>
              <span>Active Check</span>
            </div>
          </div>

          {/* SVG Frame */}
          <svg
            ref={svgRef}
            className="flex-1 w-full h-full cursor-crosshair min-h-[260px]"
            onMouseMove={handleSVGMouseMove}
            onMouseUp={handleSVGMouseUp}
          >
            {/* Render Connections */}
            {activeEdges.map((e) => {
              const uNode = activeNodes.find(n => n.id === e.source);
              const vNode = activeNodes.find(n => n.id === e.target);
              if (!uNode || !vNode) return null;

              const isMst = mstEdges.includes(e.id);
              const isActive = activeEdgeId === e.id;

              let strokeColor = 'stroke-[#5a5a5a]/30';
              let strokeWidth = 'stroke-[2.5]';

              if (isActive) {
                strokeColor = 'stroke-[#722f37]';
                strokeWidth = 'stroke-[4.5]';
              } else if (isMst) {
                strokeColor = 'stroke-[#2e5a44]';
                strokeWidth = 'stroke-[4.5]';
              }

              // Compute mid points for weights
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
                  {/* Edge Weight label block */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect x="-10" y="-8" width="20" height="16" fill="#fcfaf2" stroke="#2d2d2d" strokeWidth="1" />
                    <text
                      textAnchor="middle"
                      dy="4"
                      className="fill-[#1c1c1c] font-mono text-[9px] font-bold"
                    >
                      {e.weight}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Render Nodes */}
            {activeNodes.map((n) => {
              const isVisited = selectedAlgo === 'prim' && visitedNodes.includes(n.id);
              
              let circleFill = 'fill-[#fcfaf2]';
              let strokeColor = 'stroke-[#2d2d2d]';

              if (isVisited) {
                circleFill = 'fill-[#2e5a44]/15';
                strokeColor = 'stroke-[#2e5a44]';
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
                  <circle r="15" className={`${circleFill} ${strokeColor} stroke-[2.5] hover:scale-105 transition-transform`} />
                  <text textAnchor="middle" dy="4" className="fill-[#1c1c1c] font-bold font-serif text-[10px]">
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Sub-hud */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center text-xs font-bold text-[#1b365d] flex justify-between items-center mt-2">
            <span>Status: {currentStep.state?.actionMessage || 'Ready'}</span>
            <span>MST Edges: {mstEdges.length} / {Math.max(1, activeNodes.length - 1)}</span>
          </div>
        </div>

        {/* Dynamic Graph Builder options */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#f4f0e6]">
          {/* Preset Buttons */}
          <div className="md:col-span-4 flex flex-col gap-2 border-r border-[#2d2d2d]/30 pr-4">
            <h4 className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider">Default Graph Presets</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setGraph(createPresetGraph('default'))}
                className="w-full py-2 bg-[#fcfaf2] border border-[#2d2d2d] text-xs font-bold text-[#1c1c1c] transition-all text-center"
              >
                Preset 1: Ring Cycle
              </button>
              <button
                onClick={() => setGraph(createPresetGraph('mst'))}
                className="w-full py-2 bg-[#fcfaf2] border border-[#2d2d2d] text-xs font-bold text-[#1c1c1c] transition-all text-center"
              >
                Preset 2: Multi-Branch
              </button>
              <button
                onClick={() => setGraph(createPresetGraph('disconnected'))}
                className="w-full py-2 bg-[#fcfaf2] border border-[#2d2d2d] text-xs font-bold text-[#1c1c1c] transition-all text-center"
              >
                Preset 3: Disconnected
              </button>
            </div>
          </div>

          {/* Node Adder */}
          <form onSubmit={handleAddNode} className="md:col-span-4 flex flex-col gap-2 border-r border-[#2d2d2d]/30 pr-4">
            <h4 className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider">Add Vertex</h4>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={3}
                value={nodeInputId}
                onChange={(e) => setNodeInputId(e.target.value.toUpperCase())}
                placeholder="F"
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-500 w-16 text-center font-bold"
              />
              <button
                type="submit"
                className="flex-1 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={13} /> Add Node
              </button>
            </div>
          </form>

          {/* Edge Adder */}
          <form onSubmit={handleAddEdge} className="md:col-span-4 flex flex-col gap-2">
            <h4 className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider">Link Edges</h4>
            <div className="flex gap-1">
              <select
                value={edgeSourceId}
                onChange={(e) => setEdgeSourceId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2 rounded-xl focus:outline-none w-16"
              >
                {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
              </select>
              <select
                value={edgeTargetId}
                onChange={(e) => setEdgeTargetId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2 rounded-xl focus:outline-none w-16"
              >
                {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
              </select>
              <input
                type="number"
                min="1"
                max="99"
                value={edgeWeightInput}
                onChange={(e) => setEdgeWeightInput(parseInt(e.target.value) || 1)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2 rounded-xl w-12 text-center"
              />
            </div>
            <button
              type="submit"
              className="py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all"
            >
              Add Edge Link
            </button>
          </form>
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
            pythonCode={pythonCode}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default GraphGallery;
