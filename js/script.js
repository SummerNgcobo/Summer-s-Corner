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

document.addEventListener("DOMContentLoaded", function () {
  const commentForm = document.getElementById("commentForm");
  const commentsContainer = document.getElementById("commentsContainer");

  // Load stored comments
  let savedComments = JSON.parse(localStorage.getItem("comments")) || [];
  savedComments.forEach((comment, index) => addCommentToDOM(comment, index));

  commentForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Get user input
      const username = document.getElementById("username").value;
      const commentText = document.getElementById("commentText").value;

      if (username && commentText) {
          const commentData = { username, commentText, date: new Date().toLocaleString() };

          // Save to local storage
          savedComments.push(commentData);
          localStorage.setItem("comments", JSON.stringify(savedComments));

          // Add comment to DOM
          addCommentToDOM(commentData, savedComments.length - 1);

          // Clear input fields
          commentForm.reset();
      }
  });

  function addCommentToDOM(comment, index) {
      const commentDiv = document.createElement("div");
      commentDiv.classList.add("comment");

      commentDiv.innerHTML = `
          <div class="comment-header">
              <strong>${comment.username}</strong> 
              <span class="date">${comment.date}</span>
              <button class="delete-btn" data-index="${index}" aria-label="Delete Comment">
                  🗑️
              </button>
          </div>
          <p>${comment.commentText}</p>
      `;
      commentsContainer.prepend(commentDiv); // Add new comments on top

      // Add event listener for delete button
      commentDiv.querySelector(".delete-btn").addEventListener("click", function () {
          deleteComment(index);
      });
  }

  function deleteComment(index) {
      // Remove comment from array
      savedComments.splice(index, 1);

      // Update local storage
      localStorage.setItem("comments", JSON.stringify(savedComments));

      // Re-render comments
      commentsContainer.innerHTML = "";
      savedComments.forEach((comment, i) => addCommentToDOM(comment, i));
  }
});
