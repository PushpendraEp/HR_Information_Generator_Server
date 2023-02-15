// @ Pushpendra ( 15/02/23 )
// Initialize express project
const express = require('express'),
    cors = require('cors'),
    body_parser = require('body-parser'),
    router = require('./routes/router'),
    app = express();

app.use(cors());
app.use(body_parser.json());
app.use(router);

app.listen(process.env.port, () => {
    console.log(`Your Server Is Running On: https://localhost:${process.env.port}`);
});