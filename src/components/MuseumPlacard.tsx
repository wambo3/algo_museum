import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface TermDefinition {
  term: string;
  definition: string;
  analogy: string;
  whyNeeded: string;
  application: string;
}

const glossaryDatabase: Record<string, TermDefinition> = {
  'Time Complexity': {
    term: 'Time Complexity',
    definition: 'A mathematical measure of how much longer an algorithm takes to run as the dataset grows.',
    analogy: 'Cleaning a house: If it scales linearly, doubling the house size doubles the clean time. If it scales quadratically, doubling the size quadruples the clean time.',
    whyNeeded: 'To predict if your program will freeze or crash on huge real-world datasets before deploying it.',
    application: 'Used by search engines (like Google) to guarantee instant results even when scanning billions of web pages.'
  },
  'Space Complexity': {
    term: 'Space Complexity',
    definition: 'A measure of how much auxiliary memory (RAM) the algorithm needs while running.',
    analogy: 'Scratchpad paper: The number of extra pages you need to write on to solve a complex math problem.',
    whyNeeded: 'To prevent programs from running out of memory and crashing on smaller devices.',
    application: 'Crucial for software in smartwatches and medical pacemakers.'
  },
  'Lomuto Partition': {
    term: 'Lomuto Partitioning',
    definition: 'A method of splitting an array around a reference benchmark value called the pivot.',
    analogy: 'Sorting cards: Picking the last card in your hand, then putting all smaller cards to its left and larger cards to its right.',
    whyNeeded: 'Dividing a huge problem into smaller, simpler chunks makes sorting extremely fast.',
    application: 'Powers the default sorting libraries inside databases and spreadsheet apps.'
  },
  'Heuristic': {
    term: 'Heuristic',
    definition: 'An educated shortcut guess to find a good-enough solution quickly.',
    analogy: 'GPS travel: Flying in the general direction of a city landmark instead of exploring every single side street.',
    whyNeeded: 'Saves time by letting computers ignore millions of useless possibilities.',
    application: 'Used in video game enemy AI paths and satellite map routing (Google Maps).'
  },
  'Memoization': {
    term: 'Memoization',
    definition: 'Writing down answers to sub-calculations so you never have to compute them twice.',
    analogy: 'Stash-pad math: Storing the answer to "123 x 456" on a post-it note instead of re-multiplying it every time.',
    whyNeeded: 'Speeds up repetitive computer tasks up to 1000x by trading a tiny amount of memory.',
    application: 'Used by web browsers to cache loaded pages, and financial spreadsheets.'
  },
  'Greedy Algorithm': {
    term: 'Greedy Algorithm',
    definition: 'An approach that always makes the short-sighted, best local choice at each step.',
    analogy: 'Coin change: Making change by always giving the largest coin possible first (quarters, then dimes, then nickels).',
    whyNeeded: 'It is incredibly simple to write and executes almost instantly.',
    application: 'Used in data compression programs (like zip files) and router bandwidth allocation.'
  },
  'NP-Hard': {
    term: 'NP-Hard',
    definition: 'A class of mathematical problems that are too complex to solve perfectly in a reasonable time.',
    analogy: 'Packing a trunk: Checking every single combination of boxes to fit them perfectly could take a supercomputer billions of years.',
    whyNeeded: 'Forces programmers to stop looking for a perfect answer and use a fast approximation instead.',
    application: 'Used in package delivery routes (UPS), airline scheduling, and cryptography.'
  },
  'Rolling Hash': {
    term: 'Rolling Hash',
    definition: 'A hash function that allows a window search to update its substring hash in O(1) time by adding the new character and removing the old one.',
    analogy: 'Magnifying glass: Sliding a glass over text and only evaluating the single new character coming in and the old one dropping out.',
    whyNeeded: 'Allows lightning-fast text scanning without re-reading duplicate words.',
    application: 'Used in plagiarism detectors, Ctrl+F word searches, and spam email filters.'
  },
  'Convex Hull': {
    term: 'Convex Hull',
    definition: 'The smallest boundary enclosing a set of 2D coordinates.',
    analogy: 'Rubber band: Hammering nails into a board and stretching a rubber band around the outermost nails.',
    whyNeeded: 'Allows systems to define boundaries and outer limits of scattered coordinates.',
    application: 'Used to calculate urban city borders on maps and hand gesture detection in computer vision.'
  },
  'Self-Balancing': {
    term: 'Self-Balancing',
    definition: 'The capacity of a data tree to automatically restructure itself to keep search routes short.',
    analogy: 'Baby mobile: Adjusting elements on a hanging crib mobile so it doesn\'t tilt too far to one side.',
    whyNeeded: 'Keeps database lookups fast, preventing slow-downs as records grow.',
    application: 'Used in database indices (SQL, MongoDB) for instant record retrieval.'
  },
  'Open Addressing': {
    term: 'Open Addressing',
    definition: 'A hash collision resolution strategy that stores values directly in alternative slots.',
    analogy: 'Parking lot: If your assigned space is taken, you park in the very next open spot down the row.',
    whyNeeded: 'Resolves slot conflicts without allocating extra helper memory blocks.',
    application: 'Used inside hardware registers and lookup caches.'
  },
  'Augment Path': {
    term: 'Augment Path',
    definition: 'A path through a capacity network that has available pipeline bandwidth.',
    analogy: 'Water pipes: Finding a route of pipes from a reservoir to a town that has room to carry more gallons.',
    whyNeeded: 'Ensures networks achieve the highest possible throughput.',
    application: 'Used in oil transport lines and internet packet routers.'
  }
};

