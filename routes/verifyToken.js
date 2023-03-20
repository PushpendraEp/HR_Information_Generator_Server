
/*
   @ Shubham (17/02/2023) 
   verifyToken function created for verify the User Token
   expected result:- Success- res.status(200).json({ message: 'Valid Token', status: true });
*/

function verifyToken(req, res, next) {
    const token = req.headers.authorization
    // console.log(token);

    //  @ Shubham (17/02/2023) if you didn`t send any token this if part will execute
    if (!token) {
        res.status(401).json({ message: "didn't send any token", error_code: "#21 Plase enter token", status: false });
    } else {
        let token1 = token.split(' ')
        let filantoken = token1[1]
        // console.log(filantoken)

        //  @ Shubham (17/02/2023) this part will verfy your token is valid or not
        jwt.verify(filantoken, "admintoken", (error, decoded) => {
            if (error) {
                res.status(401).json({ message: 'Access denied', error_code: "#22 Invalid token You enter", status: false });
            } else {
                req.user = decoded;
                // console.log(decoded)
                next();
            }
        });
    }
}

module.exports = verifyToken;
