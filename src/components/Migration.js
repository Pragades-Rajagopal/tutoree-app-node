const appDB = require('../connector/database');
const { statusCode, userTypes, commonServerError } = require('../config/constants');

module.exports = {
    /**
     * Migration component to perform migration through API
     * 
     * Internal function - Requires admin privilege
     * @param {*} request 
     * @param {*} response 
     * @returns response
     */
    runMigration: async (request, response) => {
        try {
            const userType = request.user["_type"];
            if (userType !== userTypes.admin) {
                return response.status(statusCode.forbidden).json({
                    statusCode: statusCode.forbidden,
                    message: commonServerError.forbidden
                })
            }
            const { query } = request.body;
            if (typeof query === 'undefined') {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: 'bad request; "query" is mandatory'
                });
            }
            await migrationModel(query);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: 'success'
            });
        } catch (error) {
            console.log(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                error: error
            })
        }
    }
}

/**
 * Models
 */

/**
 * Migration model
 * @param {string} query 
 * @returns null
 */
const migrationModel = (query) => {
    return new Promise((resolve, reject) => {
        appDB.run(query, [], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve('success');
            }
        })
    });
}