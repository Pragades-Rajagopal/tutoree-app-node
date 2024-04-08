const { check } = require('express-validator');

exports.addPolicy = [
    check('title')
        .exists()
        .not()
        .isEmpty()
        .withMessage("title is mandatory"),
    check('content')
        .exists()
        .not()
        .isEmpty()
        .withMessage("content is mandatory"),
    check('createdBy')
        .exists()
        .not()
        .isEmpty()
        .withMessage('createdBy is mandatory')
        .isNumeric()
        .withMessage('createdBy should be a number')
];