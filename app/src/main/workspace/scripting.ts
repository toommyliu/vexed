import { promises as fs } from "fs";
import { basename, sep } from "path";
import type { ScriptExecutePayload } from "../../shared/ipc";

export const resolveScriptPath = async (
  scriptsPath: string,
  path: string,
): Promise<string> => {
  await fs.mkdir(scriptsPath, { recursive: true });

  const [scriptsRoot, scriptPath] = await Promise.all([
    fs.realpath(scriptsPath),
    fs.realpath(path),
  ]);

  if (
    scriptPath !== scriptsRoot &&
    !scriptPath.startsWith(`${scriptsRoot}${sep}`)
  ) {
    throw new Error("Script path must be inside the scripts directory");
  }

  return scriptPath;
};

export const readScriptPayload = async (
  scriptsPath: string,
  path: string,
): Promise<ScriptExecutePayload> => {
  const scriptPath = await resolveScriptPath(scriptsPath, path);
  return {
    source: await fs.readFile(scriptPath, "utf8"),
    path: scriptPath,
    name: basename(scriptPath),
  };
};

export const refreshScriptPayload = async (
  scriptsPath: string,
  payload: ScriptExecutePayload,
): Promise<ScriptExecutePayload> => {
  const path = payload.path?.trim();
  if (!path) {
    return payload;
  }

  return await readScriptPayload(scriptsPath, path);
};
