/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			'sans':    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
  			'serif':   ['Playfair Display', 'Georgia', 'serif'],
  			'display': ['Playfair Display', 'Georgia', 'serif'],
  			'heading': ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
  			'body':    ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
  			'logo':    ['Playfair Display', 'Georgia', 'serif'],
  			'mono':    ['Courier New', 'Courier', 'monospace'],
  		},
  		borderRadius: {
  			lg:   '8px',
  			md:   '6px',
  			sm:   '4px',
  			xl:   '12px',
  			'2xl':'16px',
  		},
  		colors: {
  			background: '#FFFFFF',
  			foreground: '#1A1A1A',
  			surface:    '#F7F7F5',
  			border:     '#E5E5E0',
  			gold: {
  				DEFAULT: '#C8B560',
  				light:   '#FFFBEA',
  				deep:    '#A08B30',
  				border:  'rgba(200,181,96,0.30)',
  			},
  			ink: {
  				DEFAULT: '#1A1A1A',
  				2:       '#3A3A3A',
  				3:       '#6B7280',
  				4:       '#9CA3AF',
  				5:       '#D1D5DB',
  				6:       '#E5E5E0',
  				7:       '#F7F7F5',
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: '#1A1A1A',
  				foreground: '#FFFFFF'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: '#C8B560',
  				foreground: '#1A1A1A'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: '#C8B560',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: '#0D0D0D',
  				foreground: '#FFFFFF',
  				primary: '#C8B560',
  				'primary-foreground': '#0D0D0D',
  				accent: '#2A2A2A',
  				'accent-foreground': '#FFFFFF',
  				border: '#1F1F1F',
  				ring: '#C8B560'
  			}
  		},
  		boxShadow: {
  			'card-hover': '0 2px 8px rgba(0,0,0,0.06)',
  			'sm':         '0 1px 3px rgba(0,0,0,0.04)',
  			'md':         '0 2px 8px rgba(0,0,0,0.06)',
  			'lg':         '0 4px 16px rgba(0,0,0,0.08)',
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
