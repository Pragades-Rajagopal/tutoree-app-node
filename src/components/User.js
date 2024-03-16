'use strict'

const moment = require('moment');
const mailService = require('../services/mailService');
const otpService = require('../services/otpService');
const loginService = require('../services/loginService');
const middleware = require('../services/middlewareService');
const { statusCode, user, emailType, otpMessages } = require('../config/constants');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Saves user data into Users model
     * @param {*} request 
     * @param {*} response 
     * @returns 
     */
    addUser: async (request, response) => {
        try {
            const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
            const body = request.body;
            const result = await saveUser(body);
            console.log(result);
            if (!result) {
                return response.status(500).json({
                    statusCode: statusCode.serverError,
                    message: null,
                    error: user.notRegistered
                });
            }
            const otp = await otpService.generateOTP(body.email, currentTime);
            console.log(otp);
            mailService.sendRegistrationOTPEmail(body.email, otp, emailType.register);
            return response.status(200).json({
                statusCode: statusCode.success,
                message: user.registered,
                error: null
            });
        } catch (error) {
            console.error(error);
            return response.status(500).json({
                statusCode: statusCode.serverError,
                message: null,
                error: otpMessages.notRegistered
            });
        }
    }
}


/**
 * Models
 */

/**
 * Saves user info
 * @param {object} data 
 * @returns null
 */
const saveUser = (data) => {
    const sql = `
        INSERT
        INTO
        users
        (
            first_name,
            last_name,
            email,
            password,
            mobile_no,
            is_email_verified,
            is_mobile_verified,
            "_type",
            "_status",
            "_created_on",
            "_modified_on"
        ) VALUES (
        ?,?,?,?,?,0,0,?,0,
        DATETIME(),
        DATETIME());
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [data.firstName, data.lastName, data.email, data.password, data.mobileNo, data.type], (err) => {
            if (err) {
                console.error(err);
                console.error('error while saving the user');
                reject(false);
            } else {
                resolve(true);
            }
        })
    });
}