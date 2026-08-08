import {Router} from "express";
import { verifyJWT } from "../middlewares/verifyJWT.middleware.js";
import {  otpRequest,
  otpVerify,
  register,
  login,
  logout,
  refresh,
  changePassword,
  getCurrentUser

 } from "../controllers/auth.controller.js";

const router = Router();

router.route('/otp-request').post(otpRequest);
router.route('/otp-verify').post(otpVerify);
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/refresh').post(refresh);
router.route('/change-password').post(changePassword);
router.route('/logout').post(verifyJWT , logout);
router.route('/getCurrentUser').post(verifyJWT , getCurrentUser);
export default router;