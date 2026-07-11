import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Compass, Edit3, Sparkles } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

interface Point {
  id: string;
  x: number;
  y: number;
  label?: string;
  polarAngle?: number;
}

interface GeometryState {
  points: Point[];
  anchorPoint?: Point;
  hullPoints: Point[];
  activePoint?: Point;
  sweepLineAngle?: number;
  evaluatingSegments?: Point[]; // [next_to_top, top, current]
  badSegment?: boolean;
}

const grahamScanPseudocode = [
  { text: "procedure GrahamScan(Points)", indent: 0 },
  { text: "p0 := point with lowest y-coordinate", indent: 1 },
  { text: "sort remaining points by polar angle with p0", indent: 1 },
  { text: "create empty stack S", indent: 1 },
  { text: "push p0, Points[0], Points[1] to S", indent: 1 },
  { text: "for i := 2 to length(Points)-1 do", indent: 1 },
  { text: "while size(S) >= 2 and ccw(next_to_top(S), top(S), Points[i]) <= 0 do", indent: 2 },
  { text: "pop S", indent: 3 },
  { text: "push Points[i] to S", indent: 2 },
];

const grahamPython = [
  { text: "def graham_scan(points):", indent: 0 },
  { text: "p0 = min(points, key=lambda p: (p.y, p.x))", indent: 1 },
  { text: "sorted_pts = sorted(points, key=lambda p: polar_angle(p0, p))", indent: 1 },
  { text: "hull = [p0, sorted_pts[0], sorted_pts[1]]", indent: 1 },
  { text: "for p in sorted_pts[2:]:", indent: 1 },
  { text: "while len(hull) > 1 and ccw(hull[-2], hull[-1], p) <= 0:", indent: 2 },
  { text: "hull.pop()", indent: 3 },
  { text: "hull.append(p)", indent: 2 },
  { text: "return hull", indent: 1 },
];

const ccw = (p1: Point, p2: Point, p3: Point): number => {
  const val = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y);
  if (val === 0) return 0; // collinear
  return val > 0 ? -1 : 1; // clockwise or counterclockwise
};

const grahamScanRunner = function* (pointsInput: Point[]) {
  const pts = pointsInput.map(p => ({ ...p }));
  const n = pts.length;

  if (n < 3) return;

  yield {
    line: 1,
    explanation: "Computational Geometry deals with algorithms on geometric datasets. Graham Scan solves the Convex Hull problem: finding the smallest bounding envelope around all points.",
    variables: { pointsCount: n },
    state: { points: pts, hullPoints: [] }
  };

  // Find anchor point p0
  let anchorIdx = 0;
  for (let i = 1; i < n; i++) {
    if (pts[i].y > pts[anchorIdx].y || (pts[i].y === pts[anchorIdx].y && pts[i].x < pts[anchorIdx].x)) {
      anchorIdx = i;
    }
  }
  const anchor = pts[anchorIdx];

  yield {
    line: 2,
    explanation: `Found anchor point p0 at (${anchor.x}, ${anchor.y}). It has the lowest position on the canvas.`,
    variables: { anchor: anchor.id },
    state: { points: pts, anchorPoint: anchor, hullPoints: [anchor] }
  };

  // Sort remaining points by polar angle with p0
  const remaining = pts.filter((_, idx) => idx !== anchorIdx);
  remaining.forEach(p => {
    p.polarAngle = Math.atan2(-(p.y - anchor.y), p.x - anchor.x);
  });

  remaining.sort((a, b) => (b.polarAngle ?? 0) - (a.polarAngle ?? 0));

  const sortedPoints = [anchor, ...remaining];
  sortedPoints.forEach((p, idx) => {
    p.label = idx === 0 ? 'p0' : `p${idx}`;
  });

  yield {
    line: 3,
    explanation: "Sorted all remaining points counter-clockwise by polar angle relative to p0. Lines show the ordering.",
    variables: { order: sortedPoints.map(p => p.label).join(' -> ') },
    state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [] },
  };

  // Push first 3 points to hull stack
  const stack: Point[] = [sortedPoints[0], sortedPoints[1], sortedPoints[2]];

  yield {
    line: 5,
    explanation: `Pushing first three points to stack: p0 (${sortedPoints[0].id}), p1 (${sortedPoints[1].id}), and p2 (${sortedPoints[2].id}).`,
    variables: { stack: stack.map(p => p.label).join(', ') },
    state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [...stack] }
  };

  for (let i = 3; i < n; i++) {
    const pt = sortedPoints[i];

    yield {
      line: 6,
      explanation: `Inspecting point p${i} (${pt.id}). We check the cross product to see if we make a left turn (ccw).`,
      variables: { i, point: pt.id, stack: stack.map(p => p.label).join(', ') },
      state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [...stack], activePoint: pt }
    };

    while (stack.length >= 2) {
      const top = stack[stack.length - 1];
      const nextToTop = stack[stack.length - 2];
      const turn = ccw(nextToTop, top, pt);

      yield {
        line: 7,
        explanation: `Checking turn direction for segment ${nextToTop.label} -> ${top.label} -> ${pt.label}. Turn value: ${turn} (${turn > 0 ? 'counter-clockwise' : 'clockwise'}).`,
        variables: { top: top.label, nextToTop: nextToTop.label, turn },
        state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [...stack], activePoint: pt, evaluatingSegments: [nextToTop, top, pt], badSegment: turn <= 0 }
      };

      if (turn <= 0) {
        stack.pop();
        yield {
          line: 8,
          explanation: `Since the turn is clockwise or collinear (non-left turn), we discard the middle point ${top.label} from the hull.`,
          variables: { discarded: top.label, newStack: stack.map(p => p.label).join(', ') },
          state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [...stack], activePoint: pt }
        };
      } else {
        break;
      }
    }

    stack.push(pt);
    yield {
      line: 9,
      explanation: `Valid left turn confirmed! We push ${pt.label} (${pt.id}) to the hull stack.`,
      variables: { stack: stack.map(p => p.label).join(', ') },
      state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [...stack] }
    };
  }

  yield {
    line: 1,
    explanation: `Graham Scan completed. The points forming the convex hull perimeter are: ${stack.map(p => p.id).join(', ')}.`,
    variables: { hullSize: stack.length },
    state: { points: sortedPoints, anchorPoint: anchor, hullPoints: [...stack] }
  };
};

