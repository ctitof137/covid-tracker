
$(document).ready(function () {
    google.charts.load('current', { packages: ['table', 'corechart', 'line'] })
    google.charts.setOnLoadCallback(function () {
        UpdateChart('Santa Clara City')
    })
})

function formatGoogleData(data) {

    var gdata = new google.visualization.DataTable();
    gdata.addColumn('string', 'Date')
    gdata.addColumn('number', 'Total')
    gdata.addColumn({ type: 'string', role: 'annotation' })
    gdata.addColumn({ type: 'string', role: 'annotationText' })
    gdata.addColumn('number', 'Daily new cases')
    gdata.addColumn('number', 'Daily new cases (7 day average)')

    let prev_total = data.entries[data.dates[0]].total
    let avg = []
    data.dates.forEach((date) => {
        let extrap = data.entries[date].extrapolated
        let delta = data.entries[date].total - prev_total
        avg.push(delta)
        if (avg.length > 7) avg.shift()
        let avg7 = Math.round((avg.reduce((acc, c) => acc + c, 0) / avg.length) *10)/10
        gdata.addRow([date, data.entries[date].total, extrap ? 'E' : null, extrap ? 'Missing data, total extrapolated' : null, delta, avg7])
        prev_total = data.entries[date].total
    })

    return gdata
}


function drawChart(data) {
    let chart_lines = new google.visualization.LineChart(document.getElementById("chart"))
    var view = new google.visualization.DataView(data);

    let options = {
        legend: { textStyle: { fontSize: 16, bold: true } , position: 'bottom'},
        height: 600, width: 1200,
        vAxis: {  gridlines: {count: 0}},
        vAxes: {
            0: {
                title:'Total cases',
                textStyle: {color: 'blue'},
                minValue: 0
            },
            1: {
                title:'Daily cases',
                textStyle: {color: 'orange'},
                minValue: 0
            },
        },
        hAxis: { title: "Date" },
        intervals: { "color": "series-color" },
        enableInteractivity: true,

        chart : {
            title: 'Reported covid-19 cases in Santa Clara City'
        },

        focusTarget : 'category',

        series: {
            0: { targetAxisIndex: 0 , color: "blue"},
            1: { targetAxisIndex: 1 , color: "orange"},
            2: { targetAxisIndex: 1 , color: "darkorange", curveType: 'function', lineWidth : 1, lineDashStyle : [4, 4] , min: 0}
        }
    };

    chart_lines.draw(view, options);
}

function UpdateChart(city) {
    $.ajax({
        url: '/covids/' + city,
        dataType: 'jsonp',
        jsonp: "callback",
        error: function (err) {
            console.log('Error:', err);
        },
        success: function (resp) {
            //console.log('Response:', resp)
            if (typeof resp.error === 'undefined') {
                let data = formatGoogleData(resp.results)

                drawChart(data)
            } else {
                console.log('Error fetching data:', resp)
            }
        }
    })
}