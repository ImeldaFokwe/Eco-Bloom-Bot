const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const db = mysql.createConnection({

    host: process.env.AWS_DATABASE_HOST,
    user: process.env.AWS_DATABASE_USER,
    password: process.env.AWS_DATABASE_PASSWORD,
    database: process.env.AWS_DATABASE,
});

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide an email and password' });
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (!results.length || !(await bcrypt.compare(password, results[0].password))) {
                return res.status(401).json({ message: 'Email or Password is incorrect' });
            } else {
                const id = results[0].id;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });

                // Return the token to the client
                return res.status(200).json({ token });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.register = async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'That email is already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        db.query(
            'INSERT INTO users SET ?',
            { name, email, password: hashedPassword },
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Internal server error' });
                } else {
                    return res.status(201).json({ message: 'User registered successfully' });
                }
            }
        );
    });
};



exports.isLoggedIn = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
            if (error || !result.length) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            req.user = result[0];
            next();
        });
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};


exports.logout = async (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });

    res.status(200).redirect('/');
}