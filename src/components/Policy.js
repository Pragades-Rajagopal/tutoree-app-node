'use strict'

const { statusCode, commonServerError, userTypes, policies } = require('../config/constants');
const moment = require('moment');
const { validationResult } = require('express-validator');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Saves app policy to the system
     * 
     * Internal method and only admin can access
     * @param {*} request 
     * @param {*} response 
     * @returns response
     */
    savePolicy: async (request, response) => {
        try {
            // request body validation
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            // only admin can access this method
            const userType = request.user["_type"];
            if (userType !== userTypes.admin) {
                return response.status(statusCode.forbidden).json({
                    statusCode: statusCode.forbidden,
                    message: commonServerError.forbidden
                })
            }
            const body = request.body;
            await savePolicyData(body);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: policies.saveSuccess
            });
        } catch (error) {
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: error
            });
        }
    },

    /**
     * Gets all policies
     * @param {*} request 
     * @param {*} response 
     * @returns response
     */
    getPolicies: async (request, response) => {
        try {
            const data = await getPolicyData();
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: 'success',
                data: data
            });
        } catch (error) {
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: policies.error
            });
        }
    },

    /**
     * Delete a policy
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    deletePolicy: async (request, response) => {
        try {
            const id = request.params.id;
            await deletePolicyData(id);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: policies.deletePolicy,
            });
        } catch (error) {
            console.error(policies.deletePolicyError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: policies.deletePolicyError,
            });
        }
    }
}

/**
 * Models
 */

/**
 * Saves policy to the system
 * @param {object} data 
 * @returns null
 */
const savePolicyData = (data) => {
    const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    const sql = `
        INSERT INTO policies (title, content, created_by, created_on)
        VALUES (?,?,?,?)
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [data.title, data.content, data.createdBy, currentTime], (err) => {
            if (err) {
                reject(err.message);
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Gets all policy data
 * @returns data
 */
const getPolicyData = () => {
    const sql = `SELECT * FROM policies`;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [], (err, data) => {
            if (err) {
                reject("error at getPolicyData method");
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Delete a policy
 * @param {number} id 
 * @returns null
 */
const deletePolicyData = (id) => {
    const sql = `DELETE FROM policies WHERE id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [id], (err) => {
            if (err) {
                reject(err.message);
            } else {
                resolve('success');
            }
        })
    });
}