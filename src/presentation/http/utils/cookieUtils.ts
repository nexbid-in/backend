import { Response } from "express";
import { env } from "../../../infrastructure/config/env";

const IS_PROD = env.NODE_ENV === "production";

export const setAuthCookies = (res: Response, accessToken: string, refreshToken?: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
  })
};
