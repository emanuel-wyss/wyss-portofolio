export {};

try {
  const response = await fetch('http://localhost:3000/health', {
    signal: AbortSignal.timeout(5000),
  });

  if (response.ok) {
    console.log('✓ Health check passed');
    process.exit(0);
  } else {
    console.error('✗ Health check failed');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Health check error:', error);
  process.exit(1);
}
