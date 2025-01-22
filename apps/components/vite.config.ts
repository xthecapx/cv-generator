import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src'] })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      formats: ['es', 'umd'],
      name: 'CVComponents',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@react-pdf/renderer'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@react-pdf/renderer': 'ReactPDF'
        }
      }
    }
  }
}); 