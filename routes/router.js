const express = require('express'),
  router = express.Router(),
  connection = require('../db/connection'),
  uploadFlie = require('./upload'),
  // getTable=require('./getTable')
  logIn = require('./logIn'),
  register = require('./userRegister'),
  { verifyToken } = require('./verifyToken');

//@ Pushpendra ( 25/02/23 ) Initialize first route
router.get('/', (req, res) => {
  res.status(200).send('Cool');
});

// @ Deepak (16/02/2023)
// Created this route for upload excel file 

router.post('/uploadFile', (req, res) => {
  uploadFlie.uploadExcel(req, res);
});

//@ Deepak ( 01/03/23 ) Initialize get route to get all tables list
router.get('/', (req, res) => {
  uploadFlie.getTableList(req,res);
});

router.post('/loginUser', (req, res) => {
  logIn.loginFile(req, res);
});

router.post('/registerUser', (req, res) => {
  register.registerUser(req, res);
});

module.exports = router;
