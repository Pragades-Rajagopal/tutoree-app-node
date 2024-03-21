const { check } = require("express-validator");

exports.saveFeedValidation = [
    check('content')
        .exists()
        .not()
        .isEmpty()
        .withMessage("content is mandatory"),
    check('createdBy')
        .exists()
        .not()
        .isEmpty()
        .withMessage("createdBy is mandatory"),
    check('createdById')
        .exists()
        .not()
        .isEmpty()
        .withMessage("createdById is mandatory"),
];

