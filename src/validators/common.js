const { check } = require('express-validator');

exports.postCourse = [
    check('course')
        .exists()
        .not()
        .isEmpty()
        .withMessage('course name is mandatory')
];