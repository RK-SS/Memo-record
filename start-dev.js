const { spawn } = require('child_process');
const path = require('path');

console.log('启动开发环境...');

// 启动Vite开发服务器
console.log('启动Vite开发服务器...');
const vite = spawn('npm', ['run', 'dev:renderer'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

// 等待一下让Vite启动
setTimeout(() => {
  console.log('构建并启动Electron...');
  
  // 构建主进程
  const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.main.json'], {
    stdio: 'inherit',
    shell: true
  });
  
  tsc.on('close', (code) => {
    if (code === 0) {
      console.log('启动Electron应用...');
      
      // 启动Electron
      const electron = spawn('npx', ['electron', 'dist/main/index.js'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      electron.on('close', () => {
        console.log('Electron应用已关闭');
        vite.kill();
        process.exit();
      });
    } else {
      console.error('主进程构建失败');
      vite.kill();
      process.exit(1);
    }
  });
}, 3000);

// 处理进程退出
process.on('SIGINT', () => {
  console.log('正在关闭开发服务器...');
  vite.kill();
  process.exit();
});