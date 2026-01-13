import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Terminal, 
  X, 
  Maximize2, 
  Minimize2, 
  Plus, 
  ChevronDown,
  Trash2,
  HardDrive,
  FolderOpen,
  AlertTriangle,
  Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileNode } from '@/types/athena';

// ==================== LOCALIZATION SYSTEM ====================
type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | 'ru' | 'it';

interface Translations {
  welcome: {
    title: string;
    subtitle: string;
    helpHint: string;
  };
  commands: {
    notFound: string;
    helpHint: string;
    missingOperand: string;
    noSuchFile: string;
    noSuchDirectory: string;
    permissionDenied: string;
  };
  help: {
    title: string;
    navigation: string;
    repoManagement: string;
    development: string;
    terminal: string;
    system: string;
    shortcuts: string;
  };
  repos: {
    title: string;
    empty: string;
    cloneHint: string;
    path: string;
    files: string;
    folders: string;
    size: string;
    cloned: string;
    storageSummary: string;
    total: string;
    cleanWarning: string;
    cleanSuccess: string;
    cleanStorageCleared: string;
  };
  delete: {
    title: string;
    confirm: string;
    willRemove: string;
    freeSpace: string;
    cancel: string;
    deleteBtn: string;
    noSuchRepo: string;
    useReposHint: string;
    usageHint: string;
  };
  language: {
    title: string;
    current: string;
    changed: string;
    available: string;
  };
  status: {
    running: string;
    cancelHint: string;
    switchedTo: string;
    newSession: string;
  };
  storage: {
    repos: string;
    files: string;
    cleanAll: string;
    diskUsage: string;
  };
  build: {
    ps2Title: string;
    compiling: string;
    linking: string;
    processing: string;
    generating: string;
    complete: string;
    starting: string;
    emulatorStarted: string;
    entering: string;
    success: string;
  };
  npm: {
    installing: string;
    added: string;
    audited: string;
    funding: string;
    complete: string;
    executed: string;
    notRecognized: string;
  };
  git: {
    initializing: string;
    notCommand: string;
    onBranch: string;
    nothingToCommit: string;
    initialCommit: string;
  };
  find: {
    noResults: string;
    moreResults: string;
    missingPattern: string;
  };
  tree: {
    directory: string;
  };
  env: {
    set: string;
    unset: string;
    empty: string;
  };
  alias: {
    set: string;
    removed: string;
    notFound: string;
    list: string;
    empty: string;
  };
  grep: {
    missingPattern: string;
    missingFile: string;
    noMatches: string;
    moreMatches: string;
  };
  touch: {
    missingOperand: string;
    created: string;
    simulated: string;
  };
  mkdir: {
    missingOperand: string;
    created: string;
    simulated: string;
  };
  chmod: {
    usage: string;
    changed: string;
    simulated: string;
  };
  export: {
    set: string;
    usage: string;
  };
  time: {
    elapsed: string;
  };
  which: {
    notFound: string;
  };
  man: {
    noManual: string;
    pages: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    welcome: {
      title: 'ATHENA IDE Terminal',
      subtitle: 'PlayStation 2 Homebrew Development',
      helpHint: 'Type "help" for available commands or "repos" to manage cloned repositories.',
    },
    commands: {
      notFound: 'command not found',
      helpHint: 'Type "help" for available commands',
      missingOperand: 'missing operand',
      noSuchFile: 'No such file',
      noSuchDirectory: 'No such file or directory',
      permissionDenied: 'Permission denied',
    },
    help: {
      title: 'ATHENA Terminal Commands',
      navigation: 'Navigation & File System',
      repoManagement: 'Repository Management',
      development: 'Development Tools',
      terminal: 'Terminal Control',
      system: 'System Commands',
      shortcuts: 'Shortcuts: ↑↓ History | Tab Autocomplete | Ctrl+C Cancel | Ctrl+L Clear',
    },
    repos: {
      title: 'Cloned Repositories',
      empty: 'No repositories cloned yet.',
      cloneHint: 'Use "git clone <url>" to clone a GitHub repository.',
      path: 'Path',
      files: 'Files',
      folders: 'Folders',
      size: 'Size',
      cloned: 'Cloned',
      storageSummary: 'Storage Summary',
      total: 'Total',
      cleanWarning: 'WARNING: This will delete all cloned repository data!',
      cleanSuccess: 'All cloned repository data has been removed.',
      cleanStorageCleared: 'Browser storage cleared. File explorer will be empty on next refresh.',
    },
    delete: {
      title: 'Delete Repository',
      confirm: 'Are you sure you want to delete',
      willRemove: 'This will remove',
      freeSpace: 'files and free',
      cancel: 'Cancel',
      deleteBtn: 'Delete Repository',
      noSuchRepo: 'No such repository',
      useReposHint: 'Use "repos" to list available repositories',
      usageHint: 'Usage: rm -rf <repository-name>',
    },
    language: {
      title: 'Terminal Language',
      current: 'Current language',
      changed: 'Language changed to',
      available: 'Available languages',
    },
    status: {
      running: 'Running...',
      cancelHint: 'Ctrl+C to cancel',
      switchedTo: 'Switched to',
      newSession: 'New session',
    },
    storage: {
      repos: 'repos',
      files: 'files',
      cleanAll: 'Clean All',
      diskUsage: 'Disk Usage (Virtual File System)',
    },
    build: {
      ps2Title: 'PS2 Build System v1.0',
      compiling: 'Compiling EE Core modules...',
      linking: 'Linking PS2SDK libraries...',
      processing: 'Processing VU microcode...',
      generating: 'Generating ELF executable...',
      complete: 'Build completed',
      starting: 'Starting PS2 Emulator...',
      emulatorStarted: 'Emulator started successfully',
      entering: 'Entering directory...',
      success: 'Build successful',
    },
    npm: {
      installing: 'Installing dependencies...',
      added: 'added',
      audited: 'packages, and audited',
      funding: 'packages are looking for funding',
      complete: 'npm install completed successfully',
      executed: 'Script executed successfully',
      notRecognized: 'is not a recognized command',
    },
    git: {
      initializing: 'Initializing clone for',
      notCommand: 'is not a git command',
      onBranch: 'On branch main',
      nothingToCommit: 'nothing to commit, working tree clean',
      initialCommit: 'Initial commit',
    },
    find: {
      noResults: 'No files matching',
      moreResults: 'and more results',
      missingPattern: 'missing pattern',
    },
    tree: {
      directory: 'directories',
    },
    env: {
      set: 'Environment variable set',
      unset: 'Environment variable removed',
      empty: 'No environment variables set',
    },
    alias: {
      set: 'Alias set',
      removed: 'Alias removed',
      notFound: 'Alias not found',
      list: 'Defined aliases',
      empty: 'No aliases defined',
    },
    grep: {
      missingPattern: 'missing search pattern',
      missingFile: 'missing file operand',
      noMatches: 'No matches found',
      moreMatches: 'more matches',
    },
    touch: {
      missingOperand: 'missing file operand',
      created: 'File created',
      simulated: 'simulated',
    },
    mkdir: {
      missingOperand: 'missing directory operand',
      created: 'Directory created',
      simulated: 'simulated',
    },
    chmod: {
      usage: 'Usage: chmod <mode> <file>',
      changed: 'Permissions changed',
      simulated: 'simulated',
    },
    export: {
      set: 'Exported',
      usage: 'Usage: export VAR=value',
    },
    time: {
      elapsed: 'Elapsed time',
    },
    which: {
      notFound: 'not found',
    },
    man: {
      noManual: 'No manual entry for',
      pages: 'Available manual pages',
    },
  },
  es: {
    welcome: {
      title: 'Terminal ATHENA IDE',
      subtitle: 'Desarrollo Homebrew para PlayStation 2',
      helpHint: 'Escribe "help" para ver los comandos disponibles o "repos" para gestionar repositorios clonados.',
    },
    commands: {
      notFound: 'comando no encontrado',
      helpHint: 'Escribe "help" para ver los comandos disponibles',
      missingOperand: 'falta operando',
      noSuchFile: 'Archivo no encontrado',
      noSuchDirectory: 'Archivo o directorio no encontrado',
      permissionDenied: 'Permiso denegado',
    },
    help: {
      title: 'Comandos del Terminal ATHENA',
      navigation: 'Navegación y Sistema de Archivos',
      repoManagement: 'Gestión de Repositorios',
      development: 'Herramientas de Desarrollo',
      terminal: 'Control del Terminal',
      system: 'Comandos del Sistema',
      shortcuts: 'Atajos: ↑↓ Historial | Tab Autocompletar | Ctrl+C Cancelar | Ctrl+L Limpiar',
    },
    repos: {
      title: 'Repositorios Clonados',
      empty: 'No hay repositorios clonados aún.',
      cloneHint: 'Usa "git clone <url>" para clonar un repositorio de GitHub.',
      path: 'Ruta',
      files: 'Archivos',
      folders: 'Carpetas',
      size: 'Tamaño',
      cloned: 'Clonado',
      storageSummary: 'Resumen de Almacenamiento',
      total: 'Total',
      cleanWarning: '¡ADVERTENCIA: Esto eliminará todos los datos de repositorios clonados!',
      cleanSuccess: 'Todos los datos de repositorios clonados han sido eliminados.',
      cleanStorageCleared: 'Almacenamiento del navegador limpiado. El explorador de archivos estará vacío al recargar.',
    },
    delete: {
      title: 'Eliminar Repositorio',
      confirm: '¿Estás seguro de que deseas eliminar',
      willRemove: 'Esto eliminará',
      freeSpace: 'archivos y liberará',
      cancel: 'Cancelar',
      deleteBtn: 'Eliminar Repositorio',
      noSuchRepo: 'Repositorio no encontrado',
      useReposHint: 'Usa "repos" para listar los repositorios disponibles',
      usageHint: 'Uso: rm -rf <nombre-repositorio>',
    },
    language: {
      title: 'Idioma del Terminal',
      current: 'Idioma actual',
      changed: 'Idioma cambiado a',
      available: 'Idiomas disponibles',
    },
    status: {
      running: 'Ejecutando...',
      cancelHint: 'Ctrl+C para cancelar',
      switchedTo: 'Cambiado a',
      newSession: 'Nueva sesión',
    },
    storage: {
      repos: 'repositorios',
      files: 'archivos',
      cleanAll: 'Limpiar Todo',
      diskUsage: 'Uso de Disco (Sistema de Archivos Virtual)',
    },
    build: {
      ps2Title: 'Sistema de Compilación PS2 v1.0',
      compiling: 'Compilando módulos EE Core...',
      linking: 'Enlazando bibliotecas PS2SDK...',
      processing: 'Procesando microcódigo VU...',
      generating: 'Generando ejecutable ELF...',
      complete: 'Compilación completada',
      starting: 'Iniciando Emulador PS2...',
      emulatorStarted: 'Emulador iniciado exitosamente',
      entering: 'Entrando al directorio...',
      success: 'Compilación exitosa',
    },
    npm: {
      installing: 'Instalando dependencias...',
      added: 'agregados',
      audited: 'paquetes, y auditados',
      funding: 'paquetes buscan financiamiento',
      complete: 'npm install completado exitosamente',
      executed: 'Script ejecutado exitosamente',
      notRecognized: 'no es un comando reconocido',
    },
    git: {
      initializing: 'Inicializando clonación para',
      notCommand: 'no es un comando git',
      onBranch: 'En la rama main',
      nothingToCommit: 'nada para hacer commit, árbol de trabajo limpio',
      initialCommit: 'Commit inicial',
    },
    find: {
      noResults: 'No se encontraron archivos que coincidan con',
      moreResults: 'y más resultados',
      missingPattern: 'falta patrón',
    },
    tree: {
      directory: 'directorios',
    },
    env: {
      set: 'Variable de entorno establecida',
      unset: 'Variable de entorno eliminada',
      empty: 'No hay variables de entorno establecidas',
    },
    alias: {
      set: 'Alias establecido',
      removed: 'Alias eliminado',
      notFound: 'Alias no encontrado',
      list: 'Alias definidos',
      empty: 'No hay alias definidos',
    },
    grep: {
      missingPattern: 'falta patrón de búsqueda',
      missingFile: 'falta operando de archivo',
      noMatches: 'No se encontraron coincidencias',
      moreMatches: 'más coincidencias',
    },
    touch: {
      missingOperand: 'falta operando de archivo',
      created: 'Archivo creado',
      simulated: 'simulado',
    },
    mkdir: {
      missingOperand: 'falta operando de directorio',
      created: 'Directorio creado',
      simulated: 'simulado',
    },
    chmod: {
      usage: 'Uso: chmod <modo> <archivo>',
      changed: 'Permisos cambiados',
      simulated: 'simulado',
    },
    export: {
      set: 'Exportado',
      usage: 'Uso: export VAR=valor',
    },
    time: {
      elapsed: 'Tiempo transcurrido',
    },
    which: {
      notFound: 'no encontrado',
    },
    man: {
      noManual: 'No hay entrada de manual para',
      pages: 'Páginas de manual disponibles',
    },
  },
  pt: {
    welcome: {
      title: 'Terminal ATHENA IDE',
      subtitle: 'Desenvolvimento Homebrew para PlayStation 2',
      helpHint: 'Digite "help" para comandos disponíveis ou "repos" para gerenciar repositórios clonados.',
    },
    commands: {
      notFound: 'comando não encontrado',
      helpHint: 'Digite "help" para comandos disponíveis',
      missingOperand: 'falta operando',
      noSuchFile: 'Arquivo não encontrado',
      noSuchDirectory: 'Arquivo ou diretório não encontrado',
      permissionDenied: 'Permissão negada',
    },
    help: {
      title: 'Comandos do Terminal ATHENA',
      navigation: 'Navegação e Sistema de Arquivos',
      repoManagement: 'Gerenciamento de Repositórios',
      development: 'Ferramentas de Desenvolvimento',
      terminal: 'Controle do Terminal',
      system: 'Comandos do Sistema',
      shortcuts: 'Atalhos: ↑↓ Histórico | Tab Autocompletar | Ctrl+C Cancelar | Ctrl+L Limpar',
    },
    repos: {
      title: 'Repositórios Clonados',
      empty: 'Nenhum repositório clonado ainda.',
      cloneHint: 'Use "git clone <url>" para clonar um repositório do GitHub.',
      path: 'Caminho',
      files: 'Arquivos',
      folders: 'Pastas',
      size: 'Tamanho',
      cloned: 'Clonado',
      storageSummary: 'Resumo de Armazenamento',
      total: 'Total',
      cleanWarning: 'AVISO: Isso excluirá todos os dados de repositórios clonados!',
      cleanSuccess: 'Todos os dados de repositórios clonados foram removidos.',
      cleanStorageCleared: 'Armazenamento do navegador limpo. O explorador de arquivos estará vazio ao recarregar.',
    },
    delete: {
      title: 'Excluir Repositório',
      confirm: 'Tem certeza de que deseja excluir',
      willRemove: 'Isso removerá',
      freeSpace: 'arquivos e liberará',
      cancel: 'Cancelar',
      deleteBtn: 'Excluir Repositório',
      noSuchRepo: 'Repositório não encontrado',
      useReposHint: 'Use "repos" para listar repositórios disponíveis',
      usageHint: 'Uso: rm -rf <nome-repositório>',
    },
    language: {
      title: 'Idioma do Terminal',
      current: 'Idioma atual',
      changed: 'Idioma alterado para',
      available: 'Idiomas disponíveis',
    },
    status: {
      running: 'Executando...',
      cancelHint: 'Ctrl+C para cancelar',
      switchedTo: 'Alterado para',
      newSession: 'Nova sessão',
    },
    storage: {
      repos: 'repositórios',
      files: 'arquivos',
      cleanAll: 'Limpar Tudo',
      diskUsage: 'Uso de Disco (Sistema de Arquivos Virtual)',
    },
    build: {
      ps2Title: 'Sistema de Build PS2 v1.0',
      compiling: 'Compilando módulos EE Core...',
      linking: 'Vinculando bibliotecas PS2SDK...',
      processing: 'Processando microcódigo VU...',
      generating: 'Gerando executável ELF...',
      complete: 'Build concluído',
      starting: 'Iniciando Emulador PS2...',
      emulatorStarted: 'Emulador iniciado com sucesso',
      entering: 'Entrando no diretório...',
      success: 'Build bem-sucedido',
    },
    npm: {
      installing: 'Instalando dependências...',
      added: 'adicionados',
      audited: 'pacotes, e auditados',
      funding: 'pacotes procuram financiamento',
      complete: 'npm install concluído com sucesso',
      executed: 'Script executado com sucesso',
      notRecognized: 'não é um comando reconhecido',
    },
    git: {
      initializing: 'Inicializando clone para',
      notCommand: 'não é um comando git',
      onBranch: 'No branch main',
      nothingToCommit: 'nada para commit, árvore de trabalho limpa',
      initialCommit: 'Commit inicial',
    },
    find: {
      noResults: 'Nenhum arquivo correspondente a',
      moreResults: 'e mais resultados',
      missingPattern: 'falta padrão',
    },
    tree: {
      directory: 'diretórios',
    },
    env: {
      set: 'Variável de ambiente definida',
      unset: 'Variável de ambiente removida',
      empty: 'Nenhuma variável de ambiente definida',
    },
    alias: {
      set: 'Alias definido',
      removed: 'Alias removido',
      notFound: 'Alias não encontrado',
      list: 'Aliases definidos',
      empty: 'Nenhum alias definido',
    },
    grep: {
      missingPattern: 'falta padrão de busca',
      missingFile: 'falta operando de arquivo',
      noMatches: 'Nenhuma correspondência encontrada',
      moreMatches: 'mais correspondências',
    },
    touch: {
      missingOperand: 'falta operando de arquivo',
      created: 'Arquivo criado',
      simulated: 'simulado',
    },
    mkdir: {
      missingOperand: 'falta operando de diretório',
      created: 'Diretório criado',
      simulated: 'simulado',
    },
    chmod: {
      usage: 'Uso: chmod <modo> <arquivo>',
      changed: 'Permissões alteradas',
      simulated: 'simulado',
    },
    export: {
      set: 'Exportado',
      usage: 'Uso: export VAR=valor',
    },
    time: {
      elapsed: 'Tempo decorrido',
    },
    which: {
      notFound: 'não encontrado',
    },
    man: {
      noManual: 'Nenhuma entrada de manual para',
      pages: 'Páginas de manual disponíveis',
    },
  },
  fr: {
    welcome: {
      title: 'Terminal ATHENA IDE',
      subtitle: 'Développement Homebrew PlayStation 2',
      helpHint: 'Tapez "help" pour les commandes disponibles ou "repos" pour gérer les dépôts clonés.',
    },
    commands: {
      notFound: 'commande introuvable',
      helpHint: 'Tapez "help" pour les commandes disponibles',
      missingOperand: 'opérande manquant',
      noSuchFile: 'Fichier introuvable',
      noSuchDirectory: 'Fichier ou répertoire introuvable',
      permissionDenied: 'Permission refusée',
    },
    help: {
      title: 'Commandes du Terminal ATHENA',
      navigation: 'Navigation et Système de Fichiers',
      repoManagement: 'Gestion des Dépôts',
      development: 'Outils de Développement',
      terminal: 'Contrôle du Terminal',
      system: 'Commandes Système',
      shortcuts: 'Raccourcis: ↑↓ Historique | Tab Autocomplétion | Ctrl+C Annuler | Ctrl+L Effacer',
    },
    repos: {
      title: 'Dépôts Clonés',
      empty: 'Aucun dépôt cloné pour le moment.',
      cloneHint: 'Utilisez "git clone <url>" pour cloner un dépôt GitHub.',
      path: 'Chemin',
      files: 'Fichiers',
      folders: 'Dossiers',
      size: 'Taille',
      cloned: 'Cloné',
      storageSummary: 'Résumé du Stockage',
      total: 'Total',
      cleanWarning: 'ATTENTION: Ceci supprimera toutes les données des dépôts clonés!',
      cleanSuccess: 'Toutes les données des dépôts clonés ont été supprimées.',
      cleanStorageCleared: 'Stockage du navigateur effacé. L\'explorateur sera vide au rechargement.',
    },
    delete: {
      title: 'Supprimer le Dépôt',
      confirm: 'Êtes-vous sûr de vouloir supprimer',
      willRemove: 'Ceci supprimera',
      freeSpace: 'fichiers et libérera',
      cancel: 'Annuler',
      deleteBtn: 'Supprimer le Dépôt',
      noSuchRepo: 'Dépôt introuvable',
      useReposHint: 'Utilisez "repos" pour lister les dépôts disponibles',
      usageHint: 'Usage: rm -rf <nom-dépôt>',
    },
    language: {
      title: 'Langue du Terminal',
      current: 'Langue actuelle',
      changed: 'Langue changée en',
      available: 'Langues disponibles',
    },
    status: {
      running: 'En cours...',
      cancelHint: 'Ctrl+C pour annuler',
      switchedTo: 'Changé pour',
      newSession: 'Nouvelle session',
    },
    storage: {
      repos: 'dépôts',
      files: 'fichiers',
      cleanAll: 'Tout Nettoyer',
      diskUsage: 'Utilisation du Disque (Système de Fichiers Virtuel)',
    },
    build: {
      ps2Title: 'Système de Build PS2 v1.0',
      compiling: 'Compilation des modules EE Core...',
      linking: 'Liaison des bibliothèques PS2SDK...',
      processing: 'Traitement du microcode VU...',
      generating: 'Génération de l\'exécutable ELF...',
      complete: 'Build terminé',
      starting: 'Démarrage de l\'émulateur PS2...',
      emulatorStarted: 'Émulateur démarré avec succès',
      entering: 'Entrée dans le répertoire...',
      success: 'Build réussi',
    },
    npm: {
      installing: 'Installation des dépendances...',
      added: 'ajoutés',
      audited: 'paquets, et audités',
      funding: 'paquets recherchent un financement',
      complete: 'npm install terminé avec succès',
      executed: 'Script exécuté avec succès',
      notRecognized: 'n\'est pas une commande reconnue',
    },
    git: {
      initializing: 'Initialisation du clone pour',
      notCommand: 'n\'est pas une commande git',
      onBranch: 'Sur la branche main',
      nothingToCommit: 'rien à commiter, arbre de travail propre',
      initialCommit: 'Commit initial',
    },
    find: {
      noResults: 'Aucun fichier correspondant à',
      moreResults: 'et plus de résultats',
      missingPattern: 'motif manquant',
    },
    tree: {
      directory: 'répertoires',
    },
    env: {
      set: 'Variable d\'environnement définie',
      unset: 'Variable d\'environnement supprimée',
      empty: 'Aucune variable d\'environnement définie',
    },
    alias: {
      set: 'Alias défini',
      removed: 'Alias supprimé',
      notFound: 'Alias introuvable',
      list: 'Alias définis',
      empty: 'Aucun alias défini',
    },
    grep: {
      missingPattern: 'motif de recherche manquant',
      missingFile: 'opérande de fichier manquant',
      noMatches: 'Aucune correspondance trouvée',
      moreMatches: 'plus de correspondances',
    },
    touch: {
      missingOperand: 'opérande de fichier manquant',
      created: 'Fichier créé',
      simulated: 'simulé',
    },
    mkdir: {
      missingOperand: 'opérande de répertoire manquant',
      created: 'Répertoire créé',
      simulated: 'simulé',
    },
    chmod: {
      usage: 'Usage: chmod <mode> <fichier>',
      changed: 'Permissions modifiées',
      simulated: 'simulé',
    },
    export: {
      set: 'Exporté',
      usage: 'Usage: export VAR=valeur',
    },
    time: {
      elapsed: 'Temps écoulé',
    },
    which: {
      notFound: 'introuvable',
    },
    man: {
      noManual: 'Pas d\'entrée de manuel pour',
      pages: 'Pages de manuel disponibles',
    },
  },
  de: {
    welcome: {
      title: 'ATHENA IDE Terminal',
      subtitle: 'PlayStation 2 Homebrew-Entwicklung',
      helpHint: 'Geben Sie "help" für verfügbare Befehle oder "repos" zur Verwaltung geklonter Repositories ein.',
    },
    commands: {
      notFound: 'Befehl nicht gefunden',
      helpHint: 'Geben Sie "help" für verfügbare Befehle ein',
      missingOperand: 'fehlender Operand',
      noSuchFile: 'Datei nicht gefunden',
      noSuchDirectory: 'Datei oder Verzeichnis nicht gefunden',
      permissionDenied: 'Zugriff verweigert',
    },
    help: {
      title: 'ATHENA Terminal-Befehle',
      navigation: 'Navigation & Dateisystem',
      repoManagement: 'Repository-Verwaltung',
      development: 'Entwicklungswerkzeuge',
      terminal: 'Terminal-Steuerung',
      system: 'Systembefehle',
      shortcuts: 'Tastenkürzel: ↑↓ Verlauf | Tab Autovervollständigung | Strg+C Abbrechen | Strg+L Löschen',
    },
    repos: {
      title: 'Geklonte Repositories',
      empty: 'Noch keine Repositories geklont.',
      cloneHint: 'Verwenden Sie "git clone <url>" um ein GitHub-Repository zu klonen.',
      path: 'Pfad',
      files: 'Dateien',
      folders: 'Ordner',
      size: 'Größe',
      cloned: 'Geklont',
      storageSummary: 'Speicherübersicht',
      total: 'Gesamt',
      cleanWarning: 'WARNUNG: Dies löscht alle geklonten Repository-Daten!',
      cleanSuccess: 'Alle geklonten Repository-Daten wurden entfernt.',
      cleanStorageCleared: 'Browserspeicher gelöscht. Der Datei-Explorer wird nach dem Neuladen leer sein.',
    },
    delete: {
      title: 'Repository Löschen',
      confirm: 'Sind Sie sicher, dass Sie löschen möchten',
      willRemove: 'Dies entfernt',
      freeSpace: 'Dateien und gibt frei',
      cancel: 'Abbrechen',
      deleteBtn: 'Repository Löschen',
      noSuchRepo: 'Repository nicht gefunden',
      useReposHint: 'Verwenden Sie "repos" um verfügbare Repositories aufzulisten',
      usageHint: 'Verwendung: rm -rf <repository-name>',
    },
    language: {
      title: 'Terminal-Sprache',
      current: 'Aktuelle Sprache',
      changed: 'Sprache geändert zu',
      available: 'Verfügbare Sprachen',
    },
    status: {
      running: 'Wird ausgeführt...',
      cancelHint: 'Strg+C zum Abbrechen',
      switchedTo: 'Gewechselt zu',
      newSession: 'Neue Sitzung',
    },
    storage: {
      repos: 'Repositories',
      files: 'Dateien',
      cleanAll: 'Alles Löschen',
      diskUsage: 'Festplattennutzung (Virtuelles Dateisystem)',
    },
    build: {
      ps2Title: 'PS2 Build-System v1.0',
      compiling: 'Kompiliere EE Core-Module...',
      linking: 'Verknüpfe PS2SDK-Bibliotheken...',
      processing: 'Verarbeite VU-Mikrocode...',
      generating: 'Generiere ELF-Executable...',
      complete: 'Build abgeschlossen',
      starting: 'Starte PS2-Emulator...',
      emulatorStarted: 'Emulator erfolgreich gestartet',
      entering: 'Betrete Verzeichnis...',
      success: 'Build erfolgreich',
    },
    npm: {
      installing: 'Installiere Abhängigkeiten...',
      added: 'hinzugefügt',
      audited: 'Pakete, und auditiert',
      funding: 'Pakete suchen Finanzierung',
      complete: 'npm install erfolgreich abgeschlossen',
      executed: 'Skript erfolgreich ausgeführt',
      notRecognized: 'ist kein erkannter Befehl',
    },
    git: {
      initializing: 'Initialisiere Klonen für',
      notCommand: 'ist kein git-Befehl',
      onBranch: 'Auf Branch main',
      nothingToCommit: 'nichts zu committen, Arbeitsbaum sauber',
      initialCommit: 'Initialer Commit',
    },
    find: {
      noResults: 'Keine Dateien gefunden, die übereinstimmen mit',
      moreResults: 'und weitere Ergebnisse',
      missingPattern: 'fehlendes Muster',
    },
    tree: {
      directory: 'Verzeichnisse',
    },
    env: {
      set: 'Umgebungsvariable gesetzt',
      unset: 'Umgebungsvariable entfernt',
      empty: 'Keine Umgebungsvariablen gesetzt',
    },
    alias: {
      set: 'Alias gesetzt',
      removed: 'Alias entfernt',
      notFound: 'Alias nicht gefunden',
      list: 'Definierte Aliase',
      empty: 'Keine Aliase definiert',
    },
    grep: {
      missingPattern: 'fehlendes Suchmuster',
      missingFile: 'fehlender Dateioperand',
      noMatches: 'Keine Übereinstimmungen gefunden',
      moreMatches: 'weitere Übereinstimmungen',
    },
    touch: {
      missingOperand: 'fehlender Dateioperand',
      created: 'Datei erstellt',
      simulated: 'simuliert',
    },
    mkdir: {
      missingOperand: 'fehlender Verzeichnisoperand',
      created: 'Verzeichnis erstellt',
      simulated: 'simuliert',
    },
    chmod: {
      usage: 'Verwendung: chmod <modus> <datei>',
      changed: 'Berechtigungen geändert',
      simulated: 'simuliert',
    },
    export: {
      set: 'Exportiert',
      usage: 'Verwendung: export VAR=wert',
    },
    time: {
      elapsed: 'Verstrichene Zeit',
    },
    which: {
      notFound: 'nicht gefunden',
    },
    man: {
      noManual: 'Kein Handbucheintrag für',
      pages: 'Verfügbare Handbuchseiten',
    },
  },
  ja: {
    welcome: {
      title: 'ATHENA IDE ターミナル',
      subtitle: 'PlayStation 2 自作開発',
      helpHint: '"help"でコマンド一覧、"repos"でクローンしたリポジトリを管理できます。',
    },
    commands: {
      notFound: 'コマンドが見つかりません',
      helpHint: '"help"で利用可能なコマンドを表示',
      missingOperand: 'オペランドがありません',
      noSuchFile: 'ファイルが見つかりません',
      noSuchDirectory: 'ファイルまたはディレクトリが見つかりません',
      permissionDenied: '権限がありません',
    },
    help: {
      title: 'ATHENAターミナル コマンド',
      navigation: 'ナビゲーションとファイルシステム',
      repoManagement: 'リポジトリ管理',
      development: '開発ツール',
      terminal: 'ターミナル制御',
      system: 'システムコマンド',
      shortcuts: 'ショートカット: ↑↓ 履歴 | Tab 補完 | Ctrl+C キャンセル | Ctrl+L クリア',
    },
    repos: {
      title: 'クローンされたリポジトリ',
      empty: 'まだリポジトリはクローンされていません。',
      cloneHint: '"git clone <url>"でGitHubリポジトリをクローンしてください。',
      path: 'パス',
      files: 'ファイル',
      folders: 'フォルダ',
      size: 'サイズ',
      cloned: 'クローン日時',
      storageSummary: 'ストレージ概要',
      total: '合計',
      cleanWarning: '警告: すべてのクローンデータが削除されます！',
      cleanSuccess: 'すべてのクローンデータが削除されました。',
      cleanStorageCleared: 'ブラウザストレージがクリアされました。再読み込み後、ファイルエクスプローラーは空になります。',
    },
    delete: {
      title: 'リポジトリを削除',
      confirm: '本当に削除しますか',
      willRemove: '削除されるファイル数',
      freeSpace: 'ファイル、解放される容量',
      cancel: 'キャンセル',
      deleteBtn: 'リポジトリを削除',
      noSuchRepo: 'リポジトリが見つかりません',
      useReposHint: '"repos"で利用可能なリポジトリを確認してください',
      usageHint: '使用法: rm -rf <リポジトリ名>',
    },
    language: {
      title: 'ターミナル言語',
      current: '現在の言語',
      changed: '言語が変更されました',
      available: '利用可能な言語',
    },
    status: {
      running: '実行中...',
      cancelHint: 'Ctrl+Cでキャンセル',
      switchedTo: '切り替え先',
      newSession: '新しいセッション',
    },
    storage: {
      repos: 'リポジトリ',
      files: 'ファイル',
      cleanAll: 'すべてクリア',
      diskUsage: 'ディスク使用量 (仮想ファイルシステム)',
    },
    build: {
      ps2Title: 'PS2 ビルドシステム v1.0',
      compiling: 'EE Coreモジュールをコンパイル中...',
      linking: 'PS2SDKライブラリをリンク中...',
      processing: 'VUマイクロコードを処理中...',
      generating: 'ELF実行ファイルを生成中...',
      complete: 'ビルド完了',
      starting: 'PS2エミュレータを起動中...',
      emulatorStarted: 'エミュレータが正常に起動しました',
      entering: 'ディレクトリに移動中...',
      success: 'ビルド成功',
    },
    npm: {
      installing: '依存関係をインストール中...',
      added: '追加',
      audited: 'パッケージを監査',
      funding: 'パッケージが資金を求めています',
      complete: 'npm installが正常に完了しました',
      executed: 'スクリプトが正常に実行されました',
      notRecognized: '認識されないコマンドです',
    },
    git: {
      initializing: 'クローンを初期化中',
      notCommand: 'はgitコマンドではありません',
      onBranch: 'ブランチ main',
      nothingToCommit: 'コミットするものはありません、作業ツリーはクリーンです',
      initialCommit: '初期コミット',
    },
    find: {
      noResults: '一致するファイルが見つかりません',
      moreResults: 'さらに結果があります',
      missingPattern: 'パターンがありません',
    },
    tree: {
      directory: 'ディレクトリ',
    },
    env: {
      set: '環境変数が設定されました',
      unset: '環境変数が削除されました',
      empty: '環境変数が設定されていません',
    },
    alias: {
      set: 'エイリアスが設定されました',
      removed: 'エイリアスが削除されました',
      notFound: 'エイリアスが見つかりません',
      list: '定義されたエイリアス',
      empty: 'エイリアスが定義されていません',
    },
    grep: {
      missingPattern: '検索パターンがありません',
      missingFile: 'ファイルオペランドがありません',
      noMatches: '一致するものが見つかりません',
      moreMatches: 'さらに一致',
    },
    touch: {
      missingOperand: 'ファイルオペランドがありません',
      created: 'ファイルが作成されました',
      simulated: 'シミュレート',
    },
    mkdir: {
      missingOperand: 'ディレクトリオペランドがありません',
      created: 'ディレクトリが作成されました',
      simulated: 'シミュレート',
    },
    chmod: {
      usage: '使用法: chmod <モード> <ファイル>',
      changed: '権限が変更されました',
      simulated: 'シミュレート',
    },
    export: {
      set: 'エクスポートされました',
      usage: '使用法: export 変数=値',
    },
    time: {
      elapsed: '経過時間',
    },
    which: {
      notFound: '見つかりません',
    },
    man: {
      noManual: 'マニュアルがありません',
      pages: '利用可能なマニュアルページ',
    },
  },
  zh: {
    welcome: {
      title: 'ATHENA IDE 终端',
      subtitle: 'PlayStation 2 自制开发',
      helpHint: '输入 "help" 查看可用命令，或输入 "repos" 管理克隆的仓库。',
    },
    commands: {
      notFound: '命令未找到',
      helpHint: '输入 "help" 查看可用命令',
      missingOperand: '缺少操作数',
      noSuchFile: '文件未找到',
      noSuchDirectory: '文件或目录未找到',
      permissionDenied: '权限被拒绝',
    },
    help: {
      title: 'ATHENA 终端命令',
      navigation: '导航和文件系统',
      repoManagement: '仓库管理',
      development: '开发工具',
      terminal: '终端控制',
      system: '系统命令',
      shortcuts: '快捷键: ↑↓ 历史 | Tab 自动补全 | Ctrl+C 取消 | Ctrl+L 清屏',
    },
    repos: {
      title: '克隆的仓库',
      empty: '尚未克隆任何仓库。',
      cloneHint: '使用 "git clone <url>" 克隆 GitHub 仓库。',
      path: '路径',
      files: '文件',
      folders: '文件夹',
      size: '大小',
      cloned: '克隆时间',
      storageSummary: '存储摘要',
      total: '总计',
      cleanWarning: '警告：这将删除所有克隆的仓库数据！',
      cleanSuccess: '所有克隆的仓库数据已被删除。',
      cleanStorageCleared: '浏览器存储已清除。刷新后文件资源管理器将为空。',
    },
    delete: {
      title: '删除仓库',
      confirm: '您确定要删除',
      willRemove: '这将删除',
      freeSpace: '个文件并释放',
      cancel: '取消',
      deleteBtn: '删除仓库',
      noSuchRepo: '仓库未找到',
      useReposHint: '使用 "repos" 列出可用仓库',
      usageHint: '用法: rm -rf <仓库名>',
    },
    language: {
      title: '终端语言',
      current: '当前语言',
      changed: '语言已更改为',
      available: '可用语言',
    },
    status: {
      running: '运行中...',
      cancelHint: 'Ctrl+C 取消',
      switchedTo: '已切换到',
      newSession: '新会话',
    },
    storage: {
      repos: '仓库',
      files: '文件',
      cleanAll: '清除全部',
      diskUsage: '磁盘使用情况 (虚拟文件系统)',
    },
    build: {
      ps2Title: 'PS2 构建系统 v1.0',
      compiling: '正在编译 EE Core 模块...',
      linking: '正在链接 PS2SDK 库...',
      processing: '正在处理 VU 微代码...',
      generating: '正在生成 ELF 可执行文件...',
      complete: '构建完成',
      starting: '正在启动 PS2 模拟器...',
      emulatorStarted: '模拟器已成功启动',
      entering: '正在进入目录...',
      success: '构建成功',
    },
    npm: {
      installing: '正在安装依赖...',
      added: '已添加',
      audited: '个包，已审核',
      funding: '个包正在寻求资助',
      complete: 'npm install 成功完成',
      executed: '脚本执行成功',
      notRecognized: '不是可识别的命令',
    },
    git: {
      initializing: '正在初始化克隆',
      notCommand: '不是 git 命令',
      onBranch: '在 main 分支',
      nothingToCommit: '没有要提交的内容，工作树干净',
      initialCommit: '初始提交',
    },
    find: {
      noResults: '未找到匹配的文件',
      moreResults: '更多结果',
      missingPattern: '缺少模式',
    },
    tree: {
      directory: '目录',
    },
    env: {
      set: '环境变量已设置',
      unset: '环境变量已删除',
      empty: '未设置环境变量',
    },
    alias: {
      set: '别名已设置',
      removed: '别名已删除',
      notFound: '别名未找到',
      list: '已定义的别名',
      empty: '未定义别名',
    },
    grep: {
      missingPattern: '缺少搜索模式',
      missingFile: '缺少文件操作数',
      noMatches: '未找到匹配项',
      moreMatches: '更多匹配',
    },
    touch: {
      missingOperand: '缺少文件操作数',
      created: '文件已创建',
      simulated: '模拟',
    },
    mkdir: {
      missingOperand: '缺少目录操作数',
      created: '目录已创建',
      simulated: '模拟',
    },
    chmod: {
      usage: '用法: chmod <模式> <文件>',
      changed: '权限已更改',
      simulated: '模拟',
    },
    export: {
      set: '已导出',
      usage: '用法: export 变量=值',
    },
    time: {
      elapsed: '已用时间',
    },
    which: {
      notFound: '未找到',
    },
    man: {
      noManual: '没有手册条目',
      pages: '可用的手册页',
    },
  },
  ko: {
    welcome: {
      title: 'ATHENA IDE 터미널',
      subtitle: 'PlayStation 2 홈브류 개발',
      helpHint: '"help"로 사용 가능한 명령어를 보거나 "repos"로 클론된 저장소를 관리하세요.',
    },
    commands: {
      notFound: '명령어를 찾을 수 없습니다',
      helpHint: '"help"로 사용 가능한 명령어 보기',
      missingOperand: '피연산자가 없습니다',
      noSuchFile: '파일을 찾을 수 없습니다',
      noSuchDirectory: '파일 또는 디렉토리를 찾을 수 없습니다',
      permissionDenied: '권한이 거부되었습니다',
    },
    help: {
      title: 'ATHENA 터미널 명령어',
      navigation: '탐색 및 파일 시스템',
      repoManagement: '저장소 관리',
      development: '개발 도구',
      terminal: '터미널 제어',
      system: '시스템 명령어',
      shortcuts: '단축키: ↑↓ 기록 | Tab 자동완성 | Ctrl+C 취소 | Ctrl+L 지우기',
    },
    repos: {
      title: '클론된 저장소',
      empty: '아직 클론된 저장소가 없습니다.',
      cloneHint: '"git clone <url>"로 GitHub 저장소를 클론하세요.',
      path: '경로',
      files: '파일',
      folders: '폴더',
      size: '크기',
      cloned: '클론 날짜',
      storageSummary: '저장소 요약',
      total: '합계',
      cleanWarning: '경고: 모든 클론된 저장소 데이터가 삭제됩니다!',
      cleanSuccess: '모든 클론된 저장소 데이터가 제거되었습니다.',
      cleanStorageCleared: '브라우저 저장소가 지워졌습니다. 새로고침 후 파일 탐색기가 비어 있을 것입니다.',
    },
    delete: {
      title: '저장소 삭제',
      confirm: '정말 삭제하시겠습니까',
      willRemove: '삭제될 파일 수',
      freeSpace: '개 파일, 해제될 공간',
      cancel: '취소',
      deleteBtn: '저장소 삭제',
      noSuchRepo: '저장소를 찾을 수 없습니다',
      useReposHint: '"repos"로 사용 가능한 저장소 확인',
      usageHint: '사용법: rm -rf <저장소명>',
    },
    language: {
      title: '터미널 언어',
      current: '현재 언어',
      changed: '언어가 변경되었습니다',
      available: '사용 가능한 언어',
    },
    status: {
      running: '실행 중...',
      cancelHint: 'Ctrl+C로 취소',
      switchedTo: '전환됨',
      newSession: '새 세션',
    },
    storage: {
      repos: '저장소',
      files: '파일',
      cleanAll: '모두 지우기',
      diskUsage: '디스크 사용량 (가상 파일 시스템)',
    },
    build: {
      ps2Title: 'PS2 빌드 시스템 v1.0',
      compiling: 'EE Core 모듈 컴파일 중...',
      linking: 'PS2SDK 라이브러리 링크 중...',
      processing: 'VU 마이크로코드 처리 중...',
      generating: 'ELF 실행 파일 생성 중...',
      complete: '빌드 완료',
      starting: 'PS2 에뮬레이터 시작 중...',
      emulatorStarted: '에뮬레이터가 성공적으로 시작되었습니다',
      entering: '디렉토리 진입 중...',
      success: '빌드 성공',
    },
    npm: {
      installing: '의존성 설치 중...',
      added: '추가됨',
      audited: '패키지 감사됨',
      funding: '패키지가 자금을 찾고 있습니다',
      complete: 'npm install이 성공적으로 완료되었습니다',
      executed: '스크립트가 성공적으로 실행되었습니다',
      notRecognized: '인식되지 않는 명령어입니다',
    },
    git: {
      initializing: '클론 초기화 중',
      notCommand: '는 git 명령어가 아닙니다',
      onBranch: 'main 브랜치에서',
      nothingToCommit: '커밋할 것이 없습니다, 작업 트리 깨끗함',
      initialCommit: '초기 커밋',
    },
    find: {
      noResults: '일치하는 파일을 찾을 수 없습니다',
      moreResults: '추가 결과',
      missingPattern: '패턴이 없습니다',
    },
    tree: {
      directory: '디렉토리',
    },
    env: {
      set: '환경 변수가 설정되었습니다',
      unset: '환경 변수가 제거되었습니다',
      empty: '설정된 환경 변수가 없습니다',
    },
    alias: {
      set: '별칭이 설정되었습니다',
      removed: '별칭이 제거되었습니다',
      notFound: '별칭을 찾을 수 없습니다',
      list: '정의된 별칭',
      empty: '정의된 별칭이 없습니다',
    },
    grep: {
      missingPattern: '검색 패턴이 없습니다',
      missingFile: '파일 피연산자가 없습니다',
      noMatches: '일치하는 항목을 찾을 수 없습니다',
      moreMatches: '추가 일치',
    },
    touch: {
      missingOperand: '파일 피연산자가 없습니다',
      created: '파일이 생성되었습니다',
      simulated: '시뮬레이션',
    },
    mkdir: {
      missingOperand: '디렉토리 피연산자가 없습니다',
      created: '디렉토리가 생성되었습니다',
      simulated: '시뮬레이션',
    },
    chmod: {
      usage: '사용법: chmod <모드> <파일>',
      changed: '권한이 변경되었습니다',
      simulated: '시뮬레이션',
    },
    export: {
      set: '내보내기됨',
      usage: '사용법: export 변수=값',
    },
    time: {
      elapsed: '경과 시간',
    },
    which: {
      notFound: '찾을 수 없음',
    },
    man: {
      noManual: '매뉴얼 항목이 없습니다',
      pages: '사용 가능한 매뉴얼 페이지',
    },
  },
  ru: {
    welcome: {
      title: 'Терминал ATHENA IDE',
      subtitle: 'Разработка Homebrew для PlayStation 2',
      helpHint: 'Введите "help" для списка команд или "repos" для управления клонированными репозиториями.',
    },
    commands: {
      notFound: 'команда не найдена',
      helpHint: 'Введите "help" для доступных команд',
      missingOperand: 'отсутствует операнд',
      noSuchFile: 'Файл не найден',
      noSuchDirectory: 'Файл или каталог не найден',
      permissionDenied: 'Доступ запрещён',
    },
    help: {
      title: 'Команды терминала ATHENA',
      navigation: 'Навигация и файловая система',
      repoManagement: 'Управление репозиториями',
      development: 'Инструменты разработки',
      terminal: 'Управление терминалом',
      system: 'Системные команды',
      shortcuts: 'Горячие клавиши: ↑↓ История | Tab Автодополнение | Ctrl+C Отмена | Ctrl+L Очистить',
    },
    repos: {
      title: 'Клонированные репозитории',
      empty: 'Пока нет клонированных репозиториев.',
      cloneHint: 'Используйте "git clone <url>" для клонирования репозитория GitHub.',
      path: 'Путь',
      files: 'Файлы',
      folders: 'Папки',
      size: 'Размер',
      cloned: 'Клонирован',
      storageSummary: 'Сводка хранилища',
      total: 'Всего',
      cleanWarning: 'ВНИМАНИЕ: Это удалит все данные клонированных репозиториев!',
      cleanSuccess: 'Все данные клонированных репозиториев удалены.',
      cleanStorageCleared: 'Хранилище браузера очищено. Файловый менеджер будет пуст после перезагрузки.',
    },
    delete: {
      title: 'Удалить репозиторий',
      confirm: 'Вы уверены, что хотите удалить',
      willRemove: 'Это удалит',
      freeSpace: 'файлов и освободит',
      cancel: 'Отмена',
      deleteBtn: 'Удалить репозиторий',
      noSuchRepo: 'Репозиторий не найден',
      useReposHint: 'Используйте "repos" для списка доступных репозиториев',
      usageHint: 'Использование: rm -rf <имя-репозитория>',
    },
    language: {
      title: 'Язык терминала',
      current: 'Текущий язык',
      changed: 'Язык изменён на',
      available: 'Доступные языки',
    },
    status: {
      running: 'Выполняется...',
      cancelHint: 'Ctrl+C для отмены',
      switchedTo: 'Переключено на',
      newSession: 'Новая сессия',
    },
    storage: {
      repos: 'репозитории',
      files: 'файлы',
      cleanAll: 'Очистить всё',
      diskUsage: 'Использование диска (виртуальная файловая система)',
    },
    build: {
      ps2Title: 'Система сборки PS2 v1.0',
      compiling: 'Компиляция модулей EE Core...',
      linking: 'Связывание библиотек PS2SDK...',
      processing: 'Обработка микрокода VU...',
      generating: 'Генерация исполняемого ELF...',
      complete: 'Сборка завершена',
      starting: 'Запуск эмулятора PS2...',
      emulatorStarted: 'Эмулятор успешно запущен',
      entering: 'Переход в каталог...',
      success: 'Сборка успешна',
    },
    npm: {
      installing: 'Установка зависимостей...',
      added: 'добавлено',
      audited: 'пакетов, проверено',
      funding: 'пакетов ищут финансирование',
      complete: 'npm install успешно завершён',
      executed: 'Скрипт успешно выполнен',
      notRecognized: 'не распознанная команда',
    },
    git: {
      initializing: 'Инициализация клонирования',
      notCommand: 'не является командой git',
      onBranch: 'На ветке main',
      nothingToCommit: 'нечего коммитить, рабочее дерево чистое',
      initialCommit: 'Начальный коммит',
    },
    find: {
      noResults: 'Файлы не найдены по запросу',
      moreResults: 'и ещё результатов',
      missingPattern: 'отсутствует шаблон',
    },
    tree: {
      directory: 'каталоги',
    },
    env: {
      set: 'Переменная среды установлена',
      unset: 'Переменная среды удалена',
      empty: 'Переменные среды не установлены',
    },
    alias: {
      set: 'Псевдоним установлен',
      removed: 'Псевдоним удалён',
      notFound: 'Псевдоним не найден',
      list: 'Определённые псевдонимы',
      empty: 'Псевдонимы не определены',
    },
    grep: {
      missingPattern: 'отсутствует шаблон поиска',
      missingFile: 'отсутствует файловый операнд',
      noMatches: 'Совпадений не найдено',
      moreMatches: 'ещё совпадений',
    },
    touch: {
      missingOperand: 'отсутствует файловый операнд',
      created: 'Файл создан',
      simulated: 'симуляция',
    },
    mkdir: {
      missingOperand: 'отсутствует операнд каталога',
      created: 'Каталог создан',
      simulated: 'симуляция',
    },
    chmod: {
      usage: 'Использование: chmod <режим> <файл>',
      changed: 'Права изменены',
      simulated: 'симуляция',
    },
    export: {
      set: 'Экспортировано',
      usage: 'Использование: export ПЕРЕМЕННАЯ=значение',
    },
    time: {
      elapsed: 'Затраченное время',
    },
    which: {
      notFound: 'не найден',
    },
    man: {
      noManual: 'Нет справочной страницы для',
      pages: 'Доступные страницы руководства',
    },
  },
  it: {
    welcome: {
      title: 'Terminale ATHENA IDE',
      subtitle: 'Sviluppo Homebrew PlayStation 2',
      helpHint: 'Digita "help" per i comandi disponibili o "repos" per gestire i repository clonati.',
    },
    commands: {
      notFound: 'comando non trovato',
      helpHint: 'Digita "help" per i comandi disponibili',
      missingOperand: 'operando mancante',
      noSuchFile: 'File non trovato',
      noSuchDirectory: 'File o directory non trovata',
      permissionDenied: 'Permesso negato',
    },
    help: {
      title: 'Comandi del Terminale ATHENA',
      navigation: 'Navigazione e File System',
      repoManagement: 'Gestione Repository',
      development: 'Strumenti di Sviluppo',
      terminal: 'Controllo Terminale',
      system: 'Comandi di Sistema',
      shortcuts: 'Scorciatoie: ↑↓ Cronologia | Tab Autocompletamento | Ctrl+C Annulla | Ctrl+L Pulisci',
    },
    repos: {
      title: 'Repository Clonati',
      empty: 'Nessun repository clonato ancora.',
      cloneHint: 'Usa "git clone <url>" per clonare un repository GitHub.',
      path: 'Percorso',
      files: 'File',
      folders: 'Cartelle',
      size: 'Dimensione',
      cloned: 'Clonato',
      storageSummary: 'Riepilogo Archiviazione',
      total: 'Totale',
      cleanWarning: 'ATTENZIONE: Questo eliminerà tutti i dati dei repository clonati!',
      cleanSuccess: 'Tutti i dati dei repository clonati sono stati rimossi.',
      cleanStorageCleared: 'Archiviazione del browser cancellata. L\'esploratore file sarà vuoto al ricaricamento.',
    },
    delete: {
      title: 'Elimina Repository',
      confirm: 'Sei sicuro di voler eliminare',
      willRemove: 'Questo rimuoverà',
      freeSpace: 'file e libererà',
      cancel: 'Annulla',
      deleteBtn: 'Elimina Repository',
      noSuchRepo: 'Repository non trovato',
      useReposHint: 'Usa "repos" per elencare i repository disponibili',
      usageHint: 'Utilizzo: rm -rf <nome-repository>',
    },
    language: {
      title: 'Lingua del Terminale',
      current: 'Lingua corrente',
      changed: 'Lingua cambiata in',
      available: 'Lingue disponibili',
    },
    status: {
      running: 'In esecuzione...',
      cancelHint: 'Ctrl+C per annullare',
      switchedTo: 'Passato a',
      newSession: 'Nuova sessione',
    },
    storage: {
      repos: 'repository',
      files: 'file',
      cleanAll: 'Pulisci Tutto',
      diskUsage: 'Utilizzo Disco (File System Virtuale)',
    },
    build: {
      ps2Title: 'Sistema di Build PS2 v1.0',
      compiling: 'Compilazione moduli EE Core...',
      linking: 'Collegamento librerie PS2SDK...',
      processing: 'Elaborazione microcodice VU...',
      generating: 'Generazione eseguibile ELF...',
      complete: 'Build completata',
      starting: 'Avvio Emulatore PS2...',
      emulatorStarted: 'Emulatore avviato con successo',
      entering: 'Accesso alla directory...',
      success: 'Build riuscita',
    },
    npm: {
      installing: 'Installazione dipendenze...',
      added: 'aggiunti',
      audited: 'pacchetti, e verificati',
      funding: 'pacchetti cercano finanziamenti',
      complete: 'npm install completato con successo',
      executed: 'Script eseguito con successo',
      notRecognized: 'non è un comando riconosciuto',
    },
    git: {
      initializing: 'Inizializzazione clone per',
      notCommand: 'non è un comando git',
      onBranch: 'Sul branch main',
      nothingToCommit: 'niente da committare, albero di lavoro pulito',
      initialCommit: 'Commit iniziale',
    },
    find: {
      noResults: 'Nessun file corrispondente a',
      moreResults: 'e altri risultati',
      missingPattern: 'pattern mancante',
    },
    tree: {
      directory: 'directory',
    },
    env: {
      set: 'Variabile d\'ambiente impostata',
      unset: 'Variabile d\'ambiente rimossa',
      empty: 'Nessuna variabile d\'ambiente impostata',
    },
    alias: {
      set: 'Alias impostato',
      removed: 'Alias rimosso',
      notFound: 'Alias non trovato',
      list: 'Alias definiti',
      empty: 'Nessun alias definito',
    },
    grep: {
      missingPattern: 'pattern di ricerca mancante',
      missingFile: 'operando file mancante',
      noMatches: 'Nessuna corrispondenza trovata',
      moreMatches: 'altre corrispondenze',
    },
    touch: {
      missingOperand: 'operando file mancante',
      created: 'File creato',
      simulated: 'simulato',
    },
    mkdir: {
      missingOperand: 'operando directory mancante',
      created: 'Directory creata',
      simulated: 'simulato',
    },
    chmod: {
      usage: 'Utilizzo: chmod <modalità> <file>',
      changed: 'Permessi modificati',
      simulated: 'simulato',
    },
    export: {
      set: 'Esportato',
      usage: 'Utilizzo: export VAR=valore',
    },
    time: {
      elapsed: 'Tempo trascorso',
    },
    which: {
      notFound: 'non trovato',
    },
    man: {
      noManual: 'Nessuna voce di manuale per',
      pages: 'Pagine di manuale disponibili',
    },
  },
};

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  ru: 'Русский',
  it: 'Italiano',
};

