const sqlite = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../', 'db.sqlite');
console.log(__dirname);
const appDB = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, (err) => {
    console.log('db path:', dbPath);
    if (err) {
        console.log('connection error : ', err);
    } else {
        console.log('DB connected');
    }
})

module.exports = appDB;