import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    <div className="h-10 bg-shell-surface/90 backdrop-blur-xl border-b border-shell-border flex items-center justify-between px-4 relative overflow-hidden">
      {/* 拖动层 - 必须在最底层 */}
      <div className="drag-region absolute inset-0 z-0" />
      
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-shell-accent/30 to-transparent pointer-events-none" />
      
      {/* 背景网格效果 */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Logo 和标题 */}
      <div className="flex items-center gap-3 relative z-10 no-drag">
        {/* 动态 Logo */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <img 
            src={process.env.PUBLIC_URL + '/icon.svg'} 
            alt="EasyShell" 
            className="w-7 h-7 drop-shadow-[0_0_8px_rgba(0,245,255,0.3)]"
          />
        </motion.div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-shell-text font-display tracking-wider">
            EASY<span className="text-shell-accent">SHELL</span>
          </span>
          {/* 版本徽章 */}
          <span className="badge-cyber text-shell-accent">
            V1.0.2
          </span>
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-shell-card/50 border border-shell-border">
          <motion.div 
            className="w-1.5 h-1.5 rounded-full bg-shell-success"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[10px] text-shell-text-dim font-mono uppercase tracking-wider">System Online</span>
        </div>
      </div>

      {/* 中间装饰 - 扫描线 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-20">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-8 h-px bg-shell-accent"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>

      {/* 窗口控制按钮 */}
      <div className="flex items-center gap-1 relative z-10 no-drag">
        {/* 最小化 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMinimize}
          className="w-9 h-7 flex items-center justify-center rounded-md 
                     bg-shell-card/50 border border-shell-border
                     text-shell-text-dim hover:text-shell-text 
                     hover:border-shell-accent/30 hover:bg-shell-accent/10
                     transition-all duration-200"
          title="最小化"
        >
          <FiMinus size={14} />
        </motion.button>
        
        {/* 最大化/还原 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMaximize}
          className="w-9 h-7 flex items-center justify-center rounded-md
                     bg-shell-card/50 border border-shell-border
                     text-shell-text-dim hover:text-shell-text 
                     hover:border-shell-accent/30 hover:bg-shell-accent/10
                     transition-all duration-200"
          title={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? <FiMaximize2 size={12} /> : <FiSquare size={12} />}
        </motion.button>
        
        {/* 关闭 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className="w-9 h-7 flex items-center justify-center rounded-md
                     bg-shell-card/50 border border-shell-border
                     text-shell-text-dim hover:text-white 
                     hover:border-shell-error/50 hover:bg-shell-error/80
                     transition-all duration-200"
          title="关闭"
        >
          <FiX size={14} />
        </motion.button>
      </div>
    </div>
  );
}

export default TitleBar;
