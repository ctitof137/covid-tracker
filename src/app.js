const express = require('express')

const scdata = require('./santa_clara_data')

const app = express()

const port = process.env.PORT || 3000

app.use(express.static('public'))

var data2send = {}
function refreshData() {
    scdata.getData().then((results)=>{
        console.log('Data refreshed')
        data2send['Santa Clara City'] = results
    }).catch((e)=>{
        console.log('Error:', e)
    })
}

app.get('/', (req, res) => {
    res.send('index.html')
})


app.get('/covids/:id', (req, res) => {
    const city = req.params.id
    if (city in data2send){
        res.jsonp({city, results :data2send[req.params.id]})
    } else {
        res.status(201).jsonp({city, error : 'Results not available'})
    }
})

app.listen(port, () => {
    console.log('Server started on port '+port)
})


refreshData()
setInterval(refreshData, 60*60*1000)
