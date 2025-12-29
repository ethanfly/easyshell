/**
 * EasyShell - 跨平台 API 适配层
 * 自动检测环境并使用对应的通信方式：
 * - Electron 环境: 使用 IPC 直连
 * - Web/Mobile 环境: 使用 WebSocket 连接服务器
 */
import { io } from 'socket.io-client';

// 检测是否在 Electron 环境中
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// 检测是否是 Capacitor 环境
const isCapacitor = () => {
  return typeof window !== 'undefined' && window.Capacitor !== undefined;
};

// 服务器地址配置
const getServerUrl = () => {
  // 可以从本地存储读取配置的服务器地址
  const savedUrl = localStorage.getItem('easyshell_server_url');
  if (savedUrl) return savedUrl;
  
  // 默认地址
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // 生产环境需要配置实际的服务器地址
  return localStorage.getItem('easyshell_server_url') || 'http://localhost:3001';
};

// Socket.IO 客户端实例
let socket = null;
let connectionListeners = new Map();

// 初始化 WebSocket 连接
const initSocket = () => {
  if (socket?.connected) return socket;
  
  const serverUrl = getServerUrl();
  console.log(`🔌 连接服务器: ${serverUrl}`);
  
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ 服务器连接成功');
  });

  socket.on('disconnect', () => {
    console.log('📤 服务器连接断开');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ 服务器连接错误:', error.message);
  });

  return socket;
};

// 确保 Socket 连接
const ensureSocket = () => {
  if (!socket || !socket.connected) {
    initSocket();
  }
  return socket;
};

// ========== WebSocket API 实现 ==========

