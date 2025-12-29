import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easyshell.app',
  appName: 'EasyShell',
  webDir: 'build',
  server: {
    // 开发时可以指向本地服务器
    // url: 'http://192.168.1.100:3000',
    // cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050810',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    App: {
      // 防止返回键直接退出
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#050810',
    // 全屏沉浸模式
    // useLegacyBridge: true,
  },
  ios: {
    backgroundColor: '#050810',
    contentInset: 'automatic',
  },
};

export default config;

