const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const DIR_PATH = "./tmp/token.json";
class Auth {
    
    init(exp = 8){
        this.exp = exp;
    }

    getPrivateKey(){
        return fs.readFileSync(`${__dirname}/app.rsa`); //openssl genrsa -out app.rsa 2048
    }

    getPublicKey(){
        return fs.readFileSync(`${__dirname}/app.rsa.pub`); //openssl rsa -in app.rsa -pubout > app.rsa.pub
    }

    async saveToLocal(token) {
        let dirPath = path.dirname(DIR_PATH);
        if(fs.existsSync(DIR_PATH)){
            let val = fs.readFileSync(DIR_PATH, {encoding : "utf8"});
            val = JSON.parse(val);
            val.push({
                token : token,
                used : 0
            })  
            fs.writeFile(DIR_PATH, JSON.stringify(val), () => {});
        }
        else {
            console.log("blm ada");
            let val = new Array()
            val.push({
                token : token,
                used : 0
            });
            fs.mkdirSync(dirPath, {recursive : true});
            fs.writeFile(DIR_PATH, JSON.stringify(val), () => {});
        }
        
    }

    generateToken(userId, userType){
        let curdate = new Date().getTime();
        let tokenExpired = curdate + (this.exp * (60 * 1000));
        const token = jwt.sign({
            "exp":    tokenExpired,
            "iat":    curdate,
            "sub":    userId,
            "status": userType,
        }, this.getPrivateKey());
        let refreshTokenExpired = curdate + (30 * (24 * 60 * 60 * 1000));
        const refreshToken = jwt.sign({
            "exp": refreshTokenExpired,
            "iat" : curdate,
            "sub" : userId,
            "status": userType,
        }, this.getPrivateKey())
        const tokenResponse = {
            token : token,
            refreshToken : refreshToken
        }

        this.saveToLocal(refreshToken);

        return tokenResponse;

    }

    refreshToken(refreshToken){
        let val = fs.readFileSync(DIR_PATH, {encoding : "utf8"});
        val = JSON.parse(val);
        let foundedToken = false;
        let tokenHasUsed = false;
        let tokenFound;
        let used = 0;
        for(let v in val){
            // let token = jwt.verify(val[v].token, this.getPrivateKey());
            if(val[v].token === refreshToken){
                foundedToken = true;
                if(val[v].used === 0){
                    tokenHasUsed = true;
                    used = 1;
                    tokenFound = jwt.verify(val[v].token, this.getPrivateKey());
                }
            }
        }
        if(!foundedToken) {
            return {
                msg : "TOKEN_NOT_FOUND"
            };
        }
        if(!tokenHasUsed){
            return {
                msg : "TOKEN_HAS_USED"
            };
        }
        let val = fs.readFileSync(DIR_PATH, {encoding : "utf8"});
        val = JSON.parse(val);
        for(let v in val){
            if(val[v].token === refreshToken){
                val[v].used = 1;
            }
        }
        fs.writeFileSync(DIR_PATH, JSON.stringify(val), () => {});
        return this.generateToken(tokenFound.sub, tokenFound.status);
    }
}

module.exports = new Auth(); 