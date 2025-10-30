import { contextBridge, ipcRenderer } from 'electron'

export type IpcApi = {
  ping: () => Promise<string>
  getPlatform: () => Promise<string>
  getAppVersion: () => Promise<string>
}

const api: IpcApi = {
  ping: () => ipcRenderer.invoke('ping'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
}

contextBridge.exposeInMainWorld('ipcApi', api)

declare global {
  interface Window {
    ipcApi: IpcApi
  }
}
