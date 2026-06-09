import {Router} from "express";
import { verifyJWT } from "../middlewares/verifyJWT.middleware.js";
import {  otpRequest,
  otpVerify,
  register,
  login,
  logout,
  refresh,
  changePassword
 } from "../controllers/auth.controller.js";

const router = Router();

router.route('/otp-request').post(otpRequest);
router.route('/otp-verify').post(otpVerify);
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/refresh').post(verifyJWT , refresh);
router.route('/change-password').post(verifyJWT , changePassword);
router.route('/logout').post(verifyJWT , logout);

export default router;