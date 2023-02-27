const express = require('express');
const multer = require('multer');
const cors = require('cors');
const XLSX = require('xlsx');
const connection = require('./dbConn');

const app = express();
app.use(express.json())
app.use(cors());

// @ Deepak (24/02/2023) Created file destination where we store a file
var storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "uploads/")
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname);
    console.log(file.originalname);

  }
});

var upload = multer({ storage: storage }).single('file');

// @ Deepak (16/02/2023) 
// Created this function for upload excel file

function uploadExcel(req, res){
  console.log("Hello");
}

module.exports = { uploadExcel };