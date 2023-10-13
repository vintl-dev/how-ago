import { describe, it, expect } from 'vitest'
import * as roundingModesImpls from '../src/utils/rounding.ts'
import roundingSamples from './data/rounding-samples.ts'

type RoundingMode = keyof typeof roundingModesImpls

describe('rounding modes', () => {
  for (const { roundingMode, samples } of roundingSamples) {
    it(`rounds correctly in "${roundingMode}"`, () => {
      expect(
        roundingModesImpls,
        `${roundingMode} is implemented`,
      ).toHaveProperty(roundingMode)

      for (const { value, result } of samples) {
        expect(
          roundingModesImpls[roundingMode as RoundingMode](value),
          `Value ${value} is rounded to ${result}`,
        ).toEqual(result)
      }
    })
  }
})
