import React from 'react';
import { motion } from 'framer-motion';
import {
  FiServer,
  FiPlus,
  FiSettings,
  FiCloud,
  FiCloudOff,
  FiChevronLeft,
  FiChevronRight,
  FiTerminal,
  FiEdit2,
} from 'react-icons/fi';

function Sidebar({
  hosts,
  activeTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onConnectHost,
  onOpenHostManager,
  onEditHost,
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
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ duration: 0.2 }}
      className="bg-shell-surface/50 border-r border-shell-border flex flex-col h-full overflow-hidden"
    >
      {/* 顶部操作区 */}
      <div className="p-3 border-b border-shell-border flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-semibold text-shell-text"
            >
              主机列表
            </motion.span>
          )}
          <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
            <button
              onClick={onOpenHostManager}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-accent 
                         transition-colors"
              title="添加主机"
            >
              <FiPlus size={18} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim 
                         hover:text-shell-text transition-colors"
              title={collapsed ? '展开' : '收起'}
            >
              {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* 主机列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {Object.entries(groupedHosts).map(([groupName, groupHosts]) => (
          <div key={groupName} className="mb-4">
            {!collapsed && (
              <div className="px-2 py-1 text-xs font-medium text-shell-text-dim uppercase tracking-wider">
                {groupName}
              </div>
            )}
            {groupHosts.map((host) => {
              const isActive = activeTabs.some((t) => t.hostId === host.id);
              return (
                <motion.div
                  key={host.id}
                  whileHover={{ x: collapsed ? 0 : 2 }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer mb-1
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-shell-accent/15 border border-shell-accent/30'
                      : 'hover:bg-shell-card border border-transparent'
                    }
                  `}
                >
                  {/* 点击连接 */}
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={() => onConnectHost(host)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${host.color}20` }}
                    >
                      <FiServer size={16} style={{ color: host.color }} />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-shell-text truncate">
                          {host.name}
                        </div>
                        <div className="text-xs text-shell-text-dim truncate">
                          {host.username}@{host.host}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 编辑按钮 */}
                  {!collapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditHost && onEditHost(host);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md 
                                 hover:bg-shell-border text-shell-text-dim hover:text-shell-text 
                                 transition-all flex-shrink-0"
                      title="编辑主机"
                    >
                      <FiEdit2 size={14} />
                    </button>
                  )}
                  
                  {!collapsed && isActive && (
                    <div className="w-2 h-2 rounded-full status-online flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}

        {hosts.length === 0 && !collapsed && (
          <div className="text-center py-8">
            <FiTerminal className="mx-auto text-3xl text-shell-text-dim mb-3 opacity-50" />
            <p className="text-sm text-shell-text-dim">暂无主机</p>
            <button
              onClick={onOpenHostManager}
              className="mt-3 text-sm text-shell-accent hover:underline"
            >
              添加第一个主机
            </button>
          </div>
        )}
        
        {/* 折叠状态下的空状态提示 */}
        {hosts.length === 0 && collapsed && (
          <div className="text-center py-4">
            <button
              onClick={onOpenHostManager}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim"
              title="添加主机"
            >
              <FiTerminal size={20} />
            </button>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="p-3 border-t border-shell-border flex-shrink-0">
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          {/* 数据库连接状态 */}
          <div
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
              transition-colors ${collapsed ? 'justify-center w-full' : ''}
              ${isRemoteConnected 
                ? 'bg-shell-success/10 text-shell-success' 
                : 'bg-shell-card text-shell-text-dim hover:text-shell-text'
              }
            `}
            onClick={onOpenSettings}
            title={isRemoteConnected ? '已连接远程数据库' : '未连接远程数据库'}
          >
            {isRemoteConnected ? <FiCloud size={16} /> : <FiCloudOff size={16} />}
            {!collapsed && (
              <span className="text-xs font-medium">
                {isRemoteConnected ? '已同步' : '本地模式'}
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim 
                         hover:text-shell-text transition-colors"
              title="设置"
            >
              <FiSettings size={18} />
            </button>
          )}
          
          {/* 折叠状态下的设置按钮 */}
          {collapsed && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim 
                         hover:text-shell-text transition-colors w-full flex justify-center"
              title="设置"
            >
              <FiSettings size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Sidebar;
