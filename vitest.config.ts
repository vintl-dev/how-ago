/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import tsconfig from './tsconfig.tests.json'

export default defineConfig({
  test: {
    deps: {
      registerNodeLoader: true,
    },
  },
  esbuild: {
    tsconfigRaw: tsconfig as any,
  },
})
