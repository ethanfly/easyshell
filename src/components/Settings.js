import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiX,
  FiDatabase,
  FiCloud,
  FiCloudOff,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiCheck,
  FiLoader,
  FiAlertCircle,
} from 'react-icons/fi';

function Settings({ onClose, isRemoteConnected, onConnectionChange }) {
  const [activeTab, setActiveTab] = useState('database');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [mysqlConfig, setMysqlConfig] = useState({
    host: '',
    port: 3306,
    user: '',
    password: '',
    database: 'easyshell',
  });

  const handleConnect = async () => {
    if (!window.electronAPI) return;

    setConnecting(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.db.connectMySQL(mysqlConfig);
      if (result.success) {
        setMessage({ type: 'success', text: '数据库连接成功！已自动创建数据库和表结构' });
        onConnectionChange(true);
      } else {
        setMessage({ type: 'error', text: `连接失败: ${result.error}` });
        onConnectionChange(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: `连接失败: ${error.message}` });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.electronAPI) return;

    await window.electronAPI.db.disconnectMySQL();
    onConnectionChange(false);
    setMessage({ type: 'success', text: '已断开远程数据库连接' });
  };

  const handleSyncToRemote = async () => {
    if (!window.electronAPI) return;

    setSyncing(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.db.syncToRemote();
      if (result.success) {
        setMessage({ type: 'success', text: `同步成功！已上传 ${result.synced} 条主机信息` });
      } else {
        setMessage({ type: 'error', text: `同步失败: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `同步失败: ${error.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromRemote = async () => {
    if (!window.electronAPI) return;

    setSyncing(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.db.syncFromRemote();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `同步成功！已下载 ${result.hosts} 条主机信息和 ${result.commands} 条命令` 
        });
      } else {
        setMessage({ type: 'error', text: `同步失败: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `同步失败: ${error.message}` });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-shell-surface border border-shell-border rounded-xl shadow-2xl w-full max-w-2xl"
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-shell-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-shell-text">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="px-6 pt-4 border-b border-shell-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('database')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'database'
                  ? 'border-shell-accent text-shell-accent'
                  : 'border-transparent text-shell-text-dim hover:text-shell-text'
              }`}
            >
              <span className="flex items-center gap-2">
                <FiDatabase size={16} />
                数据库同步
              </span>
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="p-6">
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* 连接状态 */}
              <div className={`p-4 rounded-lg border flex items-center justify-between ${
                isRemoteConnected 
                  ? 'bg-shell-success/10 border-shell-success/30'
                  : 'bg-shell-card border-shell-border'
              }`}>
                <div className="flex items-center gap-3">
                  {isRemoteConnected ? (
                    <FiCloud className="text-shell-success" size={24} />
                  ) : (
                    <FiCloudOff className="text-shell-text-dim" size={24} />
                  )}
                  <div>
                    <div className="font-medium text-shell-text">
                      {isRemoteConnected ? '已连接远程数据库' : '本地离线模式'}
                    </div>
                    <div className="text-sm text-shell-text-dim">
                      {isRemoteConnected 
                        ? '数据将自动同步到MySQL服务器' 
                        : '数据仅保存在本地SQLite数据库'
                      }
                    </div>
                  </div>
                </div>
                {isRemoteConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 border border-shell-error/50 text-shell-error 
                               rounded-md hover:bg-shell-error/10 transition-colors text-sm"
                  >
                    断开连接
                  </button>
                )}
              </div>

              {/* MySQL配置表单 */}
              {!isRemoteConnected && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-shell-text">MySQL 连接配置</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-shell-text-dim mb-2">
                        主机地址
                      </label>
                      <input
                        type="text"
                        value={mysqlConfig.host}
                        onChange={(e) => setMysqlConfig({ ...mysqlConfig, host: e.target.value })}
                        className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                   text-shell-text placeholder-shell-text-dim/50
                                   focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                        placeholder="localhost 或 IP地址"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-shell-text-dim mb-2">
                        端口
                      </label>
                      <input
                        type="number"
                        value={mysqlConfig.port}
                        onChange={(e) => setMysqlConfig({ ...mysqlConfig, port: parseInt(e.target.value) || 3306 })}
                        className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                   text-shell-text placeholder-shell-text-dim/50
                                   focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-shell-text-dim mb-2">
                        用户名
                      </label>
                      <input
                        type="text"
                        value={mysqlConfig.user}
                        onChange={(e) => setMysqlConfig({ ...mysqlConfig, user: e.target.value })}
                        className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                   text-shell-text placeholder-shell-text-dim/50
                                   focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                        placeholder="root"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-shell-text-dim mb-2">
                        密码
                      </label>
                      <input
                        type="password"
                        value={mysqlConfig.password}
                        onChange={(e) => setMysqlConfig({ ...mysqlConfig, password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                   text-shell-text placeholder-shell-text-dim/50
                                   focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-shell-text-dim mb-2">
                      数据库名称
                    </label>
                    <input
                      type="text"
                      value={mysqlConfig.database}
                      onChange={(e) => setMysqlConfig({ ...mysqlConfig, database: e.target.value })}
                      className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                 text-shell-text placeholder-shell-text-dim/50
                                 focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                      placeholder="easyshell"
                    />
                    <p className="text-xs text-shell-text-dim mt-1">
                      如果数据库不存在，将自动创建
                    </p>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={connecting || !mysqlConfig.host || !mysqlConfig.user}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3
                               bg-shell-accent rounded-lg text-white font-medium
                               hover:bg-shell-accent/80 disabled:opacity-50 
                               disabled:cursor-not-allowed transition-all btn-glow"
                  >
                    {connecting ? (
                      <>
                        <FiLoader className="animate-spin" size={18} />
                        连接中...
                      </>
                    ) : (
                      <>
                        <FiDatabase size={18} />
                        连接数据库
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 同步操作 */}
              {isRemoteConnected && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-shell-text">数据同步</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleSyncToRemote}
                      disabled={syncing}
                      className="flex items-center justify-center gap-2 px-4 py-3
                                 bg-shell-card border border-shell-border rounded-lg
                                 hover:border-shell-accent/50 hover:bg-shell-card/80
                                 disabled:opacity-50 transition-all"
                    >
                      {syncing ? (
                        <FiLoader className="animate-spin" size={18} />
                      ) : (
                        <FiUpload size={18} />
                      )}
                      <span>上传到远程</span>
                    </button>

                    <button
                      onClick={handleSyncFromRemote}
                      disabled={syncing}
                      className="flex items-center justify-center gap-2 px-4 py-3
                                 bg-shell-card border border-shell-border rounded-lg
                                 hover:border-shell-accent/50 hover:bg-shell-card/80
                                 disabled:opacity-50 transition-all"
                    >
                      {syncing ? (
                        <FiLoader className="animate-spin" size={18} />
                      ) : (
                        <FiDownload size={18} />
                      )}
                      <span>从远程下载</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 消息提示 */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    message.type === 'success'
                      ? 'bg-shell-success/10 border-shell-success/30 text-shell-success'
                      : 'bg-shell-error/10 border-shell-error/30 text-shell-error'
                  }`}
                >
                  {message.type === 'success' ? (
                    <FiCheck size={20} className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiAlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Settings;

