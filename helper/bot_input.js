module.exports = (function () {
    const request = require('request');

    let getUserAuthToken = (username, password, callback)=>{
        let options = {
            method: 'POST',
            url: 'http://madvisor.marlabsai.com/api-token-auth/',
            headers: {
                'content-type': 'application/json'
            },
            body: {
                username: username,
                password: password
            },
            json : true
        };
        request(options, function (error, response, body) {
            // console.log(error, body);
            callback(error, body['token']);
        });
    };
    /*
    * this function is used to get the signal data
	* signal_name(string), auth_token(string), callback(function)
    */
    let getSignalData = (signal_name, auth_token, callback)=>{
        // console.log(signal_name);
        // console.log(auth_token);
        let options = {
            method: 'GET',
            url: 'http://madvisor.marlabsai.com/api/signals/'+signal_name+'/',
            headers: {
                authorization: auth_token
            },
            json : true
        };
        request(options, function (error, response, body) {
            console.log("Session Status : ",body['status']);
            if (body['status']==false){
                callback(true, {});
            }
            else {
                callback(false, body);
            }
        });
    };

    /*
    * this function is used get required slug object in analyzed data
    * @params data (object), slug (string)
    * @return required_slug_object_details (object)
    */
    let getSlugObject = (data, slug)=> {
        let search_objects = [];
        if(data.hasOwnProperty('listOfNodes')) {
            let listOfNodes = data['listOfNodes'];
            // including nodes into search object
            search_objects = search_objects.concat(listOfNodes);
        }
        if(data.hasOwnProperty('listOfCards')) {
            let listOfCards = data['listOfCards'];
            // including cards into search object
            search_objects = search_objects.concat(listOfCards);
        }
        // getting required_slug object in search_object
        search_objects = search_objects.filter((slug_obj)=>{
            let required_slug = slug_obj['slug'];
            required_slug = required_slug.split('-');
            required_slug.pop();
            required_slug = required_slug.join('-');
            return required_slug === slug;
        });
        let status = search_objects.length>0;
        let required_slug_object = {};
        if(status)
            required_slug_object = search_objects[0];
        let required_slug_object_details = {"status" : status, "required_slug_object" : required_slug_object};
        return required_slug_object_details;
    };

    /*
    * this function is used to extract the required slug object from analyzed data
    * @params analyzed_data(object), needs(array)
    * @return required_slug_object(object)
    */
    let getRequiredSlugData = (analyzed_data, slugs)=>{
        let required_slug_object = JSON.parse(JSON.stringify(analyzed_data));
        let is_slug_object_found = false;
        slugs.forEach((slug)=> {
            // getting required slug object from analyzed data
            let slug_object = getSlugObject(required_slug_object, slug);
            required_slug_object = slug_object.required_slug_object;
            is_slug_object_found = slug_object.status;
            if(!is_slug_object_found)
                return true;
        });
        return required_slug_object;
    };

    let removeTagsInText = (data)=>{
        data = data.split("<");
        data = data.map((sentence)=> {
            sentence = sentence.substring(sentence.indexOf(">") + 1);
            return sentence;
        });
        let combined_data = data.join("");
        return combined_data.trim();
    };
    /*
    * this function is used to get all text in analysed data
    * @params user_needs (array)
    * @return user_answer (string)
    */
    let getSlugText = (cardData)=>{
        // filtering all html dataTypes
        cardData = cardData.filter((tag_obj)=>{
            return tag_obj['dataType'] === 'html';
        });

        // getting the tag data in card data
        cardData = cardData.map((tag_obj)=> {
            return tag_obj['data'].trim();
        });

        let template_data = [];
        // getting only text from tag
        cardData.forEach((data)=>{
            template_data.push(removeTagsInText(data));
        });
        return template_data.join("\n\n");
    };


    let input_data_functions = {
        getUserAuthToken : getUserAuthToken,
        getSignalData : getSignalData,
        /*
        * this function is used to get the dataset details
        * @params signal_name(string), auth_token(string), callback(function)
        * @return input_dataset (object)
        */
        getDataSet : (signal_name, auth_token, callback)=> {
            let input_dataset = {}, type="", target_column="";
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    target_column = signal_data['target_column'].toLowerCase();
                    target_column = target_column.split(' ').join('-');
                    type = signal_data['type'];

                    input_dataset[target_column] = {
                        data_type: 'string',
                        values: [],
                        target_status: true
                    };
                    let analyzed_data = JSON.parse(JSON.stringify(signal_data['data']));

                    let overview_slugs = ['overview', 'distribution-of-'+target_column];
                    let overview_info = getRequiredSlugData(analyzed_data, overview_slugs);
                    let overview_card_data = overview_info['cardData'];
                    overview_card_data = overview_card_data.filter((card)=>{
                        return card['dataType'] == 'c3Chart';
                    });
                    let overview_chart_data = overview_card_data[0]['data']['xdata'];

                    input_dataset[target_column]['values'] = overview_chart_data.map((value)=>{
                        value = value.toLowerCase();
                        return value;
                    });

                    if (type == 'dimension') {
                        let overview_slugs = ['overview', 'distribution-of-'+target_column];
                        let overview_info = getRequiredSlugData(analyzed_data, overview_slugs);
                        let overview_card_data = overview_info['cardData'];
                        overview_card_data = overview_card_data.filter((card)=>{
                            return card['dataType'] == 'c3Chart';
                        });
                        let overview_chart_data = overview_card_data[0]['data']['xdata'];

                        input_dataset[target_column]['values'] = overview_chart_data.map((value)=>{
                            value = value.toLowerCase();
                            return value;
                        });

                        let slug_object_info = getSlugObject(analyzed_data, 'association');
                        let association = slug_object_info['required_slug_object'];
                        let listOfNodes = association['listOfNodes'];
                        listOfNodes.forEach((node) => {
                            let slug = node['slug'];
                            let splitted_slug = slug.split('-');
                            splitted_slug.pop();
                            let column_name = splitted_slug.join('-');
                            input_dataset[column_name] = {
                                data_type: 'string',
                                values: [],
                                target_status: false
                            };
                            let required_slug = column_name + '-relationship-with-' + target_column;
                            let relation_object_info = getSlugObject(node, required_slug);
                            let cardData = relation_object_info['required_slug_object']['cardData'];
                            if (!cardData) cardData = [];
                            cardData = cardData.filter((card) => {
                                return card['dataType'] === 'toggle';
                            });
                            if (cardData.length > 0) {
                                let tableData = cardData[0]['data']['toggleoff']['data']['tableData'];
                                tableData.forEach((item, idx) => {
                                    if (idx != 0) {
                                        let required_item = item[0].toLowerCase();
                                        if (input_dataset[column_name]['values'].indexOf(required_item) == -1) {
                                            input_dataset[column_name]['values'].push(required_item);
                                        }
                                    }
                                });
                            }
                        });
                    }
                    else {
                        let influencer_slug_info = getSlugObject(analyzed_data, 'influencers');
                        let key_influencers_slug_info = getSlugObject(influencer_slug_info['required_slug_object'], 'key-influencers');
                        let key_influencers_card_data = key_influencers_slug_info['required_slug_object']['cardData'];
                        key_influencers_card_data = key_influencers_card_data.filter((card) => {
                            return card['dataType'] == 'c3Chart';
                        });
                        // console.log(JSON.stringify(key_influencers_card_data[0], null, 2));
                        let influencer_data = key_influencers_card_data[0]['data']['chart_c3']['data']['columns'][0];
                        influencer_data.forEach((value, idx) => {
                            if(idx!=0) {
                                value = value.toLowerCase();
                                input_dataset[value] = {
                                    data_type: 'integer',
                                    values: [],
                                    target_status: false
                                };
                            }
                        });
                        let target_slug_info = getSlugObject(analyzed_data, 'overview');
                        let overview = getSlugObject(target_slug_info['required_slug_object'], 'distribution-of-' + target_column);
                        let cardData = overview['required_slug_object']['cardData'];
                        cardData = cardData.filter((card) => {
                            return card['dataType'] == 'c3Chart';
                        });
                        let overview_data = cardData[0]['data']['xdata'];
                        input_dataset[target_column]['values'] = overview_data.map((value) => {
                            return value.toLowerCase();
                        });

                        let slug_object_info = getSlugObject(analyzed_data, 'performance');
                        let performance = slug_object_info['required_slug_object'];
                        let listOfNodes = performance['listOfNodes'];
                        listOfNodes.forEach((node) => {
                            let slug = node['slug'];
                            let splitted_slug = slug.split('-');
                            splitted_slug.pop();
                            let column_name = splitted_slug.join('-');
                            input_dataset[column_name] = {
                                data_type: 'string',
                                values: [],
                                target_status: false
                            };
                            let required_slug = 'impact-on-' + target_column;
                            let relation_object_info = getSlugObject(node, required_slug);
                            let cardData = relation_object_info['required_slug_object']['cardData'];
                            cardData = cardData.filter((card) => {
                                return card['dataType'] == 'c3Chart';
                            });
                            let table_data = cardData[0]['data']['xdata'];
                            input_dataset[column_name]['values'] = table_data.map((value) => {
                                return value.toLowerCase();
                            });
                        });
                    }
                }catch(e){console.log(e);}
                // console.log(JSON.stringify(input_dataset, null, 2));
                callback(error, {"dataset": input_dataset, "type" : type, "target_column" : target_column});
            });
        },
        getOverAllSummary : (signal_name, auth_token, callback)=> {
            let summary = {error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_column = signal_data['target_column'].toLowerCase();
                    target_column = target_column.split(' ').join('-');
                    let type = signal_data['type'];
                    let analyzed_data = JSON.parse(JSON.stringify(signal_data['data']));

                    let slug_object_needs = ['overall-summary-card'];
                    if (type == 'measure') {
                        slug_object_needs = ['summary'];
                    }
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);
                    let cardData = required_slug_object['cardData'];
                    summary['noOfMeasures'] = cardData['noOfMeasures'];
                    summary['noOfTimeDimensions'] = cardData['noOfTimeDimensions'];
                    summary['noOfDimensions'] = cardData['noOfDimensions'];

                    let slug_text = cardData['summaryHtml'][0]['data'];
                    let extract_variables = slug_text.split('<b>');
                    let total_variables = extract_variables[1].split('</b>')[0];
                    let total_observations = extract_variables[2].split('</b>')[0];

                    summary['totalVariables'] = parseInt(total_variables.trim());
                    summary['totalObservations'] = total_observations;
                }catch (e) {
                    summary['error_info']['status'] = true;
                    summary['error_info']['message'] = 'Not found the overall summary in the signal dataset';
                }
                callback(error, summary);
            });
        },
        getOverView : (signal_name, auth_token, callback)=> {
            let overview = { 'text' : {}, 'data' : {}, error_info : { status : false } };
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];
                    overview['type'] = type;

                    let slug_object_needs = ['overview', 'distribution-of-' + target_name];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);
                    if (Object.keys(required_slug_object).length > 0 && required_slug_object.hasOwnProperty('cardData')) {
                        let cardData = required_slug_object['cardData'];
                        let slug_text = getSlugText(cardData);
                        slug_text = slug_text.trim();
                        let splitted_text = slug_text.split('\n\n');
                        // console.log(splitted_text);

                        overview['text']['about'] = splitted_text[0];
                        overview['text']['distribution'] = splitted_text[splitted_text.length-1].split('observations').join('observations, ');
                        let c3Chart = cardData.filter((card) => {
                            return card['dataType'] == 'c3Chart';
                        });
                        if (c3Chart.length > 0) {
                            let chart_data = c3Chart[0]['data']['table_c3'];

                            let keys = chart_data[0];
                            let count_details = chart_data[1];

                            keys.forEach((key, idx) => {
                                if (idx != 0) {
                                    overview['data'][key.toLowerCase()] = count_details[idx];
                                }
                            });
                        }
                    }
                }catch (e) {
                    overview['error_info']['status'] = true;
                    console.log(e);
                }
                callback(error, overview);
            });
        },
        getKeyInfluencers : (signal_name, auth_token, callback)=> {
            let key_influencers = {effect_size: {}, error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];

                    let slug_object_needs = ['association', 'key-influencers'];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    if (Object.keys(required_slug_object).length > 0 && required_slug_object.hasOwnProperty('cardData')) {
                        let cardData = required_slug_object['cardData'];
                        let slug_text = getSlugText(cardData);

                        let splited_slug_text = slug_text.split(".");
                        // console.log(splited_slug_text);
                        splited_slug_text.pop();
                        splited_slug_text.pop();
                        splited_slug_text.pop();
                        slug_text = splited_slug_text.join('.');
                        splited_slug_text = slug_text.split('\n\n');
                        splited_slug_text.shift();
                        key_influencers['text'] = splited_slug_text.join("\n\n");

                        let c3Chart = cardData.filter((card) => {
                            return card['dataType'] == 'c3Chart';
                        });
                        if (c3Chart.length > 0) {
                            let chart_data = c3Chart[0]['data']['table_c3'];
                            let chartInfo = c3Chart[0]['chartInfo'];

                            let count_details = chart_data[1];
                            let keys = chart_data[0];
                            keys.forEach((key, idx) => {
                                key = key.toLowerCase();
                                key = key.split(' ').join('-');
                                if (idx != 0) {
                                    key_influencers['effect_size'][key] = count_details[idx];
                                }
                            });
                            let statistical_info = {};
                            chartInfo.forEach((chart_data) => {
                                let splited_data = chart_data.split(":");
                                let key = splited_data[0].trim().toLowerCase();
                                let value = splited_data[1].trim().toLowerCase();
                                statistical_info[key] = value;
                            });
                            key_influencers['statistical_info'] = statistical_info;
                        }
                    }
                }catch (e) {
                    key_influencers['error_info']['status'] = true;
                    key_influencers['error_info']['message'] = 'Not found the key influencers in the signal dataset';
                }
                callback(error, key_influencers);
            });
        },
        getColumnRelationshipWithTargetColumn : (signal_name, auth_token, column_name, callback)=> {
            let relationship_data = {text: {}, error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];

                    relationship_data['type'] = type;
                    let slug_object_needs = ['association', column_name, column_name + '-relationship-with-' + target_name];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splited_text = slug_text.split('\n\n');
                    // console.log(splited_text);
                    relationship_data['text']['overview'] = splited_text[2];
                    let key_segment1 = splited_text[3].replace('Key segments of ', '');
                    let splitted_key_segment1 = key_segment1.split('-');
                    key_segment1 = splitted_key_segment1[splitted_key_segment1.length - 1].trim().toLowerCase();
                    let key_segment2 = splited_text[6].replace('Key segments of ', '');
                    let splitted_key_segment2 = key_segment2.split('-');
                    key_segment2 = splitted_key_segment2[splitted_key_segment2.length - 1].trim().toLowerCase();

                    relationship_data['text']['key_segment_of_' + key_segment1] = splited_text[4] + " " + splited_text[5];
                    relationship_data['text']['key_segment_of_' + key_segment2] = splited_text[7] + " " + splited_text[8];

                    let toggleData = cardData.filter((card) => {
                        return card['dataType'] == 'toggle';
                    });

                    let count_data = toggleData[0]['data']['toggleoff']['data']['tableData'];
                    let percentage_data = toggleData[0]['data']['toggleon']['data']['tableData'];

                    relationship_data['data'] = {"count": {}, "percentage": {}};
                    count_data.forEach((data, count_idx) => {
                        data.forEach((column, idx) => {
                            if (count_idx == 0 && idx != 0) {
                                relationship_data['data']['count'][column.toLowerCase()] = {};
                            }
                            else if (idx != 0) {
                                relationship_data['data']['count'][count_data[0][idx].toLowerCase()][data[0].toLowerCase()] = column;
                            }
                        });
                    });
                    percentage_data.forEach((data, percentage_idx) => {
                        data.forEach((column, idx) => {
                            if (percentage_idx == 0 && idx != 0) {
                                relationship_data['data']['percentage'][column.toLowerCase()] = {};
                            }
                            else if (idx != 0) {
                                relationship_data['data']['percentage'][percentage_data[0][idx].toLowerCase()][data[0].toLowerCase()] = column;
                            }
                        });
                    });
                }catch (e) {
                    relationship_data['error_info']['status'] = true;
                    relationship_data['error_info']['message'] = 'Not found the required answer in the signal dataset';
                }
                callback(error, relationship_data);
            });
        },
        getColumnDistributionOfTargetColumnValue : (signal_name, auth_token, column_name, target_column_value, callback)=> {
            let distribution_data = {"data": {"total": {}, "percentage": {}}, error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];

                    let slug_object_needs = ['association', column_name, column_name + '-distribution-of-' + target_column_value];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);
                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splited_text = slug_text.split('\n\n');
                    // console.log(splited_text);

                    let distribution_text = splited_text[1];
                    let key_factors = splited_text[2].replace('Key Factors influencing ', '');
                    let split_key_factors = key_factors.split('-');
                    key_factors = split_key_factors[split_key_factors.length - 1].toLowerCase().trim();
                    distribution_data['text'] = {
                        'distribution': distribution_text
                    };
                    distribution_data['text'][key_factors] = splited_text[3] + " " + splited_text[4];

                    let c3Chart = cardData.filter((card) => {
                        return card['dataType'] == 'c3Chart';
                    });

                    let column_value_data = c3Chart[0]['data']['chart_c3']['data']['columns'];
                    let percentage_data = column_value_data[0];
                    let total_data = column_value_data[1];
                    let keys = column_value_data[2];

                    percentage_data.forEach((percentage, idx) => {
                        if (idx != 0) {
                            distribution_data['data']["total"][keys[idx].toLowerCase()] = total_data[idx];
                            distribution_data['data']["percentage"][keys[idx].toLowerCase()] = Math.round(percentage * 100) / 100;
                        }
                    });
                }catch (e) {
                    distribution_data['error_info']['status'] = true;
                }
                callback(error, distribution_data);
            });
        },
        getPredictions : (signal_name, auth_token, callback)=> {
            let prediction_data = { "data" : {}, "text" : {}, "prediction" : {}, error_info : { status : false } };
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];

                    let slug_object_needs = ['prediction', 'predicting-key-drivers-of-' + target_name];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splited_text = slug_text.split('\n\n');

                    let strong_signals = splited_text[2].split('Strong Signals')[0];
                    strong_signals = parseInt(strong_signals);
                    let mixed_signals = splited_text[3].split('Mixed Signals')[0];
                    mixed_signals = parseInt(mixed_signals);

                    prediction_data['data']['strong_signals'] = strong_signals;
                    prediction_data['data']['mixed_signals'] = mixed_signals;

                    let table_obj = cardData.filter((card) => {
                        return card['dataType'] == 'table';
                    });
                    let tableData = table_obj[0]['data']['tableData'];
                    // console.log(tableData);
                    tableData.forEach((data, idx) => {
                        if (idx != 0) {
                            let rule = removeTagsInText(data[0]);
                            let probability = data[1].replace('%', '');
                            let field = data[2].toLowerCase();
                            let frequency = data[3];

                            if (!prediction_data['prediction'].hasOwnProperty(field)) {
                                prediction_data['prediction'][field] = [];
                            }
                            let obj = {
                                "rule": rule,
                                "probability": parseInt(probability),
                                "frequency": frequency
                            };
                            prediction_data['prediction'][field].push(obj);
                        }
                    });
                }catch (e) {
                    prediction_data['error_info']["status"] = true;
                }
                callback(error, prediction_data);
            });
        },
        getTrends : (signal_name, auth_token, callback)=>{
            let trend_info = { data:{}, text:{}, error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];

                    let slug_object_needs = ['trend', 'trend-analysis'];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);
                    if (Object.keys(required_slug_object).length > 0 && required_slug_object.hasOwnProperty('cardData')) {
                        let cardData = required_slug_object['cardData'];
                        let slug_text = getSlugText(cardData);

                        let splited_slug_text = slug_text.split("\n\n");
                        // console.log(splited_slug_text);
                        let growth_details = splited_slug_text[2].split('.');
                        growth_details.splice(0,1);
                        trend_info['text']['growth_details'] = growth_details.join('.');

                        let highest_result_info = splited_slug_text[7].split('.');
                        trend_info['text']['highest_points'] = highest_result_info.splice(0, 1).join(".")+".";
                        trend_info['text']['highest_point_reason'] = highest_result_info.join(".")+".";

                        let lowest_result_info = splited_slug_text[8].split('.');
                        trend_info['text']['lowest_points'] = lowest_result_info.splice(0, 2).join(".").replace('However, ', '');
                        trend_info['text']['lowest_point_reason'] = lowest_result_info.join(".");

                        trend_info['text']['significant_factors_that_increase_target_column'] = splited_slug_text[10];
                        trend_info['text']['significant_factors_that_drag_target_column'] = splited_slug_text[12];

                        let c3Chart = cardData.filter((card) => {
                            return card['dataType'] == 'c3Chart';
                        });
                        let data = c3Chart[0]['data']['chart_c3']['data']['columns'];
                        let actual_x = data[0];
                        let actual = data[1];
                        let predicted_x = data[2];
                        let predicted = data[3];
                        actual_x.forEach((act_x_value, idx) => {
                            if (idx != 0) {
                                let pre_x = predicted_x.length > idx ? predicted_x[idx] : 'unknown';
                                let pred = predicted.length > idx ? predicted[idx] : 0;

                                trend_info['data'][act_x_value.toLowerCase()] = {
                                    "actual": actual[idx],
                                    "predicted_x": pre_x.toLowerCase(),
                                    "predicted": pred
                                };
                            }
                        });
                    }
                    else {
                        trend_info['error_info']["status"] = true;
                    }
                }catch (e) {
                    trend_info['error_info']["status"] = true;
                }
                callback(error, trend_info);
            });
        },
        getKeyTakeAways : (signal_name, auth_token, callback)=> {
            let key_take_aways = {
                "overview" : {},
                "associations" : "",
                "predictions" : {},
                error_info : { status : false }
            };
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];

                    let overview = ['overview', 'distribution-of-' + target_name];
                    let associations = ['association', 'key-influencers'];
                    let predictions = ['prediction', 'predicting-key-drivers-of-' + target_name];

                    let overview_slug_object = getRequiredSlugData(analyzed_data, overview);
                    let associations_slug_object = getRequiredSlugData(analyzed_data, associations);
                    let prediction_slug_object = getRequiredSlugData(analyzed_data, predictions);

                    let overview_card_data = overview_slug_object['cardData'];
                    let overview_slug_text = getSlugText(overview_card_data);
                    if (type == 'dimension') {
                        let splitted_text = overview_slug_text.split('\n\n');
                        key_take_aways['overview']['about'] = splitted_text[0];
                        key_take_aways['overview']['distribution'] = splitted_text[2].split('observations').join('observations, ');
                    }

                    let association_card_data = associations_slug_object['cardData'];
                    let association_slug_text = getSlugText(association_card_data);
                    if (type == 'dimension') {
                        let splited_slug_text = association_slug_text.split(".");
                        splited_slug_text.pop();
                        splited_slug_text.pop();
                        splited_slug_text.pop();
                        association_slug_text = splited_slug_text.join('.');
                        splited_slug_text = association_slug_text.split('\n\n');
                        splited_slug_text.shift();
                        key_take_aways['associations'] = splited_slug_text.join("\n\n");
                    }

                    let prediction_card_data = prediction_slug_object['cardData'];
                    let prediction_slug_text = getSlugText(prediction_card_data);
                    if (type == 'dimension') {
                        let splitted_text = prediction_slug_text.split('\n\n');
                    }
                }catch (e) {
                    key_take_aways['error_info']['status'] = true;
                }
                callback(error, key_take_aways);
            });
        },
        getOverViewOfMeasureAnalysis : (signal_name, auth_token, callback)=> {
            let overview = { 'text' : {}, 'data' : {}, 'type' : "", "table_data" : {}, error_info : { status : false } };
            getSignalData(signal_name, auth_token, (error, signal_data) => {
                try {
                    let target_column = signal_data['target_column'].toLowerCase();
                    target_column = target_column.split(' ').join('-');
                    let analyzed_data = JSON.parse(JSON.stringify(signal_data['data']));

                    let slug_object_needs = ['overview', 'distribution-of-' + target_column];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    slug_text = slug_text.trim();
                    let splitted_text = slug_text.split('\n\n');

                    let distribution_of_target_column = splitted_text[0].trim();
                    overview['text']['distribution'] = distribution_of_target_column;
                    let splited_data = distribution_of_target_column.split('. ');
                    console.log(splited_data);
                    let outtliers_text = splited_data[2];
                    outtliers_text = outtliers_text.split('observations and');
                    overview['text']['outliers_info'] = outtliers_text[1];

                    let c3Chart = cardData.filter((card) => {
                        return card['dataType'] == 'c3Chart';
                    });
                    if (c3Chart.length > 0) {
                        let chart_data = c3Chart[0]['data']['table_c3'];

                        let keys = chart_data[0];
                        let count_details = chart_data[1];

                        keys.forEach((key, idx) => {
                            if (idx != 0) {
                                overview['data'][key.toLowerCase()] = count_details[idx];
                            }
                        });
                    }

                    let tableData = cardData.filter((card)=>{
                        return card['dataType'] == 'table';
                    });
                    let required_data = tableData[0]['data']['tableData'];
                    required_data[0].forEach((key, idx)=>{
                        key = key.toLowerCase();
                        let value = required_data[1][idx];
                        overview['table_data'][key] = value;
                    });
                }catch (e) {
                    console.log(e);
                    overview['error_info']['status'] = true;
                }
                callback(error, overview);
            });
        },
        getPerformanceOfMeasureAnalysis : (signal_name, auth_token, callback)=> {
            let performance_data = { "text" : {}, "effect_size" : {}, error_info : { status : false } };
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];

                    let performance_needs = ['performance', 'overview-of-key-factors'];
                    let required_slug_object = getRequiredSlugData(analyzed_data, performance_needs);
                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splitted_text = slug_text.split('\n\n');
                    performance_data['text']['overview'] = splitted_text[0];

                    let c3Chart = cardData.filter((card) => {
                        return card['dataType'] == 'c3Chart';
                    });
                    if (c3Chart.length > 0) {
                        let chart_data = c3Chart[0]['data']['table_c3'];
                        let chartInfo = c3Chart[0]['chartInfo'];

                        let count_details = chart_data[1];
                        let keys = chart_data[0];
                        keys.forEach((key, idx) => {
                            key = key.toLowerCase();
                            key = key.split(' ').join('-');
                            if (idx != 0) {
                                performance_data['effect_size'][key] = count_details[idx];
                            }
                        });
                        let statistical_info = {};
                        chartInfo.forEach((chart_data) => {
                            let splited_data = chart_data.split(":");
                            let key = splited_data[0].trim().toLowerCase();
                            let value = splited_data[1].trim().toLowerCase();
                            statistical_info[key] = value;
                        });
                        performance_data['statistical_info'] = statistical_info;
                    }

                }catch (e) {
                    console.log(e);
                    performance_data['error_info']['status'] = true;
                }
                callback(error, performance_data);
            });
        },
        getImpactOfColumnOnTargetColumnInMeasureAnalysis : (signal_name, auth_token, column_name, callback)=> {
            let impact_data = {text: {}, type: "", data : {"total" : {}, "average" : {}}, error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];
                    impact_data['type'] = type;

                    let slug_object_needs = ['performance', column_name, 'impact-on-' + target_name];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splited_text = slug_text.split('\n\n');

                    let about_text = splited_text[1];
                    impact_data['text']['about'] = about_text;
                    let splited_about_text = about_text.split('. ');
                    impact_data['text']['top_observations'] = splited_about_text.splice(1,1).join('. ');
                    impact_data['text']['lowest_observations'] = splited_about_text.pop().replace('On the other hand,', '');
                    impact_data['text']['key_factors'] = splited_text[3]+"\n"+splited_text[4];
                    if(splited_text.length>5){
                        let splited_cv_performance_text = splited_text[5].split("'")[0];
                        impact_data['performance_overtime'] = {};
                        impact_data['performance_overtime'][splited_cv_performance_text.toLowerCase()] = splited_text[6];
                    }
                    let c3Chart = cardData.filter((card)=> {
                        return card['dataType'] === 'c3Chart';
                    });
                    let table_c3 = c3Chart[0]['data']['table_c3'];
                    let chartInfo = c3Chart[0]['chartInfo'];

                    let keys = table_c3[0];
                    let total_data = table_c3[1];
                    let average_data = table_c3[2];
                    keys.forEach((key, idx)=> {
                        key = key.toLowerCase();
                        if(idx!=0){
                            impact_data['data']['total'][key] = total_data[idx];
                            impact_data['data']['average'][key] = average_data[idx];
                        }
                    });
                }catch (e) {
                    impact_data['error_info']['status'] = true;
                }
                callback(error, impact_data);
            });
        },
        getImpactOfMeasureOnTargetColumnInMeasureAnalysis : (signal_name, auth_token, column_name, callback)=> {
            let impact_data = {text: {}, type: "", data : {},error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];
                    impact_data['type'] = type;

                    let slug_object_needs = ['influencers', column_name, column_name+'-impact-on-' + target_name];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splited_text = slug_text.split('\n\n');

                    impact_data['text']['about'] = splited_text[2];
                    impact_data['text']['sensitivity_analysis'] = splited_text[4];
                    impact_data['text']['high_target_column_with_high_column'] = splited_text[5];
                    impact_data['text']['low_target_column_with_low_column'] = splited_text[6];
                    impact_data['text']['high_target_column_with_low_column'] = splited_text[7];
                    impact_data['text']['low_target_column_with_high_column'] = splited_text[8];

                }catch (e) {
                    impact_data['error_info']['status'] = true;
                }
                callback(error, impact_data);
            });
        },
        getColumnDecisionMatrix : (signal_name, auth_token, column_name, callback)=> {
            let decision_matrix_data = {text: {},  data : {},error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];
                    decision_matrix_data['type'] = type;

                    let slug_object_needs = ['performance', column_name, column_name + '-decision-matrix'];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);
                    let splited_text = slug_text.toLowerCase().split('\n\n');

                    let required_text = splited_text[1];
                    let splited_required_text = required_text.split('playing safe -');
                    let playing_safe = splited_required_text[1].trim();
                    splited_required_text = splited_required_text[0].split('opportunity bay -');
                    let opportunity_bay = splited_required_text[1].trim();
                    splited_required_text = splited_required_text[0].split('leaders club -');
                    let leaders_club = splited_required_text[1].trim();

                    decision_matrix_data['text']['leaders_club'] = leaders_club;
                    decision_matrix_data['text']['opportunity_bay'] = opportunity_bay;
                    decision_matrix_data['text']['playing_safe'] = playing_safe;

                    let c3Chart = cardData.filter((card)=> {
                        return card['dataType'] === 'c3Chart';
                    });
                    let table_c3 = c3Chart[0]['data']['table_c3'];
                    let chartInfo = c3Chart[0]['chartInfo'];

                    let categories = table_c3[3];
                    let keys = table_c3[2];
                    let shares = table_c3[1];
                    let growth = table_c3[0];
                    keys.forEach((key, idx)=> {
                        if(idx!=0){
                            key = key.toLowerCase();
                            let category = categories[idx].toLowerCase();
                            if(!decision_matrix_data['data'].hasOwnProperty(category))
                                decision_matrix_data['data'][category] = {};
                            if(!decision_matrix_data['data'][category].hasOwnProperty(key)) {
                                decision_matrix_data['data'][category][key] = {
                                    "growth" : growth[idx],
                                    "share" : shares[idx]
                                };
                            }
                        }
                    });
                }catch (e) {
                    console.log(e);
                    decision_matrix_data['error_info']['status'] = true;
                }
                callback(error, decision_matrix_data);
            });
        },
        getKeyInfluencersInMeasureAnalysis : (signal_name, auth_token, callback)=> {
            let influence_data = {text: {},  effect_size : {}, error_info : { status : false }};
            getSignalData(signal_name, auth_token, (error, signal_data)=> {
                try {
                    let target_name = signal_data['target_column'].toLowerCase();
                    target_name = target_name.split(' ').join('-');
                    let analyzed_data = signal_data['data'];
                    let type = signal_data['type'];
                    influence_data['type'] = type;

                    let slug_object_needs = ['influencers', 'key-influencers'];
                    let required_slug_object = getRequiredSlugData(analyzed_data, slug_object_needs);

                    let cardData = required_slug_object['cardData'];
                    let slug_text = getSlugText(cardData);

                    let splited_slug_text = slug_text.split("\n\n");
                    let key_measures = splited_slug_text[1].split('.');
                    key_measures.pop();
                    key_measures.pop();
                    key_measures.pop();
                    key_measures.pop();
                    key_measures.pop();
                    key_measures = key_measures.join('.');
                    influence_data['text']['key_measures'] = key_measures;

                    let c3Chart = cardData.filter((card) => {
                        return card['dataType'] == 'c3Chart';
                    });
                    if (c3Chart.length > 0) {
                        let chart_data = c3Chart[0]['data']['table_c3'];
                        let chartInfo = c3Chart[0]['chartInfo'];

                        let count_details = chart_data[1];
                        let keys = chart_data[0];
                        keys.forEach((key, idx) => {
                            key = key.toLowerCase();
                            key = key.split(' ').join('-');
                            if (idx != 0) {
                                influence_data['effect_size'][key] = count_details[idx];
                            }
                        });
                        let statistical_info = {};
                        chartInfo.forEach((chart_data) => {
                            let splited_data = chart_data.split(":");
                            let key = splited_data[0].trim().toLowerCase();
                            let value = splited_data[1].trim().toLowerCase();
                            statistical_info[key] = value;
                        });
                        influence_data['statistical_info'] = statistical_info;
                    }
                }catch (e) {
                    influence_data['error_info']['status'] = true;
                }
                callback(error, influence_data);
            });
        }
    };
    return input_data_functions;
})();