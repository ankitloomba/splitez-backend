// Wrapper entry point that catches crashes during module loading
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] Unhandled rejection:', err);
  process.exit(1);
});

console.log('[SplitEZ] Node started, loading app...');
console.log('[SplitEZ] Memory:', JSON.stringify(process.memoryUsage()));

try {
  require('./dist/main.js');
} catch (err) {
  console.error('[FATAL] Failed to load app:', err);
  process.exit(1);
}
