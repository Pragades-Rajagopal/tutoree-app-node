const moment = require('moment');
const { validationResult } = require('express-validator');
const { student, statusCode, commonServerError, userTypes } = require('../config/constants');
const mailService = require('../services/mailService');
const dataService = require('../services/dataService');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Adds students interests
     * @returns {object}
     */
    saveStudentInterest: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { studentId, courseIds } = request.body;
            const isStudent = await dataService.checkUser(studentId, userTypes.student);
            if (isStudent && isStudent.length === 0) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: student.addIntrstCheckError
                });
            }
            await deleteStudentData(studentId);
            await addStudentInterests(studentId, courseIds);
            console.log(student.interestAdded);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: student.interestAdded
            });
        } catch (error) {
            console.error(student.addInterestError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: student.addInterestError
            });
        }
    },

    /**
     * Retrieves student interests/courses
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    getStudentInterests: async (request, response) => {
        try {
            const id = request.params.id;
            const data = await dataService.getProfileInfo(id, userTypes.student);
            if (data && data.length === 0) {
                return response.status(statusCode.notFound).json({
                    statusCode: statusCode.notFound,
                    message: student.interestNotFound,
                    data: {}
                });
            }
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
                student_id: data[0]["id"],
                name: data[0]["name_"],
                email: data[0]["email"],
                mobile_number: data[0]["mobile_no"],
                type: data[0]["_type"],
                interests: values,
                feeds: feeds
            };
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: student.getInterest,
                data: result
            });
        } catch (error) {
            console.error('Error at getStudentInterests method');
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: commonServerError.internal,
                data: {}
            });
        }
    },

    /**
     * Retrive tutor list based on student's interests
     * @param {*} request 
     * @param {*} response 
     * @returns {object}
     */
    getTutorList: async (request, response) => {
        try {
            const student_id = request.params.student_id;
            const tutorLists = await getTutorListInfo(student_id);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: student.fetchTutorListSuccess,
                data: {
                    tutorLists: tutorLists
                }
            });
        } catch (error) {
            console.error(student.fetchTutorListError);
            console.error(error);
            return {
                statusCode: statusCode.serverError,
                message: student.fetchTutorListError,
                data: {
                    tutorLists: []
                }
            }
        }
    },

    /**
     * Sends request to Tutors 
     * @param {*} request 
     * @param {*} response 
     * @returns {object} response
     */
    sendRequest: async (request, response) => {
        try {
            const validationErrors = validationResult(request);
            if (!validationErrors.isEmpty()) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: validationErrors.mapped(),
                    error: commonServerError.badRequest,
                });
            }
            const { studentId, tutorId } = request.body;
            const [studentInfo, tutorInfo, isRequestExists] = await Promise.all([
                dataService.getStudentInfo(studentId),
                dataService.getTutorInfo(tutorId),
                dataService.checkTutorRequest(studentId, tutorId)
            ]);
            if ((studentInfo && studentInfo.length === 0) || (tutorInfo && tutorInfo.length === 0)) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: student.infoNotFound
                });
            }
            if (isRequestExists && isRequestExists.length > 0) {
                return response.status(statusCode.error).json({
                    statusCode: statusCode.error,
                    message: student.requestExists
                });
            }
            const tutorInfo_ = tutorInfo[0];
            const studentInfo_ = studentInfo[0];
            if (tutorInfo_.mail_subscription === 1) {
                mailService.sendTutorRequest(tutorInfo_.email, {
                    name: studentInfo_.name,
                    interests: studentInfo_.interests,
                    mail: studentInfo_.email
                });
            }
            await saveTutorRequest(studentId, tutorId);
            console.log(student.sendRequestSuccess);
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                message: student.sendRequestSuccess
            });
        } catch (error) {
            console.error(student.sendRequestError);
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                message: student.sendRequestError
            });
        }
    }
}

/**
 * Models
 */

/**
 * Deletes all student info
 * @param {number} studentId 
 * @returns null
 */
const deleteStudentData = (studentId) => {
    const sql = `DELETE FROM students WHERE student_id = ?`;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [studentId], (err) => {
            if (err) {
                reject('error at deleteStudentData method');
            } else {
                resolve('success');
            }
        })
    });
}

/**
 * Adds student interests
 * @param {number} studentId 
 * @param {object} courseIds List of course ids 
 * @returns null
 */
const addStudentInterests = (studentId, courseIds) => {
    const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    return new Promise((resolve, reject) => {
        for (const i of courseIds) {
            var sql = `
                INSERT INTO STUDENTS (student_id, course_id, _created_on, _modified_on)
                VALUES (?,?,?,?)
            `;
            appDB.run(sql, [studentId, parseInt(i), currentTime, currentTime], (err) => {
                if (err) {
                    reject('error at addStudentInterests method');
                } else {
                    resolve('success');
                }
            })
        }
    });
}

/**
 * Retrives tutor list based on student's interests
 * @param {number} studentId
 * @returns null
 */
const getTutorListInfo = (studentId) => {
    const sql = `
        SELECT
            DISTINCT T.TUTOR_ID,
            U.FIRST_NAME || ' ' || U.LAST_NAME AS tutor_name,
            T.BIO ,
            T.WEBSITES,
            (
            SELECT
                GROUP_CONCAT(C1.NAME,
                '\n')
            FROM
                COURSES C1
            WHERE
                C1.ID IN (
                SELECT
                    T1.COURSE_ID
                FROM
                    TUTORS T1
                WHERE
                    T1.TUTOR_ID = T.TUTOR_ID)) AS courses,
            s.student_id,
            (
            SELECT
                1
            FROM
                tutor_requests tr
            WHERE
                tr.tutor_id = T.tutor_id
                AND tr.student_id = s.student_id
            ) AS tutor_req_status
        FROM
            TUTORS T,
            USERS U,
            COURSES C,
            students s
        WHERE
            U.ID = T.TUTOR_ID
            AND C.ID = T.COURSE_ID
            AND S.student_id = ?
            and t.course_id = s.course_id
    `;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [studentId], (err, data) => {
            if (err) {
                reject('error at getTutorListInfo method');
            } else {
                resolve(data);
            }
        })
    });
}

/**
 * Saves tutor request from a student
 * @param {number} studentId 
 * @param {number} tutorId 
 * @returns null
 */
const saveTutorRequest = (studentId, tutorId) => {
    const currentTime = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');
    const sql = `
        INSERT INTO tutor_requests (tutor_id, student_id, _created_on) 
        VALUES (?,?,?)
    `;
    return new Promise((resolve, reject) => {
        appDB.run(sql, [tutorId, studentId, currentTime], (err) => {
            if (err) {
                reject('error at saveTutorRequest method');
            } else {
                resolve('success');
            }
        })
    });
}