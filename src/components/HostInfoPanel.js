import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiServer, FiCpu, FiHardDrive, FiActivity, FiClock, 
  FiUser, FiGlobe, FiTerminal, FiFolder, FiRefreshCw,
  FiChevronRight, FiX, FiZap
} from 'react-icons/fi';

function HostInfoPanel({ hostId, connectionId, isConnected, onOpenSFTP, onClose }) {
  const [hostInfo, setHostInfo] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'system'

  // 加载主机基本信息
  const loadHostInfo = useCallback(async () => {
    if (!hostId) return;
    try {
      const host = await window.electronAPI.hosts.getById(hostId);
      setHostInfo(host);
    } catch (err) {
      console.error('加载主机信息失败:', err);
    }
  }, [hostId]);

  // 获取系统信息
  const fetchSystemInfo = useCallback(async () => {
    if (!connectionId || !isConnected || !hostInfo) return;
    
    setRefreshing(true);
    try {
      const result = await window.electronAPI.ssh.exec(
        {
          host: hostInfo.host,
          port: hostInfo.port,
          username: hostInfo.username,
          password: hostInfo.password,
          privateKey: hostInfo.private_key,
        },
        `
          echo "===HOSTNAME===$(hostname)"
          echo "===OS===$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || uname -s)"
          echo "===KERNEL===$(uname -r)"
          echo "===UPTIME===$(uptime -p 2>/dev/null || uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')"
          echo "===CPU===$(grep 'model name' /proc/cpuinfo 2>/dev/null | head -1 | cut -d':' -f2 | xargs || sysctl -n machdep.cpu.brand_string 2>/dev/null)"
          echo "===CPU_CORES===$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null)"
          echo "===MEMORY===$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 'N/A')"
          echo "===MEMORY_USED===$(free -h 2>/dev/null | awk '/^Mem:/ {print $3}' || echo 'N/A')"
          echo "===LOAD===$(cat /proc/loadavg 2>/dev/null | awk '{print $1, $2, $3}' || uptime | awk -F'load average:' '{print $2}' | xargs)"
          echo "===IP===$(hostname -I 2>/dev/null | awk '{print $1}' || ifconfig 2>/dev/null | grep 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $2}')"
          echo "===DISKS_START==="
          df -h -T 2>/dev/null | grep -E '^/dev/' | grep -v 'tmpfs\|devtmpfs\|squashfs\|overlay\|loop' | awk '{print $1"|"$2"|"$3"|"$4"|"$6"|"$7}' || df -h 2>/dev/null | grep -E '^/dev/' | awk '{print $1"|unknown|"$2"|"$3"|"$5"|"$6}'
          echo "===DISKS_END==="
        `
      );

      if (result.stdout) {
        const parseValue = (key) => {
          const match = result.stdout.match(new RegExp(`===${key}===(.+)`));
          return match ? match[1].trim() : 'N/A';
        };

        // 解析多硬盘信息
        const disksMatch = result.stdout.match(/===DISKS_START===([\s\S]*?)===DISKS_END===/);
        const disks = [];
        if (disksMatch && disksMatch[1]) {
          const diskLines = disksMatch[1].trim().split('\n').filter(line => line.trim());
          for (const line of diskLines) {
            const parts = line.split('|');
            if (parts.length >= 6) {
              disks.push({
                device: parts[0],
                type: parts[1],
                total: parts[2],
                used: parts[3],
                percent: parts[4],
                mount: parts[5],
              });
            }
          }
        }

        setSystemInfo({
          hostname: parseValue('HOSTNAME'),
          os: parseValue('OS'),
          kernel: parseValue('KERNEL'),
          uptime: parseValue('UPTIME'),
          cpu: parseValue('CPU'),
          cpuCores: parseValue('CPU_CORES'),
          memory: parseValue('MEMORY'),
          memoryUsed: parseValue('MEMORY_USED'),
          load: parseValue('LOAD'),
          ip: parseValue('IP'),
          disks: disks.length > 0 ? disks : [{ device: '/dev/sda1', type: 'unknown', total: 'N/A', used: 'N/A', percent: '0%', mount: '/' }],
        });
      }
    } catch (err) {
      console.error('获取系统信息失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [connectionId, isConnected, hostInfo]);

  useEffect(() => {
    loadHostInfo();
  }, [loadHostInfo]);

  useEffect(() => {
    if (hostInfo && isConnected) {
      fetchSystemInfo();
    }
  }, [hostInfo, isConnected, fetchSystemInfo]);

  // 计算使用率百分比
  const getUsagePercent = (used, total) => {
    if (!used || !total || used === 'N/A' || total === 'N/A') return 0;
    const usedNum = parseFloat(used);
    const totalNum = parseFloat(total);
    if (isNaN(usedNum) || isNaN(totalNum) || totalNum === 0) return 0;
    return Math.min(100, Math.round((usedNum / totalNum) * 100));
  };

  const InfoCard = ({ icon: Icon, label, value, subValue }) => (
    <div className="bg-shell-surface/50 rounded-lg p-3 border border-shell-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-shell-accent" />
        <span className="text-shell-text-dim text-xs">{label}</span>
      </div>
      <div className="text-shell-text font-medium text-sm truncate" title={value}>
        {value || 'N/A'}
      </div>
      {subValue && (
        <div className="text-shell-text-dim text-xs mt-1">{subValue}</div>
      )}
    </div>
  );

  const UsageBar = ({ label, used, total, percent, color = 'shell-accent' }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-shell-text-dim">{label}</span>
        <span className="text-shell-text">{used} / {total}</span>
      </div>
      <div className="h-2 bg-shell-border/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ 
            backgroundColor: percent > 80 ? '#f85149' : percent > 60 ? '#d29922' : '#58a6ff'
          }}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full bg-shell-surface/90 backdrop-blur-xl border-l border-shell-border flex flex-col overflow-hidden relative"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 hex-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-shell-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* 头部 */}
      <div className="h-11 px-4 flex items-center justify-between border-b border-shell-border flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-shell-accent/10 border border-shell-accent/30">
            <FiZap size={14} className="text-shell-accent" />
          </div>
          <span className="text-shell-text font-semibold text-sm font-display tracking-wide">HOST INFO</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1.5 rounded-lg bg-shell-card/50 border border-shell-border 
                     text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30 transition-all"
        >
          <FiX size={14} />
        </motion.button>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-shell-border relative z-10">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2.5 text-sm font-medium transition-all font-display tracking-wide relative ${
            activeTab === 'info'
              ? 'text-shell-accent'
              : 'text-shell-text-dim hover:text-shell-text'
          }`}
        >
          BASIC
          {activeTab === 'info' && (
            <motion.div
              layoutId="panelTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-shell-accent"
              style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2.5 text-sm font-medium transition-all font-display tracking-wide relative ${
            activeTab === 'system'
              ? 'text-shell-accent'
              : 'text-shell-text-dim hover:text-shell-text'
          }`}
        >
          SYSTEM
          {activeTab === 'system' && (
            <motion.div
              layoutId="panelTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-shell-accent"
              style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)' }}
            />
          )}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {/* 连接状态 */}
              <div className="bg-shell-card/50 rounded-lg p-4 border border-shell-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'status-online' : 'status-offline'}`} />
                  <span className="text-shell-text font-medium">
                    {isConnected ? '已连接' : '未连接'}
                  </span>
                </div>
                {hostInfo && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FiTerminal size={14} className="text-shell-text-dim" />
                      <span className="text-shell-text-dim">名称:</span>
                      <span className="text-shell-text">{hostInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiGlobe size={14} className="text-shell-text-dim" />
                      <span className="text-shell-text-dim">地址:</span>
                      <span className="text-shell-text font-mono">{hostInfo.host}:{hostInfo.port || 22}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiUser size={14} className="text-shell-text-dim" />
                      <span className="text-shell-text-dim">用户:</span>
                      <span className="text-shell-text">{hostInfo.username}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 标签 */}
              {hostInfo?.tags && (
                <div className="flex flex-wrap gap-2">
                  {hostInfo.tags.split(',').filter(Boolean).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-shell-accent/10 text-shell-accent text-xs rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* 描述 */}
              {hostInfo?.description && (
                <div className="bg-shell-surface/50 rounded-lg p-3 border border-shell-border/50">
                  <div className="text-shell-text-dim text-xs mb-1">描述</div>
                  <div className="text-shell-text text-sm">{hostInfo.description}</div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="system"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* 刷新按钮 */}
              <div className="flex justify-end">
                <button
                  onClick={fetchSystemInfo}
                  disabled={refreshing || !isConnected}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs
                             text-shell-text-dim hover:text-shell-text 
                             hover:bg-shell-card transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                  刷新
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-shell-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !isConnected ? (
                <div className="text-center py-8 text-shell-text-dim text-sm">
                  请先连接主机
                </div>
              ) : systemInfo ? (
                <>
                  {/* 系统基本信息 */}
                  <div className="grid grid-cols-2 gap-2">
                    <InfoCard icon={FiServer} label="主机名" value={systemInfo.hostname} />
                    <InfoCard icon={FiGlobe} label="IP 地址" value={systemInfo.ip} />
                  </div>

                  <InfoCard icon={FiTerminal} label="操作系统" value={systemInfo.os} subValue={`Kernel: ${systemInfo.kernel}`} />
                  
                  <InfoCard icon={FiClock} label="运行时间" value={systemInfo.uptime} />

                  {/* CPU 信息 */}
                  <div className="bg-shell-surface/50 rounded-lg p-3 border border-shell-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCpu size={14} className="text-shell-cyan" />
                      <span className="text-shell-text-dim text-xs">CPU</span>
                    </div>
                    <div className="text-shell-text text-sm truncate" title={systemInfo.cpu}>
                      {systemInfo.cpu}
                    </div>
                    <div className="text-shell-text-dim text-xs mt-1">
                      {systemInfo.cpuCores} 核心 · 负载: {systemInfo.load}
                    </div>
                  </div>

                  {/* 内存使用 */}
                  <div className="bg-shell-surface/50 rounded-lg p-3 border border-shell-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FiActivity size={14} className="text-shell-purple" />
                      <span className="text-shell-text-dim text-xs">内存</span>
                    </div>
                    <UsageBar
                      label="使用率"
                      used={systemInfo.memoryUsed}
                      total={systemInfo.memory}
                      percent={getUsagePercent(systemInfo.memoryUsed, systemInfo.memory)}
                    />
                  </div>

                  {/* 磁盘使用 - 支持多硬盘 */}
                  <div className="bg-shell-surface/50 rounded-lg p-3 border border-shell-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FiHardDrive size={14} className="text-shell-orange" />
                      <span className="text-shell-text-dim text-xs">磁盘</span>
                      <span className="text-shell-text-dim text-xs ml-auto">
                        共 {systemInfo.disks?.length || 0} 个分区
                      </span>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {systemInfo.disks?.map((disk, index) => (
                        <div key={index} className="bg-shell-bg/30 rounded-lg p-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-shell-accent font-mono truncate max-w-[120px]" title={disk.mount}>
                              {disk.mount}
                            </span>
                            <span className="text-shell-text-dim text-[10px]" title={disk.device}>
                              {disk.type !== 'unknown' ? disk.type : disk.device.split('/').pop()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-shell-text-dim">使用</span>
                            <span className="text-shell-text">{disk.used} / {disk.total}</span>
                          </div>
                          <div className="h-1.5 bg-shell-border/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${parseInt(disk.percent) || 0}%`,
                                backgroundColor: parseInt(disk.percent) > 80 ? '#f85149' : parseInt(disk.percent) > 60 ? '#d29922' : '#58a6ff'
                              }}
                            />
                          </div>
                          <div className="text-right text-[10px] text-shell-text-dim mt-0.5">
                            {disk.percent}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-shell-text-dim text-sm">
                  无法获取系统信息
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-shell-border flex-shrink-0 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenSFTP}
          disabled={!isConnected}
          className="w-full btn-cyber flex items-center justify-center gap-2 px-4 py-3
                     rounded-lg text-shell-accent font-display tracking-wide text-sm
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
        >
          <FiFolder size={16} />
          OPEN SFTP MANAGER
          <FiChevronRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default HostInfoPanel;

