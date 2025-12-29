/**
 * SFTP文件传输服务
 */
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');
const { dialog, app } = require('electron');

class SFTPService {
  constructor() {
    this.progressCallback = null;
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  /**
   * 创建SFTP连接
   */
  createConnection(hostConfig) {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }
          resolve({ conn, sftp });
        });
      });

      conn.on('error', (err) => {
        reject(err);
      });

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

  /**
   * 列出目录内容
   */
  async list(hostConfig, remotePath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.readdir(remotePath, (err, list) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }

          // 格式化文件列表
          const files = list.map(item => ({
            filename: item.filename,
            longname: item.longname,
            attrs: {
              size: item.attrs.size,
              mtime: item.attrs.mtime,
              atime: item.attrs.atime,
              uid: item.attrs.uid,
              gid: item.attrs.gid,
              mode: item.attrs.mode,
              isDirectory: (item.attrs.mode & 0o40000) === 0o40000,
              isFile: (item.attrs.mode & 0o100000) === 0o100000,
              isSymbolicLink: (item.attrs.mode & 0o120000) === 0o120000,
            }
          }));

          resolve({ success: true, files });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 下载文件
   */
  async download(hostConfig, remotePath, mainWindow) {
    // 选择保存位置
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存文件',
      defaultPath: path.basename(remotePath),
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: '用户取消' };
    }

    const localPath = result.filePath;
    let conn, sftp;

    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        // 获取文件大小
        sftp.stat(remotePath, (err, stats) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }

          const totalSize = stats.size;
          let downloadedSize = 0;
          const filename = path.basename(remotePath);

          // 创建读写流
          const readStream = sftp.createReadStream(remotePath);
          const writeStream = fs.createWriteStream(localPath);

          readStream.on('data', (chunk) => {
            downloadedSize += chunk.length;
            const percent = Math.round((downloadedSize / totalSize) * 100);
            if (this.progressCallback) {
              this.progressCallback({
                type: 'download',
                filename,
                percent,
                transferred: downloadedSize,
                total: totalSize,
              });
            }
          });

          readStream.on('error', (err) => {
            writeStream.destroy();
            conn.end();
            fs.unlink(localPath, () => { });
            reject(err);
          });

          writeStream.on('error', (err) => {
            readStream.destroy();
            conn.end();
            fs.unlink(localPath, () => { });
            reject(err);
          });

          // 使用 'finish' 事件确保数据完全写入磁盘
          writeStream.on('finish', () => {
            conn.end();
            resolve({ success: true, localPath });
          });

          readStream.pipe(writeStream);
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 上传文件
   */
  async upload(hostConfig, localPath, remotePath) {
    let conn, sftp;

    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        const stats = fs.statSync(localPath);
        const totalSize = stats.size;
        let uploadedSize = 0;
        const filename = path.basename(localPath);

        // 创建读写流
        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);

        readStream.on('data', (chunk) => {
          uploadedSize += chunk.length;
          const percent = Math.round((uploadedSize / totalSize) * 100);
          if (this.progressCallback) {
            this.progressCallback({
              type: 'upload',
              filename,
              percent,
              transferred: uploadedSize,
              total: totalSize,
            });
          }
        });

        readStream.on('error', (err) => {
          writeStream.destroy();
          conn.end();
          reject(err);
        });

        writeStream.on('error', (err) => {
          readStream.destroy();
          conn.end();
          reject(err);
        });

        // 使用 'finish' 事件确保数据完全写入
        writeStream.on('finish', () => {
          conn.end();
          resolve({ success: true, remotePath });
        });

        readStream.pipe(writeStream);
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 删除文件
   */
  async delete(hostConfig, remotePath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.unlink(remotePath, (err) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: true });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 创建目录
   */
  async mkdir(hostConfig, remotePath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.mkdir(remotePath, (err) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: true });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 删除目录(递归)
   */
  async rmdir(hostConfig, remotePath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      // 递归删除目录内容
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

              // 删除空目录
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
      conn.end();
      return { success: true };
    } catch (err) {
      if (conn) conn.end();
      return { success: false, error: err.message };
    }
  }

  /**
   * 重命名文件/目录
   */
  async rename(hostConfig, oldPath, newPath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: true });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 写入文件内容
   */
  async writeFile(hostConfig, remotePath, content) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        const writeStream = sftp.createWriteStream(remotePath);

        writeStream.on('error', (err) => {
          conn.end();
          reject(err);
        });

        writeStream.on('close', () => {
          conn.end();
          resolve({ success: true });
        });

        writeStream.end(content);
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 读取文件内容
   */
  async readFile(hostConfig, remotePath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        let content = '';
        const readStream = sftp.createReadStream(remotePath);

        readStream.on('data', (chunk) => {
          content += chunk.toString();
        });

        readStream.on('error', (err) => {
          conn.end();
          reject(err);
        });

        readStream.on('end', () => {
          conn.end();
          resolve({ success: true, content });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 获取文件状态
   */
  async stat(hostConfig, remotePath) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.stat(remotePath, (err, stats) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }
          resolve({
            success: true,
            stats: {
              size: stats.size,
              mtime: stats.mtime,
              atime: stats.atime,
              mode: stats.mode,
              isDirectory: (stats.mode & 0o40000) === 0o40000,
              isFile: (stats.mode & 0o100000) === 0o100000,
            }
          });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 修改文件权限
   */
  async chmod(hostConfig, remotePath, mode) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.chmod(remotePath, mode, (err) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: true });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 修改文件所有者
   */
  async chown(hostConfig, remotePath, uid, gid) {
    let conn, sftp;
    try {
      ({ conn, sftp } = await this.createConnection(hostConfig));

      return new Promise((resolve, reject) => {
        sftp.chown(remotePath, uid, gid, (err) => {
          conn.end();
          if (err) {
            reject(err);
            return;
          }
          resolve({ success: true });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = new SFTPService();

