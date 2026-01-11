/* eslint-disable @typescript-eslint/no-var-requires */

const { cmpStr, cmpTuple, normalizePath } = require('../sort-utils')

describe('sort-utils: cmpStr', () => {
  it('returns 0 for identical strings', () => {
    expect(cmpStr('abc', 'abc')).toBe(0)
    expect(cmpStr('', '')).toBe(0)
  })

  it('returns -1 when first string is less', () => {
    expect(cmpStr('a', 'b')).toBe(-1)
    expect(cmpStr('abc', 'abd')).toBe(-1)
  })

  it('returns 1 when first string is greater', () => {
    expect(cmpStr('b', 'a')).toBe(1)
    expect(cmpStr('abd', 'abc')).toBe(1)
  })

  it('uses codepoint comparison (not locale-sensitive)', () => {
    // Uppercase letters come before lowercase in codepoint order
    expect(cmpStr('A', 'a')).toBe(-1)
    expect(cmpStr('Z', 'a')).toBe(-1)
  })

  it('coerces values to strings', () => {
    expect(cmpStr(123, 456)).toBe(-1)
    expect(cmpStr(456, 123)).toBe(1)
    expect(cmpStr(123, 123)).toBe(0)
  })

  it('handles null and undefined', () => {
    expect(cmpStr(null, null)).toBe(0)
    expect(cmpStr(undefined, undefined)).toBe(0)
    expect(cmpStr('null', null)).toBe(0)
  })
})

describe('sort-utils: cmpTuple', () => {
  it('returns 0 for identical tuples', () => {
    expect(cmpTuple(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(0)
    expect(cmpTuple([1, 2, 3], [1, 2, 3])).toBe(0)
  })

  it('returns result of first differing element', () => {
    expect(cmpTuple(['a', 'x', 'z'], ['a', 'y', 'a'])).toBe(-1)
    expect(cmpTuple(['a', 'y', 'a'], ['a', 'x', 'z'])).toBe(1)
  })

  it('shorter tuple comes first if all compared elements are equal', () => {
    expect(cmpTuple(['a', 'b'], ['a', 'b', 'c'])).toBe(-1)
    expect(cmpTuple(['a', 'b', 'c'], ['a', 'b'])).toBe(1)
  })

  it('handles empty tuples', () => {
    expect(cmpTuple([], [])).toBe(0)
    expect(cmpTuple([], ['a'])).toBe(-1)
    expect(cmpTuple(['a'], [])).toBe(1)
  })

  it('works with mixed types', () => {
    expect(cmpTuple(['file.ts', 10, '/api/foo'], ['file.ts', 20, '/api/bar'])).toBe(-1)
    expect(cmpTuple(['file.ts', 20, '/api/bar'], ['file.ts', 10, '/api/foo'])).toBe(1)
  })
})

describe('sort-utils: normalizePath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(normalizePath('app\\api\\foo\\route.ts')).toBe('app/api/foo/route.ts')
    expect(normalizePath('path\\to\\file.js')).toBe('path/to/file.js')
  })

  it('removes leading ./', () => {
    expect(normalizePath('./app/api/foo')).toBe('app/api/foo')
    expect(normalizePath('./file.ts')).toBe('file.ts')
  })

  it('handles paths without leading ./', () => {
    expect(normalizePath('app/api/foo')).toBe('app/api/foo')
  })

  it('handles mixed separators', () => {
    expect(normalizePath('.\\app\\api\\foo')).toBe('app/api/foo')
  })

  it('handles forward slashes as-is', () => {
    expect(normalizePath('app/api/foo/route.ts')).toBe('app/api/foo/route.ts')
  })

  it('coerces to string', () => {
    expect(normalizePath(123)).toBe('123')
  })
})

describe('sort-utils: deterministic sorting behavior', () => {
  it('produces stable, platform-independent results', () => {
    const items = [
      'zebra',
      'apple',
      'Zebra',
      'Apple',
      'banana',
      '10-item',
      '2-item',
      '20-item',
    ]

    const sorted = items.slice().sort(cmpStr)

    // Codepoint order: numbers < uppercase < lowercase
    // Note: This is NOT locale-sensitive sorting
    expect(sorted).toEqual([
      '10-item',
      '2-item',
      '20-item',
      'Apple',
      'Zebra',
      'apple',
      'banana',
      'zebra',
    ])
  })

  it('sorting is idempotent', () => {
    const items = ['z', 'a', 'm', 'b', 'y']
    const sorted1 = items.slice().sort(cmpStr)
    const sorted2 = sorted1.slice().sort(cmpStr)

    expect(sorted1).toEqual(sorted2)
  })
})
