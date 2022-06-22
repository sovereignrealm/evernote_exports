const fs = require('fs');
const path = require("path");


if (process.argv.length !== 3) {
    throw "Need to pass the directory name as argument"
}
const arrFolder = process.argv.slice(2);
if (!Array.isArray(arrFolder) || typeof arrFolder[0] !== "string") {
    throw "Need to pass the directory name as argument";
}
const folderName = arrFolder[0];
const basePath = path.join(__dirname, 'notebooks/' + folderName);

fs.readdir(basePath, (err, files) => {
    if (err) throw err;
    for (let f of files) {
        const filePath = basePath + "/" + f;
        const buff = fs.readFileSync(filePath);
        const imgPathParsed = buff.toString().replace(/<img src="(?!http|assets\/imgs\/)/g, `<img src="/assets/imgs/`);
        const parsed = imgPathParsed.replace(/<a href="(?!http|assets\/imgs\/)/g,`<a href="/assets/imgs/`);
        fs.writeFileSync(filePath, parsed);
    }
});