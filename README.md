# Exp – Budget tracker

A simple monthly expense tracker with calendar view, daily budget, and secret savings. Data is stored **locally in your browser** by default so the app remembers you and your expenses.

## Run the app

```bash
npm install
npm run dev
```

Open the app in your browser (and on your phone on the same network, or deploy the built app). Data persists in `localStorage` per device.

## Data persistence

- **Default:** Everything is saved in the browser (`localStorage`). No account, no server. Works offline and when you deploy the static build (e.g. Vercel, Netlify).
- **Optional MongoDB:** To sync data across devices or back it up in the cloud, you can run the small API in `server/` and point the app to it.

### Optional: MongoDB backend

1. Create a database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas) free tier) and copy the connection string.
2. In the project root, create a `.env` file (see `.env.example`):
   - `VITE_API_URL` = your API URL (e.g. `http://localhost:3001` in dev, or your deployed server URL).
   - In the `server/` folder you’ll use `MONGODB_URI` and optionally `PORT`.
3. Run the API:
   ```bash
   cd server
   npm install
   MONGODB_URI="your-mongodb-uri" npm run dev
   ```
4. Run the React app with `VITE_API_URL` set to that API. The app will load and save data to MongoDB (keyed by a device id stored in the browser).

Deploy the React app (e.g. `npm run build` then host the `dist/` folder) and deploy the server (e.g. Railway, Render) with `MONGODB_URI` set. Use the deployed server URL as `VITE_API_URL` in the build so the app talks to your backend.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
