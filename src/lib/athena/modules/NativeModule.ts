// Native.compile / Native.struct mock for browser runtime
// In real PS2, this compiles JS to MIPS machine code
// In browser, we just call the JS function directly (passthrough)

export function createNativeModule(onLog: (msg: string) => void) {
  const compiledFunctions = new Map<Function, { codeSize: number; argCount: number; returnType: string }>();

  const Native = {
    compile: (spec: { args: string[]; returns: string }, fn: Function): Function => {
      const wrapper = (...args: any[]) => {
        try {
          return fn(...args);
        } catch (e: any) {
          onLog(`[NATIVE] Error in compiled function: ${e.message}`);
          return spec.returns === 'void' ? undefined : 0;
        }
      };
      compiledFunctions.set(wrapper, {
        codeSize: 64 * spec.args.length,
        argCount: spec.args.length,
        returnType: spec.returns
      });
      return wrapper;
    },

    struct: (name: string, fields: Record<string, any>, methods?: Record<string, Function>): any => {
      // Create a constructor function for the struct
      const StructClass = function(this: any) {
        for (const [key, type] of Object.entries(fields)) {
          if (typeof type === 'object' && type.type && type.length) {
            // Array field
            if (type.type === 'float') {
              this[key] = new Float32Array(type.length);
            } else if (type.type === 'int') {
              this[key] = new Int32Array(type.length);
            } else {
              this[key] = new Float32Array(type.length);
            }
          } else {
            // Scalar field
            this[key] = 0;
          }
        }
        // Bind methods
        if (methods) {
          for (const [methodName, methodFn] of Object.entries(methods)) {
            this[methodName] = (...args: any[]) => (methodFn as Function)(this, ...args);
          }
        }
      } as any;

      StructClass.prototype.__structName = name;
      onLog(`[NATIVE] Struct '${name}' defined with ${Object.keys(fields).length} fields`);
      return StructClass;
    },

    free: (fn: Function) => {
      compiledFunctions.delete(fn);
    },

    getInfo: (fn: Function) => {
      return compiledFunctions.get(fn) || { codeSize: 0, argCount: 0, returnType: 'void' };
    },

    benchmark: (fn: Function, iterations: number): number => {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        fn(i, i + 1);
      }
      return performance.now() - start;
    },

    disassemble: (fn: Function): string => {
      return `; Native MIPS R5900 disassembly (simulated)\n; Function at 0x${(Math.random() * 0xFFFFFF | 0).toString(16)}\n  addiu sp, sp, -16\n  sw ra, 12(sp)\n  ; ... (browser simulation)\n  lw ra, 12(sp)\n  jr ra\n  addiu sp, sp, 16`;
    }
  };

  return Native;
}
