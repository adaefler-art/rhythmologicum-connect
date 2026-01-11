/**
 * Deterministic sorting utilities for endpoint-catalog.
 *
 * All comparison functions use stable codepoint-based comparison
 * to ensure platform-independent, reproducible output.
 *
 * NO locale-sensitive or case-insensitive comparisons are used.
 */

/**
 * Compare two values using deterministic codepoint ordering.
 *
 * This avoids localeCompare to ensure stable, platform-independent sorting.
 * All values are coerced to strings and compared using Unicode codepoint order.
 *
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
function cmpStr(a, b) {
  const sa = String(a)
  const sb = String(b)
  if (sa === sb) return 0
  return sa < sb ? -1 : 1
}

/**
 * Compare two tuples (arrays) element by element using cmpStr.
 *
 * Useful for multi-field sorting where you want to compare by multiple keys.
 * Returns the comparison result of the first differing element.
 *
 * @param {Array<any>} tupleA - First tuple
 * @param {Array<any>} tupleB - Second tuple
 * @returns {number} -1 if tupleA < tupleB, 0 if equal, 1 if tupleA > tupleB
 */
function cmpTuple(tupleA, tupleB) {
  const lenA = tupleA.length
  const lenB = tupleB.length
  const minLen = Math.min(lenA, lenB)

  for (let i = 0; i < minLen; i += 1) {
    const cmp = cmpStr(tupleA[i], tupleB[i])
    if (cmp !== 0) return cmp
  }

  // If all compared elements are equal, shorter tuple comes first
  if (lenA < lenB) return -1
  if (lenA > lenB) return 1
  return 0
}

/**
 * Normalize a path for deterministic comparison.
 *
 * - Converts backslashes to forward slashes (Windows compatibility)
 * - Removes leading './' if present
 *
 * @param {string} p - Path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(p) {
  return String(p)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
}

module.exports = {
  cmpStr,
  cmpTuple,
  normalizePath,
}
