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
    saveConfig: (config) => ipcRenderer.invoke('db:saveConfig', config),
    getConfig: () => ipcRenderer.invoke('db:getConfig'),
    connectMySQL: (config) => ipcRenderer.invoke('db:connectMySQL', config),
    disconnectMySQL: () => ipcRenderer.invoke('db:disconnectMySQL'),
    isRemoteConnected: () => ipcRenderer.invoke('db:isRemoteConnected'),
    syncToRemote: () => ipcRenderer.invoke('db:syncToRemote'),
    syncFromRemote: () => ipcRenderer.invoke('db:syncFromRemote'),
    smartSync: () => ipcRenderer.invoke('db:smartSync'),
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

  // SFTP 文件操作
  sftp: {
    list: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:list', { hostConfig, remotePath }),
    download: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:download', { hostConfig, remotePath }),
    upload: (hostConfig, localPath, remotePath) => ipcRenderer.invoke('sftp:upload', { hostConfig, localPath, remotePath }),
    delete: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:delete', { hostConfig, remotePath }),
    mkdir: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:mkdir', { hostConfig, remotePath }),
    rmdir: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:rmdir', { hostConfig, remotePath }),
    rename: (hostConfig, oldPath, newPath) => ipcRenderer.invoke('sftp:rename', { hostConfig, oldPath, newPath }),
    writeFile: (hostConfig, remotePath, content) => ipcRenderer.invoke('sftp:writeFile', { hostConfig, remotePath, content }),
    readFile: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:readFile', { hostConfig, remotePath }),
    stat: (hostConfig, remotePath) => ipcRenderer.invoke('sftp:stat', { hostConfig, remotePath }),
    chmod: (hostConfig, remotePath, mode) => ipcRenderer.invoke('sftp:chmod', { hostConfig, remotePath, mode }),
    chown: (hostConfig, remotePath, uid, gid) => ipcRenderer.invoke('sftp:chown', { hostConfig, remotePath, uid, gid }),
    
    // 传输进度事件
    onProgress: (callback) => {
      const channel = 'sftp:progress';
      ipcRenderer.on(channel, (event, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners(channel);
    },
  },
});

