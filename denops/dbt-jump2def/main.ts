import {
  Denops,
  Entrypoint,
  assert,
  is,
} from "./deps.ts";

// This exported `main` function is automatically called by denops.vim.
//
// Note that this function is called on Vim startup, so it should execute as quickly as possible.
// Try to avoid initialization code in this function; instead, define an `init` API and call it from Vim script.
export const main: Entrypoint = (denops: Denops) => {
  // Overwrite `dispatcher` to define APIs.
  //
  // APIs are invokable from Vim script through `denops#request()` or `denops#notify()`.
  // Refer to `:help denops#request()` or `:help denops#notify()` for more details.
  denops.dispatcher = {
    async init() {
      const { name } = denops;
      await denops.cmd(
        `command! -nargs=? DbtPrintDebug echomsg denops#request('${name}', 'hello', [<q-args>])`,
      );
    },

    hello(name) {
      assert(name, is.String);
      return `Hello, ${name || "Denops"}!`;
    },
  };
};
