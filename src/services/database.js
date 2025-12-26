/**
 * 数据库服务 - 支持MySQL远程同步和SQLite本地存储
 * 使用 sql.js (SQLite WASM版本) 无需原生编译
 */
const initSqlJs = require('sql.js');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    this.mysqlConnection = null;
    this.sqliteDb = null;
    this.SQL = null;
    this.isRemoteConnected = false;
    this.dbPath = null;
  }

  /**
   * 获取SQLite数据库路径
   */
  getSqlitePath() {
    const userDataPath = app?.getPath('userData') || process.cwd();
    return path.join(userDataPath, 'easyshell.db');
  }

  /**
   * 保存数据库到文件
   */
  saveDatabase() {
    if (this.sqliteDb && this.dbPath) {
      const data = this.sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  /**
   * 初始化本地SQLite数据库
   */
  async initLocalDatabase() {
    try {
      // 初始化 sql.js
      this.SQL = await initSqlJs();
      this.dbPath = this.getSqlitePath();

      // 尝试加载现有数据库
      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.sqliteDb = new this.SQL.Database(fileBuffer);
      } else {
        this.sqliteDb = new this.SQL.Database();
      }

      this.createLocalTables();
      this.saveDatabase();
      console.log('✅ 本地数据库初始化成功');
      return { success: true };
    } catch (error) {
      console.error('❌ 本地数据库初始化失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建本地表结构
   */
  createLocalTables() {
    // 主机信息表
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 22,
        username TEXT NOT NULL,
        password TEXT,
        private_key TEXT,
        group_name TEXT DEFAULT '默认分组',
        color TEXT DEFAULT '#58a6ff',
        description TEXT,
        last_connected_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_synced INTEGER DEFAULT 0
      )
    `);

    // 命令提示/历史表
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT DEFAULT '通用',
        usage_count INTEGER DEFAULT 0,
        host_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_id) REFERENCES hosts(id)
      )
    `);

    // 命令片段/快捷命令表
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        command TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT '通用',
        hotkey TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 同步记录表
    this.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT NOT NULL,
        sync_time TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT,
        details TEXT
      )
    `);

    // 插入默认命令提示
    const defaultCommands = [
      { command: 'ls -la', description: '列出所有文件详细信息', category: '文件操作' },
      { command: 'cd', description: '切换目录', category: '文件操作' },
      { command: 'pwd', description: '显示当前目录', category: '文件操作' },
      { command: 'mkdir', description: '创建目录', category: '文件操作' },
      { command: 'rm -rf', description: '强制删除文件/目录', category: '文件操作' },
      { command: 'cp -r', description: '递归复制文件/目录', category: '文件操作' },
      { command: 'mv', description: '移动/重命名文件', category: '文件操作' },
      { command: 'cat', description: '查看文件内容', category: '文件操作' },
      { command: 'tail -f', description: '实时查看日志', category: '日志查看' },
      { command: 'grep', description: '文本搜索', category: '文本处理' },
      { command: 'ps aux', description: '查看所有进程', category: '系统管理' },
      { command: 'top', description: '实时系统监控', category: '系统管理' },
      { command: 'htop', description: '增强版系统监控', category: '系统管理' },
      { command: 'df -h', description: '查看磁盘使用情况', category: '系统管理' },
      { command: 'free -m', description: '查看内存使用情况', category: '系统管理' },
      { command: 'netstat -tunlp', description: '查看网络连接', category: '网络' },
      { command: 'systemctl status', description: '查看服务状态', category: '服务管理' },
      { command: 'systemctl restart', description: '重启服务', category: '服务管理' },
      { command: 'docker ps', description: '查看运行中的容器', category: 'Docker' },
      { command: 'docker logs -f', description: '实时查看容器日志', category: 'Docker' },
    ];

    for (const cmd of defaultCommands) {
      try {
        this.sqliteDb.run(
          `INSERT OR IGNORE INTO commands (command, description, category) VALUES (?, ?, ?)`,
          [cmd.command, cmd.description, cmd.category]
        );
      } catch (e) {
        // 忽略重复插入错误
      }
    }
  }

  /**
   * 连接MySQL远程数据库
   */
  async connectMySQL(config) {
    try {
      // 如果是 localhost，转换为 127.0.0.1 强制使用 IPv4
      let host = config.host;
      if (host === 'localhost') {
        host = '127.0.0.1';
      }
      
      // 先不指定数据库连接，这样可以创建数据库
      this.mysqlConnection = await mysql.createConnection({
        host: host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        connectTimeout: 10000,
      });

      // 自动建库建表
      await this.initRemoteDatabase(config.database || 'easyshell');
      
      this.isRemoteConnected = true;
      console.log('✅ MySQL远程数据库连接成功');
      return { success: true };
    } catch (error) {
      console.error('❌ MySQL连接失败:', error);
      this.isRemoteConnected = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * 初始化远程MySQL数据库（自动建库建表）
   */
  async initRemoteDatabase(dbName) {
    try {
      // 创建数据库 - 使用 query 而不是 execute
      await this.mysqlConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      
      // 使用数据库 - 使用 query 而不是 execute
      await this.mysqlConnection.query(`USE \`${dbName}\``);

      // 创建主机表
      await this.mysqlConnection.query(`
        CREATE TABLE IF NOT EXISTS hosts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INT DEFAULT 22,
          username VARCHAR(255) NOT NULL,
          password TEXT,
          private_key TEXT,
          group_name VARCHAR(100) DEFAULT '默认分组',
          color VARCHAR(20) DEFAULT '#58a6ff',
          description TEXT,
          last_connected_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // 创建命令表
      await this.mysqlConnection.query(`
        CREATE TABLE IF NOT EXISTS commands (
          id INT PRIMARY KEY AUTO_INCREMENT,
          command TEXT NOT NULL,
          description TEXT,
          category VARCHAR(100) DEFAULT '通用',
          usage_count INT DEFAULT 0,
          host_id INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // 创建命令片段表
      await this.mysqlConnection.query(`
        CREATE TABLE IF NOT EXISTS snippets (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          command TEXT NOT NULL,
          description TEXT,
          category VARCHAR(100) DEFAULT '通用',
          hotkey VARCHAR(50),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      console.log('✅ 远程数据库表结构初始化完成');
    } catch (error) {
      console.error('❌ 远程数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 断开MySQL连接
   */
  async disconnectMySQL() {
    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      this.mysqlConnection = null;
      this.isRemoteConnected = false;
    }
  }

  /**
   * 同步数据到远程
   */
  async syncToRemote() {
    if (!this.isRemoteConnected) {
      return { success: false, error: '未连接到远程数据库' };
    }

    try {
      // 获取本地未同步的主机
      const localHosts = this.runQuery('SELECT * FROM hosts WHERE is_synced = 0');

      for (const host of localHosts) {
        await this.mysqlConnection.execute(`
          INSERT INTO hosts (name, host, port, username, password, private_key, group_name, color, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            port = VALUES(port),
            username = VALUES(username),
            password = VALUES(password),
            private_key = VALUES(private_key),
            group_name = VALUES(group_name),
            color = VALUES(color),
            description = VALUES(description)
        `, [host.name, host.host, host.port, host.username, host.password, host.private_key, host.group_name, host.color, host.description]);

        // 标记为已同步
        this.sqliteDb.run('UPDATE hosts SET is_synced = 1 WHERE id = ?', [host.id]);
      }

      this.saveDatabase();

      // 记录同步日志
      this.sqliteDb.run(
        `INSERT INTO sync_log (sync_type, status, details) VALUES ('upload', 'success', ?)`,
        [JSON.stringify({ synced_hosts: localHosts.length })]
      );
      this.saveDatabase();

      return { success: true, synced: localHosts.length };
    } catch (error) {
      console.error('❌ 同步到远程失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 从远程同步数据
   */
  async syncFromRemote() {
    if (!this.isRemoteConnected) {
      return { success: false, error: '未连接到远程数据库' };
    }

    try {
      // 获取远程主机
      const [remoteHosts] = await this.mysqlConnection.execute('SELECT * FROM hosts');

      for (const host of remoteHosts) {
        this.sqliteDb.run(`
          INSERT OR REPLACE INTO hosts (id, name, host, port, username, password, private_key, group_name, color, description, is_synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [host.id, host.name, host.host, host.port, host.username, host.password, host.private_key, host.group_name, host.color, host.description]);
      }

      // 同步命令
      const [remoteCommands] = await this.mysqlConnection.execute('SELECT * FROM commands');

      for (const cmd of remoteCommands) {
        this.sqliteDb.run(`
          INSERT OR REPLACE INTO commands (id, command, description, category, usage_count)
          VALUES (?, ?, ?, ?, ?)
        `, [cmd.id, cmd.command, cmd.description, cmd.category, cmd.usage_count]);
      }

      this.saveDatabase();

      // 记录同步日志
      this.sqliteDb.run(
        `INSERT INTO sync_log (sync_type, status, details) VALUES ('download', 'success', ?)`,
        [JSON.stringify({ hosts: remoteHosts.length, commands: remoteCommands.length })]
      );
      this.saveDatabase();

      return { success: true, hosts: remoteHosts.length, commands: remoteCommands.length };
    } catch (error) {
      console.error('❌ 从远程同步失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 执行查询并返回结果数组
   */
  runQuery(sql, params = []) {
    const stmt = this.sqliteDb.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  /**
   * 执行查询并返回单个结果
   */
  runQuerySingle(sql, params = []) {
    const results = this.runQuery(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  // ========== 主机管理方法 ==========

  getAllHosts() {
    return this.runQuery('SELECT * FROM hosts ORDER BY group_name, name');
  }

  getHostById(id) {
    return this.runQuerySingle('SELECT * FROM hosts WHERE id = ?', [id]);
  }

  addHost(host) {
    this.sqliteDb.run(`
      INSERT INTO hosts (name, host, port, username, password, private_key, group_name, color, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      host.name, host.host, host.port || 22, host.username,
      host.password, host.privateKey, host.groupName || '默认分组',
      host.color || '#58a6ff', host.description
    ]);
    this.saveDatabase();
    
    // 获取最后插入的ID
    const result = this.runQuerySingle('SELECT last_insert_rowid() as id');
    return { id: result.id };
  }

  updateHost(id, host) {
    this.sqliteDb.run(`
      UPDATE hosts SET 
        name = ?, host = ?, port = ?, username = ?, password = ?, 
        private_key = ?, group_name = ?, color = ?, description = ?,
        updated_at = CURRENT_TIMESTAMP, is_synced = 0
      WHERE id = ?
    `, [
      host.name, host.host, host.port, host.username, host.password,
      host.privateKey, host.groupName, host.color, host.description, id
    ]);
    this.saveDatabase();
    return { success: true };
  }

  deleteHost(id) {
    this.sqliteDb.run('DELETE FROM hosts WHERE id = ?', [id]);
    this.saveDatabase();
    return { success: true };
  }

  updateLastConnected(id) {
    this.sqliteDb.run(`UPDATE hosts SET last_connected_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
    this.saveDatabase();
  }

  // ========== 命令提示方法 ==========

  searchCommands(keyword) {
    return this.runQuery(`
      SELECT * FROM commands 
      WHERE command LIKE ? OR description LIKE ?
      ORDER BY usage_count DESC, command
      LIMIT 20
    `, [`%${keyword}%`, `%${keyword}%`]);
  }

  getAllCommands() {
    return this.runQuery('SELECT * FROM commands ORDER BY category, command');
  }

  incrementCommandUsage(id) {
    this.sqliteDb.run('UPDATE commands SET usage_count = usage_count + 1 WHERE id = ?', [id]);
    this.saveDatabase();
  }

  addCommand(command) {
    this.sqliteDb.run(`
      INSERT INTO commands (command, description, category)
      VALUES (?, ?, ?)
    `, [command.command, command.description, command.category || '通用']);
    this.saveDatabase();
    
    const result = this.runQuerySingle('SELECT last_insert_rowid() as id');
    return { id: result.id };
  }

  // ========== 命令片段方法 ==========

  getAllSnippets() {
    return this.runQuery('SELECT * FROM snippets ORDER BY category, name');
  }

  addSnippet(snippet) {
    this.sqliteDb.run(`
      INSERT INTO snippets (name, command, description, category, hotkey)
      VALUES (?, ?, ?, ?, ?)
    `, [snippet.name, snippet.command, snippet.description, snippet.category, snippet.hotkey]);
    this.saveDatabase();
    
    const result = this.runQuerySingle('SELECT last_insert_rowid() as id');
    return { id: result.id };
  }

  deleteSnippet(id) {
    this.sqliteDb.run('DELETE FROM snippets WHERE id = ?', [id]);
    this.saveDatabase();
    return { success: true };
  }

  // ========== 关闭数据库 ==========

  close() {
    if (this.sqliteDb) {
      this.saveDatabase();
      this.sqliteDb.close();
    }
    if (this.mysqlConnection) {
      this.mysqlConnection.end();
    }
  }
}

module.exports = new DatabaseService();
