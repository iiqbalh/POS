const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
    generatePassword: (password) => bcrypt.hashSync(password, saltRounds),
    isLoggedIn: function (req, res, next) {
        if (req.session.user) {
            next()
        } else {
            res.redirect('/')
        }
    },
    RpInd: function (amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}