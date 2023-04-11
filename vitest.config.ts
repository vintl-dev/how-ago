/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import tsconfig from './tsconfig.tests.json'

export default defineConfig({
  esbuild: {
    tsconfigRaw: tsconfig as any,
  },
})
