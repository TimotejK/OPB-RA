let maxNumberOfLines = 1000;

function insertAlternativeSymbols(expression) {
    expression = expression.replaceAll('×', '⨯');
    expression = expression.replaceAll(' x ', ' ⨯ ');
    expression = expression.replaceAll(' U ', ' ∪ ');
    expression = expression.replaceAll('<=', '≤');
    expression = expression.replaceAll('>=', '≥');
    expression = expression.replaceAll('!=', '≠');
    expression = expression.replaceAll('!', '¬');
    expression = expression.replaceAll('−', '-');
    expression = expression.replaceAll('−', '-');
    expression = expression.replaceAll('’', "'");
    expression = expression.replaceAll('’', "'");
    return expression;
}

function validateRelation(relation) {
    // remove duplicate lines
    relation = convertDataToText(relation);
    relation.data = Array.from(new Set(relation.data));
    relation = convertDataFromText(relation);
    return relation
}

function findMatchingParenthesis(expression, firstLocation, open, close, startingPosition) {
    let i = firstLocation + 1;
    let level = 1;
    while (i < expression.length && level > 0) {
        if (expression[i] == close) { level--; }
        else if (expression[i] == open) { level++; }
        i++;
    }
    if (level > 0) {
        return { type: 'error', description: 'Manjka pripadajoči zaklepaj / narekovaj', location: startingPosition + firstLocation, locationEnd: startingPosition + firstLocation + 1 }
    }
    return { type: 'result', tokenStart: firstLocation, tokenEnd: i }
}

let operationsForTokenization = ['π', 'σ', 'ρ', 'τ', '⨯', '⨝', '⋉', '⋊', '⟗', '▷', '∩', '∪', '/', '-', '←',
    '∧', '∨', '¬', '=', '≠', '≤', '≥', '<', '>'];

let parenthesisPairs = [['(', ')'], ['[', ']'], ['"', '"'], ["'", "'"]];
let tokenEndingChars = [' ', ';', ','];

let operationDescriptions = [
    {name: "Projekcija", examples: ["π[A, B](r)"]},
    {name: "Selekcija", examples: ["σ[A > 3](r)"]},
    {name: "Preimenovanje", examples: ["ρ[q(C, D)](r)"]},
    {name: "Agregacija in grupiranje", examples: ["τ[COUNT A](r)", "[A]τ[MAX B](r)"]},
    {name: "Kartezični produkt", examples: ["r ⨯ q"]},
    {name: "Naravni in pogojni stik", examples: ["r ⨝ q", "r ⨝[A = C] q"]},
    {name: "Desno odprti stik", examples: ["r ⋉ q", "r ⋉[A = C] q"]},
    {name: "Levo odprti stik", examples: ["r ⋊ q", "r ⋊[A = C] q"]},
    {name: "Odprti stik", examples: ["r ⟗ q", "r ⟗[A = C] q"]},
    {name: "Pol-stik", examples: ["r ▷ q", "r ▷[A = C] q"]},
    {name: "Presek", examples: ["r ∩ q"]},
    {name: "Unija", examples: ["r ∪ q"]},
    {name: "Deljenje", examples: ["r / q"]},
    {name: "Razlika", examples: ["r - q"]},
    {name: "Prirejanje vrednosti", examples: ["spremenljivka ← r"]},
    
    {name: "Konjunkcija", examples: ["a ∧ b"]},
    {name: "Disjunkcija", examples: ["a ∨ b"]},
    {name: "Negacija", examples: ["¬a"]},
    {name: "Je enako", examples: ["a = b"]},
    {name: "Ni enako", examples: ["a ≠ b"]},
    {name: "Manjše ali enako", examples: ["a ≤ b"]},
    {name: "Večje ali enako", examples: ["a ≥ b"]},
    {name: "Manjše", examples: ["a < b"]},
    {name: "Večje", examples: ["a > b"]},
]

