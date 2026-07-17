# TypeScript notes for my Python brain

I think in Python. Zenkei is TypeScript. These are the notes I keep so my own code stays readable to me. Every example is a real line from this repo, next to the Python I would have written instead. Meridian is TypeScript too, so these notes cover both projects.

## The 30-second version

TypeScript is basically Python with the type hints enforced and curly braces instead of indentation. Variables, functions, ifs, and loops all do what you expect. `npm run build` runs the type checker (`tsc`), which is like mypy except you can't ignore it: if the types are wrong, the build fails.

## Variables

```ts
const total = 0;     // a name you promise not to reassign
let count = 0;       // a name you will reassign
```

Python doesn't have this split. `const` is the default here; it just means "this name points at one thing forever." You can still modify the insides of a `const` array or object, same as a Python list assigned to a "constant."

## Types and interfaces = dataclasses

From [src/lib/types.ts](../src/lib/types.ts):

```ts
export interface Transaction {
  id: number | string;
  date: string;        // YYYY-MM-DD
  amount: number;      // negative = spending, positive = income
  category: string;
}
```

In Python I would write:

```python
@dataclass
class Transaction:
    id: int | str
    date: str        # YYYY-MM-DD
    amount: float    # negative = spending, positive = income
    category: str
```

Same idea, same syntax almost. `number | string` is a union type, exactly like Python's `int | str`. One catch: `number` covers both int and float. There is no separate int type.

`type Budgets = Record<string, number>` just means `Budgets = dict[str, float]`. `Record<K, V>` is a dict.

## Functions and arrows

```ts
const f = (x) => x * 2;              // f = lambda x: x * 2
(e) => setUseLLM(e.target.checked)   // a tiny inline callback, like a lambda passed to a button
```

An arrow with a body in braces is just a regular def:

```ts
const clean = (s: string) => {
  const out = s.trim().toLowerCase();
  return out;
};
```

The `s: string` part is a type hint, same as `def clean(s: str):`.

## Strings

Backticks are f-strings. `${...}` is the hole instead of `{...}`. Real line from [src/lib/insights.ts](../src/lib/insights.ts):

```ts
`Your net worth is ${fmtUSD(A + L)}: ${fmtUSD(A)} in assets minus ${fmtUSD(-L)} in liabilities.`
```

Python: `f"Your net worth is {fmtUSD(A + L)}: ..."`. That's the whole difference.

## Lists without comprehensions

TypeScript has no list comprehensions. Instead you chain `.filter()`, `.map()`, and `.reduce()`. Real line from insights.ts:

```ts
const A = DEMO_ACCOUNTS.filter((x) => x.type === "asset").reduce((s, x) => s + x.value, 0);
```

In Python:

```python
A = sum(x.value for x in DEMO_ACCOUNTS if x.type == "asset")
```

The mapping to remember:

| TypeScript | Python |
|---|---|
| `arr.map(x => x * 2)` | `[x * 2 for x in arr]` |
| `arr.filter(x => x > 0)` | `[x for x in arr if x > 0]` |
| `arr.reduce((s, x) => s + x, 0)` | `sum(arr)` |
| `arr.some(x => x > 0)` | `any(x > 0 for x in arr)` |
| `Object.entries(d)` | `d.items()` |
| `arr.sort((a, b) => a - b)` | `arr.sort()` (but see gotchas) |

## Comparison and defaults

- Always `===`, never `==`. Triple equals is Python's `==`. Double equals does sloppy type coercion and nobody wants that.
- `x?.field` means "if x is not None, get field, else undefined." Saves a whole `if x is not None:` block.
- `x ?? fallback` and `x || fallback` are like `x or fallback`.

## JSX: the HTML in the code

React components are functions that return HTML. The HTML-looking stuff in `.tsx` files is called JSX. Inside it, single curly braces are f-string holes:

```tsx
<h1>{fmtUSD(net)}</h1>
```

`style={{ fontSize: 29 }}` looks weird but it's just a dict of CSS passed as a prop: the outer braces mean "expression coming," the inner braces are the dict.

## The three React hooks, in Python terms

All the state lives in [src/App.tsx](../src/App.tsx):

- `useState`: a variable that redraws the page when you change it. You never assign to it directly; you call its setter (`setTab("budgets")`) and React re-runs the function with the new value.
- `useMemo`: functools.lru_cache for one derived value. `analytics` is computed from the transaction list only when the list actually changes.
- `useEffect`: "after rendering, run this side effect." Zenkei uses it to save budgets and goals to localStorage whenever they change.

That is genuinely all the React this project uses. No router, no state library.

## Imports

```ts
import { fmtUSD, monthLabel } from "./format";   // from format import fmtUSD, monthLabel
export function fmtUSD(...) {}                    // makes it importable elsewhere
```

## Gotchas that bit me

- `number` is always a float. `0.1 + 0.2 !== 0.3` here too.
- `.sort()` with no argument sorts numbers as strings (`[10, 9, 1]` becomes `[1, 10, 9]`). Always pass `(a, b) => a - b`.
- `.sort()` mutates the array in place AND returns it, so chaining it can surprise you.
- `{}` is an empty object (a dict), never a set. Sets exist but you write `new Set()`.
- JSON keys are always strings, same as Python's json module.

## How I read this codebase

Start in [src/lib](../src/lib): it's pure logic with no React in it, and it reads closest to Python. `parser.ts` and `subscriptions.ts` are just algorithms. `types.ts` is the vocabulary. Only then open `src/components`, and read the JSX like a template with f-string holes. [CODE_TOUR.md](CODE_TOUR.md) walks the files in order.
