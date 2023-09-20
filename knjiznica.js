function findMatchingParenthesis(expression, firstLocation, open, close, startingPosition) {
    let i = firstLocation + 1;
    let level = 1;
    while (i < expression.length && level > 0) {
        if (expression[i] == close) {level--;}
        else if (expression[i] == open) {level++;}
        i++;
    }
    if (level > 0) {
        return {type: 'error', description: 'Manjka pripadajoči zaklepaj / narekovaj', location: startingPosition + firstLocation}
    }
    return {type: 'result', tokenStart: firstLocation, tokenEnd: i}
}

let operationsForTokenization = ['π','σ','ρ','τ', '⨯', '⨝', '⋉', '⋊', '∩', '∪', 
'∧', '∨', '¬', '=', '≠', '≥', '≤', '<', '>'];

function tokenize(expression, startPosition) {
    if (Array.isArray(expression)) {
        return {type: 'tokenizationResult', tokens: expression};
    } else if (typeof expression === 'object') {
        return {type: 'tokenizationResult', tokens: [expression]};
    }

    let tokenStart = 0;
    let tokenEnd = 0;
    let tokens = []

    let parenthesisPairs = [['(', ')'], ['[', ']'], ['"', '"'], ["'", "'"]];
    let tokenEndingChars = [' ', ';', ','];

    mainLoop:
    while (tokenEnd <= expression.length) {
        // recognise operations
        for (let j = 0; j < operationsForTokenization.length; j++) {
            if (expression.substr(tokenEnd, operationsForTokenization[j].length) == operationsForTokenization[j]) {
                tokens.push({token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition});
                tokens.push({token: expression.substr(tokenEnd, operationsForTokenization[j].length), type: 'operation', location: tokenEnd + startPosition});
                tokenStart = tokenEnd + operationsForTokenization[j].length;
                tokenEnd = tokenEnd + operationsForTokenization[j].length;
                continue mainLoop;
            }
        }

        // recognise parenthesis
        for (let j = 0; j < parenthesisPairs.length; j++) {
            if (expression[tokenEnd] == parenthesisPairs[j][0]) {
                tokens.push({token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition});
                result = findMatchingParenthesis(expression, tokenEnd, parenthesisPairs[j][0], parenthesisPairs[j][1], startPosition);
                if (result.type != 'result') return result;
                tokens.push({token: expression.substring(result['tokenStart'] + 1,
                    result['tokenEnd']-1), type: parenthesisPairs[j][0],
                    location: result['tokenStart'] + 1 + startPosition});
                tokenStart = result['tokenEnd'];
                tokenEnd = result['tokenEnd'];
                continue mainLoop;
            }
        }
        
        // recognise normal tokens
        if (tokenEndingChars.includes(expression[tokenEnd])) {
            tokens.push({token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition});
            tokenStart = tokenEnd + 1;
        }
        tokenEnd++;
    }
    if (tokenStart < tokenEnd-1) {
        // add the final token from the string
        tokens.push({token: expression.substring(tokenStart, tokenEnd), type: 'word', location: tokenStart + startPosition});
    }
    // remove empty tokens
    tokens = tokens.map(el => ({token: el.token.trim(), type: el.type, location: el.location}))
    tokens = tokens.filter(el => el.token.trim().length > 0);
    return {type: 'tokenizationResult', tokens: tokens};
}

function findOperation(tokenizedExpression, operation) {
    for (let i = 0; i < tokenizedExpression.length; i++) {
        if (tokenizedExpression[i].type == 'operation') {
            if (tokenizedExpression[i].token == operation) {
                let expressionBefore = null;
                let expressionAfter = null;
                let parametersBefore = null;
                if (i > 0 && tokenizedExpression[i-1].type == '[') {
                    parametersBefore = tokenizedExpression[i - 1]
                    expressionBefore = tokenizedExpression.slice(0, i - 1)
                } else {
                    expressionBefore = tokenizedExpression.slice(0, i)
                }
                let parametersAfter = null;
                if (i < tokenizedExpression.length-1 && tokenizedExpression[i+1].type == '[') {
                    parametersAfter = tokenizedExpression[i + 1]
                    expressionAfter = tokenizedExpression.slice(i + 2, tokenizedExpression.length)
                } else {
                    expressionAfter = tokenizedExpression.slice(i + 1, tokenizedExpression.length)
                }
                return {index: i, operationToken: tokenizedExpression[i], parametersBefore, parametersAfter, expressionBefore, expressionAfter}
            }
        }
    }
    return null;
}