const webSocketAPI = {
  // SSH 操作
  ssh: {
    connect: (hostConfig) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('ssh:connect', hostConfig, resolve);
      });
    },

    write: (connectionId, data) => {
      const sock = ensureSocket();
      sock.emit('ssh:write', { connectionId, data });
    },

    resize: (connectionId, cols, rows) => {
      const sock = ensureSocket();
      sock.emit('ssh:resize', { connectionId, cols, rows });
    },

    disconnect: (connectionId) => {
      const sock = ensureSocket();
      sock.emit('ssh:disconnect', connectionId);
    },

    exec: (hostConfig, command) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('ssh:exec', { hostConfig, command }, resolve);
      });
    },

    test: async (hostConfig) => {
      try {
        const result = await webSocketAPI.ssh.exec(hostConfig, 'echo "connected"');
        return { success: result.success, message: result.success ? '连接成功' : result.error };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    onData: (connectionId, callback) => {
      const sock = ensureSocket();
      const channel = `ssh:data:${connectionId}`;
      sock.on(channel, callback);
      return () => sock.off(channel, callback);
    },

    onClose: (connectionId, callback) => {
      const sock = ensureSocket();
      const channel = `ssh:close:${connectionId}`;
      sock.on(channel, callback);
      return () => sock.off(channel, callback);
    },

    onError: (connectionId, callback) => {
      const sock = ensureSocket();
      const channel = `ssh:error:${connectionId}`;
      sock.on(channel, callback);
      return () => sock.off(channel, callback);
    },
  },

  // SFTP 操作
  sftp: {
    list: (hostConfig, remotePath) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:list', { hostConfig, remotePath }, resolve);
      });
    },

    mkdir: (hostConfig, remotePath) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:mkdir', { hostConfig, remotePath }, resolve);
      });
    },

    delete: (hostConfig, remotePath) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:delete', { hostConfig, remotePath }, resolve);
      });
    },

    rmdir: (hostConfig, remotePath) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:rmdir', { hostConfig, remotePath }, resolve);
      });
    },

    rename: (hostConfig, oldPath, newPath) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:rename', { hostConfig, oldPath, newPath }, resolve);
      });
    },

    readFile: (hostConfig, remotePath) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:readFile', { hostConfig, remotePath }, resolve);
      });
    },

    writeFile: (hostConfig, remotePath, content) => {
      return new Promise((resolve) => {
        const sock = ensureSocket();
        sock.emit('sftp:writeFile', { hostConfig, remotePath, content }, resolve);
      });
    },

    // 移动端暂不支持文件下载/上传进度
    download: async (hostConfig, remotePath) => {
      // 移动端通过读取文件内容来"下载"
      const result = await webSocketAPI.sftp.readFile(hostConfig, remotePath);
      if (result.success) {
        // 创建 Blob 并触发下载
        const blob = new Blob([result.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = remotePath.split('/').pop();
        a.click();
        URL.revokeObjectURL(url);
        return { success: true };
      }
      return result;
    },

    upload: async (hostConfig, localPath, remotePath) => {
      // 移动端需要通过文件选择器获取内容
      return { success: false, error: '请使用文件选择器上传' };
    },

    onProgress: (callback) => {
      // WebSocket 模式暂不支持进度回调
      return () => {};
    },
  },

  // 主机管理 - 使用本地存储
  hosts: {
    getAll: () => {
      const hosts = localStorage.getItem('easyshell_hosts');
      return hosts ? JSON.parse(hosts) : [];
    },

    getById: (id) => {
      const hosts = webSocketAPI.hosts.getAll();
      return hosts.find(h => h.id === id);
    },

    add: (host) => {
      const hosts = webSocketAPI.hosts.getAll();
      const newHost = {
        ...host,
        id: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      hosts.push(newHost);
      localStorage.setItem('easyshell_hosts', JSON.stringify(hosts));
      return newHost;
    },

    update: (id, data) => {
      const hosts = webSocketAPI.hosts.getAll();
      const index = hosts.findIndex(h => h.id === id);
      if (index !== -1) {
        hosts[index] = { ...hosts[index], ...data, updated_at: Date.now() };
        localStorage.setItem('easyshell_hosts', JSON.stringify(hosts));
        return hosts[index];
      }
      return null;
    },

    delete: (id) => {
      const hosts = webSocketAPI.hosts.getAll();
      const filtered = hosts.filter(h => h.id !== id);
      localStorage.setItem('easyshell_hosts', JSON.stringify(filtered));
      return { success: true };
    },
  },

  // 命令管理 - 使用本地存储
  commands: {
    getAll: () => {
      const commands = localStorage.getItem('easyshell_commands');
      return commands ? JSON.parse(commands) : [];
    },

    search: (keyword) => {
      const commands = webSocketAPI.commands.getAll();
      if (!keyword) return commands;
      return commands.filter(c => 
        c.command.includes(keyword) || c.description?.includes(keyword)
      );
    },

    add: (command) => {
      const commands = webSocketAPI.commands.getAll();
      const existing = commands.find(c => c.command === command.command);
      if (existing) {
        existing.usage_count = (existing.usage_count || 0) + 1;
      } else {
        commands.push({ ...command, id: Date.now(), usage_count: 1 });
      }
      localStorage.setItem('easyshell_commands', JSON.stringify(commands));
      return command;
    },

    incrementUsage: (id) => {
      const commands = webSocketAPI.commands.getAll();
      const cmd = commands.find(c => c.id === id);
      if (cmd) {
        cmd.usage_count = (cmd.usage_count || 0) + 1;
        localStorage.setItem('easyshell_commands', JSON.stringify(commands));
      }
    },
  },

  // 代码片段 - 使用本地存储
  snippets: {
    getAll: () => {
      const snippets = localStorage.getItem('easyshell_snippets');
      return snippets ? JSON.parse(snippets) : [];
    },

    add: (snippet) => {
      const snippets = webSocketAPI.snippets.getAll();
      snippets.push({ ...snippet, id: Date.now() });
      localStorage.setItem('easyshell_snippets', JSON.stringify(snippets));
      return snippet;
    },

    delete: (id) => {
      const snippets = webSocketAPI.snippets.getAll();
      const filtered = snippets.filter(s => s.id !== id);
      localStorage.setItem('easyshell_snippets', JSON.stringify(filtered));
      return { success: true };
    },
  },

  // 数据库同步 - WebSocket 模式使用本地存储
  db: {
    saveConfig: (config) => {
      localStorage.setItem('easyshell_db_config', JSON.stringify(config));
      return { success: true };
    },

    getConfig: () => {
      const config = localStorage.getItem('easyshell_db_config');
      return config ? JSON.parse(config) : null;
    },

    isRemoteConnected: () => false,
    connectMySQL: async () => ({ success: false, error: '移动端暂不支持 MySQL 同步' }),
    disconnectMySQL: async () => ({ success: true }),
    syncToRemote: async () => ({ success: false }),
    syncFromRemote: async () => ({ success: false }),
    smartSync: async () => ({ success: false }),
  },

  // 窗口控制 - 移动端不需要
  window: {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    isMaximized: () => false,
  },
};

// ========== 导出统一 API ==========

// 根据环境选择 API 实现
export const getAPI = () => {
  if (isElectron()) {
    console.log('📱 使用 Electron API');
    return window.electronAPI;
  } else {
    console.log('🌐 使用 WebSocket API');
    return webSocketAPI;
  }
};

// 服务器配置
export const serverConfig = {
  getUrl: getServerUrl,
  
  setUrl: (url) => {
    localStorage.setItem('easyshell_server_url', url);
    // 重新连接
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  
  isConnected: () => socket?.connected || false,
  
  reconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    initSocket();
  },
};

// 平台检测
export const platform = {
  isElectron,
  isCapacitor,
  isMobile: () => isCapacitor() || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
  isDesktop: () => isElectron() || (!isCapacitor() && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)),
};

export default getAPI;

