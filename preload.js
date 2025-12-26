/**
 * EasyShell - 预加载脚本
 * 安全地暴露Node.js API给渲染进程
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // 数据库操作
  db: {
    connectMySQL: (config) => ipcRenderer.invoke('db:connectMySQL', config),
    disconnectMySQL: () => ipcRenderer.invoke('db:disconnectMySQL'),
    isRemoteConnected: () => ipcRenderer.invoke('db:isRemoteConnected'),
    syncToRemote: () => ipcRenderer.invoke('db:syncToRemote'),
    syncFromRemote: () => ipcRenderer.invoke('db:syncFromRemote'),
  },

  // 主机管理
  hosts: {
    getAll: () => ipcRenderer.invoke('hosts:getAll'),
    getById: (id) => ipcRenderer.invoke('hosts:getById', id),
    add: (host) => ipcRenderer.invoke('hosts:add', host),
    update: (id, host) => ipcRenderer.invoke('hosts:update', { id, host }),
    delete: (id) => ipcRenderer.invoke('hosts:delete', id),
  },

  // 命令
  commands: {
    search: (keyword) => ipcRenderer.invoke('commands:search', keyword),
    getAll: () => ipcRenderer.invoke('commands:getAll'),
    add: (command) => ipcRenderer.invoke('commands:add', command),
    incrementUsage: (id) => ipcRenderer.invoke('commands:incrementUsage', id),
  },

  // 命令片段
  snippets: {
    getAll: () => ipcRenderer.invoke('snippets:getAll'),
    add: (snippet) => ipcRenderer.invoke('snippets:add', snippet),
    delete: (id) => ipcRenderer.invoke('snippets:delete', id),
  },

  // SSH
  ssh: {
    connect: (hostConfig) => ipcRenderer.invoke('ssh:connect', hostConfig),
    write: (connectionId, data) => ipcRenderer.send('ssh:write', { connectionId, data }),
    resize: (connectionId, cols, rows) => ipcRenderer.send('ssh:resize', { connectionId, cols, rows }),
    disconnect: (connectionId) => ipcRenderer.send('ssh:disconnect', connectionId),
    test: (hostConfig) => ipcRenderer.invoke('ssh:test', hostConfig),
    exec: (hostConfig, command) => ipcRenderer.invoke('ssh:exec', { hostConfig, command }),
    
    // 事件监听
    onData: (connectionId, callback) => {
      const channel = `ssh:data:${connectionId}`;
      ipcRenderer.on(channel, (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onClose: (connectionId, callback) => {
      const channel = `ssh:close:${connectionId}`;
      ipcRenderer.on(channel, () => callback());
      return () => ipcRenderer.removeAllListeners(channel);
    },
    onError: (connectionId, callback) => {
      const channel = `ssh:error:${connectionId}`;
      ipcRenderer.on(channel, (event, error) => callback(error));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },
});

