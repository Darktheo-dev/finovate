import sqlite3
import time
from flask import Flask, request, render_template, redirect, url_for

app = Flask(__name__)

# Function to get a database connection with automatic closing
def get_db_connection():
    conn = sqlite3.connect("data.db", timeout=10)  # Timeout to prevent locking issues
    conn.row_factory = sqlite3.Row
    return conn

# Enable WAL mode to improve concurrency
def enable_wal_mode():
    with get_db_connection() as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.commit()

# Call WAL mode function once when the app starts
enable_wal_mode()

# Function to execute queries with retries in case of database lock
def execute_with_retry(query, params=()):
    retries = 5
    for i in range(retries):
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                conn.commit()
                return
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e):
                time.sleep(0.2)  # Wait before retrying
            else:
                raise

# Route to initialize the database
@app.route('/init_db', methods=['GET'])
def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                dob TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.commit()
    return "Database initialized successfully!"

# Route to show the signup form
@app.route('/signup', methods=['GET'])
def signup():
    return render_template('newAccount.html')

# Route to create a new user with proper database handling
@app.route('/create_user', methods=['POST'])
def create_user():
    first_name = request.form.get('firstName')
    last_name = request.form.get('lastName')
    dob = request.form.get('dob')
    email = request.form.get('email')
    username = request.form.get('username')
    password = request.form.get('password')

    if not all([first_name, last_name, dob, email, username, password]):
        return render_template('newAccount.html', error="Please fill out all fields!",
                               first_name=first_name, last_name=last_name, dob=dob,
                               email=email, username=username)

    try:
        query = """INSERT INTO people (first_name, last_name, dob, email, username, password) 
                   VALUES (?, ?, ?, ?, ?, ?)"""
        execute_with_retry(query, (first_name, last_name, dob, email, username, password))
        return redirect(url_for('success'))
    except sqlite3.IntegrityError:
        return render_template('newAccount.html', error="Email already exists. Try a different one.",
                               first_name=first_name, last_name=last_name, dob=dob,
                               email=email, username=username)

# Route to view all users safely
@app.route('/view_users', methods=['GET'])
def view_users():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, first_name, last_name, dob, email, username FROM people")
        users = cursor.fetchall()

    if users:
        users_list = [dict(user) for user in users]  # Convert rows to dictionaries
        return render_template('view_users.html', users=users_list)
    else:
        return "No users found in the database.", 404

# Success page
@app.route('/success')
def success():
    return render_template('index.html')

# Homepage
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True, threaded=False)  # Disable threading to prevent concurrent write issues