import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  X, ChevronLeft, ChevronRight, RotateCcw, List,
  FileCode, FileJson, FileText, Image as ImageIcon, Code2,
  Copy, Pin, PinOff, SplitSquareHorizontal, MoreHorizontal
} from 'lucide-react';
import { FileNode } from '@/types/athena';
import athenaOwl from '@/assets/athena-owl.png';

interface ProTabBarProps {
  openTabs: FileNode[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  onTabClose: (index: number) => void;
  onFileRename: (index: number, newName: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  modifiedTabs: Set<number>;
}

export function ProTabBar({
  openTabs,
  activeTabIndex,
  onTabChange,
  onTabClose,
  onFileRename,
  onTabReorder,
  modifiedTabs,
}: ProTabBarProps) {
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenuTab, setContextMenuTab] = useState<number | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [closedTabsHistory, setClosedTabsHistory] = useState<FileNode[]>([]);
  const [pinnedTabs, setPinnedTabs] = useState<Set<string>>(new Set());
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWelcomeTab = (tab: FileNode) => tab.path === '/__welcome__';

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuTab(index);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuTab(null);
  }, []);

  const handleCloseTab = useCallback((index: number) => {
    const tab = openTabs[index];
    if (pinnedTabs.has(tab.path)) return; // Can't close pinned tabs via X
    if (!isWelcomeTab(tab)) {
      setClosedTabsHistory(prev => [...prev, tab].slice(-10));
    }
    onTabClose(index);
    closeContextMenu();
  }, [openTabs, onTabClose, closeContextMenu, pinnedTabs]);

  const handleCloseOthers = useCallback(() => {
    if (contextMenuTab === null) return;
    const targetTab = openTabs[contextMenuTab];
    const tabsToClose: number[] = [];
    openTabs.forEach((tab, idx) => {
      if (idx !== contextMenuTab && !isWelcomeTab(tab) && !pinnedTabs.has(tab.path)) {
        tabsToClose.push(idx);
      }
    });
    // Close from end to avoid index shifting
    tabsToClose.sort((a, b) => b - a).forEach(idx => {
      setClosedTabsHistory(prev => [...prev, openTabs[idx]].slice(-10));
      onTabClose(idx);
    });
    closeContextMenu();
  }, [contextMenuTab, openTabs, onTabClose, closeContextMenu, pinnedTabs]);

  const handleCloseToRight = useCallback(() => {
    if (contextMenuTab === null) return;
    const tabsToClose: number[] = [];
    for (let i = openTabs.length - 1; i > contextMenuTab; i--) {
      if (!isWelcomeTab(openTabs[i]) && !pinnedTabs.has(openTabs[i].path)) {
        tabsToClose.push(i);
      }
    }
    tabsToClose.forEach(idx => {
      setClosedTabsHistory(prev => [...prev, openTabs[idx]].slice(-10));
      onTabClose(idx);
    });
    closeContextMenu();
  }, [contextMenuTab, openTabs, onTabClose, closeContextMenu, pinnedTabs]);

  const handleCloseAll = useCallback(() => {
    // Close all except Welcome tab and pinned tabs
    const tabsToClose: number[] = [];
    openTabs.forEach((tab, idx) => {
      if (!isWelcomeTab(tab) && !pinnedTabs.has(tab.path)) {
        tabsToClose.push(idx);
      }
    });
    tabsToClose.sort((a, b) => b - a).forEach(idx => {
      setClosedTabsHistory(prev => [...prev, openTabs[idx]].slice(-10));
      onTabClose(idx);
    });
    closeContextMenu();
  }, [openTabs, onTabClose, closeContextMenu, pinnedTabs]);

  const handleCloseSaved = useCallback(() => {
    const tabsToClose: number[] = [];
    openTabs.forEach((tab, idx) => {
      if (!isWelcomeTab(tab) && !pinnedTabs.has(tab.path) && !modifiedTabs.has(idx)) {
        tabsToClose.push(idx);
      }
    });
    tabsToClose.sort((a, b) => b - a).forEach(idx => {
      setClosedTabsHistory(prev => [...prev, openTabs[idx]].slice(-10));
      onTabClose(idx);
    });
    closeContextMenu();
  }, [openTabs, onTabClose, closeContextMenu, pinnedTabs, modifiedTabs]);

  const handleReopenLastClosed = useCallback(() => {
    if (closedTabsHistory.length === 0) return;
    const lastClosed = closedTabsHistory[closedTabsHistory.length - 1];
    setClosedTabsHistory(prev => prev.slice(0, -1));
    // We can't directly reopen from here, but the parent handles file opening
    // For now, just show a note - the parent component can handle this
  }, [closedTabsHistory]);

  const handleTogglePin = useCallback(() => {
    if (contextMenuTab === null) return;
    const tab = openTabs[contextMenuTab];
    if (isWelcomeTab(tab)) { closeContextMenu(); return; }
    setPinnedTabs(prev => {
      const next = new Set(prev);
      if (next.has(tab.path)) next.delete(tab.path);
      else next.add(tab.path);
      return next;
    });
    closeContextMenu();
  }, [contextMenuTab, openTabs, closeContextMenu]);

  const handleCopyPath = useCallback(() => {
    if (contextMenuTab === null) return;
    const tab = openTabs[contextMenuTab];
    navigator.clipboard.writeText(tab.path);
    closeContextMenu();
  }, [contextMenuTab, openTabs, closeContextMenu]);

  const handleCopyRelativePath = useCallback(() => {
    if (contextMenuTab === null) return;
    const tab = openTabs[contextMenuTab];
    const relativePath = tab.path.startsWith('/') ? tab.path.slice(1) : tab.path;
    navigator.clipboard.writeText(relativePath);
    closeContextMenu();
  }, [contextMenuTab, openTabs, closeContextMenu]);

  // Double-click rename
  const handleDoubleClick = useCallback((index: number) => {
    if (isWelcomeTab(openTabs[index])) return;
    setEditingTabIndex(index);
    setEditingName(openTabs[index].name);
  }, [openTabs]);

  const handleNameChange = useCallback(() => {
    if (editingTabIndex !== null && editingName.trim()) {
      onFileRename(editingTabIndex, editingName.trim());
    }
    setEditingTabIndex(null);
  }, [editingTabIndex, editingName, onFileRename]);

  // Drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedTabIndex]);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      onTabReorder(draggedTabIndex, index);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  }, [draggedTabIndex, onTabReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  }, []);

  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (contextMenuTab === null) return;
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenuTab, closeContextMenu]);

  // Focus input when editing
  useEffect(() => {
    if (editingTabIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          const newIndex = activeTabIndex > 0 ? activeTabIndex - 1 : openTabs.length - 1;
          onTabChange(newIndex);
        } else {
          const newIndex = activeTabIndex < openTabs.length - 1 ? activeTabIndex + 1 : 0;
          onTabChange(newIndex);
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        handleReopenLastClosed();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTabIndex, openTabs, onTabChange, handleReopenLastClosed]);

  // File type detection for icons
  const getFileIcon = (tab: FileNode) => {
    if (isWelcomeTab(tab)) {
      return <img src={athenaOwl} alt="Athena" className="w-4 h-4 shrink-0 rounded-sm" />;
    }

    const ext = tab.name.split('.').pop()?.toLowerCase();
    const iconClass = 'w-3.5 h-3.5 shrink-0';

    switch (ext) {
      case 'js': case 'mjs': case 'cjs':
        return <Code2 className={`${iconClass} text-yellow-400`} />;
      case 'jsx':
        return <Code2 className={`${iconClass} text-cyan-400`} />;
      case 'ts':
        return <Code2 className={`${iconClass} text-blue-500`} />;
      case 'tsx':
        return <Code2 className={`${iconClass} text-blue-400`} />;
      case 'json':
        return <FileJson className={`${iconClass} text-yellow-500`} />;
      case 'c': case 'h': case 'cpp': case 'hpp':
        return <FileCode className={`${iconClass} text-blue-600`} />;
      case 'vcl': case 'vsm': case 'asm': case 's':
        return <FileCode className={`${iconClass} text-purple-500`} />;
      case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'svg': case 'bmp': case 'ico':
        return <ImageIcon className={`${iconClass} text-purple-400`} />;
      case 'md': case 'txt':
        return <FileText className={`${iconClass} text-blue-400`} />;
      case 'ini': case 'cfg': case 'conf': case 'toml':
        return <FileText className={`${iconClass} text-muted-foreground`} />;
      default:
        return <FileCode className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getTabDisplayName = (tab: FileNode) => {
    if (isWelcomeTab(tab)) return 'Bienvenida';
    return tab.name;
  };

  const contextTab = contextMenuTab !== null ? openTabs[contextMenuTab] : null;
  const canCloseContextTab = contextTab ? !isWelcomeTab(contextTab) : false;

  return (
    <>
      {/* Tab Bar - Glass UI */}
      <div className="flex items-center h-[38px] bg-[hsl(var(--tab-bg))] backdrop-blur-xl border-b border-border/40 relative overflow-hidden">
        {/* Subtle glass gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {/* Scroll Left */}
        <Button
          variant="ghost"
          size="sm"
          className="h-full w-7 px-0 shrink-0 rounded-none text-muted-foreground hover:text-foreground hover:bg-white/[0.04] relative z-10"
          onClick={() => scrollTabs('left')}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Tabs Container */}
        <div
          ref={tabsContainerRef}
          className="flex items-end gap-0 overflow-x-auto scrollbar-none scroll-smooth flex-1 h-full relative z-10"
        >
          {openTabs.map((tab, index) => {
            const isActive = index === activeTabIndex;
            const isModified = modifiedTabs.has(index);
            const isPinned = pinnedTabs.has(tab.path);
            const isWelcome = isWelcomeTab(tab);
            const isDragOver = dragOverIndex === index;
            const isDragged = draggedTabIndex === index;

            return (
              <div
                key={tab.path}
                draggable={!isWelcome}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group relative flex items-center gap-1.5 
                  ${isPinned ? 'px-3' : 'px-3 pr-1.5'} 
                  h-[34px] mt-auto
                  ${isPinned ? 'min-w-[80px] max-w-[120px]' : 'min-w-[120px] max-w-[200px]'}
                  transition-all duration-200 select-none cursor-pointer
                  ${isDragged ? 'opacity-40' : ''}
                  ${isDragOver ? 'border-l-2 border-l-[hsl(var(--ps2-blue))]' : ''}
                  ${isActive
                    ? 'bg-[hsl(var(--editor-bg))] text-foreground rounded-t-lg border-t border-x border-border/50 border-b-0 shadow-[0_-1px_8px_rgba(0,0,0,0.15)]'
                    : 'text-muted-foreground hover:text-foreground/80 hover:bg-white/[0.03] rounded-t-md'
                  }
                `}
                onClick={() => onTabChange(index)}
                onContextMenu={(e) => handleContextMenu(e, index)}
                title={isWelcome ? 'Bienvenida - Athena Env' : tab.path}
              >
                {/* File Icon */}
                {getFileIcon(tab)}

                {/* Pin indicator */}
                {isPinned && (
                  <Pin className="w-2.5 h-2.5 shrink-0 text-[hsl(var(--ps2-purple))] rotate-45" />
                )}

                {/* File Name */}
                {editingTabIndex === index ? (
                  <Input
                    ref={inputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleNameChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameChange();
                      if (e.key === 'Escape') setEditingTabIndex(null);
                    }}
                    className="h-5 px-1 py-0 text-xs border-[hsl(var(--ps2-blue))] bg-background w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`text-[12px] truncate flex-1 ${isActive ? 'font-medium' : 'font-normal'}`}
                    onDoubleClick={() => handleDoubleClick(index)}
                  >
                    {getTabDisplayName(tab)}
                  </span>
                )}

                {/* Modified dot */}
                {isModified && !isPinned && (
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--ps2-blue))] shrink-0 animate-pulse" title="Sin guardar" />
                )}

                {/* Close button - hidden for pinned, shows on hover */}
                {!isPinned && !isWelcome && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(index);
                    }}
                    className={`
                      ${isModified ? 'opacity-0' : 'opacity-0'}
                      group-hover:opacity-70 hover:!opacity-100
                      hover:bg-white/[0.08] rounded-sm p-0.5
                      transition-all duration-150
                      shrink-0
                    `}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Welcome close button */}
                {isWelcome && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(index);
                    }}
                    className="opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-white/[0.08] rounded-sm p-0.5 transition-all duration-150 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Active tab bottom highlight */}
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[hsl(var(--ps2-blue))] rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll Right */}
        <Button
          variant="ghost"
          size="sm"
          className="h-full w-7 px-0 shrink-0 rounded-none text-muted-foreground hover:text-foreground hover:bg-white/[0.04] relative z-10"
          onClick={() => scrollTabs('right')}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {/* Separator */}
        <div className="h-5 w-px bg-border/30 shrink-0" />

        {/* Tabs List Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-8 px-0 shrink-0 rounded-none text-muted-foreground hover:text-foreground hover:bg-white/[0.04] relative z-10"
              title="Pestañas abiertas"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 max-h-[400px] overflow-y-auto glass-panel border-border/50 z-[100]">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pestañas abiertas ({openTabs.length})
            </div>
            <DropdownMenuSeparator />
            {openTabs.map((tab, index) => (
              <DropdownMenuItem
                key={tab.path}
                onClick={() => onTabChange(index)}
                className={`flex items-center gap-2 py-2 ${index === activeTabIndex ? 'bg-accent/50' : ''}`}
              >
                {getFileIcon(tab)}
                <span className="flex-1 truncate text-xs">{getTabDisplayName(tab)}</span>
                <div className="flex items-center gap-1">
                  {pinnedTabs.has(tab.path) && (
                    <Pin className="w-3 h-3 text-[hsl(var(--ps2-purple))] rotate-45" />
                  )}
                  {modifiedTabs.has(index) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ps2-blue))]" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {closedTabsHistory.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cerradas recientemente
                </div>
                {closedTabsHistory.slice(-5).reverse().map((tab, idx) => (
                  <DropdownMenuItem key={`closed-${idx}`} className="flex items-center gap-2 py-2 opacity-60">
                    {getFileIcon(tab)}
                    <span className="flex-1 truncate text-xs">{tab.name}</span>
                    <RotateCcw className="w-3 h-3" />
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-8 px-0 shrink-0 rounded-none text-muted-foreground hover:text-foreground hover:bg-white/[0.04] relative z-10"
              title="Más acciones"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-panel border-border/50 z-[100]">
            <DropdownMenuItem onClick={handleCloseSaved} className="text-xs gap-2">
              <X className="w-3.5 h-3.5" /> Cerrar guardados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCloseAll} className="text-xs gap-2 text-destructive">
              <X className="w-3.5 h-3.5" /> Cerrar todo
            </DropdownMenuItem>
            {closedTabsHistory.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReopenLastClosed} className="text-xs gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Reabrir última cerrada
                  <span className="ml-auto text-[10px] text-muted-foreground">⌘⇧T</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Context Menu */}
      {contextMenuTab !== null && contextTab && (
        <div
          className="fixed glass-panel rounded-lg shadow-2xl py-1.5 z-[200] min-w-[220px] animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            left: `${Math.min(contextMenuPosition.x, window.innerWidth - 240)}px`,
            top: `${Math.min(contextMenuPosition.y, window.innerHeight - 300)}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close actions */}
          <ContextMenuItem
            onClick={() => { handleCloseTab(contextMenuTab); }}
            disabled={!canCloseContextTab}
            icon={<X className="w-3.5 h-3.5" />}
            shortcut="⌘W"
          >
            Cerrar
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleCloseOthers}
            disabled={openTabs.length <= 1}
          >
            Cerrar otros
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleCloseToRight}
            disabled={contextMenuTab === openTabs.length - 1}
          >
            Cerrar a la derecha
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleCloseSaved}
          >
            Cerrar guardados
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleCloseAll}
            className="text-destructive"
          >
            Cerrar todo
          </ContextMenuItem>

          <div className="h-px bg-border/30 my-1.5 mx-2" />

          {/* Path actions */}
          <ContextMenuItem
            onClick={handleCopyPath}
            icon={<Copy className="w-3.5 h-3.5" />}
            shortcut="⌥⌘C"
          >
            Copiar ruta
          </ContextMenuItem>
          <ContextMenuItem
            onClick={handleCopyRelativePath}
            icon={<Copy className="w-3.5 h-3.5" />}
          >
            Copiar ruta relativa
          </ContextMenuItem>

          <div className="h-px bg-border/30 my-1.5 mx-2" />

          {/* Pin / Rename */}
          {!isWelcomeTab(contextTab) && (
            <ContextMenuItem
              onClick={handleTogglePin}
              icon={pinnedTabs.has(contextTab.path)
                ? <PinOff className="w-3.5 h-3.5" />
                : <Pin className="w-3.5 h-3.5" />
              }
            >
              {pinnedTabs.has(contextTab.path) ? 'Desanclar' : 'Anclar pestaña'}
            </ContextMenuItem>
          )}
          {canCloseContextTab && (
            <ContextMenuItem
              onClick={() => { handleDoubleClick(contextMenuTab); closeContextMenu(); }}
            >
              Renombrar
            </ContextMenuItem>
          )}

          {closedTabsHistory.length > 0 && (
            <>
              <div className="h-px bg-border/30 my-1.5 mx-2" />
              <ContextMenuItem
                onClick={() => { handleReopenLastClosed(); closeContextMenu(); }}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                shortcut="⌘⇧T"
              >
                Reabrir última cerrada
              </ContextMenuItem>
            </>
          )}
        </div>
      )}
    </>
  );
}

// Reusable context menu item
function ContextMenuItem({
  children,
  onClick,
  disabled,
  icon,
  shortcut,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
  className?: string;
}) {
  return (
    <button
      className={`
        w-full px-3 py-1.5 text-xs text-left flex items-center gap-2.5
        transition-colors duration-100
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/[0.06] cursor-pointer'}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className="w-4 flex justify-center">{icon}</span>}
      {!icon && <span className="w-4" />}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-[10px] text-muted-foreground ml-4">{shortcut}</span>
      )}
    </button>
  );
}
