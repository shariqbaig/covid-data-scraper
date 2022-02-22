const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function getCovidData() {
    try {
        console.log('Starting Script');
        const siteUrl = 'https://dekhpakistan.com/coronavirus/sindh/';
        const covidData = [];

        try {
            const { data } = await axios({
                method: "GET",
                url: siteUrl
            });

            const $ = cheerio.load(data);
            const elemSelector = '#kt_content > div.d-flex.flex-column-fluid > div > div:nth-child(2) > div > div > div.card-body.p-0 > table > tbody > tr';
    
            $(elemSelector).each((parentIndex, parentElem) => {
                const children = $(parentElem).children();

                let data1 = getSpanData($, children[0], 'date', 'province');
                let data2 = getSpanData($, children[1], 'totalConfirmedCaseCountTillDate', 'dailyCaseCount');
                let data3 = getSpanData($, children[2], 'totalDeathCountTillDate', 'dailyDeathCount');
                let data4 = getSpanData($, children[3], 'totalRecoveryCountTillDate', 'dailyRecoveryCount');
                let data5 = getSpanData($, children[4], 'totalActiveCases', 'casesTodayAddedOrReduced');
                let data6 = getSpanData($, children[5], 'totalIncidenceRate', 'incidenceRateToday');
                let data7 = getSpanData($, children[6], 'totalCFRatio', 'cfRatioToday');

                const data = {...data1, ...data2, ...data3, ...data4, ...data5, ...data6, ...data7};

                if (data.date !== '1st January 1970') {
                    covidData.push(data);
                }
            });

            // console.log('Complete Data: ', covidData);
        }
        catch (err) {
            console.log(err);
        }

        await saveDataAsCSVFile(covidData);
    }
    catch (err) {
        console.log(err);
    }
}

function getSpanData($, children, fieldOne, fieldTwo) {
    let data = {};
    $(children).toArray().map(function(spans) {
        const spansData = $(spans).find('span').toArray();
        const valueOne = $(spansData[0]).text().trim();
        const valueTwo = $(spansData[1]).text().trim();
        data[fieldOne] = valueOne.replace(/,/g, '');
        data[fieldTwo] = valueTwo.replace(/,/g, '');
    });

    return data;
}

async function saveDataAsCSVFile(covidData) {
    try {
        const csvContent = [
            [
              "Date",
              "Province",
              "Total Confirmed Case Count Till Date",
              "Daily Case Count",
              "Total Death Count Till Date",
              "Daily Death Count",
              "Total Recovery Count Till Date",
              "Daily Recovery Count",
              "Total Active Cases",
              "Cases Today Added Or Reduced",
              "Total Incidence Rate",
              "Incidence Rate Today",
              "Total CF Ratio",
              "CF Ratio Today"
            ],
            ...covidData.map(item => [
              item.date,
              item.province,
              item.totalConfirmedCaseCountTillDate,
              item.dailyCaseCount,
              item.totalDeathCountTillDate,
              item.dailyDeathCount,
              item.totalRecoveryCountTillDate,
              item.dailyRecoveryCount,
              item.totalActiveCases,
              item.casesTodayAddedOrReduced,
              item.totalIncidenceRate,
              item.incidenceRateToday,
              item.totalCFRatio,
              item.cfRatioToday
            ])
        ].map(e => e.join(",")).join("\n");
        
        fs.open('covidData.csv', 'w', (err, file) => {
            if (err) {
                throw err;
            }

            console.log("File is created.");
        });

        const writeStream = fs.createWriteStream('covidData.csv');
        const pathName = writeStream.path;

        writeStream.write(csvContent);
        
        writeStream.on('finish', () => {
           console.log(`wrote all the array data to file ${pathName}`);
        });
        
        // handle the errors on the write process
        writeStream.on('error', (err) => {
            console.error(`There is an error writing the file ${pathName} => ${err}`)
        });
        
        // close the stream
        writeStream.end();
    }
    catch (err) {
        console.log(err);
    }
}

getCovidData();