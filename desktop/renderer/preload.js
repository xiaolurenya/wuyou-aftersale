const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('wuyou',{
  cfg:()=>ipcRenderer.invoke('cfg-get'),
  connect:(o)=>ipcRenderer.invoke('connect',o),
  autoLogin:()=>ipcRenderer.invoke('auto-login'),
  forget:()=>ipcRenderer.invoke('forget'),
  back:()=>ipcRenderer.invoke('back-to-login')
});
