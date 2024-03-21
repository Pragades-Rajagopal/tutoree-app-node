'use strict'

const moment = require('moment');
const { validationResult } = require('express-validator');
const { statusCode, feeds, commonServerError, userTypes } = require('../config/constants');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Adds feed
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    saveFeed: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { content, createdBy, createdById } = request.body;
            await addFeed({
                content: content,
                createdBy: createdBy,
                createdById: createdById
            });
            console.log(feeds.feedAdded);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: feeds.feedAdded
            });
        } catch (error) {
            console.error(feeds.addFeedError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: feeds.addFeedError
            });
        }
    },

    /**
     * Retrieve global feeds
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    getFeeds: async (request, response) => {
        try {
            const { sort, limit, offset } = request.query;
            const data = await getFeedsModel(sort, limit, offset);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: feeds.getFeeds,
                data: data
            });
        } catch (error) {
            console.error(feeds.getFeedsError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: feeds.getFeedsError,
                data: {}
            });
        }
    },

    /**
     * Delete a feed
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    deleteFeed: async (request, response) => {
        try {
            const id = request.params.id;
            await deleteFeedModel(id);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: feeds.deleteFeed,
            });
        } catch (error) {
            console.error(feeds.deleteFeedError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: feeds.deleteFeedError,
            });
        }
    },

    /**
     * Retrieves user info of the posted feed
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    getFeedUserData: async (request, response) => {
        try {
            const id = request.params.userid;
            const user = await getUserData(id);
            if (user && user.length === 0) {
                return response.status(statusCode.notFound).json({
                    statusCode: statusCode.notFound,
                    message: feeds.userNotFound,
                    data: {}
                });
            }
            const data = await getFeedUserInfo(id, user[0]["_type"])
            data[0].userType = user[0]['_type'];
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: feeds.success,
                data: data[0]
            });
        } catch (error) {
            console.error(feeds.error);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: feeds.error,
                data: {}
            });
        }
    }
}

/**
 * Models
 */

/**
 * 
 * @param {object} data content,createdBy,createdById
 * @returns 
 */
const addFeed = (data) => {
    const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    const sql = `
        INSERT INTO feeds (content, created_by, created_by_id, created_on)
        VALUES (?,?,?,?)
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [data.content, data.createdBy, data.createdById, currentTime], (err) => {
            if (err) {
                reject('error at addFeed method');
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Retrieves global feeds
 * @param {string} sort eg.: asc 
 * @param {number} limit 
 * @param {number} offset 
 * @returns null
 */
const getFeedsModel = (sort, limit, offset) => {
    let sqlQuery;
    let conditions = [];
    if (sort && sort.toLowerCase() === 'asc' && limit && offset) {
        sqlQuery = `
                    SELECT
                        f.*,
                        STRFTIME('%d', created_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
                        1 + 3 * STRFTIME('%m', created_on), -3) as date_
                    FROM
                        feeds f
                    ORDER BY
                        id ASC 
                    LIMIT ? OFFSET ?
                `;
        conditions = [limit, offset];
    } else if (sort && sort.toLowerCase() === 'asc') {
        sqlQuery = `
                    SELECT
                        f.*,
                        STRFTIME('%d', created_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
                        1 + 3 * STRFTIME('%m', created_on, -3) as date_
                    FROM
                        feeds f
                    ORDER BY
                        id ASC 
                `;
    } else if (limit && offset) {
        sqlQuery = `
                SELECT
                    f.*,
                    STRFTIME('%d', created_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
                    1 + 3 * STRFTIME('%m', created_on), -3) as date_
                FROM
                    feeds f
                ORDER BY
                    id DESC
                LIMIT ? OFFSET ?`;
        conditions = [limit, offset];
    } else {
        sqlQuery = `
                    SELECT
                        f.*,
                        STRFTIME('%d', created_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
                        1 + 3 * STRFTIME('%m', created_on), -3) as date_
                    FROM
                        feeds f
                    ORDER BY
                        id DESC
                `;
    }
    return new Promise((resolve, reject) => {
        appDB.all(sqlQuery, conditions, (err, data) => {
            if (err) {
                reject('error at getFeedsModel');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Deletes feed
 * @param {number} id 
 * @returns null
 */
const deleteFeedModel = (id) => {
    const sql = `DELETE FROM feeds WHERE id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [id], (err) => {
            if (err) {
                reject('error at deleteFeedModel');
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Gets user info
 * @param {number} id 
 * @returns null
 */
const getUserData = (id) => {
    const sql = `SELECT _type FROM users WHERE id = ?`;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [id], (err, data) => {
            if (err) {
                reject('error at getUserData method');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Get user info of the posted feed
 * @param {number} id 
 * @param {string} userType 
 * @returns null
 */
const getFeedUserInfo = async (id, userType) => {
    let sql;
    if (userType === userTypes.student) {
        sql = `
                SELECT
                    id,
                    name,
                    email,
                    REPLACE(interests,
                    ', ',
                    '\n') as interests
                FROM
                    student_info_vw
                WHERE
                    id = ?
                `;
    } else if (userType == userTypes.tutor) {
        sql = `
                SELECT
                    id,
                    name,
                    email,
                    REPLACE(interests,
                    ', ',
                    '\n') as interests,
                    mail_subscription,
                    bio,
                    websites 
                FROM
                    tutor_info_vw
                WHERE
                    id = ?
                `;
    }
    return new Promise((resolve, reject) => {
        appDB.all(sql, [id], (err, data) => {
            if (err) {
                reject('error at getFeedUserInfo method');
            } else {
                resolve(data);
            }
        })
    });
}