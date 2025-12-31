import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Terminal from './components/Terminal';
import HostManager from './components/HostManager';
import Settings from './components/Settings';
import CommandPalette from './components/CommandPalette';
import HostInfoPanel from './components/HostInfoPanel';
import SFTPBrowser from './components/SFTPBrowser';
import ServerConfig from './components/ServerConfig';
import HostEditPanel from './components/HostEditPanel';
import { getAPI, platform } from './services/api';

function App() {
  const [hosts, setHosts] = useState([]);
  const [activeTabs, setActiveTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [showHostManager, setShowHostManager] = useState(false);
  const [editingHost, setEditingHost] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSFTP, setShowSFTP] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null); // 选中的主机（用于右侧编辑面板）

  // 获取跨平台 API
  const api = useMemo(() => getAPI(), []);
  
  // 检测是否是移动端
  const isMobile = platform.isMobile();

  // 加载主机列表
  const loadHosts = useCallback(async () => {
    const hostList = await api.hosts.getAll();
    setHosts(hostList || []);
  }, [api]);

  // 检查远程连接状态
  const checkRemoteStatus = useCallback(async () => {
    const connected = await api.db.isRemoteConnected();
    setIsRemoteConnected(connected);
    // 如果已连接，刷新主机列表（因为启动时可能已自动同步）
    if (connected) {
      loadHosts();
    }
  }, [api, loadHosts]);

  useEffect(() => {
    loadHosts();
    checkRemoteStatus();
  }, [loadHosts, checkRemoteStatus]);

  // 关闭标签页 (需要在 useEffect 之前定义)
  const closeTab = useCallback((tabId) => {
    setActiveTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      return newTabs;
    });
    setActiveTabId((prevActiveId) => {
      if (prevActiveId === tabId) {
        // 找到要关闭的标签的索引
        const tabIndex = activeTabs.findIndex(t => t.id === tabId);
        const remainingTabs = activeTabs.filter((t) => t.id !== tabId);
        if (remainingTabs.length > 0) {
          // 优先切换到右边的标签，否则切换到左边的
          const newIndex = Math.min(tabIndex, remainingTabs.length - 1);
          return remainingTabs[newIndex].id;
        }
        return null;
      }
      return prevActiveId;
    });
  }, [activeTabs]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K: 打开命令面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl+W: 关闭当前标签页
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }
      // Escape: 关闭弹窗
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowHostManager(false);
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, closeTab]);

  // 连接主机
  const connectHost = useCallback((host) => {
    const tabId = `terminal-${host.id}-${Date.now()}`;
    const newTab = {
      id: tabId,
      hostId: host.id,
      title: host.name,
      host: host.host,
      type: 'terminal',
      connected: false,
    };

    setActiveTabs((prev) => [...prev, newTab]);
    setActiveTabId(tabId);
    setShowHostManager(false);
    setSelectedHost(null); // 关闭右侧编辑面板
  }, []);

  // 更新连接状态
  const handleConnectionChange = useCallback((tabId, connected) => {
    setActiveTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, connected } : t))
    );
  }, []);

  // 处理主机更新
  const handleHostsUpdate = useCallback(() => {
    loadHosts();
  }, [loadHosts]);

  // 编辑主机 - 打开模态框
  const handleEditHost = useCallback((host) => {
    setEditingHost(host);
    setShowHostManager(true);
  }, []);

  // 选中主机 - 右侧面板编辑
  const handleSelectHost = useCallback((host) => {
    setSelectedHost(host);
  }, []);

  // 新增主机 - 右侧面板
  const handleAddNewHost = useCallback(() => {
    setSelectedHost({}); // 空对象表示新建
  }, []);

  const openHostManager = useCallback(() => {
    setEditingHost(null);
    setShowHostManager(true);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const openCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  return (
    <div className="h-screen flex flex-col gradient-bg">
      {/* 桌面端显示标题栏 */}
      {!isMobile && <TitleBar />}

      {/* 移动端顶部栏 */}
      {isMobile && (
        <div className="h-14 bg-shell-surface/90 backdrop-blur-xl border-b border-shell-border flex items-center justify-between px-4 safe-area-top">
          <div className="flex items-center gap-2">
            <img src={process.env.PUBLIC_URL + '/icon.svg'} alt="EasyShell" className="w-8 h-8" />
            <span className="text-shell-text font-semibold font-display">EASYSHELL</span>
          </div>
          <button
            onClick={() => setShowServerConfig(true)}
            className="p-2 rounded-lg bg-shell-card border border-shell-border text-shell-text-dim"
          >
            <span className="text-xs">⚙️</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          hosts={hosts}
          activeTabs={activeTabs}
          activeTabId={activeTabId}
          selectedHostId={selectedHost?.id}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onConnectHost={connectHost}
          onSelectHost={handleSelectHost}
          onAddNewHost={handleAddNewHost}
          onOpenHostManager={openHostManager}
          onOpenSettings={openSettings}
          isRemoteConnected={isRemoteConnected}
          collapsed={isMobile ? true : sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={isMobile}
          onOpenServerConfig={() => setShowServerConfig(true)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* 标签栏 */}
          {activeTabs.length > 0 && (
            <div className="h-11 bg-shell-surface/80 backdrop-blur-xl border-b border-shell-border flex items-center px-3 gap-2 overflow-x-auto custom-scrollbar flex-shrink-0 relative">
              {/* 背景装饰 */}
              <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
              
              {activeTabs.map((tab, index) => (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                    transition-all duration-200 group min-w-0 flex-shrink-0 relative overflow-hidden
                    ${activeTabId === tab.id
                      ? 'bg-gradient-to-r from-shell-accent/20 to-shell-accent/5 text-shell-accent border border-shell-accent/40'
                      : 'bg-shell-card/50 hover:bg-shell-card text-shell-text-dim hover:text-shell-text border border-shell-border hover:border-shell-accent/20'
                    }
                  `}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {/* 活动指示器 */}
                  {activeTabId === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-shell-accent/5 pointer-events-none"
                    />
                  )}
                  
                  {/* 连接状态 */}
                  <motion.span 
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      tab.connected ? 'bg-shell-success' : 'bg-shell-text-dim'
                    }`}
                    animate={tab.connected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={tab.connected ? { boxShadow: '0 0 6px rgba(0, 255, 136, 0.6)' } : {}}
                  />
                  
                  {/* 标签名 */}
                  <span className="truncate text-sm font-medium max-w-[120px] relative z-10 font-display tracking-wide">
                    {tab.title}
                  </span>
                  
                  {/* 关闭按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center
                               hover:bg-shell-error/20 hover:text-shell-error transition-all ml-1"
                  >
                    ×
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}

          {/* 终端内容 - 所有终端都渲染，通过显示/隐藏切换 */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative min-w-0">
              {activeTabs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 cyber-grid opacity-20" />
                  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-shell-accent/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-shell-neon-purple/5 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] hex-pattern opacity-30" />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center relative z-10"
                  >
                    {/* Logo */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="mb-8"
                    >
                      <div className="inline-block relative">
                        <img 
                          src={process.env.PUBLIC_URL + '/icon.svg'} 
                          alt="EasyShell" 
                          className="w-24 h-24 mx-auto drop-shadow-[0_0_30px_rgba(0,245,255,0.4)]"
                        />
                        <div className="absolute -inset-4 bg-shell-accent/10 rounded-3xl blur-xl -z-10" />
                      </div>
                    </motion.div>
                    
                    {/* 标题 */}
                    <h2 className="text-3xl font-bold text-shell-text mb-2 font-display tracking-wider">
                      WELCOME TO <span className="text-shell-accent neon-text">EASYSHELL</span>
                    </h2>
                    <p className="text-shell-text-dim mb-8 font-display tracking-widest text-sm">
                      CYBERPUNK REMOTE SHELL TERMINAL
                    </p>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-4 justify-center mb-8">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddNewHost}
                        className="btn-cyber px-8 py-3 rounded-lg text-shell-accent font-display tracking-wide text-sm"
                      >
                        + 添加主机
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openSettings}
                        className="px-8 py-3 bg-shell-card/50 border border-shell-border 
                                   rounded-lg text-shell-text-dim hover:text-shell-text 
                                   hover:border-shell-neon-purple/30 hover:bg-shell-neon-purple/10
                                   transition-all font-display tracking-wide text-sm"
                      >
                        ⚡ 云端同步
                      </motion.button>
                    </div>
                    
                    {/* 快捷键提示 */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center gap-2 text-shell-text-dim text-sm"
                    >
                      <span>按</span>
                      <kbd className="code-highlight px-3 py-1">Ctrl + K</kbd>
                      <span>打开命令面板</span>
                    </motion.div>
                    
                    {/* 装饰性扫描线 */}
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-12 h-px bg-shell-accent/30"
                          animate={{ opacity: [0.2, 0.8, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                activeTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="absolute inset-0"
                    style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                  >
                    <Terminal
                      tabId={tab.id}
                      hostId={tab.hostId}
                      onConnectionChange={(connected) => handleConnectionChange(tab.id, connected)}
                      onShowCommandPalette={openCommandPalette}
                      onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
                      onOpenSFTP={() => setShowSFTP(true)}
                      showInfoPanel={showInfoPanel}
                      onCloseTab={() => closeTab(tab.id)}
                    />
                  </div>
                ))
              )}
            </div>

            {/* 右侧主机信息面板 */}
            <AnimatePresence>
              {showInfoPanel && activeTabId && activeTabs.find(t => t.id === activeTabId) && (
                <HostInfoPanel
                  hostId={activeTabs.find(t => t.id === activeTabId)?.hostId}
                  connectionId={activeTabId}
                  isConnected={activeTabs.find(t => t.id === activeTabId)?.connected}
                  onOpenSFTP={() => setShowSFTP(true)}
                  onClose={() => setShowInfoPanel(false)}
                />
              )}
            </AnimatePresence>

            {/* 右侧主机编辑面板 */}
            <AnimatePresence>
              {selectedHost && (
                <HostEditPanel
                  host={selectedHost}
                  onClose={() => setSelectedHost(null)}
                  onConnect={(host) => {
                    connectHost(host);
                    setSelectedHost(null);
                  }}
                  onUpdate={() => {
                    loadHosts();
                  }}
                  onDelete={() => {
                    loadHosts();
                    setSelectedHost(null);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      <AnimatePresence>
        {showHostManager && (
          <HostManager
            hosts={hosts}
            initialEditHost={editingHost}
            onClose={() => { setShowHostManager(false); setEditingHost(null); }}
            onConnect={connectHost}
            onUpdate={handleHostsUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <Settings
            onClose={() => setShowSettings(false)}
            isRemoteConnected={isRemoteConnected}
            onConnectionChange={(connected) => {
              setIsRemoteConnected(connected);
              if (connected) loadHosts();
            }}
            onHostsUpdate={loadHosts}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onSelectCommand={(cmd) => {
              if (activeTabId) {
                const event = new CustomEvent('terminal-command', {
                  detail: { tabId: activeTabId, command: cmd },
                });
                window.dispatchEvent(event);
              }
              setShowCommandPalette(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* SFTP 文件浏览器 */}
      <AnimatePresence>
        {showSFTP && activeTabId && activeTabs.find(t => t.id === activeTabId) && (
          <SFTPBrowser
            hostId={activeTabs.find(t => t.id === activeTabId)?.hostId}
            isConnected={activeTabs.find(t => t.id === activeTabId)?.connected}
            onClose={() => setShowSFTP(false)}
          />
        )}
      </AnimatePresence>

      {/* 服务器配置 (移动端) */}
      <ServerConfig
        isOpen={showServerConfig}
        onClose={() => setShowServerConfig(false)}
      />
    </div>
  );
}

export default App;
