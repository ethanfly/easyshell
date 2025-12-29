import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiServer,
  FiPlus,
  FiSettings,
  FiCloud,
  FiCloudOff,
  FiChevronLeft,
  FiChevronRight,
  FiTerminal,
  FiZap,
} from 'react-icons/fi';

function Sidebar({
  hosts,
  activeTabs,
  activeTabId,
  selectedHostId,
  onSelectTab,
  onCloseTab,
  onConnectHost,
  onSelectHost,
  onAddNewHost,
  onOpenHostManager,
  onOpenSettings,
  isRemoteConnected,
  collapsed,
  onToggleCollapse,
}) {
  // 按分组组织主机
  const groupedHosts = hosts.reduce((acc, host) => {
    const group = host.group_name || '默认分组';
    if (!acc[group]) acc[group] = [];
    acc[group].push(host);
    return acc;
  }, {});

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 60 : 280 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="bg-shell-surface/80 backdrop-blur-xl border-r border-shell-border flex flex-col h-full overflow-hidden relative"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 hex-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-shell-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-shell-neon-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* 顶部操作区 */}
      <div className="p-3 border-b border-shell-border flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <FiZap className="text-shell-accent" size={16} />
                <span className="text-sm font-semibold text-shell-text font-display tracking-wide">
                  主机列表
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddNewHost}
              className="p-2 rounded-lg bg-shell-accent/10 border border-shell-accent/30
                         text-shell-accent hover:bg-shell-accent/20 hover:border-shell-accent/50
                         transition-all duration-200"
              title="添加主机"
            >
              <FiPlus size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim 
                         hover:text-shell-text transition-all border border-transparent
                         hover:border-shell-border"
              title={collapsed ? '展开' : '收起'}
            >
              {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* 主机列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 relative z-10">
        {Object.entries(groupedHosts).map(([groupName, groupHosts]) => (
          <div key={groupName} className="mb-4">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-2 flex items-center gap-2"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-shell-border to-transparent" />
                  <span className="text-[10px] font-semibold text-shell-text-dim uppercase tracking-widest font-display">
                    {groupName}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-shell-border to-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {groupHosts.map((host, index) => {
              const isActive = activeTabs.some((t) => t.hostId === host.id);
              const isConnected = activeTabs.some((t) => t.hostId === host.id && t.connected);
              const isSelected = selectedHostId === host.id;
              
              return (
                <motion.div
                  key={host.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  onClick={() => onSelectHost && onSelectHost(host)}
                  onDoubleClick={() => onConnectHost(host)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer mb-1.5
                    transition-all duration-200 group relative overflow-hidden
                    ${isSelected
                      ? 'bg-gradient-to-r from-shell-neon-purple/20 to-transparent border border-shell-neon-purple/40'
                      : isActive
                        ? 'bg-gradient-to-r from-shell-accent/15 to-transparent border border-shell-accent/30'
                        : 'hover:bg-shell-card/80 border border-transparent hover:border-shell-border'
                    }
                  `}
                >
                  {/* 选中指示线 */}
                  {isSelected && (
                    <motion.div
                      layoutId="selectedIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-shell-neon-purple"
                      style={{ boxShadow: '0 0 10px rgba(188, 140, 255, 0.5)' }}
                    />
                  )}
                  
                  {/* 活动指示线 */}
                  {isActive && !isSelected && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-shell-accent"
                      style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
                    />
                  )}

                  {/* 主机内容 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 主机图标 */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`
                        w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                        relative overflow-hidden
                      `}
                      style={{ 
                        backgroundColor: `${host.color || '#00d4ff'}15`,
                        border: `1px solid ${host.color || '#00d4ff'}30`
                      }}
                    >
                      <FiServer size={16} style={{ color: host.color || '#00d4ff' }} />
                      {/* 连接状态光点 */}
                      {isConnected && (
                        <motion.div
                          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-shell-success"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ boxShadow: '0 0 6px rgba(0, 255, 136, 0.6)' }}
                        />
                      )}
                    </motion.div>

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex-1 min-w-0"
                        >
                          <div className="text-sm font-medium text-shell-text truncate">
                            {host.name}
                          </div>
                          <div className="text-xs text-shell-text-dim truncate font-mono">
                            {host.username}@{host.host}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* 快速连接按钮 */}
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnectHost && onConnectHost(host);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md 
                                   bg-shell-accent/20 border border-shell-accent/30
                                   text-shell-accent hover:bg-shell-accent/30
                                   transition-all flex-shrink-0"
                        title="快速连接"
                      >
                        <FiTerminal size={13} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* 空状态 */}
        {hosts.length === 0 && (
          <div className="text-center py-12">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-4"
            >
              <FiTerminal className="mx-auto text-4xl text-shell-text-dim opacity-30" />
            </motion.div>
            {!collapsed && (
              <>
                <p className="text-sm text-shell-text-dim mb-4">暂无主机</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAddNewHost}
                  className="btn-cyber px-4 py-2 rounded-lg text-sm text-shell-accent font-medium"
                >
                  + 添加第一个主机
                </motion.button>
              </>
            )}
          </div>
        )}

        {/* 主机管理入口 */}
        {hosts.length > 0 && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-2 mt-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenHostManager}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 
                         bg-shell-card/30 border border-shell-border/50 rounded-lg
                         text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30
                         hover:bg-shell-card/50 transition-all text-xs"
            >
              <FiServer size={12} />
              <span>主机管理</span>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="p-3 border-t border-shell-border flex-shrink-0 relative z-10">
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          {/* 数据库连接状态 */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer
              transition-all duration-200 ${collapsed ? 'justify-center w-full' : ''}
              ${isRemoteConnected 
                ? 'bg-shell-success/10 border border-shell-success/30 text-shell-success' 
                : 'bg-shell-card/50 border border-shell-border text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30'
              }
            `}
            onClick={onOpenSettings}
            title={isRemoteConnected ? '已连接远程数据库' : '未连接远程数据库'}
          >
            {isRemoteConnected ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <FiCloud size={16} />
                </motion.div>
                {!collapsed && (
                  <span className="text-xs font-medium">云端同步</span>
                )}
              </>
            ) : (
              <>
                <FiCloudOff size={16} />
                {!collapsed && (
                  <span className="text-xs font-medium">本地模式</span>
                )}
              </>
            )}
          </motion.div>

          {/* 设置按钮 */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400 }}
            onClick={onOpenSettings}
            className={`p-2 rounded-lg bg-shell-card/50 border border-shell-border
                       text-shell-text-dim hover:text-shell-accent 
                       hover:border-shell-accent/30 hover:bg-shell-accent/10
                       transition-colors ${collapsed ? 'w-full flex justify-center' : ''}`}
            title="设置"
          >
            <FiSettings size={18} />
          </motion.button>
        </div>

        {/* 版权信息 */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center"
          >
            <span className="text-[9px] text-shell-text-muted font-mono tracking-wider">
              © 2024 EASYSHELL · CYBERPUNK EDITION
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default Sidebar;
