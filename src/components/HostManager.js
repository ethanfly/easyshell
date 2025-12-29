import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiServer,
  FiCheck,
  FiLoader,
  FiKey,
  FiEye,
  FiEyeOff,
  FiPlay,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';

const colors = [
  '#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff',
  '#56d4dd', '#ffa657', '#ff7b72', '#d2a8ff', '#76e3ea',
];

function HostManager({ hosts, initialEditHost, onClose, onConnect, onUpdate }) {
  const [isEditing, setIsEditing] = useState(!!initialEditHost);
  const [editingHost, setEditingHost] = useState(initialEditHost || null);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importExportResult, setImportExportResult] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
    groupName: '默认分组',
    color: '#58a6ff',
    description: '',
  });

  // 初始化编辑状态
  useEffect(() => {
    if (initialEditHost) {
      setEditingHost(initialEditHost);
      setIsEditing(true);
    }
  }, [initialEditHost]);

  useEffect(() => {
    if (editingHost) {
      setFormData({
        name: editingHost.name || '',
        host: editingHost.host || '',
        port: editingHost.port || 22,
        username: editingHost.username || '',
        password: editingHost.password || '',
        privateKey: editingHost.private_key || '',
        groupName: editingHost.group_name || '默认分组',
        color: editingHost.color || '#58a6ff',
        description: editingHost.description || '',
      });
    }
  }, [editingHost]);

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 22,
      username: '',
      password: '',
      privateKey: '',
      groupName: '默认分组',
      color: '#58a6ff',
      description: '',
    });
    setEditingHost(null);
    setIsEditing(false);
    setTestResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!window.electronAPI) return;

    try {
      if (editingHost) {
        await window.electronAPI.hosts.update(editingHost.id, formData);
      } else {
        await window.electronAPI.hosts.add(formData);
      }
      onUpdate();
      resetForm();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.electronAPI) return;
    if (window.confirm('确定要删除这个主机吗？')) {
      await window.electronAPI.hosts.delete(id);
      onUpdate();
    }
  };

  const handleTest = async () => {
    if (!window.electronAPI) return;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await window.electronAPI.ssh.test({
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        privateKey: formData.privateKey,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  // 导出主机
  const handleExport = async () => {
    if (!window.electronAPI) return;

    setExporting(true);
    setImportExportResult(null);

    try {
      const result = await window.electronAPI.hosts.export();
      if (result.canceled) {
        setImportExportResult(null);
      } else if (result.success) {
        setImportExportResult({
          type: 'success',
          message: `成功导出 ${result.count} 个主机配置`
        });
      } else {
        setImportExportResult({
          type: 'error',
          message: result.error || '导出失败'
        });
      }
    } catch (error) {
      setImportExportResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setExporting(false);
    }
  };

  // 导入主机
  const handleImport = async (mode = 'merge') => {
    if (!window.electronAPI) return;

    setImporting(true);
    setImportExportResult(null);

    try {
      const result = await window.electronAPI.hosts.import(mode);
      if (result.canceled) {
        setImportExportResult(null);
      } else if (result.success) {
        let message = `导入完成：新增 ${result.imported} 个`;
        if (result.updated > 0) message += `，更新 ${result.updated} 个`;
        if (result.skipped > 0) message += `，跳过 ${result.skipped} 个`;
        
        setImportExportResult({
          type: 'success',
          message
        });
        onUpdate(); // 刷新列表
      } else {
        setImportExportResult({
          type: 'error',
          message: result.error || '导入失败'
        });
      }
    } catch (error) {
      setImportExportResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-shell-surface border border-shell-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-shell-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-shell-text font-display">主机管理</h2>
            {isEditing && (
              <span className="px-2 py-0.5 bg-shell-accent/20 border border-shell-accent/30 
                               rounded text-xs text-shell-accent font-medium">
                {editingHost?.id ? '编辑中' : '新建'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 导入按钮 */}
            <div className="relative group">
              <button
                onClick={() => handleImport('merge')}
                disabled={importing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-shell-card border border-shell-border 
                           rounded-lg text-sm text-shell-text-dim hover:text-shell-text 
                           hover:border-shell-accent/30 disabled:opacity-50 transition-all"
                title="导入主机配置"
              >
                {importing ? (
                  <FiLoader className="animate-spin" size={14} />
                ) : (
                  <FiUpload size={14} />
                )}
                <span>导入</span>
              </button>
              {/* 下拉菜单 */}
              <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-shell-surface border border-shell-border 
                              rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                              transition-all z-10">
                <button
                  onClick={() => handleImport('merge')}
                  className="w-full px-3 py-2 text-left text-sm text-shell-text-dim hover:text-shell-text 
                             hover:bg-shell-card transition-colors"
                >
                  合并导入
                  <span className="block text-xs text-shell-text-dim/60">保留现有，更新重复</span>
                </button>
                <button
                  onClick={() => handleImport('replace')}
                  className="w-full px-3 py-2 text-left text-sm text-shell-text-dim hover:text-shell-text 
                             hover:bg-shell-card transition-colors"
                >
                  替换导入
                  <span className="block text-xs text-shell-text-dim/60">清空现有，全部替换</span>
                </button>
              </div>
            </div>
            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              disabled={exporting || hosts.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-shell-card border border-shell-border 
                         rounded-lg text-sm text-shell-text-dim hover:text-shell-text 
                         hover:border-shell-accent/30 disabled:opacity-50 transition-all"
              title="导出主机配置"
            >
              {exporting ? (
                <FiLoader className="animate-spin" size={14} />
              ) : (
                <FiDownload size={14} />
              )}
              <span>导出</span>
            </button>
            <div className="w-px h-6 bg-shell-border mx-1" />
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        {/* 导入导出结果提示 */}
        {importExportResult && (
          <div className={`mx-6 mt-4 p-3 rounded-lg border ${
            importExportResult.type === 'success'
              ? 'bg-shell-success/10 border-shell-success/30 text-shell-success'
              : 'bg-shell-error/10 border-shell-error/30 text-shell-error'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {importExportResult.type === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
                <span className="text-sm">{importExportResult.message}</span>
              </div>
              <button 
                onClick={() => setImportExportResult(null)}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <FiX size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex h-[calc(85vh-130px)]">
          {/* 主机列表 */}
          <div className="w-80 border-r border-shell-border overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <button
                onClick={() => {
                  resetForm();
                  setIsEditing(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 
                           bg-shell-accent/20 border border-shell-accent/30 rounded-lg
                           text-shell-accent hover:bg-shell-accent/30 transition-all btn-glow"
              >
                <FiPlus size={18} />
                <span>添加新主机</span>
              </button>
            </div>

            <div className="px-4 pb-4 space-y-2">
              {hosts.map((host) => {
                const isSelected = editingHost?.id === host.id;
                return (
                  <div
                    key={host.id}
                    onClick={() => {
                      setEditingHost(host);
                      setIsEditing(true);
                      setTestResult(null);
                    }}
                    className={`group p-3 rounded-lg border transition-all cursor-pointer
                      ${isSelected 
                        ? 'bg-shell-accent/10 border-shell-accent/50' 
                        : 'bg-shell-card/50 border-shell-border hover:border-shell-accent/30 hover:bg-shell-card'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${host.color}20` }}
                      >
                        <FiServer size={18} style={{ color: host.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-shell-text truncate">
                          {host.name}
                        </div>
                        <div className="text-xs text-shell-text-dim truncate">
                          {host.username}@{host.host}:{host.port}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-shell-border/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnect(host);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 
                                   bg-shell-accent/20 text-shell-accent text-sm 
                                   rounded-md hover:bg-shell-accent/30 transition-colors"
                      >
                        <FiPlay size={12} />
                        连接
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(host.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-shell-error/20 text-shell-text-dim 
                                   hover:text-shell-error transition-colors"
                        title="删除主机"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {hosts.length === 0 && (
                <div className="text-center py-8 text-shell-text-dim">
                  暂无主机，点击上方按钮添加
                </div>
              )}
            </div>
          </div>

          {/* 编辑表单 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium text-shell-text-dim mb-2">
                      名称 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                 text-shell-text placeholder-shell-text-dim/50
                                 focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                      placeholder="生产服务器"
                    />
                  </div>

                  {/* 分组 */}
                  <div>
                    <label className="block text-sm font-medium text-shell-text-dim mb-2">
                      分组
                    </label>
                    <input
                      type="text"
                      value={formData.groupName}
                      onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                 text-shell-text placeholder-shell-text-dim/50
                                 focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                      placeholder="默认分组"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* 主机 */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-shell-text-dim mb-2">
                      主机地址 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                 text-shell-text placeholder-shell-text-dim/50
                                 focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                      placeholder="192.168.1.100 或 example.com"
                    />
                  </div>

                  {/* 端口 */}
                  <div>
                    <label className="block text-sm font-medium text-shell-text-dim mb-2">
                      端口
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
                      className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                                 text-shell-text placeholder-shell-text-dim/50
                                 focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                    />
                  </div>
                </div>

                {/* 用户名 */}
                <div>
                  <label className="block text-sm font-medium text-shell-text-dim mb-2">
                    用户名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                               text-shell-text placeholder-shell-text-dim/50
                               focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                    placeholder="root"
                  />
                </div>

                {/* 密码 */}
                <div>
                  <label className="block text-sm font-medium text-shell-text-dim mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 pr-12 bg-shell-bg border border-shell-border rounded-lg
                                 text-shell-text placeholder-shell-text-dim/50
                                 focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-shell-text-dim 
                                 hover:text-shell-text transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 私钥 */}
                <div>
                  <label className="block text-sm font-medium text-shell-text-dim mb-2">
                    <span className="flex items-center gap-2">
                      <FiKey size={14} />
                      SSH 私钥 (可选)
                    </span>
                  </label>
                  <textarea
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                               text-shell-text placeholder-shell-text-dim/50 font-mono text-sm
                               focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 resize-none"
                    placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                  />
                </div>

                {/* 颜色选择 */}
                <div>
                  <label className="block text-sm font-medium text-shell-text-dim mb-2">
                    标识颜色
                  </label>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color 
                            ? 'ring-2 ring-offset-2 ring-offset-shell-surface ring-white/50 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-shell-text-dim mb-2">
                    备注说明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-shell-bg border border-shell-border rounded-lg
                               text-shell-text placeholder-shell-text-dim/50
                               focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 resize-none"
                    placeholder="关于这台服务器的备注..."
                  />
                </div>

                {/* 测试结果 */}
                {testResult && (
                  <div
                    className={`p-4 rounded-lg border ${
                      testResult.success
                        ? 'bg-shell-success/10 border-shell-success/30 text-shell-success'
                        : 'bg-shell-error/10 border-shell-error/30 text-shell-error'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? <FiCheck size={18} /> : <FiX size={18} />}
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-4 border-t border-shell-border">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing || !formData.host || !formData.username}
                    className="flex items-center gap-2 px-4 py-2 bg-shell-card border border-shell-border
                               rounded-lg text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {testing ? (
                      <FiLoader className="animate-spin" size={16} />
                    ) : (
                      <FiCheck size={16} />
                    )}
                    <span>测试连接</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-shell-border rounded-lg text-shell-text-dim
                                 hover:text-shell-text hover:bg-shell-card transition-all"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-shell-accent rounded-lg text-white font-medium
                                 hover:bg-shell-accent/80 transition-all btn-glow"
                    >
                      {editingHost ? '保存修改' : '添加主机'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-shell-text-dim">
                <div className="text-center">
                  <FiServer className="mx-auto text-5xl mb-4 opacity-30" />
                  <p>选择一个主机进行编辑</p>
                  <p className="text-sm mt-1">或点击"添加新主机"创建</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default HostManager;

