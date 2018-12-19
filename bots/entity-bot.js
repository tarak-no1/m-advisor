module.exports = (function () {
    const WIT_API = require('../helper/wit-ai');
    const INPUT_DATA = require('../helper/bot_input');

    let SpellCorrector = require('spelling-corrector');
    let spellCorrector = new SpellCorrector();
    spellCorrector.loadDictionary();

    let correctSpelling = (message)=> {
        message = message.toLowerCase().trim();
        let splitted_sentence = message.split(' ');
        let corrections = [];
        splitted_sentence.forEach((word)=>{
            let special_characters = word.replace(/[A-Z0-9a-z]/g, '').trim();
            let numbers = word.replace(/[^0-9]/g, '').trim();
            // console.log("Word : ",word, "\n\tSpecial : ",special_characters, "\n\tNumbers: ",numbers);
            if(special_characters.length==0 && numbers.length==0)
                corrections.push(spellCorrector.correct(word));
            else
                corrections.push(word);
        });
        return corrections.join(' ');
    };
    /*
    * this function is used to clean the message
    * @params message (string)
    * @return cleaned_message (string)
    */
    let cleanSentence = (message)=> {
        let cleaned_message = message.toLowerCase();
        // removing special characters
        // message = message.replace(/[^A-Z0-9a-z]+/ig, ' ');
        cleaned_message = cleaned_message.split("-").join(" ");
        cleaned_message = cleaned_message.split("?").join(" ");
        cleaned_message = cleaned_message.split('"').join("");
        cleaned_message = cleaned_message.split(',').join(" ");
        cleaned_message = cleaned_message.split('+').join(" ");
        return cleaned_message.trim();
    };

    /*
    * this function is used to insert data into array if not exists
    * @params array_data (array), value (string or integer or boolean)
    * @return array_data (array)
    */
    let appendDataIfNotExists = (array_data, value)=>{
        // checking whether value is present in array_data or not
        if(array_data.indexOf(value)==-1){
            array_data.push(value);
        }
        return array_data;
    };
    /*
    * this function is used to give synonyms of the word
    * @params word (string)
    * @return synonyms (array)
    */
    let getWordSynonyms = (word)=>{
        let synonyms = [word];

        // removing the special characters in the word
        let cleaned_word = cleanSentence(word);
        synonyms = appendDataIfNotExists(synonyms, cleaned_word);

        // removing underscores from the word
        let without_underscore_word = word.split('_').join(' ');
        synonyms = appendDataIfNotExists(synonyms, without_underscore_word);

        // remove ',' in the word
        let without_coma_word_without_space = word.split(",").join("");
        synonyms = appendDataIfNotExists(synonyms, without_coma_word_without_space);

        let syn_values = synonyms.concat();
        syn_values.forEach((val)=>{
            val = val.split(' ').join('');
            synonyms = appendDataIfNotExists(synonyms, val);
        });
        syn_values = synonyms.concat();
        syn_values.forEach((val)=>{
            val = val+'s';
            synonyms = appendDataIfNotExists(synonyms, val);
        });
        syn_values.forEach((val)=>{
            val = val+'ed';
            synonyms = appendDataIfNotExists(synonyms, val);
        });
        return synonyms;
    };

    /* this function is used to identify the words in a message
    * @params words (array), message (string)
    * @return identified_word_details (object)
    */
    let wordIndentifier = (words, message)=>{
        // sorting the words based on their lengths in descending order
        try{
            words = words.sort(function(a,b)
            {
                return b.length - a.length;
            });
        }catch(e){}

        let require_values = [];
        for(let i in words) {
            let value = words[i].toLowerCase();
            let value_index = message.indexOf(value);
            // checking whether current word is in the message or not
            if(value_index!=-1) {
                if(value_index==0 && (value_index+value.length)<message.length) { // checking whether current word is present in the starting of the message or not
                    if(message.charAt(value_index+value.length)==" ") {
                        message = message.replace(value,"");
                        require_values.push(words[i]);
                    }
                }
                else if(value_index>0 && (value_index+value.length)==message.length) { // checking whether current word is present in between the message or not
                    if(message.charAt(value_index-1)==" ") {
                        message = message.replace(value,"");
                        require_values.push(words[i]);
                    }
                }
                else if(value_index==0 && (value_index+value.length)==message.length) { // checking whether sentence is equals to current word or not
                    message = message.replace(value,"");
                    require_values.push(words[i]);
                }
                else if(value_index>0 && (value_index+value.length)<message.length) { // checking whether current word is present end of the message or not
                    if(message.charAt(value_index-1)==" " && message.charAt(value_index+value.length)==" ") {
                        message = message.replace(value,"");
                        require_values.push(words[i]);
                    }
                }
            }
        }
        let identified_word_details = {
            values : require_values,
            remaining_message : message
        };
        return identified_word_details;
    };
    /*
    * this function is used to get column entities from the message
    * @params dataset (object), message (string)
    * @return column_entities_details (object)
    */
    let getHeaderEntities = (dataset, message)=> {
        let entities = {};
        let header_synonyms_object = {};
        Object.keys(dataset).forEach((word)=>{
            let synonyms = getWordSynonyms(word);
            synonyms.forEach((syn)=>{
                header_synonyms_object[syn] = word;
            });
        });

        // getting identified column words from the message
        let identified_words = wordIndentifier(Object.keys(header_synonyms_object), message);
        if(identified_words['values'].length>0) {
            identified_words['values'].forEach((word)=> {
                let header = header_synonyms_object[word];
                let target_status = dataset[header]['target_status'];
                let data_type = dataset[header]['data_type'];
                if(target_status){
                    entities['target_column'] = {
                        "key" : header,
                        "data_type" : data_type
                    };
                }
                else {
                    if(!entities.hasOwnProperty('columns')) {
                        entities['columns'] = {};
                    }
                    entities['columns'][header] = {
                        "data_type" : data_type
                    };
                }
            });
            message = identified_words['remaining_message'];
        }
        let column_entities_details = {
            "entities" : entities,
            "message" : message
        };
        return column_entities_details;
    };
    /*
    * this function is used to get column value entities in the message
    * @params dataset (object), message (string)
    * @return column_value_entities_details (object)
    */
    let getColumnValueEntities = (dataset, message)=>{
        let column_value_synonym_object = {};
        Object.keys(dataset).forEach((header)=>{
            let data_type = dataset[header]['data_type'];
            let values = dataset[header]['values'];
            let target_status = dataset[header]['target_status'];
            if(data_type!='integer') {
                dataset[header]['values'].forEach((word) => {
                    let synonyms = getWordSynonyms(word);
                    synonyms.forEach((syn) => {
                        column_value_synonym_object[syn] = {
                            "word": word,
                            "header": header,
                            "target_status": target_status
                        };
                    });
                });
            }
        });
        let entities = {};
        // getting identified column_value entities in the message
        let identified_words = wordIndentifier(Object.keys(column_value_synonym_object), message);
        let tcv_count = 0;
        if(identified_words['values'].length>0){
            message = identified_words['remaining_message'];
            identified_words['values'].forEach((synonym)=>{
                let synonym_data = column_value_synonym_object[synonym];
                let target_status = synonym_data['target_status'];
                if(target_status) {
                    tcv_count++;
                    entities['target_column_value'+tcv_count] = {
                        "key" : synonym_data['word'],
                        "belongs": synonym_data['header']
                    };
                    entities['tcv_count'] = tcv_count;
                }
                else{
                    if(!entities.hasOwnProperty('column_values')){
                        entities['column_values'] = {};
                    }
                    entities['column_values'][synonym_data['word']] = {
                        "belongs": synonym_data['header']
                    };
                }
            });
        }
        let column_value_entities_details = {
            "entities" : entities,
            "message": message
        };
        return column_value_entities_details;
    };
    /*
    * this function is used to get all dataset entities in a message
    * @params message (string)
    * @return dataset_entities (object)
    */
    let getDataSetEntities = (message, signal_name, auth_token, callback)=> {
        // getting data set
        INPUT_DATA.getDataSet(signal_name, auth_token, (error_status, dataset)=>{
            let all_entities = {};
            // console.log("Error status : ",error_status);
            if(!error_status) {
                try {
                    let dataset_type = dataset['type'] + "_analysis";
                    let input_dataset = dataset['dataset'];
                    let dataset_target_column = dataset['target_column'];

                    // getting column entities in the message
                    let header_entities_info = getHeaderEntities(input_dataset, message);
                    message = header_entities_info['message'];

                    // getting column value entities in the message
                    let column_value_entities_info = getColumnValueEntities(input_dataset, message);
                    message = column_value_entities_info['message'];

                    // checking whether entities are having columns and column_values in it or not
                    if (header_entities_info["entities"].hasOwnProperty('columns') && column_value_entities_info['entities'].hasOwnProperty('column_values')) {
                        let columns = header_entities_info['entities']['columns'];
                        let column_values = column_value_entities_info['entities']['column_values'];
                        // removing the column value belonged columns from the column entities
                        Object.keys(column_values).forEach((val) => {
                            let belongs = column_values[val]['belongs'];
                            if (columns.hasOwnProperty(belongs)) {
                                delete columns[belongs];
                            }
                        });
                        header_entities_info['entities']['columns'] = columns;
                        if (Object.keys(columns).length == 0)
                            delete header_entities_info['entities']['columns'];
                    }

                    // checking whether entities are having target column and target_column_value or not
                    if (header_entities_info['entities'].hasOwnProperty('target_column') && column_value_entities_info['entities'].hasOwnProperty('target_column_value')) {
                        // deleting the target column from entities
                        delete header_entities_info['entities']['target_column'];
                    }
                    // combining the column entities and column_value_entities
                    all_entities = Object.assign(header_entities_info['entities'], column_value_entities_info['entities']);
                    all_entities[dataset_type] = true;
                    all_entities['dataset_target_column'] = dataset_target_column;
                }
                catch (e) {
                }
            }
            else{
                all_entities['signal_error']  = true;
            }
            let dataset_entities = {
                "entities": all_entities,
                "message": message
            };
            callback(dataset_entities);
        });
    };

    /*
    * this function is used to clean the wit entities
    * @params entities (object), entity (string)
    * @return val (object)
    */
    let entityValues = (entities, entity)=>{
        // getting all entity values in array format
        const val = entities && entities[entity] &&
            Array.isArray(entities[entity]) &&
            entities[entity].length > 0 &&
            entities[entity].map(function(a){ return a.value});
        if (!val) {
            return null;
        }
        return val;
    };

    /*
    * this function is used to get all wit entities
    * @params message (string), callback (function)
    * @return entities (object)
    */
    let getWitEntities = (message, callback)=> {
        console.log("Before : ", message);
        message = correctSpelling(message.trim());
        console.log("After spell check : ", message);

        // getting entities in message from wit api
        WIT_API.witMessageAPI(message, function (entities) {
            let entity_keys = Object.keys(entities);
            // cleaning the entities
            entity_keys.forEach((entity_name)=>{
                let entity_values = entityValues(entities, entity_name);
                if(entity_values) {
                    entity_values = entity_values.map(function(a){
                        if(typeof a == "string")
                            return a.toLowerCase();
                        return a;
                    });
                }
                else
                {
                    console.log("Error in entity : ",entity_name)
                }
                entities[entity_name.toLowerCase()] = entity_values;
            });
            callback(entities);
        });
    };

    /*
    * this function is used to get range entities in message
    * @params message (string)
    * @return range_entities_details (object)
    */
    let getRangeWords = (message)=>{
        // getting numbers in message
        let numbers_in_msg = message.match(/[-]{0,1}[\d.]*[\d]+/g);
        let no_need_numbers = [], remove_status=true;
        if(numbers_in_msg) {
            numbers_in_msg = numbers_in_msg.map(function (number) {
                let number_str = number.toString();
                let number_length = number_str.length;
                let index_of_number = message.indexOf(number_str);
                if (message[index_of_number + number_length] == 'k') {
                    // message = message.split(number_str + 'k').join(' ');
                    no_need_numbers.push(number_str+'k');
                    number = number * 1000;
                }
                else {
                    // message = message.split(number_str).join(' ');
                    no_need_numbers.push(number_str);
                }
                return number;
            });
        }
        else{
            numbers_in_msg = [];
        }
        let range_entities = {};
        if(numbers_in_msg.length>0) {
            let under_words = wordIndentifier(['under', 'below', 'less than', 'lessthan', 'lowerthan', 'lower than', 'lesser than', 'lesserthan'], message);
            let above_words = wordIndentifier(['above', 'more than', 'morethan', 'higherthan', 'higher than', 'greaterthan', 'greater than'], under_words['remaining_message']);
            let between_words = wordIndentifier(['between', 'to'], above_words['remaining_message']);
            let all_words = [];
            if(under_words['values'].length>0) {
                under_words['values'].forEach(function (word) {
                    message = message.split(word).join(' ');
                });
                range_entities["range"] = {"type":"under"};
                range_entities["range"]['end'] = numbers_in_msg[0];
            }
            else if(above_words['values'].length>0) {
                above_words['values'].forEach(function (word) {
                    message = message.split(word).join(' ');
                });
                range_entities["range"] = {"type":"above"};
                range_entities["range"]['start'] = numbers_in_msg[0];
            }
            else if(between_words['values'].length>0 && numbers_in_msg.length>1) {
                between_words['values'].forEach(function (word) {
                    message = message.split(word).join(' ');
                });
                numbers_in_msg = numbers_in_msg.sort(function (a, b) {
                    return a - b;
                });
                range_entities["range"] = {"type":"between"};
                range_entities["range"]['start'] = numbers_in_msg[0];
                range_entities["range"]['end'] = numbers_in_msg[1];
            }
            else{
                remove_status = false;
            }
            if(remove_status) {
                no_need_numbers.forEach((val) => {
                    message = message.split(val).join(' ');
                });
                range_entities['statistics'] = ['range'];
            }
        }
        let range_entities_details = {
            "entities": range_entities,
            "remaining_message":message
        };
        return range_entities_details;
    };

    let getPreviousQuestionEntities = (previous_question, message)=>{
        let questions = {
            welcomeMessage : {
                "okay" : ['okay', 'ok', 'sure']
            }
        };
        let entities = {};
        if(questions.hasOwnProperty(previous_question)){
            let data = questions[previous_question];
            let keys = Object.keys(data);
            let synonym_obj = {};
            keys.forEach((field)=> {
                data[field].forEach((synonym)=> {
                    synonym_obj[synonym] = field;
                });
            });
            let identified_words = wordIndentifier(Object.keys(synonym_obj), message);
            if(identified_words['values'].length>0) {
                let required_words = [];
                identified_words['values'].forEach((synonym)=>{
                    let val = synonym_obj[synonym];
                    required_words = appendDataIfNotExists(required_words, val);
                });
                entities['previous_question_needed_entities'] = required_words;
                message = identified_words['remaining_message'];
            }
        }
        return { entities : entities, message : message };
    };
    let entity_bot_functions = {
        /*
        * this function is used to get the message entities
        * @params message (string), callback (function)
        */
        getEntities : (message, signal_name, auth_token, previous_question, callback)=>{
            let entities = {};
            // cleaning the message
            let cleaned_message = cleanSentence(message);
            let previous_question_info = getPreviousQuestionEntities(previous_question, cleaned_message);
            entities = previous_question_info['entities'];
            cleaned_message = previous_question_info['message'];

            // getting the all Data set Entities in message
            getDataSetEntities(cleaned_message, signal_name, auth_token, (dataset_entities_info)=>{
                entities = Object.assign(entities, dataset_entities_info['entities']);
                cleaned_message = dataset_entities_info['message'];

                // getting the all range words in the message
                let range_entities = getRangeWords(cleaned_message);
                cleaned_message = range_entities['remaining_message'];
                entities = Object.assign(entities, range_entities['entities']);

                // getting all wit entities in message
                getWitEntities(cleaned_message, (wit_entities)=>{
                    if(wit_entities.hasOwnProperty('question_type')) {
                        wit_entities['question_type'].forEach((type)=>{
                            entities[type] = true;
                        });
                        delete wit_entities['question_type'];
                    }
                    entities = Object.assign(entities, wit_entities);
                    callback(entities);
                });
            });
        }
    };
    return entity_bot_functions;
})();