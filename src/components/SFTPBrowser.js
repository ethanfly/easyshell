import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFolder, FiFile, FiArrowLeft, FiRefreshCw, FiUpload, FiDownload,
  FiTrash2, FiEdit2, FiPlus, FiX, FiCheck, FiHome, FiChevronRight,
  FiFileText, FiImage, FiCode, FiArchive, FiFilm, FiMusic, FiSearch,
  FiCopy, FiClipboard, FiEye, FiFolderPlus, FiShield
} from 'react-icons/fi';

// 文件图标映射
const getFileIcon = (filename, isDirectory) => {
  if (isDirectory) return FiFolder;
  
  const ext = filename.split('.').pop()?.toLowerCase();
  const iconMap = {
    // 文本文件
    txt: FiFileText, md: FiFileText, log: FiFileText,
    // 代码文件
    js: FiCode, ts: FiCode, jsx: FiCode, tsx: FiCode,
    py: FiCode, java: FiCode, c: FiCode, cpp: FiCode,
    h: FiCode, css: FiCode, html: FiCode, json: FiCode,
    xml: FiCode, yml: FiCode, yaml: FiCode, sh: FiCode,
    // 图片
    jpg: FiImage, jpeg: FiImage, png: FiImage, gif: FiImage,
    svg: FiImage, webp: FiImage, ico: FiImage,
    // 压缩包
    zip: FiArchive, tar: FiArchive, gz: FiArchive, rar: FiArchive,
    '7z': FiArchive, bz2: FiArchive,
    // 视频
    mp4: FiFilm, avi: FiFilm, mkv: FiFilm, mov: FiFilm,
    // 音频
    mp3: FiMusic, wav: FiMusic, flac: FiMusic, ogg: FiMusic,
  };
  
  return iconMap[ext] || FiFile;
};

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时间
const formatTime = (mtime) => {
  if (!mtime) return '-';
  const date = new Date(mtime * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 右键菜单组件
function ContextMenu({ x, y, file, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 调整菜单位置避免超出屏幕
  const menuStyle = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000,
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
        ${danger 
          ? 'text-shell-error hover:bg-shell-error/10' 
          : 'text-shell-text hover:bg-shell-card'
        }`}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );

  const Divider = () => <div className="h-px bg-shell-border my-1" />;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      style={menuStyle}
      className="bg-shell-surface border border-shell-border rounded-lg shadow-xl py-1 min-w-[180px] overflow-hidden"
    >
      {file ? (
        <>
          {file.attrs.isDirectory ? (
            <>
              <MenuItem 
                icon={FiFolder} 
                label="打开目录" 
                onClick={() => onAction('open', file)} 
              />
              <Divider />
            </>
          ) : (
            <>
              <MenuItem 
                icon={FiDownload} 
                label="下载文件" 
                onClick={() => onAction('download', file)} 
              />
              <MenuItem 
                icon={FiEye} 
                label="预览文件" 
                onClick={() => onAction('preview', file)} 
              />
              <Divider />
            </>
          )}
          <MenuItem 
            icon={FiCopy} 
            label="复制路径" 
            onClick={() => onAction('copyPath', file)} 
          />
          <MenuItem 
            icon={FiEdit2} 
            label="重命名" 
            onClick={() => onAction('rename', file)} 
          />
          <MenuItem 
            icon={FiShield} 
            label="修改权限" 
            onClick={() => onAction('chmod', file)} 
          />
          <Divider />
          <MenuItem 
            icon={FiTrash2} 
            label={file.attrs.isDirectory ? "删除目录" : "删除文件"}
            onClick={() => onAction('delete', file)} 
            danger
          />
        </>
      ) : (
        <>
          <MenuItem 
            icon={FiFolderPlus} 
            label="新建文件夹" 
            onClick={() => onAction('newFolder')} 
          />
          <MenuItem 
            icon={FiPlus} 
            label="新建文件" 
            onClick={() => onAction('newFile')} 
          />
          <Divider />
          <MenuItem 
            icon={FiUpload} 
            label="上传文件" 
            onClick={() => onAction('upload')} 
          />
          <MenuItem 
            icon={FiClipboard} 
            label="粘贴路径" 
            onClick={() => onAction('paste')} 
          />
          <Divider />
          <MenuItem 
            icon={FiRefreshCw} 
            label="刷新" 
            onClick={() => onAction('refresh')} 
          />
        </>
      )}
    </motion.div>
  );
}

// 文件预览组件
function FilePreview({ content, filename, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-[80%] max-w-4xl max-h-[80%] bg-shell-surface border border-shell-border rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-10 px-4 flex items-center justify-between border-b border-shell-border">
          <span className="text-shell-text font-medium text-sm">{filename}</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[calc(80vh-40px)] overflow-auto custom-scrollbar">
          <pre className="text-shell-text text-sm font-mono whitespace-pre-wrap break-all">
            {content}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 权限修改组件
function ChmodModal({ file, currentMode, onClose, onSubmit }) {
  // 解析当前权限 (mode & 0o777 获取权限位)
  const permBits = currentMode & 0o777;
  
  const [owner, setOwner] = useState({
    read: (permBits & 0o400) !== 0,
    write: (permBits & 0o200) !== 0,
    execute: (permBits & 0o100) !== 0,
  });
  const [group, setGroup] = useState({
    read: (permBits & 0o040) !== 0,
    write: (permBits & 0o020) !== 0,
    execute: (permBits & 0o010) !== 0,
  });
  const [others, setOthers] = useState({
    read: (permBits & 0o004) !== 0,
    write: (permBits & 0o002) !== 0,
    execute: (permBits & 0o001) !== 0,
  });
  const [octalInput, setOctalInput] = useState(permBits.toString(8).padStart(3, '0'));

  // 计算八进制权限值
  const calculateOctal = () => {
    let mode = 0;
    if (owner.read) mode += 0o400;
    if (owner.write) mode += 0o200;
    if (owner.execute) mode += 0o100;
    if (group.read) mode += 0o040;
    if (group.write) mode += 0o020;
    if (group.execute) mode += 0o010;
    if (others.read) mode += 0o004;
    if (others.write) mode += 0o002;
    if (others.execute) mode += 0o001;
    return mode;
  };

  // 同步八进制输入到复选框
  useEffect(() => {
    const mode = calculateOctal();
    setOctalInput(mode.toString(8).padStart(3, '0'));
  }, [owner, group, others]);

  // 从八进制输入更新复选框
  const handleOctalChange = (value) => {
    setOctalInput(value);
    const num = parseInt(value, 8);
    if (!isNaN(num) && num >= 0 && num <= 0o777) {
      setOwner({
        read: (num & 0o400) !== 0,
        write: (num & 0o200) !== 0,
        execute: (num & 0o100) !== 0,
      });
      setGroup({
        read: (num & 0o040) !== 0,
        write: (num & 0o020) !== 0,
        execute: (num & 0o010) !== 0,
      });
      setOthers({
        read: (num & 0o004) !== 0,
        write: (num & 0o002) !== 0,
        execute: (num & 0o001) !== 0,
      });
    }
  };

  const handleSubmit = () => {
    const mode = calculateOctal();
    onSubmit(mode);
  };

  const PermRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2 border-b border-shell-border/30">
      <span className="text-shell-text text-sm font-medium w-20">{label}</span>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.read}
            onChange={(e) => onChange({ ...value, read: e.target.checked })}
            className="w-4 h-4 rounded border-shell-border"
          />
          <span className="text-shell-text-dim text-sm">读取 (r)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.write}
            onChange={(e) => onChange({ ...value, write: e.target.checked })}
            className="w-4 h-4 rounded border-shell-border"
          />
          <span className="text-shell-text-dim text-sm">写入 (w)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.execute}
            onChange={(e) => onChange({ ...value, execute: e.target.checked })}
            className="w-4 h-4 rounded border-shell-border"
          />
          <span className="text-shell-text-dim text-sm">执行 (x)</span>
        </label>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[450px] bg-shell-surface border border-shell-border rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-shell-border">
          <div className="flex items-center gap-2">
            <FiShield size={18} className="text-shell-accent" />
            <span className="text-shell-text font-semibold">修改权限</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4">
          {/* 文件名 */}
          <div className="mb-4 p-3 bg-shell-card/50 rounded-lg border border-shell-border">
            <div className="flex items-center gap-2">
              {file.attrs.isDirectory ? (
                <FiFolder size={16} className="text-shell-accent" />
              ) : (
                <FiFile size={16} className="text-shell-text-dim" />
              )}
              <span className="text-shell-text text-sm font-mono">{file.filename}</span>
            </div>
          </div>

          {/* 权限设置 */}
          <div className="space-y-1">
            <PermRow label="所有者" value={owner} onChange={setOwner} />
            <PermRow label="用户组" value={group} onChange={setGroup} />
            <PermRow label="其他人" value={others} onChange={setOthers} />
          </div>

          {/* 八进制输入 */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-shell-text-dim text-sm">八进制:</span>
            <input
              type="text"
              value={octalInput}
              onChange={(e) => handleOctalChange(e.target.value)}
              maxLength={3}
              className="w-20 px-3 py-1.5 bg-shell-bg border border-shell-border rounded
                         text-shell-text text-center font-mono
                         focus:border-shell-accent focus:outline-none"
            />
            <span className="text-shell-text-dim text-xs">
              (例如: 755, 644)
            </span>
          </div>

          {/* 权限预览 */}
          <div className="mt-4 p-3 bg-shell-bg rounded-lg border border-shell-border">
            <div className="text-xs text-shell-text-dim mb-1">权限字符串:</div>
            <code className="text-shell-accent font-mono">
              {file.attrs.isDirectory ? 'd' : '-'}
              {owner.read ? 'r' : '-'}{owner.write ? 'w' : '-'}{owner.execute ? 'x' : '-'}
              {group.read ? 'r' : '-'}{group.write ? 'w' : '-'}{group.execute ? 'x' : '-'}
              {others.read ? 'r' : '-'}{others.write ? 'w' : '-'}{others.execute ? 'x' : '-'}
            </code>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-4 py-3 border-t border-shell-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-shell-border text-shell-text-dim
                       hover:text-shell-text hover:bg-shell-card transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-shell-accent text-white
                       hover:bg-shell-accent/80 transition-colors text-sm font-medium"
          >
            应用权限
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SFTPBrowser({ hostId, isConnected, onClose }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [sortBy, setSortBy] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [creating, setCreating] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [transferProgress, setTransferProgress] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [chmodFile, setChmodFile] = useState(null); // 权限修改的文件
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const [hostInfo, setHostInfo] = useState(null);

  // 加载主机信息
  useEffect(() => {
    const loadHostInfo = async () => {
      if (!hostId) return;
      try {
        const host = await window.electronAPI.hosts.getById(hostId);
        setHostInfo(host);
      } catch (err) {
        console.error('加载主机信息失败:', err);
      }
    };
    loadHostInfo();
  }, [hostId]);

  // 获取主机配置
  const getHostConfig = useCallback(() => {
    if (!hostInfo) return null;
    return {
      host: hostInfo.host,
      port: hostInfo.port || 22,
      username: hostInfo.username,
      password: hostInfo.password,
      privateKey: hostInfo.private_key,
    };
  }, [hostInfo]);

  // 加载目录
  const loadDirectory = useCallback(async (path) => {
    const config = getHostConfig();
    if (!config || !isConnected) return;

    setLoading(true);
    setError(null);
    setSelectedFiles(new Set());
    setContextMenu(null);

    try {
      const result = await window.electronAPI.sftp.list(config, path);
      if (result.success) {
        setFiles(result.files || []);
        setCurrentPath(path);
      } else {
        setError(result.error || '加载目录失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getHostConfig, isConnected]);

  // 初始加载
  useEffect(() => {
    if (hostInfo && isConnected) {
      loadDirectory('/');
    }
  }, [hostInfo, isConnected, loadDirectory]);

  // 监听传输进度
  useEffect(() => {
    if (!window.electronAPI?.sftp?.onProgress) return;
    
    const removeListener = window.electronAPI.sftp.onProgress((progress) => {
      setTransferProgress(progress);
      if (progress.percent >= 100) {
        setTimeout(() => setTransferProgress(null), 1000);
      }
    });

    return () => removeListener?.();
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape 关闭菜单或清空搜索
      if (e.key === 'Escape') {
        setContextMenu(null);
        if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // 过滤和排序文件
  const filteredAndSortedFiles = [...files]
    .filter(f => showHidden || !f.filename.startsWith('.'))
    .filter(f => {
      if (!searchQuery.trim()) return true;
      return f.filename.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // 目录永远在前
      if (a.attrs.isDirectory && !b.attrs.isDirectory) return -1;
      if (!a.attrs.isDirectory && b.attrs.isDirectory) return 1;

      let cmp = 0;
      switch (sortBy) {
        case 'size':
          cmp = (a.attrs.size || 0) - (b.attrs.size || 0);
          break;
        case 'time':
          cmp = (a.attrs.mtime || 0) - (b.attrs.mtime || 0);
          break;
        default:
          cmp = a.filename.localeCompare(b.filename);
      }
      return sortDesc ? -cmp : cmp;
    });

  // 进入目录
  const enterDirectory = (dirname) => {
    const newPath = currentPath === '/' 
      ? `/${dirname}` 
      : `${currentPath}/${dirname}`;
    loadDirectory(newPath);
    setSearchQuery('');
  };

  // 返回上级目录
  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    loadDirectory('/' + parts.join('/') || '/');
  };

  // 回到根目录
  const goHome = () => {
    loadDirectory('/');
  };

  // 路径导航
  const pathParts = currentPath.split('/').filter(Boolean);

  // 选择文件
  const toggleSelect = (filename, e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  };

  // 获取完整路径
  const getFullPath = (filename) => {
    return currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
  };

  // 下载文件
  const handleDownload = async (filename) => {
    const config = getHostConfig();
    if (!config) return;

    try {
      const result = await window.electronAPI.sftp.download(config, getFullPath(filename));
      if (!result.success && result.error !== '用户取消') {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 上传文件
  const handleUpload = async (e) => {
    const config = getHostConfig();
    if (!config || !e.target.files?.length) return;

    const file = e.target.files[0];
    const remotePath = getFullPath(file.name);

    try {
      const result = await window.electronAPI.sftp.upload(config, file.path, remotePath);
      if (result.success) {
        loadDirectory(currentPath);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    e.target.value = '';
  };

  // 删除文件/目录
  const handleDelete = async (filename, isDirectory) => {
    const config = getHostConfig();
    if (!config) return;

    if (!window.confirm(`确定要删除 "${filename}" 吗？${isDirectory ? '\n警告：这将删除目录中的所有内容！' : ''}`)) {
      return;
    }

    try {
      const result = isDirectory
        ? await window.electronAPI.sftp.rmdir(config, getFullPath(filename))
        : await window.electronAPI.sftp.delete(config, getFullPath(filename));
      
      if (result.success) {
        loadDirectory(currentPath);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 重命名
  const handleRename = async () => {
    if (!renaming || !renaming.newName.trim()) {
      setRenaming(null);
      return;
    }

    const config = getHostConfig();
    if (!config) return;

    const oldPath = getFullPath(renaming.filename);
    const newPath = getFullPath(renaming.newName);

    try {
      const result = await window.electronAPI.sftp.rename(config, oldPath, newPath);
      if (result.success) {
        loadDirectory(currentPath);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setRenaming(null);
  };

  // 创建文件/目录
  const handleCreate = async () => {
    if (!creating || !newItemName.trim()) {
      setCreating(null);
      setNewItemName('');
      return;
    }

    const config = getHostConfig();
    if (!config) return;

    const remotePath = getFullPath(newItemName);

    try {
      const result = creating === 'folder'
        ? await window.electronAPI.sftp.mkdir(config, remotePath)
        : await window.electronAPI.sftp.writeFile(config, remotePath, '');
      
      if (result.success) {
        loadDirectory(currentPath);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setCreating(null);
    setNewItemName('');
  };

  // 复制路径到剪贴板
  const copyPathToClipboard = (filename) => {
    const fullPath = getFullPath(filename);
    navigator.clipboard.writeText(fullPath);
  };

  // 预览文件
  const handlePreview = async (filename) => {
    const config = getHostConfig();
    if (!config) return;

    try {
      const result = await window.electronAPI.sftp.readFile(config, getFullPath(filename));
      if (result.success) {
        setPreviewContent({ content: result.content, filename });
      } else {
        setError(result.error || '无法预览此文件');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 修改权限
  const handleChmod = async (mode) => {
    if (!chmodFile) return;
    
    const config = getHostConfig();
    if (!config) return;

    try {
      const result = await window.electronAPI.sftp.chmod(config, getFullPath(chmodFile.filename), mode);
      if (result.success) {
        loadDirectory(currentPath);
        setChmodFile(null);
      } else {
        setError(result.error || '修改权限失败');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (e, file = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  // 处理右键菜单动作
  const handleContextAction = (action, file) => {
    switch (action) {
      case 'open':
        enterDirectory(file.filename);
        break;
      case 'download':
        handleDownload(file.filename);
        break;
      case 'preview':
        handlePreview(file.filename);
        break;
      case 'copyPath':
        copyPathToClipboard(file.filename);
        break;
      case 'rename':
        setRenaming({ filename: file.filename, newName: file.filename });
        break;
      case 'delete':
        handleDelete(file.filename, file.attrs.isDirectory);
        break;
      case 'chmod':
        setChmodFile(file);
        break;
      case 'newFolder':
        setCreating('folder');
        break;
      case 'newFile':
        setCreating('file');
        break;
      case 'upload':
        fileInputRef.current?.click();
        break;
      case 'refresh':
        loadDirectory(currentPath);
        break;
      case 'paste':
        navigator.clipboard.readText().then(text => {
          if (text) {
            // 可以用于跳转到路径
            loadDirectory(text);
          }
        }).catch(() => {});
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* 遮罩 */}
      <div 
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板 */}
      <div 
        className="w-[700px] bg-shell-surface border-l border-shell-border flex flex-col"
        onContextMenu={(e) => handleContextMenu(e, null)}
      >
        {/* 头部 */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-shell-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiFolder size={18} className="text-shell-accent" />
            <span className="text-shell-text font-semibold">SFTP 文件管理器</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-4 py-2 border-b border-shell-border flex-shrink-0">
          <div className="relative">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-shell-text-dim" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件... (Ctrl+F)"
              className="w-full pl-10 pr-8 py-2 bg-shell-card border border-shell-border rounded-lg
                         text-shell-text text-sm placeholder:text-shell-text-dim
                         focus:border-shell-accent focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded
                           text-shell-text-dim hover:text-shell-text transition-colors"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 工具栏 */}
        <div className="px-4 py-2 border-b border-shell-border flex items-center gap-2 flex-shrink-0">
          <button
            onClick={goHome}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            title="根目录"
          >
            <FiHome size={16} />
          </button>
          <button
            onClick={goUp}
            disabled={currentPath === '/'}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text 
                       transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="上级目录"
          >
            <FiArrowLeft size={16} />
          </button>
          <button
            onClick={() => loadDirectory(currentPath)}
            disabled={loading}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            title="刷新"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="h-5 w-px bg-shell-border mx-1" />

          <button
            onClick={() => setCreating('folder')}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            title="新建文件夹"
          >
            <FiFolderPlus size={16} />
          </button>
          <button
            onClick={() => setCreating('file')}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            title="新建文件"
          >
            <FiPlus size={16} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            title="上传文件"
          >
            <FiUpload size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />

          <div className="flex-1" />

          <label className="flex items-center gap-2 text-xs text-shell-text-dim cursor-pointer">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="w-3 h-3"
            />
            显示隐藏文件
          </label>
        </div>

        {/* 路径导航 */}
        <div className="px-4 py-2 border-b border-shell-border flex items-center gap-1 overflow-x-auto custom-scrollbar flex-shrink-0">
          <button
            onClick={goHome}
            className="text-shell-accent hover:underline text-sm font-mono"
          >
            /
          </button>
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              <FiChevronRight size={12} className="text-shell-text-dim flex-shrink-0" />
              <button
                onClick={() => {
                  const path = '/' + pathParts.slice(0, i + 1).join('/');
                  loadDirectory(path);
                }}
                className="text-shell-text hover:text-shell-accent text-sm font-mono truncate max-w-[150px]"
                title={part}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 搜索结果提示 */}
        {searchQuery && (
          <div className="px-4 py-1.5 bg-shell-accent/10 border-b border-shell-accent/30 text-sm text-shell-accent">
            找到 {filteredAndSortedFiles.length} 个匹配项
          </div>
        )}

        {/* 传输进度 */}
        <AnimatePresence>
          {transferProgress && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-shell-accent/10 border-b border-shell-accent/30"
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-shell-accent truncate flex-1 mr-2">
                  {transferProgress.type === 'upload' ? '⬆️' : '⬇️'} {transferProgress.filename}
                </span>
                <span className="text-shell-text-dim">
                  {transferProgress.percent}%
                </span>
              </div>
              <div className="h-1.5 bg-shell-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-shell-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${transferProgress.percent}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-shell-error/10 border-b border-shell-error/30 flex items-center justify-between"
            >
              <span className="text-shell-error text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-shell-error hover:text-shell-error/70"
              >
                <FiX size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 新建项目输入 */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 border-b border-shell-border bg-shell-card/50"
            >
              <div className="flex items-center gap-2">
                {creating === 'folder' ? (
                  <FiFolder size={16} className="text-shell-accent" />
                ) : (
                  <FiFile size={16} className="text-shell-text-dim" />
                )}
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setCreating(null);
                      setNewItemName('');
                    }
                  }}
                  placeholder={`输入${creating === 'folder' ? '文件夹' : '文件'}名称...`}
                  className="flex-1 bg-shell-surface border border-shell-border rounded px-2 py-1 
                             text-shell-text text-sm focus:border-shell-accent"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  className="p-1.5 rounded bg-shell-accent/20 text-shell-accent hover:bg-shell-accent/30"
                >
                  <FiCheck size={14} />
                </button>
                <button
                  onClick={() => {
                    setCreating(null);
                    setNewItemName('');
                  }}
                  className="p-1.5 rounded hover:bg-shell-card text-shell-text-dim"
                >
                  <FiX size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 文件列表 */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar"
          onContextMenu={(e) => handleContextMenu(e, null)}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-shell-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full text-shell-text-dim">
              {searchQuery ? '没有找到匹配的文件' : '空目录'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-shell-surface border-b border-shell-border">
                <tr className="text-left text-shell-text-dim">
                  <th className="px-4 py-2 font-medium w-8"></th>
                  <th 
                    className="px-4 py-2 font-medium cursor-pointer hover:text-shell-text"
                    onClick={() => {
                      if (sortBy === 'name') setSortDesc(!sortDesc);
                      else { setSortBy('name'); setSortDesc(false); }
                    }}
                  >
                    名称 {sortBy === 'name' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-4 py-2 font-medium cursor-pointer hover:text-shell-text w-24 text-right"
                    onClick={() => {
                      if (sortBy === 'size') setSortDesc(!sortDesc);
                      else { setSortBy('size'); setSortDesc(false); }
                    }}
                  >
                    大小 {sortBy === 'size' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-4 py-2 font-medium cursor-pointer hover:text-shell-text w-40"
                    onClick={() => {
                      if (sortBy === 'time') setSortDesc(!sortDesc);
                      else { setSortBy('time'); setSortDesc(false); }
                    }}
                  >
                    修改时间 {sortBy === 'time' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2 font-medium w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedFiles.map((file) => {
                  const Icon = getFileIcon(file.filename, file.attrs.isDirectory);
                  const isRenaming = renaming?.filename === file.filename;

                  return (
                    <tr
                      key={file.filename}
                      className={`
                        border-b border-shell-border/30 hover:bg-shell-card/50 transition-colors cursor-default
                        ${selectedFiles.has(file.filename) ? 'bg-shell-accent/10' : ''}
                      `}
                      onDoubleClick={() => {
                        if (file.attrs.isDirectory) {
                          enterDirectory(file.filename);
                        } else {
                          handlePreview(file.filename);
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.filename)}
                          onChange={(e) => toggleSelect(file.filename, e)}
                          className="w-3.5 h-3.5"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Icon 
                            size={16} 
                            className={file.attrs.isDirectory ? 'text-shell-accent' : 'text-shell-text-dim'} 
                          />
                          {isRenaming ? (
                            <input
                              type="text"
                              value={renaming.newName}
                              onChange={(e) => setRenaming({ ...renaming, newName: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') setRenaming(null);
                              }}
                              onBlur={handleRename}
                              className="flex-1 bg-shell-surface border border-shell-accent rounded px-1 py-0.5 
                                         text-shell-text text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span 
                              className={`truncate ${
                                file.attrs.isDirectory 
                                  ? 'text-shell-accent cursor-pointer hover:underline' 
                                  : 'text-shell-text'
                              }`}
                              onClick={() => {
                                if (file.attrs.isDirectory) {
                                  enterDirectory(file.filename);
                                }
                              }}
                            >
                              {file.filename}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-shell-text-dim text-right font-mono">
                        {file.attrs.isDirectory ? '-' : formatSize(file.attrs.size || 0)}
                      </td>
                      <td className="px-4 py-2 text-shell-text-dim font-mono text-xs">
                        {formatTime(file.attrs.mtime)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          {!file.attrs.isDirectory && (
                            <>
                              <button
                                onClick={() => handlePreview(file.filename)}
                                className="p-1 rounded hover:bg-shell-card text-shell-text-dim 
                                           hover:text-shell-text transition-colors"
                                title="预览"
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                onClick={() => handleDownload(file.filename)}
                                className="p-1 rounded hover:bg-shell-accent/20 text-shell-text-dim 
                                           hover:text-shell-accent transition-colors"
                                title="下载"
                              >
                                <FiDownload size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setRenaming({ filename: file.filename, newName: file.filename })}
                            className="p-1 rounded hover:bg-shell-card text-shell-text-dim 
                                       hover:text-shell-text transition-colors"
                            title="重命名"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(file.filename, file.attrs.isDirectory)}
                            className="p-1 rounded hover:bg-shell-error/20 text-shell-text-dim 
                                       hover:text-shell-error transition-colors"
                            title="删除"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="h-8 px-4 flex items-center justify-between border-t border-shell-border 
                        text-xs text-shell-text-dim flex-shrink-0">
          <span>
            {filteredAndSortedFiles.length} 个项目
            {searchQuery && ` (共 ${files.filter(f => showHidden || !f.filename.startsWith('.')).length} 个)`}
          </span>
          {selectedFiles.size > 0 && (
            <span>已选择 {selectedFiles.size} 项</span>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            file={contextMenu.file}
            onClose={() => setContextMenu(null)}
            onAction={handleContextAction}
          />
        )}
      </AnimatePresence>

      {/* 文件预览 */}
      <AnimatePresence>
        {previewContent && (
          <FilePreview
            content={previewContent.content}
            filename={previewContent.filename}
            onClose={() => setPreviewContent(null)}
          />
        )}
      </AnimatePresence>

      {/* 权限修改 */}
      <AnimatePresence>
        {chmodFile && (
          <ChmodModal
            file={chmodFile}
            currentMode={chmodFile.attrs.mode}
            onClose={() => setChmodFile(null)}
            onSubmit={handleChmod}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SFTPBrowser;
