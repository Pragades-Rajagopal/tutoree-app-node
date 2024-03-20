const { userTypes } = require('../config/constants');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Checks if the user exists
     * @param {number} userId 
     * @param {number} userType 
     * @returns null
     */
    checkUser: (userId, userType) => {
        const sql = `
            SELECT 1 "check" FROM users
            WHERE id = ?
            AND _type = ?
            AND _status = 1
        `;
        return new Promise((resolve, reject) => {
            appDB.all(sql, [userId, userType], (err, data) => {
                if (err) {
                    reject('error at checkUser method');
                } else {
                    resolve(data);
                }
            })
        });
    },

    /**
     * Retrieves profile information of a student/tutor
     * @param {number} id 
     * @param {string} userType 
     * @returns null
     */
    getProfileInfo: (id, userType) => {
        const sql = userType === userTypes.tutor
            ? `select
                *
            from
                (
                select
                    u.id ,
                    u.first_name || ' ' || u.last_name as name_,
                    u.email,
                    u.mobile_no,
                    u._type,
                    t.bio,
                    t.websites,
                    c.id as course_id,
                    c.name as course_name
                from
                    users u
                full outer join tutors t 
                                on
                    t.tutor_id = u.id
                full outer join courses c 
                                    on
                    t.course_id = c.id
                    and c._status = 1
                )
            where
                _type = 'tutor'
                and id = ?`
            : `select
                *
            from
                (
                select
                    u.id ,
                    u.first_name || ' ' || u.last_name as name_,
                    u.email,
                    u.mobile_no,
                    u._type,
                    c.id as course_id,
                    c.name as course_name
                from
                    users u
                full outer join students s
                    on
                    s.student_id = u.id
                full outer join courses c 
                        on
                    s.course_id = c.id
                    and c._status = 1
                        )
            where
                _type = 'student'
                and id = ?`;
        return new Promise((resolve, reject) => {
            appDB.all(sql, [id], (err, data) => {
                if (err) {
                    reject('error at getProfileInfo method');
                } else {
                    resolve(data);
                }
            });
        });
    },

    /**
     * Retrieve feeds for a student/tutor
     * @param {number} id 
     * @returns null
     */
    getFeedsInfo: (id) => {
        const sql = `
            SELECT f.*,
                STRFTIME('%d', created_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
                1 + 3 * STRFTIME('%m', created_on), -3) as date_
            FROM feeds f
            WHERE created_by_id = ?
            ORDER BY created_on DESC
        `;
        return new Promise((resolve, reject) => {
            appDB.all(sql, [id], (err, data) => {
                if (err) {
                    reject('error at getFeedsInfo method');
                } else {
                    resolve(data);
                }
            })
        });
    },

    /**
     * Retrieves student info from view
     * @param {number} studentId 
     * @returns null
     */
    getStudentInfo: (studentId) => {
        const sql = `SELECT * FROM student_info_vw WHERE ID = ?`;
        return new Promise((resolve, reject) => {
            appDB.all(sql, [studentId], (err, data) => {
                if (err) {
                    reject('error at getStudentInfo method');
                } else {
                    resolve(data);
                }
            })
        });
    },

    /**
     * Retrieves tutor info from view
     * @param {number} tutorId 
     * @returns null
     */
    getTutorInfo: (tutorId) => {
        const sql = `SELECT * FROM tutor_info_vw WHERE ID = ?`;
        return new Promise((resolve, reject) => {
            appDB.all(sql, [tutorId], (err, data) => {
                if (err) {
                    reject('error at getTutorInfo method');
                } else {
                    resolve(data);
                }
            })
        });
    },

    /**
     * Checks if the tutor request already exists
     * @param {number} studentId 
     * @param {number} tutorId 
     * @returns null
     */
    checkTutorRequest: (studentId, tutorId) => {
        const sql = `
            SELECT 1 "check" FROM tutor_requests
            WHERE tutor_id = ?
            AND student_id = ?
        `;
        return new Promise((resolve, reject) => {
            appDB.all(sql, [tutorId, studentId], (err, data) => {
                if (err) {
                    reject('error at checkTutorRequest method');
                } else {
                    resolve(data);
                }
            })
        });
    }
}