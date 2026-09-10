# Smart Barn

Web platform for parametric building construction.

## Stack

- Nx monorepo
- Angular 22
- Spartan UI
- Tailwind CSS

## Applications

- `apps/frontend/client` — Smart Barn web client

## Development

```bash
npm install
npm start
```

Nx target:

```bash
npx nx serve client
```

## Spartan UI

Spartan UI is managed through `@spartan-ng/cli`. UI primitives should be generated into the workspace and used instead of creating parallel custom button/input/tabs/card primitives.

After dependencies are installed:

```bash
npx spartan init
```

The first product module is the floor/slab field editor with three views: Geometry, Layers and 3D.
