const connection = require('../db/connection'),
    jwt = require('jsonwebtoken'),
    body_parser = require('body-parser'),
    bcrypt = require('bcrypt');
const express = require('express');
const app = express();

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

/*
   @ Shubham (17/02/2023) 
   Login File function created for user log-in
   Requiments:- Email, password
   expected result:- Success :- res.status(200).send({
                                message: "log in successfull", status: true,
                                token: token will genrate automatic})
                        
                        Fail :- res.status(400).send({message: "Failed Message", error_code: "Error Code"}) 
*/

const loginFile = (req, res) => {
    const { Email, Password } = req.body
    const user_Email = Email
    const user_pass = Password

    //  @ Shubham (17/02/2023) if user_Email and user_pass have value then this function will execute
    if (user_Email && user_pass) {
        var query = `select * from user where Email='${user_Email}'`;
        connection.query(query, function (error, data) {
            let user = data[0]
            if (error) {
                res.status(400).send({
                    message: "Query Syntax Error For log in Email ",
                    error_code: "#11 You have entered Wrong Query For Checking in user log in", status: false, send: error
                })
            } else {
                // console.log(data);


                //  @ Shubham (17/02/2023) if Query Data length greater than 0 it means user is already exist 
                if (data && data.length > 0) {
                    // for (var count = 0; count < data.length; count++) {

                    //  @ Shubham (17/02/2023) bcrypt.compareSync it first decript our data and compare with second parameter
                    if (bcrypt.compareSync(user_pass, user.password)) {

                        // @ Deepak  (09/03/2023) sending user details of uers password and user email with JWT Token
                        const userDetails = {
                            user_Email: user.Email,
                            user_pass: user.password
                        };
                        // @ Shubham (17/02/2023) JWT is used for authontication it always genrate a unique token for authorized user
                        const token = jwt.sign(
                            userDetails, "admintoken", { expiresIn: '5h' });

                        res.status(200).json({
                            message: "log in successfull", status: true, token: token
                        })

                    } else {
                        res.status(400).send({ message: "incorrect Password", error_code: "#12 error in geting data", status: false })
                        // }
                    }
                } else {
                    res.status(400).send({ message: "Incorrect email", error_code: "#13 you have Enteredn incorect email", status: false })
                }
                // res.end()
            }

        })

    } else {
        res.status(400).send({ message: "please entern email and password", error_code: "#14 Email and password Must fill", status: false })
    }
}

// @ Deepak (09/03/2023) created a function to sending user details of selected user email
//                       Getting token from client and parsed email from 

function getUserDetails(req, res) {
    const token = req.query.token;
    // console.log(token);

    // @ Deepak (13/03/2023) varify token if token is wrong throw an error or else decode toekn and get user email 
    jwt.verify(token, 'admintoken', (error, decoded) => {
        if (error) {
            console.error(error);
            res.status(400).send({
                message: "cannot get selected table data of selected emp_id",
                error_code: "#5014 error in geting tables data",
                status: false
            });
        } else {
            const userEmail = decoded.user_Email;
            // console.log(userEmail);

            // @ Deepak (13/03/2023) select user from table by using useremail
            const sql = `SELECT First_name, last_name,Email,gender,mobile_no,DOB FROM user WHERE Email = '${userEmail}'`;

            connection.query(sql, (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(400).send({
                        message: "cannot get user table data of selected email",
                        error_code: "#5015 error in geting user data",
                        status: false
                    });
                } else {
                    // console.log(results);
                    res.status(200).send({ results, status:true });
                }

            });
        }
    });
}

// @ Deepak (16/03/2023) created a function to update user details of selected user id

function updateUserDetails(req, res) {

    const First_name = req.body[0].First_name;
    const last_name = req.body[0].last_name;
    const Email = req.body[0].Email;
    const gender = req.body[0].gender;
    const mobile_no = req.body[0].mobile_no;
    const DOB = req.body[0].DOB;

    // @ Deepak (13/03/2023) select user from table by using userid and update user data 
    const sql = `UPDATE user SET First_name=?, last_name=?,Email=?,gender=?, mobile_no=?,  DOB=? WHERE Email='${Email}'`;

    connection.query(sql, [First_name, last_name, Email, gender, mobile_no, DOB], (error, results) => {
        if (error) {
            console.error(error);
            res.status(400).send({
                message: "user data from table is not updated",
                error_code: "#5016 error in updateding user data",
                status: false
            });
        } else {
            // console.log(results);
            res.status(200).send({ results, status:true, message:"User Data Updated" });
        }

    });
}


module.exports = {
    loginFile,
    getUserDetails,
    updateUserDetails
}
