const Router = require('express').Router();
// components
const userComponent = require('../components/User');
const studentComponent = require('../components/Student');
const tutorComponent = require('../components/Tutor');
const commonComponent = require('../components/Common');
const feedComponent = require('../components/Feeds');
// services
const { authenticateToken } = require('../services/middlewareService');
// validations
const userValidations = require('../validators/user');
const studentValidations = require('../validators/student');
const tutorValidations = require('../validators/tutor');
const commonValidations = require('../validators/common');
const { saveFeedValidation } = require('../validators/feeds');

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
 * Tutor router
 */
Router.post('/tutor/profile', authenticateToken, tutorValidations.addTutorInterests, tutorComponent.saveTutorProfile);
Router.get('/tutor/profile/:id', authenticateToken, tutorComponent.getTutorProfile);
Router.get('/tutor/request/:id', authenticateToken, tutorComponent.getRequestInfo);
Router.post('/tutor/request-hide', authenticateToken, tutorValidations.hideTutorRequest, tutorComponent.hideRequest);

/**
 * Common router
 */
Router.get('/all-courses', commonComponent.getAllCourses);
Router.post('/course', authenticateToken, commonValidations.postCourse, commonComponent.saveCourse);

/**
 * Feed router
 */
Router.post('/feed', authenticateToken, saveFeedValidation, feedComponent.saveFeed);
Router.get('/feed', authenticateToken, feedComponent.getFeeds);
Router.delete('/feed/:id', authenticateToken, feedComponent.deleteFeed);
Router.get('/feed-user/:userid', authenticateToken, feedComponent.getFeedUserData);
Router.put('/feed/:id/upvote', authenticateToken, feedComponent.updateUpvote);

/**
 * Internal routes
 */
Router.get('/internal/get-users/:type', authenticateToken, userComponent.getAllUsers);

module.exports = Router;