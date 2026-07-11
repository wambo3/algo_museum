import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Landmark, Award, Lightbulb } from 'lucide-react';

interface CuratorGuideProps {
  explanation: string;
  history: string;
  funFact: string;
  complexity: { time: string; space: string };
  algorithmName: string;
}

export const CuratorGuide: React.FC<CuratorGuideProps> = ({
  explanation,
  history,
  funFact,
  complexity,
  algorithmName,
}) => {
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'history' | 'stats'>('guide');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Handle Speech Synthesis
  useEffect(() => {
    if (!window.speechSynthesis) return;

    // Stop previous speech if explanation changes
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    if (ttsEnabled && explanation) {
      // Create new speech request
      const utterance = new SpeechSynthesisUtterance(explanation);
      utteranceRef.current = utterance;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      const timer = setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [explanation, ttsEnabled]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleTts = () => {
    if (ttsEnabled) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setTtsEnabled(!ttsEnabled);
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 w-full h-full text-[#1c1c1c] bg-[#f4f0e6] border-[#2d2d2d] border">
      {/* Top Header / Curator Avatar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#2d2d2d] pb-4">
        <div className="flex items-center gap-3">
          {/* Classic Typographic Monogram Stamp */}
          <div className="w-12 h-12 border border-[#2d2d2d] flex items-center justify-center bg-[#fcfaf2] font-serif font-black text-lg text-[#1b365d] select-none">
            A
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5a5a5a] font-bold mb-0.5">Resident Curator</div>
            <h2 className="text-lg font-serif font-bold text-[#1c1c1c] leading-tight flex items-center gap-1.5">
              <span>Algo</span>
              {isPlaying && <span className="text-[8px] font-sans uppercase tracking-wider text-[#2e5a44] font-bold">(Speaking)</span>}
            </h2>
          </div>
        </div>

        {/* Speech Synthesis Toggle */}
        <button
          onClick={toggleTts}
          className={`p-2.5 border transition-all ${
            ttsEnabled
              ? 'bg-[#1b365d]/10 border-[#1b365d] text-[#1b365d]'
              : 'border-[#2d2d2d] text-[#5a5a5a] hover:text-[#1c1c1c]'
          }`}
          title={ttsEnabled ? 'Mute Guide Audio' : 'Enable Guide Audio (Text-to-Speech)'}
        >
          {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-[#fcfaf2] border border-[#2d2d2d]">
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold transition-all ${
            activeTab === 'guide'
              ? 'bg-[#1b365d]/10 border-r border-[#2d2d2d] text-[#1b365d]'
              : 'text-[#5a5a5a] hover:text-[#1c1c1c] border-r border-[#2d2d2d]'
          }`}
        >
          <Award size={13} />
          Guide
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-[#1b365d]/10 border-r border-[#2d2d2d] text-[#1b365d]'
              : 'text-[#5a5a5a] hover:text-[#1c1c1c] border-r border-[#2d2d2d]'
          }`}
        >
          <Landmark size={13} />
          Placard
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold transition-all ${
            activeTab === 'stats'
              ? 'bg-[#1b365d]/10 text-[#1b365d]'
              : 'text-[#5a5a5a] hover:text-[#1c1c1c]'
          }`}
        >
          <Lightbulb size={13} />
          Stats
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {activeTab === 'guide' && (
          <div className="space-y-4 animate-fade-in">
            {/* Active Narration */}
            <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 min-h-[90px] flex flex-col justify-between">
              <p className="text-[#1c1c1c] text-xs leading-relaxed italic">
                "{explanation || 'Select an operation and click step or play to trace execution states.'}"
              </p>
              <div className="mt-3 flex items-center justify-end text-[9px] text-[#1b365d] font-bold uppercase tracking-wider">
                Active Step Description
              </div>
            </div>

            {/* Exhibit Trivia/Fact */}
            {funFact && (
              <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 flex gap-3">
                <div className="text-[#1c1c1c] mt-0.5 flex-shrink-0">
                  <Lightbulb size={14} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#1b365d] uppercase tracking-wide mb-1">Curator Notes</h4>
                  <p className="text-[#5a5a5a] text-xs leading-relaxed">{funFact}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in text-[#1c1c1c] text-xs leading-relaxed">
            <h3 className="text-sm font-bold text-[#1c1c1c] mb-2 flex items-center gap-2 font-serif">
              <Landmark size={14} className="text-[#1b365d]" />
              Historical Background: {algorithmName}
            </h3>
            <p className="whitespace-pre-line text-[#5a5a5a] text-xs leading-normal">{history}</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-[#1c1c1c] mb-3 font-serif">Complexity & Space Specifications</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center">
                <div className="text-[#5a5a5a] text-[9px] uppercase font-bold tracking-wider mb-1">Time Complexity</div>
                <div className="text-[#1b365d] font-mono text-sm font-bold">{complexity.time}</div>
              </div>
              <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-center">
                <div className="text-[#5a5a5a] text-[9px] uppercase font-bold tracking-wider mb-1">Space Complexity</div>
                <div className="text-[#722f37] font-mono text-sm font-bold">{complexity.space}</div>
              </div>
            </div>

            <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-4 text-xs space-y-2 text-[#5a5a5a] leading-relaxed">
              <h4 className="text-[#1c1c1c] font-bold uppercase tracking-wider text-[9px] mb-1">Complexity Analysis Guide</h4>
              <p>
                Time growth indicates instructions checked given N entries. Space represents auxiliary memory allocations in call stacks or pointer tables.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CuratorGuide;
