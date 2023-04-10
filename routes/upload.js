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
    } else {

      // @ Deepak (01/03/2023) Checking File extension. If .ext(csv) read file and parse file data 
      //                       Insert parrsed data into table
      const results = [];
      let headers;
      // @ Deepak (24/02/2023) parsed month and year from body 
      const selectedMonth = req.body.selectedMonth;
      const selectedYear = req.body.selectedYear;
      if (req.file.mimetype === 'text/csv') {

        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('headers', (csvHeaders) => {
            headers = csvHeaders;
            console.log(headers);
          })
          .on('data', (filedata) => {
            results.push(filedata);
            console.log(filedata);
          })
          .on('end', () => {

            // @ Deepak (10/04/2023) checking column of uploaded file with database column 
                                // if column is missing send response to client with message
            const expectedColumns = ["emp_id", "emp_name", "emp_email", "emp_contact_details", "emp_designation", "basic", "HRA", "Other_Allowances", "PF", "ESI", "PT", "IT", "Company_Contribution_PF", "Company_Contribution_ESI"]

            const missingColumns = expectedColumns.filter((column) => !headers.includes(column));
           if (missingColumns.length > 0) {
          //@ Deepak (10/04/2023) Send response with dynamic message
          const message = `The following columns are missing: ${missingColumns.join(', ')}`;
          console.log(message);
          res.status(400).send({ message });
        }else {
            const values = results.map((item) => [
              item.emp_id, item.emp_name, item.emp_email, item.emp_contact_details, item.emp_designation,
              item.basic, item.HRA, item.Other_Allowances, item.PF, item.ESI, item.PT, item.IT, item.Company_Contribution_PF, item.Company_Contribution_ESI,
              month = req.body.selectedMonth,
              year = req.body.selectedYear
            ]);
            // Deepak (07/03/2023) Get all data of selected month  and selected year, IF data exist
            const selectQuery = `SELECT * FROM Emp_All_Details WHERE month = '${selectedMonth}' AND year = ${selectedYear}`;

            connection.query(selectQuery, (error, results, fields) => {
              if (error) {
                res.status(400).send({
                  message: 'Cannot Find The Details of Employees',
                  error_code: "#5002 error in fetching table data",
                  status: false
                });
              } else {

                if (results.length == 0) {
                  // @ Deepak (01/03/2023) Insert data into table
                  let insertSql = `INSERT INTO Emp_All_Details (emp_id, emp_name, emp_email, emp_contact_details, emp_designation, basic, HRA, Other_Allowances, PF, ESI, PT, IT, Company_Contribution_PF, Company_Contribution_ESI ,month, year) VALUES ? `;
                  connection.query(insertSql, [values], (error, result) => {
                    if (error) {
                      console.error(error);
                      res.status(400).send({
                        message: "incorrect data(row does not match)",
                        error_code: "#5004 error in Inserting data into table",
                        status: false
                      });
                    } else {
                      console.log(`${result.affectedRows} rows inserted into table Emp_All_Details`);
                      const filePath = req.file.path;
                       // @ Deepak (10/04/2023) Delete the uploaded file from the internal storage
                      fs.unlink(filePath, (err) => {
                        if (err) {
                          console.error(err);
                          res.status(400).send({
                            message: "uploaded file is not deleted successsfully!!! ",
                            error_code: "#5005 error in deleting file",
                            status: false
                          });
                        } else {
                          res.status(200).send({ message: 'File Uploaded successfully', status: true });
                        }
                      });
                    }
                  });
                }
                else {
                  // Deepak (07/03/2023) If data exists, delete existing data for the selected month and year

                  const deleteQuery = `DELETE FROM Emp_All_Details WHERE month = '${selectedMonth}' AND year = ${selectedYear}`;
                  connection.query(deleteQuery, (error, results, fields) => {
                    if (error) {
                      res.status(400).send({
                        message: 'Selected Data Does Not Deleted',
                        error_code: "#5003 error in deleting data in the table",
                        status: false
                      });
                    } else {
                      // @ Deepak (01/03/2023) Insert data into table
                      let insertSql = `INSERT INTO Emp_All_Details (emp_id, emp_name, emp_email, emp_contact_details, emp_designation, basic, HRA, Other_Allowances, PF, ESI, PT, IT, Company_Contribution_PF, Company_Contribution_ESI ,month, year) VALUES ? `;
                      connection.query(insertSql, [values], (error, result) => {
                        if (error) {
                          console.error(error);
                          res.status(400).send({
                            message: "incorrect data(row does not match)",
                            error_code: "#5004 error in Inserting data into table",
                            status: false
                          });
                        } else {
                          console.log(`${result.affectedRows} rows inserted into table Emp_All_Details`);
                          const filePath = req.file.path;
                          // @ Deepak (10/04/2023) Delete the uploaded file from the internal storage
                          fs.unlink(filePath, (err) => {
                            if (err) {
                              console.error(err);
                              res.status(400).send({
                                message: "uploaded file is not deleted successsfully!!! ",
                                error_code: "#5005 error in deleting file",
                                status: false
                              });
                            } else {
                              res.status(200).send({ message: 'File Uploaded successfully', status: true });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              }
            });
          }
          });
      }

      // @ Deepak (01/03/2023) Checking File extension. If .ext(xlsx) read file and parse file data 
      // Insert parsed data into table
      else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        range.s.r += 0;
        sheet['!ref'] = XLSX.utils.encode_range(range);
        const results = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headerRow = results[0];
        const dataRows = results.slice(1);
        const headers = headerRow;

        const expectedColumns = ["emp_id", "emp_name", "emp_email", "emp_contact_details", "emp_designation", "basic", "HRA", "Other_Allowances", "PF", "ESI", "PT", "IT", "Company_Contribution_PF", "Company_Contribution_ESI"]
        // @ Deepak (10/04/2023) checking column of uploaded file with database column 
                                // if column is missing send response to client with message

        const missingColumns = expectedColumns.filter((column) => !headers.includes(column));
        if (missingColumns.length > 0) {
          // @ Deepak (10/04/2023) Send response with dynamic message
          const message = `The following columns are missing: ${missingColumns.join(', ')}`;
          console.log(message);
          res.status(400).send({ message });
        }
        else {
          // @ Deepak (01/03/2023) Insert data into table
          const values = dataRows.map((item) => [
            item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], item[8], item[9], item[10], item[11], item[12], item[13],
            month = req.body.selectedMonth,
            year = req.body.selectedYear
          ]);
          // console.log(values);
          // Deepak (07/03/2023) Get all data of selected month  and selected year, IF data exist
          const selectQuery = `SELECT * FROM Emp_All_Details WHERE month = '${selectedMonth}' AND year = ${selectedYear}`;
          connection.query(selectQuery, (error, results, fields) => {
            if (error) {
              res.status(400).send({
                message: 'Cannot Find The Details of Employees',
                error_code: "#5006 error in fetching table data",
                status: false
              });
            } else {
             
              if (results.length == 0) {
                // Deepak (07/03/2023) Inserting data into table
                let insertSql = `INSERT INTO Emp_All_Details (emp_id, emp_name, emp_email, emp_contact_details, emp_designation, basic, HRA, Other_Allowances, PF, ESI, PT, IT, Company_Contribution_PF, Company_Contribution_ESI ,month, year) VALUES ? `;
                connection.query(insertSql, [values], (error, result) => {
                  if (error) {
                    console.error(error);
                    res.status(400).send({
                      message: "incorrect data(row does not match)",
                      error_code: "#5008 error in Inserting data into table",
                      status: false
                    });
                  } else {
                    const filePath = req.file.path;
                    // @ Deepak (10/04/2023) Delete the uploaded file from the internal storage
                    fs.unlink(filePath, (err) => {
                      if (err) {
                        console.error(err);
                        res.status(400).send({
                          message: "uploaded file is not deleted successsfully!!! ",
                          error_code: "#5009 error in deleting file",
                          status: false
                        });
                      } else {
                        res.status(200).send({ message: 'File Uploaded successfully', status: true });
                      }
                    });
                  }
                });
              }
              else {
                 // Deepak (07/03/2023) If data exists, delete existing data for the selected month and year
                const deleteQuery = `DELETE FROM Emp_All_Details WHERE month = '${selectedMonth}' AND year = ${selectedYear}`;
                connection.query(deleteQuery, (error, results, fields) => {
                  if (error) {
                    res.status(400).send({
                      message: 'Selected Data Does Not Deleted',
                      error_code: "#5007 error in deleting data in the table",
                      status: false
                    });
                  } else {
                    // Deepak (07/03/2023) Inserting data into table
                    let insertSql = `INSERT INTO Emp_All_Details (emp_id, emp_name, emp_email, emp_contact_details, emp_designation, basic, HRA, Other_Allowances, PF, ESI, PT, IT, Company_Contribution_PF, Company_Contribution_ESI ,month, year) VALUES ? `;
                    connection.query(insertSql, [values], (error, result) => {
                      if (error) {
                        console.error(error);
                        res.status(400).send({
                          message: "incorrect data(row does not match)",
                          error_code: "#5008 error in Inserting data into table",
                          status: false
                        });
                      } else {
                        const filePath = req.file.path;
                        // @ Deepak (10/04/2023) Delete the uploaded file from the internal storage
                        fs.unlink(filePath, (err) => {
                          if (err) {
                            console.error(err);
                            res.status(400).send({
                              message: "uploaded file is not deleted successsfully!!! ",
                              error_code: "#5009 error in deleting file",
                              status: false
                            });
                          } else {
                            // console.log(`File ${filePath} deleted successfully.`);
                            res.status(200).send({ message: 'File Uploaded successfully', status: true });
                          }
                        });
                      }
                    });
                  }
                });
              }
            }
          });
        }
      }
    }

  });
}

// Deepak (07/03/2023) Creating a function to get tables name from database table and sending response to client side
function getEmpTableData(req, res) {

  const selectedMonth = req.query.month;
  const selectedYear = req.query.year;
  let query;
  if (selectedMonth) {
    query = `SELECT * FROM Emp_All_Details WHERE month ='${selectedMonth}' AND year = '${selectedYear}'`;
  }
  else {
    query = `SELECT * FROM  Emp_All_Details WHERE year = '${selectedYear}'`;
  }
  connection.query(query, (error, results) => {
    if (error) {
      console.error(error);
      res.status(400).send({
        message: "cannot get table data of selected month and year",
        error_code: "#5010 error in geting tables data",
        status: false
      });
    } else {
      // console.log(results);
      res.status(200).send({ results: results, status: true });
    }

  });
}

module.exports = {
  uploadExcel,
  getEmpTableData,
};