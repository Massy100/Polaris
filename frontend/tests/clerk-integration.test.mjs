import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('root layout wires the app through ClerkProvider', () => {
  const layout = read('../src/app/layout.tsx');

  assert.match(layout, /import\s+\{\s*ClerkProvider\s*\}\s+from\s+['"]@clerk\/nextjs['"]/);
  assert.match(layout, /<ClerkProvider>/);
  assert.match(layout, /<\/ClerkProvider>/);
});

test('admin dashboard panel uses Clerk auth for logout flow', () => {
  const panel = read('../src/app/components/admin-dashboard-panel.tsx');

  assert.match(panel, /import\s+\{\s*useAuth\s*\}\s+from\s+['"]@clerk\/nextjs['"]/);
  assert.match(panel, /const\s+\{\s*signOut\s*\}\s*=\s*useAuth\(\)/);
  assert.match(panel, /signOut\(\{\s*redirectUrl:\s*['"]\/sign-in['"]\s*\}\)/);
});
