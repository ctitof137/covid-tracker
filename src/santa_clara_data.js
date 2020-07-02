const request = require('request')
const cheerio = require('cheerio')

function compareDates(a, b){
    let rea = a.match(/^(\d+)\/(\d+)\/2020/)
    let reb = b.match(/^(\d+)\/(\d+)\/2020/)
    let ma = parseInt(rea[1])
    let mb = parseInt(reb[1]) 
    let da = parseInt(rea[2])
    let db = parseInt(reb[2])
    if (ma > mb) return 1;
    if (ma < mb) return -1;
    return da - db;
}

function getData(){
    return new Promise((resolve, reject) => {
        let current = {url: 'http://www.santaclaraca.gov/i-want-to/stay-informed/current-topics/coronavirus-updates', id : '#ColumnUserControl4'}
        let archive = {url: 'https://www.santaclaraca.gov/i-want-to/stay-informed/newsroom/coronavirus-updates/archived-covid-19-news-updates', id : '#ColumnUserControl3'}
        request({url: current.url, headers: {'User-Agent':'request'}}, (err1, res1, body1) => {
            if (err1) return reject(err1)

            if (res1.statusCode == 200) {
                
                request({url: archive.url, headers: {'User-Agent':'request'}}, (err2, res2, body2) => {
                    if (err2) return reject(err2)

                    if (res2.statusCode == 200) {
                        let $ = cheerio.load(body1)
                        let result = $(current.id).text()
                        $ = cheerio.load(body2)
                        result = result + $(archive.id).text()

                        let ret = {}
                        let start_date = '12/31/2020'
                        let end_date = '1/1/2020'
                        result.split('Update ').forEach( (val, i) => {
                            val = val.replace(/(\r\n|\n|\r)/gm,' ').replace(/\s\s+/g, ' ')
                            let m = val.match(/^(\d+)\/(\d+)\/2020:.*The County of Santa Clara Department of Public Health.* for a total of (\d+,?\d+) with .* deaths .* (\d+) confirmed COVID-19 cases in the city of Santa Clara/)
                            if (m){
                                let date = m[1]+'/'+m[2]+'/2020'
                                ret[date] = {total: parseInt(m[4]), county_total : parseInt(m[3].replace(',',''))}
                                if (compareDates(start_date, date) > 0) start_date = date
                                if (compareDates(end_date, date) < 0) end_date = date
                            }
                        })

                        if (compareDates(start_date, '4/28/2020') < 0) start_date = '4/28/2020' //too little data and many gaps before that date,just ignore it

                        // fill date gaps
                        let dates = []
                        let backtrack = []
                        let prev_total = NaN
                        let prev_county_total = NaN
                        for (let m = 1; m<=12; m++){
                            let date = null
                            for (let d = 1; d<=31; d++){
                                if ((m == 2 && d > 28) || (m <= 6 && m%2 == 0 && d > 30) || (m > 6 && m%2 == 1 && d>30)) continue;
                                date = m+'/'+d+'/2020'
                                if (compareDates(date,start_date) >= 0 && compareDates(date,end_date) <= 0){
                                    if (!( date in ret)){
                                        backtrack.push(date)
                                        ret[date] = {'total': NaN, county_total: NaN, 'extrapolated':false}
                                    } else {
                                        let tot = ret[date].total
                                        let county_tot = ret[date].county_total
                                        backtrack.forEach((val, i) => {
                                            let delta = (tot - prev_total)/(backtrack.length+1)*(i+1)
                                            let county_delta = (county_tot - prev_county_total)/(backtrack.length+1)*(i+1)
                                            ret[backtrack[i]].total = Math.floor(prev_total+delta)
                                            ret[backtrack[i]].county_total = Math.floor(prev_county_total+county_delta)
                                            ret[backtrack[i]].extrapolated = true
                                        })
                                        backtrack = []
                                        prev_total = tot
                                        prev_county_total = county_tot
                                    }
                                    dates.push(date)
                                }
                            }
                            if (compareDates(date, end_date) >= 0) {
                                break
                            }
                        }
                        resolve({city: 'Santa Clara City', county: "Santa Clara County", city_count: 130000, county_count: 1928000, dates, entries: ret})
                    } else {
                        reject('Invalid status code:' + res2.statusCode)
                    }
                })
            } else {
                reject('Invalid status code:' + res1.statusCode)
            }
        })
    })
}

module.exports = {getData}

