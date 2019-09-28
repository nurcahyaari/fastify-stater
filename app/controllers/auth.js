const auth = require('../../config/auth/auth');

module.exports = {
    login : (req, res) => {
        auth.init()
        let token = auth.generateToken(1, 'admin');

        res.send(token);
    },
    refreshToken : (req, res) => {
        auth.init()
        const {refreshToken} = req.body;
        let token = auth.refreshToken(refreshToken);
        res.send(token);
    }
}