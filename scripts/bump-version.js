/**
 * 自动更新版本号脚本
 * 每次打包时自动递增补丁版本号 (1.0.0 -> 1.0.1)
 * 
 * 使用方式:
 *   node scripts/bump-version.js        # 递增补丁版本 (patch)
 *   node scripts/bump-version.js minor  # 递增次版本 (minor)
 *   node scripts/bump-version.js major  # 递增主版本 (major)
 */

const fs = require('fs');
const path = require('path');

// 获取版本类型参数
const versionType = process.argv[2] || 'patch';

// 读取 package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 解析当前版本
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 计算新版本
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// 更新 package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 4) + '\n', 'utf8');

// 输出结果
console.log(`📦 版本号已更新: ${currentVersion} -> ${newVersion}`);

// 可选：更新其他需要版本号的文件
// 例如更新 App 中显示的版本号

// 更新 TitleBar 组件中的版本号（如果存在硬编码）
const titleBarPath = path.join(__dirname, '..', 'src', 'components', 'TitleBar.js');
if (fs.existsSync(titleBarPath)) {
  let titleBarContent = fs.readFileSync(titleBarPath, 'utf8');
  // 匹配多种版本号格式: v1.0, v1.0.0, V1.0, V1.0.0
  const versionRegex = /[vV]\d+\.\d+(\.\d+)?/g;
  if (versionRegex.test(titleBarContent)) {
    titleBarContent = titleBarContent.replace(versionRegex, `V${newVersion}`);
    fs.writeFileSync(titleBarPath, titleBarContent, 'utf8');
    console.log(`📝 TitleBar.js 版本号已更新`);
  }
}

console.log(`✅ 版本更新完成！新版本: ${newVersion}`);
