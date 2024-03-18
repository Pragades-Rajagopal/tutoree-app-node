'use strict'

const { courses, statusCode } = require('../config/constants');
const moment = require('moment');
const appDB = require('../connector/database');

module.exports = {
    /**
      * Saves a courses
      * @param {*} request 
      * @param {*} response 
      * @returns {object}
      */
    saveCourse: async (request, response) => {
        try {
            const course = request.body.course;
            await saveCourse(course);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: courses.success
            });
        } catch (error) {
            console.error('Error while saving course');
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.error,
                message: courses.error
            });
        }
    },

    /**
      * Retrieves all courses
      * @param {*} request 
      * @param {*} response 
      * @returns {object}
      */
    getAllCourses: async (request, response) => {
        try {
            const data = await getAllCourses();
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: courses.success,
                data: data
            });
        } catch (error) {
            console.error('Error while fetching courses');
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.error,
                message: courses.error,
                data: []
            });
        }
    }
}

/**
 * Models
 */

/**
 * Save course
 * @param {string} name 
 * @returns null
 */
const saveCourse = (name) => {
    const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    const sql = `
        INSERT INTO courses
        (name, "_status", "_created_on", "_modified_on")
        VALUES(?, 1, ?, ?)
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [name, currentTime, currentTime], (err) => {
            if (err) {
                reject('error at saveCourse method');
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Gets all courses
 * @returns null
 */
const getAllCourses = () => {
    const sql = `
        SELECT id, name FROM courses
        WHERE _status = 1
        ORDER BY name ASC
    `;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [], (err, data) => {
            if (err) {
                reject('error at getAllCourses method');
            } else {
                resolve(data);
            }
        })
    });
}