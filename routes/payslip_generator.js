const express = require('express');
const multer = require('multer');
const path = require('path')
const cors = require('cors')
const csv = require('csv-parser');
const body_parser = require('body-parser');
const fs = require('fs');
const pdf = require('pdfkit');

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
  const sql = `SELECT emp_id, emp_name,emp_designation, basic, HRA, Other_Allowances, PF, ESI, PT, IT, Company_Contribution_PF, Company_Contribution_ESI ,month, year FROM Emp_All_Details WHERE emp_id = '${selectedId}' AND month = '${selectedMonth}' AND year = ${selectedYear}`;

  connection.query(sql, (error, results) => {
    if (error) {
      console.error(error);
      res.status(400).send({
        message: "cannot get selected table data of selected emp_id",
        error_code: "#5012 error in geting tables data",
        status: false
      });
    } else {

      const basicPay = results[0].basic;
      const hra = results[0].HRA;
      const others = results[0].Other_Allowances;
      const pf = results[0].PF;
      const ESI = results[0].ESI;
      const PT = results[0].PT;
      const IT = results[0].IT;
      const Company_Contribution_PF = results[0].Company_Contribution_PF;
      const Company_Contribution_ESI = results[0].Company_Contribution_ESI;
      const payDate = results[0].month + "/ " + results[0].year;

      // Deepak (13/03/2023) total pay out salary of employee 
      const totalSalaryPayOut = parseInt(basicPay) + parseInt(hra) + parseInt(others);

      // Deepak (13/03/2023) total deduction out salary of employee
      const Gross_Deduction = parseInt(pf) + parseInt(ESI) + parseInt(PT) + parseInt(IT);

      const net_take_home = totalSalaryPayOut - Gross_Deduction;
      const net_take_home_words = convert(net_take_home);
      // console.log(`Net take home salary in words: ${net_take_home_words}`);

      const gross_ctc = totalSalaryPayOut + parseInt(Company_Contribution_ESI) + parseInt(Company_Contribution_PF)

      // const ordinalNumberInWords = numberToWords.toWordsOrdinal(42);
      //   console.log(ordinalNumberInWords);
      // Deepak (13/03/2023) Generate PDF payslip of employee 
      const doc = new pdf({ size: [612, 850], margin: 0 });

      const filename = `payslip-${results[0].emp_id}.pdf`;
      const filePath = path.join(__dirname, 'public', filename);
      const fileStream = fs.createWriteStream(filePath);
      doc.pipe(fileStream);

      // Get the width and height of the page
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      doc.image('./image/logo.jpeg', {
        width: 110,
        height: 100,
        // set the x position of the image to the center of the page
        x: pageWidth / 2 - 55,
        y: 10 // set the y position of the image
      });

      doc.font('Times-Roman').fontSize(14);
      doc.info.Title = `Salary Slip for ${results[0].emp_name}`;
      // doc.text(`Pay Date: ${payDate}`).moveDown();
      doc.moveDown(8)

      // Define the positions for each column in the table
      const col1X = 60;
      const col2X = 230;
      const col3X = 300;
      const col4X = 450;

      doc.fontSize(13).text(`Employee Name:- ${results[0].emp_name}`, x = col1X - 10).moveDown(0.5);
      doc.fontSize(13).text(`Designation:- ${results[0].emp_designation}`).moveDown(0.5);
      doc.fontSize(13).text(`Month & Year:- ${payDate}`).moveDown(1);

      // Define the height and vertical position of the table
      const tableHeight = 6 * 20; // 7 rows of height 20
      const tableY = (pageHeight - tableHeight) / 3.2;

      // Add the column headers
      doc.fontSize(12).text('Earnings', col1X, tableY);
      doc.fontSize(12).text('Amount', col2X, tableY);
      doc.fontSize(12).text('Deduction', col3X, tableY);
      doc.fontSize(12).text('Amount', col4X, tableY);

      // Add the rows for the table
      doc.fontSize(12).text('Basic Pay', col1X, tableY + 47);
      doc.fontSize(12).text(`${basicPay}`, col2X, tableY + 47);
      doc.fontSize(12).text('PF', col3X, tableY + 47);
      doc.fontSize(12).text(`${pf}`, col4X, tableY + 47);

      doc.fontSize(12).text('House Rental Allowance', col1X, tableY + 70);
      doc.fontSize(12).text(`${hra}`, col2X, tableY + 70);
      doc.fontSize(12).text('ESI', col3X, tableY + 70);
      doc.fontSize(12).text(`${ESI}`, col4X, tableY + 70);

      doc.fontSize(12).text('Other Allowances', col1X, tableY + 90);
      doc.fontSize(12).text(`${others}`, col2X, tableY + 90);
      doc.fontSize(12).text('PT', col3X, tableY + 90).moveDown(0.5);
      doc.fontSize(12).text(`${PT}`, col4X, tableY + 90);
      doc.fontSize(12).text('IT', col3X, tableY + 110);
      doc.fontSize(12).text(`${IT}`, col4X, tableY + 110);

      doc.fontSize(12).text('Gross Earning', col1X, tableY + 130);
      doc.fontSize(12).text(`${totalSalaryPayOut}`, col2X, tableY + 130);

      doc.fontSize(12).text('Gross Deduction', col3X, tableY + 130);
      doc.fontSize(12).text(`${Gross_Deduction}`, col4X, tableY + 130);

      doc.fontSize(12).text('Net Take Home', col1X, tableY + 170);
      doc.fontSize(12).text(`Rs. ${net_take_home} (${net_take_home_words})`, col2X, tableY + 170);

      doc.fontSize(12).text('Company Contribution PF', col1X, tableY + 215);
      doc.fontSize(12).text(`Rs. ${Company_Contribution_PF}`, col2X, tableY + 215);

      doc.fontSize(12).text('Company Contribution ESI', col1X, tableY + 250);
      doc.fontSize(12).text(`Rs. ${Company_Contribution_ESI}`, col2X, tableY + 250);

      doc.fontSize(12).text('Gross CTC', col1X, tableY + 285);
      doc.fontSize(12).text(`Rs. ${gross_ctc}`, col2X, tableY + 285);


      // Set the border of the table
      doc.rect(50, 220, 500, 320).lineWidth(1).stroke();

      // Add vertical lines inside the table
      doc.lineCap('butt').moveTo(220, 220).lineTo(220, 541).stroke();
      doc.lineCap('butt').moveTo(295, 220).lineTo(295, 382).stroke();
      doc.lineCap('butt').moveTo(395, 220).lineTo(395, 382).stroke();

      // Add horizontal lines inside the table
      doc.lineCap('butt').moveTo(50, 260).lineTo(550, 260).stroke();
      doc.lineCap('butt').moveTo(50, 350).lineTo(550, 350).stroke();
      doc.lineCap('butt').moveTo(50, 381).lineTo(550, 381).stroke();
      doc.lineCap('butt').moveTo(50, 420).lineTo(550, 420).stroke();
      doc.lineCap('butt').moveTo(50, 460).lineTo(550, 460).stroke();
      doc.lineCap('butt').moveTo(50, 495).lineTo(550, 495).stroke();

      doc.text(`THIS IS A SYSTEM GENERATED PAYSLIP, DOES NOT REQUIRE ANY SIGNATURE
  AND/OR COMPANY SEAL.`, col1X, tableY + 370);

      doc.moveDown(8.3);
      const y = doc.page.height;
      const centerX = doc.page.width / 2;

      const bottomline1 = 'Engineer Philosopphy Web Services Private Limited';
      const bottomline2 = 'Regd. Office Address: 205, Atulya IT Park, Khandwa Rd, Indore, Madhya Pradesh 452001';
      const bottomline3 = 'CIN No. (U72400MP2015PTC034479)';
      const bottomline1Width = doc.widthOfString(bottomline1);
      const bottomline2Width = doc.widthOfString(bottomline2);
      const bottomline3Width = doc.widthOfString(bottomline3);

      // Add the footer lines
      doc.fontSize(12).text(bottomline1, { align: 'center', y: y - 25, x: centerX - (bottomline1Width / 2) });
      doc.fontSize(9).text(bottomline2, { align: 'center', y: y - 12, x: centerX - (bottomline2Width / 2) });
      doc.fontSize(9).text(bottomline3, { align: 'center', y: y, x: centerX - (bottomline3Width / 2) });

      // Deepak (13/03/2023) ending PDF document
      doc.end();

      // Deepak (13/03/2023) sending response to client side
      fileStream.on('error', () => {
        res.status(404).send('File not found');
      });
      fileStream.on('open', () => {
        res.status(200)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
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

function convert(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];
  const numWords = [];

  if (num === 0) {
    return 'Zero Rupees';
  }

  if (num < 0) {
    numWords.push('Minus');
    num = Math.abs(num);
  }

  let scaleCounter = 0;

  while (num > 0) {
    const lastThreeDigits = num % 1000;
    let lastThreeDigitsWord = '';
    if (lastThreeDigits < 10) {
      lastThreeDigitsWord = ones[lastThreeDigits];
    } else if (lastThreeDigits < 20) {
      lastThreeDigitsWord = ones[lastThreeDigits % 10] + 'teen';
    } else if (lastThreeDigits < 100) {
      lastThreeDigitsWord = tens[Math.floor(lastThreeDigits / 10)] + ones[lastThreeDigits % 10];
    } else {
      lastThreeDigitsWord = ones[Math.floor(lastThreeDigits / 100)] + 'Hundred' + tens[Math.floor((lastThreeDigits % 100) / 10)] + ones[lastThreeDigits % 10];
    }

    if (lastThreeDigitsWord !== '') {
      numWords.push(lastThreeDigitsWord + scales[scaleCounter]);
    }

    num = Math.floor(num / 1000);
    scaleCounter++;
  }

  numWords.reverse();
  return 'Rs. ' + numWords.join(' ') + ' Only';
}

module.exports = { getTableListDataofEmployee }