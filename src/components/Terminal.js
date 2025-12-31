import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { FiCommand, FiRefreshCw, FiInfo, FiFolder, FiActivity, FiZap } from 'react-icons/fi';

function Terminal({ tabId, hostId, onConnectionChange, onShowCommandPalette, onToggleInfoPanel, onOpenSFTP, showInfoPanel }) {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const connectionIdRef = useRef(null);
  const cleanupListenersRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const initTimerRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const resizeObserverRef = useRef(null);
  const contextMenuHandlerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const webglAddonRef = useRef(null);
  
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;
  
  const [connectionId, setConnectionId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // 连接SSH
  const connect = useCallback(async () => {
    if (!window.electronAPI || !hostId || isConnectingRef.current || connectionIdRef.current || hasConnectedRef.current) {
      return;
    }

    hasConnectedRef.current = true;
    isConnectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      const host = await window.electronAPI.hosts.getById(hostId);
      if (!host) {
        throw new Error('主机信息不存在');
      }

      const result = await window.electronAPI.ssh.connect({
        id: host.id,
        host: host.host,
        port: host.port,
        username: host.username,
        password: host.password,
        privateKey: host.private_key,
      });

      if (!isMountedRef.current) return;

      if (result.success) {
        connectionIdRef.current = result.connectionId;
        setConnectionId(result.connectionId);
        onConnectionChangeRef.current?.(true);

        const removeDataListener = window.electronAPI.ssh.onData(result.connectionId, (data) => {
          xtermRef.current?.write(data);
        });

        const removeCloseListener = window.electronAPI.ssh.onClose(result.connectionId, () => {
          if (isMountedRef.current) {
            onConnectionChangeRef.current?.(false);
            xtermRef.current?.writeln('\r\n\x1b[38;2;255;208;0m⚡ 连接已断开\x1b[0m');
            connectionIdRef.current = null;
            setConnectionId(null);
            hasConnectedRef.current = false;
          }
        });

        const removeErrorListener = window.electronAPI.ssh.onError(result.connectionId, (err) => {
          xtermRef.current?.writeln(`\r\n\x1b[38;2;255;51;102m✖ 错误: ${err}\x1b[0m`);
        });

        cleanupListenersRef.current = () => {
          removeDataListener();
          removeCloseListener();
          removeErrorListener();
        };

        setTimeout(() => {
          if (fitAddonRef.current && xtermRef.current) {
            try {
              fitAddonRef.current.fit();
              if (connectionIdRef.current && window.electronAPI) {
                window.electronAPI.ssh.resize(
                  connectionIdRef.current, 
                  xtermRef.current.cols, 
                  xtermRef.current.rows
                );
              }
            } catch (e) {
              console.error('fit 失败:', e);
            }
          }
        }, 50);
      } else {
        hasConnectedRef.current = false;
        throw new Error(result.error);
      }
    } catch (err) {
      hasConnectedRef.current = false;
      if (isMountedRef.current) {
        setError(err.message);
        onConnectionChangeRef.current?.(false);
        xtermRef.current?.writeln(`\x1b[38;2;255;51;102m✖ 连接失败: ${err.message}\x1b[0m`);
      }
    } finally {
      isConnectingRef.current = false;
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [hostId]);

  // 调整终端尺寸
  const fitTerminal = useCallback(() => {
    if (!xtermRef.current || !fitAddonRef.current || !terminalRef.current) return;
    
    try {
      fitAddonRef.current.fit();
      
      if (connectionIdRef.current && window.electronAPI) {
        window.electronAPI.ssh.resize(
          connectionIdRef.current,
          xtermRef.current.cols,
          xtermRef.current.rows
        );
      }
    } catch (e) {
      console.error('调整终端尺寸失败:', e);
    }
  }, []);

  // 初始化终端 - 赛博朋克主题
  const initTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return false;
    
    const container = terminalRef.current;
    if (container.clientWidth < 100 || container.clientHeight < 100) {
      return false;
    }

    try {
      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineHeight: 1.4,
        scrollback: 1000,  // 减少滚动缓冲区提升性能
        fastScrollModifier: 'alt',  // 快速滚动
        fastScrollSensitivity: 5,
        smoothScrollDuration: 0,  // 禁用平滑滚动提升性能
        scrollSensitivity: 1,
        theme: {
          // 赛博朋克主题配色
          background: '#050810',
          foreground: '#e8f0ff',
          cursor: '#00d4ff',
          cursorAccent: '#050810',
          selectionBackground: 'rgba(0, 212, 255, 0.25)',
          selectionForeground: '#ffffff',
          // 基础色
          black: '#0a0f18',
          red: '#ff3366',
          green: '#00ff88',
          yellow: '#ffd000',
          blue: '#00d4ff',
          magenta: '#a855f7',
          cyan: '#00d4ff',
          white: '#e8f0ff',
          // 亮色
          brightBlack: '#3d4a5c',
          brightRed: '#ff6b8a',
          brightGreen: '#5cffab',
          brightYellow: '#ffe566',
          brightBlue: '#5ce1ff',
          brightMagenta: '#c084fc',
          brightCyan: '#5ce1ff',
          brightWhite: '#ffffff',
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      
      term.open(container);
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      
      // 尝试加载 WebGL 渲染器提升性能
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => {
          webglAddon.dispose();
          webglAddonRef.current = null;
        });
        term.loadAddon(webglAddon);
        webglAddonRef.current = webglAddon;
      } catch (e) {
        console.warn('WebGL 渲染器不可用，使用默认渲染器:', e);
      }
      
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      term.onData((data) => {
        if (connectionIdRef.current && window.electronAPI) {
          window.electronAPI.ssh.write(connectionIdRef.current, data);
        }
      });

      // 选中自动复制到剪贴板
      term.onSelectionChange(() => {
        const selection = term.getSelection();
        if (selection && selection.length > 0) {
          navigator.clipboard.writeText(selection).catch(err => {
            console.error('复制到剪贴板失败:', err);
          });
        }
      });

      // 右键粘贴
      contextMenuHandlerRef.current = async (e) => {
        e.preventDefault();
        try {
          const text = await navigator.clipboard.readText();
          if (text && connectionIdRef.current && window.electronAPI) {
            window.electronAPI.ssh.write(connectionIdRef.current, text);
          }
        } catch (err) {
          console.error('从剪贴板粘贴失败:', err);
        }
      };
      container.addEventListener('contextmenu', contextMenuHandlerRef.current);
      
      // 使用防抖的 ResizeObserver 避免频繁调用
      resizeObserverRef.current = new ResizeObserver(() => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        resizeTimeoutRef.current = setTimeout(() => {
          fitTerminal();
        }, 100);  // 100ms 防抖
      });
      resizeObserverRef.current.observe(container);

      return true;
    } catch (e) {
      console.error('终端初始化失败:', e);
      return false;
    }
  }, [fitTerminal]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const tryInit = () => {
      if (!isMountedRef.current) return;
      
      if (initTerminal()) {
        setIsReady(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 100);
      } else {
        initTimerRef.current = setTimeout(tryInit, 100);
      }
    };

    initTimerRef.current = setTimeout(tryInit, 200);

    return () => {
      isMountedRef.current = false;
      
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }
      
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      // 清理右键菜单事件监听器
      if (contextMenuHandlerRef.current && terminalRef.current) {
        terminalRef.current.removeEventListener('contextmenu', contextMenuHandlerRef.current);
        contextMenuHandlerRef.current = null;
      }
      
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }
      
      if (connectionIdRef.current && window.electronAPI) {
        window.electronAPI.ssh.disconnect(connectionIdRef.current);
        connectionIdRef.current = null;
      }
      
      // 清理 WebGL 渲染器
      if (webglAddonRef.current) {
        webglAddonRef.current.dispose();
        webglAddonRef.current = null;
      }
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      fitAddonRef.current = null;
    };
  }, [initTerminal, connect]);

  useEffect(() => {
    const handleCommand = (e) => {
      if (e.detail.tabId === tabId && connectionIdRef.current && window.electronAPI) {
        window.electronAPI.ssh.write(connectionIdRef.current, e.detail.command + '\n');
      }
    };

    window.addEventListener('terminal-command', handleCommand);
    return () => window.removeEventListener('terminal-command', handleCommand);
  }, [tabId]);

  const handleReconnect = useCallback(() => {
    if (cleanupListenersRef.current) {
      cleanupListenersRef.current();
      cleanupListenersRef.current = null;
    }
    if (connectionIdRef.current && window.electronAPI) {
      window.electronAPI.ssh.disconnect(connectionIdRef.current);
    }
    connectionIdRef.current = null;
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
    setConnectionId(null);
    setError(null);
    
    if (xtermRef.current) {
      xtermRef.current.reset();
    }
    
    setTimeout(() => connect(), 100);
  }, [connect]);

  // 工具栏按钮组件 - 简化动画提升性能
  const ToolButton = ({ onClick, disabled, active, title, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-colors duration-100
        ${active 
          ? 'bg-shell-accent/20 text-shell-accent border border-shell-accent/40' 
          : 'bg-shell-card/50 border border-shell-border text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30 hover:bg-shell-accent/10'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-shell-bg relative overflow-hidden">
      {/* 简化背景装饰以提升性能 */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
      
      {/* 终端工具栏 */}
      <div className="h-12 bg-shell-surface/80 backdrop-blur-xl border-b border-shell-border flex items-center px-4 justify-between flex-shrink-0 relative z-10">
        {/* 左侧状态 */}
        <div className="flex items-center gap-4">
          {!isReady ? (
            <div className="flex items-center gap-2 text-shell-text-dim text-sm">
              <div className="loader-cyber w-4 h-4" style={{ borderWidth: '2px' }} />
              <span className="font-display tracking-wide">INITIALIZING</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center gap-2 text-shell-warning text-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <FiActivity size={16} />
              </motion.div>
              <span className="font-display tracking-wide">CONNECTING</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-shell-error text-sm">
              <span className="w-2 h-2 rounded-full bg-shell-error" style={{ boxShadow: '0 0 8px rgba(255, 51, 102, 0.6)' }} />
              <span className="font-display tracking-wide">CONNECTION FAILED</span>
            </div>
          ) : connectionId ? (
            <div className="flex items-center gap-2 text-shell-success text-sm">
              <span 
                className="w-2 h-2 rounded-full bg-shell-success"
                style={{ boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)' }}
              />
              <span className="font-display tracking-wide">CONNECTED</span>
              <FiZap size={14} className="text-shell-success" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-shell-text-dim text-sm">
              <span className="w-2 h-2 rounded-full bg-shell-text-dim" />
              <span className="font-display tracking-wide">OFFLINE</span>
            </div>
          )}
        </div>

        {/* 右侧工具按钮 */}
        <div className="flex items-center gap-2">
          {/* 命令提示 */}
          <button
            onClick={onShowCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg btn-cyber text-sm text-shell-accent"
            title="命令面板 (Ctrl+K)"
          >
            <FiCommand size={14} />
            <span className="hidden sm:inline font-display tracking-wide">COMMANDS</span>
          </button>
          
          <div className="divider-vertical h-6 mx-1" />
          
          {/* SFTP */}
          <ToolButton
            onClick={onOpenSFTP}
            disabled={!connectionId}
            title="SFTP 文件管理器"
          >
            <FiFolder size={16} />
          </ToolButton>
          
          {/* 主机信息 */}
          <ToolButton
            onClick={onToggleInfoPanel}
            active={showInfoPanel}
            title="主机信息"
          >
            <FiInfo size={16} />
          </ToolButton>
          
          <div className="divider-vertical h-6 mx-1" />
          
          {/* 重连 */}
          <ToolButton
            onClick={handleReconnect}
            disabled={!isReady}
            title="重新连接"
          >
            <FiRefreshCw size={16} />
          </ToolButton>
        </div>
      </div>

      {/* 终端内容 */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-3 terminal-container overflow-hidden relative z-10"
        style={{ minHeight: '300px', minWidth: '400px' }}
      />

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-shell-accent/20 to-transparent pointer-events-none" />
    </div>
  );
}

export default Terminal;
