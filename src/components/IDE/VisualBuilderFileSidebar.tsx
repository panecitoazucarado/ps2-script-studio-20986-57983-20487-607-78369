import { useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Folder, FileCode2, RefreshCw } from 'lucide-react';
import type { FileNode } from '@/types/athena';

interface Props {
  onOpenFile: (path: string, name: string, content: string) => void;
  activePath: string | null;
}

function getFS(): FileNode[] {
  const fs = (window as any).__athenaFS;
  if (!fs) return [];
  return fs.fileSystem || [];
}

function Tree({
  nodes, depth, expanded, toggle, onOpenFile, activePath,
}: {
  nodes: FileNode[]; depth: number;
  expanded: Set<string>; toggle: (p: string) => void;
  onOpenFile: Props['onOpenFile']; activePath: string | null;
}) {
  return (
    <>
      {nodes.map(node => {
        if (node.type === 'folder') {
          const isOpen = expanded.has(node.path);
          return (
            <div key={node.path}>
              <button
                onClick={() => toggle(node.path)}
                className="w-full flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-white/[0.05] text-white/70 text-left"
                style={{ paddingLeft: 6 + depth * 12 }}
              >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Folder className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{node.name}</span>
              </button>
              {isOpen && node.children && (
                <Tree nodes={node.children} depth={depth + 1} expanded={expanded}
                  toggle={toggle} onOpenFile={onOpenFile} activePath={activePath} />
              )}
            </div>
          );
        }
        if (!node.name.toLowerCase().endsWith('.js')) return null;
        const isActive = activePath === node.path;
        return (
          <button
            key={node.path}
            onClick={() => onOpenFile(node.path, node.name, node.content || '')}
            className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-left transition-colors ${
              isActive ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'hover:bg-white/[0.05] text-white/70'
            }`}
            style={{ paddingLeft: 18 + depth * 12 }}
          >
            <FileCode2 className="w-3.5 h-3.5 text-yellow-400/80 shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
        );
      })}
    </>
  );
}

export function VisualBuilderFileSidebar({ onOpenFile, activePath }: Props) {
  const [fs, setFs] = useState<FileNode[]>(getFS);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));
  const [tick, setTick] = useState(0);

  useEffect(() => { setFs(getFS()); }, [tick]);

  const toggle = (p: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });
  };

  const empty = useMemo(() => fs.length === 0, [fs]);

  return (
    <div className="w-52 shrink-0 border-r border-white/[0.06] bg-[#0c0c1c] flex flex-col">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Archivos .js</span>
        <button onClick={() => setTick(t => t + 1)} className="h-5 w-5 rounded hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {empty && (
            <div className="text-[10px] text-white/30 p-2 text-center">Sin archivos</div>
          )}
          <Tree nodes={fs} depth={0} expanded={expanded} toggle={toggle}
            onOpenFile={onOpenFile} activePath={activePath} />
        </div>
      </ScrollArea>
    </div>
  );
}
