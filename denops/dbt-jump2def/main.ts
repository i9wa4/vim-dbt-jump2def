import type { Denops, Entrypoint } from "./deps.ts";
import { fn } from "./deps.ts";
import { helper } from "./deps.ts";

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
      const curBufPath = await fn.expand(denops, "%:p");
      const escapedCurBufPath = await fn.fnameescape(denops, curBufPath);

      // if there is no dbt_project.yml in the parent directories,
      // regarding the current buffer as not in a dbt project
      const dbtProjectYmlRelativePath = await fn.findfile(
        denops,
        "dbt_project.yml",
        escapedCurBufPath + ";",
      );

      // if not in a dbt project, show error message
      if (!dbtProjectYmlRelativePath) {
        await helper.echoerr(denops, `[dbt-jump2def] Not in a dbt project`);
        return;
      }

      // get the absolute path of the root directory of the dbt project
      const dbtProjectRootPath = await fn.fnamemodify(
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
        await helper.echoerr(denops, `[dbt-jump2def] No model name found`);
        return;
      }

      // get the absolute path of the target model
      const targetModelPathList = await fn.findfile(
        denops,
        `${targetModelName}.sql`,
        dbtProjectRootPath + "**",
        -1,
      ) as unknown as string[];

      // exclude paths which contains "/target/"
      const targetModelPath =
        targetModelPathList.filter((path) => !path.includes("/target/"))[0];

      if (!targetModelPath) {
        // if the target model not found, show error message
        await helper.echoerr(
          denops,
          `[dbt-jump2def] Model not found: ${targetModelName}`,
        );
      } else if (!(await fn.filereadable(denops, targetModelPath))) {
        // if targetModelPath is not readable, show error message
        await helper.echoerr(
          denops,
          `[dbt-jump2def] Model not readable: ${targetModelName}`,
        );
      } else {
        // open target model file
        await denops.cmd(`edit ${targetModelPath}`);
        await helper.echo(
          denops,
          `[dbt-jump2def] Jumped to Definition: ${targetModelName}`,
        );
      }
      return;
    },
  };
};
