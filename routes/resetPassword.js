const express = require('express');
dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();

function getUserOtp(req, res) {

    const email = req.body.email;
    // var query = `select Email from user`;
    connection.query('SELECT * FROM user WHERE email = ?', [email], (error, result) => {
        if (error) {
            console.error(error);
            res.status(400).send({
                message: "Query Error",
                error_code: "#4 You have entered Wrong Query", status: false, send: error
            })

        } else {
            // const getEmail = result[0].Email
            if (result.length > 0) {

                const otp = otpGenerator.generate(6, { upperCaseAlphabets: false,lowerCaseAlphabets: false, specialChars: false });

                // var query = `insert into users_otp (email, otp) values('${email}','${otp}')`;
                var query = `update user SET otp ='${otp}' where Email='${email}'`;
                connection.query(query, (error, result) => {
                    // global.otpCode = otp;
                    if (error) {
                        console.error(error);
                        res.status(400).send({
                            message: "Query Syntax Error in Inserting OTP",
                            error_code: "#4 You have entered Wrong Query For Inserting OTP", status: false, send: error
                        })

                    } else {
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.EMAIL,
                                pass: process.env.PASSWORD
                            },
                        from:process.env.EMAIL

                            //   ,
                            //   dkim: {
                            //     domainName: 'deepakbirla.com',
                            //     keySelector: '4557.deepak.',
                            //     privateKey:`MIICXgIBAAKBgQDPIwfD4wV1bgjFgFdN2SkqXqqJLHjrC+RPJuqhPaa9mdwKlf1v
                            //     iltQQiS+SDfRHhJqyriEto2VKaDSVZo6Z8p30+caCJzykHZB+ExKroSAzkZW0+WD
                            //     D3P4YfP3HMqQRD5scsfERKbx4xdwMnMur/gVvn8rspcSJhaEFG5nZIfalQIDAQAB
                            //     AoGBAM6qeNjs7UlY28+SWYkGnpfzk9sBUDPTzZtbjMYLqQ2LMYwuUoqzVKAjHl3r
                            //     2CUBCAcc9DUVnvWwbxDs79BONibE741hUgr/AuROtDSp0IrjKsx5G34J7P9XcUcT
                            //     WLUl6tq57aKYKha9V4H2klti5kDeWLdDYhqXwL+ZDWcwrcgRAkEA47zm2iQc47cM
                            //     opAGo/A5PNMFr9+UHs3fr9rqT9SRP5sexoVouhT23bumjEuthbS51R1kwrMkbmGn
                            //     VGV+aKyhcwJBAOjXpSN7DqSgoFX/58c4IZfJSzSvmeIOn9vMigy/FsfAGa1qqlJQ
                            //     xmuEmfB+KU42gLYOhTHIp/mHkze5Gpp18dcCQQDcF88fWTFWXaznWrwgKeSXRPXF
                            //     EBWNY7ffs3kpp6ysRRUMFRiuZd5jUpxWEDll89B5B0w+4nS9/MCDTwdI0DXDAkEA
                            //     sX04d6xlRB7hOc0hvB3QlaiuuFGnRseJGf53uTGsxsVrjWLCxI6oQetJgSZajDFF
                            //     ugGljIZ9bNvo39AtNFL17wJAD9QfqJ2GVs5XA9kMvUr6eut+9G+ED5bJaHLTgvqX
                            //     U6+Vc03ZR5ztPjGXsU5+DC2jBzTdxwFXFMGlNGVezlIy8w==
                            //     `
                            //   }


                        });

                        const mailOptions = {
                            from: `'Deepak Birla'<process.env.EMAIL>`,
                            to: email,
                            subject: 'Password Reset OTP',
                            text: `You recently requested to reset your password on our platform. Please use the following OTP code to verify your identity ${otp}`,
                            html:'<p>DO not Share</p>'
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);
                                res.status(500).send('Failed to send OTP code');
                            } else {
                                console.log('Email sent: ' + info.response);
                                res.status(200).send('OTP code sent successfully');
                            }
                        });
                    }
                })
            }
            else{
                res.status(500).send('Email is incorrect');
            }
        }
    })
}

function verifyOtp(req, res) {
    // const email = req.body.email; 
    const email = 'birla340@gmail.com'
    const enteredOtp = req.body.otp;

    var query = `select otp from user WHERE email = '${email}'`;
    connection.query(query, (error, result) => {
        if (error) {
            console.error(error);
            res.status(400).send({
                message: "Query Error",
                error_code: "#4 You have entered Wrong Query", status: false, send: error
            })

        } else {
            const otp = result[0].otp;
            if (otp === enteredOtp) {
                res.status(200).send('OTP code verified successfully');
            } else {
                res.status(400).send('Invalid OTP code');
            }
        }

    })



}

const resetPassword = async (req, res) => {

    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const confPassword = req.body.confirmPassword

    // @ Deepak (11/05/2023) If entered password Does not Match this filed will execute
    if (newPassword !== confPassword) {
        res.status(400).send({ message: "Password doesn't Mached", error_code: "#3 You have Entered Wrong password", status: false })
    }
    else {

        // @ Deepak (11/05/2023) bcrypt.hash will incript your code as un readable formate 
        let hashpassword = await bcrypt.hash(newPassword, 8);
        // var query = `insert into user values('${id}','${First_name}','${last_name}','${email}','${gender}','${mobile_no}','${DOB}','${hashpassword}')`;
        const query = `UPDATE user SET password = '${hashpassword}' WHERE Email = '${email}'`;
        connection.query(query, (error, result) => {
            if (error) {
                console.error(error);
                res.status(400).send({
                    message: "Query Syntax Error in Password Updation",
                    error_code: "#4 You have entered Wrong Query For password reset", status: false, send: error
                })

            } else {
                res.status(200).send({
                    message: "User Password successfully Changed", status: true,
                })
            }
        })
    }
}

module.exports = {
    getUserOtp,
    verifyOtp,
    resetPassword
};