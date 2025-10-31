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
        this.postFileList = [];
        this.postsPerPage = 5; // load 5 posts at a time
        this.currentPage = 0;
        this.isLoading = false;
        this.allPostsLoaded = false;
    }

    // fetch and parse all posts
    // async loadPosts() {
    //     try {
    //         // fetch the list of post files
    //         const response = await fetch(`${postsConfig.postsDirectory}index.json`);
    //         if(!response.ok) {
    //             console.error(`Failed to load index.json: ${response.status} ${response.statusText}`);
    //             return [];
    //         }

    //         const postFiles = await response.json();

    //         // load each post file
    //         const postPromises = postFiles.map(async filename => {
    //             try {
    //                 return await this.loadPostFromFile(filename);
    //             } catch (error) {
    //                 console.error(`Error loading post ${filename}:`, error);
    //                 return null;
    //             }
    //         });
            
    //         const results = await Promise.all(postPromises);
    //         this.posts = results.filter(post => post !== null);

    //         // sort post by date (newest first)
    //         this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    //         console.log(`Successfully loaded ${this.posts.length} posts`);
    //         return this.posts;

    //     } catch (error) {
    //         console.error('Failed to load posts:', error);
    //         return [];
    //     }
    // }

    // initialize: fetch the list of post files
    async initialize() {
      try {
        const response = await fetch(`${postsConfig.postsDirectory}index.json`);
        if(!response.ok) {
          console.error(`Failed to load index.json: ${response.status} ${response.statusText}`);
          return false;
        }

        this.postFileList = await response.json();
        console.log(`Found ${this.postFileList.length} posts in index`);
        return true;
      } catch (error) {
        console.error('Failed to load index.json:', error);
        return false;
      }
    }

    // load a specific page of posts
    async loadPage(pageNum) {
      if (this.isLoading) {
        console.log("Already loading posts, skipping...");
        return [];
      }

      const start = pageNum * this.postsPerPage;
      const end = start + this.postsPerPage;

      if (start >= this.postFileList.length) {
        this.allPostsLoaded = true;
        console.log("All posts loaded!");
        return [];
      }

      this.isLoading = true;
      const filesToLoad = this.postFileList.slice(start, end);
      console.log(`Loading posts ${start + 1} to ${Math.min(end, this.postFileList.length)}`);

      try {
        const postPromises = filesToLoad.map(async filename => {
          try {
            return await this.loadPostFromFile(filename);
          } catch (error) {
            console.error(`Error loading post ${filename}:`, error);
            return null;
          }
        });
        const newPosts = await Promise.all(postPromises);
        const validPosts = newPosts.filter(post => post !== null);

        this.posts.push(...validPosts);
        this.currentPage = pageNum;

        if (end >= this.postFileList.length) {
          this.allPostsLoaded = true;
        }
         return validPosts;
      } finally {
        this.isLoading = false;
      }
    }

    // load the next page
    async loadNextPage() {
      return this.loadPage(this.currentPage + 1);
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

            // parse the markdown file
            const post = this.parseMarkdownPost(markdownText, filename);

            // add lazy loading to images
            if (post && post.content) {
              post.content = this.optimizeImages(post.content);
            }

            return post;

        } catch (error) {
            console.error(`failed to load post ${filename}:`, error);
            return null;
        }
    }

    // add lazy loading attribute to images
    optimizeImages(htmlContent) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const images = doc.querySelectorAll('img');

      images.forEach(img => {
        //add lazy loading
        img.loading = 'lazy';
      });

      return doc.body.innerHTML;
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

// global blog instance
let blog = null;

