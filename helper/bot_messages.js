module.exports = (function () {
    let titleCase = (input)=> {
        console.log('Input : ',input);
        try {
            return input[0].toUpperCase() + input.substr(1);
        }catch (e) {
            return "";
        }
    };

    let bot_messages = {
        textMessage : (message)=> {
            return {
                "type" : "text",
                "channel_name" : "chat",
                "message" : titleCase(message),
                "disable_chat_status" : false
            };
        },
        okButtonMessage(text) {
            let message = {
                "text" : text,
                "type" : "single_select",
                "channel_name" : "bot_questions",
                "options" : [
                    {
                        "key" : "okay",
                        "value" : "okay"
                    }
                ]
            };
            return message;
        }
    };
    return bot_messages;
})();