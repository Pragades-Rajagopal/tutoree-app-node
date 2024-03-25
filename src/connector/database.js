const sqlite = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../', 'db.sqlite');
const appDB = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, (err) => {
    console.log('db path:', dbPath);
    if (err) {
        console.log('connection error : ', err.message);
    } else {
        console.log('DB connected');
    }
})

module.exports = appDB;