let relations = [
    {name: 'oseba', header: ['ID', 'ime', 'rojen', 'SID'], types: ['number', 'string', 'date', 'number'],
        data: [
            [1, "Jill","1990-03-09", 1],
            [2, "Jack","1950-06-02", 1],
            [3, "Joe","1989-08-01", 4],
            [4, "Jenn","2001-01-07", 2],
            [5, "Jeff","NULL", 2],
            [6, "Edna","2011-04-23", 3],
            [7, "North","NULL", 3]
        ]},
    {name: 'facebook', header: ['OID', 'PID'], types: ['number', 'number'],
        data: [
        [1, 2],
        [2, 1],
        [2, 3],
        [3, 2],
        [2, 4],
        [4, 2],
        [3, 4],
        [4, 3]
        ]},
    {name: 'twitter', header: ['OID', 'SID'], types: ['number', 'number'],
        data: [
        [1, 2],
        [3, 2],
        [4, 3],
        [2, 4]
        ]}
]

function convertDataToText(relation) {
    let rows = [];
    relation.data.forEach(row => {
        rows.push(JSON.stringify(row));
    });
    return {name: relation.name, header: relation.header, types: relation.types, data: rows};
}
function convertDataFromText(relation) {
    let rows = [];
    relation.data.forEach(row => {
        rows.push(JSON.parse(row));
    });
    return {name: relation.name, header: relation.header, types: relation.types, data: rows};
}

function insertValue(tokenizedExpression) {
    if (tokenizedExpression.length == 1 && (tokenizedExpression[0].type == "word" || tokenizedExpression[0].type == '"')) {
        for (let i = 0; i < relations.length; i++) {
            if (relations[i].name == tokenizedExpression[0].token) {
                return {type: 'result', relation: relations[i]}
            }
        }
        return {type: 'error', description: 'Neznano ime spremenljivke', location: tokenizedExpression[0].location}
    } else {
        return {type: 'error', description: 'Manjkajoče ime spremenljivke', location: tokenizedExpression[0].location}
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
        return {type: 'error', description: 'Manjkajoča operacija', location: startPosition}
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
                return {type: 'error', description: 'Manjka izraz levo od operacije', location: found.operationToken.location};
            }
            let leftResult = logicExpression(found.expressionBefore, variables)
            if (leftResult.type == 'error') {return leftResult};
            
            if (!found.expressionAfter || found.expressionAfter.length == 0) {
                return {type: 'error', description: 'Manjka izraz desno od operacije', location: found.operationToken.location};
            }
            let rightResult = logicExpression(found.expressionAfter, variables)
            if (rightResult.type == 'error') {return rightResult};

            if (operationIsNumeric[i]) {
                if (leftResult.type != 'numericValue') {
                    return {type: 'error', description: 'Leva stran operacije mora imeti numerično vrednost', location: found.operationToken.location};
                }
                if (rightResult.type != 'numericValue') {
                    return {type: 'error', description: 'Desna stran operacije mora imeti numerično vrednost', location: found.operationToken.location};
                }
            } else {
                if (leftResult.type != 'logicValue') {
                    return {type: 'error', description: 'Leva stran operacije mora imeti logično vrednost', location: found.operationToken.location};
                }
                if (rightResult.type != 'logicValue') {
                    return {type: 'error', description: 'Desna stran operacije mora imeti logično vrednost', location: found.operationToken.location};
                }
            }
            let result = eval("leftResult.value " + operationsJS[i] + " rightResult.value")
            let resultType = null;
            if (resultIsNumeric[i]) {
                resultType = 'numericValue';
            } else {
                resultType = 'logicValue';
            }
            return {type: resultType, value: result};
        }
    }

    found = findOperation(tokenizedExpression, "¬");
    if (found) {
        // return (!logicExpression(found.expressionAfter, variables))

        if (found.expressionBefore && found.expressionBefore.length > 0) {
            return {type: 'error', description: 'Operacija pričakuje izraze samo na desni strani', location: found.operationToken.location};
        }
        
        if (!found.expressionAfter || found.expressionAfter.length == 0) {
            return {type: 'error', description: 'Manjka izraz desno od operacije', location: found.operationToken.location};
        }
        let rightResult = logicExpression(found.expressionBefore, variables)
        if (rightResult.type == 'error') {return rightResult};

        if (rightResult.type != 'logicValue') {
            return {type: 'error', description: 'Desna stran operacije mora imeti logično vrednost', location: found.operationToken.location};
        }

        let result = !rightResult.value
        return {type: 'logicValue', value: result};
    }

    if (tokenizedExpression.length == 1 && tokenizedExpression[0].type == "(") {
        return logicExpression(tokenizedExpression[0].token, variables);
    }
    
    if (tokenizedExpression.length == 1 && tokenizedExpression[0].type == "word") {
        if (tokenizedExpression[0].token in variables) {
            return {type: 'numericValue', value: variables[tokenizedExpression[0].token]}
        }
        if (isNumeric(tokenizedExpression[0].token)) {
            return {type: 'numericValue', value: parseFloat(tokenizedExpression[0].token)}
        }
    }
    
    if (tokenizedExpression.length == 1 && (tokenizedExpression[0].type == "\"" || tokenizedExpression[0].type == "'")) {
        return {type: 'numericValue', value: tokenizedExpression[0].token}
    }

    for (let i = 0; i < operationsForTokenization.length; i++) {
        let found = findOperation(tokenizedExpression, operationsForTokenization[i]);
        if (found) {
            return {type: 'error', description: 'Znotraj logičnih izrazov ni mogoča uporaba relacijskih operacij', location: found.operationToken.location}
        }
    } 

    return {type: 'error', description: 'Neznana operacija/spremenljivka', location: startPosition}
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }

