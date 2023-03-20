const express = require('express');
const multer = require('multer');
const path = require('path')
const cors = require('cors')
const csv = require('csv-parser');
const body_parser = require('body-parser');
const fs = require('fs');
const XLSX = require('xlsx');
const pdf = require("pdfkit-table");

connection = require('../db/connection');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('public'));
app.use(body_parser.json());
app.use(body_parser.urlencoded({
    extended: true
}));


// Deepak (13/03/2023) Creating a function to get employee data from database using emp_id, selected month and selected year
function getTableListDataofEmployee(req, res) {

    // Deepak (13/03/2023) parsing emp_id,selected month and year from query params
    const selectedId = req.query.emp_id;
    const selectedMonth = req.query.month;
    const selectedYear = req.query.year;

    // Deepak (13/03/2023) getting selected employee details to generate payslip
    const sql = `SELECT emp_id, emp_name, emp_email, emp_contact_details, basic, HRA, PF, Others FROM Emp_All_Details WHERE emp_id = '${selectedId}' AND month = '${selectedMonth}' AND year = ${selectedYear}`;
    

    connection.query(sql, (error, results) => {
        if (error) {
            console.error(error);
            res.status(400).send({
                message: "cannot get selected table data of selected emp_id",
                error_code: "#5012 error in geting tables data",
                status: false
            });
        } else {
            // console.log(results);
            
            const basicPay = results[0].basic;
            const hra = results[0].HRA;
            const pf = results[0].PF;
            const others = results[0].Others;
            const payDate = new Date().toDateString();

            // Deepak (13/03/2023) total pay out salary of employee 
            const totalSalaryPayOut = parseInt(basicPay) + parseInt(hra) + parseInt(pf) + parseInt(others);

            // // Deepak (13/03/2023) Generate PDF payslip of employee 
            const doc = new pdf();
            // const doc = new PDFDocument();

            const filename = `payslip-${results[0].emp_id}.pdf`;
            const filePath = path.join(__dirname, 'public', filename);
            const fileStream = fs.createWriteStream(filePath);
                 doc.pipe(fileStream);

            doc.fontSize(18).text(`Engineer Philosophy Web Services`,  { align: 'center' })
            doc.font('Helvetica-Bold').fontSize(16);
            doc.text('Salary Slip', { align: 'center' }).moveDown();
            
           

            doc.font('Helvetica').fontSize(14);
            doc.info.Title = `Salary Slip for ${results[0].emp_name}`;
            doc.text(`Pay Date: ${payDate}`).moveDown();

            
            doc.fontSize(13).text(`Employee ID: ${results[0].emp_id}`).moveDown(0.5);
            doc.fontSize(13).text(`Employee Name: ${results[0].emp_name}`).moveDown(0.5);
            doc.fontSize(13).text(`Email: ${results[0].emp_email}` ).moveDown(1);

            // Deepak (13/03/2023) set headers and rows  of table
            const table = {
                headers: ['Earnings', 'Amount','Deductions', 'Amount'],
                rows: [
                  ['Basic Pay', `${basicPay}`,'EPF'],
                  ['HRA',  `${hra}`,'Health Insurance'],
                  ['PF', `${pf}`,'Professional Tax'],
                  ['Others',`${others}`, 'TDS' ],
                  ['Total', `${totalSalaryPayOut}`,'Total Deductions'],
                ],
              };

              // Deepak (13/03/2023) creating table for employee salary data
              doc.table(table, { width: 400, align: ['left', 'right'],
              prepareHeader: () => doc.font('Helvetica-Bold'), 
              prepareRow: (row, i) => doc.font('Helvetica').fontSize(12),
              cellWidth: 150,
              heightRatio: 1.2,
              stripe: true,
              border: true,
             });

              doc.moveDown();
              doc.text('Prepared By', { align: 'left' });
              doc.moveDown(0.5);

              doc.text('This Is Computer Generated Salary Slip', { align: 'center', underline: true }).moveDown();
              
              // Deepak (13/03/2023) ending PDF document
              doc.end();

              // Deepak (13/03/2023) sending response to client side
              fileStream.on('error', () => {
                res.status(404).send('File not found');
              });
              fileStream.on('open', () => {
                // const file = fs.readFileSync(filePath);
                res.status(200)
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            //   res.send(file);
             const filestream2 = fs.createReadStream(filePath);
             filestream2.pipe(res);
             
            });
            fileStream.on('finish', () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                  console.error(err);
                  res.status(400).send({
                    message: "generated PDF file is not deleted !!! ",
                    error_code: "#5013 error in deleting file",
                    status: false
                  });
                }
            });
        });
        }

    });
}

module.exports = { getTableListDataofEmployee }