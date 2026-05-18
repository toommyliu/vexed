import { promises } from "fs";
import { basename, sep } from "path";
import type { ScriptExecutePayload } from "../shared/ipc";
import * as Files from "./settings/Files";

const { mkdir, readFile, realpath } = promises;

export const getScriptsPath = (): string => Files.workspaceJoin("scripts");

export const resolveScriptPath = async (path: string): Promise<string> => {
  const scriptsPath = getScriptsPath();
  await mkdir(scriptsPath, { recursive: true });

  const [scriptsRoot, scriptPath] = await Promise.all([
    realpath(scriptsPath),
    realpath(path),
  ]);

  if (
    scriptPath !== scriptsRoot &&
    !scriptPath.startsWith(`${scriptsRoot}${sep}`)
  ) {
    throw new Error("Script path must be inside the scripts directory");
  }

  return scriptPath;
};

export const updateCachedScriptPayload = async (
  path: string,
): Promise<ScriptExecutePayload> => {
  const scriptPath = await resolveScriptPath(path);
  const payload: ScriptExecutePayload = {
    source: await readFile(scriptPath, "utf8"),
    path: scriptPath,
    name: basename(scriptPath),
  };

  return payload;
};

export const refreshCachedScriptPayload = async (
  payload: ScriptExecutePayload,
): Promise<ScriptExecutePayload> => {
  const path = payload.path?.trim();
  if (!path) {
    return payload;
  }

  return await updateCachedScriptPayload(path);
};