function join(relation1, relation2, conditionToken, leftOuter, rightOuter, newName) {
    let combinedRelation = {};
    let combinedData = [];
    let used1 = new Array(relation1.data.length).fill(false);
    let used2 = new Array(relation2.data.length).fill(false);

    for (let a = 0; a < relation1.data.length; a++) {
        for (let b = 0; b < relation2.data.length; b++) {
            let parameters = {};
            for (let i = 0; i < relation1.data[a].length; i++) {
                parameters[relation1.header[i]] = relation1.data[a][i];
                parameters[relation1.name + "." + relation1.header[i]] = relation1.data[a][i];
            }
            for (let i = 0; i < relation2.data[b].length; i++) {
                parameters[relation2.header[i]] = relation2.data[b][i];
                parameters[relation2.name + "." + relation2.header[i]] = relation2.data[b][i];
            }
            let result = logicExpression(conditionToken.token, parameters, conditionToken.location)
            if (result.type == 'error') {return result;}
            if (result.type != 'logicValue') {return {type: 'error', description: 'Pogoj mora vrniti logično vrednost', location: conditionToken.location};}
            if (result.value) {
                combinedData.push(relation1.data[a].concat(relation2.data[b]));
                used1[a] = true;
                used2[b] = true;
            }
        }
    }

    // add null values for outer joins
    if (leftOuter) {
        for (let i = 0; i < used1.length; i++) {
            if (!used1[i]) {
                combinedData.push(relation1.data[i].concat(new Array(relation2.header.length).fill(null)));
            }
        }
    }
    if (rightOuter) {
        for (let i = 0; i < used2.length; i++) {
            if (!used2[i]) {
                combinedData.push(new Array(relation1.header.length).fill(null).concat(relation2.data[i]));
            }
        }
    }

    combinedRelation.types = relation1.types.concat(relation2.types);
    combinedRelation.header = relation1.header.concat(relation2.header);
    combinedRelation.data = combinedData;
    combinedRelation.name = newName;
    return combinedRelation;
}