interface MuseumPlacardProps {
  name: string;
  description: string;
  history: string;
  complexity: { time: string; space: string };
  terms: string[];
  onEnter: () => void;
  imageUrl?: string;
}

export const MuseumPlacard: React.FC<MuseumPlacardProps> = ({
  name,
  description,
  history,
  complexity,
  terms,
  onEnter,
  imageUrl
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  return (
    <div className="glass-panel p-8 max-w-3xl mx-auto space-y-6 animate-fade-in my-8 border bg-[#f4f0e6] border-[#2d2d2d] text-[#1c1c1c]">
      {/* Placard Title */}
      <div className="border-b border-[#2d2d2d] pb-3 text-center md:text-left">
        <h2 className="text-2xl font-serif font-black text-[#1c1c1c] leading-tight">
          {name}
        </h2>
      </div>

      {/* Main Placard Columns (Image & Content) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {imageUrl && (
          <div className="w-full md:w-1/3 flex-shrink-0 border border-[#2d2d2d] bg-[#fcfaf2] p-1.5 shadow-sm">
            <img src={imageUrl} alt={name} className="w-full h-auto object-contain select-none" />
            <div className="text-[8px] text-[#5a5a5a] text-center mt-1 font-mono uppercase tracking-wider">Historical Plate Exhibit</div>
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-[#1c1c1c] uppercase tracking-wider">Gallery Description</h4>
            <p className="text-xs text-[#5a5a5a] leading-relaxed">
              {description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-[#fcfaf2] border border-[#2d2d2d] p-3">
            <div>
              Time Complexity: <strong className="text-[#1b365d]">{complexity.time}</strong>
            </div>
            <div>
              Space Complexity: <strong className="text-[#722f37]">{complexity.space}</strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-[#1c1c1c] uppercase tracking-wider">Historical Context</h4>
            <p className="text-xs text-[#5a5a5a] leading-normal">
              {history}
            </p>
          </div>
        </div>
      </div>

      {/* Click-to-explain Glossary Terms */}
      {terms.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-[#2d2d2d]/20">
          <h4 className="text-[10px] font-bold text-[#1c1c1c] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={12} className="text-[#1b365d]" />
            <span>Explanatory Terms (Click to expand analogies)</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {terms.map(tKey => {
              const def = glossaryDatabase[tKey];
              if (!def) return null;
              const isSelected = selectedTerm === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => setSelectedTerm(isSelected ? null : tKey)}
                  className={`px-3 py-1 text-xs font-mono border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1b365d] text-white border-[#1b365d]'
                      : 'bg-[#fcfaf2] text-[#5a5a5a] border-[#2d2d2d] hover:bg-[#f4f0e6]'
                  }`}
                >
                  {def.term}
                </button>
              );
            })}
          </div>

          {selectedTerm && glossaryDatabase[selectedTerm] && (
            <div className="bg-[#fcfaf2] p-4 border border-[#2d2d2d] text-xs text-[#1c1c1c] space-y-2 animate-fade-in font-serif">
              <div>
                <strong>Definition:</strong> {glossaryDatabase[selectedTerm].definition}
              </div>
              <div>
                <strong>Analogy / Example:</strong> {glossaryDatabase[selectedTerm].analogy}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[#2d2d2d]/10 text-[11px] font-sans text-[#5a5a5a]">
                <div>
                  <strong className="text-[#1c1c1c] block">Why we need it:</strong>
                  {glossaryDatabase[selectedTerm].whyNeeded}
                </div>
                <div>
                  <strong className="text-[#1c1c1c] block">Popular applications:</strong>
                  {glossaryDatabase[selectedTerm].application}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enter Button */}
      <button
        onClick={onEnter}
        className="w-full py-3 bg-[#1b365d] hover:bg-[#152a4a] text-white font-bold text-xs transition-colors border-none cursor-pointer mt-4"
      >
        Enter Interactive Demo
      </button>
    </div>
  );
};
export default MuseumPlacard;
