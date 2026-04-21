# Prettier Setup Guide

## ✅ Setup Complete

Prettier has been successfully configured for the DocuID add-in for MS Office project.

## 📁 Configuration Files Created

### 1. `.prettierrc`

Custom Prettier configuration with the following settings:

- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Use Tabs**: false (spaces)
- **Semicolons**: true
- **Quote Style**: double quotes
- **Trailing Commas**: ES5 compatible
- **Bracket Spacing**: true
- **Arrow Parens**: always
- **End of Line**: auto

### 2. `.prettierignore`

Excludes the following from formatting:

- `node_modules/`
- Build outputs (`dist/`, `build/`)
- Manifest files
- Package manager lock files
- Log files
- Environment files
- IDE configuration
- Temporary files

## 📜 Available Scripts

### Format Source Code

```bash
npm run prettier
```

Formats all TypeScript/TSX files in the `src/` directory using the office-addin-lint prettier command.

### Custom Format Scripts (Added)

```bash
# Format only src/ directory
npm run format

# Check formatting without writing changes
npm run format:check

# Format entire project (respects .prettierignore)
npm run format:all
```

## 🎯 What Was Formatted

The following files were successfully formatted:

- ✅ `src/commands/commands.ts`
- ✅ `src/taskpane/App.tsx`
- ✅ `src/taskpane/components/DebugPanel.tsx`
- ✅ `src/taskpane/components/DesignSystem.tsx`
- ✅ `src/taskpane/components/DocumentList.tsx`
- ✅ `src/taskpane/components/Header.tsx`
- ✅ `src/taskpane/components/LoginForm.tsx`
- ✅ `src/taskpane/components/ProfilePage.tsx`
- ✅ `src/taskpane/components/ShareSidebar.tsx`
- ✅ `src/taskpane/components/ShareSuccessModal.tsx`
- ✅ `src/taskpane/index.tsx`
- ✅ `src/taskpane/services/AuthService.ts`
- ✅ `src/taskpane/services/DocuIdApiService.ts`
- ✅ `src/taskpane/services/DocumentService.ts`
- ✅ `src/taskpane/services/Logger.ts`
- ✅ `src/taskpane/taskpane.ts`

## 🔧 IDE Integration

### VS Code

Install the Prettier extension:

1. Open VS Code Extensions (Ctrl+Shift+X)
2. Search for "Prettier - Code formatter"
3. Install the extension
4. Set it as the default formatter:
   ```json
   {
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.formatOnSave": true
   }
   ```

### Format on Save

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.formatOnSave": true
  }
}
```

## 🚀 Usage Examples

### Before Committing Code

```bash
# Check if code is properly formatted
npm run format:check

# Format all source files
npm run prettier
```

### Format Specific File Types

```bash
# Format only TypeScript files
npx prettier --write "src/**/*.ts"

# Format only React components
npx prettier --write "src/**/*.tsx"
```

## 📋 Pre-commit Hook (Optional)

To automatically format code before commits, you can use `husky` and `lint-staged`:

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "git add"]
  }
}
```

## 🎨 Formatting Rules

### Consistent Spacing

- **Indentation**: 2 spaces
- **Max line length**: 100 characters
- **Bracket spacing**: `{ foo }` not `{foo}`

### Quotes and Semicolons

- **Double quotes** for strings
- **Semicolons** at end of statements
- **Trailing commas** for multi-line arrays/objects

### Arrow Functions

- **Always use parentheses**: `(x) => x` not `x => x`

## ✅ Verification

To verify the setup is working:

```bash
# Check Prettier version (via office-addin-lint)
npm run prettier -- --help

# Format and verify
npm run prettier
```

## 📚 Additional Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [Office Add-in Lint](https://www.npmjs.com/package/office-addin-lint)
- [Prettier Configuration Options](https://prettier.io/docs/en/options.html)

## 🐛 Troubleshooting

### Prettier Not Working in IDE

1. Ensure the Prettier extension is installed
2. Check that `.prettierrc` exists in project root
3. Verify VS Code settings for default formatter
4. Restart VS Code

### Files Not Being Formatted

1. Check if file is in `.prettierignore`
2. Verify file extension is included in format scripts
3. Run `npm run format:check` to see which files need formatting

---

**Last Updated**: February 10, 2026
**Formatted Files**: 16 source files
