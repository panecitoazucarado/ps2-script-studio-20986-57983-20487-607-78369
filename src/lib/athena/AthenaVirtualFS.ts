// Virtual File System for AthenaEnv scripts
// Simulates PS2 file system operations in browser
// Enhanced with project file system integration

import type { FileNode } from '@/types/athena';

export interface VirtualFile {
  name: string;
  type: 'file' | 'directory';
  content?: string | ArrayBuffer;
  mimeType?: string;
  children?: Map<string, VirtualFile>;
  size: number;
  atime: number;
  mtime: number;
  ctime: number;
}

export class AthenaVirtualFS {
  private root: VirtualFile;
  private cwd: string = '/';
  private fileHandles: Map<number, { file: VirtualFile; position: number; flags: string }> = new Map();
  private nextFd: number = 3; // 0=stdin, 1=stdout, 2=stderr
  private projectFiles: Map<string, { content: string; mimeType?: string }> = new Map();

  constructor() {
    this.root = {
      name: '/',
      type: 'directory',
      children: new Map(),
      size: 0,
      atime: Date.now(),
      mtime: Date.now(),
      ctime: Date.now()
    };

    // Create default directories
    this.mkdir('/PS2DATA');
    this.mkdir('/PS2DATA/DATA');
    this.mkdir('/PS2DATA/DATA/SCRIPTS');
    this.mkdir('/PS2DATA/DATA/IMAGES');
    this.mkdir('/PS2DATA/DATA/SOUNDS');
    this.mkdir('/PS2DATA/DATA/FONTS');
  }

  // Load project files from FileNode structure (from FileExplorer)
  loadProjectFiles(nodes: FileNode[], basePath: string = '') {
    const loadRecursive = (nodeList: FileNode[], currentPath: string) => {
      for (const node of nodeList) {
        const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
        const normalizedPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
        
        if (node.type === 'folder') {
          // Create directory in VFS
          this.mkdirp(normalizedPath);
          
          // Process children
          if (node.children) {
            loadRecursive(node.children, normalizedPath);
          }
        } else if (node.type === 'file' && node.content !== undefined) {
          // Determine MIME type
          const mimeType = this.getMimeType(node.name);
          
          // Store in project files map for quick lookup
          this.projectFiles.set(normalizedPath, { 
            content: node.content, 
            mimeType 
          });
          
          // Also store without leading slash for flexible matching
          const withoutSlash = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
          this.projectFiles.set(withoutSlash, { 
            content: node.content, 
            mimeType 
          });
          
          // Write to VFS
          this.writeFile(normalizedPath, node.content);
        }
      }
    };
    
    loadRecursive(nodes, basePath);
  }

  // Get MIME type from filename
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'tga': 'image/x-tga',
      'dds': 'image/vnd-ms.dds',
      
      // Audio
      'adp': 'audio/adpcm',
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      
      // Fonts
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      
      // Text/Code
      'js': 'application/javascript',
      'ts': 'text/typescript',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'css': 'text/css',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'c': 'text/x-c',
      'cpp': 'text/x-c++src',
      'h': 'text/x-c',
      'hpp': 'text/x-c++hdr',
      
      // Binary
      'elf': 'application/x-elf',
      'irx': 'application/octet-stream',
      'bin': 'application/octet-stream',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Recursively create directories
  mkdirp(path: string): boolean {
    path = this.normalizePath(path);
    const parts = path.split('/').filter(p => p);
    let currentPath = '';
    
    for (const part of parts) {
      currentPath += '/' + part;
      if (!this.exists(currentPath)) {
        const result = this.mkdir(currentPath);
        if (result < 0) return false;
      }
    }
    return true;
  }

  // Resolve a relative path (like "pong/unpause.adp") to find the file
  resolvePath(relativePath: string): string | null {
    // Normalize the path
    let normalized = relativePath.replace(/\\/g, '/');
    
    // Remove leading ./ or /
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }
    
    // Try multiple path variations
    const variations = [
      normalized,
      `/${normalized}`,
      `${this.cwd}/${normalized}`,
      `/PS2DATA/${normalized}`,
      `/PS2DATA/DATA/${normalized}`,
    ];
    
    for (const path of variations) {
      const normalizedPath = this.normalizePath(path);
      if (this.exists(normalizedPath)) {
        return normalizedPath;
      }
      // Also check project files map
      if (this.projectFiles.has(normalizedPath) || this.projectFiles.has(normalized)) {
        return normalizedPath;
      }
    }
    
