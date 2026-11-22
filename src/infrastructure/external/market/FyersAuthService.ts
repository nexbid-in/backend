import axios from "axios";
import crypto from "crypto";
import redis from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../logging/logger";
import { IBrokerAuthService } from "../../../application/interface/services/IBrokerAuthService";

export class FyersAuthService implements IBrokerAuthService {
  public static readonly REDIS_TOKEN_KEY = "market:fyers:access_token";
  public static readonly TOKEN_TTL_SECONDS = 86400;

  private static base32Decode(base32: string): Buffer {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    const cleanStr = base32.replace(/\s+/g, "").toUpperCase();

    for (let i = 0; i < cleanStr.length; i++) {
      const val = alphabet.indexOf(cleanStr[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, "0");
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  public static generateTOTP(secretKey: string): string {
    const key = FyersAuthService.base32Decode(secretKey);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, "0");
  }

  public async generateAndStoreAccessToken(): Promise<string> {
    const fyId = env.FYERS_USER_ID?.trim();
    const pin = env.FYERS_PIN?.trim();
    const totpKey = env.FYERS_TOTP_KEY?.trim();
    const appId = env.FYERS_APP_ID?.trim();
    const secretKey = env.FYERS_SECRET_KEY?.trim();
    const redirectUri = env.FYERS_REDIRECT_URI?.trim() || "https://trade.fyers.in/api-login/redirect-uri/index.html";

    if (!fyId || !pin || !totpKey || !appId || !secretKey) {
      throw new Error(
        "Cannot automate Fyers login: Missing FYERS_USER_ID, FYERS_PIN, FYERS_TOTP_KEY, FYERS_APP_ID, or FYERS_SECRET_KEY in environment."
      );
    }

    logger.info("Starting automated Fyers API v3 headless authentication...");

    try {
      const res1 = await axios.post<{ request_key: string }>(
        "https://api-t2.fyers.in/vagator/v2/send_login_otp",
        { fy_id: fyId, app_id: "2" }
      );
      const requestKey1 = res1.data.request_key;
      if (!requestKey1) {
        throw new Error(`Step 1 (send_login_otp) failed: No request_key returned (${JSON.stringify(res1.data)})`);
      }

      const totp = FyersAuthService.generateTOTP(totpKey);
      const res2 = await axios.post<{ request_key: string; s: string }>(
        "https://api-t2.fyers.in/vagator/v2/verify_otp",
        { request_key: requestKey1, otp: totp }
      );
      const requestKey2 = res2.data.request_key;
      if (!requestKey2) {
        throw new Error(`Step 2 (verify_otp) failed: No request_key returned (${JSON.stringify(res2.data)})`);
      }

      const res3 = await axios.post<{ data: { access_token: string }; s: string }>(
        "https://api-t2.fyers.in/vagator/v2/verify_pin",
        { request_key: requestKey2, identity_type: "pin", identifier: pin }
      );
      const webToken = res3.data.data?.access_token;
      if (!webToken) {
        throw new Error(`Step 3 (verify_pin) failed: No web access_token returned (${JSON.stringify(res3.data)})`);
      }

      const pureAppId = appId.split("-")[0];
      const appType = appId.split("-")[1] || "100";

      const res4 = await axios.post<{ Url: string; s: string }>(
        "https://api-t1.fyers.in/api/v3/token",
        {
          fyers_id: fyId,
          app_id: pureAppId,
          redirect_uri: redirectUri,
          appType,
          code_challenge: "",
          state: "None",
          scope: "",
          nonce: "",
          response_type: "code",
          create_cookie: true
        },
        {
          headers: {
            authorization: `Bearer ${webToken}`,
            "content-type": "application/json"
          },
          validateStatus: (status) => status < 400
        }
      );

      const redirectUrl = res4.data.Url;
      if (!redirectUrl) {
        throw new Error(`Step 4 (token) failed: No redirect Url returned (${JSON.stringify(res4.data)})`);
      }

      const urlObj = new URL(redirectUrl);
      const authCode = urlObj.searchParams.get("auth_code");
      if (!authCode) {
        throw new Error(`Step 4 (token) failed: No auth_code found in redirect URL (${redirectUrl})`);
      }

      const appIdHash = crypto
        .createHash("sha256")
        .update(`${appId}:${secretKey}`)
        .digest("hex");

      const res5 = await axios.post<{ access_token: string; s: string; code: number }>(
        "https://api-t1.fyers.in/api/v3/validate-authcode",
        {
          grant_type: "authorization_code",
          appIdHash,
          code: authCode
        }
      );

      const accessToken = res5.data.access_token;
      if (!accessToken) {
        throw new Error(`Step 5 (validate-authcode) failed: No access_token returned (${JSON.stringify(res5.data)})`);
      }

      await redis.set(
        FyersAuthService.REDIS_TOKEN_KEY,
        accessToken,
        "EX",
        FyersAuthService.TOKEN_TTL_SECONDS
      );

      logger.info(
        { expiresSeconds: FyersAuthService.TOKEN_TTL_SECONDS },
        "Successfully generated and stored Fyers API v3 access token in Redis"
      );

      return accessToken;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error(
          {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url
          },
          "Fyers automated login HTTP error"
        );
      } else {
        logger.error({ error }, "Fyers automated login unexpected error");
      }
      throw error;
    }
  }

  public async getOrRefreshToken(force = false): Promise<string> {
    if (!force) {
      const existing = await redis.get(FyersAuthService.REDIS_TOKEN_KEY);
      if (existing) {
        return existing;
      }
    }
    return this.generateAndStoreAccessToken();
  }
}
