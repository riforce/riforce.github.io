console.log("script is loading!");


// temporary post data
const protoPosts = [
    {
        id:1,
        date: "March 30, 2025",
        content: `<p> Lorum ipsum blah blah blah.</p>`,
        tags: ["test1"]
    },
    {
        id:2,
        date: "March 31, 2025",
        content: `<p> Lorum ipsum blah blah blah.</p>`,
        tags: ["test2"]
    },
    {
        id:3,
        date: "March 40, 2025",
        content: `<p> Lorum ipsum blah blah blah.</p>`,
        tags: ["test3"]
    }
];

// Function to load and display blog posts
function loadBlogPosts () {
    const postZone = document.querySelector('.post-zone');

    if (!postZone) {
        console.error("Post zone element not found!");
        return;
    };

    console.log("loading posts...");

    // clear any existing content
    postZone.innerHTML = "";

    // create a container for posts that can scroll
    const postContainer = document.createElement('div');
    postContainer.className = 'post-container';
    postZone.appendChild(postContainer);

    // Add each post to the container
    protoPosts.forEach(post => {
        const postElement = createPostElement(post);
        postContainer.appendChild(postElement);
    });
};

// Function to create a post element
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.id = `post-${post.id}`;

    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';

    const postTitle = document.createElement('h2');
    postTitle.textContent = post.title;

    const postDate = document.createElement('p');
    postDate.className = 'post-date';
    postDate.textContent = post.date;

    const postContent = document.createElement('div');
    postContent.className = 'post-content';
    postContent.innerHTML = post.content;

    const postTags = document.createElement('div');
    postTags.className = 'post-tags';
    post.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = `#${tag}`;
        postTags.appendChild(tagSpan);
    });

    postHeader.appendChild(postTitle);
    postHeader.appendChild(postDate);

    postDiv.appendChild(postHeader);
    postDiv.appendChild(postContent);
    postDiv.appendChild(postTags);

    return postDiv;
}

const soundEffect = new Audio('twinklesparkle.mp3');

// Button stuff
function sillyButton() {
    soundEffect.play();
}

// Cursor stuff
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is loaded!");
    // load blog posts
    loadBlogPosts();

    // Create the custom cursor element
    const cursorEl = document.createElement('div');
    cursorEl.classList.add('custom-cursor');
    document.body.appendChild(cursorEl);

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        cursorEl.style.left = `${e.clientX}px`;
        cursorEl.style.top = `${e.clientY}px`;
    });

    // Handle hover effects on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorEl.classList.add('hover');
        });

        el.addEventListener('mouseleave', () => {
            cursorEl.classList.remove('hover');
        });
    });
});

