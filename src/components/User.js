'use strict'

const moment = require('moment');
const mailService = require('../services/mailService');
const otpService = require('../services/otpService');
const loginService = require('../services/loginService');
const middleware = require('../services/middlewareService');
const { statusCode, user, emailType, otpMessages, commonServerError, databaseErrors, userTypes } = require('../config/constants');
const appDB = require('../connector/database');
const { validationResult } = require('express-validator');

module.exports = {
    /**
     * Saves user data into Users model
     * @param {*} request 
     * @param {*} response 
     * @returns 
     */
    addUser: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
            const body = request.body;
            body.password = await loginService.hashPass(body.password);
            await saveUser(body);
            const otp = await otpService.generateOTP(body.email, currentTime);
            mailService.sendRegistrationOTPEmail(body.email, otp, emailType.register);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: user.registered,
                error: null
            });
        } catch (error) {
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: error.message,
                error: commonServerError.internal,
                code: error.code
            });
        }
    },

    /**
     * Local method - Validates OTP for the user
     * 
     * Calls `validateOTP` method from OTP service
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    otpValidator: async (request, response) => {
        const validationErrors = validationResult(request);
        if (!validationErrors.isEmpty()) {
            return response.status(statusCode.error).json({
                statusCode: statusCode.error,
                message: validationErrors.mapped(),
                error: commonServerError.badRequest,
            });
        }
        const { email, pin } = request.body;
        const result = await otpService.validateOTP(email, pin);
        if (result.statusCode === statusCode.success) {
            await otpService.updateVerificationStatus(email);
        }
        return response.status(result.statusCode).json(result);
    },

    /**
     * Local method - Verifies user login and generates token
     * 
     * - Calls `verifyPass` method from Login service
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    userLogin: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { email, password } = request.body;
            const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
            const verify = await loginService.verifyPass(email, password);
            if (verify === statusCode.notFound) {
                return response.status(statusCode.notFound).json({
                    statusCode: statusCode.notFound,
                    message: user.notRegistered,
                    token: ""
                });
            } else if (!verify) {
                return response.status(statusCode.unauthorized).json({
                    statusCode: statusCode.unauthorized,
                    message: user.incorrectAuth,
                    token: ""
                });
            }
            const data = await getUserInfo(email, 'userLogin');
            // Generates JWT and saves in database
            const token = middleware.generateToken(data[0]);
            await deleteUserLogin(email);
            await saveUserLogin(email, token, currentTime);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: "success",
                token: token
            });
        } catch (error) {
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: null,
                error: error
            });
        }
    },

    /**
     * Reset user password
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    resetPassword: async (request, response) => {
        const validationErrors = validationResult(request);
        if (!validationErrors.isEmpty()) {
            return response.status(statusCode.error).json({
                statusCode: statusCode.error,
                message: validationErrors.mapped(),
                error: commonServerError.badRequest,
            });
        }
        const { email, otp, password } = request.body;
        const result = await otpService.validateOTP(email, otp);
        if (result.statusCode !== statusCode.success) {
            return response.status(result.statusCode).json(result);
        }
        const hashPass = await loginService.hashPass(password);
        const res = await loginService.resetPassword(email, hashPass);
        return response.status(statusCode.success).json(res);
    },

    /**
     * Resends OTP to the email
     * @param {*} request 
     * @param {*} response 
     * @returns Triggers email
     */
    resendOTP: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
            const email = request.body.email;
            const userExists = await getUserInfo(email, 'resendOTP');
            if (userExists && userExists.length === 0) {
                return response.status(statusCode.notFound).json({
                    statusCode: statusCode.notFound,
                    message: otpMessages.notFound,
                    error: null
                });
            }
            const result = await otpService.generateOTP(email, currentTime);
            mailService.sendRegistrationOTPEmail(email, result, emailType.resendOtp);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: otpMessages.otpSent,
                error: null
            });
        } catch (error) {
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: null,
                error: otpMessages.otpSentError
            });
        }
    },

    /**
     * Verifies user login and logs out
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    userLogout: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const email = request.body.email;
            const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
            const data = await getUserLoginInfo(email);
            if (data && data.length === 0) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: user.userLoginNotFound
                });
            }
            await updateUserloginInfo(email, currentTime);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: user.userlogoutSuccess
            });
        } catch (error) {
            console.error(user.userlogoutError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: user.userlogoutError
            });
        }
    },

    /**
     * Deactivates user by delete all the user data
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    deactivateUser: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { email } = request.body;
            const data = await getUserInfo(email, 'deactivateUser');
            let userId, userType;
            if (data.length === 0) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: user.userNotFoundForDeactivate
                });
            }
            userId = data[0]["id"];
            userType = data[0]["_type"];
            await saveDeactivatedUser(userId);
            await Promise.all([
                deleteFeedsOfUser(userId),
                deleteOTPInfo(email)
            ]);
            if (userType === 'student') {
                await Promise.all([
                    deleteRequestForStudent(userId),
                    deleteStudentInfo(userId),
                    deleteUser(userId)
                ]);
            } else if (userType === 'tutor') {
                console.log('inside tutor block');
                await Promise.all([
                    deleteTutorInfo(userId),
                    deleteUser(userId)
                ]);
            }
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: user.deactivationSuccess
            });
        } catch (error) {
            console.error(user.deactivationError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: user.deactivationError
            });
        }
    },

    /**
     * Gets all active/inactive users from the system
     * 
     * Internal function - Requires admin privilege
     * @param {*} request 
     * @param {*} response 
     * @returns response
     */
    getAllUsers: async (request, response) => {
        try {
            const userType = request.user["_type"];
            if (userType !== userTypes.admin) {
                return response.status(statusCode.forbidden).json({
                    statusCode: statusCode.forbidden,
                    message: commonServerError.forbidden
                })
            }
            const { limit, offset } = request.query;
            const type = request.params.type;
            const data = await getUsersModel(type, limit, offset);
            const count = data?.length;
            return response.status(200).json({
                statusCode: statusCode.success,
                count: count,
                data: data
            })
        } catch (error) {
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: error
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
                console.error('error while saving the user');
                console.error(err.message);
                const message = err.message.split(': ')[0] === databaseErrors.constraint
                    ? err.message.split('SQLITE_CONSTRAINT: ')[1]
                    : err.message.split(': ')[1]
                const code = err.message.split(': ')[0]
                reject({
                    flag: false,
                    message: message,
                    code: code
                });
            } else {
                resolve({
                    flag: true,
                    message: null,
                    code: null
                });
            }
        })
    });
}

