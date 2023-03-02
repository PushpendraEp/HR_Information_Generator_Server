const express = require('express');
const multer = require('multer');
const path = require('path')
const cors = require('cors')
const csv = require('csv-parser');
const body_parser = require('body-parser');
const fs = require('fs');
const XLSX = require('xlsx');

connection = require('../db/connection');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('public'));
app.use(body_parser.json());
app.use(body_parser.urlencoded({
  extended: true
}));

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

    const selectedMonth = req.body.selectedMonth;
    const selectedYear = req.body.selectedYear;
    if (err) {

      res.status(400).send({
        message: 'file not uploaded',
        error_code: "#5001 error in geting file",
        status: false
      });
    } else {

      // @ Deepak (24/02/2023) removing (.ext) from filename to create a table name
      const fname = path.basename(req.file.originalname, path.extname(req.file.originalname));;

      // @ Deepak (24/02/2023) Concatenated table name with selected month and year
      const table_name = `${selectedMonth}_${selectedYear}_${fname}`;

      // @ Deepak (24/02/2023) getting a list of tables from database
      const showTable = `SHOW TABLES LIKE '${table_name}'`;

      connection.query(showTable, function (err, result) {
        if (err) {
          res.status(400).send({
            message: "cannot find a table name",
            error_code: "#5002 error in fetching table from database",
            status: false
          });

        };

        // @ Deepak (24/02/2023) Checking if table name exist in database or not
        if (result.length === 0) {

          // @ Deepak (24/02/2023) Table is not exists, Creating a new table in database and Inserting a new data in the table 
          const createTableSql = `CREATE TABLE ${table_name} (emp_id INT(10), 
          emp_name VARCHAR(255), totalSalaryPayOut VARCHAR(255), basic VARCHAR(255),
           HRA VARCHAR(255), PF VARCHAR(255), Others VARCHAR(255))`;

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
            // Deepak (24/02/2023) Calling a function to insert data in table
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
                error_code: "#5004 error in deleting data form existing table",
                status: false
              });

            }
            // res.status(200).json({ message: 'Data Deleted successfully' });
            // Deepak (24/02/2023) Calling a function to insert data in table
            insertDataIntoTable(table_name);
          });
        }
      });

      // @ Deepak (24/02/2023) Creating a function to insert file data in the table 
      function insertDataIntoTable(table_name) {
        const results = [];
        // @ Deepak (01/03/2023) Checking uploaded file and Reading file data
        if (!req.file) {
          res.status(400).send({
            message: "Unsupportedd file type",
            error_code: "#5005 error in reading file (file not supported)",
            status: false
          });
        };

        // @ Deepak (01/03/2023) Checking File extension. If .ext(csv) read file and parse file data 
        // Insert parrsed data into table
        if (req.file.mimetype === 'text/csv') {

          fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (filedata) => {
              results.push(filedata);
            })
            .on('end', () => {
              console.log(results);

              // @ Deepak (01/03/2023) Insert data into table
              let insertSql = `INSERT INTO ${table_name} (emp_id, emp_name, totalSalaryPayOut, basic, HRA, PF, Others) VALUES ? `;
              const values = results.map((item) => [item.emp_id, item.emp_name, item.totalSalaryPayOut, item.basic, item.HRA, item.PF, item.Others]);
              connection.query(insertSql, [values], (error, result) => {
                if (error) {
                  console.error(error);
                  res.status(400).send({
                    message: "incorrect data(row does not match)",
                    error_code: "#5006 error in Inserting data into table",
                    status: false
                  });
                } else {

                  console.log(`${result.affectedRows} rows inserted into table ${table_name}`);
                  res.status(200).send({ message: 'Data Inserted successfully' });

                }

              });

            });
        }

        // @ Deepak (01/03/2023) Checking File extension. If .ext(xlsx) read file and parse file data 
        // Insert parsed data into table
        else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          const workbook = XLSX.readFile(req.file.path);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const results = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          console.log(results);

          // @ Deepak (01/03/2023) Insert data into table        
          let insertSql = `INSERT INTO ${table_name} (emp_id, emp_name, totalSalaryPayOut, basic, HRA, PF, Others) VALUES ? `;
          connection.query(insertSql, [results], (error, result) => {
            if (error) {
              console.error(error);
              res.status(400).send({
                message: "incorrect data(row does not match)",
                error_code: "#5007 error in Inserting data into table",
                status: false
              });
            } else {

              console.log(`${result.affectedRows} rows inserted into table ${table_name}`);
              res.status(200).send({ message: 'Data Inserted successfully' });

            }

          });

        } else {
          res.status(400).send('Invalid file type');
        }
        // Deepak (24/02/2023) Calling a function to insert tables name in a table
        insertTablesIntoTable(table_name);
      };

      const tableName = `${table_name}`;
      // console.log(tableName);
      const month=`${selectedMonth}`
      // console.log(year);
      const year=`${selectedYear}`
      // console.log(month);

      // Deepak (24/02/2023) Creating a function to insert tables name in a table
      function insertTablesIntoTable() {
        const sql = `INSERT INTO table_names (name,years,months) VALUES (?,?,?)`;
        const values = [tableName, year, month];
        console.log(values);

        connection.query(sql, values, (error, results) => {
          if (error) {
            console.error(error);
            res.status(400).send({
              message: "incorrect data(row does not stored)",
              error_code: "#5008 error in inserting table name into table",
              status: false
            });
          } else {
            console.log(`${results.affectedRows} row inserted into table table_names`);
          }
        });

      }

    }
  });

}

// Deepak (24/02/2023) Creating a function to get tables name from database table and sseending response to client side
function getTableList(req, res) {

  const selectedYear=req.body.year
  const sql = 'SELECT name FROM table_names Where years='+ selectedYear;

  connection.query(sql, (error, results) => {
    if (error) {
      console.error(error);
      res.status(400).send({
        message: "cannot get tables list",
        error_code: "#5009 error in geting tables list",
        status: false
      });
    } else {
      console.log(results);
      res.send(results);
    }

  });
}

module.exports = {
  uploadExcel,
  getTableList
};