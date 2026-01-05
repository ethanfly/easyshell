import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTerminal, FiX, FiCommand, FiFolder, FiFile, FiServer, FiDatabase, FiPackage, FiSettings, FiSearch } from 'react-icons/fi';

// 常用命令库
const COMMAND_DATABASE = [
  // 文件操作
  { cmd: 'ls', desc: '列出目录内容', category: 'file' },
  { cmd: 'ls -la', desc: '详细列出所有文件', category: 'file' },
  { cmd: 'ls -lh', desc: '人类可读格式', category: 'file' },
  { cmd: 'cd', desc: '切换目录', category: 'file' },
  { cmd: 'cd ..', desc: '返回上级目录', category: 'file' },
  { cmd: 'cd ~', desc: '返回主目录', category: 'file' },
  { cmd: 'cd -', desc: '返回上次目录', category: 'file' },
  { cmd: 'pwd', desc: '显示当前目录', category: 'file' },
  { cmd: 'mkdir', desc: '创建目录', category: 'file' },
  { cmd: 'mkdir -p', desc: '递归创建目录', category: 'file' },
  { cmd: 'rm', desc: '删除文件', category: 'file' },
  { cmd: 'rm -rf', desc: '强制递归删除', category: 'file' },
  { cmd: 'cp', desc: '复制文件', category: 'file' },
  { cmd: 'cp -r', desc: '递归复制目录', category: 'file' },
  { cmd: 'mv', desc: '移动/重命名', category: 'file' },
  { cmd: 'touch', desc: '创建空文件', category: 'file' },
  { cmd: 'cat', desc: '查看文件内容', category: 'file' },
  { cmd: 'head -n 20', desc: '查看前20行', category: 'file' },
  { cmd: 'tail -f', desc: '实时追踪日志', category: 'file' },
  { cmd: 'less', desc: '分页查看文件', category: 'file' },
  { cmd: 'find . -name', desc: '按名称查找', category: 'file' },
  { cmd: 'chmod 755', desc: '设置可执行权限', category: 'file' },
  { cmd: 'chown', desc: '修改所有者', category: 'file' },
  { cmd: 'tar -zxvf', desc: '解压 tar.gz', category: 'file' },
  { cmd: 'tar -zcvf', desc: '压缩为 tar.gz', category: 'file' },
  { cmd: 'unzip', desc: '解压 zip', category: 'file' },

  // 文本处理
  { cmd: 'grep', desc: '文本搜索', category: 'text' },
  { cmd: 'grep -rn', desc: '递归搜索带行号', category: 'text' },
  { cmd: 'sed', desc: '流编辑器', category: 'text' },
  { cmd: 'awk', desc: '文本处理', category: 'text' },
  { cmd: 'sort', desc: '排序', category: 'text' },
  { cmd: 'uniq -c', desc: '去重并计数', category: 'text' },
  { cmd: 'wc -l', desc: '统计行数', category: 'text' },

  // 系统
  { cmd: 'top', desc: '系统监控', category: 'system' },
  { cmd: 'htop', desc: '增强版 top', category: 'system' },
  { cmd: 'ps aux', desc: '查看所有进程', category: 'system' },
  { cmd: 'kill -9', desc: '强制终止进程', category: 'system' },
  { cmd: 'df -h', desc: '磁盘使用情况', category: 'system' },
  { cmd: 'du -sh *', desc: '当前目录各项大小', category: 'system' },
  { cmd: 'free -h', desc: '内存使用情况', category: 'system' },
  { cmd: 'uptime', desc: '运行时间', category: 'system' },
  { cmd: 'uname -a', desc: '系统信息', category: 'system' },
  { cmd: 'whoami', desc: '当前用户', category: 'system' },

  // 网络
  { cmd: 'ping -c 4', desc: '测试连通性', category: 'network' },
  { cmd: 'curl -I', desc: '获取响应头', category: 'network' },
  { cmd: 'wget', desc: '下载文件', category: 'network' },
  { cmd: 'netstat -tunlp', desc: '监听端口', category: 'network' },
  { cmd: 'ss -tunlp', desc: '套接字统计', category: 'network' },
  { cmd: 'ip addr', desc: 'IP 地址', category: 'network' },

  // 包管理
  { cmd: 'apt update', desc: '更新软件源', category: 'package' },
  { cmd: 'apt install', desc: '安装软件', category: 'package' },
  { cmd: 'yum install', desc: 'RHEL 安装', category: 'package' },
  { cmd: 'npm install', desc: 'Node 安装', category: 'package' },
  { cmd: 'pip install', desc: 'Python 安装', category: 'package' },

  // 服务
  { cmd: 'systemctl status', desc: '服务状态', category: 'service' },
  { cmd: 'systemctl start', desc: '启动服务', category: 'service' },
  { cmd: 'systemctl stop', desc: '停止服务', category: 'service' },
  { cmd: 'systemctl restart', desc: '重启服务', category: 'service' },
  { cmd: 'journalctl -f', desc: '实时日志', category: 'service' },

  // Docker
  { cmd: 'docker ps', desc: '运行中容器', category: 'docker' },
  { cmd: 'docker ps -a', desc: '所有容器', category: 'docker' },
  { cmd: 'docker images', desc: '镜像列表', category: 'docker' },
  { cmd: 'docker exec -it', desc: '进入容器', category: 'docker' },
  { cmd: 'docker logs -f', desc: '查看日志', category: 'docker' },
  { cmd: 'docker-compose up -d', desc: '启动服务', category: 'docker' },
  { cmd: 'docker-compose down', desc: '停止服务', category: 'docker' },

  // Git
  { cmd: 'git status', desc: '查看状态', category: 'git' },
  { cmd: 'git add .', desc: '添加所有文件', category: 'git' },
  { cmd: 'git commit -m', desc: '提交', category: 'git' },
  { cmd: 'git push', desc: '推送', category: 'git' },
  { cmd: 'git pull', desc: '拉取', category: 'git' },
  { cmd: 'git log --oneline', desc: '简洁日志', category: 'git' },

  // 其他
  { cmd: 'clear', desc: '清屏', category: 'other' },
  { cmd: 'history', desc: '命令历史', category: 'other' },
  { cmd: 'vim', desc: '文本编辑器', category: 'other' },
  { cmd: 'nano', desc: '简易编辑器', category: 'other' },
  { cmd: 'exit', desc: '退出终端', category: 'other' },
];

