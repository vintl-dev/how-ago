import {
  type IntlFormatters,
  type ResolvedIntlConfig,
  type FormatRelativeTimeOptions,
  type FormatDateOptions,
  IntlError,
  IntlErrorCode,
  type IntlShape,
} from '@formatjs/intl'

// Based on the original code from Omorphia, Modrinth
//
// MIT LICENSE - Copyright © 2022 Modrinth
// https://github.com/modrinth/omorphia/blob/0e1c7cd8ed1bea00e9063b6e11ca602f49342ba7/LICENSE.md
//
// Original code:
// https://github.com/modrinth/omorphia/blob/0e1c7cd8ed1bea00e9063b6e11ca602f49342ba7/src/utils/ago.ts

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const QUARTER = 3 * MONTH
const YEAR = 365 * DAY

/**
 * Represents an interval matcher which is a tuple of elements:
 *
 * - `0`: matching unit
 * - `1`: greater or equal constraint
 * - `2`: divisor for calculating, equals to greater or equal constraint if
 *   omitted
 */
type IntervalMatcher = [
  unit: Intl.RelativeTimeFormatUnitSingular,
  greaterOrEqual: number,
  divisor?: number,
]

const matchers: IntervalMatcher[] = [
  ['year', YEAR],
  ['quarter', QUARTER],
  ['month', MONTH],
  ['week', WEEK],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
  ['second', 0, SECOND],
]

type ToSingularUnit<
  U extends Intl.RelativeTimeFormatUnit | (string & Record<never, never>),
> = U extends 'years'
  ? Exclude<U, 'years'> | 'year'
  : U extends 'quarters'
  ? Exclude<U, 'quarters'> | 'quarter'
  : U extends 'months'
  ? Exclude<U, 'months'> | 'month'
  : U extends 'weeks'
  ? Exclude<U, 'weeks'> | 'week'
  : U extends 'days'
  ? Exclude<U, 'days'> | 'day'
  : U extends 'hours'
  ? Exclude<U, 'hours'> | 'hour'
  : U extends 'minutes'
  ? Exclude<U, 'minutes'> | 'minute'
  : U extends 'seconds'
  ? Exclude<U, 'seconds'> | 'second'
  : U

function normalizeUnit<
  U extends Intl.RelativeTimeFormatUnit | (string & Record<never, never>),
>(unit: U): ToSingularUnit<U> {
  for (const [knownUnit] of matchers) {
    if (knownUnit + 's' === unit) return knownUnit as ToSingularUnit<U>
  }

  return unit as ToSingularUnit<U>
}

/**
 * Describes a value within the time range that can be used as or converted to a
 * timestamp. It must be either a string which can be used to instantiate a new
 * {@link Date} object, a number containing UNIX time in milliseconds, or a
 * {@link Date} object.
 */
type DateTimeRangeValue = Date | string | number

/**
 * Describes a variant of time range that uses array to provide `from` (0) and
 * `to` (1) values.
 */
type DateTimeRangeArray = [from: DateTimeRangeValue, to?: DateTimeRangeValue]

/**
 * Describes a variant of time range that uses object form to provide `from` and
 * `to` values.
 */
type DateTimeRangeObject = { from: DateTimeRangeValue; to?: DateTimeRangeValue }

/**
 * Describes a time range type which can be a value which is used as `from`, an
 * array of values (`from` (0) and `to` (1)) or an object with properties `from`
 * and `to` which are also time range values.
 *
 * If `to` is not omitted, then it is assumed to be the current time at the
 * moment of interpretation.
 */
export type DateTimeRange =
  | DateTimeRangeValue
  | DateTimeRangeArray
  | DateTimeRangeObject

/**
 * Converts provided {@link DateTimeRangeValue} to an actual numeric timestamp,
 * time represented in milliseconds since 1st January 1970 (Epoch).
 *
 * @param value Value to convert.
 * @returns Time represented in milliseconds.
 */
function toTimestamp(value: DateTimeRangeValue): number {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'string') {
    return new Date(value).getTime()
  }

  return Number(value)
}

type Config = Pick<ResolvedIntlConfig, 'onError'>

export interface FormatOptions extends FormatRelativeTimeOptions {
  /**
   * Maximum unit after which formatting to relative time should be abandoned
   * and instead end date must be formatted using `dateTimeOptions`.
   *
   * If set to `'none'`, then time difference that exceeds `minimumUnit` will be
   * formatted in relative time.
   *
   * @default 'none'
   */
  maximumUnit?: Intl.RelativeTimeFormatUnit | 'none'

  /**
   * Minimum unit before which formatting to relative time should be abandoned
   * and instead end date must be formatted using `dateTimeOptions`.
   *
   * If set to `'none'`, then any time difference that does not exceed
   * `maximumUnit` will be formatted in relative time.
   *
   * @default 'none'
   */
  minimumUnit?: Intl.RelativeTimeFormatUnit | 'none'

