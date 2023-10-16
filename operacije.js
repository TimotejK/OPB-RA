function projection(result1, parametersToken) {
    let columnNames = result1.relation.header;
    let columnNamesWithPrefix = getPrefixedHeader(result1.relation);

    let includedColumns = [];
    let includedColumnIndex = [];
    let tokens = tokenize(parametersToken.token, parametersToken.location);
    if (tokens.type == 'error') { return tokens; }
    tokens = tokens.tokens;
    for (let j = 0; j < tokens.length; j++) {
        let convertedToken = convertTokenToVariableName(columnNames.concat(columnNamesWithPrefix), tokens[j].token);
        if (columnNames.includes(convertedToken)) {
            includedColumns.push(convertedToken);
            includedColumnIndex.push(columnNames.indexOf(convertedToken));
        } else if (columnNamesWithPrefix.includes(convertedToken)) {
            includedColumns.push(convertedToken);
            includedColumnIndex.push(columnNamesWithPrefix.indexOf(convertedToken));
        } else {
            return { type: 'error', description: 'Neveljavno ime stolpca', location: tokens[j].location, locationEnd: tokens[j].locationEnd };
        }
    }

    let newData = [];
    for (let j = 0; j < result1.relation.data.length; j++) {
        let row = [];
        for (let k = 0; k < includedColumnIndex.length; k++) {
            row.push(result1.relation.data[j][includedColumnIndex[k]]);
        }
        newData.push(row);
    }
    let types = [];
    let newHeader = [];
    let fromRelationName = [];
    for (let k = 0; k < includedColumnIndex.length; k++) {
        types.push(result1.relation.types[includedColumnIndex[k]]);
        newHeader.push(result1.relation.header[includedColumnIndex[k]]);
        fromRelationName.push(result1.relation.fromRelationName[includedColumnIndex[k]]);
    }

    let newName = "π" + result1.relation.name;
    let newRelation = { types: types, header: newHeader, data: newData, name: newName, fromRelationName: fromRelationName };
    let explanation = '<span class="operator">' + "π" + "</span><sub>" + parametersToken.token + "</sub> (" + result1.explanation + ")";
    return { type: 'result', relation: validateRelation(newRelation), explanation:explanation };
}

function diference(result1, result2) {
    let combinedRelation = { ...result1.relation };
    leftRelation = convertDataToText(result1.relation);
    rightRelation = convertDataToText(result2.relation);
    let explanation = "(" + result1.explanation + ') <span class="operator">' + "-" + "</span> (" + result2.explanation + ")";
    combinedRelation.data = leftRelation.data.filter(value => !rightRelation.data.includes(value));
    combinedRelation.name = leftRelation.name + "-" + rightRelation.name;
    return { type: 'result', relation: convertDataFromText(combinedRelation), explanation: explanation };
}

