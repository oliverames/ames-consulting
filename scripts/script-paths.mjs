import { fileURLToPath } from "node:url";

export function projectRootFromScriptUrl(scriptUrl) {
  return fileURLToPath(new URL("../", scriptUrl));
}