// Main funcion to initialize blog
async function initializeBlog() {
  const postZone = document.querySelector('.post-zone');

  if (!postZone) {
    console.error("Post zone element not found!");
    return Promise.reject("Post zone not found.");
  }

  console.log("Initializing blog...");

  // clear any existing content
  postZone.innerHTML = "";

  // create a container for posts
  const postContainer = document.createElement('div');
  postContainer.className = 'post-container';
  postZone.appendChild(postContainer);

  // create loading indicator
  // want to make this more modular?? Keep styling separate?
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.textContent = 'Loading posts...';
  loadingIndicator.style.textAlign = 'center';
  loadingIndicator.style.padding = '20px';
  postZone.appendChild(loadingIndicator);

  // create "load more" button
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'load-more-btn';
  loadMoreBtn.textContent = 'Load More Posts';
  loadMoreBtn.style.display = 'none';
  loadMoreBtn.style.margin = '20px auto';
  loadMoreBtn.style.padding = '10px 20px';
  loadMoreBtn.style.display = 'block';
  postZone.appendChild(loadMoreBtn);

  // initialize blog system
  blog = new BlogSystem();
  const initialized = await blog.initialize();

  if (!initialized) {
    console.warn("Failed to initialize blog, using prototype posts");
    displayPrototypePosts(postContainer);
    loadingIndicator.style.display = 'none';
    loadMoreBtn.style.display = 'none';
    return;
  }

  // load first page
  await loadMorePosts();

  // set up load more button
  loadMoreBtn.addEventListener('click', loadMorePosts);

  return Promise.resolve();
  
}

//Function to load more posts
async function loadMorePosts() {
  const postContainer = document.querySelector('.post-container');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const loadMoreBtn = document.querySelector('.load-more-btn');

  if(!blog || blog.allPostsLoaded) {
    console.log("No more posts to load.");
    loadMoreBtn.style.display = 'none';
    loadingIndicator.style.display = 'none';
    return;
  }

  //show loading indicator
  loadingIndicator.style.display = 'block';
  loadMoreBtn.disabled = true;

  try {
    const newPosts = await blog.loadNextPage();

    if (newPosts.length > 0) {
      newPosts.forEach(post => {
        const postElement = createPostElement(post);
        postContainer.appendChild(postElement);
      });

      // initialize slideshows for new posts
      setTimeout(() => {
        initializeSlideshows();
        setupSlideshowCursorInteractions();
      }, 100);
    }

    // update button visibility
    if (blog.allPostsLoaded) {
      loadMoreBtn.style.display = 'none';
      loadingIndicator.textContent = "All posts loaded!";
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
      }, 2000);
    } else {
      loadMoreBtn.disabled = false;
      loadingIndicator.style.display = 'none';
    }
  } catch (error) {
    console.error("Error loading posts:", error);
    loadingIndicator.textContent = 'Error loading posts.';
    loadMoreBtn.disabled = false;
  }
}

// function to display prototype posts as fallback
function displayPrototypePosts(postContainer) {
  protoPosts.forEach(post => {
    const postElement = createPostElement(post);
    postContainer.appendChild(postElement);
  });
}

// // Main function to load and display blog posts
// async function loadBlogPosts() {
//     const postZone = document.querySelector('.post-zone');
  
//     if (!postZone) {
//       console.error("Post zone element not found!");
//     //   return;
//       return Promise.reject("Post zone not found");
//     }
  
//     console.log("loading posts...");
  
//     // clear any existing content
//     postZone.innerHTML = "";
  
//     // create a container for posts that can scroll
//     const postContainer = document.createElement('div');
//     postContainer.className = 'post-container';
//     postZone.appendChild(postContainer);
  
//     // Initialize blog system and load posts
//     const blog = new BlogSystem();
//     const posts = await blog.loadPosts();
  
//     // Display posts or fall back to protoPosts if none found
//     if (posts.length > 0) {
//       posts.forEach(post => {
//         if (post) {
//           const postElement = createPostElement(post);
//           postContainer.appendChild(postElement);
//         }
//       });
//     } else {
//       console.warn("No markdown posts found, falling back to prototype posts");
//       protoPosts.forEach(post => {
//         const postElement = createPostElement(post);
//         postContainer.appendChild(postElement);
//       });
//     }

//     return Promise.resolve(posts); // return a resolved promise when done
//   }
  

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


