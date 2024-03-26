'use strict'
const path = require('path');
require('dotenv').config({
    path: path.resolve('./app.env'),
});
const appDB = require('../../src/connector/database');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const courses = [
    'Programming Language-Java',
    'Programming Language-Python',
    'Programming Language-C/C++',
    'Programming Language-Javascript',
    'Fullstack Web Development',
    'Fullstack Mobile Development',
    'Database-Postgresql',
    'Database-MySQL',
    'Database-Oracle PL/SQL',
    'NoSQL-MongoDB',
    'MERN stack',
    'MEAN stack',
    'Data Structures and Algorithms',
    'Mathematics-Statitics and Probability',
    'Data Science with Python',
    'Data Science with R',
    'Data Analysis',
    'Big Data',
    'Mechanical Engineering',
    'Chemical Engineering',
    'Electrical and Electronics Engineering',
    'Electronics and Communication Engineering',
    'Biotechnology',
    'Bioengineering',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'English-Grammar and Vocabulary',
    'English',
    'Tamil',
    'Hindi',
    'Sanskrit',
    'History',
    'Geography',
    'Politics',
    'Ethics',
    'Moral Science',
    'General Knowledge',
    'Physical Training',
    'Yoga and Meditation',
    'Spiritual session',
    'Civil Service'
];

for (const i of courses) {
    var sql = `
        INSERT INTO courses (
            name, 
            _status, 
            _created_on,
            _modified_on)
            VALUES (
            ?, 
            1,
            datetime(),
            datetime()
        );
    `;
    appDB.run(sql, [i], (err) => {
        if (err) {
            console.log('error performing courses seed');
        }
    });
}

appDB.run(`
    INSERT
    INTO
    users
    (
        first_name,
        last_name,
        email,
        password,
        mobile_no,
        is_email_verified,
        is_mobile_verified,
        "_type",
        "_status",
        "_created_on",
        "_modified_on"
    ) VALUES (
    'admin',
    '001',
    ?,
    ?,
    0000000000,
    1,
    1,
    'admin',
    1,
    DATETIME(),
    DATETIME());
`, [ADMIN_EMAIL, ADMIN_PASSWORD], (err) => {
    if (err) {
        console.error('error while admin user seeding');
        console.error(err);
    }
})