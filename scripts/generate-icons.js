/**
 * 图标生成脚本
 * 将 SVG 转换为各平台所需的图标格式
 */
const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');

// 需要生成的 PNG 尺寸
const sizes = [16, 24, 32, 48, 64, 128, 256, 512];

async function generateIcons() {
  console.log('🎨 开始生成图标...\n');

  // 读取 SVG 文件
  const svgBuffer = fs.readFileSync(svgPath);

  // 生成各尺寸 PNG
  const pngBuffers = {};
  
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);
    
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    
    fs.writeFileSync(outputPath, pngBuffer);
    pngBuffers[size] = pngBuffer;
    console.log(`✅ 生成 icon-${size}.png`);
  }

  // 生成主 PNG 图标 (256x256，用于任务栏)
  const mainPngPath = path.join(publicDir, 'icon.png');
  fs.writeFileSync(mainPngPath, pngBuffers[256]);
  console.log('✅ 生成 icon.png (256x256)');

  // 生成 Windows ICO 文件 (包含多尺寸)
  try {
    const icoSizes = [16, 24, 32, 48, 64, 128, 256];
    const icoPngBuffers = icoSizes.map(s => pngBuffers[s]);
    
    const icoBuffer = await toIco(icoPngBuffers);
    fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuffer);
    console.log('✅ 生成 icon.ico (Windows 图标)');
  } catch (err) {
    console.error('❌ 生成 ICO 失败:', err.message);
  }

  // 生成 macOS ICNS 说明
  console.log('\n📝 macOS 图标说明:');
  console.log('   使用 icon-512.png 通过 iconutil 生成 .icns 文件');
  console.log('   或使用在线工具: https://cloudconvert.com/png-to-icns\n');

  // 清理临时文件（保留常用尺寸）
  const keepSizes = [256, 512];
  for (const size of sizes) {
    if (!keepSizes.includes(size)) {
      const tempPath = path.join(publicDir, `icon-${size}.png`);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  console.log('🎉 图标生成完成!\n');
  console.log('生成的文件:');
  console.log('  - public/icon.png     (任务栏/窗口图标)');
  console.log('  - public/icon.ico     (Windows 安装包/桌面图标)');
  console.log('  - public/icon.svg     (Web/高清图标)');
  console.log('  - public/icon-256.png (备用)');
  console.log('  - public/icon-512.png (macOS 用)');
}

generateIcons().catch(console.error);
