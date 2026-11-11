const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('wuyou',{
  cfg:()=>ipcRenderer.invoke('cfg-get'),
  connect:(o)=>ipcRenderer.invoke('connect',o),
  back:()=>ipcRenderer.invoke('back-to-login')
});
