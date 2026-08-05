# Development Workflow & Coding Standards

This document specifies the development standards, code style guidelines, and quality enforcement rules across the **Madurai Food Corner ERP** codebase.

---

## 🎨 1. Coding Standards & Conventions

### JavaScript / TypeScript & Node.js
- Use **ES6+ features** and standard `async/await` syntax. **Never** use raw promises with `.then()`/`.catch()` or callbacks.
- File naming: `camelCase.js` for utilities/repositories/services/controllers, `PascalCase.tsx` for React components.
- Scalable Naming Rules:
  - Controllers: `nameController.js` (e.g. `foodItem.controller.js`)
  - Services: `nameService.js` (e.g. `foodItem.service.js`)
  - Repositories: `nameRepository.js` (e.g. `foodItem.repository.js`)
  - Routes: `nameRoutes.js` (e.g. `foodItem.routes.js`)
- ESLint and Prettier configurations are placed in each component directory and must be satisfied prior to committing code.

### Kotlin & Jetpack Compose
- Use official [Android Kotlin Style Guide](https://developer.android.com/kotlin/style-guide).
- Composable functions: Named with `PascalCase` and marked with `@Composable`.
- ViewModels: Named `[Feature]ViewModel.kt` extending `androidx.lifecycle.ViewModel`.
- State handling: Keep composables stateless where possible. Pass State hoisted from ViewModels.

---

## 🚦 2. Code Linting & Formatting Commands

### Backend (`/backend`)
```bash
# Run ESLint check
npm run lint

# Automatically fix formatting issues
npm run format
```

### Customer Website (`/website`)
```bash
# Type check and lint
npm run lint

# Format code
npm run format
```

---

## 🔁 3. Git Branching & Commit Guidelines

### Branch Naming Scheme
- Features: `feature/module-name` (e.g. `feature/cart-checkout`)
- Bug Fixes: `fix/bug-description` (e.g. `fix/jwt-expiration-handler`)
- Refactoring: `refactor/component-name` (e.g. `refactor/order-repository`)
- Documentation: `docs/doc-name` (e.g. `docs/api-update`)

### Commit Messages Syntax (Conventional Commits)
```text
feat(backend): add Razorpay order creation endpoint
fix(website): resolve cart item quantity decrement bug
docs(api): update order status enum in API specs
style(admin): align compose top app bar margins
```

---

## ⚙️ 4. Clean Architecture Rules (Backend)

1. **Strict Directional Flow**: HTTP request -> Controller -> Service -> Repository -> Database.
2. **Layer Isolation**:
   - Controllers **must not** perform database operations directly.
   - Repositories **must not** handle HTTP requests or responses.
   - Services **must not** inspect Express `req` or `res` objects.
3. **Error Handling**: Throw `ApiError` instances in services or repositories. The `asyncHandler` wrapper catches errors and forwards them to the global error middleware.

---

## 🚫 5. Quality Assurance Checklist Before Commit

- [ ] All environment configuration values extracted to `.env`.
- [ ] No hardcoded passwords, tokens, API keys, or database URIs.
- [ ] ESLint and TypeScript compilation pass without errors or warnings.
- [ ] Soft delete flags (`isDeleted`) respected in repository DB queries.
- [ ] API endpoints versioned under `/api/v1/`.
