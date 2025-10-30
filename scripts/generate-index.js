// for generating my index.json automatically
const fs = require('fs');
const path = require('path');

function getAllMarkdownFiles(dir, fileList = []){
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllMarkdownFiles(filePath, fileList);
        } else if (file.endsWith('.md')) {
            // store relative path from posts directory
            const relativePath = path.relative('posts', filePath);
            fileList.push(relativePath.replace(/\\/g, '/')); //Normalize path separators
        }
    });

    return fileList;
}

const postFiles = getAllMarkdownFiles('posts');

// sort by date (newest first) by reading front matter
const postsWithDates = postFiles.map(file => {
    const content = fs.readFileSync(path.join('posts', file), 'utf8');
    const dateMatch = content.match(/^date:\s*(.+)$/m);
    return {
        file,
        date: dateMatch ? new Date(dateMatch[1]) : new Date(0)
    };
});

postsWithDates.sort((a,b) => b.date - a.date);

fs.writeFileSync(
    'posts/index.json',
    JSON.stringify(postsWithDates.map(p=>p.file), null, 2)
);

console.log('Generated index.json with ${postFiles.length} posts');