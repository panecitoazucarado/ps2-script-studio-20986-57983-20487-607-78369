## Objetivo

Convertir el Visual UI Builder en un editor multi-escena tipo Android Studio Layout Editor para archivos `.js` de PS2, con:

1. Opción "Abrir con → Visual UI Builder" en el menú contextual del File Explorer (solo `.js`).
2. Sistema de pestañas internas dentro del Visual Builder para editar varias escenas a la vez.
3. Botón "Guardar escena" (sobrescribe el archivo origen) y "Aplicar al proyecto" (abre un mini File Explorer interno para elegir carpeta + nombre).
4. Mini File Explorer dentro del Visual Builder con árbol del proyecto, creación de carpetas nuevas e input de nombre de archivo.

## Cambios

### 1. `FileExplorer.tsx` — submenú "Abrir con"
- En el `ContextMenuSub` "Abrir con", añadir entrada **"Visual UI Builder"** visible solo cuando el archivo termine en `.js`.
- Al hacer clic, disparar evento global:
  ```ts
  window.dispatchEvent(new CustomEvent('athena:open-in-visual-builder', { detail: { path, name, content } }))
  ```

### 2. `IDELayoutContent.tsx` — abrir el Visual Builder con la escena
- Escuchar `athena:open-in-visual-builder`.
- Abrir/enfocar la ventana del Visual UI Builder y reenviar el archivo a éste mediante un nuevo evento `athena:vb-load-scene` (o prop/state).

### 3. `PS2VisualBuilder.tsx` — multi-escena + nuevo flujo de guardado

**a) Estado de pestañas (escenas)**
```ts
type Scene = {
  id: string;
  name: string;          // "escena_01.js" o nombre del archivo
  filePath: string|null; // null si nunca se ha guardado
  components: PS2Component[];
  selectedId: string|null;
  dirty: boolean;
};
const [scenes, setScenes] = useState<Scene[]>([defaultScene]);
const [activeSceneId, setActiveSceneId] = useState<string>(defaultScene.id);
```
- Barra de tabs en la cabecera (botón "+" para nueva escena, "x" para cerrar, doble click para renombrar).
- Toda la lógica actual (`components`, `selectedId`, undo/redo, etc.) pasa a operar sobre la escena activa.

**b) Carga desde archivo `.js`**
- Listener para `athena:vb-load-scene`: parsear el contenido del `.js` para reconstruir componentes (best effort: si el archivo fue generado por el builder, reusar el parser ya existente; si no, crear escena vacía con el código en un campo `rawCode`).
- Crear nueva pestaña con `filePath` apuntando al archivo origen.

**c) Botones de la cabecera**
Reemplazar el actual "Aplicar" por dos botones:
- **Guardar escena** (icono `Save`) — visible cuando `activeScene.filePath` existe. Sobrescribe el archivo original con el código generado vía `window.__athenaFS.writeFile(path, code)`.
- **Aplicar al proyecto** (icono `Download`) — siempre visible. Abre el diálogo de exportación.

**d) Diálogo "Aplicar al proyecto" (nuevo componente interno)**
- Modal con árbol del File Explorer (leer `window.__athenaFS.getTree()` o equivalente).
- Permite seleccionar carpeta destino, crear carpetas nuevas (botón "Nueva carpeta"), e input para el nombre del archivo (default `escena_01.js`).
- Al confirmar: `window.__athenaFS.writeFile(targetPath, code)` y actualiza `filePath` de la escena.

### 4. Detalles UX
- Tab activa con borde inferior azul, indicador de "•" si `dirty`.
- Confirmar al cerrar tab con cambios sin guardar.
- Persistir escenas abiertas en `sessionStorage` para sobrevivir reloads.

## Archivos tocados
- `src/components/IDE/FileExplorer.tsx` (añadir item en "Abrir con")
- `src/components/IDE/IDELayoutContent.tsx` (puente de eventos)
- `src/components/IDE/PS2VisualBuilder.tsx` (multi-escena + nuevos botones)
- `src/components/IDE/VisualBuilderSaveDialog.tsx` (nuevo, mini file explorer)

## Notas técnicas
- Usar `window.__athenaFS` ya documentado en memoria (`mem://file-explorer/ai-file-system-integration`) para todas las operaciones de FS.
- No tocar lógica de generación de código ni templates existentes — solo se añade el wrapping multi-escena y el flujo de guardado.