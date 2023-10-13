import { createIntl } from '@formatjs/intl'
import { test, expect, vi } from 'vitest'
import { type Formatter, createFormatter } from '../dist/index.mjs'

const now = new Date(2023, 0, 1, 0, 0, 0, 0).getTime()
const second = 1_000
const minute = second * 60
const hour = minute * 60
const day = hour * 24
const week = day * 7
const month = day * 30
const year = month * 12

vi.useFakeTimers()
vi.setSystemTime(now)

const intl = createIntl({
  locale: 'uk',
  defaultLocale: 'en-US',
})

const ago: Formatter = createFormatter(intl)

function withAbnormalSpacesReplaced(value: string) {
  return value.replace(/[\u202F\u00A0]/g, ' ')
}

test('formatTimeDifference (number/date)', () => {
  const fiveSecondsInPast = now - 5 * second

  const fiveSecondsAgoUk = '5 секунд тому'

  expect(ago(fiveSecondsInPast)).toBe(fiveSecondsAgoUk)

  expect(ago(new Date(fiveSecondsInPast))).toBe(fiveSecondsAgoUk)
})

test('formatTimeDifference (ranges)', () => {
  const fiveSecondsInFuture = now + 5 * second

  const inFiveSecondsUk = 'через 5 секунд'

  expect(ago({ from: fiveSecondsInFuture })).toBe(inFiveSecondsUk)

  expect(ago({ from: new Date(fiveSecondsInFuture) })).toBe(inFiveSecondsUk)

  expect(ago([fiveSecondsInFuture])).toBe(inFiveSecondsUk)

  expect(ago([new Date(fiveSecondsInFuture)])).toBe(inFiveSecondsUk)

  const tenSecondsInFuture = now + 10 * second

  const fiveSecondsAgoUk = '5 секунд тому'

  expect(
    ago({
      from: fiveSecondsInFuture,
      to: tenSecondsInFuture,
    }),
  ).toBe(fiveSecondsAgoUk)

  expect(
    ago({
      from: new Date(fiveSecondsInFuture),
      to: new Date(tenSecondsInFuture),
    }),
  ).toBe(fiveSecondsAgoUk)

  expect(ago([fiveSecondsInFuture, tenSecondsInFuture])).toBe(fiveSecondsAgoUk)

  expect(
    ago([new Date(fiveSecondsInFuture), new Date(tenSecondsInFuture)]),
  ).toBe(fiveSecondsAgoUk)
})

test('formatTimeDifference (yesterday/tomorrow)', () => {
  const tomorrow = now + day
  const yesterday = now - day

  const tomorrowUk = 'завтра'
  const yesterdayUk = 'учора'

  expect(ago(tomorrow)).toBe(tomorrowUk)
  expect(ago(yesterday)).toBe(yesterdayUk)
})

test('formatTimeDifference (max unit)', () => {
  expect(
    ago(now + year, {
      maximumUnit: 'months',
    }),
  ).not.toBe('наступного року')

  expect(
    ago(now + 2 * week, {
      maximumUnit: 'months',
    }),
  ).toBe('через 2 тижні')
})

test('formatTimeDifference (min unit)', () => {
  expect(
    ago(now + year, {
      minimumUnit: 'months',
    }),
  ).toBe('через 12 місяців')

  expect(
    ago(now + 2 * week, {
      minimumUnit: 'months',
    }),
  ).not.toBe('через 2 тижні')
})

test('formatTimeDifference (units exclusion)', () => {
  expect(
    ago(now + 2 * week, {
      excludedUnits: ['weeks'],
    }),
  ).toBe('через 14 днів')
})

test('formatTimeDifference (all units excluded)', () => {
  expect(
    withAbnormalSpacesReplaced(
      ago(now, {
        excludedUnits: [
          'years',
          'quarters',
          'months',
          'weeks',
          'days',
          'hours',
          'minutes',
          'seconds',
        ],
      }),
    ),
  ).toBe('1 січня 2023 р. о 00:00')
})

test('formatTimeDifference (halfCeil rounding method)', () => {
  const twoSthnYearsInPast = now - year * 2.7
  const twoSthnYearsInFuture = now + year * 2.7

  expect(ago(twoSthnYearsInPast)).toMatchInlineSnapshot('"2 роки тому"')

  expect(ago(twoSthnYearsInFuture)).toMatchInlineSnapshot('"через 2 роки"')

  expect(
    ago(twoSthnYearsInPast, { roundingMode: 'halfCeil' }),
  ).toMatchInlineSnapshot('"3 роки тому"')

  expect(
    ago(twoSthnYearsInFuture, { roundingMode: 'halfCeil' }),
  ).toMatchInlineSnapshot('"через 3 роки"')
})

test('formatTimeDifference (with unitRounding)', () => {
  const fiftyNineSthnMinutesAgo = now - 59.6 * minute
  const twentyThreeSthnHoursInFuture = now + 23.5 * hour

  expect(
    ago(fiftyNineSthnMinutesAgo, {
      roundingMode: 'halfExpand',
      unitRounding: false,
    }),
  ).toMatchInlineSnapshot('"60 хвилин тому"')

  expect(
    ago(twentyThreeSthnHoursInFuture, {
      roundingMode: 'halfExpand',
      unitRounding: false,
    }),
  ).toMatchInlineSnapshot('"через 24 години"')

  expect(
    ago(fiftyNineSthnMinutesAgo, {
      roundingMode: 'halfExpand',
      unitRounding: true,
    }),
  ).toMatchInlineSnapshot('"1 годину тому"')

  expect(
    ago(twentyThreeSthnHoursInFuture, {
      roundingMode: 'halfExpand',
      unitRounding: true,
    }),
  ).toMatchInlineSnapshot('"завтра"')
})

// TODO: more tests + coverage