function op(operator, relation1, relation2, parametersToken) {
    let newName = relation1.name + operator + relation2.name;
    if (operator == "⨯") {
        let combinedRelation = {};
        let combinedData = [];
        for (let a = 0; a < relation1.data.length; a++) {
            for (let b = 0; b < relation2.data.length; b++) {
                combinedData.push(relation1.data[a].concat(relation2.data[b]));
            }
        }
        combinedRelation.types = relation1.types.concat(relation2.types);
        combinedRelation.header = relation1.header.concat(relation2.header);
        combinedRelation.data = combinedData;
        combinedRelation.name = newName;
        return {type: 'result', relation: combinedRelation};
    }
    
    if (operator == "⨝" && !parametersToken) {
        let combinedRelation = {};
        let combinedData = [];
        for (let a = 0; a < relation1.data.length; a++) {
            for (let b = 0; b < relation2.data.length; b++) {
                let parameters = {};
                let equal = true;
                for (let i = 0; i < relation1.data[a].length; i++) {
                    parameters[relation1.header[i]] = relation1.data[a][i];
                }
                let secondRow = [];
                for (let i = 0; i < relation2.data[b].length; i++) {
                    if (relation2.header[i] in parameters) {
                        if (parameters[relation2.header[i]] != relation2.data[b][i]) {
                            equal = false;
                        }
                    } else {
                        secondRow.push(relation2.data[b][i])
                    }
                }
                if (equal) {
                    combinedData.push(relation1.data[a].concat(secondRow));
                }
            }
        }
        combinedRelation.types = relation1.types.concat(relation2.types);
        combinedRelation.header = relation1.header.concat(relation2.header.filter(el => !relation1.header.includes(el)));
        combinedRelation.data = combinedData;
        combinedRelation.name = newName;
        return {type: 'result', relation: combinedRelation};
    }
    
    if (operator == "⨝" && parametersToken) {
        let combinedRelation = join(relation1, relation2, parametersToken, false, false, newName);
        if (combinedRelation.type == 'error') {return combinedRelation;}
        else {return {type: 'result', relation: combinedRelation};}
    }
    if (operator == "⋊" && parametersToken) {
        let combinedRelation = join(relation1, relation2, parametersToken, true, false, newName);
        if (combinedRelation.type == 'error') {return combinedRelation;}
        else {return {type: 'result', relation: combinedRelation};}
    }
    if (operator == "⋉" && parametersToken) {
        let combinedRelation = join(relation1, relation2, parametersToken, false, true, newName);
        if (combinedRelation.type == 'error') {return combinedRelation;}
        else {return {type: 'result', relation: combinedRelation};}
    }
}

