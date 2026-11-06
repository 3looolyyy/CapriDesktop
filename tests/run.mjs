import { build } from 'esbuild'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const mock = (file) => path.resolve('tests', file)
await build({
  entryPoints: ['tests/mac.test.ts'],
  outfile: 'work/tests.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  plugins: [
    {
      name: 'test-only-mocks',
      setup(b) {
        b.onResolve({ filter: /^electron$/ }, () => ({ path: mock('electron-mock.ts') }))
        b.onResolve({ filter: /mac-desktop$/ }, () => ({ path: mock('native-mock.ts') }))
        b.onResolve(
          { filter: /agent-manager$|scanner-service$|llm-gateway$|user-profile$|agents\/tools\/tool-executor$|windows\/window-manager$/ },
          () => ({ path: mock('dependency-mock.ts') }),
        )
      },
    },
  ],
})
execFileSync(process.execPath, ['--test', 'work/tests.cjs'], { stdio: 'inherit' })
