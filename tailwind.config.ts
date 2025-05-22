import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: '#212936',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#ff8000',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: '#2a3441',
					foreground: '#ffffff'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: '#2a3441',
					foreground: '#94a3b8'
				},
				accent: {
					DEFAULT: '#2a3441',
					foreground: '#ffffff'
				},
				popover: {
					DEFAULT: '#212936',
					foreground: '#ffffff'
				},
				card: {
					DEFAULT: '#212936',
					foreground: '#ffffff'
				},
				sidebar: {
					DEFAULT: '#212936',
					foreground: '#ffffff',
					primary: '#ff8000',
					'primary-foreground': '#ffffff',
					accent: '#2a3441',
					'accent-foreground': '#ffffff',
					border: '#2a3441',
					ring: '#ff8000'
				},
				fundhub: {
					blue: 'rgb(var(--fundhub-blue-rgb) / <alpha-value>)',
					secondary: 'rgb(var(--fundhub-secondary-rgb) / <alpha-value>)',
					accent: 'rgb(var(--fundhub-accent-rgb) / <alpha-value>)',
					'light-blue': '#e8f3ff',
					navy: '#052a56',
					'light-gray': '#f7f9fc',
					gray: '#e5e8f0',
					success: '#20c997',
					warning: '#ffc107',
					danger: '#dc3545'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'fade-out': {
					from: { opacity: '1' },
					to: { opacity: '0' }
				},
				'slide-up': {
					from: { transform: 'translateY(10px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					from: { transform: 'translateY(-10px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-in-right': {
					from: { transform: 'translateX(30px)', opacity: '0' },
					to: { transform: 'translateX(0)', opacity: '1' }
				},
				'card-hover': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(-5px)' }
				},
				pulse: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'slide-down': 'slide-down 0.4s ease-out',
				'slide-in-right': 'slide-in-right 0.4s ease-out',
				'card-hover': 'card-hover 0.3s ease-out',
				pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			transitionProperty: {
				'height': 'height',
				'spacing': 'margin, padding',
			},
			boxShadow: {
				'glass': '0 4px 30px rgba(0, 0, 0, 0.2)',
				'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
				'nav': '0 2px 10px rgba(0, 0, 0, 0.1)',
				'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
			},
			backdropBlur: {
				xs: '2px',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
