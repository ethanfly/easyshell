# EasyShell 🚀

> 赛博朋克风格跨平台远程 Shell 管理终端

支持 **Windows / macOS / Linux / Android** 多平台运行。

![EasyShell](https://img.shields.io/badge/version-1.0.0-blue) ![Electron](https://img.shields.io/badge/Electron-28-green) ![Capacitor](https://img.shields.io/badge/Capacitor-5.6-orange)

## ✨ 功能特点

- 🎨 **赛博朋克 UI** - 霓虹色调、玻璃拟态、动态特效
- 🖥️ **SSH 终端** - 完整的 xterm.js 终端模拟
- 📁 **SFTP 文件管理** - 远程文件浏览、上传、下载
- 📊 **主机信息面板** - 实时系统状态监控
- ☁️ **云端同步** - MySQL 数据库同步支持
- 📱 **跨平台** - 桌面端和移动端统一体验

## 🏗️ 项目结构

```
easyshell/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   ├── services/           # 服务层
│   │   ├── api.js          # 跨平台 API 适配层
│   │   ├── database.js     # 数据库服务
│   │   ├── ssh.js          # SSH 服务 (Electron)
│   │   └── sftp.js         # SFTP 服务 (Electron)
│   └── ...
├── server/                 # 后端服务器 (移动端需要)
│   ├── index.js            # Express + Socket.IO 服务
│   └── package.json
├── android/                # Android 原生项目 (Capacitor)
├── main.js                 # Electron 主进程
├── preload.js              # Electron 预加载脚本
└── capacitor.config.ts     # Capacitor 配置
```

## 🚀 快速开始

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装服务器依赖
cd server && npm install && cd ..
```

### 桌面端开发

```bash
# 启动 Electron 开发模式
npm start
```

### 移动端开发

#### 1. 启动后端服务器

```bash
# 在电脑上启动服务器
npm run server

# 或开发模式 (自动重启)
npm run server:dev
```

服务器将在 `http://0.0.0.0:3001` 启动。

#### 2. 构建并运行安卓应用

```bash
# 首次使用需要初始化
npm run cap:add:android

# 构建并打开 Android Studio
npm run android

# 或直接运行到设备
npm run android:run
```

#### 3. 在手机上配置

1. 确保手机和电脑在同一局域网
2. 打开 EasyShell 应用
3. 点击右上角设置图标
4. 输入电脑 IP 地址，如 `http://192.168.1.100:3001`
5. 点击测试连接，确认成功后保存

## 📦 构建发布

### 桌面端

```bash
# Windows
npm run dist

# macOS (需要在 Mac 上构建)
npm run dist

# Linux
npm run dist
```

### 安卓端

```bash
# 构建 Release APK
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

APK 位于 `android/app/build/outputs/apk/release/`

## 🔧 配置说明

### 服务器配置

服务器默认端口 `3001`，可通过环境变量修改：

```bash
PORT=8080 npm run server
```

### Capacitor 配置

编辑 `capacitor.config.ts` 可以修改：

- 应用 ID
- 状态栏样式
- 背景颜色
- 等等

## 🛡️ 安全说明

- SSH 密码和私钥存储在本地 (桌面端使用 electron-store，移动端使用 localStorage)
- 移动端通过 WebSocket 与后端服务器通信
- 建议在受信任的网络环境中使用
- 生产环境建议配置 HTTPS/WSS

## 📱 移动端限制

由于浏览器安全限制，移动端有以下差异：

| 功能 | 桌面端 | 移动端 |
|------|--------|--------|
| SSH 连接 | 直连 | 通过服务器代理 |
| SFTP 上传 | ✅ | ⚠️ 需要文件选择器 |
| MySQL 同步 | ✅ | ❌ 暂不支持 |
| 窗口控制 | ✅ | ❌ 不需要 |

## 🤝 技术栈

**前端:**
- React 18
- Tailwind CSS
- Framer Motion
- xterm.js

**桌面端:**
- Electron 28
- electron-store
- ssh2

**移动端:**
- Capacitor 5
- Socket.IO

**后端:**
- Express
- Socket.IO
- ssh2

## 📄 许可证

MIT License

---

Made with ❤️ and ⚡ by EasyShell Team
