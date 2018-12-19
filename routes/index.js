var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});
router.get('/get-online-status', function (req, res) {
    res.send({status : true});
});
module.exports = router;
