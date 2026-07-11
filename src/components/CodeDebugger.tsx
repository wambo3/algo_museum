import React, { useState } from 'react';
import { Terminal, Cpu, ToggleLeft, ToggleRight } from 'lucide-react';
import type { PseudocodeLine } from '../lib/algorithmRunner';

interface CodeDebuggerProps {
  pseudocode: PseudocodeLine[];
  pythonCode?: PseudocodeLine[];
  activeLine: number; // 1-indexed active line
  variables: Record<string, string | number | boolean | null | undefined | string[]>;
}

export const CodeDebugger: React.FC<CodeDebuggerProps> = ({
  pseudocode,
  pythonCode,
  activeLine,
  variables,
}) => {
  const [showPython, setShowPython] = useState(false);

  const displayCode = showPython && pythonCode ? pythonCode : pseudocode;
  const hasPython = !!pythonCode;

  return (
    <div className="glass-panel border-[#2d2d2d] bg-[#f4f0e6] p-5 flex flex-col gap-4 w-full h-full text-[#1c1c1c] border">
      {/* Code Header with Toggle */}
      <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-[#1b365d]">
          <Terminal size={15} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1c1c]">Exhibit Blueprint</h3>
        </div>

        {hasPython && (
          <button
            onClick={() => setShowPython(!showPython)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold border border-[#2d2d2d] bg-[#fcfaf2] transition-colors"
          >
            {showPython ? <ToggleRight size={14} className="text-[#1b365d]" /> : <ToggleLeft size={14} className="text-[#5a5a5a]" />}
            <span>{showPython ? 'Python View' : 'Pseudocode'}</span>
          </button>
        )}
      </div>

      {/* Code Display Pane */}
      <div className="flex-1 overflow-auto bg-[#fcfaf2] border border-[#2d2d2d] p-4 font-mono text-[11px] leading-relaxed min-h-0">
        {displayCode.map((line, index) => {
          const lineNumber = index + 1;
          const isActive = lineNumber === activeLine;

          return (
            <div
              key={index}
              className={`flex py-0.5 -mx-4 px-4 ${
                isActive ? 'debugger-active-line bg-[#1b365d]/5' : 'opacity-65'
              }`}
            >
              {/* Line number */}
              <span className={`w-8 text-right select-none pr-3 ${isActive ? 'text-[#1b365d] font-bold' : 'text-[#8c8c8c]'}`}>
                {lineNumber}
              </span>
              {/* Indented code content */}
              <pre
                className={`whitespace-pre ${isActive ? 'text-[#1c1c1c] font-bold' : 'text-[#2d2d2d]'}`}
                style={{ marginLeft: `${line.indent * 16}px` }}
              >
                {line.text}
              </pre>
            </div>
          );
        })}
      </div>

      {/* Variable Scope Inspector */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 text-[#1b365d] text-[10px] font-bold uppercase tracking-wider mb-1">
          <Cpu size={13} />
          <span>Active Variable Scope</span>
        </div>
        
        <div className="bg-[#fcfaf2] border border-[#2d2d2d] p-3 max-h-[140px] overflow-y-auto">
          {Object.keys(variables).length === 0 ? (
            <div className="text-[#5a5a5a] text-xs italic text-center py-2">No variables active in current scope.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(variables).map(([name, val]) => {
                let formattedVal = '';
                if (val === null) formattedVal = 'None';
                else if (val === undefined) formattedVal = 'None';
                else if (Array.isArray(val)) formattedVal = `[ ${val.join(', ')} ]`;
                else if (typeof val === 'boolean') formattedVal = val ? 'True' : 'False';
                else formattedVal = String(val);

                return (
                  <div key={name} className="flex items-center justify-between bg-[#f4f0e6] border border-[#2d2d2d] px-3 py-1.5 font-mono">
                    <span className="text-[#5a5a5a] font-bold">{name}</span>
                    <span className="text-[#1b365d] font-black max-w-[120px] truncate animate-fade-in" title={formattedVal}>
                      {formattedVal}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CodeDebugger;
