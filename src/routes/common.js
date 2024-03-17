const Router = require('express').Router();
const userComponent = require('../components/User');
const { authenticateToken } = require('../services/middlewareService');
const userValidations = require('../validators/user');

Router.post('/users', userValidations.registerUser, userComponent.addUser);
Router.post('/validate-otp', userValidations.otpValidation, userComponent.otpValidator);
Router.post('/login', userValidations.loginValidation, userComponent.userLogin);
Router.post('/reset-password', userValidations.resetPassValidation, userComponent.resetPassword);
Router.post('/resend-otp', userValidations.resendOTPvalidation, userComponent.resendOTP);
Router.post('/logout', userValidations.userLogoutValidation, userComponent.userLogout);
Router.post('/deactivate', userValidations.deactivateUserValidation, userComponent.deactivateUser);

module.exports = Router;