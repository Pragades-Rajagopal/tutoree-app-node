const { check } = require('express-validator');

exports.registerUser = [
    check('firstName')
        .exists()
        .not()
        .isEmpty()
        .withMessage("firstName is mandatory"),
    check('lastName')
        .exists()
        .not()
        .isEmpty()
        .withMessage("lastName is mandatory"),
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format'),
    check('password')
        .exists()
        .not()
        .isEmpty()
        .withMessage('password is mandatory')
        .isLength({ min: 6 })
        .withMessage('Password must be atleast 6 characters'),
    check('mobileNo')
        .exists()
        .not()
        .isEmpty()
        .withMessage('mobileNo is mandatory')
        .isLength({ min: 10, max: 10 })
        .withMessage('Mobile number must be of 10 digits'),
    check('type')
        .exists()
        .not()
        .isEmpty()
        .withMessage("type is mandatory"),
];

exports.otpValidation = [
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format'),
    check('pin')
        .exists()
        .not()
        .isEmpty()
        .withMessage('pin is mandatory')
        .isLength({ min: 4, max: 4 })
        .withMessage('Pin must be of 4 digits')
];

exports.loginValidation = [
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format'),
    check('password')
        .exists()
        .not()
        .isEmpty()
        .withMessage('password is mandatory')
        .isLength({ min: 6 })
        .withMessage('Password must be atleast 6 characters')
];

exports.resetPassValidation = [
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format'),
    check('password')
        .exists()
        .not()
        .isEmpty()
        .withMessage('password is mandatory')
        .isLength({ min: 6 })
        .withMessage('Password must be atleast 6 characters'),
    check('otp')
        .exists()
        .not()
        .isEmpty()
        .withMessage('otp is mandatory')
        .isLength({ min: 4, max: 4 })
        .withMessage('OTP must be of 4 digits')
];

exports.resendOTPvalidation = [
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format')
];

exports.userLogoutValidation = [
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format')
];

exports.deactivateUserValidation = [
    check('email')
        .exists()
        .not()
        .isEmpty()
        .withMessage('email is mandatory')
        .isEmail()
        .withMessage('Invalid email format')
];