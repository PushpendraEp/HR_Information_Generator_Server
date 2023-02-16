const express = require('express'),
    router = express.Router(),
    connection = require('../db/connection'),
    uploadFile=require('./upload')

//@ Pushpendra ( 25/02/23 ) Initialize first route
router.get('/', (req, res) => {
    res.status(200).send('Cool');
});


// @ Deepak (16/02/2023) 
// Created this route for upload excel file

router.post('/uploadFile',(req,res)=>{
   uploadFile.uploadExcel(req, res);
});

module.exports = router;