// 获取分类图标
const getCategoryIcon = (category) => {
  switch (category) {
    case 'file': return FiFolder;
    case 'text': return FiFile;
    case 'system': return FiServer;
    case 'network': return FiDatabase;
    case 'package': return FiPackage;
    case 'service': return FiSettings;
    case 'docker': return FiPackage;
    case 'git': return FiSearch;
    default: return FiTerminal;
  }
};

function CommandSuggestPanel({ visible, input, onSelect, onClose, onOpenCommandPalette, disabled }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  // 使用搜索框或输入内容过滤
  const filterText = searchText || input || '';
  
  // 过滤命令
  const suggestions = useMemo(() => {
    if (!filterText) return COMMAND_DATABASE.slice(0, 20);
    
    const query = filterText.toLowerCase().trim();
    return COMMAND_DATABASE.filter(item => 
      item.cmd.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [filterText]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [filterText]);

  // 滚动到选中项
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // 键盘导航
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' && suggestions[selectedIndex]) {
        e.preventDefault();
        onSelect(suggestions[selectedIndex].cmd);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, suggestions, selectedIndex, onSelect]);

  // 同步输入到搜索框
  useEffect(() => {
    if (input && !searchText) {
      // 如果有终端输入且搜索框为空，显示终端输入的内容
    }
  }, [input, searchText]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute top-0 right-0 bottom-0 w-72 bg-shell-surface/95 backdrop-blur-xl 
                   border-l border-shell-border z-20 flex flex-col"
      >
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-shell-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-shell-accent">
            <FiTerminal size={16} />
            <span className="font-display text-sm tracking-wide">SUGGEST</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-shell-card/50 text-shell-text-dim hover:text-shell-text transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-3 py-2 border-b border-shell-border/50">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-shell-text-dim" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={input ? `当前: ${input}` : "搜索命令..."}
              className="w-full pl-9 pr-3 py-2 bg-shell-card/50 border border-shell-border/50 rounded-lg
                        text-sm text-shell-text placeholder-shell-text-dim focus:outline-none 
                        focus:border-shell-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* 命令列表 */}
        <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar">
          {disabled ? (
            <div className="p-4 text-center text-shell-text-dim text-sm">
              请先连接服务器
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-shell-text-dim text-sm">
              未找到匹配的命令
            </div>
          ) : (
            suggestions.map((item, index) => {
              const Icon = getCategoryIcon(item.category);
              const isSelected = index === selectedIndex;
              
              return (
                <div
                  key={`${item.cmd}-${index}`}
                  ref={isSelected ? selectedRef : null}
                  onClick={() => !disabled && onSelect(item.cmd)}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center gap-3 transition-all border-l-2
                    ${isSelected 
                      ? 'bg-shell-accent/10 border-shell-accent' 
                      : 'border-transparent hover:bg-shell-card/30'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon 
                    size={14} 
                    className={isSelected ? 'text-shell-accent' : 'text-shell-text-dim'} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-sm ${isSelected ? 'text-shell-accent' : 'text-shell-text'}`}>
                      {item.cmd}
                    </div>
                    <div className="text-xs text-shell-text-dim truncate">
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-3 border-t border-shell-border/50 space-y-2">
          <div className="text-[10px] text-shell-text-dim text-center mb-2">
            ↑↓ 导航 · Tab 补全 · 点击选择
          </div>
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 
                      bg-shell-accent/10 hover:bg-shell-accent/20 border border-shell-accent/30
                      rounded-lg text-shell-accent text-sm transition-colors"
          >
            <FiCommand size={14} />
            <span>打开命令面板</span>
            <span className="text-xs opacity-60">Ctrl+K</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandSuggestPanel;
