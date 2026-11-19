import crypto from "crypto";
import { IIdGenerator, IdPrefix } from "../../../application/interface/services/IIdGenerator";

export class BusinessIdGenerator implements IIdGenerator {
  private readonly alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  generate(prefix: IdPrefix): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePart = `${yy}${mm}${dd}`;

    const randomBytes = crypto.randomBytes(6);
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += this.alphabet[randomBytes[i] % this.alphabet.length];
    }

    return `${prefix}-${datePart}-${suffix}`;
  }
}
