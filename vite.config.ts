import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { getAllowedHostsFromEnv } from './src/server/env'

const defaultPort = Number(process.env.PORT ?? 3000)

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    port: defaultPort,
    allowedHosts: getAllowedHostsFromEnv(),
  },
  preview: {
    port: defaultPort,
    allowedHosts: getAllowedHostsFromEnv(),
  },
})
