const sockets = {};
module.exports = (function () {
    let socket_functions = {
        getSocket : (session_id)=>{
            return sockets[session_id];
        },
        storeSocket : (session_id, socket)=>{
            sockets[session_id] = socket;
        }
    };
    return socket_functions;
})();