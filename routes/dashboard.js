const express = require('express');
const router = express.Router();
const HELPER = require('../events/event_helper');
const fs = require('fs');
const jsonfile = require('jsonfile');
const BOT_INPUT = require('../helper/bot_input');

/* GET home page. */
router.get('/', (req, res, next)=> {
    const SignalDetails = JSON.parse(fs.readFileSync("./config/signal_details.json"));
    console.log(SignalDetails);
    res.render('./dashboard/home', {"signal_details" : JSON.stringify(SignalDetails)});
});

/* GET history page. */
router.get('/history', (req, res, next)=> {
    HELPER.getAllSessions((session_result)=>{
        res.render('./dashboard/history', {sessions :JSON.stringify(session_result)});
    });
});

router.post('/get-history', (req, res, next)=>{
    let body = req.body;
    let session_identifier = body['session_id'];
    HELPER.getChats(session_identifier, (result)=> {
        res.json(result);
    });
});

router.post('/update-signal-details', (req, res, next)=> {
    let content = req.body;
    console.log("Inside update signal details api : ",content);
    let signal_name = content['signal_name'];
    let username = content['username'];
    let password = content['password'];

    BOT_INPUT.getUserAuthToken(username, password, (error, token)=>{
        let response = {'status': false,"message" : "" };
        if(!error && token) {
            BOT_INPUT.getSignalData(signal_name, token, (signal_error, data)=>{
                if(signal_error){
                    response['message'] = "Not a valid Signal name";
                    res.send(response);
                }
                else{
                    jsonfile.writeFile('./config/signal_details.json', content, {"spaces": 4}, (error) => {
                        console.log(error);
                        response['status'] = !error;
                        response['message'] = "Signal details updated";
                        res.send(response);
                    });
                }
            });
        }
        else{
            response['message'] = "Invalid username or password details";
            res.send(response);
        }
    });
});
module.exports = router;
