import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Compass, Sparkles } from 'lucide-react';
import type { AlgorithmDefinition, AlgorithmStep } from '../lib/algorithmRunner';
import { CuratorGuide } from './CuratorGuide';
import { CodeDebugger } from './CodeDebugger';
import { MuseumPlacard } from './MuseumPlacard';

interface City {
  id: string;
  x: number;
  y: number;
}

interface NpState {
  cities: City[];
  currentRoute: City[];
  bestRoute: City[];
  temperature?: number;
  currentDist?: number;
  bestDist?: number;
  actionMessage: string;
}

const annealingPseudocode = [
  { text: "procedure SimulatedAnnealing(Cities, Temp, CoolingRate)", indent: 0 },
  { text: "route := RandomRoute(Cities)", indent: 1 },
  { text: "bestRoute := route", indent: 1 },
  { text: "while Temp > 1 do", indent: 1 },
  { text: "nextRoute := SwapCities(route)", indent: 2 },
  { text: "delta := distance(nextRoute) - distance(route)", indent: 2 },
  { text: "if delta < 0 or e^(-delta / Temp) > random() then", indent: 2 },
  { text: "route := nextRoute", indent: 3 },
  { text: "if distance(route) < distance(bestRoute) then bestRoute := route", indent: 3 },
  { text: "Temp := Temp * (1 - CoolingRate)", indent: 2 },
];

const annealingPython = [
  { text: "def simulated_annealing(cities, temp, cooling_rate):", indent: 0 },
  { text: "route = random_route(cities)", indent: 1 },
  { text: "best_route = list(route)", indent: 1 },
  { text: "while temp > 1:", indent: 1 },
  { text: "next_route = swap_cities(route)", indent: 2 },
  { text: "delta = distance(next_route) - distance(route)", indent: 2 },
  { text: "if delta < 0 or math.exp(-delta / temp) > random.random():", indent: 2 },
  { text: "route = list(next_route)", indent: 3 },
  { text: "if distance(route) < distance(best_route):", indent: 3 },
  { text: "best_route = list(route)", indent: 4 },
  { text: "temp *= (1 - cooling_rate)", indent: 2 },
  { text: "return best_route", indent: 1 },
];

const npAlgoDef: AlgorithmDefinition<NpState, any> = {
  name: "Simulated Annealing TSP Solver",
  description: "The Traveling Salesman Problem (TSP) is NP-hard. Metaheuristics like Simulated Annealing find near-optimal cycles quickly by mimicking thermodynamic cooling.",
  complexity: { time: "O(Iterations)", space: "O(N)" },
  history: "The simulated annealing algorithm was independently introduced by Kirkpatrick, Gelatt, and Vecchi in 1983, and by Cerny in 1985. It draws inspiration from metallurgy annealing, where metal is cooled slowly to settle atoms into a low-energy structure.",
  funFact: "Simulated annealing accepting worse paths with decreasing probability prevents it from getting stuck in local minimum traps.",
  pseudocode: annealingPseudocode,
  run: function* () {
    yield {
      line: 1,
      explanation: "Welcome to the NP exhibit. Plot coordinates and watch Simulated Annealing optimize the Salesman's route.",
      variables: {},
      state: { cities: [], currentRoute: [], bestRoute: [], actionMessage: 'Ready' }
    };
  },
  defaultInput: null
};

