const mysql = require("mysql");
module.exports = (function(){
    let db_config = {
        host     : '35.197.132.215',
        user     : 'root',
        password : 'MEw9f.YL'
    };
    let runSqlQuery = (database, query)=>{
        return new Promise((revolve, reject)=> {
            let connection = mysql.createConnection(db_config);
            connection.connect(function(connection_err) {
                if(connection_err) {
                    console.log('error when connecting to db:', connection_err);
                }
                else {
                    connection.query("use "+database);
                    connection.query(query,function(err,result) {
                        if(!err)
                            revolve(result);
                        else
                            reject(err);
                    }.bind(this));
                }
                connection.end();
            });
        });
    };
    let sql_functions = {
        sqlQuery: (database, query, callback)=> {
            runSqlQuery(database, query).then(function(result){
                    callback(result)
                },
                function(err){
                    console.log(err);
                    callback([]);
                });
        }
    };
    return sql_functions;
})();