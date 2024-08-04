const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dlceiljkp',
  api_key: '429626168541581',
  api_secret: 'akV03DrGCssaYa0lcNwjFv1Zk2w',
  secure: true,
});

module.exports = cloudinary;