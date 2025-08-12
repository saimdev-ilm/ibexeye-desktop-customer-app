// src/global.d.ts

interface IpcChannels {
  'minimize-main-window': [];
  'maximize-main-window': [];
  'close-main-window': [];
  'minimize-window': [];
  'maximize-window': [];
  'close-window': [];
  'dialog:openDirectory': []; // Add the channel you are using
  'window-state-changed': []; // Define the type of arguments for this channel
  'resize': []; // Add resize event channel
  'getWindowSize': [];
  // Add any additional IPC channels here if needed
}

interface Window {
  electron: {
    ipcRenderer: {
      send<K extends keyof IpcChannels>(channel: K, ...args: IpcChannels[K]): void;
      on<K extends keyof IpcChannels>(channel: K, callback: (...args: IpcChannels[K]) => void): void;
      once<K extends keyof IpcChannels>(channel: K, callback: (...args: IpcChannels[K]) => void): void;
      removeListener<K extends keyof IpcChannels>(channel: K, callback: (...args: IpcChannels[K]) => void): void;
      invoke<K extends keyof IpcChannels>(channel: K, ...args: IpcChannels[K]): Promise<any>;
    };
  };
  electronAPI: {
    launchMobaXterm: (options: { host: string; username: string; password: string }) => void;
    launchMedini: () => void;
    launchFaultinjection: () => void;
    launchSecure: () => void;
  };
}
