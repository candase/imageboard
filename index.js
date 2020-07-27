const express = require("express");
const app = express();
const s3 = require("./s3");
let { s3Url } = require("./config.json");

/////File Upload//////

const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");

const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + "/uploads");
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function (uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    },
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152,
    },
});

//////////////////////

const {
    getImages,
    addImage,
    getModalImage,
    addComment,
    getComments,
    moreImages,
    lastImageToShow,
    checkNewImg,
    deleteImgFromDb,
    deleteImgFromComm,
} = require("./db");

app.use(express.static("public"));

app.use(express.json());

app.use((req, res, next) => {
    const date = new Date();
    console.log(`
------------------------------------------------
    method: ${req.method} 
    url: ${req.url}
    at: ${date.toUTCString()}
------------------------------------------------
    `);
    next();
});

app.get("/", (req, res) => {
    res.send("index.html");
});

app.get("/images", (req, res) => {
    getImages()
        .then((result) => {
            let firstSixImages = result.rows.slice(-6);
            res.json(firstSixImages);
        })
        .catch((err) => {
            console.log("error in getImages /images:", err);
            res.sendStatus(500);
        });
});

app.post("/more", (req, res) => {
    let lastImageId = req.body[0].lastId;

    moreImages(lastImageId)
        .then((result) => {
            let imagesToAdd = result.rows;
            lastImageToShow().then((result) => {
                imagesToAdd = imagesToAdd.concat(result.rows);
                res.json(imagesToAdd);
            });
        })
        .catch((err) => {
            console.log("error in getImages /more:", err);
            res.sendStatus(500);
        });
});

app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    const { filename } = req.file;
    const imageUrl = `${s3Url}${filename}`;

    if (req.file) {
        addImage(
            imageUrl,
            req.body.username,
            req.body.title,
            req.body.description
        )
            .then((result) => {
                res.json(result.rows[0]);
            })
            .catch((err) => {
                console.log("error in addImage /upload:", err);
                res.sendStatus(500);
            });
    } else {
        res.sendStatus(500);
    }
});

app.get("/check", (req, res) => {
    checkNewImg()
        .then((result) => {
            res.json(result.rows);
        })
        .catch((err) => {
            console.log("error in checkNewImg /check", err);
        });
});

app.post("/modal", (req, res) => {
    let imageId = req.body.modalImageId;
    if (imageId == "") {
        imageId = "0";
    }

    getModalImage(imageId)
        .then((result) => {
            console.log("result.rows get modal: ", result.rows);
            if (result.rows.length == 0) {
                res.json({
                    noImage: true,
                });
            } else {
                let date = result.rows[0].created_at.toUTCString();
                result.rows[0].created_at = date;
                let dataSend = result.rows[0];
                getComments(imageId)
                    .then((result) => {
                        for (let i = 0; i < result.rows.length; i++) {
                            result.rows[i].created_at = result.rows[
                                i
                            ].created_at.toUTCString();
                        }

                        dataSend.comments = result.rows.reverse();
                        res.json(dataSend);
                    })
                    .catch((err) => {
                        console.log("error in getComments at /modal:id", err);
                    });
            }
        })
        .catch((err) => {
            console.log("error in getModalImage /modal:id:", err);
            res.sendStatus(500);
        });
});

app.post("/addComment", (req, res) => {
    if (req.body[0].username == "") {
        req.body[0].username = "anon";
    }
    if (req.body[0].comment == "") {
        req.body[0].comment = "no comment!";
    }
    addComment(req.body[0].image_id, req.body[0].username, req.body[0].comment)
        .then((result) => {
            result.rows[0].created_at = result.rows[0].created_at.toUTCString();
            res.json(result.rows[0]);
        })
        .catch((err) => {
            console.log("error in addComment at /addComment", err);
            res.sendStatus(500);
        });
});

app.post("/delete", (req, res) => {
    deleteImgFromComm(req.body.id)
        .then((result) => {
            deleteImgFromDb(req.body.id)
                .then((result) => {
                    res.json();
                })
                .catch((err) => {
                    console.log("error in deleteImgFromComm at /delete", err);
                });
        })
        .catch((err) => {
            console.log("error in deleteImgFromDb at /delete", err);
        });
});

app.listen(8080, () => {
    console.log("Server listening!");
});