function applySimpleOperations(tokenizedExpression) {
    let operations = ["π", "σ", "ρ", "τ"];
    for (let i = 0; i < operations.length; i++) {
        let operator = operations[i];
        let found = findOperation(tokenizedExpression, operator);
        if (found) {
            if (operator != "τ" && found.parametersBefore != null) {
                return {type: 'error', description: 'Odvečni parametri pred operacijo', location: found.parametersBefore.location}
            }
            if (found.parametersAfter == null) {
                return {type: 'error', description: 'Manjkajo parametri operacije', location: found.operationToken.location}
            }
            if (found.expressionAfter == null) {
                return {type: 'error', description: 'Manjka desna stran izraza', location: found.operationToken.location}
            }
            
            let rightSide = evaluateExpression(found.expressionAfter, null);
            if (rightSide.type == 'error') return rightSide;
            if (rightSide.type != 'result') return {type: 'error', description: 'Napaka desno od operacije', location: found.operationToken.location};

            // product
            let newName = operator + rightSide.relation.name;
            if (operator == "π") {
                let columnNames = rightSide.relation.header;
                let includedColumns = [];
                let includedColumnIndex = [];
                let tokens = tokenize(found.parametersAfter.token, found.parametersAfter.location);
                if (tokens.type == 'error') {return tokens;}
                tokens = tokens.tokens;
                for (let j = 0; j < tokens.length; j++) {
                    if (columnNames.includes(tokens[j].token)) {
                        includedColumns.push(tokens[j].token);
                        includedColumnIndex.push(columnNames.indexOf(tokens[j].token));
                    } else {
                        return {type: 'error', description: 'Neveljavno ime stolpca', location: tokens[j].location};
                    }
                }
                
                let newData = [];
                for (let j = 0; j < rightSide.relation.data.length; j++) {
                    let row = [];
                    for (let k = 0; k < includedColumnIndex.length; k++) {
                        row.push(rightSide.relation.data[j][includedColumnIndex[k]]);
                    }
                    newData.push(row);
                }
                let types = [];
                for (let k = 0; k < includedColumnIndex.length; k++) {
                    types.push(rightSide.relation.types[includedColumnIndex[k]]);
                }

                let newRelation = {types: types, header: includedColumns, data: newData, name: newName};
                return {type: 'result', relation: newRelation};
            }
            
            if (operator == "σ") {
                let newData = [];
                for (let j = 0; j < rightSide.relation.data.length; j++) {
                    let variables = {};
                    for (let k = 0; k < rightSide.relation.data[j].length; k++) {
                        variables[rightSide.relation.header[k]] = rightSide.relation.data[j][k];
                    }

                    let result = logicExpression(found.parametersAfter.token, variables, found.parametersAfter.location);
                    if (result.type == 'error') {return result};
                    if (result.type != 'logicValue') {return {type: 'error', description: 'Pogoj mora vrniti logično vrednost', location: found.parametersAfter.location};}
                    if (result.value) {
                        newData.push(rightSide.relation.data[j]);
                    }
                }

                let newRelation = {types: rightSide.relation.types, header: rightSide.relation.header, data: newData, name: newName};
                return {type: 'result', relation: newRelation};
            }
            
            if (operator == "ρ") {
                let tokenizedArgument = tokenize(found.parametersAfter.token, found.parametersAfter.location);
                if (tokenizedArgument.type == 'error') {return tokenizedArgument;}
                tokenizedArgument = tokenizedArgument.tokens;
                let newRelationName = null;
                let newColumnNames = null;
                let newColumnNamesLocation = 0;
                for (let i = 0; i < tokenizedArgument.length; i++) {
                    if (tokenizedArgument[i].type == 'word' || tokenizedArgument[i].type == '"' || tokenizedArgument[i].type == "'") {
                        if (newRelationName) {
                            return {type: 'error', description: 'Dovoljeno je samo eno novo ime relacije', location: tokenizedArgument[i].location};
                        }
                        if (newColumnNames) {
                            return {type: 'error', description: 'Ime relacije mora biti pred imeni argumentov', location: tokenizedArgument[i].location};
                        }
                        newRelationName = tokenizedArgument[i].token;
                    }
                    if (tokenizedArgument[i].type == '(') {
                        if (newColumnNames) {
                            return {type: 'error', description: 'Nova imena argumentov lahko podaš samo enkrat', location: tokenizedArgument[i].location};
                        }
                        newColumnNames = tokenizedArgument[i].token;
                        newColumnNamesLocation = tokenizedArgument[i].location;
                    }
                }

                if (!newRelationName) {
                    newRelationName = newName;
                }
                if (newColumnNames) {
                    let tokenizedColumnNames = tokenize(newColumnNames, newColumnNamesLocation);
                    if (tokenizedColumnNames.type == 'error') {return tokenizedColumnNames;}
                    tokenizedColumnNames = tokenizedColumnNames.tokens;
                    if (tokenizedColumnNames.length != rightSide.relation.header.length) {
                        return {type: 'error', description: 'Število imen argumentov ni pravilno', location: newColumnNamesLocation};
                    }
                    let names = [];
                    for (let i = 0; i < tokenizedColumnNames.length; i++) {
                        names.push(tokenizedColumnNames[i].token);
                    }
                    newColumnNames = names;
                } else {
                    newColumnNames = rightSide.relation.header;
                }

                let newRelation = {types: rightSide.relation.types, header: newColumnNames, data: rightSide.relation.data, name: newRelationName};
                return {type: 'result', relation: newRelation};
            }

        }
    }
}

