/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			'sans':    ['DM Sans', '-apple-system', 'system-ui', 'sans-serif'],
  			'serif':   ['Playfair Display', 'Georgia', 'serif'],
  			'display': ['Playfair Display', 'Georgia', 'serif'],
  			'heading': ['Playfair Display', 'Georgia', 'serif'],
  			'body':    ['DM Sans', '-apple-system', 'system-ui', 'sans-serif'],
  			'logo':    ['Playfair Display', 'Georgia', 'serif'],
  			'mono':    ['Courier New', 'Courier', 'monospace'],
  		},
  		borderRadius: {
  			lg:   '12px',
  			md:   '10px',
  			sm:   '6px',
  			xl:   '14px',
  			'2xl':'18px',
  		},
  		colors: {
  			background: '#F5F4F0',
  			foreground: '#0D0D0D',
  			surface:    '#F5F4F0',
  			border:     '#E0DEDA',
  			gold: {
  				DEFAULT: '#C4A44A',
  				light:   '#FFF3E0',
  				deep:    '#8A6F28',
  				border:  'rgba(196,164,74,0.35)',
  			},
  			accent: {
  				DEFAULT: '#2D5A27',
  				hover:   '#4A8C3F',
  				light:   '#EAF2E8',
  				foreground: '#FFFFFF',
  			},
  			ink: {
  				DEFAULT: '#0D0D0D',
  				2:       '#4A4A46',
  				3:       '#7A7A72',
  				4:       '#9CA3AF',
  				5:       '#C8C4BE',
  				6:       '#E0DEDA',
  				7:       '#F5F4F0',
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
  				DEFAULT: '#2D5A27',
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
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: '#2D5A27',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: '#1A1A1A',
  				foreground: '#BFBFB0',
  				primary: '#2D5A27',
  				'primary-foreground': '#FFFFFF',
  				accent: 'rgba(255,255,255,0.07)',
  				'accent-foreground': '#FFFFFF',
  				border: 'rgba(255,255,255,0.08)',
  				ring: '#2D5A27'
  			}
  		},
  		boxShadow: {
  			'card-hover': 'none',
  			'sm':         'none',
  			'md':         'none',
  			'lg':         'none',
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
