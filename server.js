"use strict";

require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require("path");
const cheerio = require('cheerio');
const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require('cors');
const basicAuth = require("./middlewares/basicAuth");
const server = express();


server.use(express.static(path.join(__dirname, 'public')));
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // start blocking after 5 requests
    message:
        "Too many requests from this IP"
});

server.use(cors());

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
    if (notebook in allFiles) return cb();
    const filePath = basePath + "/" + "Evernote_index." + "html";
    const buff = fs.readFileSync(filePath);
    const $ = cheerio.load(buff.toString());
    const list = $("body > ul > li");
    for (let node of list) {
        const fileName = $(node).text();
        const filePath = basePath + "/" + fileName + ".html";
        if (!(notebook in allFiles)) {
            allFiles[notebook] = {};
        } else if (!(fileName in allFiles[notebook]) && fs.existsSync(filePath) && fileName !== "Evernote_index.") {
            allFiles[notebook][fileName] = true;
        }
    }
    cb();
}

server.get("/", authLimiter, basicAuth, (req, res) => {
    try {
        addNotebooks(() => {
            res.render("index", { noteBooks });
        })
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

server.get("/notebooks/:notebook/files/:file", authLimiter, basicAuth, (req, res) => {
    try {
        const notebook = req.params.notebook;
        const file = req.params.file;
        const job = () => {
            const basePath = path.join(__dirname, 'notebooks/' + notebook);
            const filePath = basePath + "/" + file + ".html";
            res.sendFile(filePath);
        }
        if (!(notebook in allFiles)) {
            addAllFiles(notebook, () => {
                job();
            })
        } else {
            if (!(notebook in allFiles)) return res.status(404).send("Not found notebook");
            if (!(file in allFiles[notebook])) return res.status(404).send("Not found file");
            job();
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

server.get("/notebooks/:notebook", authLimiter, basicAuth, (req, res) => {
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

server.get("/search-term/:notebook", authLimiter, basicAuth, (req, res) => {
    try {
        const notebook = req.params.notebook;
        const term = req.query.term;
        const basePath = path.join(__dirname, 'notebooks/' + notebook);
        if (!(notebook in allFiles)) return res.status(404).send("Not found notebook in search");
        const files = Object.keys(allFiles[notebook]);
        if (files.length === 0) return res.sendStatus(500);
        filteredFiles = {};
        for (let fileName of files) {
            const filePath = basePath + "/" + fileName + ".html";
            const buff = fs.readFileSync(filePath);
            const content = buff.toString();
            const match = content.match(new RegExp(term, "ig"));
            if (match) {
                if (!(notebook in filteredFiles)) {
                    filteredFiles[notebook] = {};
                } else if (!(fileName in filteredFiles[notebook]) && fileName !== "Evernote_index.") {
                    filteredFiles[notebook][fileName] = true;
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