const getRouteDistance = (route: City[]): number => {
  let dist = 0;
  for (let i = 0; i < route.length; i++) {
    const a = route[i];
    const b = route[(i + 1) % route.length];
    dist += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return Math.round(dist);
};

export const NpGallery: React.FC = () => {
  const [showPlacard, setShowPlacard] = useState(true);
  const [cities, setCities] = useState<City[]>([
    { id: 'A', x: 200, y: 120 },
    { id: 'B', x: 340, y: 80 },
    { id: 'C', x: 180, y: 240 },
    { id: 'D', x: 450, y: 110 },
    { id: 'E', x: 260, y: 310 },
    { id: 'F', x: 420, y: 290 },
    { id: 'G', x: 330, y: 210 },
  ]);

  // Execution states
  const [steps, setSteps] = useState<AlgorithmStep<NpState>[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(150);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const generateAnnealingSteps = () => {
    setIsPlaying(false);
    const collectedSteps: AlgorithmStep<NpState>[] = [];
    const n = cities.length;

    if (n < 3) return;

    let route = [...cities];
    let bestRoute = [...route];
    let currentDist = getRouteDistance(route);
    let bestDist = currentDist;

    let temp = 100.0;
    const coolingRate = 0.08;

    collectedSteps.push({
      line: 2,
      explanation: `Initializing simulated annealing. Generating initial random route path. Distance: ${currentDist}.`,
      variables: { temp, currentDist, bestDist },
      state: { cities, currentRoute: [...route], bestRoute: [...bestRoute], temperature: temp, currentDist, bestDist, actionMessage: 'Route Initialized' }
    });

    while (temp > 1) {
      const nextRoute = [...route];
      const i = Math.floor(Math.random() * n);
      let j = Math.floor(Math.random() * n);
      while (i === j) j = Math.floor(Math.random() * n);

      const t = nextRoute[i];
      nextRoute[i] = nextRoute[j];
      nextRoute[j] = t;

      const nextDist = getRouteDistance(nextRoute);
      const delta = nextDist - currentDist;

      let accepted = false;
      const rVal = Math.random();
      const ap = Math.exp(-delta / temp);

      if (delta < 0 || ap > rVal) {
        route = [...nextRoute];
        currentDist = nextDist;
        accepted = true;

        if (currentDist < bestDist) {
          bestRoute = [...route];
          bestDist = currentDist;
        }
      }

      collectedSteps.push({
        line: 5,
        explanation: `Swapped city ${cities[i].id} and ${cities[j].id}. Temp: ${temp.toFixed(1)}C. Delta: ${delta}. ${
          accepted
            ? `Accepted path (dist: ${currentDist}).`
            : `Rejected path (staying at dist: ${currentDist}).`
        }`,
        variables: { temp: temp.toFixed(1), currentDist, bestDist, delta },
        state: { cities, currentRoute: [...route], bestRoute: [...bestRoute], temperature: temp, currentDist, bestDist, actionMessage: accepted ? 'Path Shift Accepted' : 'Path Shift Rejected' }
      });

      temp *= (1 - coolingRate);
    }

    collectedSteps.push({
      line: 1,
      explanation: `Simulation complete! The metal temperature reached critical zero. Near-optimal cycle route found! Final distance: ${bestDist}.`,
      variables: { bestDist },
      state: { cities, currentRoute: [...bestRoute], bestRoute: [...bestRoute], temperature: 0, currentDist: bestDist, bestDist, actionMessage: 'Finished' }
    });

    setSteps(collectedSteps);
    setCurrentStepIdx(0);
  };

  useEffect(() => {
    generateAnnealingSteps();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cities]);

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
      if (!cities.some(c => c.id === char)) {
        nextId = char;
        break;
      }
    }

    const nextCities = [...cities, { id: nextId, x, y }];
    setCities(nextCities);
  };

  const handleRandomCities = () => {
    setIsPlaying(false);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextCities = Array.from({ length: 9 }, (_, idx) => ({
      id: alphabet[idx],
      x: Math.floor(Math.random() * 260) + 120,
      y: Math.floor(Math.random() * 200) + 70,
    }));
    setCities(nextCities);
  };

  const handleClear = () => {
    setIsPlaying(false);
    setCities([]);
    setSteps([]);
    setCurrentStepIdx(0);
  };

  const def = npAlgoDef;

  if (showPlacard) {
    return (
      <MuseumPlacard
        name="NP Solvers (TSP)"
        description="NP-hard problems represent computational questions (like finding the absolute shortest tour visiting a list of cities) for which no fast, perfect shortcut exists. To solve them in real-world times, we must use approximate solvers."
        history="Richard Karp (pictured) proved the Traveling Salesman Problem is NP-complete in 1972, showing that a huge family of hard computational puzzles are mathematically equivalent. In 1983, Kirkpatrick, Gelatt, and Vecchi introduced simulated annealing to find near-optimal routes using thermodynamic analogies."
        complexity={def.complexity}
        terms={['Time Complexity', 'Space Complexity', 'NP-Hard']}
        imageUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Karp_mg_7725-b.cr2.jpg/500px-Karp_mg_7725-b.cr2.jpg"
        onEnter={() => setShowPlacard(false)}
      />
    );
  }

  const currentStep = steps[currentStepIdx] || {
    line: 1,
    explanation: 'Ready.',
    variables: {},
    state: { cities, currentRoute: cities, bestRoute: cities, actionMessage: 'Ready' }
  };

  const activeCities = currentStep.state?.cities || cities;
  const currentRoute = currentStep.state?.currentRoute || [];
  const bestRoute = currentStep.state?.bestRoute || [];
  const currentDist = currentStep.state?.currentDist;
  const bestDist = currentStep.state?.bestDist;
  const temperature = currentStep.state?.temperature;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden p-1 animate-fade-in">
      {/* Visualizer Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-slate-800 bg-[#f4f0e6]">
          <div className="flex items-center gap-3">
            <Compass className="text-[#1b365d]" size={18} />
            <span className="text-sm font-bold text-[#1c1c1c]">Simulated Annealing TSP</span>
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
              {isPlaying ? 'Pause' : 'Solve TSP'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Speed</span>
            <input
              type="range"
              min="20"
              max="600"
              step="20"
              value={620 - speed}
              onChange={(e) => setSpeed(620 - parseInt(e.target.value))}
              className="w-20 accent-cyan-500 bg-slate-850 h-1 rounded-lg"
            />
          </div>
        </div>

        {/* TSP coordinate plane */}
        <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden bg-[#f4f0e6] min-h-[360px] flex flex-col justify-between p-6">
          <div className="absolute top-4 left-6 flex flex-col gap-1 text-[10px] text-[#5a5a5a] pointer-events-none select-none">
            <span className="text-[#1b365d] font-extrabold uppercase">TSP Coordinate Map</span>
            <span>• Click canvas background to place a City</span>
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a5a] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-slate-800 rounded"></span>
              <span>Normal Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#1b365d] rounded"></span>
              <span>Current Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#2e5a44] rounded"></span>
              <span>Best Route Found</span>
            </div>
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center min-h-[280px]">
            {activeCities.length === 0 ? (
              <div className="text-slate-500 text-xs italic">No cities on map. Click to place them.</div>
            ) : (
              <svg
                ref={svgRef}
                onClick={handleSVGClick}
                className="w-full h-full min-h-[300px] cursor-crosshair"
              >
                {currentRoute.length > 1 && (
                  <path
                    d={currentRoute.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ` Z`}
                    fill="none"
                    className="stroke-[#1b365d]/40 stroke-2 transition-all"
                    strokeDasharray="4,4"
                  />
                )}

                {bestRoute.length > 1 && (
                  <path
                    d={bestRoute.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ` Z`}
                    fill="none"
                    className="stroke-[#2e5a44] stroke-[2.5] stroke-linecap-round stroke-linejoin-round transition-all"
                  />
                )}

                {activeCities.map((c) => (
                  <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
                    <circle r="7" className="fill-[#fcfaf2] stroke-[#2d2d2d] stroke-[2] hover:scale-105" />
                    <text textAnchor="middle" dy="-11" className="fill-[#1c1c1c] font-mono text-[9px] font-bold">
                      {c.id}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>

          {/* Info HUD */}
          <div className="w-full bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center text-xs font-bold text-[#1b365d] flex items-center justify-between">
            <span>Temp: {temperature !== undefined ? `${temperature.toFixed(1)}C` : '0C'}</span>
            <span>Dist: {currentDist || 0} | Best: {bestDist || 0}</span>
          </div>
        </div>

        {/* Config box */}
        <div className="glass-panel rounded-2xl border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 bg-[#f4f0e6]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#1c1c1c] flex items-center gap-1.5 font-serif">
              <Sparkles size={15} className="text-[#1b365d]" />
              Configure Coordinate Set
            </h4>
            <p className="text-slate-500 text-xs">Load random city coordinate slots or clear the coordinate plane.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomCities}
              className="px-4 py-2 bg-[#1b365d]/10 border border-[#1b365d] text-[#1b365d] hover:bg-[#1b365d] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              Random Cities
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
            pythonCode={annealingPython}
            activeLine={currentStep.line}
            variables={currentStep.variables}
          />
        </div>
      </div>
    </div>
  );
};
export default NpGallery;
