let menu = document.querySelector('#menu-bars');
let navbar = document.querySelector('.navbar');

menu.onclick = () =>{
  menu.classList.toggle('fa-times');
  navbar.classList.toggle('active');
  searchIcon.classList.remove('fa-times');
  searchForm.classList.remove('active');
}

let searchIcon = document.querySelector('#search-icon');
let searchForm = document.querySelector('.search-form');

searchIcon.onclick = () =>{
  searchIcon.classList.toggle('fa-times');
  searchForm.classList.toggle('active');
  menu.classList.remove('fa-times');
  navbar.classList.remove('active');
}

window.onscroll = () =>{
  menu.classList.remove('fa-times');
  navbar.classList.remove('active');
  searchIcon.classList.remove('fa-times');
  searchForm.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all like buttons and comment forms
    document.querySelectorAll('.post').forEach(post => {
        const postId = post.dataset.postId || post.id.replace('post-', '');
        
        // Initialize likes functionality
        const likeButton = post.querySelector('.like-button');
        const likeCount = post.querySelector('.like-count');
        
        if (likeButton && likeCount) {
            initLikeSystem(postId, likeButton, likeCount);
        }
        
        // Initialize comments functionality
        const commentForm = post.querySelector('#commentForm');
        const commentsContainer = post.querySelector('#commentsContainer');
        
        if (commentForm && commentsContainer) {
            initCommentSystem(postId, commentForm, commentsContainer);
        }
    });
    

    
    // Search functionality
    
    const searchIcon = document.getElementById('search-icon');
    const searchBox = document.getElementById('search-box');
    const searchForm = document.querySelector('.search-form');
    
    searchIcon.addEventListener('click', () => {
        searchForm.classList.toggle('active');
        searchBox.focus();
    });
    
    // Mobile menu toggle
    const menuBars = document.getElementById('menu-bars');
    const navbar = document.querySelector('.navbar');
    
    menuBars.addEventListener('click', () => {
        navbar.classList.toggle('active');
        menuBars.classList.toggle('fa-times');
    });
    
    // Close search when scrolling
    window.onscroll = () => {
        searchForm.classList.remove('active');
        navbar.classList.remove('active');
        menuBars.classList.remove('fa-times');
    };
});

// Like System
const API_BASE = 'http://localhost:3000';
async function initLikeSystem(postId, likeButton, likeCountElement) {
    // Set post ID if not already set
    if (!likeButton.closest('.post').dataset.postId) {
        likeButton.closest('.post').dataset.postId = postId;
    }
    const API_BASE = 'http://localhost:3000';
    // Get current like count
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/likes`);
        const data = await response.json();
        likeCountElement.textContent = data.likeCount;
    } catch (error) {
        console.error('Error fetching like count:', error);
    }
    
    // Handle like button click
    likeButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`/api/posts/${postId}/likes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Update like count display
                likeCountElement.textContent = data.likeCount;
                
                // Visual feedback
                const icon = likeButton.querySelector('i');
                icon.classList.remove('far');
                icon.classList.add('fas');
                
                // Disable button temporarily to prevent spamming
                likeButton.style.pointerEvents = 'none';
                setTimeout(() => {
                    likeButton.style.pointerEvents = 'auto';
                }, 1000);
            } else {
                console.error('Error:', data.error);
                alert(data.error || 'Failed to like post');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to like post. Please try again.');
        }
    });
}

// Comment System
async function initCommentSystem(postId, commentForm, commentsContainer) {
    // Set post ID if not already set
    if (!commentForm.closest('.post').dataset.postId) {
        commentForm.closest('.post').dataset.postId = postId;
    }
    
    // Load existing comments
    loadComments(postId, commentsContainer);
    
    // Handle comment submission
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usernameInput = commentForm.querySelector('#username');
        const commentInput = commentForm.querySelector('#commentText');
        const submitButton = commentForm.querySelector('button[type="submit"]');
        
        const username = usernameInput.value.trim();
        const comment = commentInput.value.trim();
        
        if (!username || !comment) {
            alert('Please enter both your name and a comment');
            return;
        }
        
        submitButton.disabled = true;
        submitButton.textContent = 'Posting...';
        const API_BASE = 'http://localhost:3000';
        try {
           const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    content: comment
                })
            });
            
            if (response.ok) {
                const newComment = await response.json();
                addCommentToDOM(newComment, commentsContainer);
                commentInput.value = '';
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Post Comment';
        }
    });
}

async function loadComments(postId, container) {
    try {
        const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
        const comments = await response.json();
        
        // Clear existing comments
        container.innerHTML = '';
        
        if (comments.length === 0) {
            container.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }
        
        comments.forEach(comment => {
            addCommentToDOM(comment, container);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<p>Failed to load comments. Please refresh the page.</p>';
    }
}

function addCommentToDOM(comment, container) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <div class="comment-header">
            <strong>${escapeHtml(comment.username)}</strong>
            <span>${new Date(comment.created_at).toLocaleString()}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
    `;
    
    // Prepend to show newest first
    container.prepend(commentElement);
}

// Basic HTML escaping for security
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}