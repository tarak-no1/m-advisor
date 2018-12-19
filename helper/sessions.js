const sessions = {};
module.exports = (function () {
    let user_context = {
        chat_id : 1,
        messages : [],
        previous_question : undefined
    };
    let createSession = (session_id)=>{
        sessions[session_id] = JSON.parse(JSON.stringify(user_context));
    };
    let session_functions = {
        getContext : (session_id)=>{
            if(!sessions.hasOwnProperty(session_id))
                createSession(session_id);
            return sessions[session_id];
        },
        storeContext : (session_id, user_context)=>{
            sessions[session_id] = user_context;
        },
        isSessionExists : (session_id)=> {
            return sessions.hasOwnProperty(session_id);
        },
        clearContext : (session_id)=>{
            let previous_user_context = session_functions.getContext(session_id);
            let context = JSON.parse(JSON.stringify(user_context));
            context['chat_id'] = previous_user_context['chat_id']+1;
            session_functions.storeContext(session_id, context);
        }
    };
    return session_functions;
})();