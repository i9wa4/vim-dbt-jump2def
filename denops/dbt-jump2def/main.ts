import type { Denops, Entrypoint } from "@denops/std";
import {
  expand,
  findfile,
  fnameescape,
  fnamemodify,
} from "jsr:@denops/std/function";
import { echo, echoerr } from "jsr:@denops/std/helper";

export const main: Entrypoint = (denops: Denops) => {
  denops.dispatcher = {
    async init(): Promise<void> {
      await denops.cmd(
        `command! -nargs=? DbtJump2ModelDef call denops#request('${denops.name}', 'jumpToModelDefinition', [<q-args>])`,
      );
    },

    async jumpToModelDefinition(): Promise<void> {
      // get current buffer directory
      const curBufPath = await expand(denops, "%:p");
      const escapedCurBufPath = fnameescape(denops, curBufPath);

      // check if curBufDir is in a dbt project
      const dbtProjectYmlRelativePath = await findfile(
        denops,
        "dbt_project.yml",
        escapedCurBufPath + ";",
      );

      if (!dbtProjectYmlRelativePath) {
        await echoerr(denops, `[vim-dbt-jump2def] Not in a dbt project`);
        return;
      }

      const dbtProjectRootPath = await fnamemodify(
        denops,
        dbtProjectYmlRelativePath,
        ":p:h",
      );

      // get target model name in current line
      const currentLine = (await denops.call("getline", ".")) as string;
      // targetModelName is inside "" or ''
      const targetModelName = currentLine.match(/['"]([^'"]+)['"]/)?.[1];

      if (!targetModelName) {
        await echoerr(denops, `[vim-dbt-jump2def] No model name found`);
        return;
      }

      // get target model file path
      const targetModelRalativePath = await findfile(
        denops,
        `${targetModelName}.sql`,
        dbtProjectRootPath + "**",
      );

      if (!targetModelRalativePath) {
        await echoerr(
          denops,
          `[vim-dbt-jump2def] Model not found: ${targetModelName}`,
        );
        return;
      }

      const targetModelPath = await fnamemodify(
        denops,
        targetModelRalativePath,
        ":p:~",
      );

      // open target model file
      await denops.cmd(`edit ${targetModelPath}`);
      await echo(
        denops,
        `[vim-dbt-jump2def] Jumped to Definition: ${targetModelName}`,
      );
      return;
    },
  };
};
