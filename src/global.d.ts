// src/global.d.ts
export { };

declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
      remove: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    };
  }
}
