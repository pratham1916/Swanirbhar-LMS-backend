const path = require('path');
const crypto = require('crypto');
const fs = require('fs-extra');
const multer = require('multer');

const diskStorage = (folder) => {
    const baseDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(path.join(baseDir, folder));

    return multer.diskStorage({
        destination: (_, __, cb) => cb(null, path.join(baseDir, folder)),
        filename: (_, file, cb) => {
            const randomBytes = crypto.randomBytes(16).toString('hex');
            cb(null, `${randomBytes}${Date.now()}${path.extname(file.originalname)}`);
        }
    });
};

module.exports = { diskStorage };
