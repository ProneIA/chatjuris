/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        body:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'sans-serif'],
        heading: ['Syne', 'Inter', 'sans-serif'],
        logo:    ['Syne', 'Inter', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xs:    '2px',
        sm:    '3px',
        md:    '4px',
        lg:    '6px',
        xl:    '8px',
        '2xl': '10px',
      },
      colors: {
        background: '#F0F4F8',
        foreground: '#1A202C',
        surface:    '#F7FAFC',
        card: {
          DEFAULT:    '#FFFFFF',
          foreground: '#1A202C',
        },
        border:     '#E2E8F0',
        input:      '#E2E8F0',
        ring:       '#2B6CB0',
        primary: {
          DEFAULT:    '#0A0F1E',
          foreground: '#FFFFFF',
          hover:      '#161D35',
        },
        secondary: {
          DEFAULT:    '#1E293B',
          foreground: '#A0AEC0',
        },
        accent: {
          DEFAULT:    '#2B6CB0',
          foreground: '#FFFFFF',
          hover:      '#1A4F8A',
          light:      '#EBF4FF',
        },
        muted: {
          DEFAULT:    '#F7FAFC',
          foreground: '#718096',
        },
        popover: {
          DEFAULT:    '#FFFFFF',
          foreground: '#1A202C',
        },
        destructive: {
          DEFAULT:    '#E53E3E',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT:    '#38A169',
          foreground: '#FFFFFF',
          bg:         '#F0FFF4',
        },
        warning: {
          DEFAULT:    '#D69E2E',
          foreground: '#FFFFFF',
          bg:         '#FFFFF0',
        },
        navy: {
          900: '#0A0F1E',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
        ink: {
          DEFAULT: '#1A202C',
          2:       '#2D3748',
          3:       '#4A5568',
          4:       '#718096',
          5:       '#A0AEC0',
          6:       '#E2E8F0',
          7:       '#F7FAFC',
        },
        sidebar: {
          DEFAULT:              '#0A0F1E',
          foreground:           '#A0AEC0',
          primary:              '#63B3ED',
          'primary-foreground': '#FFFFFF',
          accent:               'rgba(255,255,255,0.08)',
          'accent-foreground':  '#FFFFFF',
          border:               'rgba(255,255,255,0.06)',
          ring:                 '#63B3ED',
        },
        gold: {
          DEFAULT: '#2B6CB0',
          light:   '#EBF4FF',
          deep:    '#1A4F8A',
          border:  '#90CDF4',
          text:    '#1A365D',
        },
      },
      boxShadow: {
        'xs':         '0 1px 2px rgba(0,0,0,.04)',
        'sm':         '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'md':         '0 4px 6px rgba(0,0,0,.05), 0 2px 4px rgba(0,0,0,.04)',
        'lg':         '0 10px 15px rgba(0,0,0,.05), 0 4px 6px rgba(0,0,0,.04)',
        'card':       '0 1px 2px rgba(0,0,0,.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,.08)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' }
        },
        'fade-in-up':    { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-scale': { '0%': { opacity: '0', transform: 'scale(0.97)' },       '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-left': { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'shimmer':       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-soft':    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in-up':      'fade-in-up 0.4s ease both',
        'fade-in-scale':   'fade-in-scale 0.3s ease both',
        'slide-in-left':   'slide-in-left 0.3s ease both',
        'shimmer':         'shimmer 1.5s linear infinite',
        'pulse-soft':      'pulse-soft 2s ease-in-out infinite',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