  /**
   * Options for datetime formatting when it reaches the cut-off unit.
   *
   * @default { dateStyle: 'long', timeStyle: 'short' }
   */
  dateTimeOptions?: FormatDateOptions

  /**
   * Units to never use for relative time formatting.
   *
   * @default ['quarter']
   */
  excludedUnits?: Intl.RelativeTimeFormatUnit[]
}

type TimeSpan = [start: number, end: number]

function toTimeSpan(range: DateTimeRange): TimeSpan {
  let start: number
  let end: number

  if (typeof range === 'object') {
    if (range instanceof Date) {
      start = toTimestamp(range)
      end = Date.now()
    } else {
      const [from, to]: DateTimeRangeArray = Array.isArray(range)
        ? range
        : [range.from, range.to]

      start = toTimestamp(from)

      if (to == null) {
        end = Date.now()
      } else {
        end = toTimestamp(to)
      }
    }
  } else {
    start = toTimestamp(range)
    end = Date.now()
  }

  return [start, end]
}

function getExcludedUnits(options?: FormatOptions) {
  const excludedUnits: Intl.RelativeTimeFormatUnit[] = []

  const optionsExcludedUnits = options?.excludedUnits

  if (optionsExcludedUnits != null) {
    if (Array.isArray(optionsExcludedUnits)) {
      for (const unit of optionsExcludedUnits) excludedUnits.push(unit)
    } else {
      throw new TypeError(
        'Value is not of array type for formatTimeDifference options property excludedUnits',
      )
    }
  } else {
    excludedUnits.push('quarter')
  }

  return excludedUnits
}

function filterMatchers(options?: FormatOptions) {
  let filteredMatchers: IntervalMatcher[]

  const excludedUnits = getExcludedUnits(options)

  if (excludedUnits.length === 0) {
    filteredMatchers = matchers
  } else {
    filteredMatchers = [...matchers]

    for (const unit of excludedUnits) {
      const normalizedUnit = normalizeUnit(unit)

      const matcherToExcludeIndex = filteredMatchers.findIndex(
        (matcher) => matcher[0] === normalizedUnit,
      )

      if (matcherToExcludeIndex === -1) {
        throw new RangeError(
          `Value ${unit} out of range for formatTimeDifference options property excludedUnits`,
        )
      }

      filteredMatchers.splice(matcherToExcludeIndex, 1)
    }
  }

  return filteredMatchers
}

const unitNone = 'none'

function getMinimumMaximumUnits(
  options?: FormatOptions,
): readonly [
  minimumUnit: Intl.RelativeTimeFormatUnitSingular | 'none',
  maximumUnit: Intl.RelativeTimeFormatUnitSingular | 'none',
] {
  let minUnit = options?.minimumUnit ?? unitNone
  let maxUnit = options?.maximumUnit ?? unitNone

  if (minUnit !== unitNone) {
    minUnit = normalizeUnit(String(minUnit) as Intl.RelativeTimeFormatUnit)
  }

  if (maxUnit !== unitNone) {
    maxUnit = normalizeUnit(String(maxUnit) as Intl.RelativeTimeFormatUnit)
  }

  return [minUnit, maxUnit] as const
}

function calculateBoundaries(
  filteredMatchers: IntervalMatcher[],
  minimumUnit: string,
  maximumUnit: string,
): readonly [minimumUnitMatcherIndex: number, maximumUnitMatcherIndex: number] {
  const maximumUnitMatcherIndex =
    maximumUnit === unitNone
      ? 0
      : filteredMatchers.findIndex((matcher) => matcher[0] === maximumUnit)

  let minimumUnitMatcherIndex: number

  if (minimumUnit === unitNone) {
    minimumUnitMatcherIndex =
      filteredMatchers.length > 0 ? filteredMatchers.length - 1 : 0
  } else {
    minimumUnitMatcherIndex = filteredMatchers.findIndex(
      (matcher) => matcher[0] === minimumUnit,
    )
  }

  const minimumUnitGreaterThanMaximumUnit =
    minimumUnitMatcherIndex < maximumUnitMatcherIndex
  const minimumUnitOutOfRange =
    minimumUnit !== unitNone && minimumUnitMatcherIndex === -1
  const maximumUnitOutOfRange =
    maximumUnit !== unitNone && maximumUnitMatcherIndex === -1

  if (
    minimumUnitGreaterThanMaximumUnit ||
    minimumUnitOutOfRange ||
    maximumUnitOutOfRange
  ) {
    let invalidValue: string
    let invalidProperty: keyof FormatOptions

    if (minimumUnitOutOfRange || minimumUnitGreaterThanMaximumUnit) {
      invalidValue = minimumUnit
      invalidProperty = 'minimumUnit'
    } else if (maximumUnitOutOfRange) {
      invalidValue = maximumUnit
      invalidProperty = 'maximumUnit'
    }

    throw new RangeError(
      `Value ${invalidValue!} out of range for formatTimeDifference options property ${invalidProperty!}`,
    )
  }

  if (minimumUnitMatcherIndex === -1) {
    minimumUnitMatcherIndex = filteredMatchers.length - 1
  }

  return [minimumUnitMatcherIndex, maximumUnitMatcherIndex]
}

