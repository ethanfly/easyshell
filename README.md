# 🚀 EasyShell

高颜值远程 Shell 管理终端 - 一款现代化的 SSH 连接管理工具

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🎨 **高颜值界面** - 现代化深色主题，精心设计的 UI/UX
- 🔐 **SSH 连接管理** - 支持密码和私钥认证方式
- 💾 **双模式存储** - 本地 SQLite + 远程 MySQL 同步
- 📝 **智能命令提示** - 内置常用命令，支持搜索和使用频率排序
- 🔄 **数据同步** - 自动建库建表，一键上传/下载数据
- 📑 **多标签终端** - 同时管理多个 SSH 会话
- ⌨️ **快捷键支持** - Ctrl+K 打开命令面板

## 📸 界面预览

应用采用深色主题设计，包含：
- 可折叠侧边栏（主机列表分组显示）
- 多标签终端区域
- 命令面板（Ctrl+K 快速调用）
- 主机管理弹窗
- 数据库连接设置

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - 用户界面库
- **TailwindCSS** - 原子化 CSS 框架
- **Framer Motion** - 动画库
- **XTerm.js** - 终端模拟器
- **SSH2** - SSH 连接库
- **better-sqlite3** - 本地数据库
- **mysql2** - MySQL 连接库

## 📦 安装

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Python 3.x（用于编译原生模块）
- Visual Studio Build Tools（Windows）/ Xcode（macOS）

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/your-username/easyshell.git
cd easyshell

# 安装依赖
npm install

# 重新编译原生模块（如果遇到问题）
npm rebuild better-sqlite3 --build-from-source
npm rebuild ssh2 --build-from-source

# 启动开发模式
npm start
```

### 构建发布版本

```bash
# 构建生产版本
npm run dist
```

## 🚀 使用说明

### 本地模式

应用默认使用本地 SQLite 数据库存储数据，无需任何配置即可使用。

### 远程同步模式

1. 点击左下角「本地模式」或设置图标
2. 输入 MySQL 服务器信息：
   - 主机地址
   - 端口（默认 3306）
   - 用户名
   - 密码
   - 数据库名（默认 easyshell）
3. 点击「连接数据库」
4. 系统将自动创建数据库和所需的表结构

### 添加主机

1. 点击侧边栏的 ➕ 按钮或「添加主机」
2. 填写主机信息：
   - 名称（显示名）
   - 分组（用于分类）
   - 主机地址
   - 端口（默认 22）
   - 用户名
   - 密码或 SSH 私钥
3. 可选择标识颜色
4. 点击「测试连接」验证配置
5. 点击「添加主机」保存

### 命令提示

- 按 `Ctrl+K` 打开命令面板
- 搜索或浏览预设命令
- 使用方向键选择，回车执行
- 命令会直接发送到当前终端

## 📁 项目结构

```
easyshell/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本（IPC 桥接）
├── package.json         # 项目配置
├── tailwind.config.js   # TailwindCSS 配置
├── public/
│   └── index.html       # HTML 模板
└── src/
    ├── index.js         # React 入口
    ├── index.css        # 全局样式
    ├── App.js           # 主应用组件
    ├── components/
    │   ├── TitleBar.js      # 标题栏
    │   ├── Sidebar.js       # 侧边栏
    │   ├── Terminal.js      # 终端组件
    │   ├── HostManager.js   # 主机管理
    │   ├── Settings.js      # 设置面板
    │   └── CommandPalette.js # 命令面板
    └── services/
        ├── database.js  # 数据库服务
        └── ssh.js       # SSH 服务
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 打开命令面板 |
| `Esc` | 关闭弹窗 |
| `↑/↓` | 命令面板中导航 |
| `Enter` | 执行选中命令 |

## 🔧 数据库结构

### hosts 表（主机信息）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR | 主机名称 |
| host | VARCHAR | 主机地址 |
| port | INT | SSH 端口 |
| username | VARCHAR | 用户名 |
| password | TEXT | 密码（加密存储建议） |
| private_key | TEXT | SSH 私钥 |
| group_name | VARCHAR | 分组名 |
| color | VARCHAR | 标识颜色 |
| description | TEXT | 备注 |

### commands 表（命令提示）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| command | TEXT | 命令内容 |
| description | TEXT | 命令描述 |
| category | VARCHAR | 分类 |
| usage_count | INT | 使用次数 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

Made with ❤️ by EasyShell Team

