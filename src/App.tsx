import React, { useState } from 'react';
import {
  Landmark,
  Sliders,
  Grid,
  Share2,
  Table,
  Compass,
  BookOpen,
  ArrowRight,
  GitBranch,
  Hash,
  Edit3,
  Activity,
  Swords,
  Award
} from 'lucide-react';
import SortingGallery from './components/SortingGallery';
import PathfindingGallery from './components/PathfindingGallery';
import GraphGallery from './components/GraphGallery';
import DynamicProgrammingGallery from './components/DynamicProgrammingGallery';
import GeometryGallery from './components/GeometryGallery';
import TreeGallery from './components/TreeGallery';
import HashGallery from './components/HashGallery';
import StringGallery from './components/StringGallery';
import FlowGallery from './components/FlowGallery';
import NpGallery from './components/NpGallery';
import RaceGallery from './components/RaceGallery';
import ChallengeGallery from './components/ChallengeGallery';
import OverviewGallery from './components/OverviewGallery';

type ExhibitId = 
  | 'lobby'
  | 'overview'
  | 'sorting' 
  | 'pathfinding' 
  | 'graphs' 
  | 'dp' 
  | 'geometry' 
  | 'trees' 
  | 'hashes' 
  | 'strings' 
  | 'flow' 
  | 'np'
  | 'race'
  | 'challenge';

