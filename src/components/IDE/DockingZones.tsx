export function DockingZones() {
  const zoneClass = "absolute bg-ps2-cyan/20 border-2 border-ps2-cyan/50 backdrop-blur-sm transition-all duration-200 pointer-events-none";
  const threshold = 100;

  return (
    <div className="fixed inset-0 pointer-events-none z-[2000]">
      {/* Left Zone */}
      <div 
        className={zoneClass}
        style={{
          left: 0,
          top: 0,
          width: threshold,
          height: '100%',
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-ps2-cyan font-bold text-lg rotate-[-90deg]">IZQUIERDA</span>
        </div>
      </div>

      {/* Right Zone */}
      <div 
        className={zoneClass}
        style={{
          right: 0,
          top: 0,
          width: threshold,
          height: '100%',
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-ps2-cyan font-bold text-lg rotate-90">DERECHA</span>
        </div>
      </div>

      {/* Top Zone */}
      <div 
        className={zoneClass}
        style={{
          left: threshold,
          right: threshold,
          top: 0,
          height: threshold,
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-ps2-cyan font-bold text-lg">ARRIBA</span>
        </div>
      </div>

      {/* Bottom Zone */}
      <div 
        className={zoneClass}
        style={{
          left: threshold,
          right: threshold,
          bottom: 0,
          height: threshold,
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-ps2-cyan font-bold text-lg">ABAJO</span>
        </div>
      </div>
    </div>
  );
}