// ==================== INTERFACES ====================
interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system' | 'warning';
  content: string;
  timestamp: Date;
}

interface TerminalTab {
  id: string;
  name: string;
  lines: TerminalLine[];
  currentDirectory: string;
  isRunning: boolean;
  shell: 'zsh' | 'bash' | 'powershell';
}

interface ClonedRepo {
  name: string;
  path: string;
  clonedAt: Date;
  fileCount: number;
  folderCount: number;
  sizeBytes: number;
}

interface IDETerminalProps {
  onClose?: () => void;
  onCloneRepository?: (url: string) => void;
  isCloning?: boolean;
  cloneProgress?: string[];
  projectFiles?: FileNode[];
  onDeleteFiles?: (paths: string[]) => void;
  onClearClonedData?: () => void;
}

// Storage keys
const CLONED_REPOS_KEY = 'athena_cloned_repos';
const TERMINAL_LANG_KEY = 'athena_terminal_lang';
const TERMINAL_ALIASES_KEY = 'athena_terminal_aliases';
const TERMINAL_ENV_KEY = 'athena_terminal_env';

export function IDETerminal({ 
  onClose, 
  onCloneRepository, 
  isCloning, 
  cloneProgress,
  projectFiles = [],
  onDeleteFiles,
  onClearClonedData
}: IDETerminalProps) {
  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(TERMINAL_LANG_KEY);
    return (saved as Language) || 'en';
  });
  
  const t = translations[language];

  // Terminal state
  const [tabs, setTabs] = useState<TerminalTab[]>(() => [{
    id: 'terminal-1',
    name: 'zsh',
    lines: [],
    currentDirectory: '~',
    isRunning: false,
    shell: 'zsh'
  }]);
  
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [clonedRepos, setClonedRepos] = useState<ClonedRepo[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<ClonedRepo | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs[activeTabIndex];

  // Initialize welcome message
  useEffect(() => {
    setTabs(prev => prev.map((tab, idx) => 
      idx === 0 && tab.lines.length === 0 
        ? { 
            ...tab, 
            lines: [
              { id: '1', type: 'system', content: '\x1b[1;36m╔════════════════════════════════════════════════════════════════╗\x1b[0m', timestamp: new Date() },
              { id: '2', type: 'system', content: `\x1b[1;36m║\x1b[0m  \x1b[1;37m${t.welcome.title}\x1b[0m v2.1.0 - Professional Dev Environment   \x1b[1;36m║\x1b[0m`, timestamp: new Date() },
              { id: '3', type: 'system', content: `\x1b[1;36m║\x1b[0m  ${t.welcome.subtitle}                           \x1b[1;36m║\x1b[0m`, timestamp: new Date() },
              { id: '4', type: 'system', content: '\x1b[1;36m╚════════════════════════════════════════════════════════════════╝\x1b[0m', timestamp: new Date() },
              { id: '5', type: 'info', content: '', timestamp: new Date() },
              { id: '6', type: 'info', content: t.welcome.helpHint.replace('"help"', '\x1b[1;33m"help"\x1b[0m').replace('"repos"', '\x1b[1;33m"repos"\x1b[0m'), timestamp: new Date() },
              { id: '7', type: 'output', content: '', timestamp: new Date() },
            ]
          }
        : tab
    ));
  }, [t]);

  // Load persisted data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLONED_REPOS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setClonedRepos(parsed.map((r: any) => ({
          ...r,
          clonedAt: new Date(r.clonedAt)
        })));
      }
      
      const savedAliases = localStorage.getItem(TERMINAL_ALIASES_KEY);
      if (savedAliases) setAliases(JSON.parse(savedAliases));
      
      const savedEnv = localStorage.getItem(TERMINAL_ENV_KEY);
      if (savedEnv) setEnvVars(JSON.parse(savedEnv));
    } catch (e) {
      console.error('Error loading terminal data:', e);
    }
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem(TERMINAL_LANG_KEY, language);
  }, [language]);

  // Save aliases and env vars
  useEffect(() => {
    localStorage.setItem(TERMINAL_ALIASES_KEY, JSON.stringify(aliases));
  }, [aliases]);

  useEffect(() => {
    localStorage.setItem(TERMINAL_ENV_KEY, JSON.stringify(envVars));
  }, [envVars]);

  // Save cloned repos to localStorage
  const saveClonedRepos = useCallback((repos: ClonedRepo[]) => {
    try {
      localStorage.setItem(CLONED_REPOS_KEY, JSON.stringify(repos));
      setClonedRepos(repos);
    } catch (e) {
      console.error('Error saving cloned repos:', e);
    }
  }, []);

  // Build virtual file system from projectFiles
  const virtualFS = useMemo(() => {
    const fs: Map<string, { type: 'file' | 'folder'; content?: string; children?: string[] }> = new Map();
    
    const processNode = (node: FileNode, parentPath: string = '') => {
      const fullPath = parentPath ? `${parentPath}/${node.name}` : `/${node.name}`;
      
      if (node.type === 'folder') {
        const children = node.children?.map(c => c.name) || [];
        fs.set(fullPath, { type: 'folder', children });
        node.children?.forEach(child => processNode(child, fullPath));
      } else {
        fs.set(fullPath, { type: 'file', content: node.content });
      }
    };
    
    projectFiles.forEach(node => processNode(node));
    
    fs.set('/', { type: 'folder', children: projectFiles.map(n => n.name) });
    fs.set('~', { type: 'folder', children: projectFiles.map(n => n.name) });
    
    return fs;
  }, [projectFiles]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab?.lines]);

  // Track cloned repository from progress
  useEffect(() => {
    if (cloneProgress && cloneProgress.length > 0) {
      const newLines = cloneProgress.map((line, index) => ({
        id: `clone-${Date.now()}-${index}`,
        type: line.includes('error') || line.includes('Error') || line.includes('✗') ? 'error' as const : 
              line.includes('✓') || line.includes('successfully') ? 'success' as const : 
              line.includes('warning') ? 'warning' as const :
              'info' as const,
        content: line,
        timestamp: new Date()
      }));

      setTabs(prev => prev.map((tab, idx) => 
        idx === activeTabIndex 
          ? { ...tab, lines: [...tab.lines.filter(l => !l.id.startsWith('clone-')), ...newLines] }
          : tab
      ));

      const repoMatch = cloneProgress.find(l => l.includes('Repository:'))?.match(/Repository:\s+.*?([^\/\s]+\/[^\/\s]+)/);
      const filesMatch = cloneProgress.find(l => l.includes('Total Files:'))?.match(/Total Files:\s+.*?(\d+)/);
      const foldersMatch = cloneProgress.find(l => l.includes('Total Folders:'))?.match(/Total Folders:\s+.*?(\d+)/);
      const sizeMatch = cloneProgress.find(l => l.includes('Download Size:'))?.match(/Download Size:\s+.*?([\d.]+)\s*(KiB|MiB)/);
      
      if (repoMatch && cloneProgress.some(l => l.includes('successfully'))) {
        const repoName = repoMatch[1].split('/')[1];
        const fileCount = parseInt(filesMatch?.[1] || '0');
        const folderCount = parseInt(foldersMatch?.[1] || '0');
        let sizeBytes = 0;
        if (sizeMatch) {
          const sizeValue = parseFloat(sizeMatch[1]);
          sizeBytes = sizeMatch[2] === 'MiB' ? sizeValue * 1024 * 1024 : sizeValue * 1024;
        }
        
        setClonedRepos(prev => {
          const exists = prev.some(r => r.name === repoName);
          if (exists) return prev;
          
          const newRepos = [...prev, {
            name: repoName,
            path: `/${repoName}`,
            clonedAt: new Date(),
            fileCount,
            folderCount,
            sizeBytes
          }];
          saveClonedRepos(newRepos);
          return newRepos;
        });
      }
    }
  }, [cloneProgress, activeTabIndex, saveClonedRepos]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    };

    setTabs(prev => prev.map((tab, idx) => 
      idx === activeTabIndex 
        ? { ...tab, lines: [...tab.lines, newLine] }
        : tab
    ));
  }, [activeTabIndex]);

  const addLines = useCallback((lines: Array<{ type: TerminalLine['type']; content: string }>) => {
    const newLines = lines.map((line, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      type: line.type,
      content: line.content,
      timestamp: new Date()
    }));

    setTabs(prev => prev.map((tab, idx) => 
      idx === activeTabIndex 
        ? { ...tab, lines: [...tab.lines, ...newLines] }
        : tab
    ));
  }, [activeTabIndex]);

  // Path resolution
  const resolvePath = useCallback((path: string, cwd: string): string => {
    if (path.startsWith('/')) return path;
    if (path.startsWith('~')) return path.replace('~', '');
    
    const cwdPath = cwd === '~' ? '' : cwd.replace('~', '');
    const parts = cwdPath.split('/').filter(Boolean);
    
    path.split('/').forEach(part => {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    });
    
    return '/' + parts.join('/');
  }, []);

  // List directory contents
  const listDirectory = useCallback((path: string): { name: string; type: 'file' | 'folder' }[] | null => {
    const normalizedPath = path === '~' ? '/' : path;
    
    const entry = virtualFS.get(normalizedPath);
    if (entry?.type === 'folder' && entry.children) {
      return entry.children.map(name => {
        const childPath = normalizedPath === '/' ? `/${name}` : `${normalizedPath}/${name}`;
        const child = virtualFS.get(childPath);
        return { name, type: child?.type || 'file' };
      });
    }
    
    const repoMatch = projectFiles.find(f => `/${f.name}` === normalizedPath || normalizedPath === '/' + f.name);
    if (repoMatch?.children) {
      return repoMatch.children.map(c => ({ name: c.name, type: c.type === 'folder' ? 'folder' : 'file' }));
    }
    
    if (normalizedPath === '/' || normalizedPath === '') {
      return projectFiles.map(f => ({ name: f.name, type: f.type === 'folder' ? 'folder' : 'file' }));
    }
    
    return null;
  }, [virtualFS, projectFiles]);

  // Read file content
  const readFile = useCallback((path: string): string | null => {
    const entry = virtualFS.get(path);
    if (entry?.type === 'file') {
      return entry.content || '';
    }
    return null;
  }, [virtualFS]);

  // Calculate storage usage
  const storageStats = useMemo(() => {
    const totalSize = clonedRepos.reduce((sum, r) => sum + r.sizeBytes, 0);
    const totalFiles = clonedRepos.reduce((sum, r) => sum + r.fileCount, 0);
    const totalFolders = clonedRepos.reduce((sum, r) => sum + r.folderCount, 0);
    return { totalSize, totalFiles, totalFolders, repoCount: clonedRepos.length };
  }, [clonedRepos]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  };

  // Handle repository deletion
  const handleDeleteRepo = useCallback(() => {
    if (!repoToDelete) return;
    
    const newRepos = clonedRepos.filter(r => r.name !== repoToDelete.name);
    saveClonedRepos(newRepos);
    
    if (onDeleteFiles) {
      onDeleteFiles([repoToDelete.path]);
    }
    
    addLine('success', `\x1b[1;32m✓\x1b[0m ${t.delete.deleteBtn}: ${repoToDelete.name}`);
    setShowDeleteDialog(false);
    setRepoToDelete(null);
  }, [repoToDelete, clonedRepos, saveClonedRepos, onDeleteFiles, addLine, t]);

  // Available commands for autocomplete
  const availableCommands = [
    'help', 'clear', 'cls', 'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'tree',
    'find', 'wc', 'grep', 'git', 'npm', 'yarn', 'make', 'repos', 'rm', 'du',
    'echo', 'date', 'whoami', 'uname', 'history', 'ps2-build', 'ps2-run', 'exit',
    'lang', 'language', 'alias', 'unalias', 'export', 'env', 'printenv', 'set',
    'unset', 'touch', 'mkdir', 'chmod', 'cp', 'mv', 'diff', 'sort', 'uniq',
    'which', 'type', 'man', 'info', 'time', 'uptime', 'neofetch', 'htop', 'top',
    'curl', 'wget', 'ping', 'ssh', 'scp', 'tar', 'gzip', 'gunzip', 'zip', 'unzip',
    'awk', 'sed', 'xargs', 'tee', 'hexdump', 'xxd', 'stat', 'file', 'strings'
  ];

  // Execute command
  const executeCommand = useCallback((command: string) => {
    let trimmedCmd = command.trim();
    
    // Resolve aliases
    const firstWord = trimmedCmd.split(/\s+/)[0];
    if (aliases[firstWord]) {
      trimmedCmd = trimmedCmd.replace(firstWord, aliases[firstWord]);
    }
    
    const parts = trimmedCmd.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Add to history
    if (trimmedCmd) {
      setCommandHistory(prev => [...prev.filter(c => c !== trimmedCmd), trimmedCmd].slice(-100));
      setHistoryIndex(-1);
    }

    // Add input line
    const prompt = activeTab.shell === 'powershell' ? 'PS' : '';
    addLine('input', `\x1b[1;32m${activeTab.currentDirectory}\x1b[0m ${prompt}\x1b[1;37m$\x1b[0m ${command}`);

    // Execute command
    switch (cmd) {
      case 'help':
        addLines([
          { type: 'info', content: '' },
          { type: 'system', content: '\x1b[1;36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m' },
          { type: 'system', content: `\x1b[1;36m│\x1b[0m  \x1b[1;37m${t.help.title}\x1b[0m                                      \x1b[1;36m│\x1b[0m` },
          { type: 'system', content: '\x1b[1;36m└─────────────────────────────────────────────────────────────────┘\x1b[0m' },
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[1;33m  ${t.help.navigation}:\x1b[0m` },
          { type: 'output', content: '    ls [-la]           List directory contents' },
          { type: 'output', content: '    cd <dir>           Change directory' },
          { type: 'output', content: '    pwd                Print working directory' },
          { type: 'output', content: '    cat <file>         Display file contents' },
          { type: 'output', content: '    head [-n] <file>   Show first lines of file' },
          { type: 'output', content: '    tail [-n] <file>   Show last lines of file' },
          { type: 'output', content: '    tree [dir]         Display directory tree' },
          { type: 'output', content: '    find <pattern>     Search for files' },
          { type: 'output', content: '    grep <pat> <file>  Search text in files' },
          { type: 'output', content: '    wc <file>          Count lines/words/chars' },
          { type: 'output', content: '    stat <file>        Display file status' },
          { type: 'output', content: '    file <file>        Determine file type' },
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[1;33m  ${t.help.repoManagement}:\x1b[0m` },
          { type: 'output', content: '    git clone <url>    Clone GitHub repository' },
          { type: 'output', content: '    git status         Show working tree status' },
          { type: 'output', content: '    git log            Show commit logs' },
          { type: 'output', content: '    repos              List cloned repositories' },
          { type: 'output', content: '    repos clean        Remove all cloned data' },
          { type: 'output', content: '    rm -rf <repo>      Delete specific repository' },
          { type: 'output', content: '    du [-h]            Show disk usage' },
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[1;33m  ${t.help.development}:\x1b[0m` },
          { type: 'output', content: '    npm install        Install dependencies' },
          { type: 'output', content: '    npm run <script>   Run npm script' },
          { type: 'output', content: '    yarn [cmd]         Yarn package manager' },
          { type: 'output', content: '    make               Build with Makefile' },
          { type: 'output', content: '    ps2-build          Build PS2 project' },
          { type: 'output', content: '    ps2-run            Run in PS2 emulator' },
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[1;33m  ${t.help.terminal}:\x1b[0m` },
          { type: 'output', content: '    clear / cls        Clear terminal screen' },
          { type: 'output', content: '    history            Show command history' },
          { type: 'output', content: '    alias [name=cmd]   Define command alias' },
          { type: 'output', content: '    unalias <name>     Remove alias' },
          { type: 'output', content: '    exit               Close terminal' },
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[1;33m  ${t.help.system}:\x1b[0m` },
          { type: 'output', content: '    echo <text>        Print text' },
          { type: 'output', content: '    date               Show current date/time' },
          { type: 'output', content: '    whoami             Display current user' },
          { type: 'output', content: '    uname [-a]         System information' },
          { type: 'output', content: '    uptime             System uptime' },
          { type: 'output', content: '    neofetch           System information display' },
          { type: 'output', content: '    env / printenv     Show environment variables' },
          { type: 'output', content: '    export VAR=val     Set environment variable' },
          { type: 'output', content: '    lang <code>        Change terminal language' },
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[2m  ${t.help.shortcuts}\x1b[0m` },
          { type: 'info', content: '' },
        ]);
        break;

      case 'clear':
      case 'cls':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, lines: [] } : tab
        ));
        break;

      case 'lang':
      case 'language':
        if (!args[0]) {
          addLines([
            { type: 'info', content: '' },
            { type: 'system', content: `\x1b[1;36m${t.language.title}\x1b[0m` },
            { type: 'info', content: '' },
            { type: 'output', content: `  ${t.language.current}: \x1b[1;33m${languageNames[language]} (${language})\x1b[0m` },
            { type: 'info', content: '' },
            { type: 'output', content: `  ${t.language.available}:` },
            ...Object.entries(languageNames).map(([code, name]) => ({
              type: 'output' as const,
              content: `    \x1b[1;34m${code}\x1b[0m - ${name}${code === language ? ' \x1b[1;32m✓\x1b[0m' : ''}`
            })),
            { type: 'info', content: '' },
            { type: 'info', content: '  Usage: lang <code>' },
            { type: 'info', content: '' },
          ]);
        } else {
          const newLang = args[0].toLowerCase() as Language;
          if (translations[newLang]) {
            setLanguage(newLang);
            addLines([
              { type: 'success', content: `\x1b[1;32m✓\x1b[0m ${translations[newLang].language.changed} \x1b[1;33m${languageNames[newLang]}\x1b[0m` },
              { type: 'info', content: '' },
            ]);
          } else {
            addLine('error', `lang: '${args[0]}' ${t.commands.notFound}`);
            addLine('info', `${t.language.available}: ${Object.keys(languageNames).join(', ')}`);
          }
        }
        break;

      case 'ls': {
        const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const targetPath = args.find(a => !a.startsWith('-')) || activeTab.currentDirectory;
        const resolvedPath = resolvePath(targetPath, activeTab.currentDirectory);
        
        const entries = listDirectory(resolvedPath);
        
        if (!entries) {
          addLine('error', `ls: ${t.commands.noSuchDirectory}: '${targetPath}'`);
          break;
        }

        if (entries.length === 0) {
          addLine('output', '\x1b[2m(empty directory)\x1b[0m');
          break;
        }

        const filteredEntries = showHidden ? entries : entries.filter(e => !e.name.startsWith('.'));
        
        if (showLong) {
          addLine('output', `total ${filteredEntries.length}`);
          filteredEntries.forEach(entry => {
            const permissions = entry.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
            const color = entry.type === 'folder' ? '\x1b[1;34m' : '\x1b[0m';
            const suffix = entry.type === 'folder' ? '/' : '';
            addLine('output', `${permissions}  1 dev dev    4096 ${new Date().toLocaleDateString()}  ${color}${entry.name}${suffix}\x1b[0m`);
          });
        } else {
          const folders = filteredEntries.filter(e => e.type === 'folder').map(e => `\x1b[1;34m${e.name}/\x1b[0m`);
          const files = filteredEntries.filter(e => e.type === 'file').map(e => e.name);
          const output = [...folders, ...files].join('  ');
          addLine('output', output);
        }
        break;
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, currentDirectory: '~' } : tab
          ));
          break;
        }

        const targetPath = resolvePath(args[0], activeTab.currentDirectory);
        const entries = listDirectory(targetPath);
        
        if (entries !== null) {
          const displayPath = targetPath === '/' ? '~' : '~' + targetPath;
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, currentDirectory: displayPath } : tab
          ));
        } else {
          addLine('error', `cd: ${args[0]}: ${t.commands.noSuchDirectory}`);
        }
        break;
      }

      case 'pwd':
        const pwdPath = activeTab.currentDirectory === '~' ? '/home/dev' : activeTab.currentDirectory.replace('~', '/home/dev');
        addLine('output', pwdPath);
        break;

      case 'cat': {
        if (!args[0]) {
          addLine('error', `cat: ${t.commands.missingOperand}`);
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          content.split('\n').forEach(line => addLine('output', line));
        } else {
          addLine('error', `cat: ${args[0]}: ${t.commands.noSuchFile}`);
        }
        break;
      }

      case 'head': {
        const numLines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
        const fileName = args.find(a => !a.startsWith('-') && a !== args[args.indexOf('-n') + 1]);
        
        if (!fileName) {
          addLine('error', `head: ${t.commands.missingOperand}`);
          break;
        }
        const filePath = resolvePath(fileName, activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const lines = content.split('\n').slice(0, numLines);
          lines.forEach(line => addLine('output', line));
          if (content.split('\n').length > numLines) {
            addLine('info', `\x1b[2m... (${content.split('\n').length - numLines} more lines)\x1b[0m`);
          }
        } else {
          addLine('error', `head: ${fileName}: ${t.commands.noSuchFile}`);
        }
        break;
      }

      case 'tail': {
        const numLines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
        const fileName = args.find(a => !a.startsWith('-') && a !== args[args.indexOf('-n') + 1]);
        
        if (!fileName) {
          addLine('error', `tail: ${t.commands.missingOperand}`);
          break;
        }
        const filePath = resolvePath(fileName, activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const allLines = content.split('\n');
          const lines = allLines.slice(-numLines);
          if (allLines.length > numLines) {
            addLine('info', `\x1b[2m... (${allLines.length - numLines} lines above)\x1b[0m`);
          }
          lines.forEach(line => addLine('output', line));
        } else {
          addLine('error', `tail: ${fileName}: ${t.commands.noSuchFile}`);
        }
        break;
      }

      case 'grep': {
        if (!args[0]) {
          addLine('error', `grep: ${t.grep.missingPattern}`);
          break;
        }
        if (!args[1]) {
          addLine('error', `grep: ${t.grep.missingFile}`);
          break;
        }
        
        const pattern = args[0];
        const fileName = args[1];
        const ignoreCase = args.includes('-i');
        const showLineNumbers = args.includes('-n');
        const filePath = resolvePath(fileName, activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const regex = new RegExp(pattern, ignoreCase ? 'gi' : 'g');
          const lines = content.split('\n');
          let matchCount = 0;
          
          lines.forEach((line, idx) => {
            if (regex.test(line)) {
              matchCount++;
              if (matchCount <= 50) {
                const highlighted = line.replace(regex, match => `\x1b[1;31m${match}\x1b[0m`);
                const prefix = showLineNumbers ? `\x1b[1;32m${idx + 1}:\x1b[0m ` : '';
                addLine('output', `${prefix}${highlighted}`);
              }
            }
          });
          
          if (matchCount === 0) {
            addLine('info', `${t.grep.noMatches} in '${fileName}'`);
          } else if (matchCount > 50) {
            addLine('info', `\x1b[2m... ${matchCount - 50} ${t.grep.moreMatches}\x1b[0m`);
          }
        } else {
          addLine('error', `grep: ${fileName}: ${t.commands.noSuchFile}`);
        }
        break;
      }

      case 'tree': {
        const targetPath = args[0] ? resolvePath(args[0], activeTab.currentDirectory) : 
                          activeTab.currentDirectory === '~' ? '/' : activeTab.currentDirectory.replace('~', '');
        
        let dirCount = 0;
        let fileCount = 0;
        
        const buildTree = (path: string, prefix: string = '', maxDepth: number = 4, depth: number = 0): string[] => {
          if (depth >= maxDepth) return [];
          
          const entries = listDirectory(path);
          if (!entries) return [];
          
          const lines: string[] = [];
          const sortedEntries = [...entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
          
          sortedEntries.forEach((entry, idx) => {
            const isLast = idx === sortedEntries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const color = entry.type === 'folder' ? '\x1b[1;34m' : '\x1b[0m';
            const suffix = entry.type === 'folder' ? '/' : '';
            lines.push(`${prefix}${connector}${color}${entry.name}${suffix}\x1b[0m`);
            
            if (entry.type === 'folder') {
              dirCount++;
              const childPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
              const newPrefix = prefix + (isLast ? '    ' : '│   ');
              lines.push(...buildTree(childPath, newPrefix, maxDepth, depth + 1));
            } else {
              fileCount++;
            }
          });
          
          return lines;
        };
        
        const dirName = targetPath === '/' ? '.' : targetPath.split('/').pop() || '.';
        addLine('output', `\x1b[1;34m${dirName}\x1b[0m`);
        buildTree(targetPath).forEach(line => addLine('output', line));
        addLine('info', `\n${dirCount} ${t.tree.directory}, ${fileCount} ${t.storage.files}`);
        break;
      }

      case 'find': {
        if (!args[0]) {
          addLine('error', `find: ${t.find.missingPattern}`);
          break;
        }
        const pattern = args[0].toLowerCase();
        const results: string[] = [];
        
        const searchInPath = (node: FileNode, path: string) => {
          const fullPath = `${path}/${node.name}`;
          if (node.name.toLowerCase().includes(pattern)) {
            results.push(fullPath);
          }
          if (node.children) {
            node.children.forEach(child => searchInPath(child, fullPath));
          }
        };
        
        projectFiles.forEach(node => searchInPath(node, ''));
        
        if (results.length === 0) {
          addLine('output', `${t.find.noResults} '${args[0]}'`);
        } else {
          results.slice(0, 50).forEach(result => {
            const color = result.endsWith('/') ? '\x1b[1;34m' : '\x1b[0m';
            addLine('output', `${color}${result}\x1b[0m`);
          });
          if (results.length > 50) {
            addLine('info', `\x1b[2m... ${results.length - 50} ${t.find.moreResults}\x1b[0m`);
          }
        }
        break;
      }

      case 'wc': {
        if (!args[0]) {
          addLine('error', `wc: ${t.commands.missingOperand}`);
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        
        if (content !== null) {
          const lines = content.split('\n').length;
          const words = content.split(/\s+/).filter(Boolean).length;
          const chars = content.length;
          addLine('output', `  ${lines}   ${words}  ${chars} ${args[0]}`);
        } else {
          addLine('error', `wc: ${args[0]}: ${t.commands.noSuchFile}`);
        }
        break;
      }

      case 'stat': {
        if (!args[0]) {
          addLine('error', `stat: ${t.commands.missingOperand}`);
          break;
        }
        const filePath = resolvePath(args[0], activeTab.currentDirectory);
        const content = readFile(filePath);
        const isDir = listDirectory(filePath) !== null;
        
        if (content !== null || isDir) {
          const now = new Date();
          addLines([
            { type: 'output', content: `  File: ${args[0]}` },
            { type: 'output', content: `  Size: ${content?.length || 4096}` },
            { type: 'output', content: `  Type: ${isDir ? 'directory' : 'regular file'}` },
            { type: 'output', content: `Access: ${now.toISOString()}` },
            { type: 'output', content: `Modify: ${now.toISOString()}` },
          ]);
        } else {
          addLine('error', `stat: ${args[0]}: ${t.commands.noSuchFile}`);
        }
        break;
      }

      case 'file': {
        if (!args[0]) {
          addLine('error', `file: ${t.commands.missingOperand}`);
          break;
        }
        const ext = args[0].split('.').pop()?.toLowerCase() || '';
        const fileTypes: Record<string, string> = {
          'c': 'C source, ASCII text',
          'h': 'C header, ASCII text',
          'cpp': 'C++ source, ASCII text',
          'hpp': 'C++ header, ASCII text',
          'js': 'JavaScript source, ASCII text',
          'ts': 'TypeScript source, ASCII text',
          'tsx': 'TypeScript JSX source, ASCII text',
          'jsx': 'JavaScript JSX source, ASCII text',
          'py': 'Python script, ASCII text',
          'rs': 'Rust source, ASCII text',
          'go': 'Go source, ASCII text',
          'json': 'JSON data, ASCII text',
          'yaml': 'YAML configuration, ASCII text',
          'yml': 'YAML configuration, ASCII text',
          'md': 'Markdown document, ASCII text',
          'txt': 'ASCII text',
          'html': 'HTML document, ASCII text',
          'css': 'CSS stylesheet, ASCII text',
          'elf': 'ELF 32-bit executable, MIPS',
          'vsm': 'PS2 VU Shader Microcode, ASCII text',
          'vcl': 'PS2 VU Microcode preprocessor, ASCII text',
          'vu': 'PS2 VU assembly, ASCII text',
          'irx': 'PS2 IOP relocatable module',
          'bin': 'data',
          'iso': 'ISO 9660 CD-ROM filesystem data',
        };
        addLine('output', `${args[0]}: ${fileTypes[ext] || 'data'}`);
        break;
      }

      case 'alias':
        if (!args[0]) {
          if (Object.keys(aliases).length === 0) {
            addLine('info', t.alias.empty);
          } else {
            addLine('info', `\x1b[1;33m${t.alias.list}:\x1b[0m`);
            Object.entries(aliases).forEach(([name, cmd]) => {
              addLine('output', `  alias ${name}='${cmd}'`);
            });
          }
        } else {
          const match = args.join(' ').match(/^(\w+)=(.+)$/);
          if (match) {
            const [, name, cmd] = match;
            setAliases(prev => ({ ...prev, [name]: cmd.replace(/^['"]|['"]$/g, '') }));
            addLine('success', `\x1b[1;32m✓\x1b[0m ${t.alias.set}: ${name}='${cmd}'`);
          } else {
            addLine('error', 'alias: Usage: alias name=command');
          }
        }
        break;

      case 'unalias':
        if (!args[0]) {
          addLine('error', 'unalias: missing operand');
        } else if (aliases[args[0]]) {
          setAliases(prev => {
            const newAliases = { ...prev };
            delete newAliases[args[0]];
            return newAliases;
          });
          addLine('success', `\x1b[1;32m✓\x1b[0m ${t.alias.removed}: ${args[0]}`);
        } else {
          addLine('error', `unalias: ${args[0]}: ${t.alias.notFound}`);
        }
        break;

      case 'export':
        if (!args[0]) {
          Object.entries(envVars).forEach(([key, val]) => {
            addLine('output', `export ${key}="${val}"`);
          });
        } else {
          const match = args.join(' ').match(/^(\w+)=(.*)$/);
          if (match) {
            const [, key, val] = match;
            setEnvVars(prev => ({ ...prev, [key]: val.replace(/^['"]|['"]$/g, '') }));
            addLine('success', `\x1b[1;32m✓\x1b[0m ${t.export.set}: ${key}`);
          } else {
            addLine('error', t.export.usage);
          }
        }
        break;

      case 'env':
      case 'printenv':
        if (Object.keys(envVars).length === 0) {
          addLine('info', t.env.empty);
        } else {
          Object.entries(envVars).forEach(([key, val]) => {
            addLine('output', `${key}=${val}`);
          });
        }
        // Add some default env vars
        addLines([
          { type: 'output', content: 'PATH=/usr/local/bin:/usr/bin:/bin' },
          { type: 'output', content: 'HOME=/home/dev' },
          { type: 'output', content: 'USER=dev' },
          { type: 'output', content: 'SHELL=/bin/zsh' },
          { type: 'output', content: 'PS2SDK=/usr/local/ps2dev/ps2sdk' },
          { type: 'output', content: `LANG=${language}` },
        ]);
        break;

      case 'unset':
        if (!args[0]) {
          addLine('error', 'unset: missing operand');
        } else if (envVars[args[0]]) {
          setEnvVars(prev => {
            const newEnv = { ...prev };
            delete newEnv[args[0]];
            return newEnv;
          });
          addLine('success', `\x1b[1;32m✓\x1b[0m ${t.env.unset}: ${args[0]}`);
        } else {
          addLine('error', `unset: ${args[0]}: not set`);
        }
        break;

      case 'touch':
        if (!args[0]) {
          addLine('error', `touch: ${t.touch.missingOperand}`);
        } else {
          addLine('info', `${t.touch.created} (${t.touch.simulated}): ${args[0]}`);
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          addLine('error', `mkdir: ${t.mkdir.missingOperand}`);
        } else {
          addLine('info', `${t.mkdir.created} (${t.mkdir.simulated}): ${args[0]}`);
        }
        break;

      case 'chmod':
        if (args.length < 2) {
          addLine('error', t.chmod.usage);
        } else {
          addLine('info', `${t.chmod.changed} (${t.chmod.simulated}): ${args[1]}`);
        }
        break;

      case 'which':
      case 'type':
        if (!args[0]) {
          addLine('error', `${cmd}: missing operand`);
        } else if (availableCommands.includes(args[0])) {
          addLine('output', `/usr/bin/${args[0]}`);
        } else {
          addLine('error', `${args[0]} ${t.which.notFound}`);
        }
        break;

      case 'man':
        if (!args[0]) {
          addLine('info', `${t.man.pages}: ${availableCommands.slice(0, 20).join(', ')}...`);
        } else {
          addLine('info', `${t.man.noManual} ${args[0]}`);
          addLine('output', 'Try "help" for available commands');
        }
        break;

      case 'time':
        if (args.length === 0) {
          addLine('output', `${t.time.elapsed}: 0.000s`);
        } else {
          const start = performance.now();
          addLine('output', `${t.time.elapsed}: ${((performance.now() - start) / 1000).toFixed(3)}s`);
        }
        break;

      case 'uptime':
        const uptime = Math.floor(Math.random() * 86400);
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        addLine('output', ` ${new Date().toTimeString().slice(0, 8)} up ${hours}:${mins.toString().padStart(2, '0')}, 1 user, load average: 0.00, 0.01, 0.05`);
        break;

      case 'neofetch':
        addLines([
          { type: 'info', content: '' },
          { type: 'output', content: '\x1b[1;36m        _____        \x1b[0m  \x1b[1;37mdev\x1b[0m@\x1b[1;37mathena\x1b[0m' },
          { type: 'output', content: '\x1b[1;36m       /     \\       \x1b[0m  ─────────────' },
          { type: 'output', content: '\x1b[1;36m      | () () |      \x1b[0m  \x1b[1;33mOS:\x1b[0m AthenaOS 2.1.0 PS2-DEV' },
          { type: 'output', content: '\x1b[1;36m       \\  ^  /       \x1b[0m  \x1b[1;33mHost:\x1b[0m ATHENA IDE Terminal' },
          { type: 'output', content: '\x1b[1;36m        |||||        \x1b[0m  \x1b[1;33mKernel:\x1b[0m 5.15.0-athena' },
          { type: 'output', content: '\x1b[1;36m        |||||        \x1b[0m  \x1b[1;33mShell:\x1b[0m ' + activeTab.shell },
          { type: 'output', content: '\x1b[1;36m   _____|   |_____   \x1b[0m  \x1b[1;33mTerminal:\x1b[0m athena-term' },
          { type: 'output', content: '\x1b[1;36m  /               \\  \x1b[0m  \x1b[1;33mCPU:\x1b[0m EE Core @ 294.912 MHz' },
          { type: 'output', content: '\x1b[1;36m /                 \\ \x1b[0m  \x1b[1;33mGPU:\x1b[0m Graphics Synthesizer' },
          { type: 'output', content: '\x1b[1;36m/___________________\\\x1b[0m  \x1b[1;33mMemory:\x1b[0m 32 MiB RDRAM' },
          { type: 'info', content: '' },
          { type: 'output', content: '                         \x1b[30m███\x1b[31m███\x1b[32m███\x1b[33m███\x1b[34m███\x1b[35m███\x1b[36m███\x1b[37m███\x1b[0m' },
          { type: 'info', content: '' },
        ]);
        break;

      case 'repos':
        if (args[0] === 'clean') {
          if (clonedRepos.length === 0) {
            addLine('info', t.repos.empty);
            break;
          }
          addLines([
            { type: 'warning', content: '' },
            { type: 'warning', content: `\x1b[1;33m⚠ ${t.repos.cleanWarning}\x1b[0m` },
            { type: 'info', content: `  ${clonedRepos.length} ${t.storage.repos} (${formatSize(storageStats.totalSize)})` },
            { type: 'info', content: '' },
          ]);
          
          saveClonedRepos([]);
          if (onClearClonedData) onClearClonedData();
          
          addLines([
            { type: 'success', content: `\x1b[1;32m✓\x1b[0m ${t.repos.cleanSuccess}` },
            { type: 'info', content: `  ${t.repos.cleanStorageCleared}` },
            { type: 'info', content: '' },
          ]);
          break;
        }
        
        addLines([
          { type: 'info', content: '' },
          { type: 'system', content: '\x1b[1;36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m' },
          { type: 'system', content: `\x1b[1;36m│\x1b[0m  \x1b[1;37m${t.repos.title}\x1b[0m                                           \x1b[1;36m│\x1b[0m` },
          { type: 'system', content: '\x1b[1;36m└─────────────────────────────────────────────────────────────────┘\x1b[0m' },
        ]);
        
        if (clonedRepos.length === 0) {
          addLines([
            { type: 'info', content: '' },
            { type: 'output', content: `  \x1b[2m${t.repos.empty}\x1b[0m` },
            { type: 'output', content: `  ${t.repos.cloneHint.replace('git clone <url>', '\x1b[1;33mgit clone <url>\x1b[0m')}` },
            { type: 'info', content: '' },
          ]);
        } else {
          addLine('info', '');
          clonedRepos.forEach((repo, idx) => {
            addLines([
              { type: 'output', content: `  \x1b[1;34m${idx + 1}. ${repo.name}\x1b[0m` },
              { type: 'output', content: `     ${t.repos.path}: ${repo.path}` },
              { type: 'output', content: `     ${t.repos.files}: ${repo.fileCount} | ${t.repos.folders}: ${repo.folderCount} | ${t.repos.size}: ${formatSize(repo.sizeBytes)}` },
              { type: 'output', content: `     ${t.repos.cloned}: ${repo.clonedAt.toLocaleString()}` },
              { type: 'info', content: '' },
            ]);
          });
          
          addLines([
            { type: 'info', content: `\x1b[1;35m  ${t.repos.storageSummary}:\x1b[0m` },
            { type: 'output', content: `    ${t.repos.total}: ${storageStats.repoCount} ${t.storage.repos} | ${storageStats.totalFiles} ${t.storage.files} | ${formatSize(storageStats.totalSize)}` },
            { type: 'info', content: '' },
            { type: 'info', content: '  \x1b[2mCommands: rm -rf <repo-name> | repos clean\x1b[0m' },
            { type: 'info', content: '' },
          ]);
        }
        break;

      case 'du':
        const showHuman = args.includes('-h');
        addLines([
          { type: 'info', content: '' },
          { type: 'output', content: `\x1b[1;37m${t.storage.diskUsage}:\x1b[0m` },
          { type: 'info', content: '' },
        ]);
        
        clonedRepos.forEach(repo => {
          const size = showHuman ? formatSize(repo.sizeBytes) : `${repo.sizeBytes}`;
          addLine('output', `${size.padStart(12)}  ${repo.path}`);
        });
        
        addLines([
          { type: 'info', content: '' },
          { type: 'output', content: `${(showHuman ? formatSize(storageStats.totalSize) : String(storageStats.totalSize)).padStart(12)}  \x1b[1;37mtotal\x1b[0m` },
          { type: 'info', content: '' },
        ]);
        break;

      case 'rm':
        if (args[0] === '-rf' && args[1]) {
          const repoName = args[1].replace(/^\//, '').replace(/\/$/, '');
          const repo = clonedRepos.find(r => r.name === repoName || r.path === `/${repoName}`);
          
          if (repo) {
            setRepoToDelete(repo);
            setShowDeleteDialog(true);
          } else {
            addLine('error', `rm: '${args[1]}': ${t.delete.noSuchRepo}`);
            addLine('info', t.delete.useReposHint.replace('"repos"', '\x1b[1;33m"repos"\x1b[0m'));
          }
        } else if (args[0] && !args[0].startsWith('-')) {
          addLine('error', `rm: '${args[0]}': Use rm -rf for directories`);
        } else {
          addLine('error', `rm: ${t.commands.missingOperand}`);
          addLine('info', t.delete.usageHint);
        }
        break;

      case 'git':
        if (args[0] === 'clone' && args[1]) {
          addLine('info', `${t.git.initializing}: ${args[1]}`);
          if (onCloneRepository) {
            onCloneRepository(args[1]);
          }
        } else if (args[0] === 'status') {
          addLines([
            { type: 'output', content: t.git.onBranch },
            { type: 'output', content: t.git.nothingToCommit },
          ]);
        } else if (args[0] === 'log') {
          addLines([
            { type: 'output', content: '\x1b[33mcommit abc1234567890...\x1b[0m' },
            { type: 'output', content: 'Author: Developer <dev@example.com>' },
            { type: 'output', content: `Date:   ${new Date().toDateString()}` },
            { type: 'output', content: '' },
            { type: 'output', content: `    ${t.git.initialCommit}` },
          ]);
        } else if (args[0] === 'branch') {
          addLine('output', '* \x1b[1;32mmain\x1b[0m');
        } else if (args[0] === 'remote') {
          addLine('output', 'origin');
        } else {
          addLine('error', `git: '${args[0] || ''}' ${t.git.notCommand}`);
        }
        break;

      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          addLine('info', `\x1b[1;33m⠋\x1b[0m ${t.npm.installing}`);
          
          setTimeout(() => {
            addLines([
              { type: 'output', content: '' },
              { type: 'output', content: `${t.npm.added} 847 ${t.npm.audited} 848 packages in 12s` },
              { type: 'output', content: '' },
              { type: 'output', content: `142 ${t.npm.funding}` },
              { type: 'output', content: '  run `npm fund` for details' },
              { type: 'output', content: '' },
              { type: 'success', content: `\x1b[1;32m✓\x1b[0m ${t.npm.complete}` },
              { type: 'output', content: '' },
            ]);
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 2500);
        } else if (args[0] === 'run' && args[1]) {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          addLine('info', `\x1b[2m> project@1.0.0 ${args[1]}\x1b[0m`);
          
          setTimeout(() => {
            addLine('success', `\x1b[1;32m✓\x1b[0m ${t.npm.executed}: '${args[1]}'`);
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 1500);
        } else {
          addLine('error', `npm: '${args[0] || ''}' ${t.npm.notRecognized}`);
        }
        break;

      case 'yarn':
        if (!args[0] || args[0] === 'install') {
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: true } : tab
          ));
          addLine('info', `\x1b[1;34myarn\x1b[0m ${t.npm.installing}`);
          
          setTimeout(() => {
            addLines([
              { type: 'output', content: '[1/4] Resolving packages...' },
              { type: 'output', content: '[2/4] Fetching packages...' },
              { type: 'output', content: '[3/4] Linking dependencies...' },
              { type: 'output', content: '[4/4] Building fresh packages...' },
              { type: 'success', content: '\x1b[1;32m✓\x1b[0m Done in 8.42s' },
            ]);
            setTabs(prev => prev.map((tab, idx) => 
              idx === activeTabIndex ? { ...tab, isRunning: false } : tab
            ));
          }, 2000);
        } else {
          addLine('info', `yarn ${args.join(' ')}`);
        }
        break;

      case 'make':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: true } : tab
        ));
        addLines([
          { type: 'output', content: `make: ${t.build.entering}` },
          { type: 'output', content: 'ee-gcc -c -O2 -G0 -I$PS2SDK/ee/include main.c -o main.o' },
        ]);
        
        setTimeout(() => addLine('output', 'ee-gcc -c -O2 -G0 draw.c -o draw.o'), 500);
        setTimeout(() => addLine('output', 'ee-ld -T$PS2SDK/ee/startup/linkfile main.o draw.o -o main.elf'), 1000);
        setTimeout(() => {
          addLines([
            { type: 'success', content: `\x1b[1;32m✓\x1b[0m ${t.build.success}: main.elf` },
            { type: 'output', content: '' },
          ]);
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: false } : tab
          ));
        }, 1500);
        break;

      case 'ps2-build':
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: true } : tab
        ));
        addLines([
          { type: 'info', content: '' },
          { type: 'info', content: `\x1b[1;35m🎮 ${t.build.ps2Title}\x1b[0m` },
          { type: 'info', content: '' },
        ]);
        
        setTimeout(() => addLine('output', `  → ${t.build.compiling}`), 300);
        setTimeout(() => addLine('output', `  → ${t.build.linking}`), 700);
        setTimeout(() => addLine('output', `  → ${t.build.processing}`), 1100);
        setTimeout(() => addLine('output', `  → ${t.build.generating}`), 1500);
        setTimeout(() => {
          addLines([
            { type: 'info', content: '' },
            { type: 'success', content: `\x1b[1;32m✓\x1b[0m ${t.build.complete}: \x1b[1;37moutput/game.elf\x1b[0m` },
            { type: 'info', content: '' },
          ]);
          setTabs(prev => prev.map((tab, idx) => 
            idx === activeTabIndex ? { ...tab, isRunning: false } : tab
          ));
        }, 2000);
        break;

      case 'ps2-run':
        addLines([
          { type: 'info', content: `\x1b[1;35m🎮 ${t.build.starting}\x1b[0m` },
          { type: 'output', content: 'PCSX2 loading: output/game.elf' },
        ]);
        setTimeout(() => addLine('success', `\x1b[1;32m✓\x1b[0m ${t.build.emulatorStarted}`), 800);
        break;

      case 'echo':
        // Handle environment variable expansion
        let echoOutput = args.join(' ');
        echoOutput = echoOutput.replace(/\$(\w+)/g, (_, varName) => envVars[varName] || '');
        addLine('output', echoOutput);
        break;

      case 'date':
        addLine('output', new Date().toString());
        break;

      case 'whoami':
        addLine('output', 'dev');
        break;

      case 'uname':
        if (args.includes('-a')) {
          addLine('output', 'AthenaOS 2.1.0 PS2-DEV x86_64 GNU/Linux');
        } else if (args.includes('-r')) {
          addLine('output', '5.15.0-athena');
        } else if (args.includes('-m')) {
          addLine('output', 'x86_64');
        } else {
          addLine('output', 'AthenaOS');
        }
        break;

      case 'history':
        if (args[0] === '-c') {
          setCommandHistory([]);
          addLine('info', 'History cleared');
        } else if (commandHistory.length === 0) {
          addLine('output', '\x1b[2m(no commands in history)\x1b[0m');
        } else {
          commandHistory.slice(-20).forEach((cmd, idx) => {
            addLine('output', `  ${String(idx + 1).padStart(4)}  ${cmd}`);
          });
        }
        break;

      case 'exit':
        if (onClose) onClose();
        break;

      case '':
        break;

      default:
        addLine('error', `${activeTab.shell}: ${cmd}: ${t.commands.notFound}`);
        addLine('info', t.commands.helpHint.replace('"help"', '\x1b[1;33m"help"\x1b[0m'));
    }
  }, [activeTab, addLine, addLines, onCloneRepository, onClose, activeTabIndex, 
      resolvePath, listDirectory, readFile, clonedRepos, storageStats, 
      saveClonedRepos, onClearClonedData, projectFiles, t, language, aliases, envVars, availableCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !activeTab.isRunning) {
      executeCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = inputValue.split(' ');
      const lastPart = parts[parts.length - 1];
      
      if (parts.length === 1) {
        const match = availableCommands.find(c => c.startsWith(lastPart));
        if (match) setInputValue(match);
      } else {
        const targetDir = activeTab.currentDirectory === '~' ? '/' : activeTab.currentDirectory.replace('~', '');
        const entries = listDirectory(targetDir);
        if (entries) {
          const match = entries.find(e => e.name.startsWith(lastPart));
          if (match) {
            parts[parts.length - 1] = match.name + (match.type === 'folder' ? '/' : '');
            setInputValue(parts.join(' '));
          }
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (activeTab.isRunning) {
        setTabs(prev => prev.map((tab, idx) => 
          idx === activeTabIndex ? { ...tab, isRunning: false } : tab
        ));
        addLine('error', '^C');
      } else {
        setInputValue('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setTabs(prev => prev.map((tab, idx) => 
        idx === activeTabIndex ? { ...tab, lines: [] } : tab
      ));
    }
  };

  const addNewTab = () => {
    const newTab: TerminalTab = {
      id: `terminal-${Date.now()}`,
      name: `zsh ${tabs.length + 1}`,
      lines: [
        { id: '1', type: 'system', content: `ATHENA Terminal - ${t.status.newSession}`, timestamp: new Date() },
      ],
      currentDirectory: '~',
      isRunning: false,
      shell: 'zsh'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabIndex(tabs.length);
  };

  const closeTab = (index: number) => {
    if (tabs.length === 1) return;
    setTabs(prev => prev.filter((_, i) => i !== index));
    if (activeTabIndex >= index && activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const changeShell = (shell: 'zsh' | 'bash' | 'powershell') => {
    setTabs(prev => prev.map((tab, idx) => 
      idx === activeTabIndex ? { ...tab, shell, name: shell } : tab
    ));
    addLine('info', `${t.status.switchedTo} ${shell}`);
  };

  const parseAnsiToSpans = (text: string): React.ReactNode[] => {
    const ansiRegex = /\x1b\[([0-9;]+)m/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let currentStyles: React.CSSProperties = {};
    let match;
    let keyCounter = 0;

    const resetStyles = (): React.CSSProperties => ({});
    
    const getStyleFromCode = (code: number): React.CSSProperties => {
      switch (code) {
        case 0: return resetStyles();
        case 1: return { fontWeight: 'bold' };
        case 2: return { opacity: 0.6 };
        case 30: return { color: '#1e1e1e' };
        case 31: return { color: '#f87171' };
        case 32: return { color: '#4ade80' };
        case 33: return { color: '#facc15' };
        case 34: return { color: '#60a5fa' };
        case 35: return { color: '#c084fc' };
        case 36: return { color: '#22d3ee' };
        case 37: return { color: '#e2e8f0' };
        default: return {};
      }
    };

    while ((match = ansiRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = text.slice(lastIndex, match.index);
        parts.push(
          <span key={keyCounter++} style={currentStyles}>
            {textSegment}
          </span>
        );
      }

      const codes = match[1].split(';').map(Number);
      for (const code of codes) {
        if (code === 0) {
          currentStyles = resetStyles();
        } else {
          currentStyles = { ...currentStyles, ...getStyleFromCode(code) };
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={keyCounter++} style={currentStyles}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : [text];
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'system': return 'text-purple-400';
      case 'input': return 'text-yellow-300';
      case 'warning': return 'text-amber-400';
      default: return 'text-foreground/90';
    }
  };

  return (
    <>
      <div 
        className={`flex flex-col bg-[#1e1e1e] border-t border-border ${isMaximized ? 'fixed inset-0 z-50' : 'h-full'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-2 py-1 bg-[#252526] border-b border-[#3c3c3c]">
          <div className="flex items-center gap-1">
            {/* Tabs */}
            <div className="flex items-center">
              {tabs.map((tab, index) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer border-r border-[#3c3c3c] transition-colors ${
                    index === activeTabIndex 
                      ? 'bg-[#1e1e1e] text-foreground' 
                      : 'bg-[#2d2d2d] text-muted-foreground hover:bg-[#333333]'
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                >
                  <Terminal className="w-3 h-3" />
                  <span>{tab.name}</span>
                  {tab.isRunning && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                  {tabs.length > 1 && (
                    <button
                      className="ml-1 hover:bg-[#444444] rounded p-0.5"
                      onClick={(e) => { e.stopPropagation(); closeTab(index); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#333333]"
              onClick={addNewTab}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs hover:bg-[#333333]">
                  <Globe className="w-3 h-3" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c] max-h-64 overflow-y-auto">
                {Object.entries(languageNames).map(([code, name]) => (
                  <DropdownMenuItem 
                    key={code}
                    className="text-xs" 
                    onClick={() => setLanguage(code as Language)}
                  >
                    <span className={code === language ? 'text-green-400' : ''}>{name}</span>
                    {code === language && <span className="ml-2 text-green-400">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Storage indicator */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs hover:bg-[#333333]"
              onClick={() => setShowStorageInfo(!showStorageInfo)}
              title="Storage usage"
            >
              <HardDrive className="w-3 h-3" />
              <span className="text-muted-foreground">{formatSize(storageStats.totalSize)}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs hover:bg-[#333333]">
                  <Terminal className="w-3 h-3" />
                  {activeTab.shell}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#252526] border-[#3c3c3c]">
                <DropdownMenuItem className="text-xs" onClick={() => changeShell('zsh')}>zsh</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => changeShell('bash')}>bash</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => changeShell('powershell')}>PowerShell</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs" onClick={() => executeCommand('repos')}>
                  <FolderOpen className="w-3 h-3 mr-2" />
                  {t.repos.title}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#333333]"
              onClick={() => setTabs(prev => prev.map((tab, idx) => 
                idx === activeTabIndex ? { ...tab, lines: [] } : tab
              ))}
              title="Clear terminal"
            >
              <Trash2 className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#333333]"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-[#333333]"
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Storage Info Banner */}
        {showStorageInfo && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3c3c3c] text-xs">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                <HardDrive className="w-3 h-3 inline mr-1" />
                {storageStats.repoCount} {t.storage.repos} | {storageStats.totalFiles} {t.storage.files} | {formatSize(storageStats.totalSize)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs text-amber-400 hover:bg-[#333333] hover:text-amber-300"
              onClick={() => executeCommand('repos clean')}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t.storage.cleanAll}
            </Button>
          </div>
        )}

        {/* Terminal Content */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-auto p-2 font-mono text-sm"
          style={{ fontFamily: 'Menlo, Monaco, "Courier New", monospace' }}
        >
          {activeTab.lines.map((line) => (
            <div key={line.id} className={`${getLineColor(line.type)} leading-5 whitespace-pre-wrap break-all`}>
              {line.content.includes('\x1b[') ? parseAnsiToSpans(line.content) : line.content}
            </div>
          ))}
          
          {/* Input Line */}
          <div className="flex items-center text-foreground/90 leading-5">
            <span className="text-green-400">{activeTab.currentDirectory}</span>
            <span className="text-foreground/70 mx-1">$</span>
            {activeTab.isRunning ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                {t.status.running}
                <span className="text-xs">({t.status.cancelHint})</span>
              </span>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none border-none text-foreground/90 caret-white"
                autoFocus
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-2 py-0.5 bg-[#007acc] text-white text-[10px]">
          <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <span>{activeTab.shell}</span>
            <span>{clonedRepos.length} {t.storage.repos}</span>
            <span className="text-cyan-200">{languageNames[language]}</span>
          </div>
          <div className="flex items-center gap-3">
            {activeTab.isRunning && (
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Running
              </span>
            )}
            <span>{activeTab.currentDirectory}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#252526] border-[#3c3c3c] text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              {t.delete.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t.delete.confirm} <strong className="text-foreground">{repoToDelete?.name}</strong>?
              <br />
              {t.delete.willRemove} {repoToDelete?.fileCount} {t.delete.freeSpace} {formatSize(repoToDelete?.sizeBytes || 0)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="hover:bg-[#333333]"
            >
              {t.delete.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRepo}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t.delete.deleteBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
