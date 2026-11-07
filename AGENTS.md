<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Products, sales, vendors and inward invoices live in Lovable Cloud and load through src/lib/store.ts (useProducts/useSales/useAuthState); src/lib/data.ts keeps only fallback/demo-only data and the role-tagged navItems. Money/GST/reorder math stays in src/lib/format.ts (tested in src/test/reorder.test.ts).
- Sales are written only via the complete_sale database function so price, cost and stock come from the database, not the browser.
- Page access is enforced in AppShell from navItems[].roles; data access is enforced by RLS with has_role().
- Shared app chrome (sidebar, Ctrl+K command bar) is AppShell, mounted once in __root.tsx.
