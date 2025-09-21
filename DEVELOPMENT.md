# Development Workflow

## Code Quality Checks

Since we've removed Husky for a simpler setup, you can run quality checks manually:

### Before Committing

Run individual quality checks as needed:

```bash
# Run individual checks
pnpm run lint:fix    # Fix ESLint issues
pnpm run format:all  # Format all files with Prettier
pnpm run type-check  # Check TypeScript types
pnpm run check:all   # Run lint, type-check, and format check
```

### Available Scripts

- `pnpm run lint` - Run ESLint on all files
- `pnpm run lint:fix` - Run ESLint with auto-fix
- `pnpm run format:all` - Format all files with Prettier
- `pnpm run format:check` - Check if files are formatted correctly
- `pnpm run type-check` - Run TypeScript type checking
- `pnpm run check:all` - Run all quality checks

### Recommended Workflow

1. Make your changes
2. Stage your files: `git add .`
3. Run quality checks as needed: `pnpm run check:all` or individual scripts
4. Commit your changes: `git commit -m "your message"`

**Note:** Quality checks are now completely optional and won't block commits. Run them manually when you want to ensure code quality.

### IDE Integration

For the best development experience, configure your IDE to:

- Run ESLint on save
- Run Prettier on save
- Show TypeScript errors in real-time

This will catch most issues before you even run the quality checks.
