// require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(bodyParser.json());

// Rate limiting for API endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ttlshiwwya1@',
    database: process.env.DB_NAME || 'summers_corner',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
async function executeQuery(query, params) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// API Endpoints

// Get like count for a post
app.get('/api/posts/:postId/likes', async (req, res) => {
    try {
        const { postId } = req.params;
        const query = 'SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?';
        const results = await executeQuery(query, [postId]);
        res.json({ likeCount: results[0].likeCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch like count' });
    }
});

// Add a like
app.post('/api/posts/:postId/likes', async (req, res) => {
    try {
        const { postId } = req.params;
        const userIp = req.ip;

        // Check if user already liked this post
        const checkQuery = 'SELECT 1 FROM likes WHERE post_id = ? AND user_ip = ?';
        const existingLike = await executeQuery(checkQuery, [postId, userIp]);

        if (existingLike.length > 0) {
            return res.status(400).json({ error: 'You already liked this post' });
        }

        // Add new like
        const insertQuery = 'INSERT INTO likes (post_id, user_ip) VALUES (?, ?)';
        await executeQuery(insertQuery, [postId, userIp]);

        // Get updated like count
        const countQuery = 'SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?';
        const results = await executeQuery(countQuery, [postId]);

        res.json({ 
            success: true,
            likeCount: results[0].likeCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add like' });
    }
});

// Get comments for a post
app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const query = 'SELECT id, username, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC';
        const comments = await executeQuery(query, [postId]);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Add a comment
app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { username, content } = req.body;

        if (!username || !content) {
            return res.status(400).json({ error: 'Username and content are required' });
        }

        // Basic input sanitization
        const sanitizedUsername = username.trim().substring(0, 100);
        const sanitizedContent = content.trim().substring(0, 2000);

        const query = 'INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)';
        const result = await executeQuery(query, [postId, sanitizedUsername, sanitizedContent]);

        // Get the newly created comment
        const newCommentQuery = 'SELECT id, username, content, created_at FROM comments WHERE id = ?';
        const [newComment] = await executeQuery(newCommentQuery, [result.insertId]);

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});