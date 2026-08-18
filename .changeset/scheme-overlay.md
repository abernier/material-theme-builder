---
"material-theme-builder": minor
---

`ExportButton` no longer places itself, and wears the Figma mark.

It used to be `fixed` in the bottom-right corner on its own account, which is a
decision that belongs to whoever renders it — Storybook now stacks it with a
second FAB, and two self-placing FABs land on each other. Wrap it in your own
positioned element to keep it where it was:

```jsx
<div className="fixed right-6 bottom-6">
  <ExportButton config={config} />
</div>
```

Its download arrow is now the Figma mark, which is what the file it hands over
actually is.
