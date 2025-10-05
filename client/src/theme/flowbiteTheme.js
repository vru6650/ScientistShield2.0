// client/src/theme/flowbiteTheme.js
// Centralize Flowbite React theme customizations so built-in components
// match our Tailwind design tokens and brand palette.

export const customFlowbiteTheme = {
  button: {
    base:
      'group inline-flex items-center justify-center font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-radius-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
    color: {
      // Primary maps to professional-blue brand
      primary:
        'text-[color:var(--theme-accent-contrast)] bg-[var(--theme-accent)] hover:brightness-110 active:brightness-95 focus-visible:ring-[color:var(--theme-focus-ring)]',
      secondary:
        'text-[color:var(--theme-text-primary)] bg-[var(--theme-surface-alt)] border border-[color:var(--theme-border-soft)] hover:bg-[color-mix(in_srgb,var(--theme-surface-alt)_94%,var(--theme-accent)_6%)] active:brightness-95 focus-visible:ring-[color:var(--theme-border-soft)]',
      light:
        'text-[color:var(--theme-text-secondary)] bg-[color:var(--theme-surface)] border border-[color:var(--theme-border-soft)] hover:bg-[color-mix(in_srgb,var(--theme-surface-alt)_92%,var(--theme-accent)_8%)] active:brightness-95 focus-visible:ring-[color:var(--theme-focus-ring)]',
      danger: 'text-white bg-red-600 hover:bg-red-700 focus-visible:ring-red-300',
      success:
        'text-white bg-green-600 hover:bg-green-700 focus-visible:ring-green-300',
      // Accent option
      teal: 'text-white bg-accent-teal hover:bg-teal-500 focus-visible:ring-teal-300',
    },
    size: {
      xs: 'h-7 px-2.5 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
      xl: 'h-14 px-6 text-base',
    },
    pill: {
      off: '',
      on: 'rounded-radius-full',
    },
  },
  navbar: {
    link: {
      base:
        'flex items-center gap-2 py-2 px-3 rounded-radius-md text-[color:var(--theme-text-secondary)] hover:bg-[color:var(--theme-surface-alt)] focus-visible:ring-2 focus-visible:ring-[color:var(--theme-focus-ring)]',
      active: {
        on: 'bg-[color:var(--theme-surface-alt)] text-[color:var(--theme-text-primary)] shadow-soft',
        off: '',
      },
    },
    toggle: {
      base: 'text-[color:var(--theme-text-secondary)] hover:text-[color:var(--theme-text-primary)]',
    },
  },
  modal: {
    root: {
      base: 'fixed inset-0 z-50 overflow-y-auto',
      show: {
        on: 'flex',
        off: 'hidden',
      },
    },
    content: {
      base:
        'relative w-full p-0 m-4 sm:m-6 max-w-lg sm:max-w-xl bg-[color:var(--theme-surface)] rounded-radius-lg shadow-elevated border border-[color:var(--theme-border-soft)]',
    },
    header: {
      base: 'flex items-start justify-between py-3 px-4 border-b border-[color:var(--theme-border-soft)]',
      title: 'text-base font-semibold text-[color:var(--theme-text-primary)]',
      close: {
        base:
          'ml-auto inline-flex items-center rounded-radius-md p-1.5 text-[color:var(--theme-text-secondary)] hover:bg-[color:var(--theme-surface-alt)] hover:text-[color:var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--theme-focus-ring)]',
        icon: 'w-5 h-5',
      },
    },
    body: {
      base: 'p-4 text-[color:var(--theme-text-secondary)]',
    },
    footer: {
      base: 'flex items-center justify-end gap-2 p-4 border-t border-[color:var(--theme-border-soft)]',
    },
  },
  textInput: {
    field: {
      base: 'relative w-full',
      input: {
        base:
          'block w-full rounded-radius-md border border-[color:var(--theme-border-soft)] bg-[color:var(--theme-surface)] text-[color:var(--theme-text-primary)] placeholder-[color:var(--theme-text-subtle)] focus:border-[color:var(--theme-accent)] focus:ring-[color:var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60',
        colors: {
          gray: '',
        },
        sizes: {
          sm: 'p-2 text-sm',
          md: 'p-2.5 text-sm',
          lg: 'p-3 text-base',
        },
      },
      addon:
        'inline-flex items-center rounded-l-radius-md border border-r-0 border-[color:var(--theme-border-soft)] bg-[color:var(--theme-surface-alt)] px-3 text-[color:var(--theme-text-secondary)]',
    },
  },
  select: {
    field: {
      base: 'relative w-full',
      select: {
        base:
          'block w-full rounded-radius-md border border-[color:var(--theme-border-soft)] bg-[color:var(--theme-surface)] text-[color:var(--theme-text-primary)] focus:border-[color:var(--theme-accent)] focus:ring-[color:var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60',
        sizes: {
          sm: 'p-2 text-sm',
          md: 'p-2.5 text-sm',
          lg: 'p-3 text-base',
        },
      },
    },
  },
  tooltip: {
    target: 'focus:outline-none',
    base:
      'absolute z-10 inline-block rounded-radius-md px-3 py-1.5 text-xs font-medium shadow-soft bg-[color:var(--theme-text-primary)] text-[color:var(--theme-accent-contrast)]',
    arrow: {
      base: 'absolute h-2 w-2 rotate-45 bg-[color:var(--theme-text-primary)]',
      style: {
        dark: 'bg-[color:var(--theme-text-primary)]',
        light: 'bg-[color:var(--theme-text-primary)]',
      },
      placement: '-4px',
    },
  },
  badge: {
    color: {
      info: 'bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-100',
      gray: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-100',
      success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      failure: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
      warning: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
    },
    size: {
      xs: 'text-xs px-2 py-0.5',
      sm: 'text-xs px-2.5 py-0.5',
      md: 'text-sm px-3 py-0.5',
    },
  },
  spinner: {
    color: {
      primary: 'fill-[var(--theme-accent)] text-[color:var(--theme-surface-alt)]',
      gray: 'fill-[color:var(--theme-text-secondary)] text-[color:var(--theme-surface-alt)]',
    },
  },
};
