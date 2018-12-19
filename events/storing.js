module.exports = (function () {
    let HELPER = require('./event_helper');
    let LOGGER = require('./logger');

    let event_functions = {
        storeMessageEvent : (event)=> {
            // console.log(JSON.stringify(data, null, 2));
            // setImmediate(()=>{
            //     LOGGER.saveInLogs(event);
            //     if(event.type=='user_typed_message') {
            //         HELPER.storeUserTypedMessage(event);
            //     } else if(event.type == 'text') {
            //         HELPER.storeTextMessage(event);
            //     }
            //     else if(event.type=='single_select'){
            //         HELPER.storeSingleSelectMessage(event);
            //     }
            // });
        },
        storeUserContextInDb : (session_id, user_context)=>{
            setImmediate(()=>{
                HELPER.storeUserContext(session_id, user_context);
            });
        },
        getUserContextFromDb : (session_id, callback)=>{
            HELPER.getUserContext(session_id, callback);
        },
        offlineMessageEventsUpdate : (event)=> {
            if(event.type=='user_typed_message') {
                if(!event.hasOwnProperty('session_id'))
                    event['session_id'] = event['sender_id'];
                HELPER.storeUserTypedMessage(event);
            } else if(event.type == 'text') {
                HELPER.storeTextMessage(event);
            }
            else if(event.type=='single_select'){
                HELPER.storeSingleSelectMessage(event);
            }
        }
    };
    return event_functions;
})();