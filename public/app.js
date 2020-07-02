
$(document).ready(function () {
    google.charts.load('current', { packages: ['table', 'corechart', 'line'] })
    google.charts.setOnLoadCallback(function () {

        $('#data-buttons').on('click','button',function(){
            $('#data-buttons button').removeClass('btn-info')
            $('#data-buttons button').addClass('btn-outline-info')
            $(this).removeClass('btn-outline-info')
            $(this).addClass('btn-info')
            
            drawTotal()
            drawDaily()
        });

        $('#daily-buttons').on('click','button',function(){
            $('#daily-buttons button').removeClass('btn-info')
            $('#daily-buttons button').addClass('btn-outline-info')
            $(this).removeClass('btn-outline-info')
            $(this).addClass('btn-info')
            
            drawDaily()
        });

        // fetch data and render first time
        UpdateChart('santaclara')

    })
})

function getGoogleData(data) {
    if( typeof getGoogleData.gdata === 'undefined' || data) {
        var gdata = new google.visualization.DataTable();
        gdata.addColumn('string', 'Date')
        gdata.addColumn('number', 'Total')
        gdata.addColumn({ type: 'string', role: 'annotation' })
        gdata.addColumn({ type: 'string', role: 'annotationText' })
        gdata.addColumn('number', 'Daily cases')
        gdata.addColumn('number', 'Daily cases (7 day average)')

        gdata.addColumn('number', 'Total / million')
        gdata.addColumn('number', 'Daily cases / million')
        gdata.addColumn('number', 'Daily cases (7 day average) / million')

        gdata.addColumn('number', 'Total County / million')
        gdata.addColumn('number', 'Daily cases County / million')
        gdata.addColumn('number', 'Daily cases County (7 day average) / million')

        let prev_total = data.entries[data.dates[0]].total
        let prev_county_total = data.entries[data.dates[0]].county_total
        let avg = []
        let avg_county = []
        let city_ratio = data.city_count/1000000
        let county_ratio = data.county_count/1000000
        data.dates.forEach((date) => {
            let extrap = data.entries[date].extrapolated

            let delta = data.entries[date].total - prev_total
            avg.push(delta)
            if (avg.length > 7) avg.shift()
            let avg7 = Math.round((avg.reduce((acc, c) => acc + c, 0) / avg.length) *10)/10

            let delta_county = data.entries[date].county_total - prev_county_total
            avg_county.push(delta_county)
            if (avg_county.length > 7) avg_county.shift()
            let avg_county7 = Math.round((avg_county.reduce((acc, c) => acc + c, 0) / avg_county.length) *10)/10

            gdata.addRow([date, data.entries[date].total, extrap ? 'E' : null, extrap ? 'Missing data, total extrapolated' : null, delta, avg7,
                                Math.round(data.entries[date].total/city_ratio*10)/10, Math.round(delta/city_ratio*10)/10, Math.round(avg7/city_ratio*10)/10,
                                Math.round(data.entries[date].county_total/county_ratio*10)/10, Math.round(delta_county/county_ratio*10)/10, Math.round(avg_county7/county_ratio*10)/10,
                            ])
            prev_total = data.entries[date].total
            prev_county_total = data.entries[date].county_total
        })

        getGoogleData.gdata = gdata
    }
    return getGoogleData.gdata
}


function drawTotal() {
    let data = getGoogleData()
    let chart_lines = new google.visualization.LineChart(document.getElementById("chart_total"))
    var view = new google.visualization.DataView(data);

    let absolute = $('#data-buttons').find('.btn-info').text() == 'Show absolute numbers'
    if (absolute){
        view.setColumns([0,1,2,3])
    } else {
        view.setColumns([0,6,9])
    }


    let options = {
        legend: { textStyle: { fontSize: 12, bold: true } , position: 'bottom'},
        vAxis: {  gridlines: {count: 0}},
        vAxis: {
                title:'Total cases',
                minValue: 0
        },
        hAxis: { title: "Date" },
        intervals: { "color": "series-color" },
        enableInteractivity: true,
        focusTarget : 'category',
        chart : {
            title: 'Total reported covid-19 cases in Santa Clara City'
        },
        colors:["DarkSlateGray", "Gray"]
    };

    chart_lines.draw(view, options);
}


function drawDaily(){
    let data = getGoogleData()
    let chart_lines = new google.visualization.LineChart(document.getElementById("chart_daily"))
    var view = new google.visualization.DataView(data);

    let average = $('#daily-buttons').find('.btn-info').text() == 'Show 7 day average'
    let absolute = $('#data-buttons').find('.btn-info').text() == 'Show absolute numbers'
    if (absolute){
        if (average) view.setColumns([0,5])
        else view.setColumns([0,4])
    } else {
        if (average) view.setColumns([0,8,11])
        else view.setColumns([0,7,10])
    }


    let options = {
        legend: { textStyle: { fontSize: 12, bold: true } , position: 'bottom'},
        vAxis: {  gridlines: {count: 0}},
        vAxis: {
                title:'Daily cases',
                minValue: 0
        },
        hAxis: { title: "Date" },
        enableInteractivity: true,
        focusTarget : 'category',
        curveType: average ? 'function' : 'none',
        chart : {
            title: 'Total reported covid-19 cases in Santa Clara City'
        },
        colors:["DarkSlateGray", "Gray"]
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
            if (typeof resp.error === 'undefined') {
                getGoogleData(resp)

                drawTotal()
                drawDaily()
            } else {
                console.log('Error fetching data:', resp)
            }
        }
    })
}