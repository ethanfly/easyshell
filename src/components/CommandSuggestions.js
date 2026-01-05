import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTerminal, FiFolder, FiFile, FiSettings, FiSearch, FiPackage, FiServer, FiDatabase } from 'react-icons/fi';

// 常用 Linux/Unix 命令库 (不显示参数占位符)
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
  { cmd: 'rmdir', desc: '删除空目录', category: 'file' },
  { cmd: 'rm', desc: '删除文件', category: 'file' },
  { cmd: 'rm -rf', desc: '强制递归删除', category: 'file' },
  { cmd: 'cp', desc: '复制文件', category: 'file' },
  { cmd: 'cp -r', desc: '递归复制目录', category: 'file' },
  { cmd: 'mv', desc: '移动/重命名', category: 'file' },
  { cmd: 'touch', desc: '创建空文件', category: 'file' },
  { cmd: 'cat', desc: '查看文件内容', category: 'file' },
  { cmd: 'head', desc: '查看文件头部', category: 'file' },
  { cmd: 'head -n 20', desc: '查看前20行', category: 'file' },
  { cmd: 'tail', desc: '查看文件尾部', category: 'file' },
  { cmd: 'tail -f', desc: '实时追踪日志', category: 'file' },
  { cmd: 'less', desc: '分页查看文件', category: 'file' },
  { cmd: 'more', desc: '分页显示文件', category: 'file' },
  { cmd: 'find', desc: '查找文件', category: 'file' },
  { cmd: 'find . -name', desc: '按名称查找', category: 'file' },
  { cmd: 'locate', desc: '快速定位文件', category: 'file' },
  { cmd: 'chmod', desc: '修改权限', category: 'file' },
  { cmd: 'chmod 755', desc: '设置可执行权限', category: 'file' },
  { cmd: 'chmod 644', desc: '设置只读权限', category: 'file' },
  { cmd: 'chown', desc: '修改所有者', category: 'file' },
  { cmd: 'ln -s', desc: '创建软链接', category: 'file' },
  { cmd: 'tar', desc: '打包文件', category: 'file' },
  { cmd: 'tar -zxvf', desc: '解压 tar.gz', category: 'file' },
  { cmd: 'tar -zcvf', desc: '压缩为 tar.gz', category: 'file' },
  { cmd: 'zip -r', desc: '压缩目录', category: 'file' },
  { cmd: 'unzip', desc: '解压 zip', category: 'file' },
  { cmd: 'gzip', desc: '压缩文件', category: 'file' },
  { cmd: 'gunzip', desc: '解压 gz', category: 'file' },
  
  // 文本处理
  { cmd: 'grep', desc: '文本搜索', category: 'text' },
  { cmd: 'grep -rn', desc: '递归搜索带行号', category: 'text' },
  { cmd: 'grep -i', desc: '忽略大小写搜索', category: 'text' },
  { cmd: 'sed', desc: '流编辑器', category: 'text' },
  { cmd: 'awk', desc: '文本处理', category: 'text' },
  { cmd: 'sort', desc: '排序', category: 'text' },
  { cmd: 'sort -n', desc: '数字排序', category: 'text' },
  { cmd: 'uniq', desc: '去重', category: 'text' },
  { cmd: 'uniq -c', desc: '去重并计数', category: 'text' },
  { cmd: 'wc -l', desc: '统计行数', category: 'text' },
  { cmd: 'wc -w', desc: '统计单词数', category: 'text' },
  { cmd: 'cut', desc: '切割文本', category: 'text' },
  { cmd: 'diff', desc: '比较文件', category: 'text' },
  { cmd: 'echo', desc: '输出文本', category: 'text' },
  { cmd: 'printf', desc: '格式化输出', category: 'text' },
  
  // 系统信息
  { cmd: 'top', desc: '系统监控', category: 'system' },
  { cmd: 'htop', desc: '增强版 top', category: 'system' },
  { cmd: 'ps aux', desc: '查看所有进程', category: 'system' },
  { cmd: 'ps -ef', desc: '进程树', category: 'system' },
  { cmd: 'kill', desc: '终止进程', category: 'system' },
  { cmd: 'kill -9', desc: '强制终止进程', category: 'system' },
  { cmd: 'killall', desc: '按名称终止', category: 'system' },
  { cmd: 'df -h', desc: '磁盘使用情况', category: 'system' },
  { cmd: 'du -sh', desc: '目录大小', category: 'system' },
  { cmd: 'du -sh *', desc: '当前目录各项大小', category: 'system' },
  { cmd: 'free -h', desc: '内存使用情况', category: 'system' },
  { cmd: 'uptime', desc: '运行时间', category: 'system' },
  { cmd: 'uname -a', desc: '系统信息', category: 'system' },
  { cmd: 'hostname', desc: '主机名', category: 'system' },
  { cmd: 'whoami', desc: '当前用户', category: 'system' },
  { cmd: 'id', desc: '用户信息', category: 'system' },
  { cmd: 'w', desc: '登录用户', category: 'system' },
  { cmd: 'last', desc: '登录历史', category: 'system' },
  { cmd: 'dmesg | tail', desc: '内核消息', category: 'system' },
  { cmd: 'lsof', desc: '打开的文件', category: 'system' },
  { cmd: 'lsof -i', desc: '网络连接', category: 'system' },
  { cmd: 'lscpu', desc: 'CPU 信息', category: 'system' },
  { cmd: 'lsmem', desc: '内存信息', category: 'system' },
  { cmd: 'lsblk', desc: '块设备', category: 'system' },
  { cmd: 'fdisk -l', desc: '磁盘分区', category: 'system' },
  
  // 网络
  { cmd: 'ping', desc: '测试连通性', category: 'network' },
  { cmd: 'ping -c 4', desc: '发送4次ping', category: 'network' },
  { cmd: 'curl', desc: 'HTTP 请求', category: 'network' },
  { cmd: 'curl -I', desc: '获取响应头', category: 'network' },
  { cmd: 'curl -O', desc: '下载文件', category: 'network' },
  { cmd: 'wget', desc: '下载文件', category: 'network' },
  { cmd: 'ssh', desc: 'SSH 连接', category: 'network' },
  { cmd: 'scp', desc: '安全复制', category: 'network' },
  { cmd: 'rsync -avz', desc: '同步文件', category: 'network' },
  { cmd: 'netstat -tunlp', desc: '监听端口', category: 'network' },
  { cmd: 'ss -tunlp', desc: '套接字统计', category: 'network' },
  { cmd: 'ip addr', desc: 'IP 地址', category: 'network' },
  { cmd: 'ip route', desc: '路由表', category: 'network' },
  { cmd: 'ifconfig', desc: '网络接口', category: 'network' },
  { cmd: 'route -n', desc: '路由表', category: 'network' },
  { cmd: 'iptables -L -n', desc: '防火墙规则', category: 'network' },
  { cmd: 'nslookup', desc: 'DNS 查询', category: 'network' },
  { cmd: 'dig', desc: 'DNS 详细查询', category: 'network' },
  { cmd: 'traceroute', desc: '路由追踪', category: 'network' },
  { cmd: 'tcpdump -i', desc: '抓包', category: 'network' },
  
  // 包管理
  { cmd: 'apt update', desc: '更新软件源', category: 'package' },
  { cmd: 'apt upgrade', desc: '升级软件包', category: 'package' },
  { cmd: 'apt install', desc: '安装软件', category: 'package' },
  { cmd: 'apt remove', desc: '卸载软件', category: 'package' },
  { cmd: 'apt search', desc: '搜索软件', category: 'package' },
  { cmd: 'yum install', desc: 'RHEL 安装', category: 'package' },
  { cmd: 'yum update', desc: 'RHEL 更新', category: 'package' },
  { cmd: 'dnf install', desc: 'Fedora 安装', category: 'package' },
  { cmd: 'pacman -S', desc: 'Arch 安装', category: 'package' },
  { cmd: 'pacman -Syu', desc: 'Arch 更新', category: 'package' },
  { cmd: 'npm install', desc: 'Node 安装', category: 'package' },
  { cmd: 'npm run', desc: 'Node 运行脚本', category: 'package' },
  { cmd: 'pip install', desc: 'Python 安装', category: 'package' },
  { cmd: 'pip3 install', desc: 'Python3 安装', category: 'package' },
  
  // 服务管理
  { cmd: 'systemctl status', desc: '服务状态', category: 'service' },
  { cmd: 'systemctl start', desc: '启动服务', category: 'service' },
  { cmd: 'systemctl stop', desc: '停止服务', category: 'service' },
  { cmd: 'systemctl restart', desc: '重启服务', category: 'service' },
  { cmd: 'systemctl enable', desc: '开机启动', category: 'service' },
  { cmd: 'systemctl disable', desc: '禁止开机启动', category: 'service' },
  { cmd: 'journalctl -f', desc: '实时日志', category: 'service' },
  { cmd: 'journalctl -u', desc: '服务日志', category: 'service' },
  
  // Docker
  { cmd: 'docker ps', desc: '运行中容器', category: 'docker' },
  { cmd: 'docker ps -a', desc: '所有容器', category: 'docker' },
  { cmd: 'docker images', desc: '镜像列表', category: 'docker' },
  { cmd: 'docker run', desc: '运行容器', category: 'docker' },
  { cmd: 'docker exec -it', desc: '进入容器', category: 'docker' },
  { cmd: 'docker logs -f', desc: '查看日志', category: 'docker' },
  { cmd: 'docker stop', desc: '停止容器', category: 'docker' },
  { cmd: 'docker rm', desc: '删除容器', category: 'docker' },
  { cmd: 'docker rmi', desc: '删除镜像', category: 'docker' },
  { cmd: 'docker-compose up -d', desc: '启动服务', category: 'docker' },
  { cmd: 'docker-compose down', desc: '停止服务', category: 'docker' },
  { cmd: 'docker-compose logs -f', desc: '查看日志', category: 'docker' },
  
  // Git
  { cmd: 'git status', desc: '查看状态', category: 'git' },
  { cmd: 'git add .', desc: '添加所有文件', category: 'git' },
  { cmd: 'git commit -m', desc: '提交', category: 'git' },
  { cmd: 'git push', desc: '推送', category: 'git' },
  { cmd: 'git pull', desc: '拉取', category: 'git' },
  { cmd: 'git log --oneline', desc: '简洁日志', category: 'git' },
  { cmd: 'git diff', desc: '查看差异', category: 'git' },
  { cmd: 'git branch', desc: '分支列表', category: 'git' },
  { cmd: 'git checkout', desc: '切换分支', category: 'git' },
  { cmd: 'git merge', desc: '合并分支', category: 'git' },
  
  // 其他
  { cmd: 'clear', desc: '清屏', category: 'other' },
  { cmd: 'history', desc: '命令历史', category: 'other' },
  { cmd: 'alias', desc: '别名列表', category: 'other' },
  { cmd: 'which', desc: '命令路径', category: 'other' },
  { cmd: 'whereis', desc: '二进制位置', category: 'other' },
  { cmd: 'man', desc: '查看手册', category: 'other' },
  { cmd: 'date', desc: '日期时间', category: 'other' },
  { cmd: 'cal', desc: '日历', category: 'other' },
  { cmd: 'env', desc: '环境变量', category: 'other' },
  { cmd: 'export', desc: '设置变量', category: 'other' },
  { cmd: 'source', desc: '执行脚本', category: 'other' },
  { cmd: 'crontab -l', desc: '查看定时任务', category: 'other' },
  { cmd: 'crontab -e', desc: '编辑定时任务', category: 'other' },
  { cmd: 'nohup', desc: '后台运行', category: 'other' },
  { cmd: 'screen -S', desc: '创建会话', category: 'other' },
  { cmd: 'screen -r', desc: '恢复会话', category: 'other' },
  { cmd: 'tmux new -s', desc: '创建会话', category: 'other' },
  { cmd: 'tmux attach -t', desc: '恢复会话', category: 'other' },
  { cmd: 'vim', desc: '文本编辑器', category: 'other' },
  { cmd: 'nano', desc: '简易编辑器', category: 'other' },
  { cmd: 'vi', desc: 'Vi 编辑器', category: 'other' },
  { cmd: 'exit', desc: '退出终端', category: 'other' },
  { cmd: 'reboot', desc: '重启系统', category: 'other' },
  { cmd: 'shutdown -h now', desc: '立即关机', category: 'other' },
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

