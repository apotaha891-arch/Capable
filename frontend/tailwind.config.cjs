module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Capable Brand Kit
        capable: {
          navy:    '#1F4788',  // primary
          medium:  '#2E5FA3',  // secondary
          light:   '#4A7BC8',  // accents, links
          success: '#10D981',
          warning: '#F59E0B',
          error:   '#EF4444',
          text:    '#1F2937',  // body text
          muted:   '#6B7280',  // secondary text
          surface: '#F3F4F6',  // light bg
        },
        // Brand accent. The app was built on Tailwind's default `indigo`
        // (a purple-leaning hue); we remap the whole `indigo-*` scale to the
        // brand blue (Light Blue #4A7BC8 → Navy #1F4788) so every existing
        // indigo utility — buttons, links, gradients, hovers — renders on-brand
        // without touching hundreds of call sites.
        indigo: {
          50:  '#EFF4FB',
          100: '#D8E5F5',
          200: '#B6CDEA',
          300: '#8FB1DC',
          400: '#6B97D1',
          500: '#4A7BC8',  // = capable.light (accent)
          600: '#3C68B2',  // primary buttons
          700: '#2E5FA3',  // = capable.medium
          800: '#244B85',
          900: '#1F4788',  // = capable.navy
          950: '#16335F',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        brand: '8px',
      },
      spacing: {
        // 8px base grid helpers
        '18': '4.5rem',
      },
      boxShadow: {
        'brand-sm':  '0 1px 2px rgba(31, 71, 136, 0.06)',
        'brand':     '0 4px 12px rgba(31, 71, 136, 0.08)',
        'brand-lg':  '0 10px 30px rgba(31, 71, 136, 0.12)',
      },
    },
  },
  plugins: [],
}
