const { spawn } = require('child_process');
const path = require('path');

// 构建主进程
console.log('构建主进程...');
const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.main.json'], {
  stdio: 'inherit',
  shell: true
});

tsc.on('close', (code) => {
  if (code === 0) {
    console.log('主进程构建完成，启动应用...');
    
    // 启动Electron
    const electron = spawn('npx', ['electron', 'dist/main/index.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    electron.on('close', () => {
      process.exit();
    });
  } else {
    console.error('主进程构建失败');
    process.exit(1);
  }
});