function joinOperations(operator, relation1, relation2, parametersToken, operationToken) {
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
        combinedRelation.fromRelationName = relation1.fromRelationName.concat(relation2.fromRelationName);
        combinedRelation.data = combinedData;
        combinedRelation.name = newName;
        return { type: 'result', relation: validateRelation(combinedRelation) };
    }

    if (operator == "⨝") {
        let combinedRelation = join(relation1, relation2, parametersToken, false, false, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
    if (operator == "⋊") {
        let combinedRelation = join(relation1, relation2, parametersToken, true, false, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
    if (operator == "⋉") {
        let combinedRelation = join(relation1, relation2, parametersToken, false, true, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
    if (operator == "⟗") {
        let combinedRelation = join(relation1, relation2, parametersToken, true, true, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
    if (operator == "▷") {
        let combinedRelation = join(relation1, relation2, parametersToken, false, false, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }

        let finalColumnsToken = { token: Array.from(getPrefixedHeader(relation1)).join(", "), type: 'word', location: 0, locationEnd: 1 }
        let p1 = projection({ type: 'result', relation: combinedRelation }, finalColumnsToken);
        return { type: 'result', relation: p1.relation };
    }
    return { type: 'error', description: 'Manjkajo parametri operacije', location: operationToken.location, locationEnd: operationToken.locationEnd }
}

function join(relation1, relation2, conditionToken, leftOuter, rightOuter, newName) {
    let combinedRelation = {};
    let combinedData = [];
    let used1 = new Array(relation1.data.length).fill(false);
    let used2 = new Array(relation2.data.length).fill(false);

    mainLoop:
    for (let a = 0; a < relation1.data.length; a++) {
        for (let b = 0; b < relation2.data.length; b++) {
            let parameters = {};
            let prefixedHeader = getPrefixedHeader(relation1);
            for (let i = 0; i < relation1.data[a].length; i++) {
                parameters[relation1.header[i]] = relation1.data[a][i];
                parameters[prefixedHeader[i]] = relation1.data[a][i];
            }
            let includeRow = false;
            let rowToInclude = [];
            if (conditionToken) {
                // Pogojni stik
                let prefixedHeader2 = getPrefixedHeader(relation2);
                for (let i = 0; i < relation2.data[b].length; i++) {
                    parameters[relation2.header[i]] = relation2.data[b][i];
                    parameters[prefixedHeader2[i]] = relation2.data[b][i];
                }
                let result = logicExpression(conditionToken.token, parameters, conditionToken.location)
                if (result.type == 'error') { return result; }
                if (result.type != 'logicValue') { return { type: 'error', description: 'Pogoj mora vrniti logično vrednost', location: conditionToken.location, locationEnd: conditionToken.locationEnd }; }
                includeRow = result.value;
                rowToInclude = relation1.data[a].concat(relation2.data[b]);
            } else {
                // Naravni stik
                let equal = true;
                let secondRow = [...relation1.data[a]];
                for (let i = 0; i < relation2.data[b].length; i++) {
                    if (relation2.header[i] in parameters) {
                        if (parameters[relation2.header[i]] != relation2.data[b][i]) {
                            equal = false;
                        }
                    } else {
                        secondRow.push(relation2.data[b][i])
                    }
                }
                includeRow = equal;
                rowToInclude = secondRow;
            }
            if (includeRow) {
                if (combinedData.length > maxNumberOfLines) {
                    break mainLoop;
                }
                combinedData.push(rowToInclude);
                used1[a] = true;
                used2[b] = true;
            }
        }
    }

    // add null values for outer joins
    if (leftOuter) {
        for (let i = 0; i < used1.length; i++) {
            if (!used1[i]) {
                if (combinedData.length > maxNumberOfLines) {
                    break;
                }
                combinedData.push(relation1.data[i].concat(new Array(relation2.header.length).fill(null)));
            }
        }
    }
    if (rightOuter) {
        for (let i = 0; i < used2.length; i++) {
            if (!used2[i]) {
                if (combinedData.length > maxNumberOfLines) {
                    break;
                }
                combinedData.push(new Array(relation1.header.length).fill(null).concat(relation2.data[i]));
            }
        }
    }

    if (conditionToken) {
        combinedRelation.types = relation1.types.concat(relation2.types);
        combinedRelation.fromRelationName = relation1.fromRelationName.concat(relation2.fromRelationName);
        combinedRelation.header = relation1.header.concat(relation2.header);
    } else {
        combinedRelation.types = [...relation1.types];
        combinedRelation.fromRelationName = [...relation1.fromRelationName];
        for (let i = 0; i < relation2.header.length; i++) {
            if (!relation1.header.includes(relation2.header[i])) {
                combinedRelation.types.push(relation2.types[i]);
                combinedRelation.fromRelationName.push(relation2.fromRelationName[i]);
            }
        }
        combinedRelation.header = relation1.header.concat(relation2.header.filter(el => !relation1.header.includes(el)));
    }
    combinedRelation.data = combinedData;
    combinedRelation.name = newName;
    return validateRelation(combinedRelation);
}

function division(result1, result2, location) {
    let relation1 = result1.relation;
    let relation2 = result2.relation;
    let columns1 = relation1.header;
    let columns2 = relation2.header;
    
    if (columns2.filter(el => !columns1.includes(el)).length > 0) {
        return { type: 'error', description: 'Atributi desne relacije morajo biti podmnožica atributov leve relacije.', location: location, locationEnd: location + 1 };
    }

    let finalColumns = columns1.filter(value => !columns2.includes(value))
    let finalColumnsToken = { token: Array.from(finalColumns).join(", "), type: 'word', location: 0, locationEnd: 1 }
    
    let p1 = projection(result1, finalColumnsToken);
    let r1 = joinOperations("⨯", p1.relation, result2.relation, null, null); // all possible combinations of first and second part of relations

    let columnsForComparison = r1.relation.header;
    let columnsForComparisonToken = { token: columnsForComparison.join(", "), type: 'word', location: 0, locationEnd: 1 }
    let result1WithReorderedColumns = projection(result1, columnsForComparisonToken);

    let r2 = diference(r1, result1WithReorderedColumns);
    let p2 = projection(r2, finalColumnsToken);
    let d1 = diference(p1, p2);
    if (d1.type == 'error') {
        return { type: 'error', description: 'Napaka pri izračunu deljenja.', location: location, locationEnd: location + 1 };
    }
    let newName = result1.relation.name + "/" + result2.relation.name;
    let explanation = "(" + result1.explanation + ') <span class="operator">' + "/" + "</span> (" + result2.explanation + ")";
    d1.relation.name = newName;
    d1.explanation = explanation;
    return d1;
}