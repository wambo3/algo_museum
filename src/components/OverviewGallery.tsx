import { Landmark, Compass, Award, Cpu } from 'lucide-react';

export const OverviewGallery: React.FC = () => {
  return (
    <div className="space-y-8 py-6 animate-fade-in text-[#1c1c1c] font-serif">
      {/* Exhibit Heading */}
      <div className="border-b border-[#2d2d2d] pb-4 space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-[#1b365d]/10 border border-[#1b365d]/25 px-3 py-1 text-xs font-bold text-[#1b365d] font-sans">
          <Landmark size={12} />
          <span>Exhibition Introduction</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#1c1c1c] tracking-tight">
          What is an Algorithm?
        </h1>
        <p className="text-xs text-[#5a5a5a] font-sans">
          A historical overview of systemic reasoning, computation, and step-by-step logic.
        </p>
      </div>

      {/* Main Narrative Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-[#5a5a5a] font-sans">
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-[#1c1c1c] flex items-center gap-2 border-b border-[#2d2d2d]/25 pb-1">
            <Compass size={14} className="text-[#1b365d]" />
            1. The Recipe Analogy
          </h3>
          <p>
            At its simplest, an <strong>algorithm</strong> is a precise set of instructions to solve a problem or complete a task. 
            Think of it as a recipe: you start with raw ingredients (<strong>input</strong>), follow a strict sequence of mixing and baking steps (<strong>process</strong>), and end up with a cake (<strong>output</strong>).
          </p>
          <p>
            If a recipe says "stir until smooth," that is too vague for a computer. An algorithm must be <strong>unambiguous</strong>. 
            It needs to specify exactly how many times to stir, or what condition marks the end of the step.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-[#1c1c1c] flex items-center gap-2 border-b border-[#2d2d2d]/25 pb-1">
            <Cpu size={14} className="text-[#1b365d]" />
            2. Why Do We Need Them?
          </h3>
          <p>
            Computers are incredibly fast, but they are also completely literal. Without an algorithm, a computer is just an expensive box of silicon. 
            Algorithms tell the machine how to search, how to sort, how to encrypt data, and how to find routes.
          </p>
          <p>
            Moreover, algorithms help us find <strong>efficient</strong> solutions. Instead of guessing every possible combination (which could take millions of years), 
            algorithms like <em>Quick Sort</em> or <em>Dijkstra's Pathfinding</em> use clever mathematical shortcuts to solve problems in milliseconds.
          </p>
        </div>
      </div>

      {/* Historical Origin Box */}
      <div className="glass-panel p-6 border-[#2d2d2d] bg-[#f4f0e6] space-y-3 font-sans text-xs">
        <h4 className="text-sm font-serif font-bold text-[#1c1c1c] flex items-center gap-2">
          <Award size={15} className="text-[#722f37]" />
          Historical Origin: Al-Khwarizmi
        </h4>
        <p className="text-[#5a5a5a] leading-relaxed">
          The word <strong>algorithm</strong> originates from the latinization of the name of the Persian mathematician <strong>Muhammad ibn Musa al-Khwarizmi</strong>, 
          who lived in the 9th century in Baghdad. He wrote a landmark treatise explaining how to solve linear and quadratic equations systematically. 
          His methods popularized the decimal positional number system in Europe, laying the foundations for modern algebra and step-by-step mathematical reasoning.
        </p>
      </div>

      {/* The Pillars of Algorithms Table */}
      <div className="space-y-3 font-sans">
        <h3 className="text-sm font-serif font-bold text-[#1c1c1c] border-b border-[#2d2d2d]/25 pb-1">
          The Core Pillars of Computational Logic
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-[#2d2d2d]">
            <thead>
              <tr className="bg-[#f4f0e6] border-b border-[#2d2d2d]">
                <th className="p-3 border-r border-[#2d2d2d]">Category</th>
                <th className="p-3 border-r border-[#2d2d2d]">Simple Purpose</th>
                <th className="p-3">Real World Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#2d2d2d]/30">
                <td className="p-3 border-r border-[#2d2d2d]/30 font-bold text-[#1c1c1c]">Sorting</td>
                <td className="p-3 border-r border-[#2d2d2d]/30">Arranging data into order (alphabetical, numerical)</td>
                <td className="p-3">Sorting products by price from lowest to highest on Amazon.</td>
              </tr>
              <tr className="border-b border-[#2d2d2d]/30">
                <td className="p-3 border-r border-[#2d2d2d]/30 font-bold text-[#1c1c1c]">Pathfinding</td>
                <td className="p-3 border-r border-[#2d2d2d]/30">Finding the shortest path between locations</td>
                <td className="p-3">Calculating GPS driving directions on Google Maps.</td>
              </tr>
              <tr className="border-b border-[#2d2d2d]/30">
                <td className="p-3 border-r border-[#2d2d2d]/30 font-bold text-[#1c1c1c]">Dynamic Programming</td>
                <td className="p-3 border-r border-[#2d2d2d]/30">Breaking complex tasks down to reuse past answers</td>
                <td className="p-3">Financial systems calculating currency conversion trade chains.</td>
              </tr>
              <tr>
                <td className="p-3 border-r border-[#2d2d2d]/30 font-bold text-[#1c1c1c]">Hashing</td>
                <td className="p-3 border-r border-[#2d2d2d]/30">Direct mapping of values to indexes for instant search</td>
                <td className="p-3">Logging in securely by verifying matching password signatures.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default OverviewGallery;
