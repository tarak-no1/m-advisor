const request = require("request");
const BaseURL =  'https://api.wit.ai';

module.exports = (function () {
    const WIT_TOKEN = "P224E3I32SP4Q5HRZ5RXGKRQ5IAQRFJE";
    const headers = {
        'Authorization': 'Bearer ' + WIT_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    const getOptions = (qs)=>{
        return {
            method: 'GET',
            url: BaseURL + '/message?' + qs,
            headers: headers
        }
    };
    let wit_api_functions = {
        witMessageAPI : (message, cb)=>{
            let qs = 'q=' + encodeURIComponent(message);
            request(getOptions(qs), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let data = JSON.parse(body);
                    cb(data["entities"]);
                }
                else{
                    console.log(error,"error occurred");
                    cb({});
                }
            });
        }
    };
    return wit_api_functions;
})();