const express = require('express')
const scdata = require('./santa_clara_data')
const app = express()
const port = process.env.PORT || 3000

app.use(express.static('public'))

var citydata = {}
function refreshData() {
    scdata.getData().then((results)=>{
        console.log('Data refreshed for Santa Clara')
        citydata['santaclara'] = results
    }).catch((e)=>{
        console.log('Error refreshing for Santa Clara:', e)
    })
}

app.get('/', (req, res) => {
    res.send('index.html')
})


app.get('/covids/:city', (req, res) => {
    const city = req.params.city
    if (city in citydata){
        res.jsonp(citydata[city])
    } else {
        res.status(201).jsonp({city: city, error : 'Results not available'})
    }
})

app.listen(port, () => {
    console.log('Server started on port '+port)
})


refreshData()
setInterval(refreshData, 60*60*1000)
