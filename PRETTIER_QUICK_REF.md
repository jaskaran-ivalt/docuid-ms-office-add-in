# 🎨 Prettier Quick Reference

## 🚀 Quick Commands

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `npm run prettier`     | Format all source files (recommended) |
| `npm run format`       | Format src directory                  |
| `npm run format:check` | Check formatting without changes      |
| `npm run format:all`   | Format entire project                 |

## 📁 Key Files

- **`.prettierrc`** - Prettier configuration
- **`.prettierignore`** - Files to exclude from formatting
- **`.vscode/settings.json`** - VS Code auto-format on save

## ⚙️ Current Configuration

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5"
}
```

## ✅ What's Formatted

- ✅ All `.ts` files (TypeScript)
- ✅ All `.tsx` files (React/TypeScript)
- ✅ All `.js` files (JavaScript)
- ✅ All `.jsx` files (React/JavaScript)
- ✅ All `.json` files
- ✅ All `.css` files
- ✅ All `.md` files (Markdown)

## 🎯 Before Every Commit

```bash
npm run prettier
```

## 💡 VS Code Integration

**Auto-format is ENABLED** for the project:

- Formats on save automatically
- Uses Prettier as default formatter
- Works with TypeScript, React, JSON, CSS, Markdown

## 📝 Formatting Rules

✅ **DO**

```typescript
const user = {
  name: "John",
  age: 30,
};
```

❌ **DON'T**

```typescript
const user = { name: "John", age: 30 };
```

---

**Need help?** Check `docs/PRETTIER_SETUP.md` for full documentation.
