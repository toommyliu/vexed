/**
 * Design tokens extracted from the application's UI design language
 * These colors are used consistently across all BrowserWindow components
 */

export const colors = {
    // Backgrounds
    background: {
        primary: 'bg-background-primary',
        secondary: 'bg-background-secondary',
    },

    // Border colors
    border: {
        default: 'border-gray-700/50',
        darker: 'border-gray-800/50',
        zinc: 'border-zinc-700/50',
        zincDarker: 'border-zinc-800',
    },

    // Text colors
    text: {
        primary: 'text-white',
        secondary: 'text-gray-300',
        tertiary: 'text-gray-400',
        muted: 'text-gray-500',
    },

    // Accent colors
    accent: {
        emerald: {
            base: 'emerald-600',
            hover: 'emerald-500',
            dark: 'emerald-700',
        },
        blue: {
            base: 'blue-500',
            light: 'blue-400',
            dark: 'blue-600',
            darker: 'blue-700',
        },
        red: {
            base: 'red-600',
            hover: 'red-500',
            dark: 'red-700',
            background: 'red-900/30',
            border: 'red-600/50',
        },
        yellow: {
            base: 'yellow-400',
        },
        purple: {
            base: 'purple-400',
        },
    },

    // Gray scale
    gray: {
        50: 'gray-50',
        100: 'gray-100',
        200: 'gray-200',
        300: 'gray-300',
        400: 'gray-400',
        500: 'gray-500',
        600: 'gray-600',
        700: 'gray-700',
        800: 'gray-800',
        900: 'gray-900',
    },

    // Zinc scale
    zinc: {
        50: 'zinc-50',
        100: 'zinc-100',
        200: 'zinc-200',
        300: 'zinc-300',
        400: 'zinc-400',
        500: 'zinc-500',
        600: 'zinc-600',
        700: 'zinc-700',
        800: 'zinc-800',
        900: 'zinc-900',
        950: 'zinc-950',
    },
};

/**
 * Common opacity variants used in the design system
 */
export const opacities = {
    10: '/10',
    20: '/20',
    30: '/30',
    40: '/40',
    50: '/50',
    60: '/60',
    70: '/70',
    80: '/80',
};
