const express = require('express'),
  router = express.Router(),
  uploadFlie = require('./upload'),
  logIn = require('./logIn'),
  payslipGenerator=require('./payslip_generator'),
  register = require('./userRegister'),
  getOtp=require('./resetPassword')
  verifyToken = require('./verifyToken');

//@ Pushpendra ( 25/02/23 ) Initialize first route
router.get('/', (req, res) => {
  res.status(200).send('Cool');
});

// @ Deepak (16/02/2023)
// Created this route for upload excel file 

router.post('/uploadFile', verifyToken, (req, res) => {
  uploadFlie.uploadExcel(req, res);
});

//@ Deepak ( 01/03/23 ) Initialize get route to get all tables list
router.get('/getEmployeeData', verifyToken, (req, res) => {
  uploadFlie.getEmpTableData(req,res);
});

//@ Deepak ( 03/03/23 ) Initialize get route to get selected table data
// router.get('/getEmployeeData', (req, res) => {
//   uploadFlie.getEmpTableData(req,res);
// });

//@ Deepak ( 09/03/23 ) Initialize get route to get user details
router.get('/User', verifyToken, async (req, res) => {
  logIn.getUserDetails(req,res);
});

//@ Deepak ( 09/03/23 ) Initialize get route to get employee data
router.get('/payslip', verifyToken, async (req, res) => {
  payslipGenerator.getTableListDataofEmployee(req,res);
});

//@ Deepak ( 13/03/23 ) Initialize get route to get employee data
router.put('/updateUser', verifyToken, async (req, res) => {
  logIn.updateUserDetails(req,res);
});

//@ Deepak ( 07/03/23 ) Initialize get route to get selected table data
// router.get('/getUserDetails', (req, res) => {
//   logIn.getUserDetails(req,res);
// });

router.post('/loginUser', (req, res) => {
  logIn.loginFile(req, res);
});

router.post('/registerUser', (req, res) => {
  register.registerUser(req, res);
});

router.post('/getOtp',(req, res)=>{
   getOtp.getUserOtp(req, res)
})

router.post('/verify-otp', (req, res) => {
  getOtp.verifyOtp(req,res);
});

router.post('/reset-password', (req, res) => {
  getOtp.resetPassword(req, res)
})

module.exports = router;
