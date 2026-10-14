export type GooglePayloadDTO = {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
};

export interface IGoogleAuthService {
  verifyIdToken(idToken: string): Promise<GooglePayloadDTO>;
}
