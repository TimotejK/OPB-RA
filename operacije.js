function projection(result1, parametersToken) {
    let columnNames = result1.relation.header;
    let includedColumns = [];
    let includedColumnIndex = [];
    let tokens = tokenize(parametersToken.token, parametersToken.location);
    if (tokens.type == 'error') { return tokens; }
    tokens = tokens.tokens;
    for (let j = 0; j < tokens.length; j++) {
        let convertedToken = convertTokenToVariableName(columnNames, tokens[j].token);
        if (columnNames.includes(convertedToken)) {
            includedColumns.push(convertedToken);
            includedColumnIndex.push(columnNames.indexOf(convertedToken));
        } else {
            return { type: 'error', description: 'Neveljavno ime stolpca', location: tokens[j].location };
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
    for (let k = 0; k < includedColumnIndex.length; k++) {
        types.push(result1.relation.types[includedColumnIndex[k]]);
    }

    let newName = "π" + result1.relation.name;
    let newRelation = { types: types, header: includedColumns, data: newData, name: newName };
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

function joinOperations(operator, relation1, relation2, parametersToken) {
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
        return { type: 'result', relation: validateRelation(combinedRelation) };
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
        return { type: 'result', relation: validateRelation(combinedRelation) };
    }

    if (operator == "⨝" && parametersToken) {
        let combinedRelation = join(relation1, relation2, parametersToken, false, false, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
    if (operator == "⋊" && parametersToken) {
        let combinedRelation = join(relation1, relation2, parametersToken, true, false, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
    if (operator == "⋉" && parametersToken) {
        let combinedRelation = join(relation1, relation2, parametersToken, false, true, newName);
        if (combinedRelation.type == 'error') { return combinedRelation; }
        else { return { type: 'result', relation: combinedRelation }; }
    }
}

function division(result1, result2) {
    let relation1 = result1.relation;
    let relation2 = result2.relation;
    let columns1 = relation1.header;
    let columns2 = relation2.header;
    let finalColumns = columns1.filter(value => !columns2.includes(value))
    let finalColumnsToken = { token: Array.from(finalColumns).join(", "), type: 'word', location: 0 }
    
    let p1 = projection(result1, finalColumnsToken);
    let r1 = joinOperations("⨯", p1.relation, result2.relation, null);
    let r2 = diference(r1, result1);
    let p2 = projection(r2, finalColumnsToken);
    return diference(p1, p2);
}