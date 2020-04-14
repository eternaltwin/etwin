import { ConsoleEmailService } from "../lib/index.js";

const email = new ConsoleEmailService();

setInterval(
  async () => {
    await email.sendEmail(
      "user@localhost",
      {
        title: "Hi",
        textBody: `Hello dear user, the current time is: ${new Date().toISOString()}`,
      },
    );
  },
  1000,
);
