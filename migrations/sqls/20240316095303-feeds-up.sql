CREATE TABLE IF NOT EXISTS feeds (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_by_id INTEGER NOT NULL,
    created_on DATETIME NOT NULL,
    FOREIGN KEY (created_by_id) REFERENCES users (id)
);