function tokenize(expression, startPosition) {
    if (Array.isArray(expression)) {
        return { type: 'tokenizationResult', tokens: expression };
    } else if (typeof expression === 'object') {
        return { type: 'tokenizationResult', tokens: [expression] };
    }

    let tokenStart = 0;
    let tokenEnd = 0;
    let tokens = []

    mainLoop:
    while (tokenEnd <= expression.length) {
        // recognise operations
        for (let j = 0; j < operationsForTokenization.length; j++) {
            if (expression.substr(tokenEnd, operationsForTokenization[j].length) == operationsForTokenization[j]) {
                tokens.push({ token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition, locationEnd: tokenEnd + startPosition });
                tokens.push({ token: expression.substr(tokenEnd, operationsForTokenization[j].length), type: 'operation', location: tokenEnd + startPosition, 
                locationEnd: tokenEnd + startPosition + operationsForTokenization[j].length });
                tokenStart = tokenEnd + operationsForTokenization[j].length;
                tokenEnd = tokenEnd + operationsForTokenization[j].length;
                continue mainLoop;
            }
        }

        // recognise parenthesis
        for (let j = 0; j < parenthesisPairs.length; j++) {
            if (expression[tokenEnd] == parenthesisPairs[j][0]) {
                tokens.push({ token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition, locationEnd: tokenEnd + startPosition });
                result = findMatchingParenthesis(expression, tokenEnd, parenthesisPairs[j][0], parenthesisPairs[j][1], startPosition);
                if (result.type != 'result') return result;
                tokens.push({
                    token: expression.substring(result['tokenStart'] + 1,
                        result['tokenEnd'] - 1), type: parenthesisPairs[j][0],
                    location: result['tokenStart'] + 1 + startPosition,
                    locationEnd: result['tokenEnd'] - 1 + startPosition
                });
                tokenStart = result['tokenEnd'];
                tokenEnd = result['tokenEnd'];
                continue mainLoop;
            }
        }

        // recognise normal tokens
        if (tokenEndingChars.includes(expression[tokenEnd])) {
            tokens.push({ token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition, locationEnd: tokenEnd + startPosition });
            tokenStart = tokenEnd + 1;
        }
        tokenEnd++;
    }
    if (tokenStart < tokenEnd - 1) {
        // add the final token from the string
        tokens.push({ token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition, locationEnd: tokenEnd + startPosition });
    }
    // remove empty tokens
    tokens = tokens.map(el => ({ token: el.token.trim(), type: el.type, location: el.location, locationEnd: el.locationEnd }))
    tokens = tokens.filter(el => el.token.trim().length > 0);
    return { type: 'tokenizationResult', tokens: tokens };
}

function findOperation(tokenizedExpression, operation) {
    for (let i = 0; i < tokenizedExpression.length; i++) {
        if (tokenizedExpression[i].type == 'operation') {
            if (tokenizedExpression[i].token == operation) {
                let expressionBefore = null;
                let expressionAfter = null;
                let parametersBefore = null;
                if (i > 0 && tokenizedExpression[i - 1].type == '[') {
                    parametersBefore = tokenizedExpression[i - 1]
                    expressionBefore = tokenizedExpression.slice(0, i - 1)
                } else {
                    expressionBefore = tokenizedExpression.slice(0, i)
                }
                let parametersAfter = null;
                if (i < tokenizedExpression.length - 1 && tokenizedExpression[i + 1].type == '[') {
                    parametersAfter = tokenizedExpression[i + 1]
                    expressionAfter = tokenizedExpression.slice(i + 2, tokenizedExpression.length)
                } else {
                    expressionAfter = tokenizedExpression.slice(i + 1, tokenizedExpression.length)
                }
                return { index: i, operationToken: tokenizedExpression[i], parametersBefore, parametersAfter, expressionBefore, expressionAfter }
            }
        }
    }
    return null;
}

global_domain_name = "default"
let relations = [
    {
        name: 'oseba', header: ['ID', 'Ime', 'Rojen', 'SID'], types: ['number', 'string', 'date', 'number'], shortName: 'o',
        data: [
            [1, "Jill", "1990-03-09", 1],
            [2, "Jack", "1950-06-02", 1],
            [3, "Joe", "1989-08-01", 4],
            [4, "Jenn", "2001-01-07", 2],
            [5, "Jeff", null, 2],
            [6, "Edna", "2011-04-23", 3],
            [7, "North", null, 3]
        ]
    },
    {
        name: 'facebook', header: ['OID', 'PID'], types: ['number', 'number'], shortName: 'f',
        data: [
            [1, 2],
            [2, 1],
            [2, 3],
            [3, 2],
            [2, 4],
            [4, 2],
            [3, 4],
            [4, 3]
        ]
    },
    {
        name: 'twitter', header: ['OID', 'SID'], types: ['number', 'number'], shortName: 't',
        data: [
            [1, 2],
            [3, 2],
            [4, 3],
            [2, 4]
        ]
    },
    {
        name: 'stan', header: ['SID', 'Stan'], types: ['number', 'string'], shortName: 's',
        data: [
            [1, "Razmerje"],
            [2, "Zakonski"],
            [3, "Samski"],
            [4, "Zapleteno"]
        ]
    }
]

function convertDataToText(relation) {
    let rows = [];
    relation.data.forEach(row => {
        rows.push(JSON.stringify(row));
    });
    return { name: relation.name, header: relation.header, types: relation.types, data: rows, fromRelationName: relation.fromRelationName };
}
function convertDataFromText(relation) {
    let rows = [];
    relation.data.forEach(row => {
        rows.push(JSON.parse(row));
    });
    return { name: relation.name, header: relation.header, types: relation.types, data: rows, fromRelationName: relation.fromRelationName };
}

function compareRelationAndToken(relation, token) {
    let lowerName1 = relation.name.toLowerCase();
    let lowerName2 = token.toLowerCase();
    if (lowerName1 == lowerName2) {return true;}
    lowerName1 = relation.shortName.toLowerCase();
    if (lowerName1 == lowerName2) {return true;}
    return false;
}

