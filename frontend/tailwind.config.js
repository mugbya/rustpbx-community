/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Rust 社区主题色：暖橙红 #ce422b 及其色阶
        primary: {
          50: '#fdf3f1',
          100: '#fbe4df',
          200: '#f7cec3',
          300: '#f0ad9b',
          400: '#e67d63',
          500: '#d85a3c',
          600: '#ce422b', // 主色
          700: '#ab331f',
          800: '#8c2e1f',
          900: '#73291d',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      fontSize: {
        // 基准字号 18px
        base: ['18px', '1.6'],
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
