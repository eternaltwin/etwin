import { environment } from "../../../environments/environment";

export function apiUri(...components: readonly string[]): string {
  console.log(environment.apiBase);
  return `${environment.apiBase}/${components.map(encodeURIComponent).join("/")}`;
}
