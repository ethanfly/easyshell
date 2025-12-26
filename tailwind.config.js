/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'shell': {
          'bg': '#0a0e14',
          'surface': '#0d1117',
          'card': '#161b22',
          'border': '#30363d',
          'accent': '#58a6ff',
          'accent-glow': '#1f6feb',
          'success': '#3fb950',
          'warning': '#d29922',
          'error': '#f85149',
          'text': '#e6edf3',
          'text-dim': '#8b949e',
          'cyan': '#56d4dd',
          'purple': '#bc8cff',
          'orange': '#ffa657',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        'display': ['Space Grotesk', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(88, 166, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(88, 166, 255, 0.4)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(88, 166, 255, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}

