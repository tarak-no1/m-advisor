module.exports = (io)=> {
    const fs = require('fs');
    const express = require('express');
    const router = express.Router();
    const BOT = require('../bots/m-advisor-bot');
    const SESSIONS = require('../helper/sessions');
    const SOCKETS = require('../helper/sockets-io');
    const EVENTS = require('../events/storing');
    const BOT_INPUT = require('../helper/bot_input');

    let getSignalDetails = (callback)=> {
        const SignalDetails = JSON.parse(fs.readFileSync("./config/signal_details.json"));
        let username = SignalDetails['username'];
        let password = SignalDetails['password'];
        BOT_INPUT.getUserAuthToken(username, password, (error, token)=> {
            SignalDetails['auth_token'] = token;
            callback(SignalDetails);
        });
    };

    // starting the socket connection
    io.on('connection', (socket) => {
        console.log("New User Connected");
        /*
        * this channel will emit, when user opens the app
        */
        socket.on('add_user', (data)=>{
            data = JSON.parse(data);
            console.log(JSON.stringify(data, null, 2));
            let session_id = data['device_id'];

            //storing user socket details
            SOCKETS.storeSocket(session_id, socket);

            EVENTS.getUserContextFromDb(session_id, (db_context_status, user_context)=>{
                getSignalDetails((signal_details)=>{
                    user_context['signal_name'] = signal_details['signal_name'];
                    user_context['auth_token'] = signal_details['auth_token'];
                    if(db_context_status)
                        user_context['chat_id']++;
                    SESSIONS.storeContext(session_id, user_context);
                    BOT.welcomeMessage(session_id);
                });
            });
        });

        socket.on('reset', (data)=> {
            data = JSON.parse(data);
            let session_id = data['device_id'];

            SOCKETS.storeSocket(session_id, socket);
        });

        /*
        * this channel will emit, when user sends any typed message
        */
        socket.on('user_message', (data)=> {
            data = JSON.parse(data);
            console.log("Received User Message : ");
            console.log(JSON.stringify(data, null, 2));
            let session_id = data['device_id'];
            let message = data['message'];

            //storing user socket details
            SOCKETS.storeSocket(session_id, socket);

            EVENTS.getUserContextFromDb(session_id, (db_context_status, user_context)=> {
                getSignalDetails((signal_details)=> {
                    user_context['signal_name'] = signal_details['signal_name'];
                    user_context['auth_token'] = signal_details['auth_token'];
                    // ==================== Storing User Event ===================
                    let user_event = {
                        "type": "user_typed_message",
                        "session_id": session_id,
                        "message": data['message'],
                        "chat_id": user_context['chat_id'],
                        "time": new Date().getTime()
                    };
                    EVENTS.storeMessageEvent(user_event);
                    //=============================================================
                    SESSIONS.storeContext(session_id, user_context);
                    // processing the user message
                    BOT.processUserMessage(session_id, message);
                });
            });
        });
    });
    return router;
};