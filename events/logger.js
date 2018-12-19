const winston = require('winston');
const fs = require("fs");
module.exports = (function () {
    let logger_functions = {
        saveInLogs : (event)=> {
            let logDir = "./events/log_files/";
            // Create the log directory if it does not exist
            if(!fs.existsSync(logDir)){
                fs.mkdirSync(logDir);
            }
            const tsFormat = () => (new Date()).toLocaleDateString();
            const logger = new (winston.Logger)({
                transports:[
                    new (require('winston-daily-rotate-file'))({
                        filename: `${logDir}/-results.log`,
                        timestamp:tsFormat,
                        datePattern: 'YYYY-MM-DD',
                        prepend:true,
                        level:'info',
                        json:true
                    })
                ]
            });
            logger.info(event);
        }
    };
    return logger_functions;
})();