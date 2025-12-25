// 在渲染进程中测试electronAPI
console.log('Testing electronAPI...');
console.log('window.electronAPI:', window.electronAPI);

if (window.electronAPI) {
  console.log('✅ electronAPI 可用');
  console.log('可用方法:', Object.keys(window.electronAPI));
} else {
  console.log('❌ electronAPI 不可用');
  console.log('window对象上的属性:', Object.keys(window));
}