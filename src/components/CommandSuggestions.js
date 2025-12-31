import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTerminal, FiFolder, FiFile, FiSettings, FiSearch, FiPackage, FiServer, FiDatabase } from 'react-icons/fi';

// 常用 Linux/Unix 命令库
const COMMAND_DATABASE = [
  // 文件操作
  { cmd: 'ls', desc: '列出目录内容', category: 'file', args: '-la' },
  { cmd: 'cd', desc: '切换目录', category: 'file', args: '/path' },
  { cmd: 'pwd', desc: '显示当前目录', category: 'file' },
  { cmd: 'mkdir', desc: '创建目录', category: 'file', args: '-p dirname' },
  { cmd: 'rmdir', desc: '删除空目录', category: 'file', args: 'dirname' },
  { cmd: 'rm', desc: '删除文件/目录', category: 'file', args: '-rf path' },
  { cmd: 'cp', desc: '复制文件/目录', category: 'file', args: '-r src dst' },
  { cmd: 'mv', desc: '移动/重命名', category: 'file', args: 'src dst' },
  { cmd: 'touch', desc: '创建空文件', category: 'file', args: 'filename' },
  { cmd: 'cat', desc: '查看文件内容', category: 'file', args: 'filename' },
  { cmd: 'head', desc: '查看文件头部', category: 'file', args: '-n 20 file' },
  { cmd: 'tail', desc: '查看文件尾部', category: 'file', args: '-f logfile' },
  { cmd: 'less', desc: '分页查看文件', category: 'file', args: 'filename' },
  { cmd: 'more', desc: '分页显示文件', category: 'file', args: 'filename' },
  { cmd: 'find', desc: '查找文件', category: 'file', args: '. -name "*.log"' },
  { cmd: 'locate', desc: '快速定位文件', category: 'file', args: 'filename' },
  { cmd: 'chmod', desc: '修改权限', category: 'file', args: '755 file' },
  { cmd: 'chown', desc: '修改所有者', category: 'file', args: 'user:group file' },
  { cmd: 'ln', desc: '创建链接', category: 'file', args: '-s target link' },
  { cmd: 'tar', desc: '打包/解包', category: 'file', args: '-zxvf file.tar.gz' },
  { cmd: 'zip', desc: '压缩文件', category: 'file', args: '-r archive.zip dir' },
  { cmd: 'unzip', desc: '解压 zip', category: 'file', args: 'archive.zip' },
  { cmd: 'gzip', desc: '压缩文件', category: 'file', args: 'filename' },
  { cmd: 'gunzip', desc: '解压 gz', category: 'file', args: 'file.gz' },
  
  // 文本处理
  { cmd: 'grep', desc: '文本搜索', category: 'text', args: '-rn "pattern" .' },
  { cmd: 'sed', desc: '流编辑器', category: 'text', args: "'s/old/new/g' file" },
  { cmd: 'awk', desc: '文本处理', category: 'text', args: "'{print $1}' file" },
  { cmd: 'sort', desc: '排序', category: 'text', args: '-n file' },
  { cmd: 'uniq', desc: '去重', category: 'text', args: '-c file' },
  { cmd: 'wc', desc: '统计行/字/字符', category: 'text', args: '-l file' },
  { cmd: 'cut', desc: '切割文本', category: 'text', args: "-d':' -f1 file" },
  { cmd: 'diff', desc: '比较文件', category: 'text', args: 'file1 file2' },
  { cmd: 'echo', desc: '输出文本', category: 'text', args: '"Hello World"' },
  { cmd: 'printf', desc: '格式化输出', category: 'text', args: '"%s\\n" text' },
  
  // 系统信息
  { cmd: 'top', desc: '系统监控', category: 'system' },
  { cmd: 'htop', desc: '增强版 top', category: 'system' },
  { cmd: 'ps', desc: '查看进程', category: 'system', args: 'aux' },
  { cmd: 'kill', desc: '终止进程', category: 'system', args: '-9 PID' },
  { cmd: 'killall', desc: '按名称终止', category: 'system', args: 'process_name' },
  { cmd: 'df', desc: '磁盘使用', category: 'system', args: '-h' },
  { cmd: 'du', desc: '目录大小', category: 'system', args: '-sh *' },
  { cmd: 'free', desc: '内存使用', category: 'system', args: '-h' },
  { cmd: 'uptime', desc: '运行时间', category: 'system' },
  { cmd: 'uname', desc: '系统信息', category: 'system', args: '-a' },
  { cmd: 'hostname', desc: '主机名', category: 'system' },
  { cmd: 'whoami', desc: '当前用户', category: 'system' },
  { cmd: 'id', desc: '用户信息', category: 'system' },
  { cmd: 'w', desc: '登录用户', category: 'system' },
  { cmd: 'last', desc: '登录历史', category: 'system' },
  { cmd: 'dmesg', desc: '内核消息', category: 'system', args: '| tail' },
  { cmd: 'lsof', desc: '打开的文件', category: 'system', args: '-i :80' },
  { cmd: 'lscpu', desc: 'CPU 信息', category: 'system' },
  { cmd: 'lsmem', desc: '内存信息', category: 'system' },
  { cmd: 'lsblk', desc: '块设备', category: 'system' },
  { cmd: 'fdisk', desc: '磁盘分区', category: 'system', args: '-l' },
  
  // 网络
  { cmd: 'ping', desc: '测试连通性', category: 'network', args: '-c 4 host' },
  { cmd: 'curl', desc: 'HTTP 请求', category: 'network', args: '-I url' },
  { cmd: 'wget', desc: '下载文件', category: 'network', args: 'url' },
  { cmd: 'ssh', desc: 'SSH 连接', category: 'network', args: 'user@host' },
  { cmd: 'scp', desc: '安全复制', category: 'network', args: 'file user@host:path' },
  { cmd: 'rsync', desc: '同步文件', category: 'network', args: '-avz src dst' },
  { cmd: 'netstat', desc: '网络统计', category: 'network', args: '-tunlp' },
  { cmd: 'ss', desc: '套接字统计', category: 'network', args: '-tunlp' },
  { cmd: 'ip', desc: 'IP 配置', category: 'network', args: 'addr show' },
  { cmd: 'ifconfig', desc: '网络接口', category: 'network' },
  { cmd: 'route', desc: '路由表', category: 'network', args: '-n' },
  { cmd: 'iptables', desc: '防火墙', category: 'network', args: '-L -n' },
  { cmd: 'nslookup', desc: 'DNS 查询', category: 'network', args: 'domain' },
  { cmd: 'dig', desc: 'DNS 详细查询', category: 'network', args: 'domain' },
  { cmd: 'traceroute', desc: '路由追踪', category: 'network', args: 'host' },
  { cmd: 'tcpdump', desc: '抓包', category: 'network', args: '-i eth0' },
  
  // 包管理
  { cmd: 'apt', desc: 'Debian 包管理', category: 'package', args: 'update && apt upgrade' },
  { cmd: 'apt-get', desc: 'APT 包管理', category: 'package', args: 'install package' },
  { cmd: 'yum', desc: 'RHEL 包管理', category: 'package', args: 'install package' },
  { cmd: 'dnf', desc: 'Fedora 包管理', category: 'package', args: 'install package' },
  { cmd: 'pacman', desc: 'Arch 包管理', category: 'package', args: '-S package' },
  { cmd: 'npm', desc: 'Node 包管理', category: 'package', args: 'install package' },
  { cmd: 'pip', desc: 'Python 包管理', category: 'package', args: 'install package' },
  { cmd: 'pip3', desc: 'Python3 包管理', category: 'package', args: 'install package' },
  
  // 服务管理
  { cmd: 'systemctl', desc: '服务管理', category: 'service', args: 'status service' },
  { cmd: 'service', desc: '服务控制', category: 'service', args: 'nginx restart' },
  { cmd: 'journalctl', desc: '查看日志', category: 'service', args: '-u service -f' },
  
  // Docker
  { cmd: 'docker', desc: 'Docker 命令', category: 'docker', args: 'ps -a' },
  { cmd: 'docker-compose', desc: 'Docker Compose', category: 'docker', args: 'up -d' },
  
  // Git
  { cmd: 'git', desc: 'Git 版本控制', category: 'git', args: 'status' },
  
  // 其他
  { cmd: 'clear', desc: '清屏', category: 'other' },
  { cmd: 'history', desc: '命令历史', category: 'other' },
  { cmd: 'alias', desc: '别名列表', category: 'other' },
  { cmd: 'which', desc: '命令路径', category: 'other', args: 'command' },
  { cmd: 'whereis', desc: '二进制位置', category: 'other', args: 'command' },
  { cmd: 'man', desc: '查看手册', category: 'other', args: 'command' },
  { cmd: 'date', desc: '日期时间', category: 'other' },
  { cmd: 'cal', desc: '日历', category: 'other' },
  { cmd: 'env', desc: '环境变量', category: 'other' },
  { cmd: 'export', desc: '设置变量', category: 'other', args: 'VAR=value' },
  { cmd: 'source', desc: '执行脚本', category: 'other', args: 'script.sh' },
  { cmd: 'crontab', desc: '定时任务', category: 'other', args: '-l' },
  { cmd: 'nohup', desc: '后台运行', category: 'other', args: 'command &' },
  { cmd: 'screen', desc: '终端复用', category: 'other', args: '-S session' },
  { cmd: 'tmux', desc: '终端复用', category: 'other', args: 'new -s session' },
  { cmd: 'vim', desc: '文本编辑器', category: 'other', args: 'filename' },
  { cmd: 'nano', desc: '简易编辑器', category: 'other', args: 'filename' },
  { cmd: 'vi', desc: 'Vi 编辑器', category: 'other', args: 'filename' },
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

function CommandSuggestions({ input, position, onSelect, onClose, visible }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  // 根据输入过滤命令
  const suggestions = React.useMemo(() => {
    if (!input || input.length < 1) return [];
    
    const query = input.toLowerCase().trim();
    
    // 分词，获取最后一个输入的词
    const parts = query.split(/\s+/);
    const lastWord = parts[parts.length - 1];
    const isFirstWord = parts.length === 1;
    
    if (!lastWord) return [];
    
    let results = [];
    
    if (isFirstWord) {
      // 第一个词：搜索命令
      results = COMMAND_DATABASE.filter(item => 
        item.cmd.toLowerCase().startsWith(lastWord) ||
        item.desc.toLowerCase().includes(lastWord)
      );
    } else {
      // 后续词：搜索该命令的常用参数或相关命令
      const baseCmd = parts[0];
      const cmdInfo = COMMAND_DATABASE.find(c => c.cmd === baseCmd);
      
      if (cmdInfo && cmdInfo.args) {
        // 如果有预设参数，显示参数提示
        results = [{
          cmd: `${baseCmd} ${cmdInfo.args}`,
          desc: `${cmdInfo.desc} (常用参数)`,
          category: cmdInfo.category,
          isFullCmd: true
        }];
      }
      
      // 也搜索其他可能的命令组合
      const otherResults = COMMAND_DATABASE.filter(item => 
        item.cmd.toLowerCase().startsWith(lastWord)
      ).slice(0, 3);
      
      results = [...results, ...otherResults];
    }
    
    return results.slice(0, 8);
  }, [input]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [input]);

  // 滚动到选中项
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // 键盘导航
  useEffect(() => {
    if (!visible || suggestions.length === 0) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Tab':
        case 'Enter':
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            e.stopPropagation();
            const item = suggestions[selectedIndex];
            onSelect(item.isFullCmd ? item.cmd : item.cmd);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [visible, suggestions, selectedIndex, onSelect, onClose]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 bg-shell-surface/95 backdrop-blur-xl border border-shell-accent/30 
                   rounded-lg shadow-2xl overflow-hidden min-w-[280px] max-w-[400px]"
        style={{
          bottom: position?.bottom || 60,
          left: position?.left || 16,
        }}
      >
        {/* 标题栏 */}
        <div className="px-3 py-1.5 border-b border-shell-border/50 flex items-center justify-between">
          <span className="text-[10px] text-shell-text-dim font-mono uppercase tracking-wider">
            命令提示
          </span>
          <span className="text-[10px] text-shell-text-dim">
            Tab 选择 · Esc 关闭
          </span>
        </div>
        
        {/* 建议列表 */}
        <div ref={listRef} className="max-h-[240px] overflow-y-auto custom-scrollbar">
          {suggestions.map((item, index) => {
            const Icon = getCategoryIcon(item.category);
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={`${item.cmd}-${index}`}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(item.isFullCmd ? item.cmd : item.cmd)}
                className={`
                  px-3 py-2 cursor-pointer flex items-center gap-3 transition-all
                  ${isSelected 
                    ? 'bg-shell-accent/20 border-l-2 border-shell-accent' 
                    : 'hover:bg-shell-card/50 border-l-2 border-transparent'
                  }
                `}
              >
                <Icon 
                  size={14} 
                  className={isSelected ? 'text-shell-accent' : 'text-shell-text-dim'} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm ${isSelected ? 'text-shell-accent' : 'text-shell-text'}`}>
                      {item.cmd}
                    </span>
                    {item.args && !item.isFullCmd && (
                      <span className="text-xs text-shell-text-dim font-mono opacity-60">
                        {item.args}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-shell-text-dim truncate">
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandSuggestions;
