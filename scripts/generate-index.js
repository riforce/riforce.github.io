// for generating my index.json automatically
const fs = require('fs');
const path = require('path');

// resolve paths relative to the script location
const postsDir = path.join(__dirname, '..', 'posts');
const indexPath = path.join(postsDir, 'index.json');

function getAllMarkdownFiles(dir, baseDir = dir, fileList = []){
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllMarkdownFiles(filePath, baseDir, fileList);
        } else if (file.endsWith('.md')) {
            // store relative path from posts directory
            const relativePath = path.relative(baseDir, filePath);
            fileList.push(relativePath.replace(/\\/g, '/')); //Normalize path separators
        }
    });

    return fileList;
}

const postFiles = getAllMarkdownFiles(postsDir);

// sort by date (newest first) by reading front matter
const postsWithDates = postFiles.map(file => {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
    // match date in front matter
    const dateMatch = content.match(/^date:\s*(.+)$/m);
    const dateStr = dateMatch ? dateMatch[1].trim() : null;
    // parse the date
    let date;
    if (dateStr) {
        date = new Date(dateStr);
    } else {
        console.warn(`No date found in ${file}, using epoch`);
        date = new Date(0);
    }
    console.log(`${file}: ${dateStr} -> ${date.toISOString()}`);
    return { file, date };
});

postsWithDates.sort((a,b) => b.date - a.date);

fs.writeFileSync(
    indexPath,
    JSON.stringify(postsWithDates.map(p=>p.file), null, 2)
);

console.log(`Generated index.json with ${postFiles.length} posts`);