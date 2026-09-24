import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: false,
    __GLOBAL__: false,
    __ESM_BUNDLER__: true,
    __ESM_BROWSER__: false,
    __CJS__: true,
    __SSR__: true,
    __COMPAT__: true,
    __VERSION__: '"test"',
    __FEATURE_OPTIONS_API__: true,
    __FEATURE_PROD_DEVTOOLS__: false,
    __FEATURE_SUSPENSE__: true,
    __FEATURE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  test: {
    include: ['packages/**/__tests__/**/*.spec.ts'],
    environment: 'node',
    globals: true,
  },
})
