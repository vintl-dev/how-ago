# **@vintl/how-ago**

> Relative time with `@formatjs/intl` made easy.

[![Supports: ESM only.](https://img.shields.io/static/v1?label=Format&message=ESM%20only&color=blue&style=flat-square)](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) [![Depends on @formatjs/intl.](https://img.shields.io/static/v1?label=Requires&message=%40formatjs%2Fintl&color=lightgray&style=flat-square)][formatjs_intl] [![Support the author.](https://img.shields.io/static/v1?label=&message=Support+the+author&color=5E8C61&style=flat-square&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtaGVhcnQiPjxwYXRoIGQ9Ik0xOSAxNGMxLjQ5LTEuNDYgMy0zLjIxIDMtNS41QTUuNSA1LjUgMCAwIDAgMTYuNSAzYy0xLjc2IDAtMyAuNS00LjUgMi0xLjUtMS41LTIuNzQtMi00LjUtMkE1LjUgNS41IDAgMCAwIDIgOC41YzAgMi4zIDEuNSA0LjA1IDMgNS41bDcgN1oiLz48L3N2Zz4%3D)](https://github.com/Brawaru/Brawaru/blob/main/SUPPORT.md)

## **Summary**

[`Intl.RelativeTimeFormat`] offers a way to localize relative time, like ‘1 day ago‘ or ‘in 1 year’. Unfortunately, it's very bare bones and does not perform any calculations, so you have to manually choose the unit of time and then amount of that unit.

This module provides an easy binding for [`@formatjs/intl`][formatjs_intl] to automatically calculate the most suitable unit based on formatting options and a time range, and then format the range with that unit.

[`Intl.RelativeTimeFormat`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
[formatjs_intl]: https://npm.im/@formatjs/intl

## **Example**

```ts
import { createIntl } from '@formatjs/intl'
import { createFormatter } from '@vintl/how-ago'

const intl = createIntl({ locale: 'en-US' })

const ago = createFormatter(intl)

const oneDay = 86400000 // ms

console.log(ago(Date.now() - oneDay))
// => "yesterday"

console.log(ago(Date.now() + oneDay * 2))
// => "in 2 days"
```

## **API**

### **`createFormatter`**

A function that creates a function to format relative time using the provided [`IntlShape`][intl_shape].

**Parameters**:

- `intl` ([`IntlShape`][intl_shape]) — IntlShape, which methods to format relative time or date will be used.

**Returns**: [`Formatter`](#formatter) — Formatter function.

[intl_shape]: https://formatjs.io/docs/intl/#intlshape

### **Formatter**

A function that, given a specific time range or just a start date, calculates the time span between the two (if only the start date is provided, then the end date is assumed to be the time of the call). It then chooses the most suitable unit to display the span and returns a formatted string (e.g. ‘5 seconds ago’, ‘10 seconds ago’).

It uses [`Intl.RelativeTimeFormat`] under the hood, with the option [`numeric`] set to `'auto'` by default. This means the span, such as `+1` day, is formatted as ‘tomorrow’ and `-1` day as ‘yesterday’. This default can be overridden through the provided options to match the original behaviour of [`Intl.RelativeTimeFormat`], which is using `'always'` as the default for [`numeric`].

[`numeric`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat#numeric

**Parameters**:

- `range` ([`DateTimeRange`](#datetimerange)) — Range for which time span is calculated.
- `options` ([`FormatOptions`](#formatoptions)) — Options for relative time formatter.

**Returns**: `string` — Formatted relative time or date used the most suitable unit or date formatting according to the provided options.

### **`DateTimeRange`**

Describes a time range type which can be a value which is used as from, an array of values (`from` (1st element) and `to` (2nd element)) or an object with properties `from` and `to` which are also [time range values](#datetimerangevalue).

If `to` is not omitted, then it is assumed to be the current time at the moment of interpretation.

### **`DateTimeRangeValue`**

Describes a value within the time range that can be used as or converted to a timestamp. It must be either a string which can be used to instantiate a new [Date][date_global] object, a number containing UNIX time in milliseconds, or a [Date][date_global] object.

[date_global]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

### `FormatOptions`

**Extends**: [`Intl.RelativeTimeFormatOptions`] (omitted: `localeMatcher`) & `{ format?: string }`.

[`Intl.RelativeTimeFormatOptions`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat#options

**Properties**:

- `maximumUnit?` ([`Intl.RelativeTimeFormatUnit`] or `'none'`)

  Maximum unit after which formatting to relative time should be abandoned and instead end date must be formatted using `dateTimeOptions`.

  If set to `'none'`, any time difference that does not exceed `minimumUnit` will be formatted in relative time.

  **Default**: `'none'`.

- `minimumUnit?` ([`Intl.RelativeTimeFormatUnit`] or `'none'`)

  Minimum unit before which formatting to relative time should be abandoned and instead end date must be formatted using `dateTimeOptions`.

  If set to `'none'`, any time difference that does not exceed `maximumUnit` will be formatted in relative time.

  **Default**: `'none'`.

- `dateTimeOptions?` ([`Intl.DateTimeFormatOptions`] (omitted: `localeMatcher`) & `{ format?: string }`)

  Options for datetime formatting when it reaches the cut-off unit.

  **Default**: `{ dateStyle: 'long', timeStyle: 'short' }`

- `excludedUnits?` (Array of [`Intl.RelativeTimeFormatUnit`][intl_relTimeUnit])

  Units to never use for relative time formatting.

  **Default**: `['quarter']`

- `roundingMode?` ([`RoundingMode`] or `null`)

  Rounding mode to use when the resulting duration is not an integer (e.g., 4.7 seconds).

  It is roughly equivalent to the `roundingMode` option for the [`Intl.NumberFormat`] API and accepts the following options:

  - `ceil` — round towards positive infinity.
  - `floor` — round towards negative infinity.
  - `expand` — round away from 0.
  - `trunc` — round towards 0.
  - `halfCeil` — round values below or at half-increment towards positive infinity, and values above away from 0.
  - `halfFloor` — round values below or at half-increment towards negative infinity, and values above away from 0.
  - `halfExpand` — round values above or at half-increment away from 0, and values below towards 0.
  - `halfTrunc` — round values below or at half-increment towards 0, and values above away from 0.
  - `halfEven` — round values at half-increment towards the nearest even value, values above it away from 0, and values below it towards 0.

  Value of `null` will use `Math.round`. This value is only kept for backward compatibility and will be removed in the next major release, in which `"trunc"` will be made the new default.

  **Default**: `null`.

- `unitRounding?` (`boolean`)

  Whether to round to the nearest unit if the rounded duration goes above the threshold for the current unit.

  For example, if 59.7 minutes round to 60 minutes, and this option is enabled, the duration will be rounded to use hour units, thus returning `"1 hour"`. Otherwise, the result of 60 minutes will be returned as is — `"60 minutes"`.

  By default, this option is disabled (`false`) when the `roundingMode` is set to `null`, but enabled (`true`) otherwise. This will change in the next major update, in which this option will always be enabled (`true`) by default, regardless of the `roundingMode`.

  **Default**: `false` (when `roundingMode` is `null`) or `true` (otherwise).

[`Intl.NumberFormat`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
[`Intl.DateTimeFormatOptions`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
[`Intl.RelativeTimeFormatUnit`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/format#unit

### `RoundingMode`

[`RoundingMode`]: #roundingmode

String literal for one of the supported rounding modes.

**Possible values**: `"ceil"`, `"floor"`, `"expand"`, `"trunc"`, `"halfCeil"`, `"halfFloor"`, `"halfExpand"`, `"halfTrunc"`, `"halfEven"`.

## Acknowledgements

This implementation is based on [the implementation][omorphia_impl] from Modrinth's [Omorphia] project.

[Omorphia]: https://github.com/modrinth/omorphia/
[omorphia_impl]: https://github.com/modrinth/omorphia/blob/87251878a582616d65301aa9881b3ac585ace97e/src/utils/ago.ts

## Credits

Made with 💜 by [Brawaru](https://github.com/brawaru). Released under [MIT Licence](./LICENSE).

<a href="https://github.com/Brawaru/Brawaru/blob/main/SUPPORT.md"><img alt="Support me by donating" height="56" src="https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/cozy/donate/generic-singular_vector.svg"></a>
