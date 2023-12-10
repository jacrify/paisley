const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment-timezone');

class BaseCSVParser {

     parse(filePath) {
        // let results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                try {
                    const processedLine = this.processLine(data);
                    this.saveTransaction(processedLine)
                    // results.push(processedLine);
                } catch (error) {
                    console.log("Error:", error)
                    // reject(error);
                }
            });
            // .on('end', () => resolve())
            // .on('error', reject);
    }

    toUTC(datetime) {
        
        if (! this.timezone ) {
            throw new Error("this.timezone is undefined and must be implemented in the parser.");
        }

        if (! moment.tz.zone(this.timezone)) {
            throw new Error("this.timezone specifies a strange and unknown timezone.");
        }

        return moment.tz(datetime, this.timezone).utc().format();
    }

    setDB(bankdb) {
        this.bankdb = bankdb
    }
    // CREATE TABLE "transaction" (
    //     "id"	INTEGER NOT NULL UNIQUE,
    //     "account"	TEXT,
    //     "description"	TEXT,
    //     "amount"	INTEGER,
    //     "datetime" TEXT,
    //     "balance"	INTEGER,
    //     "type"	INTEGER,
    //     PRIMARY KEY("id" AUTOINCREMENT)
    // );
    saveTransaction(processedLine) {
        console.log("Ready to save: ", processedLine)
    }

    // SELECT * 
    // FROM data_table
    // WHERE 
    //     json_extract(json_data, '$.key1') = 'expected_value1' AND
    //     json_extract(json_data, '$.key2') = 'expected_value2' AND
    //     json_extract(json_data, '$.key3') = 'expected_value3' AND
    //     json_extract(json_data, '$.key4') = 'expected_value4';

    isAlreadyInserted(processedLine) {
        uc = this.uniqueColumns
        // TODO
    }


    processLine(line) {
        throw new Error('processLine() must be implemented in subclass');
    }

    matchesSecondLine(file) {
        throw new Error('matchesSecondLine() must be implemented in subclass');
    }

    matchesFileName(fileName) {
        // Logic to determine if this parser should handle the file based on the file name
        throw new Error('matchesFileName() must be implemented in subclass');
    }


}

module.exports = BaseCSVParser;
