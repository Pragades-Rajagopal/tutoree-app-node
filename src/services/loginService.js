const { loginService, user, statusCode } = require('../config/constants');
const bcrypt = require('bcrypt');
const appDB = require('../connector/database');
const salt = 10;

module.exports = {
    /**
     * Hashes password
     * @param {string} password
     * @returns {string} Hashed Password
     */
    hashPass: async (password) => {
        try {
            const genSalt = await bcrypt.genSalt(salt);
            const hash = await bcrypt.hash(password, genSalt);
            console.log(loginService.hash.success);
            return hash;
        } catch (error) {
            console.error(loginService.hash.error);
            console.error(error);
        }
    },

    /**
     * Verifies the password for user login
     * @param {string} email 
     * @param {string} password 
     * @returns {boolean}
     */
    verifyPass: async (email, password) => {
        try {
            const data = await getUserPassword(email);
            if (!data || data.length === 0) {
                console.log(user.notRegistered);
                return statusCode.notFound;
            }
            const result = await bcrypt.compare(password, data[0].password);
            console.log(loginService.verification.success);
            return result;
        } catch (error) {
            console.error(loginService.verification.error);
            console.error(error);
            return false;
        }
    },

    /**
     * (Reset Password) Updates password for the user
     * @param {string} email 
     * @param {string} hashPass 
     * @returns {object} response
     */
    resetPassword: async (email, hashPass) => {
        try {
            await updatePassword(hashPass, email);
            console.log(loginService.resetPassword.success);
            return {
                statusCode: statusCode.success,
                message: loginService.resetPassword.success
            }
        } catch (error) {
            console.error(loginService.resetPassword.error);
            return {
                statusCode: statusCode.serverError,
                message: loginService.resetPassword.error
            }
        }
    }
}

/**
 * Models
 */

/**
 * Gets encrypted password for an user
 * @param {string} email 
 * @returns {object}
 */
const getUserPassword = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            select password from users 
            where email = ${email}
            and _status = 1
        `;
        appDB.all(sql, [], (err, data) => {
            if (err) {
                reject('error at common/getUserPassword model')
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Updates password using Forget Password
 * @param {string} hashPass 
 * @param {string} email 
 * @returns null
 */
const updatePassword = (hashPass, email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE users 
            SET password = ?
            WHERE email = ?
        `;
        appDB.run(sql, [hashPass, email], (err) => {
            if (err) {
                reject('error while updating password');
            } else {
                resolve('success');
            }
        })
    });
}