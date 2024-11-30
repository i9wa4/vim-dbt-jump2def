import type { Denops, Entrypoint } from "@denops/std";

export const main: Entrypoint = (denops: Denops) => {
  denops.dispatcher = {
    async init(): Promise<void> {
      await denops.cmd(
        `command! -nargs=? DbtJump2ModelDef call denops#request('${denops.name}', 'jumpToModelDefinition', [<q-args>])`,
      );
    },

    async jumpToModelDefinition(): Promise<void> {
      // get current buffer directory
      const curBufPath = (await denops.call("expand", "%:p")) as string;
      const escapedCurBufPath = curBufPath.replace(/ /g, "\\ ");

      // check if curBufDir is in a dbt project
      const dbtProjectYmlRelativePath = (await denops.call(
        "findfile",
        "dbt_project.yml", // not considering dbt_project.y'a'ml
        escapedCurBufPath + ";",
      )) as string;

      if (!dbtProjectYmlRelativePath) {
        await denops.cmd("echohl Error");
        await denops.cmd(
          "echomsg msg",
          { msg: `[vim-dbt-jump2def] Not in a dbt project` },
        );
        await denops.cmd("echohl None");
      }

      const dbtProjectRootPath = (await denops.call(
        "fnamemodify",
        dbtProjectYmlRelativePath,
        ":p:h",
      )) as string;

      // get target model name in current line
      const currentLine = (await denops.call("getline", ".")) as string;
      // targetModelName is inside "" or ''
      const targetModelName = currentLine.match(/['"]([^'"]+)['"]/)?.[1];

      if (!targetModelName) {
        await denops.cmd("echohl Error");
        await denops.cmd(
          "echomsg msg",
          { msg: `[vim-dbt-jump2def] No model name found` },
        );
        await denops.cmd("echohl None");
      }

      // get target model file path
      const targetModelRalativePath = (await denops.call(
        "findfile",
        `${targetModelName}.sql`,
        dbtProjectRootPath + "**",
      )) as string;

      if (!targetModelRalativePath) {
        await denops.cmd("echohl Error");
        await denops.cmd(
          "echomsg msg",
          { msg: `[vim-dbt-jump2def] Model not found: ${targetModelName}` },
        );
        await denops.cmd("echohl None");
      }

      const targetModelPath = (await denops.call(
        "fnamemodify",
        targetModelRalativePath,
        ":p:~",
      )) as string;

      // open target model file
      await denops.cmd(`edit ${targetModelPath}`);
      // await denops.cmd(
      //   "echomsg msg",
      //   { msg: `[vim-dbt-jump2def] Jumped to Definition: ${targetModelName}` },
      // );
    },
  };
};
