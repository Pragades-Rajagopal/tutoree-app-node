const { check } = require('express-validator');

exports.addStudentInterests = [
    check('studentId')
        .exists()
        .not()
        .isEmpty()
        .withMessage('studentId is mandatory')
        .isNumeric()
        .withMessage('studentId should be a number'),
    check('courseIds')
        .exists()
        .not()
        .isEmpty()
        .withMessage('courseIds is mandatory')
        .isArray()
        .withMessage('courseIds should be an array')
];

exports.sendTutorRequest = [
    check('studentId')
        .exists()
        .not()
        .isEmpty()
        .withMessage('studentId is mandatory')
        .isNumeric()
        .withMessage('studentId should be a number'),
    check('tutorId')
        .exists()
        .not()
        .isEmpty()
        .withMessage('tutorId is mandatory')
        .isNumeric()
        .withMessage('tutorId should be a number'),
];