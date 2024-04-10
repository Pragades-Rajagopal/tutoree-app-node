const path = require('path');
require('dotenv').config({
    path: path.resolve('./.env'),
});

const jwt = require('jsonwebtoken');
const { statusCode, authenticationMessage } = require('../config/constants');

module.exports = {
    /**
     * Generates a JSON web token for the given email address
     * @param {object} payload username, email, uid
     * @returns {string} token
     */
    generateToken: (payload) => {
        const accessToken = jwt.sign(payload, process.env.APP_ACCESS_TOKEN, { algorithm: "HS256" });
        return accessToken;
    },


    authenticateToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (typeof token === 'undefined' || token === null) {
            return res.status(statusCode.unauthorized).json({
                statusCode: statusCode.unauthorized,
                message: authenticationMessage.tokenMissing
            })
        }
        jwt.verify(token, process.env.APP_ACCESS_TOKEN, { algorithms: "HS256" }, (err, data) => {
            if (err) {
                return res.status(statusCode.forbidden).json({
                    statusCode: statusCode.forbidden,
                    message: authenticationMessage.invalidToken
                });
            }
            req.user = data;
            next();
        });
    }
}