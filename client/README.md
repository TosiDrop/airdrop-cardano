This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

to run:
1. `yarn install`
2. `yarn dev`
3. Open [http://localhost:3000](http://localhost:3000)

to deploy:
1. `yarn install`
2. `yarn start`

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Code standard

> Code formatting

1. Use typescript
2. Run `yarn prettier` before `git add` to format the code

> File naming

1. New components are to be put in a folder
2. The entry is `index.tsx`
3. The `scss` file (if needed) is named as `<component_name>.module.scss`
4. Import the `scss` locally into the component

> CSS
1. Put reusable CSS variables into `styles/global.css`