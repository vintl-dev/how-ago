import * as fs from 'node:fs/promises'
import { defineBuildConfig } from 'unbuild'
import * as path from 'pathe'

async function fileExists(fp: string) {
  try {
    await fs.access(fp)
    return true
  } catch (e) {
    return false
  }
}

export default defineBuildConfig({
  hooks: {
    async 'rollup:done'(ctx) {
      for (const buildEntry of ctx.buildEntries) {
        const p = path.resolve(ctx.options.outDir, buildEntry.path)

        if (path.extname(p) !== '.mjs') continue

        const basename = path.basename(p, '.mjs')

        const dtsPath = path.join(path.dirname(p), `${basename}.d.ts`)

        if (!(await fileExists(dtsPath))) continue

        const dmtsPath = path.join(path.dirname(p), `${basename}.d.mts`)

        await fs.rename(dtsPath, dmtsPath)
      }
    },
  },
})
