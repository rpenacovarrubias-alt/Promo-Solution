# PromoSolution (promo-solution@1.0.0)

This design system is the published promo-solution React library, bundled as a single
browser global. All 85 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.PromoSolution`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.PromoSolution.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Avatar } = window.PromoSolution;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Avatar />);
```

Wrap the tree in the provider — most components read theme/i18n from context:

```jsx
<BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter>
```

## Tokens

20 CSS custom properties from promo-solution. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **radius** (1): `--radius`
- **other** (19): `--background`, `--foreground`, `--card`, …

## Components

### general
- `Avatar`
- `AvatarFallback`
- `AvatarImage`
- `Badge`
- `Button`
- `Card`
- `CardContent`
- `CardDescription`
- `CardFooter`
- `CardHeader`
- `CardTitle`
- `Dialog`
- `DialogClose`
- `DialogContent`
- `DialogDescription`
- `DialogFooter`
- `DialogHeader`
- `DialogOverlay`
- `DialogPortal`
- `DialogTitle`
- `DialogTrigger`
- `DropdownMenu`
- `DropdownMenuCheckboxItem`
- `DropdownMenuContent`
- `DropdownMenuGroup`
- `DropdownMenuItem`
- `DropdownMenuLabel`
- `DropdownMenuPortal`
- `DropdownMenuRadioGroup`
- `DropdownMenuRadioItem`
- `DropdownMenuSeparator`
- `DropdownMenuShortcut`
- `DropdownMenuSub`
- `DropdownMenuSubContent`
- `DropdownMenuSubTrigger`
- `DropdownMenuTrigger`
- `Input`
- `Label`
- `RadioGroup`
- `RadioGroupItem`
- `Select`
- `SelectContent`
- `SelectGroup`
- `SelectItem`
- `SelectLabel`
- `SelectScrollDownButton`
- `SelectScrollUpButton`
- `SelectSeparator`
- `SelectTrigger`
- `SelectValue`
- `Separator`
- `Sheet`
- `SheetClose`
- `SheetContent`
- `SheetDescription`
- `SheetFooter`
- `SheetHeader`
- `SheetOverlay`
- `SheetPortal`
- `SheetTitle`
- `SheetTrigger`
- `Skeleton`
- `Slider`
- `Switch`
- `Table`
- `TableBody`
- `TableCaption`
- `TableCell`
- `TableFooter`
- `TableHead`
- `TableHeader`
- `TableRow`
- `Tabs`
- `TabsContent`
- `TabsList`
- `TabsTrigger`
- `Textarea`
- `Tooltip`
- `TooltipContent`
- `TooltipProvider`
- `TooltipTrigger`

### layout
- `Header`
- `MainLayout`
- `Sidebar`

### auth
- `ProtectedRoute`
