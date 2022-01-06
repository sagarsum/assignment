

const APICred = "dict.1.1.20210216T114936Z.e4989dccd61b9626.373cddfbfb8a3b2ff30a03392b4e0b076f14cff9";

const request = require('request');
fetchFile();
function fetchFile() {
    request('http://norvig.com/big.txt', (err, res, body) => {
        if (err) {
            console.log(err);
        }
        var fileContents = body;
        uniWord(fileContents, 10).then(function (resJSON) {
            console.log(JSON.stringify(resJSON));
        }, function (err) {
            console.error(err);
        });

    }, function (err) {
        console.error(err);
    });
}


function fetchWdDet(el) {
    return new Promise(function (resolve, reject) {
        request('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + APICred + '&lang=en-en&text=' + el, (err, res, body) => {
            if (err) {
                reject(err);
            }
            resolve(body);
        });
    });
}

function uniWord(string, cutOff) {
    return new Promise(function (resolve, reject) {
        var formStr = string.replace(/[.,-/#!$%^&*;:{}=\-_`~()]/g, ""),
            textString = formStr.split(' '),
            occur = {},
            text, i;

        
        textString = textString.filter(entry => /\S/.test(entry));

        for (i = 0; i < textString.length; i++) {
            text = textString[i];
            occur[text] = occur[text] || 0;
            occur[text]++;
        }

        textString = Object.keys(occur);

        var initTextArr = textString.sort(function (a, b) {
            return occur[b] - occur[a];
        }).slice(0, cutOff);

        var retVal = [];
        var reqCtr = initTextArr.length;
        initTextArr.forEach(text => {
            var detURL = fetchWdDet(text);
            detURL.then(function (textDet) {
                textDet = JSON.parse(textDet);
                var retObj = {
                    "count": occur[text]
                };
                if (textDet.def[0]) {
                    if ("syn" in textDet.def[0]) {
                        retObj.synonyms = textDet.def[0].syn;
                    } else {
                        if ("mean" in textDet.def[0]) {
                            retObj.synonyms = textDet.def[0].mean;
                        } else {
                            retObj.synonyms = "Synonyms Not present";
                        }
                    }
                    if ("pos" in textDet.def[0]) {
                        retObj.pos = textDet.def[0].pos;
                    } else {
                        retObj.pos = "Part of speech not present";
                    }
                } else {
                    retObj.synonyms = "Synonyms Not present";
                    retObj.pos = "Part of speech not present";
                }

                retVal.push({
                    "text": text,
                    "output": retObj
                });
                reqCtr--;
                if (reqCtr === 0) {
                    retVal = retVal.sort(function (a, b) {
                        return b.output.count - a.output.count
                    })
                    var returnJson = {
                        "topwords": retVal
                    };
                    resolve(returnJson);
                }
            }, function (err) {
                console.error(err);
                reject(err);
            });
        });
    });
}