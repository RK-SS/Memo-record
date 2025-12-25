const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取用户数据目录
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'password-manager');
const dataFile = path.join(userDataPath, 'data.json');

console.log('数据文件路径:', dataFile);

if (fs.existsSync(dataFile)) {
  fs.unlinkSync(dataFile);
  console.log('✅ 数据文件已删除，下次启动将显示初始密码');
} else {
  console.log('❌ 数据文件不存在');
}

// 也检查临时目录的备份
const tempDir = os.tmpdir();
const backupDir = path.join(tempDir, '.pm-backup');
const backupFile = path.join(backupDir, 'auth.bak');

console.log('备份文件路径:', backupFile);

if (fs.existsSync(backupFile)) {
  console.log('✅ 找到备份文件');
  try {
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
    console.log('备份内容:', backup);
  } catch (e) {
    console.log('❌ 读取备份文件失败:', e.message);
  }
} else {
  console.log('❌ 备份文件不存在');
}