console.log("script is loading!");

// configuration for posts

const postsConfig = {
    postsDirectory: window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ?
                    'posts/' : '/posts/',
    fileExtension: '.md'
};

// class to handle blog posts
class BlogSystem {
    constructor() {
        this.posts = [];
    }

    // fetch and parse all posts
    async loadPosts() {
        try {
            // fetch the list of post files
            const response = await fetch(`${postsConfig.postsDirectory}index.json`);
            if(!response.ok) {
                console.error(`Failed to load index.json: ${response.status} ${response.statusText}`);
                return [];
            }

            const postFiles = await response.json();

            // load each post file
            const postPromises = postFiles.map(async filename => {
                try {
                    return await this.loadPostFromFile(filename);
                } catch (error) {
                    console.error(`Error loading post ${filename}:`, error);
                    return null;
                }
            });
            
            const results = await Promise.all(postPromises);
            this.posts = results.filter(post => post !== null);

            // sort post by date (newest first)
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log(`Successfully loaded ${this.posts.length} posts`);
            return this.posts;

        } catch (error) {
            console.error('Failed to load posts:', error);
            return [];
        }
    }

    // load and parse a single post file
    async loadPostFromFile(filename) {
        try {
            const response = await fetch(`${postsConfig.postsDirectory}${filename}`);
            if (!response.ok) {
                console.error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
                return null;
            }

            const markdownText = await response.text();
            console.log(`Successfully loaded ${filename}, length: ${markdownText.length} characters`);
            
            //for debugging output the first 100 chars
            console.log(`First 100 chars: ${markdownText.substring(0, 100).replace(/\n/g, "\\n")}`);

            // parse the markdown file
            return this.parseMarkdownPost(markdownText, filename);

        } catch (error) {
            console.error(`failed to load post ${filename}:`, error);
            return null;
        }
    }

    // parse a markdown file into a post object
    parseMarkdownPost(markdownText, filename) {
        // extract front matter and context
        const frontMatterRegex = /^\s*---\s*[\r\n]+([\s\S]*?)[\r\n]+\s*---\s*[\r\n]+([\s\S]*)$/;
        const frontMatterMatch = markdownText.match(frontMatterRegex);

        if (!frontMatterMatch) {
            console.error(`Invalid markdown format in ${filename}`);
            // Create a simple post with basic info for debugging
            return {
              id: filename.replace(postsConfig.fileExtension, ''),
              title: filename,
              date: new Date().toISOString().split('T')[0],
              tags: ['debug'],
              content: marked.parse(markdownText) // Parse the entire file as content
            };
          }

        const [, frontMatterText, contentText] = frontMatterMatch;

        //parse front matter
        const frontMatter = {};
        frontMatterText.split(/[\r\n]+/).forEach(line => {
            // skip empty lines
            if (!line.trim()) return;

            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return;

            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();

            // handle tags specially
            if (key === 'tags') {
                // parse tags in format: tags: [tag1, tag2]
                const tagsMatch = value.match(/\[(.*)\]/);
                if (tagsMatch) {
                    frontMatter.tags = tagsMatch[1].split(',').map(tag => tag.trim());
                } else {
                    frontMatter.tags = [value];
                }
            } else {
                frontMatter[key] = value;
            }
        });

        // Generate ID from filename
        const id = filename.replace(postsConfig.fileExtension, '');

        // parse content using marked.js
        const content = marked.parse(contentText);

        return {
            id,
            title: frontMatter.title || '',
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            tags: frontMatter.tags || [],
            content
        };
    }
}


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

// Main function to load and display blog posts
async function loadBlogPosts() {
    const postZone = document.querySelector('.post-zone');
  
    if (!postZone) {
      console.error("Post zone element not found!");
      return;
    }
  
    console.log("loading posts...");
  
    // clear any existing content
    postZone.innerHTML = "";
  
    // create a container for posts that can scroll
    const postContainer = document.createElement('div');
    postContainer.className = 'post-container';
    postZone.appendChild(postContainer);
  
    // Initialize blog system and load posts
    const blog = new BlogSystem();
    const posts = await blog.loadPosts();
  
    // Display posts or fallback to protoPosts if none found
    if (posts.length > 0) {
      posts.forEach(post => {
        if (post) {
          const postElement = createPostElement(post);
          postContainer.appendChild(postElement);
        }
      });
    } else {
      console.warn("No markdown posts found, falling back to prototype posts");
      protoPosts.forEach(post => {
        const postElement = createPostElement(post);
        postContainer.appendChild(postElement);
      });
    }
  }
  

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

