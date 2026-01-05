/**
 * Jest Test Setup
 * 
 * Global test configuration for React component testing
 */

import '@testing-library/jest-dom'

// Jest runs in a jsdom environment, which may not provide all Web APIs that
// Next.js route handlers (next/server) and our hashing utilities expect.
// Keep this minimal and deterministic.
import { TextDecoder, TextEncoder } from 'node:util'
import { webcrypto } from 'node:crypto'
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'

if (!globalThis.TextEncoder) {
	globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder
}

if (!globalThis.TextDecoder) {
	globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder
}


// jsdom may provide `crypto` but without WebCrypto (`crypto.subtle`).
// Our hashing utilities require `crypto.subtle.digest`.
if (!globalThis.crypto || !('subtle' in globalThis.crypto) || !globalThis.crypto.subtle) {
	Object.defineProperty(globalThis, 'crypto', {
		value: webcrypto as unknown as Crypto,
		configurable: true,
	})
}

if (!globalThis.ReadableStream) {
	globalThis.ReadableStream = ReadableStream as unknown as typeof globalThis.ReadableStream
}

if (!globalThis.WritableStream) {
	globalThis.WritableStream = WritableStream as unknown as typeof globalThis.WritableStream
}

if (!globalThis.TransformStream) {
	globalThis.TransformStream = TransformStream as unknown as typeof globalThis.TransformStream
}

// NOTE: Do NOT polyfill MessageChannel via node:worker_threads.
// React's scheduler will use MessageChannel when available, and real worker-thread
// MessagePorts keep the event loop alive, causing Jest to hang after tests.
// undici's WebIDL layer may reference MessagePort at module init, so we provide a
// minimal stub only if needed.
if (!globalThis.MessagePort) {
	class MinimalMessagePort {}
	globalThis.MessagePort = MinimalMessagePort as unknown as typeof globalThis.MessagePort
}

// Prefer native fetch APIs if they exist; otherwise fall back to undici.
// Important: load undici only AFTER TextEncoder/TextDecoder are present.
if (!globalThis.fetch || !globalThis.Request || !globalThis.Response || !globalThis.Headers) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const undici = require('undici') as typeof import('undici')
	const usingUndiciFetch = !globalThis.fetch
	const undiciRuntime = undici as typeof undici & {
		Blob?: typeof Blob
		File?: typeof File
	}

	if (!globalThis.fetch) {
		globalThis.fetch = undici.fetch as unknown as typeof globalThis.fetch
	}

	if (!globalThis.Headers) {
		globalThis.Headers = undici.Headers as unknown as typeof globalThis.Headers
	}

	if (!globalThis.Request) {
		globalThis.Request = undici.Request as unknown as typeof globalThis.Request
	}

	if (!globalThis.Response) {
		globalThis.Response = undici.Response as unknown as typeof globalThis.Response
	}

	// If we’re using undici fetch/Request in a jsdom environment, align multipart
	// primitives too. jsdom’s FormData can be incompatible with undici’s parser,
	// causing `request.formData()` to throw.
	if (usingUndiciFetch) {
		if (undici.FormData) {
			globalThis.FormData = undici.FormData as unknown as typeof globalThis.FormData
		}
		if (undiciRuntime.Blob) {
			globalThis.Blob = undiciRuntime.Blob as unknown as typeof globalThis.Blob
		}
		if (undiciRuntime.File) {
			globalThis.File = undiciRuntime.File as unknown as typeof globalThis.File
		}
	}
}
