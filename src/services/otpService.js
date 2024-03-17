const { otpMessages, statusCode } = require('../config/constants');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Generates OTP and inserts into OTP table
     * @param {string} email 
     * @param {time} createdOn
     * @returns {string} generated OTP
     */
    generateOTP: async (email, createdOn) => {
        try {
            const pin = generatePin();
            await saveOTP(email, pin, createdOn);
            console.log(otpMessages.generated);
            return pin;
        } catch (error) {
            console.error(otpMessages.generateError);
            console.error(error);
        }
    },

    /**
     * Validates OTP for the given email address
     * @param {string} email 
     * @param {string} otp 
     * @returns {object}
     */
    validateOTP: async (email, otp) => {
        try {
            const data = await getOTP(email)
            if (data && data.length === 0) {
                return {
                    statusCode: statusCode.notFound,
                    message: otpMessages.notFound
                };
            }
            if (data && data['0'].pin === otp) {
                console.log(otpMessages.validated);
                return {
                    statusCode: statusCode.success,
                    message: otpMessages.validated
                };
            } else {
                console.log(otpMessages.notValidated);
                return {
                    statusCode: statusCode.error,
                    message: otpMessages.notValidated
                }
            }
        } catch (error) {
            console.error(otpMessages.error);
            console.error(error);
            return {
                statusCode: statusCode.serverError,
                message: otpMessages.error
            }
        }
    },

    /**
     * Updates status in User model after email verification
     * @param {string} email 
     */
    updateVerificationStatus: async (email) => {
        try {
            await updateStatus(email);
            console.log(otpMessages.verified);
        } catch (error) {
            console.error(otpMessages.verifyError);
            console.error(error);
        }
    }
}

/**
 * Generates a 4 digit number
 * @returns {string} pin
 */
const generatePin = () => {
    const min = 0;
    const max = 9999;
    const rNum = Math.floor(Math.random() * (max - min + 1)) + min;
    const pin = rNum.toString().padStart(4, '0');
    return pin;
}

/**
 * Models
 */

/**
 * Saves new OTP 
 * @param {string} email 
 * @param {string} pin 
 * @param {string} createdOn 
 * @returns null
 */
const saveOTP = (email, pin, createdOn) => {
    return new Promise((resolve, reject) => {
        const sql = `
            insert into otp (email, pin, created_on)
            values (?, ?, ?)
        `;
        appDB.run(sql, [email, pin, createdOn], (err) => {
            if (err) {
                console.log(err);
                reject('error while saving OTP');
            } else {
                resolve('success');
            }
        })
    })
}

/**
 * Fetches OTP data for the given email
 * @param {string} email 
 * @returns {object}
 */
const getOTP = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            select * from otp 
            where email = ?
            order by id desc 
            limit 1 
        `;
        appDB.all(sql, [email], (err, data) => {
            if (err) {
                console.log(err);
                reject('error while fetching OTP data');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Updates status for an user upon success OTP verification
 * @param {string} email 
 * @returns null
 */
const updateStatus = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            update users
            set is_email_verified = 1,
            _status = 1
            where email = ?
        `;
        appDB.run(sql, [email], (err) => {
            if (err) {
                reject('error while updating user status');
            } else {
                resolve('success');
            }
        })
    });
}