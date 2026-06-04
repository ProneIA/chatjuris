/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        body:    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        logo:    ['Playfair Display', 'Georgia', 'serif'],
        serif:   ['Playfair Display', 'Georgia', 'serif'],
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
        background: '#F8FAFC',
        foreground: '#0F172A',
        surface:    '#F8FAFC',
        card: {
          DEFAULT:    '#FFFFFF',
          foreground: '#0F172A',
        },
        border:     '#E2E8F0',
        input:      '#E2E8F0',
        ring:       '#B8952A',
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
          DEFAULT:    '#B8952A',
          foreground: '#FFFFFF',
          hover:      '#8A6A10',
          light:      '#F5EDD0',
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
          primary:              '#B8952A',
          'primary-foreground': '#FFFFFF',
          accent:               '#1E293B',
          'accent-foreground':  '#F5EDD0',
          border:               '#1E293B',
          ring:                 '#B8952A',
        },
        gold: {
          DEFAULT: '#B8952A',
          light:   '#F5EDD0',
          deep:    '#8A6A10',
          border:  '#D4AF5A',
          text:    '#7A5C0E',
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
