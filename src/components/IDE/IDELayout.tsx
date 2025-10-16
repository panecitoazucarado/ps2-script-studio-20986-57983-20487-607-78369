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
import { WindowDockingProvider, useWindowDocking } from '@/contexts/WindowDockingContext';

import { IDELayoutContent } from './IDELayoutContent';

export function IDELayout() {
  return (
    <WindowDockingProvider>
      <IDELayoutContent />
    </WindowDockingProvider>
  );
}