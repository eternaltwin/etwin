import { DinoparcCredentials } from "./dinoparc-credentials.js";
import { DinoparcSession } from "./dinoparc-session.js";

export interface DinoparcClientService {
  createSession(options: DinoparcCredentials): Promise<DinoparcSession>;
}
