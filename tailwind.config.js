// tailwind.config.js
const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/(accordion|alert|autocomplete|avatar|badge|breadcrumbs|button|calendar|card|checkbox|chip|code|date-input|date-picker|divider|drawer|dropdown|form|input|input-otp|kbd|link|listbox|menu|modal|navbar|number-input|pagination|popover|progress|radio|scroll-shadow|select|skeleton|slider|snippet|spacer|spinner|toggle|table|tabs|toast|user|ripple).js",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};
