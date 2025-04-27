-- Drop table if it exists to avoid conflicts
DROP TABLE IF EXISTS people;

-- Create the table with a primary key
CREATE TABLE people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Unique ID for each person
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,  -- Ensures emails are unique
    username TEXT NOT NULL,
    password TEXT NOT NULL
);

-- Insert sample data
INSERT INTO people (name, email, username, password) VALUES 
('Jake', 'kevin@gmail.com', 'admin', 'passwords_1'),
('Mike', 'example@gmail.com', 'user_12', 'passwords_2'),
('Johne', 'exampledfes@gmail.com', 'sike', 'passwords_3'),
('Noah', 'dkenfk2nfiwn@gmail.com', 'lolwy', 'passwords_4');

-- Select and display data sorted by name in ascending order
SELECT * FROM people ORDER BY name ASC;