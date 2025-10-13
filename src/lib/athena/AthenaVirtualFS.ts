// Virtual File System for AthenaEnv scripts
// Simulates PS2 file system operations in browser

export interface VirtualFile {
  name: string;
  type: 'file' | 'directory';
  content?: string | ArrayBuffer;
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

    let dir = this.getNode(dirPath);
    if (!dir || dir.type !== 'directory') {
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
    const file = this.getNode(path);
    if (!file || file.type !== 'file') {
      return null;
    }
    return file.content || null;
  }

  // Check if file exists
  exists(path: string): boolean {
    return this.getNode(path) !== null;
  }

  // Create directory
  mkdir(path: string): number {
    path = this.normalizePath(path);
    const parts = path.split('/').filter(p => p);
    const dirname = parts.pop()!;
    const parentPath = '/' + parts.join('/');

    let parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory') {
      return -1; // ENOENT
    }

    if (!parent.children) {
      parent.children = new Map();
    }

    if (parent.children.has(dirname)) {
      return -1; // EEXIST
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

  // Load all project files
  loadProjectFiles(files: Array<{ path: string; content: string }>) {
    for (const file of files) {
      this.writeFile(file.path, file.content);
    }
  }
}
