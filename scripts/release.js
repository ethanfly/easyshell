/**
 * 发布脚本
 * 自动更新版本号、提交、打标签并推送到 GitHub
 * 
 * 用法:
 *   npm run release         # patch 版本 (1.0.0 -> 1.0.1)
 *   npm run release:minor   # minor 版本 (1.0.0 -> 1.1.0)
 *   npm run release:major   # major 版本 (1.0.0 -> 2.0.0)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const titleBarPath = path.resolve(__dirname, '../src/components/TitleBar.js');

function exec(cmd, options = {}) {
    console.log(`\n🔧 执行: ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', ...options });
    } catch (error) {
        console.error(`❌ 命令执行失败: ${cmd}`);
        process.exit(1);
    }
}

function bumpVersion(type = 'patch') {
    // 读取 package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let [major, minor, patch] = packageJson.version.split('.').map(Number);

    // 递增版本号
    if (type === 'major') {
        major++;
        minor = 0;
        patch = 0;
    } else if (type === 'minor') {
        minor++;
        patch = 0;
    } else {
        patch++;
    }

    const newVersion = `${major}.${minor}.${patch}`;
    packageJson.version = newVersion;

    // 更新 package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');
    console.log(`📦 版本号已更新: ${newVersion}`);

    // 更新 TitleBar.js
    if (fs.existsSync(titleBarPath)) {
        let titleBarContent = fs.readFileSync(titleBarPath, 'utf8');
        const newTitleBarContent = titleBarContent.replace(
            /v\d+\.\d+\.\d+/g,
            `v${newVersion}`
        );
        fs.writeFileSync(titleBarPath, newTitleBarContent, 'utf8');
        console.log('📝 TitleBar.js 版本号已更新');
    }

    return newVersion;
}

function release() {
    const versionType = process.argv[2] || 'patch';
    
    console.log('🚀 开始发布流程...\n');
    console.log(`📋 版本类型: ${versionType}`);

    // 1. 检查是否有未提交的更改
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            console.log('\n⚠️  检测到未提交的更改，将一起提交...');
        }
    } catch (e) {
        console.error('❌ Git 状态检查失败');
        process.exit(1);
    }

    // 2. 更新版本号
    const newVersion = bumpVersion(versionType);
    const tagName = `v${newVersion}`;

    // 3. 添加所有更改
    exec('git add .');

    // 4. 提交更改
    exec(`git commit -m "chore: release ${tagName}"`);

    // 5. 创建标签
    exec(`git tag -a ${tagName} -m "Release ${tagName}"`);
    console.log(`\n🏷️  标签已创建: ${tagName}`);

    // 6. 推送到远程
    console.log('\n📤 推送到远程仓库...');
    exec('git push origin main');
    exec(`git push origin ${tagName}`);

    console.log(`\n✅ 发布完成！`);
    console.log(`   版本: ${tagName}`);
    console.log(`   GitHub Actions 将自动开始构建...`);
    console.log(`\n🔗 查看构建进度: https://github.com/ethanfly/easyshell/actions`);
}

release();
