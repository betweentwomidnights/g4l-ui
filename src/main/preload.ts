// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

interface Payload {
  action: string;
  data?: any; // `data` is optional, only included when needed
}

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

const api = {
  send: (channel: string, data: any) => {
    console.log(`Preload sending ${channel} with data:`, data);
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: (data: any) => void) => {
    console.log(`Preload receiving on channel: ${channel}`);
    ipcRenderer.on(channel, (_, data) => {
      console.log(`Data received on channel ${channel}:`, data);
      func(data); // Now we are only passing the data, not the event.
    });
  },
  remove: (channel: string, func: (...args: any[]) => void) => {
    console.log(`Preload removing listener on channel: ${channel}`);
    ipcRenderer.removeListener(channel, func);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('api', {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: (data: any) => void) => {
    ipcRenderer.on(channel, (_event, data) => func(data));
  },
  remove: (channel: string, func: () => void) => {
    ipcRenderer.removeListener(channel, func);
  },
});

export type ElectronHandler = typeof electronHandler;

export type Api = typeof api;
