const EventStoring = require('./storing');

const testFolder = './log_files/';
const fs = require('fs');

let files = fs.readdirSync(testFolder);
// files = ['file_name']
let readFolderFile = (files, file_idx) => {
    let file = files[file_idx];
    let file_data = fs.readFileSync(testFolder+file,'utf-8');
    try {
        let events = file_data.split("\n");
        console.log(file,events.length);
        let sendEvent = (events, idx)=>{
            let event;
            try {
                event = JSON.parse(events[idx]);
            }catch(e){}
            if(event) {
                if(!event.hasOwnProperty('session_id'))
                    event['session_id'] = event['sender_id'];
                EventStoring.offlineMessageEventsUpdate(event);
            }
            idx++;
            if(events.length>idx){
                setTimeout(()=>{
                    sendEvent(events, idx);
                },500);
            }
            else{
                file_idx++;
                if(files.length>file_idx){
                    readFolderFile(files, file_idx);
                }
                else{
                    console.log("completed");
                }
            }
        };
        if(events.length>0){
            sendEvent(events, 0);
        }
    }catch (e) {
        console.log(e);
    }
};
if(files.length>0){
    readFolderFile(files, 0);
}