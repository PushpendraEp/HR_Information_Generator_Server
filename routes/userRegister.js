connection = require('../db/connection')
jwt = require('jsonwebtoken');
bcrypt = require('bcrypt');

/*
   @ Shubham (17/02/2023) 
   RegisterUser function created for userRegister
   Requiments      :- id, First_name, last_name, Email, password, passwordconfirm
   expected result :- res.status(200).send({ message: "User successfull Register",
                      token:token will genrate automatic})
   Faild resule    :- res.status(400).send({ message: "please entern email and password", error_code: "error code" })
*/

//  @ Shubham (17/02/2023) This function is For the User Regiastration 
const registerUser = async (req, res) => {
    const { id, First_name, last_name, email, password, passwordconfirm } = req.body


    var query = `select * from user where Email='${email}'`;
    connection.query(query, async (error, result) => {
        if (error) {
            res.status(400).send({
                message: "Query Syntax Error in Email checking ",
                error_code: "#1 You have entered Wrong Query For Checking User is registered or not", status: false, send: error
            })
        }
        else {
            if (result && result.length > 0) {
                res.status(400).send({ message: "User already registerd", error_code: "#2 Email is already registered", status: false })
            }
            else {

                // If entered password Does not Match this filed will execute
                if (password !== passwordconfirm) {
                    res.status(400).send({ message: "Password doesn't Mached", error_code: "#3 You have Entered Wrong password", status: false })
                }
                else {

                    // @ Shubham (17/02/2023) bcrypt.hash will incript your code as un readable formate 
                    let hashpassword = await bcrypt.hash(password, 8);
                    var query = `insert into user values('${id}','${First_name}','${last_name}','${email}','${hashpassword}')`
                    connection.query(query, (error, result) => {
                        if (error) {
                            res.status(400).send({
                                message: "Query Syntax Error in Registertion",
                                error_code: "#4 You have entered Wrong Query For user registration", status: false, send: error
                            })

                        } else {

                            // @ Shubham (17/02/2023) JWT is used for authontication it always genrate a unique token for authorized user
                            const token = jwt.sign({ email: email, }, "admintoken", { expiresIn: '1h' });
                            res.status(200).send({
                                message: "User successfull Register", status: true,
                                token: token
                            })
                        }
                    })
                }
            }
        }
    })
}
module.exports = { registerUser }
