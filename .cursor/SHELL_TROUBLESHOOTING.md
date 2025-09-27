# Cursor Shell Troubleshooting Guide

## Issue Fixed ✅

The Cursor editor shell integration issue has been resolved by adding proper terminal configuration
to both VS Code and Cursor-specific settings.

## What Was Done

### 1. Updated VS Code Settings (`.vscode/settings.json`)

- Added proper terminal configuration for macOS
- Set default shell to zsh with login shell arguments
- Configured PATH environment variable inheritance
- Added Node.js and package manager settings

### 2. Created Cursor-Specific Settings (`.cursor/settings.json`)

- Override VS Code terminal settings specifically for Cursor
- Enhanced terminal configuration with interactive shell support
- Disabled unnecessary terminal warnings and prompts
- Configured file watching exclusions for better performance

### 3. Added Debug Launch Configuration (`.vscode/launch.json`)

- Added Next.js debugging configurations
- Configured integrated terminal console for debugging

### 4. Created Shell Test Script (`.cursor/test-shell.sh`)

- Diagnostic script to verify shell environment
- Tests Node.js, PNPM, and project configuration
- Can be run to verify everything is working

## How to Test the Fix

1. **Restart Cursor Editor** completely (close all windows)
2. **Open the project** in Cursor
3. **Open a new terminal** in Cursor (Terminal → New Terminal or `` Ctrl+` ``)
4. **Run the test script**:
   ```bash
   ./.cursor/test-shell.sh
   ```
5. **Test project commands**:
   ```bash
   pnpm --version
   node --version
   pnpm dev
   ```

## Expected Results

After the fix, you should see:

- ✅ Terminal opens without errors
- ✅ Shell prompt appears correctly
- ✅ Node.js and PNPM are available
- ✅ All project scripts work (`pnpm dev`, `pnpm build`, etc.)
- ✅ PATH includes all necessary directories

## Common Shell Issues and Solutions

### Issue: "Command not found" errors

**Solution**: The terminal configuration now properly inherits your system PATH and loads your shell
profile.

### Issue: Terminal hangs or doesn't respond

**Solution**: The settings now disable problematic shell integrations and use proper shell
arguments.

### Issue: Environment variables not loaded

**Solution**: Terminal now uses login shell (`-l`) and interactive shell (`-i`) arguments to
properly load your environment.

## Environment Details

- **Shell**: zsh (`/bin/zsh`)
- **Node Version**: v20.19.5 (managed by Volta)
- **Package Manager**: pnpm@8.12.1
- **Project**: Next.js 15 + React 19 + TypeScript

## Files Modified

- `.vscode/settings.json` - Updated terminal configuration
- `.cursor/settings.json` - New Cursor-specific settings
- `.vscode/launch.json` - New debugging configuration
- `.cursor/test-shell.sh` - Shell diagnostic script
- `.cursor/SHELL_TROUBLESHOOTING.md` - This guide

## If Issues Persist

1. Check Cursor's built-in terminal settings (Preferences → Terminal)
2. Verify your shell configuration files (`~/.zshrc`, `~/.zprofile`)
3. Try restarting Cursor with a fresh workspace
4. Run the test script to diagnose specific issues

The shell integration should now work correctly in Cursor editor! 🎉
