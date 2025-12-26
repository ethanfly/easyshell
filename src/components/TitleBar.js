import React, { useState, useEffect } from 'react';
import { FiMinus, FiSquare, FiX, FiMaximize2 } from 'react-icons/fi';

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.window.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.window.minimize();
  };

  const handleMaximize = async () => {
    window.electronAPI?.window.maximize();
    const maximized = await window.electronAPI?.window.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI?.window.close();
  };

  return (
    <div className="h-9 bg-shell-surface/80 border-b border-shell-border flex items-center justify-between px-4 drag-region">
      {/* Logo 和标题 */}
      <div className="flex items-center gap-3 no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-shell-accent to-shell-purple flex items-center justify-center">
          <span className="text-xs font-bold text-white">E</span>
        </div>
        <span className="text-sm font-semibold text-shell-text">
          EasyShell
        </span>
        <span className="text-xs text-shell-text-dim px-2 py-0.5 bg-shell-card rounded-full">
          v1.0.0
        </span>
      </div>

      {/* 窗口控制按钮 */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-8 h-6 flex items-center justify-center rounded hover:bg-shell-card 
                     text-shell-text-dim hover:text-shell-text transition-colors"
          title="最小化"
        >
          <FiMinus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-6 flex items-center justify-center rounded hover:bg-shell-card 
                     text-shell-text-dim hover:text-shell-text transition-colors"
          title={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? <FiMaximize2 size={12} /> : <FiSquare size={12} />}
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-6 flex items-center justify-center rounded hover:bg-shell-error 
                     text-shell-text-dim hover:text-white transition-colors"
          title="关闭"
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
}

export default TitleBar;

