import { useState, useCallback, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { PS2Preview } from './PS2Preview';
import { IDEHeader } from './IDEHeader';
import { IDEStatusBar } from './IDEStatusBar';
import { FloatingWindow } from './FloatingWindow';
import { FileNode } from '@/types/athena';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';
import { useWindowDocking } from '@/contexts/WindowDockingContext';

export function IDELayoutContent() {
  const { windows, undockWindow, dockingEnabled } = useWindowDocking();
  
  const defaultFile: FileNode = {
    name: 'main.js',
    type: 'file',
    path: '/main.js',
    content: '// Welcome to ATHENA ENV SDK for PlayStation 2\n// Enhanced JavaScript environment for PS2 homebrew development\n\n// {"name": "My PS2 App", "author": "Developer", "version": "1.0.0", "icon": "icon.png", "file": "main.js"}\n\nconst font = new Font("default");\nlet frameCount = 0;\n\nos.setInterval(() => {\n  Screen.clear(Color.new(0, 32, 64, 255));\n  \n  // Draw title\n  font.print(50, 50, "ATHENA ENV SDK Demo");\n  font.print(50, 80, "Frame: " + frameCount);\n  \n  // Draw some graphics\n  Draw.rect(200, 150, 240, 100, Color.new(128, 0, 255, 255));\n  Draw.circle(320, 200, 30, Color.new(0, 255, 128, 255));\n  \n  font.print(50, 350, "Press buttons on your controller!");\n  \n  frameCount++;\n  Screen.flip();\n}, 16);'
  };
  
  const [openTabsState, setOpenTabsState] = useState<FileNode[]>([defaultFile]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [code, setCode] = useState(defaultFile.content || '');
  const [isRunning, setIsRunning] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([]);

  const fileExplorerHeaderRef = useRef<HTMLDivElement>(null);
  const previewHeaderRef = useRef<HTMLDivElement>(null);

  const openTabs = openTabsState;
  const selectedFile = openTabs[activeTabIndex];

  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const setOpenTabs = useCallback((updater: any) => {
    if (typeof updater === 'function') {
      setOpenTabsState((prev: FileNode[]) => updater(prev));
    } else {
      setOpenTabsState(updater);
    }
  }, []);

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      const existingTabIndex = openTabs.findIndex(tab => tab.path === file.path);
      
      if (existingTabIndex !== -1) {
        setActiveTabIndex(existingTabIndex);
        setCode(openTabs[existingTabIndex].content || '');
      } else {
        setOpenTabs((prev: FileNode[]) => [...prev, file]);
        setActiveTabIndex(openTabs.length);
        setCode(file.content || '');
      }
      setIsRunning(false);
    }
  }, [openTabs, setOpenTabs]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
      idx === activeTabIndex ? { ...tab, content: newCode } : tab
    ));
  }, [activeTabIndex, setOpenTabs]);

  const handleTabChange = useCallback((index: number) => {
    setActiveTabIndex(index);
    setCode(openTabs[index].content || '');
    setIsRunning(false);
  }, [openTabs]);

  const handleTabClose = useCallback((index: number) => {
    if (openTabs.length === 1) return;
    
    const newTabs = openTabs.filter((_, idx) => idx !== index);
    setOpenTabs(newTabs);
    
    let newActiveIndex = activeTabIndex;
    if (activeTabIndex === index) {
      newActiveIndex = index > 0 ? index - 1 : 0;
    } else if (activeTabIndex > index) {
      newActiveIndex = activeTabIndex - 1;
    }
    
    setActiveTabIndex(newActiveIndex);
    setCode(newTabs[newActiveIndex].content || '');
  }, [openTabs, activeTabIndex, setOpenTabs]);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setOpenTabs((prev: FileNode[]) => {
      const newTabs = [...prev];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
    
    // Update active tab index after reordering
    if (activeTabIndex === fromIndex) {
      setActiveTabIndex(toIndex);
    } else if (activeTabIndex > fromIndex && activeTabIndex <= toIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    } else if (activeTabIndex < fromIndex && activeTabIndex >= toIndex) {
      setActiveTabIndex(activeTabIndex + 1);
    }
  }, [activeTabIndex, setOpenTabs]);

  const handleFileRename = useCallback((index: number, newName: string) => {
    if (!newName.trim()) return;
    setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
      idx === index ? { ...tab, name: newName, path: tab.path.replace(tab.name, newName) } : tab
    ));
  }, [setOpenTabs]);

  const handleRun = useCallback(() => {
    setShowPreview(true);
    setIsRunning(true);
  }, []);

  const handleToggleRun = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Handle dragging to undock
  const handleFileExplorerDrag = (e: React.MouseEvent) => {
    if (!dockingEnabled) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (deltaX > 30 || deltaY > 30) {
        hasMoved = true;
      }
    };

    const handleUp = (upEvent: MouseEvent) => {
      if (hasMoved && windows.fileExplorer.docked) {
        undockWindow('fileExplorer', { x: upEvent.clientX - 200, y: upEvent.clientY - 20 });
        setShowFileExplorer(false);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handlePreviewDrag = (e: React.MouseEvent) => {
    if (!dockingEnabled) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (deltaX > 30 || deltaY > 30) {
        hasMoved = true;
      }
    };

    const handleUp = (upEvent: MouseEvent) => {
      if (hasMoved && windows.preview.docked) {
        undockWindow('preview', { x: upEvent.clientX - 300, y: upEvent.clientY - 20 });
        setShowPreview(false);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-background">
        <IDEHeader 
          showFileExplorer={showFileExplorer && windows.fileExplorer.docked}
          showPreview={showPreview && windows.preview.docked}
          onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
          onTogglePreview={() => setShowPreview(!showPreview)}
        />

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="flex-row-reverse">
            {showFileExplorer && windows.fileExplorer.docked && windows.fileExplorer.visible && (
              <>
                <ResizablePanel 
                  defaultSize={20} 
                  minSize={12} 
                  maxSize={40}
                  collapsible
                  collapsedSize={0}
                  onCollapse={() => setShowFileExplorer(false)}
                >
                  <div className="h-full flex flex-col">
                    {/* Draggable header for undocking */}
                    <div 
                      ref={fileExplorerHeaderRef}
                      className="flex items-center gap-2 px-3 py-2 bg-ide-tab border-b border-border/50 cursor-move select-none hover:bg-ps2-cyan/5 transition-colors group"
                      onMouseDown={handleFileExplorerDrag}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-ps2-cyan transition-colors" />
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-ps2-cyan transition-colors">EXPLORADOR</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <FileExplorer 
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onProjectLoad={setProjectFiles}
                      />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-ps2-purple/50 transition-all duration-200 data-[resize-handle-state=hover]:w-2 data-[resize-handle-state=drag]:w-2 data-[resize-handle-state=drag]:bg-ps2-purple group relative">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-ps2-purple/20 group-hover:bg-ps2-purple/40 transition-all" />
                </ResizableHandle>
              </>
            )}
            
            <ResizablePanel defaultSize={showFileExplorer && windows.fileExplorer.docked && windows.fileExplorer.visible ? 80 : 100}>
              <ResizablePanelGroup direction="horizontal" className="flex-row-reverse">
                <ResizablePanel 
                  defaultSize={showPreview && windows.preview.docked && windows.preview.visible ? 50 : 100}
                  minSize={30}
                >
                  {selectedFile && isImageFile(selectedFile.name) ? (
                    <ImageViewer
                      imageData={selectedFile.content || ''}
                      filename={selectedFile.name}
                    />
                  ) : (
                    <CodeEditor
                      code={code}
                      onChange={handleCodeChange}
                      onRun={handleRun}
                      openTabs={openTabs}
                      activeTabIndex={activeTabIndex}
                      onTabChange={handleTabChange}
                      onTabClose={handleTabClose}
                      onFileRename={handleFileRename}
                      onTabReorder={handleTabReorder}
                    />
                  )}
                </ResizablePanel>
                
                {showPreview && windows.preview.docked && windows.preview.visible && (
                  <>
                    <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-ps2-purple/50 transition-all duration-200 data-[resize-handle-state=hover]:w-2 data-[resize-handle-state=drag]:w-2 data-[resize-handle-state=drag]:bg-ps2-purple group relative">
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-ps2-purple/20 group-hover:bg-ps2-purple/40 transition-all" />
                    </ResizableHandle>
                    <ResizablePanel 
                      defaultSize={50} 
                      minSize={25}
                      maxSize={70}
                      collapsible
                      collapsedSize={0}
                      onCollapse={() => setShowPreview(false)}
                    >
                      <div className="h-full flex flex-col">
                        {/* Draggable header for undocking */}
                        <div 
                          ref={previewHeaderRef}
                          className="flex items-center justify-between bg-muted/50 border-b border-border px-3 py-1.5 cursor-move select-none hover:bg-ps2-cyan/5 transition-colors group"
                          onMouseDown={handlePreviewDrag}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-ps2-cyan transition-colors" />
                            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-xs font-medium group-hover:text-ps2-cyan transition-colors">VISTA PREVIA PS2</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => setShowPreview(false)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <PS2Preview
                            code={code}
                            isRunning={isRunning}
                            onToggleRun={handleToggleRun}
                            files={projectFiles}
                          />
                        </div>
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <IDEStatusBar 
          selectedFile={selectedFile.name}
          isRunning={isRunning}
          lineCount={code.split('\n').length}
        />
      </div>

      {/* Floating Windows */}
      {!windows.fileExplorer.docked && windows.fileExplorer.visible && (
        <FloatingWindow
          id="fileExplorer"
          title="Explorador de Archivos"
          onClose={() => setShowFileExplorer(false)}
        >
          <FileExplorer 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onProjectLoad={setProjectFiles}
          />
        </FloatingWindow>
      )}

      {!windows.preview.docked && windows.preview.visible && (
        <FloatingWindow
          id="preview"
          title="Vista Previa PS2"
          onClose={() => setShowPreview(false)}
        >
          <PS2Preview
            code={code}
            isRunning={isRunning}
            onToggleRun={handleToggleRun}
            files={projectFiles}
          />
        </FloatingWindow>
      )}
    </>
  );
}
