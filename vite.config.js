import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins:
        [
            react(),
            glsl({ watch: true })
        ],
    server:
    {
        host: true
    }
})
