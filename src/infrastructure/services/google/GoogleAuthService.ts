import { OAuth2Client } from "google-auth-library";
import { IGoogleAuthService, GooglePayloadDTO } from "../../../application/interface/services/IGoogleAuthService";
import { env } from "../../config/env";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class GoogleAuthService implements IGoogleAuthService {
  private readonly client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  async verifyIdToken(idToken: string): Promise<GooglePayloadDTO> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.sub) {
        throw new AppError(ErrorCodes.INVALID_GOOGLE_TOKEN);
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name || payload.name || "User",
        lastName: payload.family_name || "",
        profileImage: payload.picture || null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCodes.GOOGLE_AUTH_FAILED);
    }
  }
}