/**
 * Gets necessary user info for token payload
 * @param {string} email 
 * @param {string} options calling method
 * @returns {object}
 */
const getUserInfo = (email, options) => {
    let sql;
    if (options === 'userLogin') {
        sql = `SELECT first_name || ' ' || last_name AS username,
        email,
        id,
        _type
        FROM users
        WHERE email = ?
        AND _status = 1`
    } else if (options === 'resendOTP') {
        sql = `SELECT * FROM users
        WHERE email = ?
        AND _status = 1`
    } else if (options === 'deactivateUser') {
        sql = `SELECT id, _type FROM users WHERE email = ?`
    }
    return new Promise((resolve, reject) => {
        appDB.all(sql, [email], (err, data) => {
            if (err) {
                reject('error while getting user data');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Deletes previous user login info for an user
 * @param {string} email 
 * @returns null
 */
const deleteUserLogin = (email) => {
    const sql = `
        DELETE FROM user_login WHERE email = ?
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [email], (err) => {
            if (err) {
                reject('error at deleteUserLogin method');
                console.log(err);
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Saves user login info after successful login
 * @param {string} email 
 * @param {string} token 
 * @param {string} currentTime 
 * @returns null
 */
const saveUserLogin = (email, token, currentTime) => {
    const sql = `
        INSERT INTO user_login (email, token, logged_in)
        VALUES (?,?,?)
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [email, token, currentTime], (err) => {
            if (err) {
                reject('error at saveUserLogin method');
                console.log(err);
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Gets user login info
 * @param {string} email 
 * @returns null
 */
const getUserLoginInfo = (email) => {
    const sql = `SELECT * FROM user_login WHERE email = ?`;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [email], (err, data) => {
            if (err) {
                reject('error at getUserLoginInfo method');
                console.log(err);
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Updates logout time for the user upon logging out
 * @param {string} email 
 * @param {string} currentTime 
 * @returns null
 */
const updateUserloginInfo = (email, currentTime) => {
    const sql = `
        UPDATE user_login 
        SET logged_out = ?
        WHERE email = ?
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [currentTime, email], (err) => {
            if (err) {
                reject('error at updateUserloginInfo method');
                console.log(err);
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Save user info to deactivated user model upon deactivation
 * @param {number} userId 
 * @returns null
 */
const saveDeactivatedUser = (userId) => {
    const sql = `
        INSERT INTO deactivated_users
        (
            uid,
            first_name,
            last_name,
            email,
            password,
            mobile_no,
            is_email_verified,
            is_mobile_verified,
            "_type",
            "_status",
            deactivated_on,
            usage_days
        ) SELECT
            id,
            first_name,
            last_name,
            email,
            password,
            mobile_no,
            is_email_verified,
            is_mobile_verified,
            "_type",
            "_status",
            DATETIME(CURRENT_TIMESTAMP, 'localtime') ,
            CAST(JULIANDAY(DATE('now')) - JULIANDAY(DATE("_created_on")) AS INTEGER)
        FROM
            users u
        WHERE
            u.id = ?
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [userId], (err) => {
            if (err) {
                reject('error at saveDeactivatedUser method');
                console.log(err);
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Deletes feeds upon user deactivation
 * @param {number} userId 
 * @returns null
 */
const deleteFeedsOfUser = (userId) => {
    const sql = `DELETE FROM feeds WHERE created_by_id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [userId], (err) => {
            if (err) {
                reject('error at deleteFeedsOfUser method');
                console.log(err);
            } else {
                resolve('success');
            }
        });
    });
}

/**
 * Deletes OTP info upon user deactivation
 * @param {string} email 
 * @returns null
 */
const deleteOTPInfo = (email) => {
    const sql = `DELETE FROM otp WHERE email = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [email], (err) => {
            if (err) {
                reject('error at deleteOTPInfo method');
                console.log(err);
            } else {
                resolve('success');
            }
        });
    });
}

/**
 * Deletes requests by student upon user deactivation
 * @param {number} userId 
 * @returns null
 */
const deleteRequestForStudent = (userId) => {
    const sql = `DELETE FROM tutor_requests WHERE student_id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [userId], (err) => {
            if (err) {
                reject('error at deleteRequestForStudent method');
                console.log(err);
            } else {
                resolve('success');
            }
        });
    });
}

/**
 * Deletes student info upon user deactivation
 * @param {number} userId 
 * @returns null
 */
const deleteStudentInfo = (userId) => {
    const sql = `DELETE FROM students WHERE student_id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [userId], (err) => {
            if (err) {
                reject('error at deleteStudentInfo method');
                console.log(err);
            } else {
                resolve('success');
            }
        });
    });
}

/**
 * Deletes tutor info upon user deactivation
 * @param {number} userId 
 * @returns null
 */
const deleteTutorInfo = (userId) => {
    const sql = `DELETE FROM tutors WHERE tutor_id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [userId], (err) => {
            if (err) {
                reject('error at deleteTutorInfo method');
                console.log(err);
            } else {
                resolve('success');
            }
        });
    });
}

/**
 * Deletes user info upon user deactivation
 * @param {number} userId 
 * @returns null
 */
const deleteUser = (userId) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [userId], (err) => {
            if (err) {
                reject('error at deleteUser method');
                console.log(err);
            } else {
                resolve('success');
            }
        });
    });
}

/**
 * Get active/deactivated users
 * 
 * Internal use only
 * @param {string} type 
 * @param {number} limit 
 * @param {number} offset 
 * @returns data
 */
const getUsersModel = (type, limit, offset) => {
    var sql = type === 'active'
        ? `
            SELECT
            id,
            first_name || ' ' || last_name as name,
            email,
            mobile_no,
            _type,
            is_email_verified,
            is_mobile_verified,
            _status,
            _created_on,
            _modified_on             
            FROM users 
        `
        : `
            SELECT
            uid,
            first_name || ' ' || last_name as name,
            email,
            mobile_no,
            _type,
            is_email_verified,
            is_mobile_verified,
            _status,
            deactivated_on,
            usage_days
            FROM deactivated_users 
        `;
    if (limit) { sql = sql + `LIMIT ${limit}` }
    if (offset) { sql = sql + ` OFFSET ${offset}` }
    return new Promise((resolve, reject) => {
        appDB.all(sql, [], (err, data) => {
            if (err) {
                console.log(err);
                reject('error at getAllUsersModel');
            } else {
                resolve(data)
            }
        })
    });
}