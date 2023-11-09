relations = [
    {
        name: 'JADRALEC', header: ['JID', 'JIme', 'Rang', 'Starost'], types: ['number', 'string', 'number', 'number'], shortName: 'j',
        data: [
            [1, "Jill", 1, 20],
            [2, "Jack", 4, 25],
            [3, "Albert", 3, 51],
            [4, "Jenn", 5, 73],
            [5, "Jeff", 5, 31],
            [6, "Edna", 4, 33],
            [7, "North", 2, 20]
        ]
    },
    {
        name: 'PLOVILO', header: ['PID', 'PIme', 'Barva'], types: ['number', 'string', 'string'], shortName: 'p',
        data: [
            [1, 'Betka', 'Bela'],
            [2, 'Micka', 'Modra'],
            [3, 'Mojca', 'Rdeča'],
            [4, 'Nika', 'Modra'],
            [5, 'Berta', 'Rumena']
        ]
    },
    {
        name: 'REZERVACIJA', header: ['JID', 'PID', 'Datum'], types: ['number', 'number', 'date'], shortName: 'r',
        data: [
            [3, 1, "1990-03-09"],
            [3, 2, "1950-06-02"],
            [3, 4, "1989-08-01"],
            [3, 2, "2001-01-07"],
            [1, 4, "2011-04-23"],
            [1, 5, "1990-03-10"],
            [2, 3, "1950-06-22"],
            [2, 2, "1989-08-21"],
            [4, 1, "2001-01-07"],
            [5, 1, "2021-04-23"],
            [5, 2, "2021-04-24"],
            [5, 3, "2021-04-25"],
            [5, 5, "2021-04-26"]
        ]
    }
]