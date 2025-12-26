import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Terminal from './components/Terminal';
import HostManager from './components/HostManager';
import Settings from './components/Settings';
import CommandPalette from './components/CommandPalette';

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

  // 加载主机列表
  const loadHosts = useCallback(async () => {
    if (window.electronAPI) {
      const hostList = await window.electronAPI.hosts.getAll();
      setHosts(hostList);
    }
  }, []);

  // 检查远程连接状态
  const checkRemoteStatus = useCallback(async () => {
    if (window.electronAPI) {
      const connected = await window.electronAPI.db.isRemoteConnected();
      setIsRemoteConnected(connected);
      // 如果已连接，刷新主机列表（因为启动时可能已自动同步）
      if (connected) {
        loadHosts();
      }
    }
  }, [loadHosts]);

  useEffect(() => {
    loadHosts();
    checkRemoteStatus();
  }, [loadHosts, checkRemoteStatus]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowHostManager(false);
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
  }, []);

  // 关闭标签页
  const closeTab = useCallback((tabId) => {
    setActiveTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      return newTabs;
    });
    setActiveTabId((prevActiveId) => {
      if (prevActiveId === tabId) {
        const remainingTabs = activeTabs.filter((t) => t.id !== tabId);
        return remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null;
      }
      return prevActiveId;
    });
  }, [activeTabs]);

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

  // 编辑主机
  const handleEditHost = useCallback((host) => {
    setEditingHost(host);
    setShowHostManager(true);
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
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          hosts={hosts}
          activeTabs={activeTabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onConnectHost={connectHost}
          onOpenHostManager={openHostManager}
          onEditHost={handleEditHost}
          onOpenSettings={openSettings}
          isRemoteConnected={isRemoteConnected}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* 标签栏 */}
          {activeTabs.length > 0 && (
            <div className="h-10 bg-shell-surface/50 border-b border-shell-border flex items-center px-2 gap-1 overflow-x-auto custom-scrollbar flex-shrink-0">
              {activeTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer
                    transition-all duration-200 group min-w-0 flex-shrink-0
                    ${activeTabId === tab.id
                      ? 'bg-shell-accent/20 text-shell-accent border border-shell-accent/30'
                      : 'hover:bg-shell-card text-shell-text-dim hover:text-shell-text border border-transparent'
                    }
                  `}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    tab.connected ? 'status-online' : 'status-offline'
                  }`} />
                  <span className="truncate text-sm font-medium max-w-[120px]">
                    {tab.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-shell-error transition-opacity ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 终端内容 - 所有终端都渲染，通过显示/隐藏切换 */}
          <div className="flex-1 relative">
            {activeTabs.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6 opacity-20">🚀</div>
                  <h2 className="text-2xl font-bold text-shell-text mb-3">
                    欢迎使用 EasyShell
                  </h2>
                  <p className="text-shell-text-dim mb-6">
                    高颜值远程 Shell 管理终端
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={openHostManager}
                      className="px-6 py-3 bg-shell-accent/20 border border-shell-accent/50 
                                 rounded-lg text-shell-accent hover:bg-shell-accent/30 
                                 transition-all btn-glow font-medium"
                    >
                      添加主机
                    </button>
                    <button
                      onClick={openSettings}
                      className="px-6 py-3 bg-shell-card border border-shell-border 
                                 rounded-lg text-shell-text-dim hover:text-shell-text 
                                 hover:border-shell-accent/30 transition-all font-medium"
                    >
                      连接数据库
                    </button>
                  </div>
                  <p className="text-shell-text-dim text-sm mt-8">
                    按 <kbd className="code-highlight">Ctrl+K</kbd> 打开命令面板
                  </p>
                </div>
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
                  />
                </div>
              ))
            )}
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
    </div>
  );
}

export default App;
