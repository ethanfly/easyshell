/**
 * SSH连接服务
 */
const { Client } = require('ssh2');

class SSHService {
  constructor() {
    this.connections = new Map();
  }

  /**
   * 创建SSH连接
   */
  connect(hostConfig, connectionId, callbacks = {}) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let resolved = false;

      conn.on('ready', () => {
        console.log(`✅ SSH连接成功: ${hostConfig.host}`);
        this.connections.set(connectionId, conn);
        
        // 创建shell
        conn.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            if (!resolved) {
              resolved = true;
              reject(err);
            }
            return;
          }

          stream.on('data', (data) => {
            if (callbacks.onData) {
              callbacks.onData(data.toString());
            }
          });

          stream.on('close', () => {
            console.log(`📤 SSH会话关闭: ${hostConfig.host}`);
            this.disconnect(connectionId);
            if (callbacks.onClose) {
              callbacks.onClose();
            }
          });

          stream.stderr.on('data', (data) => {
            if (callbacks.onData) {
              callbacks.onData(data.toString());
            }
          });

          if (!resolved) {
            resolved = true;
            resolve({
              connectionId,
              stream,
              write: (data) => stream.write(data),
              resize: (cols, rows) => stream.setWindow(rows, cols, 0, 0),
            });
          }
        });
      });

      conn.on('error', (err) => {
        console.error(`❌ SSH连接错误: ${err.message}`);
        if (callbacks.onError) {
          callbacks.onError(err);
        }
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      conn.on('close', () => {
        this.connections.delete(connectionId);
        if (callbacks.onClose) {
          callbacks.onClose();
        }
      });

      // 连接配置
      const connectConfig = {
        host: hostConfig.host,
        port: hostConfig.port || 22,
        username: hostConfig.username,
        readyTimeout: 20000,  // 增加超时时间
        keepaliveInterval: 10000,
      };

      // 使用密码或私钥
      if (hostConfig.privateKey && hostConfig.privateKey.trim()) {
        connectConfig.privateKey = hostConfig.privateKey;
      }
      if (hostConfig.password && hostConfig.password.trim()) {
        connectConfig.password = hostConfig.password;
      }

      // 如果没有提供认证方式
      if (!connectConfig.privateKey && !connectConfig.password) {
        if (!resolved) {
          resolved = true;
          reject(new Error('请提供密码或SSH私钥'));
        }
        return;
      }

      conn.connect(connectConfig);
    });
  }

  /**
   * 断开连接
   */
  disconnect(connectionId) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.end();
      this.connections.delete(connectionId);
      console.log(`📤 SSH连接已断开: ${connectionId}`);
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll() {
    for (const [id, conn] of this.connections) {
      conn.end();
    }
    this.connections.clear();
  }

  /**
   * 执行单个命令
   */
  exec(hostConfig, command) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let output = '';
      let errorOutput = '';

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }

          stream.on('close', (code) => {
            conn.end();
            resolve({
              code,
              stdout: output,
              stderr: errorOutput,
            });
          });

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
        });
      });

      conn.on('error', reject);

      const connectConfig = {
        host: hostConfig.host,
        port: hostConfig.port || 22,
        username: hostConfig.username,
      };

      if (hostConfig.privateKey) {
        connectConfig.privateKey = hostConfig.privateKey;
      } else if (hostConfig.password) {
        connectConfig.password = hostConfig.password;
      }

      conn.connect(connectConfig);
    });
  }

  /**
   * 测试连接
   */
  async testConnection(hostConfig) {
    try {
      const result = await this.exec(hostConfig, 'echo "connected"');
      return {
        success: true,
        message: '连接成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = new SSHService();

