/* eslint-disable no-var, import/no-mutable-exports */

// ICU calls "expand" "up" and "trunc" "down".

/** @returns Always positive decimal part of the number. */
var toDecimal = (value: number) => Math.abs(value % 1)

var isEqual = (a: number, b: number) => Math.abs(a - b) < Number.EPSILON

var isGreaterOrEqual = (a: number, b: number) => a > b || isEqual(a, b)

var isEven = (value: number) => Math.abs(value) % 2 < 1

var nonZero = (value: number) => (Object.is(value, -0) ? 0 : value)

/** Round towards positive infinity. */
var ceil = (value: number) => nonZero(Math.ceil(value))

/** Round towards negative infinity. */
var floor = (value: number) => nonZero(Math.floor(value))

/** Round away from zero. */
var expand = (value: number) => (value >= 0 ? ceil(value) : floor(value))

/** Round toward zero. */
var trunc = (value: number) => (value >= 0 ? floor(value) : ceil(value))

/** Ties toward positive infinity */
var halfCeil = (value: number) => {
  var decimal = toDecimal(value)

  if (value >= 0) {
    return isGreaterOrEqual(decimal, 0.5) ? ceil(value) : floor(value)
  } else {
    return decimal > 0.5 ? floor(value) : ceil(value)
  }
}

/** Ties toward negative infinity. */
var halfFloor = (value: number) => {
  var decimal = toDecimal(value)

  if (value >= 0) {
    return decimal > 0.5 ? ceil(value) : floor(value)
  } else {
    return isGreaterOrEqual(decimal, 0.5) ? floor(value) : ceil(value)
  }
}

/** Ties away from zero. */
var halfExpand = (value: number) => {
  var decimal = toDecimal(value)

  if (value >= 0) {
    return isGreaterOrEqual(decimal, 0.5) ? ceil(value) : floor(value)
  } else {
    return isGreaterOrEqual(decimal, 0.5) ? floor(value) : ceil(value)
  }
}

/** Ties towards zero. */
var halfTrunc = (value: number) => {
  var decimal = toDecimal(value)

  if (value > 0) {
    return decimal > 0.5 ? ceil(value) : floor(value)
  } else {
    return decimal > 0.5 ? floor(value) : ceil(value)
  }
}

var halfEven = (value: number) => {
  var decimal = toDecimal(value)

  if (value >= 0) {
    if (isEqual(decimal, 0.5)) {
      return isEven(value) ? floor(value) : ceil(value)
    }

    return decimal > 0.5 ? ceil(value) : floor(value)
  } else {
    if (isEqual(decimal, 0.5)) {
      return isEven(value) ? ceil(value) : floor(value)
    }

    return decimal > 0.5 ? floor(value) : ceil(value)
  }
}

export {
  ceil,
  floor,
  expand,
  trunc,
  halfCeil,
  halfFloor,
  halfExpand,
  halfTrunc,
  halfEven,
}