function tryAsRelativeTime(
  formatRelativeTime: IntlFormatters['formatRelativeTime'],
  from: number,
  to: number,
  options?: FormatOptions,
): string | null {
  const filteredMatchers = filterMatchers(options)

  if (filteredMatchers.length === 0) return null

  const [minimumUnit, maximumUnit] = getMinimumMaximumUnits(options)

  const [minimumUnitMatcherIndex, maximumUnitMatcherIndex] =
    calculateBoundaries(filteredMatchers, minimumUnit, maximumUnit)

  const diff = to - from
  const diffAbs = Math.abs(diff)

  for (
    let currentMatcherIndex = Math.max(maximumUnitMatcherIndex - 1, 0);
    currentMatcherIndex <= minimumUnitMatcherIndex;
    currentMatcherIndex++
  ) {
    const matcher = filteredMatchers[currentMatcherIndex]

    if (diffAbs < matcher[1]) continue

    if (currentMatcherIndex < maximumUnitMatcherIndex) break

    const roundedDivision = Math.round(
      diffAbs / matcher[matcher.length > 2 ? 2 : 1]!,
    )

    return formatRelativeTime(
      diff < 0 ? roundedDivision : -roundedDivision,
      matcher[0],
      {
        numeric: 'auto',
        ...options, // no worries about extra options, it'll weed them out
      },
    )
  }

  return null
}

/**
 * A function that, given a specific time range or just a start date, calculates
 * the time span between the two (if only the start date is provided, then the
 * end date is assumed to be the time of the call). It then chooses the most
 * suitable unit to display the span and returns a formatted string (e.g. ‘5
 * seconds ago’, ‘10 seconds ago’).
 *
 * It uses `Intl.RelativeTimeFormat` under the hood, with the option `numeric`
 * set to `'auto'` by default. This means the span, such as `+1` day, is
 * formatted as ‘tomorrow’ and `-1` day as ‘yesterday’. This default can be
 * overridden through the provided options to match the original behaviour of
 * `Intl.RelativeTimeFormat`, which is using `'always'` as the default for
 * `numeric`.
 *
 * @param config IntlShape config.
 * @param formatRelativeTime Formatter function.
 * @param range Range for which time span is calculated.
 * @param options Options for relative time formatter.
 * @returns The largest unit available to display the time.
 */
function formatRelativeTimeRange(
  this: void,
  { onError }: Config,
  formatRelativeTime: IntlFormatters<any>['formatRelativeTime'],
  formatDate: IntlFormatters<any>['formatDate'],
  range: DateTimeRange,
  options?: FormatOptions,
): string {
  const reportError = (err: unknown) =>
    onError(
      new IntlError(
        IntlErrorCode.FORMAT_ERROR,
        'Error formatting time difference.',
        err,
      ),
    )

  let from: number, to: number
  try {
    ;[from, to] = toTimeSpan(range)
  } catch (err) {
    reportError(err)
    return ''
  }

  try {
    const relative = tryAsRelativeTime(formatRelativeTime, from, to, options)

    if (relative != null) return relative
  } catch (err) {
    reportError(err)
  }

  try {
    return formatDate(
      from,
      options?.dateTimeOptions ?? {
        dateStyle: 'long',
        timeStyle: 'short',
      },
    )
  } catch (err) {
    reportError(err)
  }

  return ''
}

/**
 * Represents a formatter function that is bound to a specific {@link IntlShape}
 * which it uses to format relative time or date in the appropriate unit and
 * according to provided options.
 *
 * @see {@link formatRelativeTimeRange} for the information on how does the
 * formatter function works and its arguments.
 */
export type Formatter = typeof formatRelativeTimeRange extends (
  _provided0: any,
  _provided1: any,
  _provided2: any,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never

/**
 * Creates a function to cleverly format relative time using the provided
 * {@link IntlShape}.
 *
 * @param intl {@link IntlShape}, which methods to format relative time and date
 *   will be used.
 * @returns Bound {@link formatRelativeTimeRange} function.
 */
export function createFormatter(intl: IntlShape<any>): Formatter {
  return function boundFormatRelativeTimeRange(
    ...args: Parameters<Formatter>
  ): ReturnType<Formatter> {
    return formatRelativeTimeRange(
      intl,
      intl.formatRelativeTime,
      intl.formatDate,
      ...args,
    )
  }
}
