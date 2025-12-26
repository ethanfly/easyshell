/**
 * EasyShell - Electron 主进程
 */
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const databaseService = require('./src/services/database');
const sshService = require('./src/services/ssh');

let mainWindow;
const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

// 配置存储
const configStore = new Store({
  name: 'easyshell-config',
  defaults: {
    mysqlConfig: null,
  },
});

// 活动的SSH连接
const activeConnections = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0e14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/icon.png'),
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  }

  // 隐藏菜单栏
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用启动
app.whenReady().then(async () => {
  // 初始化本地数据库 (异步)
  await databaseService.initLocalDatabase();
  
  // 尝试自动连接 MySQL（如果有保存的配置）
  const savedConfig = configStore.get('mysqlConfig');
  if (savedConfig && savedConfig.host) {
    try {
      const result = await databaseService.connectMySQL(savedConfig);
      if (result.success) {
        console.log('✅ 自动连接 MySQL 成功');
        // 自动同步
        await databaseService.syncFromRemote();
      }
    } catch (err) {
      console.log('⚠️ 自动连接 MySQL 失败:', err.message);
    }
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // 关闭所有SSH连接
  sshService.disconnectAll();
  
  // 关闭前自动同步到远程
  if (databaseService.isRemoteConnected) {
    try {
      console.log('📤 正在同步数据到远程...');
      await databaseService.syncToRemote();
      console.log('✅ 数据同步完成');
    } catch (err) {
      console.error('❌ 关闭前同步失败:', err.message);
    }
  }
  
  // 关闭数据库
  databaseService.close();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ========== 窗口控制 IPC ==========

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized();
});

// ========== 数据库 IPC ==========

// 配置管理
ipcMain.handle('db:saveConfig', (event, config) => {
  configStore.set('mysqlConfig', config);
  return { success: true };
});

ipcMain.handle('db:getConfig', () => {
  return configStore.get('mysqlConfig');
});

// MySQL连接
ipcMain.handle('db:connectMySQL', async (event, config) => {
  return await databaseService.connectMySQL(config);
});

ipcMain.handle('db:disconnectMySQL', async () => {
  return await databaseService.disconnectMySQL();
});

ipcMain.handle('db:isRemoteConnected', () => {
  return databaseService.isRemoteConnected;
});

// 同步
ipcMain.handle('db:syncToRemote', async () => {
  return await databaseService.syncToRemote();
});

ipcMain.handle('db:syncFromRemote', async () => {
  return await databaseService.syncFromRemote();
});

ipcMain.handle('db:smartSync', async () => {
  return await databaseService.smartSync();
});

// 主机管理
ipcMain.handle('hosts:getAll', () => {
  return databaseService.getAllHosts();
});

ipcMain.handle('hosts:getById', (event, id) => {
  return databaseService.getHostById(id);
});

ipcMain.handle('hosts:add', (event, host) => {
  return databaseService.addHost(host);
});

ipcMain.handle('hosts:update', (event, { id, host }) => {
  return databaseService.updateHost(id, host);
});

ipcMain.handle('hosts:delete', (event, id) => {
  return databaseService.deleteHost(id);
});

// 命令
ipcMain.handle('commands:search', (event, keyword) => {
  return databaseService.searchCommands(keyword);
});

ipcMain.handle('commands:getAll', () => {
  return databaseService.getAllCommands();
});

ipcMain.handle('commands:add', (event, command) => {
  return databaseService.addCommand(command);
});

ipcMain.handle('commands:incrementUsage', (event, id) => {
  return databaseService.incrementCommandUsage(id);
});

// 命令片段
ipcMain.handle('snippets:getAll', () => {
  return databaseService.getAllSnippets();
});

ipcMain.handle('snippets:add', (event, snippet) => {
  return databaseService.addSnippet(snippet);
});

ipcMain.handle('snippets:delete', (event, id) => {
  return databaseService.deleteSnippet(id);
});

// ========== SSH IPC ==========

ipcMain.handle('ssh:connect', async (event, hostConfig) => {
  // 预先生成 connectionId
  const connectionId = `${hostConfig.host}:${hostConfig.port || 22}-${Date.now()}`;
  
  try {
    const connection = await sshService.connect(hostConfig, connectionId, {
      onData: (data) => {
        mainWindow?.webContents.send(`ssh:data:${connectionId}`, data);
      },
      onClose: () => {
        mainWindow?.webContents.send(`ssh:close:${connectionId}`);
        activeConnections.delete(connectionId);
      },
      onError: (error) => {
        mainWindow?.webContents.send(`ssh:error:${connectionId}`, error.message);
      },
    });

    activeConnections.set(connectionId, connection);
    
    // 更新最后连接时间
    if (hostConfig.id) {
      databaseService.updateLastConnected(hostConfig.id);
    }

    return { success: true, connectionId: connectionId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('ssh:write', (event, { connectionId, data }) => {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    connection.write(data);
  }
});

ipcMain.on('ssh:resize', (event, { connectionId, cols, rows }) => {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    connection.resize(cols, rows);
  }
});

ipcMain.on('ssh:disconnect', (event, connectionId) => {
  sshService.disconnect(connectionId);
  activeConnections.delete(connectionId);
});

ipcMain.handle('ssh:test', async (event, hostConfig) => {
  return await sshService.testConnection(hostConfig);
});

ipcMain.handle('ssh:exec', async (event, { hostConfig, command }) => {
  return await sshService.exec(hostConfig, command);
});

