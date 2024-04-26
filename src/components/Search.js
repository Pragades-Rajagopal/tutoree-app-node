const { statusCode } = require('../config/constants');
const appDB = require('../connector/database');

module.exports = {
    /**
     * Global search method
     * @param {*} request 
     * @param {*} response 
     */
    globalSearch: async (request, response) => {
        try {
            const { value } = request.query;
            console.log(`global search request for: ${value}`);
            const searchValue = `'%${value}%'`;
            const result = await searchModel(searchValue);
            const count = result?.length;
            return response.status(statusCode.success).json({
                statusCode: statusCode.success,
                count: count,
                data: result
            });
        } catch (error) {
            console.error(error);
            return response.status(statusCode.serverError).json({
                statusCode: statusCode.serverError,
                error: error
            });
        }
    }
}

/**
 * Model
 */

/**
 * Global search model
 * @param {string} value 
 * @returns data
 */
const searchModel = (value) => {
    const sql = `
        SELECT
            'tutor' as tbl_nm,
            name as field1,
            email as field2,
            REPLACE(interests,
            ', ',
            '\n') as field3
        from
            tutor_info_vw
        where
            name like ${value}
            or email like ${value}
            or interests like ${value}
        UNION 
        SELECT
            'student' as tbl_nm,
            name as field1,
            email as field2,
            REPLACE(interests,
            ', ',
            '\n') as field3
        from
            student_info_vw
        where
            name like ${value}
            or email like ${value}
            or interests like ${value}
        UNION 
        SELECT
            'feed' as tbl_nm,
            content as field1,
            created_by as field2,
            STRFTIME('%d', created_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
                        1 + 3 * STRFTIME('%m', created_on), -3) as field3
        from
            feeds
        WHERE
            content like ${value}
            or created_by like ${value}
    `;
    return new Promise((resolve, reject) => {
        appDB.all(sql, [], (err, data) => {
            if (err) {
                reject('error at search model');
            } else {
                resolve(data);
            }
        })
    });
}