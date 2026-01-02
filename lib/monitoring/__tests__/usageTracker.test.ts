/**
 * Tests for usageTracker utility
 * TV05_01: Verify PHI-free usage tracking
 */

import fs from 'fs/promises'
import path from 'path'
import {
  recordUsage,
  getAggregatedUsage,
  clearUsageData,
  getStatusCodeBucket,
  type StatusCodeBucket,
  type AggregatedUsage,
} from '../usageTracker'

const USAGE_DATA_DIR = path.join(process.cwd(), '.usage-telemetry')
const USAGE_DATA_FILE = path.join(USAGE_DATA_DIR, 'usage-data.json')

describe('usageTracker', () => {
  beforeEach(async () => {
    // Clean up before each test
    await clearUsageData()
  })

  afterEach(async () => {
    // Clean up after each test
    await clearUsageData()
  })

  describe('getStatusCodeBucket', () => {
    it('returns 2xx for success codes', () => {
      expect(getStatusCodeBucket(200)).toBe('2xx')
      expect(getStatusCodeBucket(201)).toBe('2xx')
      expect(getStatusCodeBucket(204)).toBe('2xx')
    })

    it('returns 3xx for redirect codes', () => {
      expect(getStatusCodeBucket(301)).toBe('3xx')
      expect(getStatusCodeBucket(302)).toBe('3xx')
      expect(getStatusCodeBucket(304)).toBe('3xx')
    })

    it('returns 4xx for client error codes', () => {
      expect(getStatusCodeBucket(400)).toBe('4xx')
      expect(getStatusCodeBucket(401)).toBe('4xx')
      expect(getStatusCodeBucket(403)).toBe('4xx')
      expect(getStatusCodeBucket(404)).toBe('4xx')
    })

    it('returns 5xx for server error codes', () => {
      expect(getStatusCodeBucket(500)).toBe('5xx')
      expect(getStatusCodeBucket(502)).toBe('5xx')
      expect(getStatusCodeBucket(503)).toBe('5xx')
    })
  })

  describe('recordUsage', () => {
    it('records a single usage event', async () => {
      await recordUsage({
        routeKey: 'POST /api/amy/stress-report',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      const data = await getAggregatedUsage()
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        routeKey: 'POST /api/amy/stress-report',
        count: 1,
        env: 'test',
        statusBuckets: {
          '2xx': 1,
          '3xx': 0,
          '4xx': 0,
          '5xx': 0,
        },
      })
      expect(data[0].lastSeenAt).toBeDefined()
    })

    it('aggregates multiple events for the same route', async () => {
      await recordUsage({
        routeKey: 'POST /api/amy/stress-report',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      await recordUsage({
        routeKey: 'POST /api/amy/stress-report',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      await recordUsage({
        routeKey: 'POST /api/amy/stress-report',
        statusCodeBucket: '4xx',
        env: 'test',
      })

      const data = await getAggregatedUsage()
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        routeKey: 'POST /api/amy/stress-report',
        count: 3,
        env: 'test',
        statusBuckets: {
          '2xx': 2,
          '3xx': 0,
          '4xx': 1,
          '5xx': 0,
        },
      })
    })

    it('tracks different routes separately', async () => {
      await recordUsage({
        routeKey: 'POST /api/amy/stress-report',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      await recordUsage({
        routeKey: 'POST /api/consent/record',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      await recordUsage({
        routeKey: 'GET /api/content/resolve',
        statusCodeBucket: '4xx',
        env: 'test',
      })

      const data = await getAggregatedUsage()
      expect(data).toHaveLength(3)

      const routes = data.map((d) => d.routeKey).sort()
      expect(routes).toEqual([
        'GET /api/content/resolve',
        'POST /api/amy/stress-report',
        'POST /api/consent/record',
      ])
    })

    it('updates lastSeenAt on each event', async () => {
      await recordUsage({
        routeKey: 'POST /api/test',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      const firstData = await getAggregatedUsage()
      const firstTimestamp = firstData[0].lastSeenAt

      // Wait a tiny bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10))

      await recordUsage({
        routeKey: 'POST /api/test',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      const secondData = await getAggregatedUsage()
      const secondTimestamp = secondData[0].lastSeenAt

      expect(secondTimestamp).not.toBe(firstTimestamp)
      expect(new Date(secondTimestamp).getTime()).toBeGreaterThan(
        new Date(firstTimestamp).getTime(),
      )
    })

    it('uses NODE_ENV when env not specified', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await recordUsage({
        routeKey: 'POST /api/test',
        statusCodeBucket: '2xx',
      })

      const data = await getAggregatedUsage()
      expect(data[0].env).toBe('production')

      process.env.NODE_ENV = originalEnv
    })

    it('does not throw on file system errors', async () => {
      // This should not throw even if there are file system issues
      await expect(
        recordUsage({
          routeKey: 'POST /api/test',
          statusCodeBucket: '2xx',
          env: 'test',
        }),
      ).resolves.not.toThrow()
    })
  })

  describe('getAggregatedUsage', () => {
    it('returns empty array when no data exists', async () => {
      const data = await getAggregatedUsage()
      expect(data).toEqual([])
    })

    it('sorts by lastSeenAt descending', async () => {
      await recordUsage({
        routeKey: 'POST /api/route1',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      await recordUsage({
        routeKey: 'POST /api/route2',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      await recordUsage({
        routeKey: 'POST /api/route3',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      const data = await getAggregatedUsage()
      expect(data).toHaveLength(3)

      // Most recent first
      expect(data[0].routeKey).toBe('POST /api/route3')
      expect(data[1].routeKey).toBe('POST /api/route2')
      expect(data[2].routeKey).toBe('POST /api/route1')
    })
  })

  describe('clearUsageData', () => {
    it('removes all usage data', async () => {
      await recordUsage({
        routeKey: 'POST /api/test',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      let data = await getAggregatedUsage()
      expect(data).toHaveLength(1)

      await clearUsageData()

      data = await getAggregatedUsage()
      expect(data).toEqual([])
    })

    it('does not throw when file does not exist', async () => {
      await expect(clearUsageData()).resolves.not.toThrow()
    })
  })

  describe('PHI compliance', () => {
    it('does not store user IDs', async () => {
      await recordUsage({
        routeKey: 'POST /api/amy/stress-report',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      const data = await getAggregatedUsage()
      const jsonString = JSON.stringify(data)

      // Verify no common PHI fields
      expect(jsonString).not.toMatch(/userId/i)
      expect(jsonString).not.toMatch(/user_id/i)
      expect(jsonString).not.toMatch(/patientId/i)
      expect(jsonString).not.toMatch(/patient_id/i)
      expect(jsonString).not.toMatch(/assessmentId/i)
      expect(jsonString).not.toMatch(/assessment_id/i)
    })

    it('does not store request details beyond route and status', async () => {
      await recordUsage({
        routeKey: 'POST /api/consent/record',
        statusCodeBucket: '2xx',
        env: 'test',
      })

      const data = await getAggregatedUsage()
      const usage = data[0]

      // Only allowed fields
      expect(Object.keys(usage).sort()).toEqual([
        'count',
        'env',
        'lastSeenAt',
        'routeKey',
        'statusBuckets',
      ])
    })

    it('stores only routeKey, count, lastSeenAt, statusBuckets, env', async () => {
      await recordUsage({
        routeKey: 'GET /api/content/resolve',
        statusCodeBucket: '4xx',
        env: 'production',
      })

      const data = await getAggregatedUsage()
      const usage = data[0]

      expect(usage).toHaveProperty('routeKey')
      expect(usage).toHaveProperty('count')
      expect(usage).toHaveProperty('lastSeenAt')
      expect(usage).toHaveProperty('statusBuckets')
      expect(usage).toHaveProperty('env')

      // No other properties
      expect(Object.keys(usage).length).toBe(5)
    })
  })
})
