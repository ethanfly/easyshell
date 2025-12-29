import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiX,
  FiServer,
  FiCheck,
  FiLoader,
  FiKey,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiPlay,
  FiSave,
} from 'react-icons/fi';
import { getAPI } from '../services/api';

const colors = [
  '#00d4ff', '#3fb950', '#d29922', '#f85149', '#bc8cff',
  '#56d4dd', '#ffa657', '#ff7b72', '#d2a8ff', '#ff2d95',
];

function HostEditPanel({ host, onClose, onConnect, onUpdate, onDelete }) {
  const api = useMemo(() => getAPI(), []);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
    groupName: '默认分组',
    color: '#00d4ff',
    description: '',
  });

  // 当 host 变化时更新表单
  useEffect(() => {
    if (host) {
      setFormData({
        name: host.name || '',
        host: host.host || '',
        port: host.port || 22,
        username: host.username || '',
        password: host.password || '',
        privateKey: host.private_key || '',
        groupName: host.group_name || '默认分组',
        color: host.color || '#00d4ff',
        description: host.description || '',
      });
      setTestResult(null);
    }
  }, [host]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (host?.id) {
        await api.hosts.update(host.id, formData);
      } else {
        await api.hosts.add(formData);
      }
      onUpdate && onUpdate();
      setTestResult({ success: true, message: '保存成功！' });
    } catch (error) {
      console.error('保存失败:', error);
      setTestResult({ success: false, message: '保存失败: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await api.ssh.test({
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

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个主机吗？')) {
      try {
        await api.hosts.delete(host.id);
        onDelete && onDelete();
        onClose && onClose();
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const handleConnect = () => {
    if (host && onConnect) {
      onConnect(host);
    }
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 400, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-shell-surface/95 backdrop-blur-xl border-l border-shell-border flex flex-col overflow-hidden relative"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-shell-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* 头部 */}
      <div className="px-4 py-3 border-b border-shell-border flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${formData.color}20`, border: `1px solid ${formData.color}40` }}
          >
            <FiServer size={18} style={{ color: formData.color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-shell-text font-display tracking-wide">
              {host?.id ? '编辑主机' : '新建主机'}
            </h3>
            <p className="text-xs text-shell-text-dim font-mono">
              {formData.host || 'hostname'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-shell-card text-shell-text-dim hover:text-shell-text transition-colors"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* 快捷操作 */}
      {host?.id && (
        <div className="px-4 py-3 border-b border-shell-border flex gap-2 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 
                       bg-shell-accent/20 border border-shell-accent/40 rounded-lg
                       text-shell-accent hover:bg-shell-accent/30 transition-all text-sm font-medium"
          >
            <FiPlay size={14} />
            连接终端
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDelete}
            className="p-2 rounded-lg bg-shell-error/10 border border-shell-error/30
                       text-shell-error hover:bg-shell-error/20 transition-all"
            title="删除主机"
          >
            <FiTrash2 size={16} />
          </motion.button>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 relative z-10">
        {/* 名称 */}
        <div>
          <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
            名称 *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                       text-shell-text text-sm placeholder-shell-text-dim/50
                       focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all"
            placeholder="生产服务器"
          />
        </div>

        {/* 主机地址和端口 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
              主机地址 *
            </label>
            <input
              type="text"
              required
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                         text-shell-text text-sm font-mono placeholder-shell-text-dim/50
                         focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all"
              placeholder="192.168.1.100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
              端口
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
              className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                         text-shell-text text-sm font-mono placeholder-shell-text-dim/50
                         focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all"
            />
          </div>
        </div>

        {/* 用户名 */}
        <div>
          <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
            用户名 *
          </label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                       text-shell-text text-sm font-mono placeholder-shell-text-dim/50
                       focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all"
            placeholder="root"
          />
        </div>

        {/* 密码 */}
        <div>
          <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
            密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 pr-10 bg-shell-bg border border-shell-border rounded-lg
                         text-shell-text text-sm font-mono placeholder-shell-text-dim/50
                         focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-shell-text-dim 
                         hover:text-shell-text transition-colors"
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        {/* 私钥 */}
        <div>
          <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <FiKey size={12} />
              SSH 私钥 (可选)
            </span>
          </label>
          <textarea
            value={formData.privateKey}
            onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                       text-shell-text text-xs font-mono placeholder-shell-text-dim/50
                       focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all resize-none"
            placeholder="-----BEGIN RSA PRIVATE KEY-----..."
          />
        </div>

        {/* 分组 */}
        <div>
          <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
            分组
          </label>
          <input
            type="text"
            value={formData.groupName}
            onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
            className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                       text-shell-text text-sm placeholder-shell-text-dim/50
                       focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all"
            placeholder="默认分组"
          />
        </div>

        {/* 颜色选择 */}
        <div>
          <label className="block text-xs font-medium text-shell-text-dim mb-2 uppercase tracking-wider">
            标识颜色
          </label>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-7 h-7 rounded-lg transition-all ${
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
          <label className="block text-xs font-medium text-shell-text-dim mb-1.5 uppercase tracking-wider">
            备注说明
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-shell-bg border border-shell-border rounded-lg
                       text-shell-text text-sm placeholder-shell-text-dim/50
                       focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50 transition-all resize-none"
            placeholder="关于这台服务器的备注..."
          />
        </div>

        {/* 测试结果 */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg border text-sm ${
              testResult.success
                ? 'bg-shell-success/10 border-shell-success/30 text-shell-success'
                : 'bg-shell-error/10 border-shell-error/30 text-shell-error'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? <FiCheck size={16} /> : <FiX size={16} />}
              <span>{testResult.message}</span>
            </div>
          </motion.div>
        )}
      </form>

      {/* 底部按钮 */}
      <div className="px-4 py-3 border-t border-shell-border flex items-center gap-2 relative z-10">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTest}
          disabled={testing || !formData.host || !formData.username}
          className="flex items-center gap-2 px-3 py-2 bg-shell-card border border-shell-border
                     rounded-lg text-shell-text-dim hover:text-shell-text hover:border-shell-accent/30
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
        >
          {testing ? (
            <FiLoader className="animate-spin" size={14} />
          ) : (
            <FiCheck size={14} />
          )}
          测试
        </motion.button>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={saving || !formData.name || !formData.host || !formData.username}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                     bg-shell-accent rounded-lg text-white font-medium text-sm
                     hover:bg-shell-accent/80 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
        >
          {saving ? (
            <FiLoader className="animate-spin" size={14} />
          ) : (
            <FiSave size={14} />
          )}
          {host?.id ? '保存修改' : '创建主机'}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default HostEditPanel;

