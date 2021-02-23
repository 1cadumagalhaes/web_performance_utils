/**
 * Executes UrlFetchApp with given options, using error treatment. It is similar to npm package request.
 * 
 * To use it in node, wrap some library (like node-fetch) in a function with similiar params and return. 
 * @param {String} endpoint - Url or endpoint to make requests; Create the const URL_BASE if you want to use only the endpoint.
 * @param {Object} [$0] - Options.
 * @param {String} [$0.method=GET] - Request type (POST, GET, PUT, PATCH, DELETE).
 * @param {Object} [$0.body] - Request body.
 * @param {Object} [$0.header] - Request header.
 * @param {boolean} [$0.printlogs=false] - Use true for debugging
 * @returns {Object} Response body of the request.
 */
function request(endpoint, { method = "GET", body = "", header = {}, printAll = false } = {}) {
    let url;
    if (!/http/.test(endpoint) && URL_BASE) {
        if (endpoint[0] != "/") endpoint = "/" + endpoint;
        url = `${URL_BASE}${endpoint}`;
    }
    else url = endpoint;
    if (method != "GET" && header === {}) header["Content-Type"] = "application/json";

    let options = {
        method: method,
        headers: header,
    };
    if (body) options["payload"] = JSON.stringify(body);

    if (printAll)
        console.log({ url, ...options });

    let response;
    try {
        response = UrlFetchApp.fetch(url, options);
        let code = response.getResponseCode();
        if (code != 200 && code != 204) throw { error: code };
        console.log({ endpoint: endpoint, http_response: code });
        if (code == 204) return null;
        return JSON.parse((response.getContentText("UTF-8")));
    } catch (error) {
        console.error(error);
        if ((error.error = 500)) {
            console.log("Request took too long. Trying again in 1 second");
            Utilities.sleep(1000);
            return request(endpoint, { method, body });
        }
    }
}

/**
 * Gets an array of objects, using the first row as header and the rest as values.
 * @param {string} sheetName - Name of the sheet to take the objects.
 * @param {number} [rowNumber=null] - Optional. First row of values to take.
 * @returns {Array} Array of objects from the sheet.
 */
function getObjectsFromSheets(sheetName, rowNumber = null) {
    if (!sheetName) throw "Invalid sheetName";
    const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    let values;
    if (rowNumber == null) values = ss.getRange(1, 1, ss.getLastRow(), ss.getLastColumn()).getValues();
    else values = [ss.getRange(1, 1, 1, ss.getLastColumn()).getValues()[0], ss.getRange(rowNumber, 1, 1, ss.getLastColumn()).getValues()[0]];
    let header = values.shift();

    return values.map(function (row) {
        let item = {};
        header.forEach((h, i) => {
            item[h] = row[i];
        });
        return item;
    });
}

/**
 * Writes and object or array of objects into a sheet, where the object keys will be the header.
 * @param {Object} obj - One object or an Array of objects to be written on the sheet
 * @param {string} sheetName - Name of the sheet where it will write.
 * @param {boolean} [concat=false] - True if you want to append values to the sheet. False by default, will clear sheet content before it writes.
 */
function writeObjectListToSheet(obj, sheetName, concat = false) {
    if (!Array.isArray(obj)) obj = [obj];
    if (obj.length < 1) throw "Invalid object";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    let header,
        body,
        data = [];
    header = Object.keys(obj[0]);
    body = obj.map((item) => Object.values(item));
    if (!concat) {
        data.push(header);
        sheet.clearContents();
    }
    data = data.concat(body);
    let row = !concat ? 1 : sheet.getLastRow() + 1,
        column = 1;
    const range = sheet.getRange(row, column, data.length, header.length);
    range.setValues(data);
}