import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiCommand, FiClock, FiTag } from 'react-icons/fi';

function CommandPalette({ onClose, onSelectCommand }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [commands, setCommands] = useState([]);
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 加载命令列表
  useEffect(() => {
    const loadCommands = async () => {
      if (window.electronAPI) {
        const allCommands = await window.electronAPI.commands.getAll();
        setCommands(allCommands);
        setFilteredCommands(allCommands.slice(0, 15));
      }
    };
    loadCommands();
    inputRef.current?.focus();
  }, []);

  // 搜索命令
  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim()) {
        if (window.electronAPI) {
          const results = await window.electronAPI.commands.search(searchTerm);
          setFilteredCommands(results);
        }
      } else {
        setFilteredCommands(commands.slice(0, 15));
      }
      setSelectedIndex(0);
    };
    search();
  }, [searchTerm, commands]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelect(filteredCommands[selectedIndex]);
          } else if (searchTerm.trim()) {
            // 如果没有匹配项，直接发送输入的命令
            onSelectCommand(searchTerm.trim());
          }
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, searchTerm, onClose, onSelectCommand]);

  // 滚动到选中项
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = async (command) => {
    if (window.electronAPI && command.id) {
      await window.electronAPI.commands.incrementUsage(command.id);
    }
    onSelectCommand(command.command);
  };

  // 按分类分组命令
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || '通用';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-[15vh]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        className="command-hint w-full max-w-2xl rounded-xl overflow-hidden"
      >
        {/* 搜索框 */}
        <div className="p-4 border-b border-shell-border">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-shell-text-dim" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-shell-bg border border-shell-border rounded-lg
                         text-shell-text placeholder-shell-text-dim text-lg
                         focus:border-shell-accent focus:ring-1 focus:ring-shell-accent/50"
              placeholder="搜索命令或直接输入..."
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-shell-text-dim">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-shell-card rounded border border-shell-border">↑↓</kbd>
              导航
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-shell-card rounded border border-shell-border">Enter</kbd>
              执行
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-shell-card rounded border border-shell-border">Esc</kbd>
              关闭
            </span>
          </div>
        </div>

        {/* 命令列表 */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar">
          {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-medium text-shell-text-dim uppercase tracking-wider bg-shell-bg/50 sticky top-0">
                <span className="flex items-center gap-2">
                  <FiTag size={12} />
                  {category}
                </span>
              </div>
              {categoryCommands.map((cmd) => {
                const currentIndex = flatIndex++;
                return (
                  <div
                    key={cmd.id || cmd.command}
                    onClick={() => handleSelect(cmd)}
                    className={`
                      px-4 py-3 cursor-pointer flex items-center gap-4 transition-all
                      ${currentIndex === selectedIndex
                        ? 'bg-shell-accent/20 border-l-2 border-shell-accent'
                        : 'hover:bg-shell-card border-l-2 border-transparent'
                      }
                    `}
                  >
                    <div className="w-10 h-10 rounded-lg bg-shell-card flex items-center justify-center flex-shrink-0">
                      <FiCommand className="text-shell-accent" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-shell-text text-sm truncate">
                        {cmd.command}
                      </div>
                      {cmd.description && (
                        <div className="text-xs text-shell-text-dim truncate mt-0.5">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {cmd.usage_count > 0 && (
                      <div className="flex items-center gap-1 text-xs text-shell-text-dim">
                        <FiClock size={12} />
                        <span>{cmd.usage_count}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="p-8 text-center text-shell-text-dim">
              <FiCommand className="mx-auto text-3xl mb-3 opacity-50" />
              <p>没有找到匹配的命令</p>
              <p className="text-sm mt-1">
                按 <kbd className="code-highlight">Enter</kbd> 执行输入的命令
              </p>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-3 border-t border-shell-border bg-shell-bg/50 text-xs text-shell-text-dim">
          <span className="flex items-center gap-2">
            <FiCommand size={12} />
            提示：直接输入命令并按 Enter 可快速执行
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CommandPalette;

