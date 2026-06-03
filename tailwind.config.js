/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        body:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        logo:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        serif:   ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xs:    '4px',
        sm:    '6px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
      },
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        surface:    '#F8FAFC',
        card: {
          DEFAULT:    '#FFFFFF',
          foreground: '#0F172A',
        },
        border:     '#E2E8F0',
        input:      '#E2E8F0',
        ring:       '#2563EB',
        primary: {
          DEFAULT:    '#0F172A',
          foreground: '#FFFFFF',
          hover:      '#1E293B',
        },
        secondary: {
          DEFAULT:    '#1E293B',
          foreground: '#CBD5E1',
        },
        accent: {
          DEFAULT:    '#2563EB',
          foreground: '#FFFFFF',
          hover:      '#1D4ED8',
          light:      '#EFF6FF',
        },
        muted: {
          DEFAULT:    '#F8FAFC',
          foreground: '#64748B',
        },
        popover: {
          DEFAULT:    '#FFFFFF',
          foreground: '#0F172A',
        },
        destructive: {
          DEFAULT:    '#EF4444',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT:    '#22C55E',
          foreground: '#FFFFFF',
          bg:         '#F0FDF4',
        },
        warning: {
          DEFAULT:    '#F59E0B',
          foreground: '#FFFFFF',
          bg:         '#FFFBEB',
        },
        ink: {
          DEFAULT: '#0F172A',
          2:       '#1E293B',
          3:       '#64748B',
          4:       '#94A3B8',
          5:       '#CBD5E1',
          6:       '#E2E8F0',
          7:       '#F8FAFC',
        },
        sidebar: {
          DEFAULT:              '#0F172A',
          foreground:           '#CBD5E1',
          primary:              '#2563EB',
          'primary-foreground': '#FFFFFF',
          accent:               '#1E293B',
          'accent-foreground':  '#FFFFFF',
          border:               '#1E293B',
          ring:                 '#2563EB',
        },
        gold: {
          DEFAULT: '#2563EB',
          light:   '#EFF6FF',
          deep:    '#1D4ED8',
          border:  '#BFDBFE',
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
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
