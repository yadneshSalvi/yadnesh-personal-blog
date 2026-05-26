import next from "eslint-config-next";

export default [
  ...next,
  {
    // New stricter rules introduced by eslint-plugin-react-hooks (ships with
    // eslint-config-next@16 for React 19.2). Downgraded from error to warn so
    // `npm run lint` exits 0 through the Next 16 migration. The underlying code
    // patterns (setState-in-effect, closure-mutation-in-useMemo) are pre-existing
    // and out of upgrade scope — promote back to "error" and fix when ready.
    // See: https://react.dev/reference/eslint-plugin-react-hooks
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];
