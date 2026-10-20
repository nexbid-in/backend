import { Router } from "express";
import { userController } from "../../../../di/user/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(
  ApiRoutes.USER.PROFILE,
  authMiddleware,
  userController.getProfile.bind(userController),
);

router.get(
  ApiRoutes.USER.UPLOAD_SIGNATURE,
  authMiddleware,
  userController.getUploadSignature.bind(userController),
);

router.patch(
  ApiRoutes.USER.PROFILE,
  authMiddleware,
  userController.updateProfile.bind(userController),
);

export default router;
