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
- All demo data lives in src/lib/data.ts and money/GST/reorder math in src/lib/format.ts (tested in src/test/reorder.test.ts); pages import from there so numbers stay consistent.
- Shared app chrome (sidebar, Ctrl+K command bar) is AppShell, mounted once in __root.tsx.