function insertValue(tokenizedExpression) {
    if (tokenizedExpression.length == 1 && (tokenizedExpression[0].type == "word" || tokenizedExpression[0].type == '"')) {
        for (let i = 0; i < relations.length; i++) {
            if (compareRelationAndToken(relations[i], tokenizedExpression[0].token)) {
                let explanation = '<span class="variable">' + relations[i].name + "</span>";
                let relation = relations[i];
                relation['fromRelationName'] = getDefaultFromRelationName(relation);
                return { type: 'result', relation: validateRelation(relation), explanation: explanation }
            }
        }
        return { type: 'error', description: 'Neznano ime spremenljivke', location: tokenizedExpression[0].location, locationEnd: tokenizedExpression[0].locationEnd }
    } else {
        return { type: 'error', description: 'Manjkajoče ime spremenljivke', location: tokenizedExpression[0].location, locationEnd: tokenizedExpression.slice(-1)[0].locationEnd }
    }
}

function logicExpression(expression, variables, startPosition) {
    if (!startPosition) {
        startPosition = expression[0].location
    }
    let tokenizedExpression = tokenize(expression, startPosition);
    if (tokenizedExpression.type == 'error') {
        return tokenizedExpression;
    }
    tokenizedExpression = tokenizedExpression.tokens;
    if (tokenizedExpression.length == 0) {
        return { type: 'error', description: 'Manjkajoča operacija', location: startPosition, locationEnd: tokenizedExpression.slice(-1)[0].locationEnd}
    }


    let operations = ["∨", "∧", "=", "≠", "≥", "≤", "<", ">"];
    let operationsJS = ["||", "&&", "==", "!=", ">=", "<=", "<", ">"];
    let operationIsNumeric = [false, false, true, true, true, true, true, true];
    let resultIsNumeric = [false, false, false, false, false, false, false, false];
    let found = false;
    for (let i = 0; i < operations.length; i++) {
        found = findOperation(tokenizedExpression, operations[i]);
        if (found) {
            if (!found.expressionBefore || found.expressionBefore.length == 0) {
                return { type: 'error', description: 'Manjka izraz levo od operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
            }
            let leftResult = logicExpression(found.expressionBefore, variables)
            if (leftResult.type == 'error') { return leftResult };

            if (!found.expressionAfter || found.expressionAfter.length == 0) {
                return { type: 'error', description: 'Manjka izraz desno od operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
            }
            let rightResult = logicExpression(found.expressionAfter, variables)
            if (rightResult.type == 'error') { return rightResult };

            if (operationIsNumeric[i]) {
                if (leftResult.type != 'numericValue') {
                    return { type: 'error', description: 'Leva stran operacije mora imeti numerično vrednost', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
                }
                if (rightResult.type != 'numericValue') {
                    return { type: 'error', description: 'Desna stran operacije mora imeti numerično vrednost', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
                }
            } else {
                if (leftResult.type != 'logicValue') {
                    return { type: 'error', description: 'Leva stran operacije mora imeti logično vrednost', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
                }
                if (rightResult.type != 'logicValue') {
                    return { type: 'error', description: 'Desna stran operacije mora imeti logično vrednost', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
                }
            }
            let result = eval("leftResult.value " + operationsJS[i] + " rightResult.value")
            let resultType = null;
            if (resultIsNumeric[i]) {
                resultType = 'numericValue';
            } else {
                resultType = 'logicValue';
            }
            return { type: resultType, value: result };
        }
    }

    found = findOperation(tokenizedExpression, "¬");
    if (found) {
        // return (!logicExpression(found.expressionAfter, variables))

        if (found.expressionBefore && found.expressionBefore.length > 0) {
            return { type: 'error', description: 'Operacija pričakuje izraze samo na desni strani', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
        }

        if (!found.expressionAfter || found.expressionAfter.length == 0) {
            return { type: 'error', description: 'Manjka izraz desno od operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
        }
        let rightResult = logicExpression(found.expressionBefore, variables)
        if (rightResult.type == 'error') { return rightResult };

        if (rightResult.type != 'logicValue') {
            return { type: 'error', description: 'Desna stran operacije mora imeti logično vrednost', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
        }

        let result = !rightResult.value
        return { type: 'logicValue', value: result };
    }

    if (tokenizedExpression.length == 1 && tokenizedExpression[0].type == "(") {
        return logicExpression(tokenizedExpression[0].token, variables);
    }

    if (tokenizedExpression.length == 1 && tokenizedExpression[0].type == "word") {
        let variable = convertTokenToVariableName(Object.keys(variables), tokenizedExpression[0].token);
        if (variable in variables) {
            return { type: 'numericValue', value: variables[variable] }
        }
        if (isNumeric(tokenizedExpression[0].token)) {
            return { type: 'numericValue', value: parseFloat(tokenizedExpression[0].token) }
        }
    }

    if (tokenizedExpression.length == 1 && (tokenizedExpression[0].type == "\"" || tokenizedExpression[0].type == "'")) {
        return { type: 'numericValue', value: tokenizedExpression[0].token }
    }

    for (let i = 0; i < operationsForTokenization.length; i++) {
        let found = findOperation(tokenizedExpression, operationsForTokenization[i]);
        if (found) {
            return { type: 'error', description: 'Znotraj logičnih izrazov ni mogoča uporaba relacijskih operacij', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd }
        }
    }

    return { type: 'error', description: 'Neznana operacija/spremenljivka', location: startPosition, locationEnd: expression.slice(-1)[0].locationEnd }
}

function convertTokenToVariableName(variableNames, token) {
    for (let i = 0; i < variableNames.length; i++) {
        if (variableNames[i].toLowerCase() == token.toLowerCase()) {
            return variableNames[i];
        }
    }
    return token;
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

// Returns a list of selected values from a row. ColumnNames is a list of values that we want to get 
function convertRowToStringOfValues(row, relation, columnNames) {
    let values = [];
    let convertedColumnNames = columnNames.map(name => convertTokenToVariableName(relation.header.concat(getPrefixedHeader(relation)), name));
    for (let i = 0; i < columnNames.length; i++) {
        let columnIndex = indexOfColumn(relation, convertedColumnNames[i]);
        if (columnIndex >= 0) {
            values.push(row[columnIndex]);
        }
    }
    return JSON.stringify(values);
}

// function compareValues(comparator, value1, type1, value2, type2) {
//     if (type1 == 'date') {
//         value1 = 
//     }
// }

function getPrefixedHeader(relation) {
    let result = [];
    for (let i = 0; i < relation.header.length; i++) {
        result.push(relation.fromRelationName[i] + "." + relation.header[i]);
    }
    for (let i = 0; i < relation.header.length; i++) {
        result.push(relation.fromRelationName[i].substr(0, 1) + "." + relation.header[i]);
    }
    return result;
}
function indexOfColumn(relation, columnName) {
    // column name could contain a prefix
    let header = relation.header;
    if (header.includes(columnName)) {
        return header.indexOf(columnName);
    }
    header = getPrefixedHeader(relation);
    if (header.includes(columnName)) {
        return header.indexOf(columnName) % relation.header.length;
    }
    return -1;
}
function getDefaultFromRelationName(relation) {
    let result = [];
    let badCharacters = tokenEndingChars.concat(parenthesisPairs.flat().concat(operationsForTokenization));
    for (let i = 0; i < relation.header.length; i++) {
        let name = relation.name;
        for (let j = 0; j < badCharacters.length; j++) {
            name = name.replaceAll(badCharacters[j], "");
        }
        result.push(name);
    }
    return result;
}

function aggregation(relation, columnNames, functions) {
    let columnNamesForGroups = columnNames.map(name => convertTokenToVariableName(relation.header.concat(getPrefixedHeader(relation)), name.token));
    let columnTypesForGroups = columnNamesForGroups.map(name => relation.types[indexOfColumn(relation, name)]);
    let relationNamesForGroups = columnNamesForGroups.map(name => relation.fromRelationName[indexOfColumn(relation, name)]);
    // check if column names for groups are valid
    for (let i = 0; i < columnNamesForGroups.length; i++) {
        if (!relation.header.concat(getPrefixedHeader(relation)).includes(columnNamesForGroups[i])) {
            return { type: 'error', description: 'Neveljavno ime stolpca za grupiranje: ' + columnNamesForGroups[i], location: columnNames[i].location, locationEnd: columnNames[i].locationEnd };
        }
    }

    // Groups contains all of the possible values for the group by parameters that appear in the table
    let groups = [""];
    if (columnNames.length > 0) {
        groups = Array.from(new Set(relation.data.map(row => { return convertRowToStringOfValues(row, relation, columnNamesForGroups) })));
    }

    let validFunctions = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'];
    let validColumns = relation.header;
    let validColumnsWithPrefix = getPrefixedHeader(relation);

    let functionName = [];
    let functionParametersIndexes = [];
    for (let i = 0; i < functions.length; i += 2) {
        if (i + 1 >= functions.length) {
            return { type: 'error', description: 'Vsaka agregacijska funkcija potrebuje parametre', location: functions[i].location, locationEnd: functions[i].locationEnd };
        }
        if (functions[i].type == "word" && (functions[i + 1].type == "(" || functions[i + 1].type == "word")) {
            if (validFunctions.includes(functions[i].token.toUpperCase())) {
                functionName.push(functions[i].token.toUpperCase())
            } else {
                return { type: 'error', description: 'Neveljavno ime agregacijske funkcije: ' + functions[i].token, location: functions[i].location, locationEnd: functions[i].locationEnd };
            }
            let agregationOverColumn = convertTokenToVariableName(validColumns.concat(validColumnsWithPrefix), functions[i + 1].token);
            if (validColumns.includes(agregationOverColumn)) {
                functionParametersIndexes.push(validColumns.indexOf(agregationOverColumn))
            } else if (validColumnsWithPrefix.includes(agregationOverColumn)) {
                functionParametersIndexes.push(validColumnsWithPrefix.indexOf(agregationOverColumn) % validColumns.length)
            } else {
                return { type: 'error', description: 'Neveljavno ime atributa: ' + functions[i + 1].token, location: functions[i + 1].location, locationEnd: functions[i + 1].locationEnd };
            }
        } else {
            return { type: 'error', description: 'Vsaka agregacijska funkcija potrebuje parametre: ' + functions[i].token, location: functions[i].location, locationEnd: functions[i].locationEnd };
        }
    }

    let rows = [];

    for (let i = 0; i < groups.length; i++) {
        let group = groups[i];
        let row = [];
        if (columnNames.length > 0) {
            // Add the values of the group by parameters
            row = JSON.parse(group)
        }
        for (let fun = 0; fun < functionName.length; fun++) {
            let aggregationFunction = functionName[fun];
            
            // get the values over which to apply the aggregation function
            let values = [];
            for (let j = 0; j < relation.data.length; j++) {
                if (columnNames.length == 0 || group == convertRowToStringOfValues(relation.data[j], relation, columnNamesForGroups)) {
                    values.push(relation.data[j][functionParametersIndexes[fun]]);
                }
            }

            let result = 0;
            if (aggregationFunction == "SUM") {
                result = 0;
                values.forEach(v => { result += v; })
            } else if (aggregationFunction == "AVG") {
                result = 0;
                values.forEach(v => { result += v; })
                result /= values.length;
            } else if (aggregationFunction == "MIN") {
                result = values[0];
                values.forEach(v => { if (v < result) { result = v; } })
            } else if (aggregationFunction == "MAX") {
                result = values[0];
                values.forEach(v => { if (v > result) { result = v; } })
            } else if (aggregationFunction == "COUNT") {
                result = 0;
                values.forEach(v => { if (v != null) { result++; } })
            } else {

            }

            row.push(result);
        }
        rows.push(row);
    }
    let header = columnNamesForGroups;
    let types = columnTypesForGroups;
    let fromRelationName = relationNamesForGroups;
    for (let fun = 0; fun < functionName.length; fun++) {
        header.push("null");
        fromRelationName.push("null");
        if (functionName[fun] == 'COUNT') {
            types.push('number');
        } else {
            types.push(relation.types[functionParametersIndexes[fun]]);
        }
    }
    let newRelation = { types: types, header: header, data: rows, name: relation.name, fromRelationName: fromRelationName };
    return { type: 'result', relation: validateRelation(newRelation) };
}

function applySimpleOperations(tokenizedExpression) {
    let operations = ["π", "σ", "ρ", "τ"];

    let foundOperations = [];
    let foundIndexes = [];
    for (let i = 0; i < operations.length; i++) {
        let operator = operations[i];
        let found = findOperation(tokenizedExpression, operator);
        if (found) {
            foundOperations.push(operator);
            foundIndexes.push(found.index);
        }
    }
    let firstOperator = foundOperations[foundIndexes.indexOf(Math.min(...foundIndexes))];

    // for (let i = 0; i < operations.length; i++) {
        // let operator = operations[i];
        let operator = firstOperator;
        let found = findOperation(tokenizedExpression, operator);
        if (found) {
            if (operator != "τ" && found.parametersBefore != null) {
                return { type: 'error', description: 'Odvečni parametri pred operacijo', location: found.parametersBefore.location, locationEnd: found.parametersBefore.locationEnd };
            }
            if (found.parametersAfter == null) {
                return { type: 'error', description: 'Manjkajo parametri operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
            }

            if (found.expressionBefore.length > 0) {
                return { type: 'error', description: 'Na levi strani operacije so odvečni izrazi', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
            }

            if (found.expressionAfter.length == 0) {
                return { type: 'error', description: 'Manjka desna stran izraza', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
            }

            let rightSide = evaluateExpression(found.expressionAfter, null);
            if (rightSide.type == 'error') return rightSide;
            if (rightSide.type != 'result') return { type: 'error', description: 'Napaka desno od operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };

            // product
            let newName = operator + rightSide.relation.name;
            let explanation = '<span class="operator">' + operator + "</span><sub>" + found.parametersAfter.token + "</sub> (" + rightSide.explanation + ")";
            if (operator == "π") {
                return projection(rightSide, found.parametersAfter);
            }

            if (operator == "σ") {
                let newData = [];
                for (let j = 0; j < rightSide.relation.data.length; j++) {
                    let variables = {};
                    for (let k = 0; k < rightSide.relation.data[j].length; k++) {
                        variables[rightSide.relation.header[k]] = rightSide.relation.data[j][k];
                    }
                    let prefixedHeader = getPrefixedHeader(rightSide.relation);
                    for (let k = 0; k < prefixedHeader.length; k++) {
                        variables[prefixedHeader[k]] = rightSide.relation.data[j][k % rightSide.relation.data[j].length];
                    }

                    let result = logicExpression(found.parametersAfter.token, variables, found.parametersAfter.location);
                    if (result.type == 'error') { return result };
                    if (result.type != 'logicValue') { return { type: 'error', description: 'Pogoj mora vrniti logično vrednost', location: found.parametersAfter.location, locationEnd: found.parametersAfter.locationEnd }; }
                    if (result.value) {
                        newData.push(rightSide.relation.data[j]);
                    }
                }

                let newRelation = { types: rightSide.relation.types, header: rightSide.relation.header, data: newData, name: newName, fromRelationName: rightSide.relation.fromRelationName};
                return { type: 'result', relation: validateRelation(newRelation), explanation: explanation };
            }

            if (operator == "ρ") {
                let tokenizedArgument = tokenize(found.parametersAfter.token, found.parametersAfter.location);
                if (tokenizedArgument.type == 'error') { return tokenizedArgument; }
                tokenizedArgument = tokenizedArgument.tokens;
                let newRelationName = null;
                let newColumnNames = null;
                let newFromRelationName = getDefaultFromRelationName(rightSide.relation);
                let newColumnNamesLocation = 0;
                let newColumnNamesLocationEnd = 0;
                for (let i = 0; i < tokenizedArgument.length; i++) {
                    if (tokenizedArgument[i].type == 'word' || tokenizedArgument[i].type == '"' || tokenizedArgument[i].type == "'") {
                        if (newRelationName) {
                            return { type: 'error', description: 'Dovoljeno je samo eno novo ime relacije', location: tokenizedArgument[i].location, locationEnd: tokenizedArgument[i].locationEnd };
                        }
                        if (newColumnNames) {
                            return { type: 'error', description: 'Ime relacije mora biti pred imeni argumentov', location: tokenizedArgument[i].location, locationEnd: tokenizedArgument[i].locationEnd };
                        }
                        newRelationName = tokenizedArgument[i].token;
                        newFromRelationName = Array(newFromRelationName.length).fill(newRelationName)
                    }
                    if (tokenizedArgument[i].type == '(') {
                        if (newColumnNames) {
                            return { type: 'error', description: 'Nova imena argumentov lahko podaš samo enkrat', location: tokenizedArgument[i].location, locationEnd: tokenizedArgument[i].locationEnd };
                        }
                        newColumnNames = tokenizedArgument[i].token;
                        newColumnNamesLocation = tokenizedArgument[i].location;
                        newColumnNamesLocationEnd = tokenizedArgument[i].locationEnd;
                    }
                }

                if (!newRelationName) {
                    newRelationName = newName;
                }
                if (newColumnNames) {
                    let tokenizedColumnNames = tokenize(newColumnNames, newColumnNamesLocation);
                    if (tokenizedColumnNames.type == 'error') { return tokenizedColumnNames; }
                    tokenizedColumnNames = tokenizedColumnNames.tokens;
                    if (tokenizedColumnNames.length != rightSide.relation.header.length) {
                        return { type: 'error', description: 'Število imen argumentov ni pravilno', location: newColumnNamesLocation, locationEnd: newColumnNamesLocationEnd };
                    }
                    let names = [];
                    for (let i = 0; i < tokenizedColumnNames.length; i++) {
                        names.push(tokenizedColumnNames[i].token);
                    }
                    newColumnNames = names;
                } else {
                    newColumnNames = rightSide.relation.header;
                }

                let newRelation = { types: rightSide.relation.types, header: newColumnNames, data: rightSide.relation.data, name: newRelationName, fromRelationName: newFromRelationName };
                return { type: 'result', relation: validateRelation(newRelation), explanation: explanation };
            }

            if (operator == "τ") {
                let tokenizedGroups = [];
                if (found.parametersBefore) {
                    tokenizedGroups = tokenize(found.parametersBefore.token, found.parametersBefore.location);
                    if (tokenizedGroups.type == 'error') { return tokenizedGroups; }
                    tokenizedGroups = tokenizedGroups.tokens;
                }

                 
                // check if columnNamesForGroupsAreValid
                for (let i = 0; i < 0; i++) {
                    tokenizedGroups[i];
                }

                let tokenizedFunctions = tokenize(found.parametersAfter.token, found.parametersAfter.location);
                if (tokenizedFunctions.type == 'error') { return tokenizedFunctions; }
                tokenizedFunctions = tokenizedFunctions.tokens;

                let result = aggregation(rightSide.relation, tokenizedGroups, tokenizedFunctions);
                let explanation = (found.parametersBefore ? "<sub>" + found.parametersBefore.token + "</sub>" : "") + '<span class="operator">' + operator + "</span><sub>" + found.parametersAfter.token + "</sub> (" + rightSide.explanation + ")";
                result.explanation = explanation;
                return result;
            }

        }
    // }
}

function applyDoubleOperations(tokenizedExpression) {
    let operations = ["←", "∪", "∩", "-", "/", "⨯", "⨝", "⋊", "⋉", "⟗", "▷"];
    for (let i = 0; i < operations.length; i++) {
        let operator = operations[i];
        let found = findOperation(tokenizedExpression, operator);
        if (found) {
            if (found.parametersBefore != null) {
                return { type: 'error', description: 'Odvečni parametri pred operacijo', location: found.parametersBefore.location, locationEnd: found.parametersBefore.locationEnd }
            }
            if (operator != "⨝" && operator != "⋉" && operator != "⋊" && operator != "⟗"  && operator != "▷" && found.parametersAfter != null) {
                return { type: 'error', description: 'Odvečni parametri po operaciji', location: found.parametersAfter.location, locationEnd: found.parametersAfter.locationEnd }
            }
            if (found.expressionBefore == null || found.expressionBefore.length == 0) {
                return { type: 'error', description: 'Manjka leva stran izraza', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd }
            }
            if (found.expressionAfter == null || found.expressionAfter.length == 0) {
                return { type: 'error', description: 'Manjka desna stran izraza', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd }
            }
            
            let rightSide = evaluateExpression(found.expressionAfter, null);
            if (rightSide.type == 'error') return rightSide;
            if (rightSide.type != 'result') return { type: 'error', description: 'Napaka desno od operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };

            if (operator == "←") {
                if (found.expressionBefore.length != 1 || (found.expressionBefore[0].type != "word" && found.expressionBefore[0].type != '"')) {
                    return { type: 'error', description: 'Na levi strani prirejanja vrednosti mora biti ime spremenljivke', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd }
                }
                let relationName = found.expressionBefore[0].token;
                let relation = rightSide.relation;
                relation.name = relationName;
                relation.shortName = relationName;
                relation.fromRelationName = getDefaultFromRelationName(relation);
                relations.push(relation);
                return rightSide;
            }
            
            let leftSide = evaluateExpression(found.expressionBefore, null);
            if (leftSide.type == 'error') return leftSide;
            if (leftSide.type != 'result') return { type: 'error', description: 'Napaka levo od operacije', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };

            // product
            if (operator == "⨯" || operator == "⨝" || operator == "⋉" || operator == "⋊" || operator == "⟗" || operator == "▷") {
                let explanation = "(" + leftSide.explanation + ') <span class="operator">' + operator + "</span>" + 
                (found.parametersAfter ? "<sub>" + found.parametersAfter.token + "</sub>" : "") + 
                " (" + rightSide.explanation + ")";
                let result = joinOperations(operator, leftSide.relation, rightSide.relation, found.parametersAfter, found.operationToken)
                result.explanation = explanation;
                return result;
            } else if (operator == "/") {
                return division(leftSide, rightSide, found.operationToken.location);
            }

            // check if types are correct
            if (JSON.stringify(leftSide.relation.types) != JSON.stringify(rightSide.relation.types)) {
                return { type: 'error', description: 'Tipi na levi in desni strani operacije se ne ujemajo', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd }
            }
            if (operator == "∪") {
                let combinedRelation = { ...leftSide.relation };
                leftRelation = convertDataToText(leftSide.relation);
                rightRelation = convertDataToText(rightSide.relation);
                combinedRelation.data = _.union(leftRelation.data, rightRelation.data);
                combinedRelation.name = leftRelation.name + operator + rightRelation.name;
                let explanation = "(" + leftSide.explanation + ') <span class="operator">' + operator + "</span> (" + rightSide.explanation + ")";
                return { type: 'result', relation: convertDataFromText(combinedRelation), explanation: explanation }
            } else if (operator == "∩") {
                let combinedRelation = { ...leftSide.relation };
                leftRelation = convertDataToText(leftSide.relation);
                rightRelation = convertDataToText(rightSide.relation);
                let explanation = "(" + leftSide.explanation + ') <span class="operator">' + operator + "</span> (" + rightSide.explanation + ")";
                combinedRelation.data = leftRelation.data.filter(value => rightRelation.data.includes(value));
                combinedRelation.name = leftRelation.name + operator + rightRelation.name;
                return { type: 'result', relation: convertDataFromText(combinedRelation), explanation: explanation };
            } else if (operator == "-") {
                return diference(leftSide, rightSide);
            }
        }
    }

}

function checkForInvalidOperations(tokenizedExpression) {
    let operations = ['∧', '∨', '¬', '=', '≠', '≤', '≥', '<', '>'];
    for (let i = 0; i < operations.length; i++) {
        let operator = operations[i];
        let found = findOperation(tokenizedExpression, operator);
        if (found) {
            return { type: 'error', description: 'Operacija ' + found.operationToken.token + ' ni definirana med relacijami (uporabla se samo znotraj logičnih izrazov).', location: found.operationToken.location, locationEnd: found.operationToken.locationEnd };
        }
    }
    return null;
}

function evaluateExpression(expression, startPosition) {
    let tokenizationResult = tokenize(expression, startPosition)
    if (tokenizationResult.type == "error") {
        return tokenizationResult
    }
    let tokenizedExpression = tokenizationResult.tokens;
    if (tokenizedExpression.length == 0) {
        return { type: 'error', description: 'Prazen izraz', location: startPosition, locationEnd: startPosition};
    }

    if (tokenizedExpression.length == 1 && tokenizedExpression[0].type == "(") {
        return evaluateExpression(tokenizedExpression[0].token, tokenizedExpression[0].location);
    }

    if (tokenizedExpression.length == 1) {
        return insertValue(tokenizedExpression, tokenizedExpression[0].location);
    }

    let result = applyDoubleOperations(tokenizedExpression);
    if (result) { return result; }

    result = applySimpleOperations(tokenizedExpression);
    if (result) { return result; }

    let izraz = "";
    tokenizedExpression.forEach(el => {
        izraz += " " + el.token;
    })

    result = checkForInvalidOperations(tokenizedExpression);
    if (result) { return result; }

    return { type: 'error', description: 'Neznana operacija:' + izraz, location: tokenizedExpression[0].location, locationEnd: tokenizedExpression.slice(-1)[0].locationEnd };
}

function prepareTesting() {
    if (window.RATesterAlreadyLoaded) {
	} else {
		window.RATesterAlreadyLoaded = true;
        $('div.answer>textarea').each(function(index) {
            if (getDomain(index)) {
                $('<div id="results-' + index + '"></div>').insertAfter(this);
                $(`<div class="d-grid gap-2"><span class="btn btn-primary" onclick="loadDomainAndRunEvaluation('div.answer>textarea', ` + index + `, 'results-` + index + `')">Evalviraj</span></div>`).insertAfter(this);
                let textarea = this;
                let html = "";
                html += "<div>";
                for (let i = 0; i < operationsForTokenization.length; i++) {
                    let tooltiptext = '<span class="buttontiptext">';
                    if (operationDescriptions.length > i) {
                        tooltiptext += operationDescriptions[i].name + '<br />';
                        for (let j = 0; j < operationDescriptions[i].examples.length; j++) {
                            tooltiptext += operationDescriptions[i].examples[j] + '<br />';
                        }
                    }
                    tooltiptext += '</span>';
                    html += "<div class=\"btn btn-primary buttontip\" onclick=\"addSymbol('" + operationsForTokenization[i] + "', 'div.answer>textarea', " + index + ")\">" + 
                    operationsForTokenization[i] + 
                    tooltiptext + 
                    "</div>"
                }
                html += "</div>";
                html += "<style>";
                html += getCSS();
                html += "</style>";
                textarea.insertAdjacentHTML('beforebegin', html);
            }
		});
    }
}

function getCSS() {
    return `
    .butt {
        border: 1px outset blue;
        background-color: lightBlue;
        height:20px;
        width:20px;
        cursor:pointer;
        float:left;
        text-align: center;
        }
        .red {
            color: red;
        }
        .butt:hover {
        background-color: blue;
        color:white;
        }
    .buttontip {
        position: relative;
        display: inline-block;
        border-bottom: 1px dotted black;
      }
  
      .buttontip .buttontiptext {
        visibility: hidden;
        width: 200px;
        background-color: black;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 5px 0;
        position: absolute;
        z-index: 1;
        top: 150%;
        left: 50%;
        margin-left: -100px;
      }
  
      .buttontip .buttontiptext::after {
        content: "";
        position: absolute;
        bottom: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent black transparent;
      }
  
      .buttontip:hover .buttontiptext {
        visibility: visible;
      }
    `;
}

function addSymbol(symbol, jqueryPath, index) {
    let myField = $(jqueryPath)[index];
    // let myField = document.getElementById("text");

    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = symbol;
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + symbol
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += symbol;
    }
}

$(document).ready(function() {
	prepareTesting();
});

function displayResult(id, result, expression) {
    let html = "";
    if (result.type == 'result') {
        html += '<div>';
        html += '<h5 style="text-align: center;">';
        html += result.explanation;
        html += '</h5>';

        html += '<table class="table table-striped">';
        html += "<tr>";
        for (let i = 0; i < result.relation.header.length; i++) {
            html += "<th>" + result.relation.header[i] + "</th>"
        }
        html += "</tr>";
        
        // html += "<tr>";
        // for (let i = 0; i < result.relation.fromRelationName.length; i++) {
        //     html += "<th>" + result.relation.fromRelationName[i] + "</th>"
        // }
        // html += "</tr>";

        for (let row = 0; row < result.relation.data.length; row++) {
            html += "<tr>";
            for (let i = 0; i < result.relation.data[row].length; i++) {
                html += "<td>" + result.relation.data[row][i] + "</td>"
            }
            html += "</tr>";
        }

        html += "</table></div>";
    } else {
        html += "<p>";
        html += result.description;
        html += "</p>";
        html += "<p>";
        html += expression.substring(0, result.location);
        html += '<span class="red">';
        html += expression.substring(result.location, result.locationEnd);
        html += '</span>';
        html += expression.substring(result.locationEnd);
        html += "</p>";
    }

    document.getElementById(id).innerHTML = html;
}

function runExpresionSequence(expressionsString, resultsId) {
    let relationsOld = [...relations];
    let expressions = expressionsString.split("\n");
    for (let i = 0; i < expressions.length; i++) {
        if (expressions[i].trim().length == 0) {continue;}
        result = evaluateExpression(expressions[i], 0);
        console.log(result);
        displayResult(resultsId, result, expressions[i])
    }
    relations = relationsOld;
}

function runEvaluation(jqueryPath, index, resultsId) {
    let expression = $(jqueryPath)[index].value
    expression = insertAlternativeSymbols(expression);
    runExpresionSequence(expression, resultsId);
}

function getDomain(index) {
    var question = $('div.answer>textarea:eq(' + index + ')').parent().parent().parent();
    var db = question.find('span:contains("Relacijska algebra nad domeno")>u').text().trim();
    if (db == '') {
        db = question.find('span:contains("Relacijska algebra nad domeno")>span').text().trim();
    }
    return db;
}

function loadDomainAndRunEvaluation(jqueryPath, index, resultsId) {
    let domain = getDomain(index);
    console.log(domain);
    if (domain != global_domain_name) {
        var client = new XMLHttpRequest();
        client.open('GET', 'https://raw.githubusercontent.com/TimotejK/OPB-LA/main/' + domain + '.js');
        client.onreadystatechange = function() {
            let js = client.responseText;
            eval(js);
            global_domain_name = domain;
            runEvaluation(jqueryPath, index, resultsId);
        }
        client.send();
    } else {
        runEvaluation(jqueryPath, index, resultsId);
    }
}