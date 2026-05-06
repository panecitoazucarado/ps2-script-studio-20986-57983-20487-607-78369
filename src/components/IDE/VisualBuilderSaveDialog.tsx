import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FolderPlus, FileCode2, ChevronRight, ChevronDown, Home } from 'lucide-react';
import type { FileNode } from '@/types/athena';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultName: string;
  onConfirm: (targetPath: string) => void;
}

function getFS(): FileNode[] {
  const fs = (window as any).__athenaFS;
  if (!fs) return [];
  return fs.fileSystem || fs.getFiles?.() || [];
}

function TreeNode({
  node, depth, selected, onSelect, expanded, toggle,
}: {
  node: FileNode; depth: number; selected: string;
  onSelect: (p: string) => void;
  expanded: Set<string>; toggle: (p: string) => void;
}) {
  if (node.type !== 'folder') return null;
  const isOpen = expanded.has(node.path);
  const isSel = selected === node.path;
  return (
    <div>
      <button
        onClick={() => { onSelect(node.path); toggle(node.path); }}
        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors text-left ${
          isSel ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'hover:bg-white/[0.05] text-white/70'
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {isOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen && node.children && node.children
        .filter(c => c.type === 'folder')
        .map(child => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            expanded={expanded}
            toggle={toggle}
          />
        ))}
    </div>
  );
}

export function VisualBuilderSaveDialog({ open, onOpenChange, defaultName, onConfirm }: Props) {
  const [fs, setFs] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState('/');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));
  const [filename, setFilename] = useState(defaultName);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState('');

  useEffect(() => {
    if (open) {
      setFs(getFS());
      setFilename(defaultName);
      setSelected('/');
      setExpanded(new Set(['/']));
      setCreatingFolder(false);
      setNewFolder('');
    }
  }, [open, defaultName]);

  const toggle = (p: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p); else n.add(p);
      return n;
    });
  };

  const handleCreateFolder = () => {
    const name = newFolder.trim();
    if (!name) return;
    const parent = selected === '/' ? '' : selected;
    const path = `${parent}/${name}`.replace(/\/+/g, '/');
    const api = (window as any).__athenaFS;
    if (api?.createFolder) {
      api.createFolder(path);
      setTimeout(() => {
        setFs(getFS());
        setExpanded(prev => new Set([...prev, selected, path]));
        setSelected(path);
        setCreatingFolder(false);
        setNewFolder('');
      }, 50);
    }
  };

  const handleConfirm = () => {
    let name = filename.trim();
    if (!name) return;
    if (!name.toLowerCase().endsWith('.js')) name += '.js';
    const folder = selected === '/' ? '' : selected;
    const target = `${folder}/${name}`.replace(/\/+/g, '/');
    onConfirm(target);
    onOpenChange(false);
  };

  const fullPath = useMemo(() => {
    let name = filename.trim() || defaultName;
    if (!name.toLowerCase().endsWith('.js')) name += '.js';
    const folder = selected === '/' ? '' : selected;
    return `${folder}/${name}`.replace(/\/+/g, '/');
  }, [filename, selected, defaultName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0f0f1f] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileCode2 className="w-4 h-4 text-purple-400" />
            Aplicar al proyecto
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 h-[360px]">
          {/* Tree */}
          <div className="flex-1 border border-white/10 rounded-lg bg-black/30 flex flex-col">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10">
              <span className="text-[11px] text-white/60 uppercase tracking-wide">Explorador</span>
              <Button size="sm" variant="ghost" className="h-6 px-2 gap-1 text-[11px]"
                onClick={() => setCreatingFolder(true)}>
                <FolderPlus className="w-3 h-3" /> Nueva carpeta
              </Button>
            </div>
            <ScrollArea className="flex-1 p-1">
              <button
                onClick={() => setSelected('/')}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-left ${
                  selected === '/' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' : 'hover:bg-white/[0.05] text-white/70'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                <span>/ (raíz del proyecto)</span>
              </button>
              {fs.filter(n => n.type === 'folder').map(node => (
                <TreeNode key={node.path} node={node} depth={0}
                  selected={selected} onSelect={setSelected}
                  expanded={expanded} toggle={toggle} />
              ))}
              {creatingFolder && (
                <div className="flex gap-1 mt-1 px-2">
                  <Input
                    autoFocus
                    value={newFolder}
                    onChange={e => setNewFolder(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') setCreatingFolder(false);
                    }}
                    placeholder="nombre carpeta"
                    className="h-6 text-[11px] bg-black/50 border-white/10"
                  />
                  <Button size="sm" className="h-6 px-2 text-[11px]" onClick={handleCreateFolder}>OK</Button>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: name + preview */}
          <div className="w-64 flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-white/60 uppercase tracking-wide">Carpeta destino</label>
              <div className="mt-1 px-2 py-1.5 rounded-md bg-black/40 border border-white/10 text-[12px] text-white/80 truncate">
                {selected}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/60 uppercase tracking-wide">Nombre del archivo</label>
              <Input
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-[12px] h-8"
              />
              <p className="text-[10px] text-white/40 mt-1">Se añadirá .js si no se incluye.</p>
            </div>
            <div>
              <label className="text-[11px] text-white/60 uppercase tracking-wide">Ruta final</label>
              <div className="mt-1 px-2 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-200 break-all">
                {fullPath}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500">
            Guardar escena
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}