    return null;
  }

  // Get file content by relative path (for Sound.load, Image, Font, etc.)
  getAsset(relativePath: string): { content: string | ArrayBuffer | null; mimeType: string } | null {
    // Normalize path
    let normalized = relativePath.replace(/\\/g, '/');
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }
    
    // Check project files first (exact match)
    if (this.projectFiles.has(normalized)) {
      const file = this.projectFiles.get(normalized)!;
      return { content: file.content, mimeType: file.mimeType || 'application/octet-stream' };
    }
    
    // Try with leading slash
    const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
    if (this.projectFiles.has(withSlash)) {
      const file = this.projectFiles.get(withSlash)!;
      return { content: file.content, mimeType: file.mimeType || 'application/octet-stream' };
    }
    
    // Try VFS
    const resolvedPath = this.resolvePath(relativePath);
    if (resolvedPath) {
      const content = this.readFile(resolvedPath);
      return { 
        content, 
        mimeType: this.getMimeType(relativePath)
      };
    }
    
    return null;
  }

  // Check if a path exists in the project (for autocomplete suggestions)
  pathExists(relativePath: string): boolean {
    return this.resolvePath(relativePath) !== null;
  }

  // Get all available paths (for autocomplete)
  getAllPaths(): string[] {
    return Array.from(this.projectFiles.keys());
  }

  // Get paths matching a pattern (for autocomplete)
  getMatchingPaths(pattern: string): string[] {
    const normalizedPattern = pattern.toLowerCase().replace(/\\/g, '/');
    return Array.from(this.projectFiles.keys())
      .filter(path => path.toLowerCase().includes(normalizedPattern));
  }

  // Normalize path
  private normalizePath(path: string): string {
    if (!path.startsWith('/')) {
      path = this.cwd + (this.cwd.endsWith('/') ? '' : '/') + path;
    }
    
    const parts = path.split('/').filter(p => p && p !== '.');
    const normalized: string[] = [];
    
    for (const part of parts) {
      if (part === '..') {
        normalized.pop();
      } else {
        normalized.push(part);
      }
    }
    
    return '/' + normalized.join('/');
  }

  // Get file node from path
  private getNode(path: string): VirtualFile | null {
    path = this.normalizePath(path);
    if (path === '/') return this.root;

    const parts = path.split('/').filter(p => p);
    let current = this.root;

    for (const part of parts) {
      if (!current.children || !current.children.has(part)) {
        return null;
      }
      current = current.children.get(part)!;
    }

    return current;
  }

  // Create file
  writeFile(path: string, content: string | ArrayBuffer): boolean {
    path = this.normalizePath(path);
    const parts = path.split('/').filter(p => p);
    const filename = parts.pop()!;
    const dirPath = '/' + parts.join('/');

    // Ensure directory exists
    if (!this.exists(dirPath) && dirPath !== '/') {
      this.mkdirp(dirPath);
    }

    let dir = this.getNode(dirPath) || this.root;
    if (dir.type !== 'directory') {
      return false;
    }

    if (!dir.children) {
      dir.children = new Map();
    }

    const now = Date.now();
    const file: VirtualFile = {
      name: filename,
      type: 'file',
      content,
      mimeType: this.getMimeType(filename),
      size: typeof content === 'string' ? content.length : content.byteLength,
      atime: now,
      mtime: now,
      ctime: now
    };

    dir.children.set(filename, file);
    return true;
  }

  // Read file
  readFile(path: string): string | ArrayBuffer | null {
    // Check project files first
    const normalized = path.replace(/\\/g, '/');
    if (this.projectFiles.has(normalized)) {
      return this.projectFiles.get(normalized)!.content;
    }
    
    const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
    if (this.projectFiles.has(withSlash)) {
      return this.projectFiles.get(withSlash)!.content;
    }
    
    // Fallback to VFS
    const file = this.getNode(path);
    if (!file || file.type !== 'file') {
      return null;
    }
    return file.content || null;
  }

  // Check if file exists
  exists(path: string): boolean {
    // Check project files
    const normalized = path.replace(/\\/g, '/');
    if (this.projectFiles.has(normalized)) return true;
    
    const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
    if (this.projectFiles.has(withSlash)) return true;
    
    // Check VFS
    return this.getNode(path) !== null;
  }

  // Create directory
  mkdir(path: string): number {
    path = this.normalizePath(path);
    const parts = path.split('/').filter(p => p);
    const dirname = parts.pop()!;
    const parentPath = '/' + parts.join('/');

    let parent = this.getNode(parentPath) || this.root;
    if (parent.type !== 'directory') {
      return -1; // ENOENT
    }

    if (!parent.children) {
      parent.children = new Map();
    }

    if (parent.children.has(dirname)) {
      return 0; // Already exists, that's okay
    }

    const now = Date.now();
    parent.children.set(dirname, {
      name: dirname,
      type: 'directory',
      children: new Map(),
      size: 0,
      atime: now,
      mtime: now,
      ctime: now
    });

    return 0;
  }

  // List directory
  readdir(path: string): string[] | null {
    const dir = this.getNode(path);
    if (!dir || dir.type !== 'directory' || !dir.children) {
      return null;
    }
    return Array.from(dir.children.keys());
  }

  // Get file stats
  stat(path: string): any | null {
    const file = this.getNode(path);
    if (!file) return null;

    return {
      dev: 0,
      ino: 0,
      mode: file.type === 'directory' ? 0o040755 : 0o100644,
      nlink: 1,
      uid: 0,
      gid: 0,
      rdev: 0,
      size: file.size,
      blocks: Math.ceil(file.size / 512),
      atime: file.atime,
      mtime: file.mtime,
      ctime: file.ctime
    };
  }

  // Remove file/directory
  remove(path: string): number {
    path = this.normalizePath(path);
    const parts = path.split('/').filter(p => p);
    const name = parts.pop()!;
    const parentPath = '/' + parts.join('/');

    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory' || !parent.children) {
      return -1;
    }

    if (!parent.children.has(name)) {
      return -1;
    }

    parent.children.delete(name);
    
    // Also remove from project files
    this.projectFiles.delete(path);
    this.projectFiles.delete(path.slice(1)); // Without leading slash
    
    return 0;
  }

  // Open file (POSIX-like)
  open(path: string, flags: string): number {
    const file = this.getNode(path);
    
    // Handle write modes
    if (flags.includes('w')) {
      if (!file) {
        this.writeFile(path, '');
      }
    }

    if (!file && !flags.includes('w')) {
      return -1;
    }

    const fd = this.nextFd++;
    this.fileHandles.set(fd, {
      file: this.getNode(path)!,
      position: flags.includes('a') ? (file?.size || 0) : 0,
      flags
    });

    return fd;
  }

  // Close file descriptor
  close(fd: number): number {
    if (!this.fileHandles.has(fd)) {
      return -1;
    }
    this.fileHandles.delete(fd);
    return 0;
  }

  // Read from file descriptor
  read(fd: number, length: number): ArrayBuffer | null {
    const handle = this.fileHandles.get(fd);
    if (!handle || !handle.file.content) {
      return null;
    }

    const content = handle.file.content;
    const start = handle.position;
    const end = Math.min(start + length, handle.file.size);

    let result: ArrayBuffer;
    if (typeof content === 'string') {
      const encoder = new TextEncoder();
      const full = encoder.encode(content);
      result = full.slice(start, end).buffer;
    } else {
      result = content.slice(start, end);
    }

    handle.position = end;
    return result;
  }

  // Write to file descriptor
  write(fd: number, data: ArrayBuffer | string): number {
    const handle = this.fileHandles.get(fd);
    if (!handle) {
      return -1;
    }

    const content = typeof data === 'string' ? data : new TextDecoder().decode(data);
    
    if (handle.flags.includes('a')) {
      // Append mode
      const existing = handle.file.content || '';
      handle.file.content = (typeof existing === 'string' ? existing : new TextDecoder().decode(existing)) + content;
    } else {
      // Write mode
      handle.file.content = content;
    }

    const fileContent = handle.file.content;
    handle.file.size = typeof fileContent === 'string' 
      ? fileContent.length 
      : (fileContent as ArrayBuffer).byteLength;
    handle.file.mtime = Date.now();

    return typeof data === 'string' ? data.length : data.byteLength;
  }

  // Seek in file
  seek(fd: number, offset: number, whence: number): number {
    const handle = this.fileHandles.get(fd);
    if (!handle) {
      return -1;
    }

    switch (whence) {
      case 0: // SEEK_SET
        handle.position = offset;
        break;
      case 1: // SEEK_CUR
        handle.position += offset;
        break;
      case 2: // SEEK_END
        handle.position = handle.file.size + offset;
        break;
    }

    return handle.position;
  }

  // Get current working directory
  getcwd(): string {
    return this.cwd;
  }

  // Change directory
  chdir(path: string): number {
    const dir = this.getNode(path);
    if (!dir || dir.type !== 'directory') {
      return -1;
    }
    this.cwd = this.normalizePath(path);
    return 0;
  }

  // Clear all project files
  clearProjectFiles() {
    this.projectFiles.clear();
  }

  // Get project file count
  getProjectFileCount(): number {
    return this.projectFiles.size;
  }
}
