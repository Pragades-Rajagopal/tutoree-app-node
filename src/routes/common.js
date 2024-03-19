const Router = require('express').Router();
// components
const userComponent = require('../components/User');
const studentComponent = require('../components/Student');
const commonComponent = require('../components/Common');
// services
const { authenticateToken } = require('../services/middlewareService');
// validations
const userValidations = require('../validators/user');
const studentValidations = require('../validators/student');
const commonValidations = require('../validators/common');

/**
 * User router
 */
Router.post('/users', userValidations.registerUser, userComponent.addUser);
Router.post('/validate-otp', userValidations.otpValidation, userComponent.otpValidator);
Router.post('/login', userValidations.loginValidation, userComponent.userLogin);
Router.post('/reset-password', userValidations.resetPassValidation, userComponent.resetPassword);
Router.post('/resend-otp', userValidations.resendOTPvalidation, userComponent.resendOTP);
Router.post('/logout', userValidations.userLogoutValidation, userComponent.userLogout);
Router.post('/deactivate', userValidations.deactivateUserValidation, userComponent.deactivateUser);

/**
 * Student router
 */
Router.post('/student/interest', authenticateToken, studentValidations.addStudentInterests, studentComponent.saveStudentInterest);
Router.get('/student/interest/:id', authenticateToken, studentComponent.getStudentInterests);
Router.get('/student/tutor-list/:student_id', authenticateToken, studentComponent.getTutorList);
Router.post('/student/request', authenticateToken, studentValidations.sendTutorRequest, studentComponent.sendRequest);

/**
 * Common router
 */
Router.get('/all-courses', commonComponent.getAllCourses);
Router.post('/course', authenticateToken, commonValidations.postCourse, commonComponent.saveCourse);

module.exports = Router;