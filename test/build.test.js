const { execSync } = require('child_process');
const fs = require('fs');

test('builds without error', () => {
  execSync('npx eleventy', { stdio: 'inherit' });
  expect(fs.existsSync('_site/index.html')).toBe(true);
});
