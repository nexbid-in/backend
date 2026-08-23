import { createTransport} from "nodemailer";
import { env } from "../../config/env";

export const mailTransporter = createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});
