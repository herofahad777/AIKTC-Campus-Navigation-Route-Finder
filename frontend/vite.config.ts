/// <reference types="vitest/config" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vite Dev Server Plugin: Automated C Navigation Engine Bridge
 *
 * Automatically compiles `frontend/src/engine/routefinder.c` (if not compiled)
 * and executes `routefinder.exe` to calculate shortest-path BFS routes.
 * If `.c` or `.exe` is unavailable or compilation fails, responds with `{ available: false }`
 * so the frontend can display the appropriate warning and fall back to demo simulation.
 */
function cEngineAutoRunnerPlugin(): Plugin {
  return {
    name: 'vite-plugin-c-engine-auto-runner',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', '*');
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const engineDir = path.resolve(import.meta.dirname, 'src', 'engine');
        const isWindows = process.platform === 'win32';
        const binaryName = isWindows ? 'routefinder.exe' : 'routefinder';
        const binaryPath = path.join(engineDir, binaryName);
        const sourcePath = path.join(engineDir, 'routefinder.c');

        // GET /api/engine/status
        if (req.url === '/api/engine/status' && req.method === 'GET') {
          const hasSource = fs.existsSync(sourcePath);
          let hasBinary = fs.existsSync(binaryPath);

          if (hasSource && !hasBinary) {
            try {
              execSync(`gcc -Wall -O2 routefinder.c -o ${binaryName}`, {
                cwd: engineDir,
                timeout: 10000,
              });
              hasBinary = fs.existsSync(binaryPath);
            } catch {
              // GCC compilation failed or not available
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              available: hasBinary,
              hasSource,
              hasBinary,
              sourceFile: 'frontend/src/engine/routefinder.c',
              binaryName,
            })
          );
          return;
        }

        // POST /api/engine/route
        if (req.url === '/api/engine/route' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { source, destination } = JSON.parse(body || '{}');
              if (!source || !destination) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ available: false, error: 'Missing source or destination' }));
                return;
              }

              const hasSource = fs.existsSync(sourcePath);
              if (!hasSource) {
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    available: false,
                    error: 'Source file frontend/src/engine/routefinder.c not found.',
                  })
                );
                return;
              }

              let hasBinary = fs.existsSync(binaryPath);
              if (!hasBinary) {
                try {
                  execSync(`gcc -Wall -O2 routefinder.c -o ${binaryName}`, {
                    cwd: engineDir,
                    timeout: 10000,
                  });
                  hasBinary = fs.existsSync(binaryPath);
                } catch (compileErr) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      available: false,
                      error: 'Failed to compile routefinder.c with GCC.',
                      details: String(compileErr),
                    })
                  );
                  return;
                }
              }

              if (!hasBinary) {
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    available: false,
                    error: 'routefinder executable is not available.',
                  })
                );
                return;
              }

              // 1. Write route_request.json
              const requestPath = path.join(engineDir, 'route_request.json');
              fs.writeFileSync(
                requestPath,
                JSON.stringify({ source, destination }, null, 2),
                'utf-8'
              );

              // 2. Execute routefinder executable
              const execCmd = isWindows ? `.\\${binaryName}` : `./${binaryName}`;
              const run = spawnSync(execCmd, [], {
                cwd: engineDir,
                shell: true,
                timeout: 5000,
              });

              if (run.error) {
                throw run.error;
              }

              // 3. Read route_result.json
              const resultPath = path.join(engineDir, 'route_result.json');
              if (!fs.existsSync(resultPath)) {
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    available: false,
                    error: 'routefinder did not produce route_result.json.',
                    stdout: run.stdout ? run.stdout.toString() : '',
                  })
                );
                return;
              }

              const resultContent = fs.readFileSync(resultPath, 'utf-8');
              const parsedResult = JSON.parse(resultContent);
              const pathArr = Array.isArray(parsedResult.path) ? parsedResult.path : [];

              // Mirror to public/ for fallback
              try {
                const publicResultPath = path.resolve(import.meta.dirname, 'public', 'route_result.json');
                fs.writeFileSync(publicResultPath, resultContent, 'utf-8');
              } catch {
                // Ignore public mirror failure
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  available: true,
                  isNativeC: true,
                  isMock: false,
                  source,
                  destination,
                  found: Boolean(parsedResult.found),
                  path: pathArr,
                  hops:
                    typeof parsedResult.hops === 'number'
                      ? parsedResult.hops
                      : Math.max(0, pathArr.length - 1),
                  visited:
                    typeof parsedResult.visited === 'number'
                      ? parsedResult.visited
                      : pathArr.length,
                  engineLog: run.stdout ? run.stdout.toString().trim() : '',
                })
              );
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  available: false,
                  error: (err as Error).message,
                })
              );
            }
          });
          return;
        }

        // Endpoint: POST /api/nodes/save - Saves modified nodes & edges to disk
        if (req.url === '/api/nodes/save' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { nodes, edges } = JSON.parse(body);
              if (!Array.isArray(nodes)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Invalid nodes array' }));
                return;
              }
              const nodesFilePath = path.resolve(import.meta.dirname, 'src', 'data', 'nodes.json');
              fs.writeFileSync(nodesFilePath, JSON.stringify(nodes, null, 2) + '\n', 'utf-8');

              if (Array.isArray(edges)) {
                const edgesFilePath = path.resolve(import.meta.dirname, 'src', 'data', 'edges.json');
                fs.writeFileSync(edgesFilePath, JSON.stringify(edges, null, 2) + '\n', 'utf-8');
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: nodes.length }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: (err as Error).message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: true,
    cors: true,
    watch: {
      ignored: [
        '**/src/engine/*.json',
        '**/src/engine/*.exe',
        '**/src/data/nodes.json',
        '**/src/data/edges.json',
      ],
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    cors: true,
  },
  plugins: [
    tailwindcss(),
    react(),
    cEngineAutoRunnerPlugin(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
