/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				border: "rgb(var(--border) / <alpha-value>)",
				input: "rgb(var(--input) / <alpha-value>)",
				ring: "rgb(var(--ring) / <alpha-value>)",
				background: "rgb(var(--background) / <alpha-value>)",
				foreground: "rgb(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "rgb(var(--primary) / <alpha-value>)",
					foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
				},
				secondary: {
					DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
					foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
					foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
				},
				success: {
					DEFAULT: "rgb(var(--success) / <alpha-value>)",
					foreground: "rgb(var(--success-foreground) / <alpha-value>)",
				},
				warning: {
					DEFAULT: "rgb(var(--warning) / <alpha-value>)",
					foreground: "rgb(var(--warning-foreground) / <alpha-value>)",
				},
				info: {
					DEFAULT: "rgb(var(--info) / <alpha-value>)",
					foreground: "rgb(var(--info-foreground) / <alpha-value>)",
				},
				muted: {
					DEFAULT: "rgb(var(--muted) / <alpha-value>)",
					foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
				},
				accent: {
					DEFAULT: "rgb(var(--accent) / <alpha-value>)",
					foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
				},
				popover: {
					DEFAULT: "rgb(var(--popover) / <alpha-value>)",
					foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
				},
				card: {
					DEFAULT: "rgb(var(--card) / <alpha-value>)",
					foreground: "rgb(var(--card-foreground) / <alpha-value>)",
				},
				sidebar: {
					DEFAULT: "rgb(var(--sidebar) / <alpha-value>)",
					foreground: "rgb(var(--sidebar-foreground) / <alpha-value>)",
					primary: "rgb(var(--sidebar-primary) / <alpha-value>)",
					"primary-foreground": "rgb(var(--sidebar-primary-foreground) / <alpha-value>)",
					accent: "rgb(var(--sidebar-accent) / <alpha-value>)",
					"accent-foreground": "rgb(var(--sidebar-accent-foreground) / <alpha-value>)",
					border: "rgb(var(--sidebar-border) / <alpha-value>)",
					ring: "rgb(var(--sidebar-ring) / <alpha-value>)",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
		},
	},
	plugins: []
};
