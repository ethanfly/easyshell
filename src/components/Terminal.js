import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { FiCommand, FiRefreshCw } from 'react-icons/fi';

function Terminal({ tabId, hostId, onConnectionChange, onShowCommandPalette }) {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const connectionIdRef = useRef(null);
  const cleanupListenersRef = useRef(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);
  const initTimerRef = useRef(null);
  const hasConnectedRef = useRef(false); // 防止重复连接
  const resizeObserverRef = useRef(null);
  
  // 用 ref 存储回调，避免作为依赖
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;
  
  const [connectionId, setConnectionId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // 连接SSH - 不依赖 onConnectionChange
  const connect = useCallback(async () => {
    // 防止重复连接
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
            xtermRef.current?.writeln('\r\n\x1b[33m连接已断开\x1b[0m');
            connectionIdRef.current = null;
            setConnectionId(null);
            // 断开后允许重连
            hasConnectedRef.current = false;
          }
        });

        const removeErrorListener = window.electronAPI.ssh.onError(result.connectionId, (err) => {
          xtermRef.current?.writeln(`\r\n\x1b[31m错误: ${err}\x1b[0m`);
        });

        cleanupListenersRef.current = () => {
          removeDataListener();
          removeCloseListener();
          removeErrorListener();
        };

        // 延迟一点再发送终端尺寸，确保 shell 准备好
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
        xtermRef.current?.writeln(`\x1b[31m连接失败: ${err.message}\x1b[0m`);
      }
    } finally {
      isConnectingRef.current = false;
      if (isMountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [hostId]); // 只依赖 hostId

  // 调整终端尺寸
  const fitTerminal = useCallback(() => {
    if (!xtermRef.current || !fitAddonRef.current || !terminalRef.current) return;
    
    try {
      fitAddonRef.current.fit();
      
      // 通知 SSH 服务器尺寸变化
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

  // 初始化终端
  const initTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return false;
    
    const container = terminalRef.current;
    // 确保容器有有效尺寸
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
        scrollback: 1000,
        theme: {
          background: '#0d1117',
          foreground: '#e6edf3',
          cursor: '#58a6ff',
          cursorAccent: '#0d1117',
          selectionBackground: 'rgba(88, 166, 255, 0.3)',
          black: '#0d1117',
          red: '#f85149',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#bc8cff',
          cyan: '#56d4dd',
          white: '#e6edf3',
          brightBlack: '#484f58',
          brightRed: '#ff7b72',
          brightGreen: '#56d364',
          brightYellow: '#e3b341',
          brightBlue: '#79c0ff',
          brightMagenta: '#d2a8ff',
          brightCyan: '#76e3ea',
          brightWhite: '#ffffff',
        },
        allowProposedApi: true,
      });

      // 加载插件
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      
      // 打开终端
      term.open(container);
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      
      // 首次调整尺寸
      setTimeout(() => {
        fitAddon.fit();
      }, 0);

      // 监听用户输入
      term.onData((data) => {
        if (connectionIdRef.current && window.electronAPI) {
          window.electronAPI.ssh.write(connectionIdRef.current, data);
        }
      });
      
      // 监听容器尺寸变化
      resizeObserverRef.current = new ResizeObserver(() => {
        fitTerminal();
      });
      resizeObserverRef.current.observe(container);

      return true;
    } catch (e) {
      console.error('终端初始化失败:', e);
      return false;
    }
  }, [fitTerminal]);

  // 等待容器就绪后初始化
  useEffect(() => {
    isMountedRef.current = true;
    
    const tryInit = () => {
      if (!isMountedRef.current) return;
      
      if (initTerminal()) {
        setIsReady(true);
        // 初始化成功后连接
        setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 100);
      } else {
        // 容器未就绪，继续尝试
        initTimerRef.current = setTimeout(tryInit, 100);
      }
    };

    // 延迟开始尝试初始化
    initTimerRef.current = setTimeout(tryInit, 200);

    return () => {
      isMountedRef.current = false;
      
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
      }
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }
      
      if (connectionIdRef.current && window.electronAPI) {
        window.electronAPI.ssh.disconnect(connectionIdRef.current);
        connectionIdRef.current = null;
      }
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      fitAddonRef.current = null;
    };
  }, [initTerminal, connect]);

  // 监听命令面板发送的命令
  useEffect(() => {
    const handleCommand = (e) => {
      if (e.detail.tabId === tabId && connectionIdRef.current && window.electronAPI) {
        window.electronAPI.ssh.write(connectionIdRef.current, e.detail.command + '\n');
      }
    };

    window.addEventListener('terminal-command', handleCommand);
    return () => window.removeEventListener('terminal-command', handleCommand);
  }, [tabId]);

  // 重连
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
    hasConnectedRef.current = false; // 重置连接标志
    setConnectionId(null);
    setError(null);
    
    // 完全重置终端（清屏+重置光标位置）
    if (xtermRef.current) {
      xtermRef.current.reset();
    }
    
    setTimeout(() => connect(), 100);
  }, [connect]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-shell-bg">
      {/* 终端工具栏 */}
      <div className="h-10 bg-shell-surface/50 border-b border-shell-border flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {!isReady ? (
            <div className="flex items-center gap-2 text-shell-text-dim text-sm">
              <div className="w-3 h-3 border-2 border-shell-text-dim border-t-transparent rounded-full animate-spin" />
              初始化...
            </div>
          ) : isConnecting ? (
            <div className="flex items-center gap-2 text-shell-warning text-sm">
              <div className="w-3 h-3 border-2 border-shell-warning border-t-transparent rounded-full animate-spin" />
              连接中...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-shell-error text-sm">
              <span className="w-2 h-2 rounded-full bg-shell-error" />
              连接失败
            </div>
          ) : connectionId ? (
            <div className="flex items-center gap-2 text-shell-success text-sm">
              <span className="w-2 h-2 rounded-full status-online" />
              已连接
            </div>
          ) : (
            <div className="flex items-center gap-2 text-shell-text-dim text-sm">
              <span className="w-2 h-2 rounded-full bg-shell-text-dim" />
              未连接
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShowCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-shell-card 
                       border border-shell-border hover:border-shell-accent/50 
                       text-shell-text-dim hover:text-shell-text transition-all text-sm"
            title="命令面板 (Ctrl+K)"
          >
            <FiCommand size={14} />
            <span className="hidden sm:inline">命令提示</span>
          </button>
          <button
            onClick={handleReconnect}
            disabled={!isReady}
            className="p-2 rounded-md hover:bg-shell-card text-shell-text-dim 
                       hover:text-shell-text transition-colors disabled:opacity-50"
            title="重新连接"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 终端内容 */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2 terminal-container overflow-hidden"
        style={{ minHeight: '300px', minWidth: '400px' }}
      />
    </div>
  );
}

export default Terminal;
