import url from "url";
import furi from "furi";

const PROJECT_ROOT: url.URL = furi.join(import.meta.url, "..", "..");

export function resolveScriptFuri(...components: readonly string[]): url.URL {
  return furi.join(PROJECT_ROOT, "scripts", ...components);
}
