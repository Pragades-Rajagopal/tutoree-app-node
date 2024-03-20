'use strict'

const moment = require('moment');
const { validationResult } = require('express-validator');
const { tutor, statusCode, userTypes, commonServerError } = require('../config/constants');
const dataService = require('../services/dataService');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Adds Tutor profile
     * @returns {object}
     */
    saveTutorProfile: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { tutorId, courseIds, bio, websites, mailSubscription } = request.body;
            const isTutor = await dataService.checkUser(tutorId, userTypes.tutor);
            if (isTutor && isTutor.length === 0) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: tutor.addIntrstCheckError
                });
            }
            await deleteTutorData(tutorId);
            await addTutorInterests({
                tutorId: tutorId,
                courseIds: courseIds,
                bio: bio || '',
                websites: websites || '',
                mailSubscription: mailSubscription || 0
            });
            console.log(tutor.profileAdded);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: tutor.profileAdded
            });
        } catch (error) {
            console.error(tutor.addInterestError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: tutor.addInterestError
            });
        }
    },

    /**
     * Retrieves tutor profile
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    getTutorProfile: async (request, response) => {
        try {
            const id = request.params.id;
            const data = await dataService.getProfileInfo(id, userTypes.tutor);
            if (data && data.length === 0) {
                return response.status(statusCode.notFound).json({
                    statusCode: statusCode.notFound,
                    message: tutor.interestNotFound,
                    data: {}
                });
            }
            const bio = await getBioForTutor(id);
            const feeds = await dataService.getFeedsInfo(id);
            let values = [];
            if (data[0]["course_id"] !== null) {
                for (const i of data) {
                    values.push({
                        courseId: i.course_id,
                        courseName: i.course_name
                    });
                }
            }
            const result = {
                tutor_id: data[0]["id"],
                name: data[0]["name_"],
                email: data[0]["email"],
                mobile_number: data[0]["mobile_no"],
                type: data[0]["_type"],
                bio: bio.length > 0 ? bio[0]["bio"] : "",
                websites: bio.length > 0 ? bio[0]["websites"] : "",
                mailSubscription: bio.length > 0 ? bio[0]["mail_subscription"] : 0,
                interests: values,
                feeds: feeds
            };
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: tutor.getInterest,
                data: result
            });
        } catch (error) {
            console.error('Error at getTutorProfile method');
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: commonServerError.internal,
                data: {}
            });
        }
    },

    /**
     * Retrieves students requests for a tutor
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    getRequestInfo: async (request, response) => {
        try {
            const tutorId = request.params.id;
            const data = await getStudentRequests(tutorId);
            if (data && data.length === 0) {
                return response.status(statusCode.notFound).json({
                    statusCode: statusCode.notFound,
                    message: tutor.requestsNotFound,
                    data: {
                        studentList: []
                    }
                });
            }
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: tutor.requestsFound,
                data: {
                    studentList: data
                }
            });
        } catch (error) {
            console.error('Error at getRequestInfo method');
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: commonServerError.internal,
                data: {}
            });
        }
    },

    /**
     * Hides the student request
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    hideRequest: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { tutorId, studentId } = request.body;
            const isRequestExists = await dataService.checkTutorRequest(studentId, tutorId);
            if (isRequestExists && isRequestExists.length === 0) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: tutor.requestsNotFound
                });
            }
            await updateHideReq(studentId, tutorId);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: tutor.requestHidden
            });
        } catch (error) {
            console.error(tutor.requestHiddenError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: tutor.requestHiddenError
            });
        }
    }
}

/**
 * Models
 */

/**
 * Deletes tutor info
 * @param {number} tutorId 
 * @returns null
 */
const deleteTutorData = (tutorId) => {
    const sql = `DELETE FROM tutors WHERE tutor_id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [tutorId], (err) => {
            if (err) {
                reject('error at deleteTutorData method');
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Adds tutor interests
 * @param {object} data tutorId, courseIds, bio, websites, mailSubscription
 * @returns null
 */
const addTutorInterests = (data) => {
    const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    return new Promise((resolve, reject) => {
        for (const i of data.courseIds) {
            var sql = `
                INSERT INTO tutors (tutor_id, course_id, bio, websites, mail_subscription, _created_on, _modified_on)
                VALUES (?,?,?,?,?,?,?)
            `;
            appDB.run(sql, [data.tutorId, parseInt(i), data.bio, data.websites, data.mailSubscription, currentTime, currentTime], (err) => {
                if (err) {
                    reject('error at addTutorInterests method');
                } else {
                    resolve('success');
                }
            })
        }
    });
}

/**
 * Retrieves bio, website & mailsub for a tutor
 * @param {number} id 
 * @returns null
 */
const getBioForTutor = (id) => {
    const sql = `
        SELECT t.bio, t.websites, t.mail_subscription
        FROM tutors t
        WHERE t.tutor_id = ?
        LIMIT 1
    `;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [id], (err, data) => {
            if (err) {
                reject('error at getBioForTutor method');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Retrives requests from students for a tutor
 * @param {number} tutorId
 * @returns null
 */
const getStudentRequests = (tutorId) => {
    const sql = `
        select
            v.tutor_id,
            v.student_id ,
            v.name ,
            v.email ,
            v.mobile_no ,
            REPLACE(v.interests,
            ', ',
            '\n') as interests,
            v.tutor_req_hide
        from
            tutor_view_requests_vw v
        where tutor_id = ?
    `;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [tutorId], (err, data) => {
            if (err) {
                reject('error at getStudentRequests method');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Hides student request
 * @param {number} studentId 
 * @param {number} tutorId 
 * @returns null
 */
const updateHideReq = (studentId, tutorId) => {
    const sql = `
        UPDATE tutor_requests
        SET tutor_req_hide = 1
        WHERE tutor_id = ?
        AND student_id = ?
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [tutorId, studentId], (err) => {
            if (err) {
                reject('error at updateHideReq method');
            } else {
                resolve('success');
            }
        })
    });
}