const geometryAlgoDef: AlgorithmDefinition<GeometryState, Point[]> = {
  name: "Graham Scan Convex Hull",
  description: "Graham Scan is a method of computing the convex hull of a finite set of points in the 2D plane with time complexity O(N log N). It uses a polar-angle sort and a stack-based backtracking sweep.",
  complexity: { time: "O(N log N)", space: "O(N)" },
  history: "Conceived by Ronald Graham in 1972 and published in Information Processing Letters. It is one of the earliest algorithms in computational geometry, establishing the core concept of orientational turns (cross product) to evaluate convex perimeters.",
  funFact: "Convex hulls have practical applications in collision detection for video games, GIS map boundary clustering, and pattern recognition.",
  pseudocode: grahamScanPseudocode,
  run: grahamScanRunner,
  defaultInput: [
    { id: 'A', x: 200, y: 150 },
    { id: 'B', x: 300, y: 100 },
    { id: 'C', x: 450, y: 150 },
    { id: 'D', x: 380, y: 250 },
    { id: 'E', x: 220, y: 250 },
    { id: 'F', x: 310, y: 180 },
    { id: 'G', x: 280, y: 200 },
  ]
};

export const GeometryGallery: React.FC = () => {
  const [showPlacard, setShowPlacard] = useState(true);
  const [points, setPoints] = useState<Point[]>([
    { id: 'A', x: 200, y: 150 },
    { id: 'B', x: 320, y: 100 },
    { id: 'C', x: 450, y: 150 },
    { id: 'D', x: 380, y: 270 },
    { id: 'E', x: 220, y: 270 },
    { id: 'F', x: 310, y: 190 },
    { id: 'G', x: 260, y: 170 },
  ]);

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<GeometryState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const initAlgorithm = (inputPoints?: Point[]) => {
    setIsPlaying(false);
    const targetPoints = inputPoints || points;
    const generator = grahamScanRunner(targetPoints);
    const collectedSteps: AlgorithmStep<GeometryState>[] = [];

    let res = generator.next();
    while (!res.done) {
      if (res.value) collectedSteps.push(res.value);
      res = generator.next();
    }

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    initAlgorithm();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [points]);

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

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const target = e.target as SVGElement;
    if (target.tagName !== 'svg') return;

    setIsPlaying(false);
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nextId = 'A';
    for (let char of alphabet) {
      if (!points.some(p => p.id === char)) {
        nextId = char;
        break;
      }
    }

    const nextPoints = [...points, { id: nextId, x, y }];
    setPoints(nextPoints);
  };

  const handleRandomize = () => {
    setIsPlaying(false);
    const size = 8;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomPts = Array.from({ length: size }, (_, idx) => ({
      id: alphabet[idx],
      x: Math.floor(Math.random() * 260) + 120,
      y: Math.floor(Math.random() * 180) + 90,
    }));
    setPoints(randomPts);
  };

  const handleClear = () => {
    setIsPlaying(false);
    setPoints([]);
    setSteps([]);
    setCurrentStepIdx(0);
  };

  const def = geometryAlgoDef;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="Geometry Arena"
        description="Computational geometry studies algorithms for solving geometric problems involving points, lines, and polygons. Calculating the Convex Hull finds the outer boundary envelope enclosing a scatter of coordinates."
        history="Ronald Graham (pictured) developed Graham's scan in 1972 at Bell Labs. It was one of the earliest algorithms in computational geometry, helping determine bounds for layout calculations and scheduling perimeters."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'Convex Hull']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ronald_graham_writing.jpg/500px-Ronald_graham_writing.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready to scan.',
    variables: {},
    state: { points, hullPoints: [] }
  };

  const activePoints = currentStep.state?.points || points;
  const anchorPoint = currentStep.state?.anchorPoint;
  const hullPoints = currentStep.state?.hullPoints || [];
  const activePoint = currentStep.state?.activePoint;
  const evaluatingSegments = currentStep.state?.evaluatingSegments || [];
  const badSegment = currentStep.state?.badSegment || false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Compass className="text-[#1b365d]" size={18} />
            <span className="text-sm font-bold text-[#1c1c1c]">Graham Scan Convex Hull</span>
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
              {isPlaying ? 'Pause' : 'Solve Convex Hull'}
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

        {/* Geometry Canvas */}
        <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden bg-[#f4f0e6] min-h-[360px] flex flex-col justify-between p-4">
          <div className="absolute top-4 left-6 flex flex-col gap-1 text-[10px] text-[#5a5a5a] pointer-events-none select-none">
            <span className="text-[#1b365d] font-extrabold uppercase">Convex Hull Map</span>
            <span>• Click canvas background to place new points</span>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-[#1b365d] rounded-full"></span>
              <span>Anchor (p0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#2e5a44] h-1.5"></span>
              <span>Hull Boundary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#722f37] h-1.5"></span>
              <span>Evaluating turn</span>
            </div>
          </div>

          {/* Canvas SVG */}
          <div className="flex-1 w-full h-full flex items-center justify-center min-h-[260px]">
            {activePoints.length === 0 ? (
              <div className="text-slate-500 text-xs italic">No coordinates plotted. Click canvas to place points.</div>
            ) : (
              <svg
                ref={svgRef}
                onClick={handleSVGClick}
                className="w-full h-full cursor-crosshair min-h-[280px]"
              >
                {/* Draw sorted sweep lines from p0 */}
                {anchorPoint && activePoints.length > 1 && (
                  activePoints.map((p) => {
                    if (p.id === anchorPoint.id) return null;
                    return (
                      <line
                        key={`radial-${p.id}`}
                        x1={anchorPoint.x}
                        y1={anchorPoint.y}
                        x2={p.x}
                        y2={p.y}
                        className="stroke-[#5a5a5a]/10 stroke-[1.5]"
                        strokeDasharray="2,2"
                      />
                    );
                  })
                )}

                {/* Draw evaluating turn segments */}
                {evaluatingSegments.length === 3 && (
                  <path
                    d={`M ${evaluatingSegments[0].x} ${evaluatingSegments[0].y} L ${evaluatingSegments[1].x} ${evaluatingSegments[1].y} L ${evaluatingSegments[2].x} ${evaluatingSegments[2].y}`}
                    fill="none"
                    className={`${badSegment ? 'stroke-[#722f37]' : 'stroke-[#2e5a44]'} stroke-[3.5] stroke-dasharray-[3,3]`}
                    strokeDasharray="4,4"
                  />
                )}

                {/* Draw Convex Hull boundary lines */}
                {hullPoints.length > 1 && (
                  <path
                    d={hullPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + (currentStep.explanation.includes('completed') ? ' Z' : '')}
                    fill="none"
                    className="stroke-[#2e5a44] stroke-[3] stroke-linecap-round stroke-linejoin-round"
                  />
                )}

                {/* Draw Points */}
                {activePoints.map((p) => {
                  const isAnchor = anchorPoint?.id === p.id;
                  const inHull = hullPoints.some(hp => hp.id === p.id);
                  const isActive = activePoint?.id === p.id;

                  let nodeFill = 'fill-[#fcfaf2]';
                  let nodeStroke = 'stroke-[#2d2d2d]';
                  let nodeRadius = '6';

                  if (isAnchor) {
                    nodeFill = 'fill-[#1b365d]';
                    nodeStroke = 'stroke-[#1b365d]';
                    nodeRadius = '8';
                  } else if (isActive) {
                    nodeFill = 'fill-[#722f37]';
                    nodeStroke = 'stroke-[#722f37]';
                  } else if (inHull) {
                    nodeFill = 'fill-[#2e5a44]';
                    nodeStroke = 'stroke-[#2e5a44]';
                  }

                  return (
                    <g key={p.id}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={nodeRadius}
                        className={`${nodeFill} ${nodeStroke} stroke-[2] transition-all`}
                      />
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        className="fill-[#1c1c1c] font-mono text-[9px] font-bold select-none"
                      >
                        {p.label || p.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Sub-hud */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center mt-2 text-xs font-bold text-[#1b365d] flex justify-between items-center">
            <span>Points plotted: {activePoints.length}</span>
            <span>Hull vertices: {hullPoints.length}</span>
          </div>
        </div>

        {/* Config controls */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <Edit3 size={15} className="text-[#1b365d]" />
              Configure Coordinate Set
            </h4>
            <p className="text-slate-500 text-xs">Generate random coordinates or clear the coordinate plane to plot custom geometries.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 hover:bg-indigo-500/25 hover:text-indigo-850 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              Random Points
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-transparent hover:border-[#a13d2d]/25 text-[#5a5a5a] hover:text-[#a13d2d] text-xs font-bold transition-all"
            >
              Clear Map
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
            pythonCode={grahamPython}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default GeometryGallery;