export const App: React.FC = () => {
  const [activeExhibit, setActiveExhibit] = useState<ExhibitId>('lobby');

  const renderExhibit = () => {
    switch (activeExhibit) {
      case 'sorting':
        return <SortingGallery />;
      case 'pathfinding':
        return <PathfindingGallery />;
      case 'graphs':
        return <GraphGallery />;
      case 'dp':
        return <DynamicProgrammingGallery />;
      case 'geometry':
        return <GeometryGallery />;
      case 'trees':
        return <TreeGallery />;
      case 'hashes':
        return <HashGallery />;
      case 'strings':
        return <StringGallery />;
      case 'flow':
        return <FlowGallery />;
      case 'np':
        return <NpGallery />;
      case 'race':
        return <RaceGallery />;
      case 'challenge':
        return <ChallengeGallery />;
      case 'overview':
        return <OverviewGallery />;
      default:
        return renderLobby();
    }
  };

  const renderLobby = () => {
    const exhibits = [
      {
        id: 'sorting' as ExhibitId,
        title: 'The Sorting Hall',
        description: 'Explore comparison-based order sorting. Compare Bubble, Quick, and Merge Sort operations on array datasets.',
        icon: <Sliders className="text-[#1b365d]" size={26} />,
        complexity: 'O(N log N) to O(N²)',
      },
      {
        id: 'pathfinding' as ExhibitId,
        title: 'Pathfinding & Grids',
        description: 'Watch path searchers find the shortest path across custom obstacles and weighted mud terrains.',
        icon: <Grid className="text-[#1b365d]" size={26} />,
        complexity: 'O(V + E) to O(E log V)',
      },
      {
        id: 'graphs' as ExhibitId,
        title: 'Graph Landscapes',
        description: 'Construct node-link diagrams. Solver algorithms calculate Minimum Spanning Trees (MSTs) step-by-step.',
        icon: <Share2 className="text-[#1b365d]" size={26} />,
        complexity: 'O(E log V) / O(E log E)',
      },
      {
        id: 'dp' as ExhibitId,
        title: 'The Dynamic Programming Vault',
        description: 'Observe values computed dynamically. Follow how the Knapsack and LCS solvers link sub-problems.',
        icon: <Table className="text-[#1b365d]" size={26} />,
        complexity: 'O(N * W) / O(M * N)',
      },
      {
        id: 'geometry' as ExhibitId,
        title: 'Geometry Arena',
        description: 'Plot vertices on a 2D plane and watch Graham Scan compute the Convex Hull perimeter sweep.',
        icon: <Compass className="text-[#1b365d]" size={26} />,
        complexity: 'O(N log N)',
      },
      {
        id: 'trees' as ExhibitId,
        title: 'Tree Structures',
        description: 'Watch BST and AVL self-balancing trees perform Single and Double rotations to rebalance nodes.',
        icon: <GitBranch className="text-[#1b365d]" size={26} />,
        complexity: 'O(log N)',
      },
      {
        id: 'hashes' as ExhibitId,
        title: 'Bucket Hashing',
        description: 'Observe how keys map to indexes. Compare Separate Chaining and Open Address linear probing.',
        icon: <Hash className="text-[#1b365d]" size={26} />,
        complexity: 'O(1) average',
      },
      {
        id: 'strings' as ExhibitId,
        title: 'String Matchers',
        description: 'Find character sequences. KMP skips redundant checks while Rabin-Karp rolls modular hashes.',
        icon: <Edit3 className="text-[#1b365d]" size={26} />,
        complexity: 'O(N + M)',
      },
      {
        id: 'flow' as ExhibitId,
        title: 'Network Flows',
        description: 'Solve the Max-Flow problem. Watch Ford-Fulkerson augment paths and adjust residual capacities.',
        icon: <Activity className="text-[#1b365d]" size={26} />,
        complexity: 'O(E * MaxFlow)',
      },
      {
        id: 'np' as ExhibitId,
        title: 'NP Solvers (TSP)',
        description: 'Witness thermodynamic optimization. Simulated Annealing solves Traveling Salesman paths.',
        icon: <Compass className="text-[#1b365d]" size={26} />,
        complexity: 'O(Iterations)',
      }
    ];

    return (
      <div className="space-y-10 max-w-6xl mx-auto py-6 px-4 md:px-8 animate-fade-in overflow-y-auto max-h-[85vh] text-[#1c1c1c]">
        {/* Museum Welcome Hero */}
        <div className="glass-panel-neon p-8 md:p-10 border-[#2d2d2d] bg-[#f4f0e6] w-full">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-serif font-black text-[#1c1c1c] tracking-tight leading-tight">
              The Grand Algorithm <br />
              <span className="text-[#1b365d] italic">Museum</span>
            </h1>

            {/* Special Mode CTA Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActiveExhibit('race')}
                className="px-4 py-2.5 bg-[#722f37] hover:bg-[#5f252c] text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#2d2d2d]"
              >
                <Swords size={14} />
                Enter Race Track
              </button>
              <button
                onClick={() => setActiveExhibit('challenge')}
                className="px-4 py-2.5 bg-[#1b365d] hover:bg-[#152a4a] text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#2d2d2d]"
              >
                <Award size={14} />
                Challenge Rooms
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#1c1c1c] flex items-center gap-2 font-serif">
            <BookOpen size={18} className="text-[#1b365d]" />
            Select an Exhibit Gallery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exhibits.map((ex) => (
              <div
                key={ex.id}
                onClick={() => setActiveExhibit(ex.id)}
                className="group glass-panel p-6 border-[#2d2d2d]/85 hover:border-[#1b365d] transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-[#f4f0e6]"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 border border-[#2d2d2d] bg-[#fcfaf2] flex items-center justify-center">
                    {ex.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-serif font-bold text-[#1c1c1c] group-hover:text-[#1b365d] transition-colors">
                      {ex.title}
                    </h3>
                    <p className="text-[#5a5a5a] text-xs leading-relaxed">
                      {ex.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2d2d2d]/30 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-[#5a5a5a] uppercase">Complexity: {ex.complexity}</span>
                  <span className="text-[#1b365d] flex items-center gap-1 transition-colors">
                    Enter Room
                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-[#fcfaf2] text-[#1c1c1c] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#f4f0e6] border-r border-[#2d2d2d]/80 flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div className="p-6 space-y-8 overflow-y-auto max-h-full">
          <div className="pt-2" />

          {/* Menu Links */}
          <nav className="space-y-1">
            <div className="text-[9px] uppercase font-bold text-[#5a5a5a] tracking-wider mb-2 px-3 font-sans">Rooms</div>
            <button
              onClick={() => setActiveExhibit('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all border ${
                activeExhibit === 'overview'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <BookOpen size={14} />
              What is an Algorithm?
            </button>
            <button
              onClick={() => setActiveExhibit('lobby')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all border ${
                activeExhibit === 'lobby'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Landmark size={14} />
              Museum Lobby
            </button>
            <button
              onClick={() => setActiveExhibit('race')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all border ${
                activeExhibit === 'race'
                  ? 'bg-[#722f37]/10 border-[#722f37] text-[#722f37]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Swords size={14} />
              Race Track
            </button>
            <button
              onClick={() => setActiveExhibit('challenge')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-all border ${
                activeExhibit === 'challenge'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Award size={14} />
              Challenge Rooms
            </button>

            <div className="text-[9px] uppercase font-bold text-[#5a5a5a] tracking-wider pt-4 pb-2 px-3 font-sans">Galleries</div>
            <button
              onClick={() => setActiveExhibit('sorting')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'sorting'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Sliders size={13} />
              Sorting Hall
            </button>
            <button
              onClick={() => setActiveExhibit('pathfinding')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'pathfinding'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Grid size={13} />
              Pathfinding & Grids
            </button>
            <button
              onClick={() => setActiveExhibit('graphs')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'graphs'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Share2 size={13} />
              Graph Landscapes
            </button>
            <button
              onClick={() => setActiveExhibit('dp')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'dp'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Table size={13} />
              DP Vault
            </button>
            <button
              onClick={() => setActiveExhibit('geometry')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'geometry'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Compass size={13} />
              Geometry Arena
            </button>
            <button
              onClick={() => setActiveExhibit('trees')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'trees'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <GitBranch size={13} />
              Tree Structures
            </button>
            <button
              onClick={() => setActiveExhibit('hashes')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'hashes'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Hash size={13} />
              Bucket Hashing
            </button>
            <button
              onClick={() => setActiveExhibit('strings')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'strings'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Edit3 size={13} />
              String Matchers
            </button>
            <button
              onClick={() => setActiveExhibit('flow')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'flow'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Activity size={13} />
              Network Flows
            </button>
            <button
              onClick={() => setActiveExhibit('np')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold transition-all border ${
                activeExhibit === 'np'
                  ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
                  : 'border-transparent text-[#5a5a5a] hover:text-[#1c1c1c]'
              }`}
            >
              <Compass size={13} />
              NP Solvers (TSP)
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Exhibition Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fcfaf2]">
        {/* Mobile Header Bar */}
        <header className="h-14 px-6 bg-[#f4f0e6] border-b border-[#2d2d2d]/80 flex items-center justify-between md:hidden flex-shrink-0">
          <div
            onClick={() => setActiveExhibit('lobby')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Landmark size={16} className="text-[#1b365d]" />
            <span className="text-xs font-serif font-black text-[#1c1c1c] tracking-widest uppercase">MUSEUM</span>
          </div>

          <div className="flex gap-2">
            <select
              value={activeExhibit}
              onChange={(e) => setActiveExhibit(e.target.value as ExhibitId)}
              className="bg-[#fcfaf2] border border-[#2d2d2d] text-[#1c1c1c] text-xs font-bold py-1.5 px-2"
            >
              <option value="lobby">Lobby</option>
              <option value="overview">What is an Algorithm?</option>
              <option value="race">Race Track</option>
              <option value="challenge">Challenges</option>
              <option value="sorting">Sorting</option>
              <option value="pathfinding">Pathfinding</option>
              <option value="graphs">Graphs</option>
              <option value="dp">DP Vault</option>
              <option value="geometry">Geometry</option>
              <option value="trees">Trees</option>
              <option value="hashes">Hashes</option>
              <option value="strings">Strings</option>
              <option value="flow">Flows</option>
              <option value="np">NP (TSP)</option>
            </select>
          </div>
        </header>

        {/* Active Content view */}
        <div className="flex-1 p-4 md:p-8 overflow-hidden min-h-0">
          {renderExhibit()}
        </div>
      </main>
    </div>
  );
};

export default App;
