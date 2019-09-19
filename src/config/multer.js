const multer = require("multer");
const crypto = require("crypto");
const { extname } = require("path");
const { resolve } = require("path");

module.exports = {
    storage: multer.diskStorage({
        destination: resolve(__dirname, "..", "..", "tmp", "uploads"),
        filename: (req, file, callback) => {
            crypto.randomBytes(16, (err, res) => {
                if (err) {
                    return callback(err);
                }
                return callback(
                    null,
                    res.toString("hex") + extname(file.originalname)
                );
            });
        }
    })
};