// Function to convert multiple adjacent images to slideshows
function initializeSlideshows() {
    console.log("Initializing slideshows...");
    
    // Target the post-zone specifically
    const postZone = document.querySelector('.post-zone');
    if (!postZone) {
      console.error("Post zone not found!");
      return;
    }
    
    // Find all posts within the post-zone
    const posts = postZone.querySelectorAll('.post');
    console.log(`Found ${posts.length} posts in the post zone`);
    
    posts.forEach((post, postIndex) => {
      console.log(`Processing post #${postIndex + 1}`);
      
      // Find all images in the post
      const images = post.querySelectorAll('img');
      console.log(`Found ${images.length} images in post #${postIndex + 1}`);
      
      if (images.length <= 1) {
        console.log("Not enough images for a slideshow in this post");
        return;
      }
      
      // Group adjacent images
      const imageGroups = [];
      let currentGroup = [];
      let currentParent = null;
      
      images.forEach((img, imgIndex) => {
        const imgParent = img.parentElement;
        console.log(`Image ${imgIndex + 1} parent tag: ${imgParent.tagName}`);
        
        // Check if we have siblings between images
        let hasTextBetween = false;
        if (imgIndex > 0) {
          // Check all nodes between previous and current image
          let node = images[imgIndex - 1].nextSibling;
          while (node && node !== img) {
            if (node.nodeType === 3 && node.textContent.trim() !== '') { // Text node with content
              hasTextBetween = true;
              console.log("Found text between images:", node.textContent.trim());
              break;
            }
            node = node.nextSibling;
          }
        }
        
        // If this is a new parent or new paragraph or has text between, start new group
        if (!currentParent || imgParent !== currentParent || hasTextBetween) {
          if (currentGroup.length > 0) {
            imageGroups.push([...currentGroup]);
            console.log(`Created group with ${currentGroup.length} images`);
          }
          currentGroup = [img];
          currentParent = imgParent;
        } else {
          // Same parent, add to current group
          currentGroup.push(img);
        }
      });
      
      // Don't forget the last group
      if (currentGroup.length > 0) {
        imageGroups.push(currentGroup);
        console.log(`Created final group with ${currentGroup.length} images`);
      }
      
      console.log(`Found ${imageGroups.length} image groups`);
      
      // Only create slideshows for groups with multiple images
      imageGroups.filter(group => group.length > 1).forEach((group, groupIndex) => {
        console.log(`Creating slideshow for group #${groupIndex + 1} with ${group.length} images`);
        createSlideshow(group);
      });
    });
}
  
// Function to create a slideshow from a group of images
function createSlideshow(imageGroup) {
    console.log("Creating slideshow...");
    
    if (!imageGroup || imageGroup.length <= 1) {
      console.warn("Not enough images for slideshow");
      return;
    }
    
    // create slideshow container
    const slideshowContainer = document.createElement('div');
    slideshowContainer.className = 'slideshow-container';
    
    // create slides container
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'slides';
    
    // add each image as a slide
    imageGroup.forEach((img, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide'; // Fixed: was 'classname'
      
      // clone the image to use in the slideshow
      const imgClone = img.cloneNode(true);
      slide.appendChild(imgClone);
      slidesContainer.appendChild(slide);
      console.log(`Added slide ${i + 1} with image: ${imgClone.src}`);
    });
  
    // create navigation container for buttons and dots
    const navigationContainer = document.createElement('div');
    navigationContainer.className = 'slideshow-navigation';

    // create navigation buttons
    const prevButton = document.createElement('button');
    prevButton.className = 'prev-button';
    prevButton.innerHTML = '&#10094;'; // left arrow
    
    const nextButton = document.createElement('button');
    nextButton.className = 'next-button';
    nextButton.innerHTML = '&#10095;'; // Right arrow
  
    // create dots container to show navigation
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'dots-container';
  
    // add navigation dots
    imageGroup.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = index === 0 ? 'dot active' : 'dot';
      dot.dataset.index = index;
      dotsContainer.appendChild(dot);
    });

    // assemble navigation: prev button, dots, next button
    navigationContainer.appendChild(prevButton);
    navigationContainer.appendChild(dotsContainer);
    navigationContainer.appendChild(nextButton);
  
    // assemble slideshow
    slideshowContainer.appendChild(slidesContainer);
    slideshowContainer.appendChild(navigationContainer);
  
    // replace the first image with the slideshow
    const firstImg = imageGroup[0];
    const parentElement = firstImg.parentNode;
    console.log(`Parent element of first image: ${parentElement.tagName}`);
  
    // if the parent is a paragraph, replace the paragraph
    if (parentElement.tagName === 'P') {
      console.log("Replacing parent paragraph with slideshow");
      parentElement.parentNode.replaceChild(slideshowContainer, parentElement);
    } else {
      // otherwise insert before the first image and remove all images
      console.log("Inserting slideshow before first image");
      parentElement.insertBefore(slideshowContainer, firstImg);
    }
  
    // remove the original images from the DOM
    imageGroup.forEach(img => {
      if (img.parentNode) {
        console.log(`Removing original image: ${img.src}`);
        img.remove();
      }
    });
    
    // initialize slideshow functionality
    console.log("Initializing slideshow controls");
    initSlideshow(slideshowContainer);
}

