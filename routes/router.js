const express = require('express'),
    router = express.Router(),
    connection = require('../db/connection');

//@ Pushpendra ( 25/02/23 ) Initialize first route
router.get('/', (req, res) => {
    res.status(200).send('Cool');
});

module.exports = router;