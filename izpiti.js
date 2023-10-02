relations = [
    {
        name: 'studenti', header: ['SID', 'Ime'], types: ['number', 'string'], shortName: 's',
        data: [
            [1, "Franc"],
            [2, "Marija"],
            [3, "Janez"],
            [4, "Ana"],
            [5, "Marko"],
            [6, "Maja"]
        ]
    },{
        name: 'opravljeniIzpiti', header: ['SID', 'PID'], types: ['number', 'number'], shortName: 'o',
        data: [
            [1, 1],
            [1, 3],
            [2, 1],
            [2, 3],
            [3, 1],
            [3, 2],
            [4, 1],
            [4, 2],
            [4, 3],
            [5, 1],
            [5, 2],
            [5, 3],
            [6, 1]
        ]
    },
    {
        name: 'predmeti', header: ['PID', 'Ime'], types: ['number', 'string'], shortName: 'p',
        data: [
            [1, "OPB"],
            [2, "LA"],
            [3, "APS"]
        ]
    }
]