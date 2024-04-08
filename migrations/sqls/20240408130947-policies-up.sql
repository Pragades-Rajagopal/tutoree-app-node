CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_on DATETIME NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users (id)
);