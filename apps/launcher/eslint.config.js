import { config as reactConfig } from "@repo/eslint-config/react-internal";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  ...reactConfig,
  {
    ignores: [".output", ".vinxi"],
  },
  {
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
