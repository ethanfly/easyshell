/**
 * 服务器配置组件 - 用于移动端配置后端服务器地址
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiServer, FiX, FiCheck, FiRefreshCw, FiWifi, FiWifiOff } from 'react-icons/fi';
import { serverConfig, platform } from '../services/api';

function ServerConfig({ isOpen, onClose }) {
  const [serverUrl, setServerUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(serverConfig.getUrl());
      setIsConnected(serverConfig.isConnected());
    }
  }, [isOpen]);

  // 测试连接
  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({ success: true, message: '连接成功！服务器状态正常' });
      } else {
        setTestResult({ success: false, message: '服务器响应异常' });
      }
    } catch (error) {
      setTestResult({ success: false, message: `连接失败: ${error.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  // 保存配置
  const saveConfig = () => {
    serverConfig.setUrl(serverUrl);
    serverConfig.reconnect();
    setTestResult({ success: true, message: '配置已保存！正在重新连接...' });
    setTimeout(() => {
      setIsConnected(serverConfig.isConnected());
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-shell-surface border border-shell-border rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-shell-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-shell-accent/10 border border-shell-accent/30">
                <FiServer size={18} className="text-shell-accent" />
              </div>
              <div>
                <h3 className="text-shell-text font-semibold font-display">服务器配置</h3>
                <p className="text-shell-text-dim text-xs">配置 EasyShell 后端服务器</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-5 space-y-5">
            {/* 当前平台信息 */}
            <div className="p-3 rounded-lg bg-shell-card/50 border border-shell-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-shell-text-dim">当前平台</span>
                <span className="text-shell-accent font-mono">
                  {platform.isElectron() ? 'Electron (桌面)' : 
                   platform.isCapacitor() ? 'Capacitor (移动)' : 'Web'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-shell-text-dim">连接状态</span>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <FiWifi size={14} className="text-shell-success" />
                      <span className="text-shell-success">已连接</span>
                    </>
                  ) : (
                    <>
                      <FiWifiOff size={14} className="text-shell-error" />
                      <span className="text-shell-error">未连接</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 服务器地址输入 */}
            <div>
              <label className="block text-sm text-shell-text-dim mb-2">
                服务器地址
              </label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:3001"
                className="w-full px-4 py-3 bg-shell-bg border border-shell-border rounded-lg
                           text-shell-text font-mono text-sm
                           focus:border-shell-accent focus:outline-none transition-colors"
              />
              <p className="mt-2 text-xs text-shell-text-dim">
                请输入运行 EasyShell Server 的服务器地址
              </p>
            </div>

            {/* 测试结果 */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${
                  testResult.success 
                    ? 'bg-shell-success/10 border border-shell-success/30 text-shell-success' 
                    : 'bg-shell-error/10 border border-shell-error/30 text-shell-error'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {testResult.success ? <FiCheck size={16} /> : <FiX size={16} />}
                  {testResult.message}
                </div>
              </motion.div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={testConnection}
                disabled={isTesting || !serverUrl}
                className="flex-1 flex items-center justify-center gap-2 py-3 
                           bg-shell-card border border-shell-border rounded-lg
                           text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30
                           transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw size={16} className={isTesting ? 'animate-spin' : ''} />
                测试连接
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveConfig}
                disabled={!serverUrl}
                className="flex-1 btn-cyber flex items-center justify-center gap-2 py-3 
                           rounded-lg text-shell-accent font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheck size={16} />
                保存配置
              </motion.button>
            </div>

            {/* 帮助信息 */}
            <div className="p-4 rounded-lg bg-shell-accent/5 border border-shell-accent/20">
              <h4 className="text-shell-accent text-sm font-medium mb-2">💡 使用说明</h4>
              <ul className="text-shell-text-dim text-xs space-y-1">
                <li>1. 在电脑上运行 <code className="code-highlight">npm run server</code></li>
                <li>2. 确保手机和电脑在同一局域网</li>
                <li>3. 输入电脑的 IP 地址和端口 (默认 3001)</li>
                <li>4. 点击测试连接验证配置</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ServerConfig;

