module.exports = (function () {
    const SESSIONS = require('../helper/sessions');
    const SOCKETS = require('../helper/sockets-io');
    const BOT_MESSAGES = require("../helper/bot_messages");
    const EVENTS = require('../events/storing');
    const INPUT_DATA = require('../helper/bot_input');

    let sortByValue= (data, field, order)=>{
        let sorted_data = data.sort((a, b)=>{
            return (b[field] - a[field]) && order;
        });
        return sorted_data;
    };
    let follows = function(a){
        return a.map(function(item, i){
            return [item, follows(a.slice(i+1))];
        });
    };

    let combinations = function(a){
        let combs = function(prefix, trie, result){
            trie.forEach(function(node, i){
                result.push(prefix + node[0]);
                combs(prefix + node[0], node[1], result);
            });
            return result;
        };
        return combs('', follows(a), []);
    };
    let getCombinations = (list)=> {
        let set = [],
            listSize = list.length,
            combinationsCount = (1 << listSize);

        for (let i = 1; i < combinationsCount ; i++ , set.push(combination) )
            for (let j=0, combination = [];j<listSize;j++)
                if ((i & (1 << j)))
                    combination.push(list[j]);
        return set;
    };

    let supporter_functions = {
        /*
        * this function is used to send all bot messages to user
        * @params session_id (string)
        */
        sendMessages : (session_id)=>{
            // getting user context
            let user_context = SESSIONS.getContext(session_id);

            // getting user socket
            let socket = SOCKETS.getSocket(session_id);
            /*
            * this function is used to message to particular socket channel
            * @params messages (array), idx (integer)
            */
            let getMessage = (messages, idx)=>{
                let message_data = messages[idx];
                // ================= Storing User Message Event =================
                try {
                    message_data['chat_id'] = user_context['chat_id'];
                    message_data['session_id'] = session_id;
                    message_data['time'] = new Date().getTime();
                    EVENTS.storeMessageEvent(message_data);
                }catch(e){console.log("Error in Event Storing: ",e);}
                // ==============================================================

                message_data['gif_status'] = false;
                let channel_name = message_data['channel_name'];
                console.log("Channel Name : ", channel_name);
                idx++;
                if(messages.length>idx){
                    message_data['gif_status'] = true;
                    setTimeout(()=>{
                        getMessage(messages, idx);
                    }, 1000);
                }
                socket.emit(channel_name, message_data);
            };
            let bot_messages = user_context['messages'].concat();
            // checking bot_messages exists or not
            if(bot_messages.length>0){
                console.log("Bot Message Length : "+bot_messages.length);
                user_context['messages'] = [];

                // sending bot message to user
                getMessage(bot_messages, 0);
            }
            // ============== context storing =================
            EVENTS.storeUserContextInDb(session_id, user_context);
            // ================================================
        },

        /*
        * this is used to process bot function
        * @params bot_function (string), session_id (string)
        */
        botFunctionActions : {
            getSignalErrorMessage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let sentence = "Error while getting data from Signal";
                user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                SESSIONS.storeContext(session_id, user_context);
                callback();
            },
            resetUserContext: (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                user_context['messages'].push({"channel_name":"clear"});
                SESSIONS.storeContext(session_id, user_context);
                callback();
            },
            getGreetMessage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let sentence = "Hello";
                user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                SESSIONS.storeContext(session_id, user_context);
                callback();
            },
            getTotalMeasuresInDataset : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverAllSummary(signal_name, auth_token, (error, summary)=>{
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(summary, null, 2));
                        if(summary['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let no_of_measures = summary["noOfMeasures"];
                            let sentence = "The dataset had " + no_of_measures + (no_of_measures == 1 ? " Measure" : " Measures") + ".";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalDimensionsInDataset : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverAllSummary(signal_name, auth_token, (error, summary)=>{
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(summary, null, 2));
                        if (summary['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let no_of_dimensions = summary["noOfDimensions"];
                            user_context['messages'].push(BOT_MESSAGES.textMessage("The dataset had " + no_of_dimensions + (no_of_dimensions == 1 ? " Dimension" : " Dimensions") + "."));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnsInfoInDataset : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverAllSummary(signal_name, auth_token, (error, summary)=>{
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(summary, null, 2));
                        if (summary['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let no_of_dimensions = summary["noOfDimensions"];
                            let no_of_measures = summary["noOfMeasures"];
                            let no_of_time_dimensions = summary["noOfTimeDimensions"];
                            let sentence = "The analysis has " + no_of_measures + (no_of_measures == 1 ? " measure" : " measures") + ", " + no_of_dimensions + (no_of_dimensions == 1 ? " dimension" : " dimensions") + " and " + no_of_time_dimensions + (no_of_time_dimensions == 1 ? " date dimension" : " date dimensions") + "."
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalVariablesInDataSet : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverAllSummary(signal_name, auth_token, (error, summary)=>{
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(summary, null, 2));
                        if (summary['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let no_of_dimensions = summary["noOfDimensions"];
                            let no_of_measures = summary["noOfMeasures"];
                            let no_of_time_dimensions = summary["noOfTimeDimensions"];
                            let sentence = "The analysis has " + (no_of_measures + no_of_dimensions + no_of_time_dimensions) + " variables."
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalObservations : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverAllSummary(signal_name, auth_token, (error, summary)=>{
                    console.log(error);
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(summary, null, 2));
                        if(summary['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_observations = summary["totalObservations"];
                            let sentence = "A total of " + total_observations + " observations were used for the analysis.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalValuesInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(overview, null, 2));
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = overview['text']['about'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalValuesInTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverViewOfMeasureAnalysis(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(overview, null, 2));
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = "There are "+Object.keys(overview['data']).length+" values in "+target_column['key'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getDistributionOfTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(overview['text'], null, 2));

                        if(overview['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = overview['text']['distribution'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getDistributionOfTargetColumnAcrossColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                callback();
            },
            getDistributionOfTargetColumnAcrossColumnValueInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                callback();
            },
            getDistributionOfTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverViewOfMeasureAnalysis(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(overview, null, 2));
                        if(overview['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = overview['text']['distribution'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMaximumObservationsInAnalysis : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getMaximumValueInTargetColumn(session_id, callback);
            },
            getNthMaximumObservationsInAnalysis : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getNthMaximumInTargetColumn(session_id, callback);
            },
            getMinimumObservationsInAnalysis : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getMinimumValueInTargetColumn(session_id, callback);
            },
            getNthMinimumObservationsInAnalysis : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getNthMinimumInTargetColumn(session_id, callback);
            },
            getMaximumValueInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getNthMaximumInTargetColumn(session_id, ()=> {
                    callback();
                });
            },
            getMinimumValueInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];

                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getNthMinimumInTargetColumn(session_id, ()=> {
                    callback();
                });
            },
            getNthMaximumInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(overview, null, 2));
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let data = overview['data'];
                            let values = Object.keys(data);
                            try {
                                values = values.sort((a, b) => {
                                    return data[b] - data[a];
                                });
                            } catch (e) {
                            }
                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " largest value in the " + values[0];
                            if (values.length >= ordinal_value && ordinal_value != 0)
                                sentence = values[ordinal_value - 1] + " is the " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " largest value with " + data[values[ordinal_value - 1]] + " observations.";

                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getNthMinimumInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(overview, null, 2));
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let data = overview['data'];
                            let values = Object.keys(data);
                            try {
                                values = values.sort((a, b) => {
                                    return data[a] - data[b];
                                });
                            } catch (e) {}
                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " minimum value in the " + values[0];
                            if (values.length >= ordinal_value && ordinal_value != 0)
                                sentence = values[ordinal_value - 1] + " is the " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " minimum value with just " + data[values[ordinal_value - 1]] + " observations.";

                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalObservationsInTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let tcv_count = entities['tcv_count'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(overview, null, 2));
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let data = overview['data'];
                            let keys = [], column_observations = 0;
                            for (let count = 1; count <= tcv_count; count++) {
                                let tvc_key_name = 'target_column_value' + count;
                                let key_name = entities[tvc_key_name]['key'];
                                keys.push(key_name);
                                column_observations += data[key_name];
                            }
                            let sentence = column_observations + ' obeservations of ' + keys.join("+") + ' are present';
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPercentageOfObservationsInTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let tcv_count = entities['tcv_count'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let data = overview['data'];
                            let total = 0;
                            Object.keys(data).forEach((field) => {
                                total += data[field];
                            });
                            let keys = [], percentage = 0;
                            console.log("TVC Count : ", tcv_count);
                            for (let count = 1; count <= tcv_count; count++) {
                                let tvc_key_name = 'target_column_value' + count;
                                let key_name = entities[tvc_key_name]['key'];
                                keys.push(key_name);
                                let column_observations = data[key_name];
                                percentage += Math.round((column_observations / total) * 100 * 100) / 100;
                            }
                            let sentence = "The " + (keys.length == 1 ? "segment " : "segments ") + keys.join(" + ") + " accounts for " + percentage + "% of the overall observations";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getStatisticalRelationshipOfTargetColumnWithColumns : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if (key_influencers['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = key_influencers['text'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getStatisticalRelationshipOfTargetColumnWithColumnsInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(performance_data, null, 2));
                        if (performance_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = performance_data['text']['overview'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getInfluencingColumnsOfTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if (key_influencers['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = key_influencers['effect_size'];

                            let influencers_list = Object.keys(effect_size).filter((field) => {
                                return effect_size[field] >= 0.065;
                            });

                            let sentence = "Factors influencing " + target_column['key'] + " are : " + influencers_list.join(", ");

                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getInfluencingColumnsOfTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(performance_data, null, 2));
                        if(performance_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = performance_data['effect_size'];

                            let influencers_list = Object.keys(effect_size).filter((field) => {
                                return effect_size[field] >= 0.065;
                            });

                            let sentence = "there is no variable influencing " + target_column['key'];
                            if (influencers_list.length > 0)
                                sentence = influencers_list.join(", ") + " are influencing " + target_column['key'];

                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalInfluencingColumnsOfTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if(key_influencers['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = key_influencers['effect_size'];

                            let influencers_list = Object.keys(effect_size).filter((field) => {
                                return effect_size[field] >= 0.065;
                            });

                            let sentence = "There are total " + influencers_list.length + " variables are influencing " + target_column['key'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalInfluencingColumnsOfTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(performance_data, null, 2));
                        if(performance_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = performance_data['effect_size'];

                            let influencers_list = Object.keys(effect_size).filter((field) => {
                                return effect_size[field] >= 0.065;
                            });

                            let sentence = "there are total " + influencers_list.length + " variables influencing " + target_column['key'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getImpactOfTargetColumnByOtherColumns : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if(key_influencers['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let statistical_info = key_influencers['statistical_info'];

                            let sentence = statistical_info['inference'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getImpactOfTargetColumnByOtherColumnsInMeasureAnalysis : (session_id, callback)=> {
                supporter_functions.botFunctionActions.getStatisticalRelationshipOfTargetColumnWithColumnsInMeasureAnalysis(session_id, callback);
            },
            getStatisticalRelationshipOfTargetColumnWithOtherColumns : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getInfluencingColumnsOfTargetColumn(session_id, callback);
            },
            getStatisticalRelationshipOfTargetColumnWithOtherColumnsInMeasureAnalysis : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getInfluencingColumnsOfTargetColumnInMeasureAnalysis(session_id, callback);
            },
            getStrengthBetweenColumnAndTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if(key_influencers['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = key_influencers['effect_size'];
                            let required_column_effect_size = effect_size[column_name];

                            let sentence = "The effect size (Crammer's V) for " + column_name + " and " + target_column['key'] + " is " + required_column_effect_size;
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getStrengthBetweenColumnAndTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(performance_data, null, 2));
                        if(performance_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = performance_data['effect_size'];
                            let required_column_effect_size = effect_size[column_name];
                            let sentence = column_name + " and " + target_column['key'] + " has a relationship strength (Effect Size) of " + required_column_effect_size + ".";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMaximumRelationshipColumnWithTargetColumn : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getNthMaximumImpactColumnOnTargetColumn(session_id, callback);
            },
            getNthMaximumImpactColumnOnTargetColumn : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if(key_influencers['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = key_influencers['effect_size'];
                            let all_columns = Object.keys(effect_size);
                            try {
                                all_columns = all_columns.sort((a, b) => {
                                    return effect_size[b] - effect_size[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest impact on " + target_column['key'];
                            if (all_columns.length > ordinal_value && ordinal_value != 0) {
                                let column_name = all_columns[ordinal_value - 1];
                                let required_column_effect_size = effect_size[column_name];
                                sentence = column_name + " has the " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest impact on " + target_column['key'] + " with an effect size of " + required_column_effect_size + ".";
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMaximumRelationshipColumnWithTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getNthMaximumImpactColumnOnTargetColumnInMeasureAnalysis(session_id, callback);
            },
            getNthMaximumImpactColumnOnTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if (performance_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = performance_data['effect_size'];
                            let all_columns = Object.keys(effect_size);
                            try {
                                all_columns = all_columns.sort((a, b) => {
                                    return effect_size[b] - effect_size[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest impact on " + target_column['key'];
                            if (all_columns.length > ordinal_value && ordinal_value != 0) {
                                let column_name = all_columns[ordinal_value - 1];
                                let required_column_effect_size = effect_size[column_name];
                                sentence = column_name + " has the " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest impact on " + target_column['key'] + " with an effect size of " + required_column_effect_size + ".";
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMinimumRelationshipColumnWithTargetColumn : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getNthMinimumImpactColumnOnTargetColumn(session_id, callback);
            },
            getNthMinimumImpactColumnOnTargetColumn : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if(key_influencers['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = key_influencers['effect_size'];
                            let all_columns = Object.keys(effect_size);
                            try {
                                all_columns = all_columns.sort((a, b) => {
                                    return effect_size[a] - effect_size[b];
                                });
                            } catch (e) {}

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest impact on " + target_column['key'];
                            if (all_columns.length > ordinal_value && ordinal_value != 0) {
                                let column_name = all_columns[ordinal_value - 1];
                                let required_column_effect_size = effect_size[column_name];
                                sentence = column_name + " has the " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest impact on " + target_column['key'] + " with an effect size of " + required_column_effect_size + ".";
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMinimumRelationshipColumnWithTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getNthMinimumImpactColumnOnTargetColumnInMeasureAnalysis(session_id, callback);
            },
            getNthMinimumImpactColumnOnTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if(performance_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = performance_data['effect_size'];
                            let all_columns = Object.keys(effect_size);
                            try {
                                all_columns = all_columns.sort((a, b) => {
                                    return effect_size[a] - effect_size[b];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest impact on " + target_column['key'];
                            if (all_columns.length > ordinal_value && ordinal_value != 0) {
                                let column_name = all_columns[ordinal_value - 1];
                                let required_column_effect_size = effect_size[column_name];
                                sentence = column_name + " has the " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest impact on " + target_column['key'] + " with an effect size of " + required_column_effect_size + ".";
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalStatisticalRelationshipOfColumnsWithTargetColumn : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getImpactOfTargetColumnByOtherColumns(session_id, callback);
            },
            getTotalStatisticalRelationshipOfColumnsWithTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getImpactOfTargetColumnByOtherColumnsInMeasureAnalysis(session_id, callback);
            },
            getColumnInfluenceOfTargetColumn : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencers(signal_name, auth_token, (error, key_influencers)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(key_influencers, null, 2));
                        if (key_influencers['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = key_influencers['effect_size'];
                            let required_column_effect_size = effect_size[column_name];

                            let sentence = column_name + " has the significant relationship with " + target_column['key'] + " with an effect size of " + required_column_effect_size + ".";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnInfluenceOfTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(performance_data, null, 2));
                        if (performance_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let effect_size = performance_data['effect_size'];
                            let required_column_effect_size = effect_size[column_name];

                            let sentence = column_name + " has the significant relationship with " + target_column['key'] + " with an effect size of " + required_column_effect_size + ".";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getChiSquareResultsForTargetColumn : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getImpactOfTargetColumnByOtherColumns(session_id, callback);
            },
            getChiSquareResultsForTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPerformanceOfMeasureAnalysis(signal_name, auth_token, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(performance_data, null, 2));
                        if (performance_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let sentence = performance_data['statistical_info']['inference'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPValueForChiSquareBetweenColumnAndTargetColumn : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                callback();
            },
            getPValueForChiSquareBetweenColumnAndTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                callback();
            },
            getTotalColumnValues : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getDataSet(signal_name, auth_token, (error, data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(data, null, 2));
                        let dataset = data['dataset'];
                        let column_values = dataset[column_name]['values'];
                        let sentence = "There are " + column_values.length + " " + column_name + " values in the dataset.";
                        user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalObservationsOfTargetColumnValueFromColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_value = Object.keys(entities['column_values'])[0];
                let column_name = entities['column_values'][column_value]['belongs'];
                let target_column_value1 = entities['target_column_value1'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_column_data = relationship_data['data']['count'][target_column_value1['key']];
                            let sentence = "There are total " + total_column_data[column_value] + " " + target_column_value1['key'] + " observations in " + column_value + ".";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumTargetColumnPercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnsValueWithNthMaximumTargetColumnPercentage(session_id, callback);
            },
            getColumnsValueWithNthMaximumTargetColumnPercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count']['total'];
                            let total_of_column_data = 0;

                            let sort_field_based_on_total = Object.keys(total_data);
                            sort_field_based_on_total.forEach((field) => {
                                total_of_column_data += total_data[field];
                            });
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest percentage " + column_name + " in " + target_column['key'];
                            if (sort_field_based_on_total.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_total[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations that accounts for about " + (Math.round((total_data[column_value] / total_of_column_data) * 10000) / 100) + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumTargetColumnPercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnsValueWithNthMaximumTargetColumnPercentageInMeasureAnalysis(session_id, callback);
            },
            getColumnsValueWithNthMaximumTargetColumnPercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let total_of_column_data = 0;
                            let sort_field_based_on_total = Object.keys(total_data);
                            sort_field_based_on_total.forEach((field) => {
                                total_of_column_data += total_data[field];
                            });
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest percentage " + column_name + " in " + target_column['key'];
                            if (sort_field_based_on_total.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_total[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations that accounts for about " + (Math.round((total_data[column_value] / total_of_column_data) * 10000) / 100) + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumTargetColumnPercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnValuesWithNthMinimumTargetColumnPercentage(session_id, callback);
            },
            getColumnValuesWithNthMinimumTargetColumnPercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count']['total'];
                            let total_of_column_data = 0;

                            let sort_field_based_on_total = Object.keys(total_data);
                            sort_field_based_on_total.forEach((field) => {
                                total_of_column_data += total_data[field];
                            });
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest percentage " + column_name + " in " + target_column['key'];
                            if (sort_field_based_on_total.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_total[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations that accounts for about " + (Math.round((total_data[column_value] / total_of_column_data) * 10000) / 100) + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumTargetColumnPercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnValueWithNthMinimumTargetColumnPercentageInMeasureAnalysis(session_id, callback);
            },
            getColumnValueWithNthMinimumTargetColumnPercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if(impact_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let total_of_column_data = 0;
                            let sort_field_based_on_total = Object.keys(total_data);
                            sort_field_based_on_total.forEach((field) => {
                                total_of_column_data += total_data[field];
                            });
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {}

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest percentage " + column_name + " in " + target_column['key'];
                            if (sort_field_based_on_total.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_total[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations that accounts for about " + (Math.round((total_data[column_value] / total_of_column_data) * 10000) / 100) + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumTargetColumnValuePercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                supporter_functions.botFunctionActions.getColumnValuesWithNthMaximumTargetColumnValuePercentage(session_id, callback);
            },
            getColumnValuesWithNthMaximumTargetColumnValuePercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_percentage = Object.keys(percentage_data);
                            try {
                                sort_field_based_on_percentage = sort_field_based_on_percentage.sort((a, b) => {
                                    return percentage_data[b] - percentage_data[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest percentage " + column_name + " in " + target_column_value1['key'];
                            if (sort_field_based_on_percentage.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_percentage[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations of " + target_column_value1['key'] + " that accounts for about " + percentage_data[column_value] + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValueWithMinimumTargetColumnValuePercentage : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnValueWithNthMinimumTargetColumnValuePercentage(session_id, callback);
            },
            getColumnValueWithNthMinimumTargetColumnValuePercentage : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_percentage = Object.keys(percentage_data);
                            try {
                                sort_field_based_on_percentage = sort_field_based_on_percentage.sort((a, b) => {
                                    return percentage_data[a] - percentage_data[b];
                                });
                            } catch (e) {}

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest percentage " + column_name + " in " + target_column_value1['key'];
                            if (sort_field_based_on_percentage.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_percentage[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations of " + target_column_value1['key'] + " that accounts for about " + percentage_data[column_value] + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumTargetColumnValuePercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                supporter_functions.botFunctionActions.getColumnsValueWithNthMaximumTargetColumnValuePercentageInMeasureAnalysis(session_id, callback);
            },
            getColumnsValueWithNthMaximumTargetColumnValuePercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let sort_field_based_on_percentage = Object.keys(total_data);
                            let total_observations = 0;
                            sort_field_based_on_percentage.forEach((field) => {
                                total_observations += total_data[field];
                            });
                            try {
                                sort_field_based_on_percentage = sort_field_based_on_percentage.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest percentage " + column_name + " in " + target_column_value1['key'];
                            if (sort_field_based_on_percentage.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_percentage[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations of " + target_column_value1['key'] + " that accounts for about " + Math.round((total_data[column_value] / total_observations) * 10000) / 100 + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValueWithMinimumTargetColumnValuePercentageInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnValueWithNthMinimumTargetColumnValuePercentageInMeasureAnalysis(session_id, callback);
            },
            getColumnValueWithNthMinimumTargetColumnValuePercentageInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_percentage = Object.keys(percentage_data);
                            try {
                                sort_field_based_on_percentage = sort_field_based_on_percentage.sort((a, b) => {
                                    return percentage_data[a] - percentage_data[b];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest percentage " + column_name + " in " + target_column_value1['key'];
                            if (sort_field_based_on_percentage.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_percentage[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations of " + target_column_value1['key'] + " that accounts for about " + percentage_data[column_value] + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnWithMaximumObservationsInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnValuesWithNthMaximumObservationsInTargetColumn(session_id, callback);
            },
            getColumnValuesWithNthMaximumObservationsInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " highest observation " + column_name + " in " + target_column_value1['key'];
                            if (sort_field_based_on_total.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_total[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations of " + target_column_value1['key'] + " that accounts for about " + percentage_data[column_value] + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumObservationsInTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                user_context['current_entities']['ordinal'] = [1];
                SESSIONS.storeContext(session_id, user_context);
                supporter_functions.botFunctionActions.getColumnValuesWithNthMinimumObservationsInTargetColumnValue(session_id, callback);
            },
            getColumnValuesWithNthMinimumObservationsInTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];
                let ordinal_value = entities['ordinal'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if (relationship_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }

                            let sentence = "There is no " + ordinal_value + (ordinal_value == 1 ? 'st' : (ordinal_value == 2 ? 'nd' : (ordinal_value == 3 ? 'rd' : 'th'))) + " lowest observation " + column_name + " in " + target_column_value1['key'];
                            if (sort_field_based_on_total.length >= ordinal_value && ordinal_value != 0) {
                                let column_value = sort_field_based_on_total[ordinal_value - 1];
                                sentence = column_value + " amounts to " + total_data[column_value] + " observations of " + target_column_value1['key'] + " that accounts for about " + percentage_data[column_value] + "% of the " + column_name;
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTopNColumnValuesWithMaximumObservationsInTargetColumn : (session_id, callback)=> {
                callback();
            },
            getTopNColumnValuesWithMaximumPercentageInTargetColumn : (session_id, callback)=> {
                callback();
            },
            getTopNColumnValuesWithMaximumObservationsInTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];

                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }
                            let top_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = top_fields.map((field) => {
                                return total_data[field];
                            });
                            let sentence = top_fields.join(", ") + " has the highest " + target_column_value1['key'] + " observations with " + field_result.join(", ") + " respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTopNColumnValuesWithMaximumPercentageInTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if (relationship_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_total = Object.keys(percentage_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return percentage_data[b] - percentage_data[a];
                                });
                            } catch (e) {
                            }
                            let top_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = top_fields.map((field) => {
                                return percentage_data[field] + "%";
                            });
                            let sentence = top_fields.join(", ") + " has the highest " + target_column_value1['key'] + " percentage with " + field_result.join(", ") + "% respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTopNColumnValuesWithMaximumTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }
                            let top_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = top_fields.map((field) => {
                                return total_data[field];
                            });
                            let sentence = top_fields.join(", ") + " has the highest " + target_column['key'] + " observations with " + field_result.join(", ") + " respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTopNColumnValuesWithMaximumPercentageInTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(impact_data, null, 2));
                        if(impact_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let total_observations = 0;
                            let sort_field_based_on_total = Object.keys(total_data);
                            sort_field_based_on_total.forEach((field) => {
                                total_observations += total_data[field];
                            });
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }
                            let top_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = top_fields.map((field) => {
                                return Math.round((total_data[field] / total_observations) * 10000) / 100 + "%";
                            });
                            let sentence = top_fields.join(", ") + " has the highest " + target_column['key'] + " observations with " + field_result.join(", ") + " respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTopNColumnValuesWithMaximumObservationsInTargetColumnValueInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                callback();
            },
            getTopNColumnValuesWithMaximumPercentageInTargetColumnValueInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                callback();
            },
            getBottomNColumnValuesWithMinimumObservationsInTargetColumn : (session_id, callback)=> {
                callback();
            },
            getBottomNColumnValuesWithMinimumPercentageInTargetColumn : (session_id, callback)=> {
                callback();
            },
            getBottomNColumnValuesWithMinimumObservationsInTargetColumnValue : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];

                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }
                            let bottom_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = bottom_fields.map((field) => {
                                return total_data[field];
                            });
                            let sentence = bottom_fields.join(", ") + " has the lowest " + target_column_value1['key'] + " observations with " + field_result.join(", ") + " respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getBottomNColumnValuesWithMinimumPercentageInTargetColumnValue : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];

                            let sort_field_based_on_total = Object.keys(percentage_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return percentage_data[a] - percentage_data[b];
                                });
                            } catch (e) {
                            }
                            let bottom_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = bottom_fields.map((field) => {
                                return percentage_data[field] + "%";
                            });
                            let sentence = bottom_fields.join(", ") + " has the lowest " + target_column_value1['key'] + " percentage with " + field_result.join(", ") + "% respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getBottomNColumnValuesWithMinimumObservationsInTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }
                            let top_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = top_fields.map((field) => {
                                return total_data[field];
                            });
                            let sentence = top_fields.join(", ") + " has the lowest " + target_column['key'] + " observations with " + field_result.join(", ") + " respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getBottomNColumnValuesWithMinimumPercentageInTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let total_observations = 0;
                            let sort_field_based_on_total = Object.keys(total_data);
                            sort_field_based_on_total.forEach((field) => {
                                total_observations += total_data[field];
                            });
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }
                            let lowest_fields = sort_field_based_on_total.splice(0, number);
                            let field_result = lowest_fields.map((field) => {
                                return Math.round((total_data[field] / total_observations) * 10000) / 100 + "%";
                            });
                            let sentence = lowest_fields.join(", ") + " has the lowest " + target_column['key'] + " observations with " + field_result.join(", ") + " respectiveley";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getBottomNColumnValuesWithMinimumObservationsInTargetColumnValueInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                callback();
            },
            getBottomNColumnValuesWithMinimumPercentageInTargetColumnValueInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                callback();
            },
            getColumnValuesWithTargetColumnValueObservationsInRange : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let range = entities['range'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let sort_field_based_on_total = Object.keys(total_data);
                            let required_values = [];
                            let range_text = "";
                            let number = "";
                            if (range['type'] == 'above') {
                                let start = parseInt(range['start']);
                                range_text = "higher than";
                                number = start + "";
                                required_values = sort_field_based_on_total.filter((field) => {
                                    return total_data[field] > start;
                                });
                            }
                            else if (range['type'] == 'under') {
                                let end = parseInt(range['end']);
                                range_text = "lower than";
                                number = end + "";
                                required_values = sort_field_based_on_total.filter((field) => {
                                    return total_data[field] < end;
                                });
                            }
                            else {
                                let start = parseInt(range['start']);
                                let end = parseInt(range['end']);
                                range_text = "between";
                                number = start + " to " + end;
                                required_values = sort_field_based_on_total.filter((field) => {
                                    return total_data[field] >= start && total_data[field] <= end;
                                });
                            }
                            console.log(required_values);
                            let sentence = "There are no values in " + column_name + " has " + target_column_value1['key'] + " " + range_text + " " + number + " observations.";
                            if (required_values.length > 0)
                                sentence = required_values.length + " " + column_name + " values (including " + required_values.join(", ") + ") has " + target_column_value1['key'] + " " + range_text + " " + number + " observations.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    callback();
                });
            },
            getColumnValuesWithTargetColumnValuePercentageInRange : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let range = entities['range'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(relationship_data['error_info']['status']){
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let percentage_data = relationship_data['data']['percentage'][target_column_value1['key']];
                            let sort_field_based_on_percentage = Object.keys(percentage_data);
                            let required_values = [];
                            let range_text = "";
                            let number = "";
                            if (range['type'] == 'above') {
                                let start = parseFloat(range['start']);
                                range_text = "higher than";
                                number = start + "";
                                required_values = sort_field_based_on_percentage.filter((field) => {
                                    return percentage_data[field] > start;
                                });
                            }
                            else if (range['type'] == 'under') {
                                let end = parseFloat(range['end']);
                                range_text = "lower than";
                                number = end + "";
                                required_values = sort_field_based_on_percentage.filter((field) => {
                                    return percentage_data[field] < end;
                                });
                            }
                            else {
                                let start = parseFloat(range['start']);
                                let end = parseFloat(range['end']);
                                range_text = "between";
                                number = start + " to " + end;
                                required_values = sort_field_based_on_percentage.filter((field) => {
                                    return percentage_data[field] >= start && percentage_data[field] <= end;
                                });
                            }

                            let sentence = "There are no values in " + column_name + " has " + target_column_value1['key'] + " " + range_text + " " + number + "%.";
                            if (required_values.length > 0)
                                sentence = required_values.length + " " + column_name + " values (including " + required_values.join(", ") + ") has " + target_column_value1['key'] + " " + range_text + " " + number + "%.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumObservations : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if (relationship_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count']['total'];
                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }
                            let top_fields = sort_field_based_on_total.splice(0, 2);
                            top_fields = top_fields.map((field) => {
                                return field + "(" + total_data[field] + ")";
                            });

                            let sentence = top_fields.join(' and ') + " are the " + column_name + " values with highest observations.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumTargetColumn : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getColumnValuesWithMaximumObservations(session_id, callback);
            },
            getColumnValuesWithMaximumTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[b] - total_data[a];
                                });
                            } catch (e) {
                            }
                            let maximum = total_data[sort_field_based_on_total[0]];
                            let top_fields = sort_field_based_on_total.filter((field) => {
                                return total_data[field] == maximum;
                            });
                            let field_result = top_fields.map((field) => {
                                return total_data[field];
                            });
                            let sentence = top_fields.join(", ") + " has the highest with " + field_result.join(", ") + " " + entities['dataset_target_column'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumObservations : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(relationship_data);
                        if (relationship_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = relationship_data['data']['count']['total'];
                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }
                            let least_fields = sort_field_based_on_total.splice(0, 2);
                            least_fields = least_fields.map((field) => {
                                return field + "(" + total_data[field] + ")";
                            });

                            let sentence = least_fields.join(' and ') + " are the " + column_name + " values with minimum observations.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumTargetColumn : (session_id, callback)=>{
                supporter_functions.botFunctionActions.getColumnValuesWithMinimumObservations(session_id, callback);
            },
            getColumnValuesWithMinimumTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let sort_field_based_on_total = Object.keys(total_data);
                            try {
                                sort_field_based_on_total = sort_field_based_on_total.sort((a, b) => {
                                    return total_data[a] - total_data[b];
                                });
                            } catch (e) {
                            }
                            let maximum = total_data[sort_field_based_on_total[0]];
                            let top_fields = sort_field_based_on_total.filter((field) => {
                                return total_data[field] == maximum;
                            });
                            let field_result = top_fields.map((field) => {
                                return total_data[field];
                            });
                            let sentence = top_fields.join(", ") + " has the lowest with " + field_result.join(", ") + " " + entities['dataset_target_column'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumObservationsInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];
                let column_name_type = entities['columns'][column_name]['data_type'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    console.log(JSON.stringify(impact_data, null, 2));
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = impact_data['text']['top_observations'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumObservationsInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];
                let column_name_type = entities['columns'][column_name]['data_type'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    console.log(JSON.stringify(impact_data, null, 2));
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = impact_data['text']['lowest_observations'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithPercentageInRange : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let range = entities['range'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(relationship_data);
                        if (relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let total_data = relationship_data['data']['count']['total'];
                            let total_observations = 0;
                            Object.keys(total_data).forEach((field) => {
                                total_observations += total_data[field];
                            });
                            let range_text = "";
                            let range_number = "";
                            let required_values = [];
                            if (range['type'] == "above") {
                                let start = parseFloat(range['start']);
                                range_text = "higher than";
                                range_number = start + "%";
                                required_values = Object.keys(total_data).filter((field) => {
                                    return ((total_data[field] / total_observations) * 100) > start;
                                });
                            }
                            else if (range['type'] == 'under') {
                                let end = parseFloat(range['end']);
                                range_text = "lower than";
                                range_number = end + "%";
                                required_values = Object.keys(total_data).filter((field) => {
                                    return ((total_data[field] / total_observations) * 100) < end;
                                });
                            }
                            else {
                                let start = parseFloat(range['start']);
                                let end = parseFloat(range['end']);
                                range_text = "between";
                                range_number = start + "% to " + end + "%";
                                required_values = Object.keys(total_data).filter((field) => {
                                    let percent = ((total_data[field] / total_observations) * 100);
                                    return percent >= start && percent <= end;
                                });
                            }
                            let sentence = "No values in " + column_name + " has " + range_text + " " + range_number + " observations.";
                            if (required_values.length > 0)
                                sentence = required_values.join(", ") + " has " + range_text + " " + range_number + " observations.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithPercentageInRangeInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let range = entities['range'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                /*INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, performance_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(performance_data, null, 2));
                        let total_data = performance_data['data']['total'];
                        let total_observations = 0;
                        Object.keys(total_data).forEach((field) => {
                            total_observations += total_data[field];
                        });
                        let range_text = "";
                        let range_number = "";
                        let required_values = [];
                        if (range['type'] == "above") {
                            let start = parseFloat(range['start']);
                            range_text = "higher than";
                            range_number = start + "%";
                            required_values = Object.keys(total_data).filter((field) => {
                                return ((total_data[field] / total_observations) * 100) > start;
                            });
                        }
                        else if (range['type'] == 'under') {
                            let end = parseFloat(range['end']);
                            range_text = "lower than";
                            range_number = end + "%";
                            required_values = Object.keys(total_data).filter((field) => {
                                return ((total_data[field] / total_observations) * 100) < end;
                            });
                        }
                        else {
                            let start = parseFloat(range['start']);
                            let end = parseFloat(range['end']);
                            range_text = "between";
                            range_number = start + "% to " + end + "%";
                            required_values = Object.keys(total_data).filter((field) => {
                                let percent = ((total_data[field] / total_observations) * 100);
                                return percent >= start && percent <= end;
                            });
                        }
                        let sentence = "No values in " + column_name + " has " + range_text + " " + range_number + " observations.";
                        if (required_values.length > 0)
                            sentence = required_values.join(", ") + " has " + range_text + " " + range_number + " observations.";
                        user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });*/
                callback();
            },
            getMainInsightsFromColumnAndTargetColumnAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(relationship_data);
                        if(relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let template_keys = Object.keys(relationship_data['text']);
                            let templates = template_keys.map((key) => {
                                return relationship_data['text'][key];
                            });
                            let sentence = templates.join("\n\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMainInsightsFromColumnAndTargetColumnInMeasureAnalysis : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(impact_data);
                        if(impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = impact_data['text']['about'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getOverviewOfTargetColumnInColumnValue : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                callback();
            },
            getTotalObservationsInColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_value = Object.keys(entities['column_values'])[0];
                let column_name = entities['column_values'][column_value]['belongs'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if(relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let total_column_data = relationship_data['data']['count']['total'];
                            let sentence = "There are total " + total_column_data[column_value] + " observations in " + column_value + ".";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPredictionsOfTargetColumnValueObservations : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let rules_data = predictions_data['prediction'][target_column_value1['key']];
                            let all_rules = rules_data.map((data) => {
                                return "- " + data['rule'];
                            });
                            let sentence = "No rules are present";
                            if (all_rules.length > 0)
                                sentence = all_rules.join("\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMostLikelyPredictionsOfTargetColumnObservations : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let all_rules_data = predictions_data['prediction'];
                            let rules_data = [];
                            Object.keys(all_rules_data).forEach((field) => {
                                rules_data = rules_data.concat(all_rules_data[field]);
                            });
                            let all_probabilities = rules_data.concat();
                            try {
                                all_probabilities = all_probabilities.sort((data1, data2) => {
                                    return data2['probability'] - data1['probability'];
                                });
                            } catch (e) {
                            }

                            all_probabilities = all_probabilities.filter((data) => {
                                return all_probabilities[0]['probability'] == data['probability'];
                            });

                            let all_rules = all_probabilities.map((data) => {
                                return "- " + data['rule'];
                            });
                            let sentence = "No rules are present";
                            if (all_rules.length > 0)
                                sentence = all_rules.join("\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMostLikelyPredictionsOfTargetColumnValueObservations : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let rules_data = predictions_data['prediction'].hasOwnProperty(target_column_value1['key'])?predictions_data['prediction'][target_column_value1['key']]:[];
                            let all_probabilities = rules_data;
                            try {
                                all_probabilities = all_probabilities.sort((data1, data2) => {
                                    return data2['probability'] - data1['probability'];
                                });
                            } catch (e) {
                            }

                            all_probabilities = all_probabilities.filter((data) => {
                                return all_probabilities[0]['probability'] == data['probability'];
                            });

                            let all_rules = all_probabilities.map((data) => {
                                return "- " + data['rule'];
                            });
                            let sentence = "No rules are present";
                            if (all_rules.length > 0)
                                sentence = all_rules.join("\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getLowPredictionsOfTargetColumnObservations : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let all_rules_data = predictions_data['prediction'];
                            let rules_data = [];
                            Object.keys(all_rules_data).forEach((field) => {
                                rules_data = rules_data.concat(all_rules_data[field]);
                            });
                            let all_probabilities = rules_data.concat();
                            try {
                                all_probabilities = all_probabilities.sort((data1, data2) => {
                                    return data1['probability'] - data2['probability'];
                                });
                            } catch (e) {
                            }

                            all_probabilities = all_probabilities.filter((data) => {
                                return all_probabilities[0]['probability'] == data['probability'];
                            });

                            let all_rules = all_probabilities.map((data) => {
                                return "- " + data['rule'];
                            });
                            let sentence = "No rules are present";
                            if (all_rules.length > 0)
                                sentence = all_rules.join("\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getLowPredictionsOfTargetColumnValueObservations : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let rules_data = predictions_data['prediction'][target_column_value1['key']];
                            let all_probabilities = rules_data.concat();
                            try {
                                all_probabilities = all_probabilities.sort((data1, data2) => {
                                    return data1['probability'] - data2['probability'];
                                });
                            } catch (e) {
                            }

                            all_probabilities = all_probabilities.filter((data) => {
                                return all_probabilities[0]['probability'] == data['probability'];
                            });

                            let all_rules = all_probabilities.map((data) => {
                                return "- " + data['rule'];
                            });
                            let sentence = "No rules are present";
                            if (all_rules.length > 0)
                                sentence = all_rules.join("\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPredictionsOfTargetColumnValueObservationsFromColumnValue : (session_id, callback)=>{
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_value = Object.keys(entities['column_values'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let rules_data = predictions_data['prediction'][target_column_value1['key']];
                            rules_data = rules_data.filter((data) => {
                                let rule = data['rule'].toLowerCase();
                                return rule.indexOf(column_value) != -1;
                            });
                            let all_rules = rules_data.map((data) => {
                                return "- " + data['rule'];
                            });
                            let sentence = "No rules are present";
                            if (all_rules.length > 0)
                                sentence = all_rules.join("\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalEffectingColumnsOnTargetColumnValue : (session_id, callback)=> {
                callback();
            },
            getColumnEffectOnTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                // INPUT_DATA.getColumnDistributionOfTargetColumnValue(signal_name, auth_token, column_name, target_column_value1['key'], (error, distribution_data)=> {
                //     console.log(JSON.stringify(distribution_data, null, 2));
                //     let sentence = distribution_data['text']['distribution'];
                //     user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                //     SESSIONS.storeContext(session_id, user_context);
                //     callback();
                // });
                callback();
            },
            getColumnEffectOnTargetColumn : (session_id, callback)=> {
                supporter_functions.botFunctionActions.getStrengthBetweenColumnAndTargetColumn(session_id, callback);
            },
            getColumnEffectOnTargetColumnInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_name = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];
                let column_name_type = entities['columns'][column_name]['data_type'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                if(column_name_type=='string'){
                    INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                        // console.log(JSON.stringify(impact_data, null, 2));
                        if(impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = impact_data['text']['about'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    });
                }
                else{
                    INPUT_DATA.getImpactOfMeasureOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                        // console.log(JSON.stringify(impact_data, null, 2));
                        if(impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = impact_data['text']['about'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    });
                }
            },
            getPredictionRules : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getPredictions(signal_name, auth_token, (error, predictions_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(predictions_data, null, 2));
                        if (predictions_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let rules_data = predictions_data['prediction'];

                            let all_rules = [];
                            Object.keys(rules_data).forEach((value) => {
                                let field_rules = rules_data[value].map((data) => {
                                    return "- " + data['rule'];
                                });
                                all_rules.push("For " + value.toUpperCase() + "\n" + field_rules.join("\n"));
                            });

                            let sentence = "No rules are present";
                            if (all_rules.length > 0) {
                                sentence = all_rules.join("\n\n");
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getDistributionOfTargetColumnValueAcrossColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnDistributionOfTargetColumnValue(signal_name, auth_token, column_name, target_column_value1['key'], (error, distribution_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(distribution_data, null, 2));
                        if(distribution_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = distribution_data['text']['distribution'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getValuesInColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getDataSet(signal_name, auth_token, (error, data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        let dataset = data['dataset'];
                        let column_values = dataset[column_name]['values'];

                        let sentence = column_values.join(", ") + " are in " + column_name;
                        if(column_values.length==0)
                            sentence = "I'm sorry, I haven't found any answer for this question.";
                        user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getValuesInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getDataSet(signal_name, auth_token, (error, data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(data);
                        let dataset = data['dataset'];
                        let column_values = dataset[target_column['key']]['values'];

                        let sentence = column_values.join(", ") + " are in " + target_column['key'];
                        user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getNthQuartileOfTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let ordinal_value = entities['ordinal'][0];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverViewOfMeasureAnalysis(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if (overview['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            console.log(JSON.stringify(overview, null, 2));
                            let table_data = overview['table_data'];
                            let quartile_key = "quartile " + ordinal_value;

                            let ordinal_sentence_text = (ordinal_value == 1 ? 'first' : (ordinal_value == 2 ? 'second' : (ordinal_value == 3 ? 'third' : ordinal_value + 'th')));
                            let sentence = "There is no " + ordinal_sentence_text + " quartile is in " + target_column['key'];
                            if (table_data.hasOwnProperty(quartile_key)) {
                                sentence = ordinal_sentence_text + " quartile " + target_column['key'] + " amounted to " + table_data[quartile_key] + ".";
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getOutliersInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverViewOfMeasureAnalysis(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(overview, null, 2));
                        if(overview['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = overview['text']['outliers_info'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTotalPositiveOutliersInAnalysis : (session_id, callback)=> {
                callback();
            },
            getAllPositiveOutliersInAnalysis : (session_id, callback)=> {
                callback();
            },
            getTotalNegativeOutliersInAnalysis : (session_id, callback)=> {
                callback();
            },
            getAllNegativeOutliersInAnalysis : (session_id, callback)=> {
                callback();
            },
            getGrowthInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getTrends(signal_name, auth_token, (error, trend_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if(trend_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            console.log(JSON.stringify(trend_data, null, 2));
                            let sentence = trend_data['text']['growth_details'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    }
                });
            },
            getPeakStageDateOfTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getTrends(signal_name, auth_token, (error, trend_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(trend_data, null, 2));
                        if(trend_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = trend_data['text']['highest_points'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        callback();
                    }
                });
            },
            getReasonsForPeak : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getTrends(signal_name, auth_token, (error, trend_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(trend_data, null, 2));
                        if(trend_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = trend_data['text']['highest_point_reason'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    }
                });
            },
            getLowestStateDateForTargetColumnDate : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getTrends(signal_name, auth_token, (error, trend_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(trend_data, null, 2));
                        if(trend_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = trend_data['text']['lowest_points'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    }
                });
            },
            getReasonsForDropInTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getTrends(signal_name, auth_token, (error, trend_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(trend_data, null, 2));
                        if(trend_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = trend_data['text']['lowest_point_reason'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    }
                });
            },
            getFastGrowingColumnValues : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    console.log(JSON.stringify(impact_data, null, 2));
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if(impact_data['error_info']['status'] || !impact_data.hasOwnProperty('performance_overtime')) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let data = Object.keys(impact_data['performance_overtime']);
                            let text_templates = data.map((field)=>{
                                return impact_data['performance_overtime'][field];
                            });
                            user_context['messages'].push(BOT_MESSAGES.textMessage(text_templates.join("\n")));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPoorGrowingColumnValues : (session_id, callback)=> {
                supporter_functions.botFunctionActions.getColumnValuesWithMinimumObservationsInMeasureAnalysis(session_id, callback);
            },
            getLeadersClubColumnValues : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnDecisionMatrix(signal_name, auth_token, column_name, (error, decision_matrix_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(decision_matrix_data, null, 2));
                        if (decision_matrix_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = "There is no " + column_name + " value belongs to the leaders's club.";
                            if (decision_matrix_data['data'].hasOwnProperty('leaders club')) {
                                sentence = decision_matrix_data['text']["leaders_club"];
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getAnalysisOfColumnsVsTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(impact_data);
                        if(impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let template_keys = Object.keys(impact_data['text']);
                            let templates = template_keys.map((key) => {
                                return impact_data['text'][key];
                            });
                            let sentence = templates.join("\n\n");
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getTargetColumnFromColumnValueTrendingOverTime : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let column_value = Object.keys(entities['column_values'])[0];
                let column_name = entities['column_values'][column_value]['belongs'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    console.log(JSON.stringify(impact_data, null, 2));
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if(impact_data['error_info']['status'] || !impact_data.hasOwnProperty('performance_overtime')) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = impact_data['performance_overtime'][column_value];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getMeasuresThatEffectTargetColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencersInMeasureAnalysis(signal_name, auth_token, (error, influence_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(influence_data, null, 2));
                        if(influence_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = influence_data['text']['key_measures'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getDimensionsThatEffectTargetColumn : (session_id, callback)=> {
                callback();
            },
            getDateDimensionsThatEffectTargetColumn : (session_id, callback)=> {
                callback();
            },
            getIncrementOfTargetColumnOnUnitChangeInColumn : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_name = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyInfluencersInMeasureAnalysis(signal_name, auth_token, (error, influencers_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(influencers_data, null, 2));
                        if (influencers_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            console.log(JSON.stringify(influencers_data, null, 2));

                            let unit_change = influencers_data['effect_size'][column_name];
                            let sentence = "Invalid measure variable given for checking increment.";
                            if (unit_change)
                                sentence = "An incremental unit change in " + column_name + " corresponds to an average decrease in " + target_name['key'] + " by " + unit_change + " units.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPredictionsOfMaximumTargetColumnObservationsFromColumnValue : (session_id, callback)=> {
                callback();
            },
            getKeyTakeAwaysFromAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getKeyTakeAways(signal_name, auth_token, (error, key_take_aways)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(key_take_aways, null, 2));
                        if (key_take_aways['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let sentence = key_take_aways['overview']['about'] + "\n" + key_take_aways['associations'];
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMaximumTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if (relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let sort_field_based_maximum_value = Object.keys(total_data);
                            try{
                                sort_field_based_maximum_value = sort_field_based_maximum_value.sort((a, b)=> {
                                    return total_data[b] - total_data[a];
                                });
                            }catch (e) {}
                            let maximum_value = total_data[sort_field_based_maximum_value[0]];
                            let required_fields = sort_field_based_maximum_value.filter((field)=>{
                                return maximum_value==total_data[field];
                            });

                            let sentence = required_fields.join(", ")+(required_fields.length==1?" is ":" are ")+" having highest "+target_column_value1['key']+" with "+maximum_value+" observations.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getColumnValuesWithMinimumTargetColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_name = Object.keys(entities['columns'])[0];
                let target_column_value1 = entities['target_column_value1'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data, null, 2));
                        if (relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let total_data = relationship_data['data']['count'][target_column_value1['key']];
                            let sort_field_based_maximum_value = Object.keys(total_data);
                            try{
                                sort_field_based_maximum_value = sort_field_based_maximum_value.sort((a, b)=> {
                                    return total_data[a] - total_data[b];
                                });
                            }catch (e) {}
                            let minimum_value = total_data[sort_field_based_maximum_value[0]];
                            let required_fields = sort_field_based_maximum_value.filter((field)=>{
                                return minimum_value==total_data[field];
                            });

                            let sentence = required_fields.join(", ")+(required_fields.length==1?" is ":" are ")+" having lowest "+target_column_value1['key']+" with "+minimum_value+" observations.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getPercentageOfTargetColumnValueInColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_value = Object.keys(entities['column_values'])[0];
                let target_column_value1 = entities['target_column_value1'];
                let column_name = entities['column_values'][column_value]['belongs'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        // console.log(JSON.stringify(relationship_data['data'], null, 2));
                        if (relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let percentage = relationship_data['data']['percentage'][target_column_value1['key']][column_value];

                            let sentence = percentage+"% of "+target_column_value1['key']+" observations are present in "+column_value;
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getDistributionOfTargetColumnInColumnValue : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let column_value = Object.keys(entities['column_values'])[0];
                let target_column = entities['target_column'];
                let column_name = entities['column_values'][column_value]['belongs'];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getColumnRelationshipWithTargetColumn(signal_name, auth_token, column_name, (error, relationship_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        if (relationship_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            console.log(JSON.stringify(relationship_data['data'], null, 2));
                            let percentage_data = relationship_data['data']['percentage'];
                            let total_data = relationship_data['data']['count']['total'][column_value];
                            let required_data = Object.keys(percentage_data).map((field) => {
                                let percentage = relationship_data['data']['percentage'][field][column_value];
                                let total = relationship_data['data']['count'][field][column_value];
                                return percentage + "% of " + field + " with " + total + " observations";
                            });

                            let sentence = "There are " + required_data.join(", ") + " in " + column_value;
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            },
            getNameOfSignalInAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let signal_name = user_context['signal_name'];
                console.log("Signal name : ",signal_name);
                let split_signal_name = signal_name.split("-");
                split_signal_name.pop();
                let actual_signal_name = split_signal_name.join(" ");
                let sentence = "Signal name is "+actual_signal_name;
                user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                callback();
            },
            getAboutSignalInAnalysis : (session_id, callback)=> {
                supporter_functions.botFunctionActions.getNameOfSignalInAnalysis(session_id, callback);
            },
            getTargetColumnNameInAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column_name = entities["dataset_target_column"];
                let sentence = target_column_name+" is the target variable for this analysis";
                user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                callback();
            },
            getColumnValuesInTargetColumnRangeInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let range = entities['range'];
                            let range_type = range['type'];
                            let number, range_text = '', required_field = [];
                            if (range_type == 'above') {
                                let start = range['start'];
                                range_text = 'higher than';
                                number = start + "";
                                required_field = Object.keys(total_data).filter((field) => {
                                    return total_data[field] > start;
                                });
                            }
                            else if (range_type == 'under') {
                                let end = range['end'];
                                range_text = 'less than';
                                number = end + "";
                                required_field = Object.keys(total_data).filter((field) => {
                                    return total_data[field] < end;
                                });
                            }
                            else {
                                let start = range['start'];
                                let end = range['end'];
                                range_text = "between";
                                number = start + " to " + end;
                                required_field = Object.keys(total_data).filter((field) => {
                                    return total_data[field] >= start && total_data[field] <= end;
                                });
                            }

                            let sentence = "There is no " + column_name + " is having " + range_text + " " + number + " in " + target_column['key'];
                            if (required_field.length > 0) {
                                sentence = required_field.join(", ") + " are having " + range_text + " " + number + " in " + target_column['key'];
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    }
                });
            },
            getColumnValuesInPercentageOfTargetColumnRangeInMeasureAnalysis : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let target_column = entities['target_column'];
                let column_name = Object.keys(entities['columns'])[0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getImpactOfColumnOnTargetColumnInMeasureAnalysis(signal_name, auth_token, column_name, (error, impact_data)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(impact_data, null, 2));
                        if (impact_data['error_info']['status']) {
                            let sentence = "I'm sorry, I haven't found any answer for this question.";
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        else {
                            let total_data = impact_data['data']['total'];
                            let total_target_column_values = 0;
                            Object.keys(total_data).forEach((field) => {
                                total_target_column_values += total_data[field];
                            });
                            let range = entities['range'];
                            let range_type = range['type'];
                            let number, range_text = '', required_field = [];
                            if (range_type == 'above') {
                                let start = range['start'];
                                range_text = 'higher than';
                                number = start + "%";
                                required_field = Object.keys(total_data).filter((field) => {
                                    return ((total_data[field] / total_target_column_values) / 100) > start;
                                });
                            }
                            else if (range_type == 'under') {
                                let end = range['end'];
                                range_text = 'less than';
                                number = end + "%";
                                required_field = Object.keys(total_data).filter((field) => {
                                    return ((total_data[field] / total_target_column_values) / 100) < end;
                                });
                            }
                            else {
                                let start = range['start'];
                                let end = range['end'];
                                range_text = "between";
                                number = start + "% to " + end + "%";
                                required_field = Object.keys(total_data).filter((field) => {
                                    return ((total_data[field] / total_target_column_values) / 100) >= start && ((total_data[field] / total_target_column_values) / 100) <= end;
                                });
                            }

                            let sentence = "There is no " + column_name + " is having " + range_text + " " + number + " in " + target_column['key'];
                            if (required_field.length > 0) {
                                sentence = required_field.join(", ") + " are having " + range_text + " " + number + " in " + target_column['key'];
                            }
                            user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                        }
                        SESSIONS.storeContext(session_id, user_context);
                        callback();
                    }
                });
            },
            getColumnValuesTogetherFormPercentageOfObservations : (session_id, callback)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                let number = entities['number'][0];

                let signal_name = user_context['signal_name'];
                let auth_token = user_context['auth_token'];
                INPUT_DATA.getOverView(signal_name, auth_token, (error, overview)=> {
                    if(error){
                        user_context['messages'].push(BOT_MESSAGES.textMessage("Error while getting data from Signal"));
                    }
                    else {
                        console.log(JSON.stringify(overview, null, 2));
                        if (overview['error_info']['status']) {
                            let msg = BOT_MESSAGES.textMessage("I'm sorry, I haven't found any answer for this question.");
                            user_context['messages'].push(msg);
                        }
                        else {
                            let overview_data = overview['data'];
                            let target_values = Object.keys(overview_data);
                            let total_observations = 0;
                            target_values.forEach((value)=>{
                                total_observations += overview_data[value];
                            });
                            let all_combinations = getCombinations(target_values);
                            // console.log("All Combinations : ", all_combinations);
                            let response_data = [];
                            all_combinations.forEach((comb_list)=>{
                                let list_total = 0;
                                comb_list.forEach((value)=>{
                                    list_total += overview_data[value];
                                });
                                let percentage_of_combination = (list_total/total_observations)*100;
                                if(percentage_of_combination>=number){
                                    response_data.push({"percentage": percentage_of_combination, "combination" : comb_list});
                                }
                            });
                            try{
                                response_data = response_data.sort((a, b)=>{
                                    return a['percentage'] - b['percentage'];
                                });
                            }catch (e) {}
                            if(response_data.length>0){
                                let combo_values = response_data[0]['combination'];
                                let sentence = combo_values.join(", ")+" "+(combo_values.length>1?"are together":"is")+" constitute "+number+"% of observations.";
                                user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                            }
                            else{
                                let sentence = "There are no values together consistute "+number+"% of observations.";
                                user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                            }
                        }
                    }
                    SESSIONS.storeContext(session_id, user_context);
                    callback();
                });
            }
        },
        previousQuestionActions : {
            welcomeMessage : (session_id)=> {
                let user_context = SESSIONS.getContext(session_id);
                let entities = user_context['current_entities'];
                console.log("Previous question needed entities : ");
                console.log(entities['previous_question_needed_entities']);
                if(entities.hasOwnProperty('previous_question_needed_entities') && entities["previous_question_needed_entities"].indexOf('okay')!=-1) {
                    user_context["previous_question"] = undefined;
                    let sentence = "You can ask me questions like:\n\n"+

                        "Overview -\n"+
                        "1. Number of observations in analysis\n"+
                        "2. Percentage churn in virginia\n"+
                        "3. State with highest churn\n"+
                        "4. Distribution of customer status in Ohio\n"+
                        "5. How many churn observations are in analysis\n\n"+

                        "Association\n"+
                        "1. How status is effected by other variables\n"+
                        "2. How credit rating is effecting customer status\n\n"+

                        "Prediction\n"+
                        "1. How can we predict observations that are going to churn\n"+
                        "2. How can we predict observations that are going to churn from Virginia";
                    user_context['messages'].push(BOT_MESSAGES.textMessage(sentence));
                }
                SESSIONS.storeContext(session_id, user_context);
            }
        }
    };
    return supporter_functions;
})();