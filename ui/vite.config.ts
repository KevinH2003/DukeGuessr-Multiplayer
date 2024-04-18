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
		port: parseInt(process.env.UI_PORT || "7775"),
		proxy: {
			"^/socket.io": {
				target: `http://127.0.0.1:${process.env.SERVER_PORT || "7776"}`,
        ws: true
			},
      "^/login-callback": {
				target: `http://127.0.0.1:${process.env.SERVER_PORT || "7776"}`,
			},
      "^/api": {
				target: `http://127.0.0.1:${process.env.SERVER_PORT || "7776"}`,
			},
    }
	},
})