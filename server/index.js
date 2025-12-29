/**
 * EasyShell - 后端服务器
 * 提供 SSH 代理、SFTP 服务和 WebSocket 通信
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Socket.IO 配置
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 中间件
app.use(cors());
app.use(express.json());

// 存储活动的 SSH 连接
const sshConnections = new Map();
const sftpConnections = new Map();

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 获取服务器信息
app.get('/info', (req, res) => {
  res.json({
    name: 'EasyShell Server',
    version: '1.0.0',
    connections: sshConnections.size,
  });
});

// ========== Socket.IO 事件处理 ==========

io.on('connection', (socket) => {
  console.log(`✅ 客户端连接: ${socket.id}`);

  // SSH 连接
  socket.on('ssh:connect', async (hostConfig, callback) => {
    const connectionId = `${socket.id}-${Date.now()}`;
    
    try {
      const conn = new Client();
      
      conn.on('ready', () => {
        console.log(`✅ SSH 连接成功: ${hostConfig.host}`);
        
        // 创建 shell
        conn.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            callback({ success: false, error: err.message });
            return;
          }

          // 存储连接
          sshConnections.set(connectionId, { conn, stream, hostConfig });

          // 数据传输
          stream.on('data', (data) => {
            socket.emit(`ssh:data:${connectionId}`, data.toString());
          });

          stream.stderr.on('data', (data) => {
            socket.emit(`ssh:data:${connectionId}`, data.toString());
          });

          stream.on('close', () => {
            console.log(`📤 SSH 会话关闭: ${hostConfig.host}`);
            socket.emit(`ssh:close:${connectionId}`);
            sshConnections.delete(connectionId);
          });

          callback({ success: true, connectionId });
        });
      });

      conn.on('error', (err) => {
        console.error(`❌ SSH 连接错误: ${err.message}`);
        socket.emit(`ssh:error:${connectionId}`, err.message);
        callback({ success: false, error: err.message });
      });

      // 连接配置
      const connectConfig = {
        host: hostConfig.host,
        port: hostConfig.port || 22,
        username: hostConfig.username,
        readyTimeout: 20000,
        keepaliveInterval: 10000,
      };

      if (hostConfig.privateKey && hostConfig.privateKey.trim()) {
        connectConfig.privateKey = hostConfig.privateKey;
      }
      if (hostConfig.password && hostConfig.password.trim()) {
        connectConfig.password = hostConfig.password;
      }

      conn.connect(connectConfig);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SSH 写入数据
  socket.on('ssh:write', ({ connectionId, data }) => {
    const connection = sshConnections.get(connectionId);
    if (connection?.stream) {
      connection.stream.write(data);
    }
  });

  // SSH 调整窗口大小
  socket.on('ssh:resize', ({ connectionId, cols, rows }) => {
    const connection = sshConnections.get(connectionId);
    if (connection?.stream) {
      connection.stream.setWindow(rows, cols, 0, 0);
    }
  });

  // SSH 断开连接
  socket.on('ssh:disconnect', (connectionId) => {
    const connection = sshConnections.get(connectionId);
    if (connection) {
      connection.conn.end();
      sshConnections.delete(connectionId);
      console.log(`📤 SSH 连接已断开: ${connectionId}`);
    }
  });

  // SSH 执行命令
  socket.on('ssh:exec', async ({ hostConfig, command }, callback) => {
    const conn = new Client();
    let output = '';
    let errorOutput = '';

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          callback({ success: false, error: err.message });
          return;
        }

        stream.on('close', (code) => {
          conn.end();
          callback({
            success: true,
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

    conn.on('error', (err) => {
      callback({ success: false, error: err.message });
    });

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

  // ========== SFTP 操作 ==========

  // SFTP 列出目录
  socket.on('sftp:list', async ({ hostConfig, remotePath }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        return new Promise((resolve, reject) => {
          sftp.readdir(remotePath, (err, list) => {
            if (err) {
              reject(err);
              return;
            }
            
            const files = list.map(item => ({
              filename: item.filename,
              longname: item.longname,
              attrs: {
                size: item.attrs.size,
                mtime: item.attrs.mtime,
                atime: item.attrs.atime,
                mode: item.attrs.mode,
                isDirectory: (item.attrs.mode & 0o40000) === 0o40000,
                isFile: (item.attrs.mode & 0o100000) === 0o100000,
              }
            }));
            
            resolve({ success: true, files });
          });
        });
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SFTP 创建目录
  socket.on('sftp:mkdir', async ({ hostConfig, remotePath }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        return new Promise((resolve, reject) => {
          sftp.mkdir(remotePath, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
          });
        });
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SFTP 删除文件
  socket.on('sftp:delete', async ({ hostConfig, remotePath }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        return new Promise((resolve, reject) => {
          sftp.unlink(remotePath, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
          });
        });
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SFTP 删除目录（递归）
  socket.on('sftp:rmdir', async ({ hostConfig, remotePath }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        const deleteRecursive = async (dirPath) => {
          return new Promise((resolve, reject) => {
            sftp.readdir(dirPath, async (err, list) => {
              if (err) {
                reject(err);
                return;
              }

              try {
                for (const item of list) {
                  const itemPath = `${dirPath}/${item.filename}`;
                  const isDir = (item.attrs.mode & 0o40000) === 0o40000;
                  
                  if (isDir) {
                    await deleteRecursive(itemPath);
                  } else {
                    await new Promise((res, rej) => {
                      sftp.unlink(itemPath, (err) => {
                        if (err) rej(err);
                        else res();
                      });
                    });
                  }
                }

                sftp.rmdir(dirPath, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              } catch (e) {
                reject(e);
              }
            });
          });
        };

        await deleteRecursive(remotePath);
        return { success: true };
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SFTP 重命名
  socket.on('sftp:rename', async ({ hostConfig, oldPath, newPath }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        return new Promise((resolve, reject) => {
          sftp.rename(oldPath, newPath, (err) => {
            if (err) reject(err);
            else resolve({ success: true });
          });
        });
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SFTP 读取文件
  socket.on('sftp:readFile', async ({ hostConfig, remotePath }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        return new Promise((resolve, reject) => {
          let content = '';
          const readStream = sftp.createReadStream(remotePath);

          readStream.on('data', (chunk) => {
            content += chunk.toString();
          });

          readStream.on('error', reject);

          readStream.on('end', () => {
            resolve({ success: true, content });
          });
        });
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // SFTP 写入文件
  socket.on('sftp:writeFile', async ({ hostConfig, remotePath, content }, callback) => {
    try {
      const result = await sftpOperation(hostConfig, async (sftp) => {
        return new Promise((resolve, reject) => {
          const writeStream = sftp.createWriteStream(remotePath);
          
          writeStream.on('error', reject);
          writeStream.on('close', () => resolve({ success: true }));
          
          writeStream.end(content);
        });
      });
      callback(result);
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // 客户端断开连接时清理
  socket.on('disconnect', () => {
    console.log(`📤 客户端断开: ${socket.id}`);
    
    // 清理该客户端的所有 SSH 连接
    for (const [id, connection] of sshConnections.entries()) {
      if (id.startsWith(socket.id)) {
        connection.conn.end();
        sshConnections.delete(id);
      }
    }
  });
});

// SFTP 操作辅助函数
async function sftpOperation(hostConfig, operation) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on('ready', () => {
      conn.sftp(async (err, sftp) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        try {
          const result = await operation(sftp);
          conn.end();
          resolve(result);
        } catch (error) {
          conn.end();
          reject(error);
        }
      });
    });

    conn.on('error', reject);

    const connectConfig = {
      host: hostConfig.host,
      port: hostConfig.port || 22,
      username: hostConfig.username,
      readyTimeout: 20000,
    };

    if (hostConfig.privateKey && hostConfig.privateKey.trim()) {
      connectConfig.privateKey = hostConfig.privateKey;
    }
    if (hostConfig.password && hostConfig.password.trim()) {
      connectConfig.password = hostConfig.password;
    }

    conn.connect(connectConfig);
  });
}

// 启动服务器
const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   ⚡ EasyShell Server v1.0.0                      ║
║                                                   ║
║   🌐 HTTP:   http://0.0.0.0:${PORT}                  ║
║   🔌 Socket: ws://0.0.0.0:${PORT}                    ║
║                                                   ║
║   Ready for connections...                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  
  // 关闭所有 SSH 连接
  for (const [id, connection] of sshConnections.entries()) {
    connection.conn.end();
  }
  
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, server, io };

