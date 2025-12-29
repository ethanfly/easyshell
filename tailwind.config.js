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
          // 深邃的太空黑背景
          'bg': '#050810',
          'surface': '#0a0f18',
          'card': '#0f1520',
          'border': '#1a2332',
          'border-light': '#253244',
          // 霓虹主色调 - 电光蓝
          'accent': '#00d4ff',
          'accent-glow': '#00a8cc',
          'accent-dim': '#007a99',
          // 霓虹辅助色
          'neon-pink': '#ff2d95',
          'neon-purple': '#a855f7',
          'neon-green': '#00ff88',
          'neon-yellow': '#ffd000',
          'neon-orange': '#ff6b35',
          // 状态色
          'success': '#00ff88',
          'warning': '#ffd000',
          'error': '#ff3366',
          // 文字
          'text': '#e8f0ff',
          'text-dim': '#6b7a94',
          'text-muted': '#3d4a5c',
          // 特殊效果色
          'cyan': '#00d4ff',
          'purple': '#a855f7',
          'pink': '#ff2d95',
          'orange': '#ff6b35',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        'display': ['Rajdhani', 'Orbitron', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
        'glow-pink': '0 0 30px rgba(255, 45, 149, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'neon': '0 0 5px currentColor, 0 0 20px currentColor',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scan': 'scan 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 212, 255, 0.6)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.2)' },
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
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
        'hex-pattern': 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 15v30L30 60 0 45V15z\' fill=\'none\' stroke=\'rgba(0,212,255,0.05)\' stroke-width=\'1\'/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [],
}
