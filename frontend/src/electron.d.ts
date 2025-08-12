// src/electron.d.ts
interface ElectronApi {
    ipcRenderer: {
      send<K extends keyof IpcChannels>(channel: K, ...args: IpcChannels[K]): void;
      // Add other ipcRenderer methods here if needed
    };
    launchMobaXterm: (credentials: { host: string; username: string; password: string }) => void;
    launchMedini: () => void;
    launchFaultinjection: () => void;
  }
  
  declare global {
    interface Window {
      electron: ElectronApi;
    }
  }
  