function applyDoubleOperations(tokenizedExpression) {
    let operations = ["∪", "∩", "⨯", "⨝", "⋊", "⋉"];
    for (let i = 0; i < operations.length; i++) {
        let operator = operations[i];
        let found = findOperation(tokenizedExpression, operator);
        if (found) {
            if (found.parametersBefore != null) {
                return {type: 'error', description: 'Odvečni parametri pred operacijo', location: found.parametersBefore.location}
            }
            if (operator != "⨝" && operator != "⋉" && operator != "⋊" && found.parametersAfter != null) {
                return {type: 'error', description: 'Odvečni parametri po operaciji', location: found.parametersAfter.location}
            }
            if (found.expressionBefore == null) {
                return {type: 'error', description: 'Manjka leva stran izraza', location: found.operationToken.location}
            }
            if (found.expressionAfter == null) {
                return {type: 'error', description: 'Manjka desna stran izraza', location: found.operationToken.location}
            }
            let leftSide = evaluateExpression(found.expressionBefore, null);
            if (leftSide.type == 'error') return leftSide;
            if (leftSide.type != 'result') return {type: 'error', description: 'Napaka levo od operacije', location: found.operationToken.location};
            let rightSide = evaluateExpression(found.expressionAfter, null);
            if (rightSide.type == 'error') return rightSide;
            if (rightSide.type != 'result') return {type: 'error', description: 'Napaka desno od operacije', location: found.operationToken.location};

            // product
            if (operator == "⨯" || operator == "⨝" || operator == "⋉" || operator == "⋊") {
                return op(operator, leftSide.relation, rightSide.relation, found.parametersAfter)
            }

            // check if types are correct
            if (JSON.stringify(leftSide.relation.types) != JSON.stringify(rightSide.relation.types)) {
                return {type: 'error', description: 'Tipi na levi in desni strani operacije se ne ujemajo', location: found.operationToken.location}
            }
            if (operator == "∪") {
                let combinedRelation = {...leftSide.relation};
                leftRelation = convertDataToText(leftSide.relation);
                rightRelation = convertDataToText(rightSide.relation);
                combinedRelation.data = _.union(leftRelation.data, rightRelation.data);
                combinedRelation.name = leftRelation.name + operator + rightRelation.name;
                return {type: 'result', relation: convertDataFromText(combinedRelation)}
            } else if (operator == "∩") {
                let combinedRelation = {...leftSide.relation};
                leftRelation = convertDataToText(leftSide.relation);
                rightRelation = convertDataToText(rightSide.relation);
                combinedRelation.data = leftRelation.data.filter(value => rightRelation.data.includes(value));
                combinedRelation.name = leftRelation.name + operator + rightRelation.name;
                return {type: 'result', relation: convertDataFromText(combinedRelation)};
            }
        }
    }
    
}

function evaluateExpression(expression, startPosition) {
    let tokenizationResult = tokenize(expression, startPosition)
    if (tokenizationResult.type == "error") {
        return tokenizationResult
    }
    let tokenizedExpression = tokenizationResult.tokens;
    if (tokenizedExpression.length == 0) { 
        return {type: 'error', description: 'Prazen izraz', location: startPosition};
    }

    if (tokenizedExpression.length == 1 && tokenizedExpression[0].type == "(") {
        return evaluateExpression(tokenizedExpression[0].token, tokenizedExpression[0].location);
    }

    if (tokenizedExpression.length == 1) {
        return insertValue(tokenizedExpression, tokenizedExpression[0].location);
    }
    
    let result = applyDoubleOperations(tokenizedExpression);
    if (result) {return result;}
    
    result = applySimpleOperations(tokenizedExpression);
    if (result) {return result;}

    let izraz = "";
    tokenizedExpression.forEach(el => {
        izraz += " " + el.token;
    })

    return {type: 'error', description: 'Neznana operacija:' + izraz, location: tokenizedExpression[0].location};
}

function buttons(id) {
    let textarea = document.getElementById(id);
    let html = "";
    html += "<div>";
    for (let i = 0; i < operationsForTokenization.length; i++) {
        html += "<div class=\"butt\" onclick=\"addSymbol('" + operationsForTokenization[i] + "')\">" + operationsForTokenization[i] + "</div>"
    }
    html += "</div><br/><br/><div id=\"results\"></div>";
    html += `
    <style>
    .butt {
      border: 1px outset blue;
      background-color: lightBlue;
      height:20px;
      width:20px;
      cursor:pointer;
      float:left;
      text-align: center;
    }

    .butt:hover {
      background-color: blue;
      color:white;
    }
  </style>`;
    textarea.insertAdjacentHTML('afterend', html);
}

function addSymbol(symbol) {
    let myField = document.getElementById("text");
    
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

window.onload = function(){buttons("text")};

function displayResult(id, result, expression) {
    let html = "";
    if (result.type == 'result') {
        html += "<div><table>";
        html += "<tr>";
        for (let i = 0; i < result.relation.header.length; i++) {
            html += "<th>" + result.relation.header[i] + "</th>"
        }
        html += "</tr>";

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
        html += " ^ ";
        html += expression.substring(result.location);
        html += "</p>";
    }

    document.getElementById('results').innerHTML = html;
}

function runEvaluation(id) {
    let expression = document.getElementById(id).value
    let result = evaluateExpression(expression, 0);
    console.log(result);
    displayResult(id, result, expression)
    // if (result.type == 'error') {
    // }
}