import type { Denops, Entrypoint } from "@denops/std";
import {
  expand,
  findfile,
  fnameescape,
  fnamemodify,
} from "@denops/std/function";
import { echo, echoerr } from "@denops/std/helper";

export const main: Entrypoint = (denops: Denops) => {
  denops.dispatcher = {
    // initialize the plugin
    async init(): Promise<void> {
      await denops.cmd(
        `command! -nargs=? DbtJump2ModelDef call denops#request('${denops.name}', 'jumpToModelDefinition', [<q-args>])`,
      );
    },

    // jump to the definition of the model in the current line
    async jumpToModelDefinition(): Promise<void> {
      // get current buffer path
      const curBufPath = await expand(denops, "%:p");
      const escapedCurBufPath = await fnameescape(denops, curBufPath);

      // if there is no dbt_project.yml in the parent directories,
      // regarding the current buffer as not in a dbt project
      const dbtProjectYmlRelativePath = await findfile(
        denops,
        "dbt_project.yml",
        escapedCurBufPath + ";",
      );

      // if not in a dbt project, show error message
      if (!dbtProjectYmlRelativePath) {
        await echoerr(denops, `[dbt-jump2def] Not in a dbt project`);
        return;
      }

      // get the absolute path of the root directory of the dbt project
      const dbtProjectRootPath = await fnamemodify(
        denops,
        dbtProjectYmlRelativePath,
        ":p:h",
      );

      // get the target model name in the current line
      // the model name should be written inside single or double quotes
      const currentLine = (await denops.call("getline", ".")) as string;
      const targetModelName = currentLine.match(/['"]([^'"]+)['"]/)?.[1];

      // if no model name found, show error message
      if (!targetModelName) {
        await echoerr(denops, `[dbt-jump2def] No model name found`);
        return;
      }

      // get the relative path of the target model
      const targetModelRalativePath = await findfile(
        denops,
        `${targetModelName}.sql`,
        dbtProjectRootPath + "**",
      );

      // if the target model not found, show error message
      if (!targetModelRalativePath) {
        await echoerr(
          denops,
          `[dbt-jump2def] Model not found: ${targetModelName}`,
        );
        return;
      }

      // get the absolute path of the target model
      const targetModelPath = await fnamemodify(
        denops,
        targetModelRalativePath,
        ":p:~",
      );

      // open target model file
      await denops.cmd(`edit ${targetModelPath}`);
      await echo(
        denops,
        `[dbt-jump2def] Jumped to Definition: ${targetModelName}`,
      );
      return;
    },
  };
};
