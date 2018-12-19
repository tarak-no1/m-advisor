module.exports = (function() {
    let MYSQL = require("../config/mysql-queries");
    let SESSIONS = require("../helper/sessions");

    let getSessionIdentifier = (event_data, callback)=> {
        let session_id = event_data['session_id'];
        let event_time = event_data.hasOwnProperty('time') ? event_data['time'] : new Date().getTime();
        let session_details_query = "select * from sessions where session_id='"+session_id+"';";
        MYSQL.sqlQuery('m_advisor_bot', session_details_query, (session_details)=> {
            if(session_details.length==0) {
                let insert_session_details = "insert into sessions(session_id, user_context, timestamp)values('"+session_id+"','{}', '"+event_time+"');";
                MYSQL.sqlQuery('m_advisor_bot', insert_session_details, (insert_details)=> {
                    MYSQL.sqlQuery('m_advisor_bot', session_details_query, (session_details)=> {
                        let session_identifier = session_details[0]['id'];
                        callback(session_identifier);
                    });
                });
            } else {
                let session_identifier = session_details[0]['id'];
                callback(session_identifier);
            }
        });
    };
    let getChatIdentifier = (session_identifier, chat_id, callback)=> {
        let event_time = new Date().getTime();
        let chat_details_query = "select * from chats where session_identifier='"+session_identifier+"' and chat_id='"+chat_id+"';";
        MYSQL.sqlQuery('m_advisor_bot', chat_details_query, (chat_details)=> {
            if(chat_details.length==0) {
                let insert_chat_details = "insert into chats(session_identifier, chat_id, timestamp) values('"+session_identifier+"','"+chat_id+"','"+event_time+"');";
                MYSQL.sqlQuery('m_advisor_bot', insert_chat_details, (insert_result)=> {
                    MYSQL.sqlQuery('m_advisor_bot', chat_details_query, (chat_details)=>{
                        let chat_identifier = chat_details[0]['id'];
                        callback(chat_identifier);
                    });
                });
            }
            else {
                let chat_identifier = chat_details[0]['id'];
                callback(chat_identifier);
            }
        });
    };
    let storeMessageDetails = (chat_identifier, sender, message_type, message, time)=>{
        let event_time = time!=undefined ? time: new Date().getTime();
        let insert_message_query = "insert into messages(chat_identifier, sender, message_type, message, version, timestamp) values('"+chat_identifier+"','"+sender+"','"+message_type+"','"+message+"', '1', '"+event_time+"');";
        MYSQL.sqlQuery('m_advisor_bot', insert_message_query, (insert_result)=>{
        });
    };
    let helper_functions = {
        storeTextMessage : (event_data)=> {
            let session_id = event_data['session_id'];
            let message = event_data['message'];
            try {
                message = message.split("'").join('');
            }catch (e) {}
            let chat_id = event_data['chat_id'];
            getSessionIdentifier(event_data,(session_identifier)=>{
                getChatIdentifier(session_identifier, chat_id, (chat_identifier)=> {
                    storeMessageDetails(chat_identifier, 'bot', 'text', message, event_data['time']);
                });
            });
        },
        storeUserTypedMessage : (event_data)=> {
            let session_id = event_data['session_id'];
            let message = event_data['message'];
            try {
                message = message.split("'").join('');
            }catch (e) {}
            let chat_id = event_data['chat_id'];
            getSessionIdentifier(event_data,(session_identifier)=>{
                getChatIdentifier(session_identifier, chat_id, (chat_identifier)=> {
                    storeMessageDetails(chat_identifier, 'user', 'user_typed_message', message, event_data['time']);
                });
            });
        },
        storeSingleSelectMessage : (event_data)=> {
            let session_id = event_data['session_id'];
            let message = event_data['text'];
            try {
                message = message.split("'").join('');
            }catch (e) {}
            let chat_id = event_data['chat_id'];
            getSessionIdentifier(event_data,(session_identifier)=>{
                getChatIdentifier(session_identifier, chat_id, (chat_identifier)=> {
                    storeMessageDetails(chat_identifier, 'bot', 'single_select', message, event_data['time']);
                });
            });
        },
        storeUserContext : (session_id, user_context)=>{
            let update_context_query = "update sessions set user_context='"+JSON.stringify(user_context)+"' where session_id='"+session_id+"';";
            MYSQL.sqlQuery('m_advisor_bot', update_context_query, (update_result)=>{
                console.log('user context updated');
            });
        },

        getAllSessions : (callback)=> {
            let all_sessions_query = "select sessions.id, sessions.session_id, messages.timestamp from sessions inner join chats on chats.session_identifier=sessions.id inner join messages on chats.id = messages.chat_identifier order by messages.timestamp desc;";
            MYSQL.sqlQuery('m_advisor_bot', all_sessions_query, (session_details)=> {
                try{
                    let sessions = [];
                    session_details = session_details.filter((data)=> {
                        let status = false;
                        if(sessions.indexOf(data['id'])==-1) {
                            sessions.push(data['id']);
                            status = true;
                        }
                        return status;
                    });
                    session_details = session_details.sort((a, b)=>{
                       return b['timestamp'] - a['timestamp'];
                    });
                }catch(e){console.log(e);}
                callback(session_details);
            });
        },
        getChats : (session_identifier, callback)=> {
            let all_sessions_query = "select chats.id as identifier, chats.chat_id, messages.message_type, messages.message, messages.timestamp, messages.sender from chats inner join messages on chats.id = messages.chat_identifier where chats.session_identifier = "+session_identifier+";";
            MYSQL.sqlQuery('m_advisor_bot', all_sessions_query, (chat_details)=> {
                let chat_obj = {};
                chat_details.forEach((chat)=> {
                    let chat_id = chat.chat_id;
                    let message_type = chat.message_type;
                    let message = chat.message;
                    let timestamp = chat.timestamp;
                    let sender = chat.sender;

                    if(!chat_obj.hasOwnProperty(chat_id)){
                        chat_obj[chat_id] = {
                            "start_time" : timestamp,
                            "end_time" : timestamp,
                            "messages" : []
                        };
                    }
                    if(chat_obj[chat_id]['start_time']>timestamp){
                        chat_obj[chat_id]['start_time'] = timestamp;
                    }
                    if(chat_obj[chat_id]['end_time']<timestamp){
                        chat_obj[chat_id]['end_time'] = timestamp;
                    }
                    let message_obj = {
                        "sender" : sender,
                        "type" : message_type,
                        "message" : message,
                        "timestamp" : timestamp
                    };
                    chat_obj[chat_id]['messages'].push(message_obj);
                });
                let result = Object.keys(chat_obj).map((chat_id)=> {
                    let data = chat_obj[chat_id];
                    data['id'] = chat_id;
                    return data;
                });
                try{
                    result = result.sort((data1, data2)=>{
                        return parseInt(data2['id']) - parseInt(data1['id']);
                    });
                }catch (e) {}
                callback(result);
            });
        },
        getUserContext : (session_id, callback)=>{
            let get_session_context = "select user_context from sessions where session_id='"+session_id+"' and user_context!='{}';";
            MYSQL.sqlQuery('m_advisor_bot', get_session_context, (session_details)=>{
                let user_context={}, db_context_status = false;
                if(session_details.length>0){
                    let db_context = session_details[0]['user_context'];
                    console.log("context from db");
                    try {
                        user_context = JSON.parse(db_context);
                    }catch(e){console.log("Error while getting context form database");}
                    db_context_status = true;
                }
                else {
                    console.log("creating new context");
                    user_context = SESSIONS.getContext(session_id);
                }
                callback(db_context_status, user_context);
            });
        }
    };
    return helper_functions;
})();