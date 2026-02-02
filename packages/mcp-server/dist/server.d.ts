/**
 * E76.1: MCP Server Entry Point
 *
 * Provides health endpoint and MCP tool execution API.
 * Can be started as standalone server or imported as module.
 */
import http from 'node:http';
export declare function createServer(): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export declare function startServer(): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
//# sourceMappingURL=server.d.ts.map