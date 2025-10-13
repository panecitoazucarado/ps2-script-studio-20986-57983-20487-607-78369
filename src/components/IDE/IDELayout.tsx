import { useState, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { PS2Preview } from './PS2Preview';
import { IDEHeader } from './IDEHeader';
import { IDEStatusBar } from './IDEStatusBar';
import { FileNode } from '@/types/athena';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function IDELayout() {
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
      // Check if file is already open
      const existingTabIndex = openTabs.findIndex(tab => tab.path === file.path);
      
      if (existingTabIndex !== -1) {
        // Switch to existing tab
        setActiveTabIndex(existingTabIndex);
        setCode(openTabs[existingTabIndex].content || '');
      } else {
        // Open new tab
        setOpenTabs((prev: FileNode[]) => [...prev, file]);
        setActiveTabIndex(openTabs.length);
        setCode(file.content || '');
      }
      setIsRunning(false);
    }
  }, [openTabs, setOpenTabs]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Update the file content in the active tab
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
    if (openTabs.length === 1) return; // Don't close last tab
    
    const newTabs = openTabs.filter((_, idx) => idx !== index);
    setOpenTabs(newTabs);
    
    // Adjust active tab index
    let newActiveIndex = activeTabIndex;
    if (activeTabIndex === index) {
      // If closing active tab, switch to the one on the left or right
      newActiveIndex = index > 0 ? index - 1 : 0;
    } else if (activeTabIndex > index) {
      newActiveIndex = activeTabIndex - 1;
    }
    
    setActiveTabIndex(newActiveIndex);
    setCode(newTabs[newActiveIndex].content || '');
  }, [openTabs, activeTabIndex, setOpenTabs]);

  const handleFileRename = useCallback((index: number, newName: string) => {
    if (!newName.trim()) return;
    setOpenTabs((prev: FileNode[]) => prev.map((tab, idx) => 
      idx === index ? { ...tab, name: newName, path: tab.path.replace(tab.name, newName) } : tab
    ));
  }, [setOpenTabs]);

  const handleRun = useCallback(() => {
    setShowPreview(true); // Auto-open preview when running
    setIsRunning(true);
  }, []);

  const handleToggleRun = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* IDE Header */}
      <IDEHeader 
        showFileExplorer={showFileExplorer}
        showPreview={showPreview}
        onToggleFileExplorer={() => setShowFileExplorer(!showFileExplorer)}
        onTogglePreview={() => setShowPreview(!showPreview)}
      />

      {/* Main IDE Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer - Collapsible */}
          {showFileExplorer && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                <FileExplorer 
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onProjectLoad={setProjectFiles}
                />
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-border hover:bg-accent transition-colors" />
            </>
          )}
          
          {/* Editor + Preview */}
          <ResizablePanel defaultSize={showFileExplorer ? 80 : 100}>
            <ResizablePanelGroup direction="horizontal">
              {/* Code Editor or Image Viewer */}
              <ResizablePanel defaultSize={showPreview ? 50 : 100}>
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
                  />
                )}
              </ResizablePanel>
              
              {/* PS2 Preview - Collapsible with Tab */}
              {showPreview && (
                <>
                  <ResizableHandle className="w-1 bg-border hover:bg-accent transition-colors" />
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                      {/* Preview Tab */}
                      <div className="flex items-center justify-between bg-muted/50 border-b border-border px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span className="text-xs font-medium">Vista Previa PS2</span>
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
                      
                      {/* Preview Content */}
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

      {/* IDE Status Bar */}
      <IDEStatusBar 
        selectedFile={selectedFile.name}
        isRunning={isRunning}
        lineCount={code.split('\n').length}
      />
    </div>
  );
}