import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      vue: '@vue/compat',
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    }),
  ],

	server: {
		port: 7775,
		proxy: {
			"^/socket.io": {
				target: "http://localhost:7776",
        ws: true
			},
      "^/login-callback": {
				target: "http://localhost:7776",
			},
      "^/api": {
				target: "http://localhost:7776",
			},
    }
	},
})