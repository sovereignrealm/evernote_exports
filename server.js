"use strict";

const fs = require('fs');
const path = require("path");
const cheerio = require('cheerio');
const express = require("express");
const server = express();


server.use(express.static(path.join(__dirname, 'public')));
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');

const noteBooks = {};
let allFiles = {};
let filteredFiles = {};

function addNotebooks(cb) {
    const basePath = path.join(__dirname, 'notebooks');
    if (Object.keys(noteBooks).length !== 0) return cb();
    fs.readdir(basePath, (err, folders) => {
        if (err) return res.sendStatus(500);
        for (let folder of folders) {
            if (!(folder in noteBooks)) {
                noteBooks[folder] = true;
            }
        }
        cb();
    });
}

function addAllFiles(notebook, cb) {
    const basePath = path.join(__dirname, 'notebooks/' + notebook);
    if (Object.keys(allFiles).length !== 0) return cb();
    const filePath = basePath + "/" + "Evernote_index." + "html";
    const buff = fs.readFileSync(filePath);
    const $ = cheerio.load(buff.toString());
    const list = $("body > ul > li");
    for (let node of list) {
        const fileName = $(node).text();
        const filePath = basePath + "/" + fileName + ".html";
        if (!(fileName in allFiles) && fs.existsSync(filePath) && fileName !== "Evernote_index.") {
            allFiles[fileName] = true;
        }
    }
    cb();
}

server.get("/", (req, res) => {
    try {
        addNotebooks(() => {
            res.render("index", { noteBooks });
        })
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

server.get("/notebooks/:notebook/files/:file", (req, res) => {
    try {
        const notebook = req.params.notebook;
        const file = req.params.file;
        const job = () => {
            const basePath = path.join(__dirname, 'notebooks/' + notebook);
            const filePath = basePath + "/" + file + ".html";
            res.sendFile(filePath);
        }
        if (Object.keys(allFiles).length === 0) {
            addAllFiles(notebook, () => {
                job();
            })
        } else {
            if (!(file in allFiles)) return res.status(404).send("Not found");
            job();
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

server.get("/notebooks/:notebook", (req, res) => {
    try {
        const notebook = req.params.notebook;
        addAllFiles(notebook, () => {
            res.render("files", { notebook, files: allFiles });
        })
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

server.get("/search-term/:notebook", (req, res) => {
    try {
        const notebook = req.params.notebook;
        const term = req.query.term;
        const basePath = path.join(__dirname, 'notebooks/' + notebook);
        const files = Object.keys(allFiles);
        if (files.length === 0) return res.sendStatus(500);
        filteredFiles = {};
        for (let fileName of files) {
            const filePath = basePath + "/" + fileName + ".html";
            const buff = fs.readFileSync(filePath);
            const content = buff.toString();
            const match = content.match(term)
            if (match) {
                if (!(fileName in filteredFiles) && fileName !== "Evernote_index.") {
                    filteredFiles[fileName] = true;
                }
            }
        }
        res.render("files", { notebook, files: filteredFiles });
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

const port = process.env.PORT || 8756;
server.listen(port, () => {
    console.log("Server running on port ", port)
})