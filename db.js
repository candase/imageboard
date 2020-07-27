const spicedPg = require("spiced-pg");

let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbUser, dbPass } = require("./secrets.json");
    db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/imageBoard`);
}

exports.getImages = () => {
    return db.query(
        `
        SELECT * FROM images
        ORDER BY id DESC
        LIMIT 6
        `
    );
};

exports.moreImages = (lastId) => {
    return db.query(
        `
        SELECT * 
        FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 6
        `,
        [lastId]
    );
};

exports.lastImageToShow = () => {
    return db.query(
        `
        SELECT id FROM images
        ORDER BY id ASC
        LIMIT 1
        `
    );
};

exports.addImage = (url, username, title, description) => {
    return db.query(
        `
        INSERT INTO images (url, username, title, description) VALUES($1, $2, $3, $4) RETURNING *
        `,
        [url, username, title, description]
    );
};

exports.getModalImage = (id) => {
    return db.query(
        `
        SELECT *, 
        (SELECT id FROM images WHERE id < $1 ORDER BY id DESC LIMIT 1 ) as previous_image, 
        (SELECT id FROM images WHERE id > $1 ORDER BY id ASC LIMIT 1 ) as next_image 
        FROM images 
        WHERE id = $1 
        ORDER BY id ASC
        
        `,
        [id]
    );
};

exports.addComment = (imageId, username, comment) => {
    return db.query(
        `
        INSERT INTO comments (image_id, username, comment) VALUES($1, $2, $3) RETURNING *
        `,
        [imageId, username, comment]
    );
};

exports.getComments = (imagId) => {
    return db.query(
        `
        SELECT * FROM comments
        WHERE image_id = $1
        `,
        [imagId]
    );
};

exports.checkNewImg = () => {
    return db.query(
        `
        SELECT id FROM images
        ORDER BY id DESC
        LIMIT 1
        `
    );
};

exports.deleteImgFromDb = (imageId) => {
    return db.query(
        `
        DELETE FROM images 
        WHERE id = $1
    `,
        [imageId]
    );
};

exports.deleteImgFromComm = (imageId) => {
    return db.query(
        `
        DELETE FROM comments
        WHERE image_id = $1
    `,
        [imageId]
    );
};
