import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Save, Download, X, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileNode } from '@/types/athena';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  openTabs: FileNode[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  onTabClose: (index: number) => void;
  onFileRename: (index: number, newName: string) => void;
}

export function CodeEditor({ 
  code, 
  onChange, 
  onRun, 
  openTabs, 
  activeTabIndex, 
  onTabChange, 
  onTabClose,
  onFileRename 
}: CodeEditorProps) {
  const [lineCount, setLineCount] = useState(1);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenuTab, setContextMenuTab] = useState<number | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [modifiedTabs, setModifiedTabs] = useState<Set<number>>(new Set());
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentFile = openTabs[activeTabIndex];

  // Track modifications
  useEffect(() => {
    const initialContent = openTabs[activeTabIndex].content || '';
    if (code !== initialContent) {
      setModifiedTabs(prev => new Set(prev).add(activeTabIndex));
    }
  }, [code, activeTabIndex, openTabs]);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Monaco Editor for PS2 development
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      parameterHints: {
        enabled: true,
      },
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      bracketPairColorization: {
        enabled: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyCode.F5, () => {
      onRun();
    });
  }, [onRun]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  const handleSave = useCallback(() => {
    setModifiedTabs(prev => {
      const newSet = new Set(prev);
      newSet.delete(activeTabIndex);
      return newSet;
    });
    toast({
      title: "File saved",
      description: `${currentFile.name} has been saved successfully`,
    });
  }, [currentFile.name, activeTabIndex, toast]);

  const handleExport = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File exported",
      description: `${currentFile.name} has been exported successfully`,
    });
  }, [code, currentFile.name, toast]);

  const handleDoubleClick = useCallback((index: number) => {
    setEditingTabIndex(index);
    setEditingName(openTabs[index].name);
  }, [openTabs]);

  const handleNameChange = useCallback(() => {
    if (editingTabIndex !== null && editingName.trim()) {
      onFileRename(editingTabIndex, editingName.trim());
    }
    setEditingTabIndex(null);
  }, [editingTabIndex, editingName, onFileRename]);

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenuTab(index);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuTab(null);
  }, []);

  const handleCloseOthers = useCallback(() => {
    if (contextMenuTab !== null) {
      // Use callbacks to parent component
      const tabsToClose: number[] = [];
      openTabs.forEach((_, idx) => {
        if (idx !== contextMenuTab) tabsToClose.push(idx);
      });
      tabsToClose.reverse().forEach(idx => onTabClose(idx));
    }
    closeContextMenu();
  }, [contextMenuTab, openTabs, onTabClose, closeContextMenu]);

  const handleCloseToRight = useCallback(() => {
    if (contextMenuTab !== null) {
      const tabsToClose: number[] = [];
      for (let i = openTabs.length - 1; i > contextMenuTab; i--) {
        tabsToClose.push(i);
      }
      tabsToClose.forEach(idx => onTabClose(idx));
    }
    closeContextMenu();
  }, [contextMenuTab, openTabs, onTabClose, closeContextMenu]);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return <FileCode className="w-3.5 h-3.5 shrink-0" />;
  };

  useEffect(() => {
    if (editingTabIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabIndex]);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'javascript';
    }
  };

  const getCursorPosition = () => {
    if (!editorRef.current) return { line: 1, column: 1 };
    const position = editorRef.current.getPosition();
    return {
      line: position?.lineNumber || 1,
      column: position?.column || 1,
    };
  };

  return (
    <Card className="h-full flex flex-col bg-ide-editor border-border relative">
      {/* Professional Header - VS Code Style */}
      <div className="flex flex-col border-b border-border bg-[hsl(var(--ide-tab))]">
        {/* Tabs Row */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-thin scroll-smooth">
          {openTabs.map((tab, index) => (
            <div
              key={tab.path}
              className={`
                group relative flex items-center gap-2 px-4 py-2 min-w-[140px] max-w-[220px]
                border-t-2 border-r border-border/50
                transition-all duration-200 cursor-pointer select-none
                ${index === activeTabIndex 
                  ? 'bg-[hsl(var(--ide-editor))] border-t-[hsl(var(--ps2-blue))] text-foreground shadow-sm' 
                  : 'bg-[hsl(var(--ide-tab))] border-t-transparent text-muted-foreground hover:bg-[hsl(var(--ide-editor))]/70 hover:text-foreground'
                }
              `}
              onClick={() => onTabChange(index)}
              onContextMenu={(e) => handleContextMenu(e, index)}
              title={tab.path}
            >
              {/* File Icon */}
              {getFileIcon(tab.name)}
              
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
                  className="h-5 px-1 py-0 text-xs border-[hsl(var(--ps2-blue))] bg-background"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="text-xs font-medium truncate flex-1"
                  onDoubleClick={() => handleDoubleClick(index)}
                >
                  {tab.name}
                </span>
              )}
              
              {/* Modified Indicator */}
              {modifiedTabs.has(index) && (
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--ps2-blue))] shrink-0" title="Unsaved changes" />
              )}
              
              {/* Close Button */}
              {openTabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(index);
                  }}
                  className={`
                    ${modifiedTabs.has(index) ? 'opacity-0' : 'opacity-0'}
                    group-hover:opacity-100
                    hover:bg-muted/80 rounded p-0.5 
                    transition-all duration-150
                    ml-auto shrink-0
                  `}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              
              {/* Active Tab Indicator */}
              {index === activeTabIndex && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--ps2-blue))]" />
              )}
            </div>
          ))}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between px-3 py-2 bg-[hsl(var(--ide-editor))]/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{currentFile.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {getLanguage(currentFile.name).toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2.5 text-xs hover:bg-muted"
              onClick={handleSave}
              title="Save file (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save
            </Button>
            
            <Button 
              onClick={onRun} 
              size="sm" 
              className="h-7 px-2.5 text-xs bg-[hsl(var(--ps2-purple))] hover:bg-[hsl(var(--ps2-purple))]/80 text-primary-foreground"
              title="Run script (F5)"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Run
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2.5 text-xs hover:bg-muted"
              onClick={handleExport}
              title="Export current file"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuTab !== null && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[180px] animate-in fade-in-0 zoom-in-95"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              onTabClose(contextMenuTab);
              closeContextMenu();
            }}
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            onClick={handleCloseOthers}
            disabled={openTabs.length === 1}
          >
            Close Others
          </button>
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            onClick={handleCloseToRight}
            disabled={contextMenuTab === openTabs.length - 1}
          >
            Close to the Right
          </button>
          <div className="h-px bg-border my-1" />
          <button
            className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            onClick={() => {
              handleDoubleClick(contextMenuTab);
              closeContextMenu();
            }}
          >
            Rename
          </button>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={getLanguage(currentFile.name)}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: {
              enabled: true,
            },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>

      {/* Editor Status Bar */}
      <div className="ide-statusbar flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">{getLanguage(currentFile.name).toUpperCase()}</span>
          <span className="text-muted-foreground">UTF-8</span>
          <span className="text-muted-foreground">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Ln {getCursorPosition().line}, Col {getCursorPosition().column}
          </span>
          <span className="text-muted-foreground">Spaces: 2</span>
        </div>
      </div>
    </Card>
  );
}