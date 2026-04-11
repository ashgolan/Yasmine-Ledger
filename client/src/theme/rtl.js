import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";

export const createRtlCache = () =>
  createCache({
    key: "mui-rtl",
    stylisPlugins: [prefixer, rtlPlugin],
  });