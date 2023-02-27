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

function uploadExcel(req, res) {

  // @ Deepak (24/02/2023) Uploading file in the destination folder
  upload(req, res, (err) => {
    if (err) {

      res.status(400).send({
        message: 'file not uploaded',
        error_code: "#5001 error in geting file",
        status: false
      });
    }

    // @ Deepak (24/02/2023) Slicing filename from backwords to create a table name
    const fname = req.file.originalname.slice(0, -5);

    // @ Deepak (24/02/2023) Concatenated table name with selected month and year
    const table_name = `${fname}`;

    // @ Deepak (24/02/2023) getting a list of tables 
    const showTable = `SHOW TABLES LIKE '${table_name}'`;

    connection.query(showTable, function (err, result) {
      if (err) {
        res.status(400).send({
          message: "cannot find a table name",
          error_code: "#5002 error in fetching table  from database",
          status: false
        });

      };

      // @ Deepak (24/02/2023) Checking if table name exist in database or not
      if (result.length === 0) {

        // @ Deepak (24/02/2023) Table is not exists, Creating a new table in database and Inserting a new data in the table 
        const createTableSql = `CREATE TABLE ${table_name} (id INT AUTO_INCREMENT PRIMARY KEY, 
          first_name VARCHAR(255),last_name VARCHAR(255),class VARCHAR(255), age INT, updated_date VARCHAR(255))`;

        connection.query(createTableSql, function (err, result) {
          if (err) {
            res.status(400).send({
              message: "table not created ",
              error_code: "#5003 error in creating table",
              status: false
            })
          }
          //  res.status(200).send({ message: 'Table Created successfully' });
          console.log(`Table ${table_name} created`);
          insertDataIntoTable(table_name);
        });
      }
      else {

        // @ Deepak (24/02/2023) Table already exists, truncate the table and insert new data
        const truncateTableQuery = `TRUNCATE TABLE ${table_name}`;

        connection.query(truncateTableQuery, (error, result) => {
          if (error) {
            res.status(400).send({
              message: "table not deleted",
              error_code: "#5004 error in deleting data",
              status: false
            });

          }
          // res.status(200).json({ message: 'Data Deleted successfully' });
          insertDataIntoTable(table_name);
        });
      }
    });

    // @ Deepak (24/02/2023) Creating a function to insert file data in the table 
    function insertDataIntoTable(table_name) {

      // @ Deepak (24/02/2023) Read the data from the Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // @ Deepak (24/02/2023) Parse the data and insert it into the table
      let insertSql = `INSERT INTO ${table_name} (first_name,last_name,class,age,updated_date) VALUES ? `;

      connection.query(insertSql, [data], (error, result) => {
        if (error) {
          res.status(400).send({ message: "incorrect data(row does not match)", error_code: "#5005 error in geting data", status: false });
          return;
        } else {

          console.log(`${result.affectedRows} rows inserted into table ${table_name}`);
          res.status(200).send({ message: 'File uploaded successfully' });
        }
      });
      // console.log(data);
    }

  });

  // @ Deepak (24/02/2023) Check status when file uploaded
  // res.status(200).json({ message: 'File uploaded successfully' });

}

module.exports = { uploadExcel };