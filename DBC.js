const fs = require('fs')

exports.DbcParser = function() {

    this.dbcFile;
    this.dbcFileName;

    /**
     * @brief loads wanted dbcFile
     * @param {string} dbcFile Name of the DBC file that is used.
     */
    this.loadDbcFile = (dbcFile) => {
        fs.readFile('./database/dbcFiles/' + dbcFile, 'utf8', async(err, data) => {
            if (err) {
                console.error(err)
                return
            }
            this.dbcFile = data;
            this.dbcFileName = dbcFile;
            console.log("dbcFile loaded!");
        });
    }

    this.getCanNames = () => {
        let decodingRules = this.dbcFile.split("\nBO_ ");
        let test;
        decodingRules.splice(0, 1);

        for (let i = 0; i < decodingRules.length; i++) {
            if (decodingRules[i].indexOf("\nCM_ ") !== -1) {
                let split = decodingRules[i].split("\nCM_ ");
                decodingRules[i] = split[0];
            }
            if (decodingRules[i].indexOf(" SG_ ") === -1) {
                decodingRules.splice(i, 1);
            }
        }


        let names = [];

        for (let i = 0; i < decodingRules.length; i++) {
            let split = decodingRules[i].split(" ");
            let name = split[1].slice(0, -1);

            names.push({ canID: split[0], name: name });
        }
        return names;
    }

    /**
     * @brief Turns given value to a binary number 
     * @param {} src hexadecimal number
     * @returns {string} given value as binary number
     */
    this.hexToBin = (src) => {
        let mapping = {
            "0": "0000",
            "1": "0001",
            "2": "0010",
            "3": "0011",
            "4": "0100",
            "5": "0101",
            "6": "0110",
            "7": "0111",
            "8": "1000",
            "9": "1001",
            "A": "1010",
            "B": "1011",
            "C": "1100",
            "D": "1101",
            "E": "1110",
            "F": "1111"
        };

        let srcString = src.toString();
        let i;
        let returnString = "";

        for (i = 0; i < srcString.length; i++) {
            returnString += mapping[srcString[i]];
        }
        return returnString;
    }

    /**
     * @brief Turns given binary number to decimal number
     * @param {} src binary number
     * @returns {string} given binary number as decimal number
     */
    this.binToDec = (src) => {

        let i;
        let n = 0;
        let srcString = src.toString();
        let returnNum = 0;

        for (i = srcString.length - 1; i >= 0; i--) {
            returnNum += srcString[i] * 2 ** n;
            n++;
        }

        return returnNum;

    };

    /**
     * @brief Turns given binary number to hexadecimal number
     * @param {} src binary number
     * @returns {string} given binary number as hexadecimal
     */
    this.binToHex = (src) => {

        let mapping = {
            "0000": "0",
            "0001": "1",
            "0010": "2",
            "0011": "3",
            "0100": "4",
            "0101": "5",
            "0110": "6",
            "0111": "7",
            "1000": "8",
            "1001": "9",
            "1010": "A",
            "1011": "B",
            "1100": "C",
            "1101": "D",
            "1110": "E",
            "1111": "F"
        };

        let i;
        let srcString = src.toString();
        let returnString = "";
        let remainder = "";

        for (i = srcString.length; i >= 4; i -= 4) {
            if (i - 4 < srcString.length) {
                returnString = mapping[srcString.substr(i - 4, 4)] + returnString;
            }
        }

        if (i !== 0) {
            remainder = srcString.substr(0, i);

            while (remainder.length < 4) {
                remainder = "0" + remainder;
            }

            returnString = mapping[remainder] + returnString;
        }
        return returnString;
    };

    /**
     * @brief Turns given decimal number to hexadecimal number
     * @param {} src decimal number
     * @returns {string} given decimal number as hexadecimal number
     */
    this.decToHex = (src) => {

        let mapping = {
            "0": "0",
            "1": "1",
            "2": "2",
            "3": "3",
            "4": "4",
            "5": "5",
            "6": "6",
            "7": "7",
            "8": "8",
            "9": "9",
            "10": "A",
            "11": "B",
            "12": "C",
            "13": "D",
            "14": "E",
            "15": "F"
        };

        let n = 0;
        let returnString = "";

        while (16 ** (n + 1) < src) {
            n++;
        }

        for (n; n >= 0; n--) {
            if (16 ** n <= src) {
                returnString += mapping[Math.floor(src / 16 ** n).toString()];
                src = src - Math.floor(src / 16 ** n) * (16 ** n);
            } else {
                returnString += "0";
            }
        }
        return returnString;
    };

    /**
     * @brief calculates can data to decimal value
     * @param {json} message contains canID and data
     * @returns {json} { name, value, unit, min, max }
     */
    this.calculateValue = (message) => {
        const rules = this.getDecodingRules(message.canID);

        if (rules.error !== null) return rules;

        let startBit = parseInt(rules.startBit);
        let length = parseInt(rules.length);

        // extract wanted bits from the message
        let binaryMessage = this.hexToBin(message.data)
        binaryMessage = binaryMessage.slice(startBit, (startBit + length));

        // create byte array 
        let binaryArray = binaryMessage.split("");
        let byteArray = [];

        while (binaryArray.length > 0) {
            let byte = [];

            for (let i = 0; i < 8; i++) {
                if (binaryArray[0] === undefined) {
                    byte[i] = 0;
                } else {
                    byte[i] = binaryArray[0];
                    binaryArray.shift();
                }
            }
            byteArray.push(byte);
        }

        // reverse bytes if message is little endian
        if (rules.endian == 1) {
            byteArray.reverse();
        }

        // create binaryString from the bytes
        let readyBinaryString = "";
        for (byte in byteArray) {
            for (bit in byteArray[byte]) {
                readyBinaryString = readyBinaryString + byteArray[byte][bit].toString();
            }
        }

        // turn binary string to decimal value
        let rawValue = this.binToDec(readyBinaryString);

        //calculate real physical value
        let value = parseFloat(rules.offset) + parseFloat(rules.scale) * rawValue;

        return { name: rules.name, value: value, unit: rules.unit, min: rules.min, max: rules.max };
    }

    /**
     * @brief gets decoding rules of the wanted canID from dbc file.
     * @param {*} canID 
     * @returns on success: {json} { name, startBit, length, endian, scale, offset, min, max, unit }
     * @returns on fail: {json} { name: null } if part of the rules are missing.
     */
    this.getDecodingRules = (canID) => {
        let index1, index2;

        // Extract whole decoding rule of the wanted can ID
        try {
            index1 = this.dbcFile.indexOf("BO_ " + canID);

            // throw error if there is no decoding rule found
            if (index1 === -1) throw "\nNo decoding rule found with can ID: " + canID;

            let split1 = this.dbcFile.slice(index1);

            index1 = split1.indexOf("\n\r");
            const decodingRule = split1.slice(0, (index1 - 1))

            // Extract message name
            index1 = decodingRule.indexOf("SG_ ");

            //throw error if there is no signal syntax
            if (index1 === -1) throw "\nNo signal syntax for can ID: " + canID;

            index2 = decodingRule.indexOf(" : ");

            const messageName = decodingRule.slice(index1 + 4, index2);

            // Extract start bit
            let bitStartLength = decodingRule.slice(index2 + 3)
            index1 = bitStartLength.indexOf(" ");

            bitStartLength = bitStartLength.slice(0, index1);
            index1 = bitStartLength.indexOf("|");
            const bitStart = bitStartLength.slice(0, index1);

            // Extract bit length and endian
            index2 = bitStartLength.indexOf("@");

            const bitLength = bitStartLength.slice(index1 + 1, index2);
            const endian = bitStartLength.slice(index2 + 1, bitStartLength.length - 1);

            // Extract scale and offset
            index1 = decodingRule.indexOf(" (");
            index2 = decodingRule.indexOf(") ");

            let scaleOffset = decodingRule.slice(index1 + 2, index2);
            index1 = scaleOffset.indexOf(",");

            const scale = scaleOffset.slice(0, index1);
            const offset = scaleOffset.slice(index1 + 1);

            // Extract min and max values
            index1 = decodingRule.indexOf(" [");
            index2 = decodingRule.indexOf("] ");

            let minMax = decodingRule.slice(index1 + 2, index2);
            index1 = minMax.indexOf("|");

            const min = minMax.slice(0, index1);
            const max = minMax.slice(index1 + 1);

            // Extract unit
            index1 = decodingRule.indexOf('] "');
            let tempUnit = decodingRule.slice(index1 + 3);
            index1 = tempUnit.indexOf('"');

            const unit = tempUnit.slice(0, index1);

            return {
                name: messageName,
                startBit: bitStart,
                length: bitLength,
                endian: endian,
                scale: scale,
                offset: offset,
                min: min,
                max: max,
                unit: unit
            };

        } catch (error) {
            console.log(error);

            return {
                error: error,
                value: undefined
            }
        }

    }
}