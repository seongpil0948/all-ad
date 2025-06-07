# ESLint Configuration

This project uses ESLint 9 with the flat config format (`eslint.config.mjs`) and integrates Next.js ESLint plugin for optimal Next.js development experience.

## Configuration Overview

### Key Features

1. **Next.js Integration**

   - Uses `@next/eslint-plugin-next` for Next.js specific rules
   - Includes Core Web Vitals rules for performance optimization
   - Proper handling of React globals (no need to import React)

2. **TypeScript Support**

   - Full TypeScript ESLint integration
   - `@typescript-eslint/no-explicit-any` set to warning level
   - Proper parser configuration for TypeScript files

3. **Code Quality**

   - React hooks rules enforcement
   - JSX accessibility rules (jsx-a11y)
   - Import ordering rules
   - Unused imports detection

4. **Prettier Integration**
   - ESLint and Prettier work together
   - Consistent code formatting across the project

### File Structure

- `eslint.config.mjs` - Main ESLint configuration using flat config format
- `.prettierrc.json` - Prettier configuration
- `.prettierignore` - Files to ignore for Prettier

### Running Linting

```bash
# Run ESLint with auto-fix
pnpm lint

# Format code with Prettier
pnpm format

# Build the project (includes linting)
pnpm build
```

### Custom Rules

- `no-console`: Warns on console usage except for `console.warn` and `console.error`
- `@typescript-eslint/no-explicit-any`: Set to warning to allow gradual migration
- React rules configured for Next.js (no need to import React)
- Import ordering enforced with specific group order

### Ignored Files

The configuration ignores:

- Build outputs (`.next`, `dist`, `build`)
- Dependencies (`node_modules`)
- Test files in `tests/` directory
- Supabase functions (they use Deno, not Node.js)
- Various config files

### Notes

- The legacy `.eslintrc.json` has been removed in favor of the flat config
- Supabase functions are excluded from TypeScript project linting as they use Deno
- Facebook SDK requires `require()` import due to lack of TypeScript definitions
