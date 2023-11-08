window.onload = function () { prepare(); };

function describeRelations() {
    let html = "";
    for (let i = 0; i < relations.length; i++) {
        let relation = relations[i];
        html += '<div class="click" onclick="addSymbol(\'' + relation.name + '\', \`#text\`, 0)">';
        html += relation.name;
        html += "</div>";
        for (let j = 0; j < relation.header.length; j++) {
            html += '<div class="click" style="margin-left: 4em;" onclick="addSymbol(\'' + relation.header[j] + '\', \`#text\`, 0)">';
            html += relation.header[j];
            html += '<small style="margin-left: 1em;" class="text-secondary">' + relation.types[j] + "</small>";
            html += "</div>";
        }
    }
    document.getElementById('relations-description').innerHTML = html;
}



function bootstrapButtons() {
    let groupSizes = [4, 6, 5, 5, 4, 0];
    let html = '';
    html += '<div class="btn-toolbar" role="toolbar">';
    let start = 0; end = groupSizes[0];
    for (let size = 0; size < groupSizes.length; size++) {
        html += '<div class="btn-group" role="group" aria-label="Operacije">';
        for (let i = start; i < end; i++) {
            let tooltiptext = '<span class="buttontiptext">';
            if (operationDescriptions.length > i) {
                tooltiptext += operationDescriptions[i].name + '<br />';
                for (let j = 0; j < operationDescriptions[i].examples.length; j++) {
                    tooltiptext += operationDescriptions[i].examples[j] + '<br />';
                }
            }
            tooltiptext += '</span>';

            html += '<button type="button" class="btn btn-outline-secondary buttontip" onclick="addSymbol(\'' + operationsForTokenization[i] + '\', \`#text\`, 0)">' + 
            operationsForTokenization[i] + 
            tooltiptext +
            '</button>';
        }
        html += '</div>';
        start += groupSizes[size];
        end += groupSizes[size + 1];
    }
    html += '</div>';
    document.getElementById('operationButtons').innerHTML = html;
}

function drawRelations() {
    let html = "";
    html += '<div class="row">';
    for (let i = 0; i < relations.length; i++) {
        let relation = relations[i];
        html += '<div class="col-md-6">';
        html += '<h5>'+relation.name+'</h5>'
        html += '<table class="table table-striped">';
        html += '<thead>';
        html += '<tr>';
        for (let j = 0; j < relation.header.length; j++) {
            html += '<th scope="col">' + relation.header[j] + '</th>';
        }
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        for (let j = 0; j < relation.data.length; j++) {
            html += '<tr>';
            for (let k = 0; k < relation.data[j].length; k++) {
                html += '<td>' + relation.data[j][k] + '</td>';
            }
            html += '</tr>';
        }
        html += '</tbody>';
        html += '</table>';
        html += '</div>';
    }
    html += '</div>';

    document.getElementById('relations').innerHTML = html;
}

function loadDomain(domain) {
    var client = new XMLHttpRequest();
    client.open('GET', 'https://raw.githubusercontent.com/TimotejK/OPB-LA/main/' + domain + '.js');
    client.onreadystatechange = function() {
        let js = client.responseText;
        // console.log(js);
        eval(js);
        describeRelations();
    }
    client.send();
}

function prepare() {
    document.getElementById('baza').value = 'facebooktwitter';
    document.getElementById('baza').onchange = function () {
        let value = this.value;
        loadDomain(value);
    }
    // drawRelations();
    describeRelations();
    bootstrapButtons();
}