function CommandSuggestions({ input, position, onSelect, onClose, visible, cursorPosition }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);
  const selectedRef = useRef(null);

  // 根据输入过滤命令
  const suggestions = React.useMemo(() => {
    if (!input || input.length < 1) return [];
    
    const query = input.toLowerCase().trim();
    
    // 匹配以输入开头的命令
    const results = COMMAND_DATABASE.filter(item => 
      item.cmd.toLowerCase().startsWith(query) ||
      item.desc.toLowerCase().includes(query)
    );
    
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
          // 只用 Tab 选择
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            e.stopPropagation();
            onSelect(suggestions[selectedIndex].cmd);
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

  // 计算提示框位置（在光标下方）
  const positionStyle = cursorPosition ? {
    top: cursorPosition.top + 20,
    left: cursorPosition.left,
  } : {
    bottom: position?.bottom || 60,
    left: position?.left || 16,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className="absolute z-50 bg-shell-surface/95 backdrop-blur-xl border border-shell-accent/30 
                   rounded-lg shadow-2xl overflow-hidden min-w-[240px] max-w-[360px]"
        style={positionStyle}
      >
        {/* 简化的标题栏 */}
        <div className="px-2 py-1 border-b border-shell-border/30 flex items-center justify-between bg-shell-card/30">
          <span className="text-[10px] text-shell-text-dim font-mono">
            ↑↓ 导航
          </span>
          <span className="text-[10px] text-shell-accent font-mono">
            Tab 补全
          </span>
        </div>
        
        {/* 建议列表 */}
        <div ref={listRef} className="max-h-[200px] overflow-y-auto custom-scrollbar">
          {suggestions.map((item, index) => {
            const Icon = getCategoryIcon(item.category);
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={`${item.cmd}-${index}`}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(item.cmd)}
                className={`
                  px-2 py-1.5 cursor-pointer flex items-center gap-2 transition-all
                  ${isSelected 
                    ? 'bg-shell-accent/20 border-l-2 border-shell-accent' 
                    : 'hover:bg-shell-card/50 border-l-2 border-transparent'
                  }
                `}
              >
                <Icon 
                  size={12} 
                  className={isSelected ? 'text-shell-accent' : 'text-shell-text-dim'} 
                />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className={`font-mono text-xs ${isSelected ? 'text-shell-accent' : 'text-shell-text'}`}>
                    {item.cmd}
                  </span>
                  <span className="text-[10px] text-shell-text-dim truncate">
                    {item.desc}
                  </span>
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