// function to handle slideshow movement
function initSlideshow(container) {
    console.log("Setting up slideshow controls");
    
    const slides = container.querySelector('.slides');
    const prevButton = container.querySelector('.prev-button');
    const nextButton = container.querySelector('.next-button');
    const dots = container.querySelectorAll('.dot');
    let currentIndex = 0;
    
    if (!slides || !prevButton || !nextButton) {
      console.error("Missing slideshow elements", { slides, prevButton, nextButton });
      return;
    }
    
    // function to show a specific slide
    function showSlide(index) {
      const totalSlides = slides.children.length;
      console.log(`Showing slide ${index + 1} of ${totalSlides}`);
  
      // handle wrapping
      if (index < 0) {
        currentIndex = totalSlides - 1;
      } else if (index >= totalSlides) {
        currentIndex = 0;
      } else {
        currentIndex = index;
      }
  
      // move the slides
      slides.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // update active dot
      dots.forEach((dot, i) => {
        dot.className = i === currentIndex ? 'dot active' : 'dot';
      });
    }
  
    // set up event listeners
    prevButton.addEventListener('click', () => {
      console.log("Previous button clicked");
      showSlide(currentIndex - 1);
    });
    
    nextButton.addEventListener('click', () => {
      console.log("Next button clicked");
      showSlide(currentIndex + 1);
    });
  
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index);
        console.log(`Dot ${index + 1} clicked`);
        showSlide(index);
      });
    });
  
    // show the first slide
    showSlide(0);

    // setup cursor interactions
    setupSlideshowCursorInteractions();
}

// Function to add event listeners for the custom cursor
function setupSlideshowCursorInteractions() {
    // Get all slideshow navigation elements
    const slideshowControls = document.querySelectorAll('.prev-button, .next-button, .dot');
    
    // Add hover effect for custom cursor
    slideshowControls.forEach(control => {
      control.addEventListener('mouseenter', () => {
        const cursorEl = document.querySelector('.custom-cursor');
        if (cursorEl) cursorEl.classList.add('hover');
      });
      
      control.addEventListener('mouseleave', () => {
        const cursorEl = document.querySelector('.custom-cursor');
        if (cursorEl) cursorEl.classList.remove('hover');
      });
    });
}



document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM is loaded!");
    // load blog posts

    // loadBlogPosts();
    // loadBlogPosts().then(() => {
    //     console.log("Blog posts loaded, initializing slideshows");
    //     setTimeout(initializeSlideshows, 500); // give time for posts to render
    // });
    initializeBlog();

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

    // After some time (to ensure slideshows are created)
    setTimeout(() => {
        setupSlideshowCursorInteractions();
    }, 500);

});