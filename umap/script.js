function updateUMAP(UMAP_DATA) {
    data = UMAP_DATA.data;

    // Better display of em-dash
    data.forEach(d => d.name = d.name.replace(/---/g, "—"));

    const chartDom = document.getElementById('chart');
    const umapChart = echarts.init(chartDom);
    let option;

    let fontSize = parseFloat(window.getComputedStyle(document.body).getPropertyValue('font-size'));

    // Colors for different clusters
    let clusters = [...new Set(data.map(d => d.cluster))];
    let color_multipliers = [...Array(clusters.length).keys()];
    for (let i = color_multipliers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [color_multipliers[i], color_multipliers[j]] = [color_multipliers[j], color_multipliers[i]];
    } 

    let colors = clusters.map((_, i) => `hsl(${color_multipliers[i] * 345 / clusters.length}, ${Math.random() * 25 + 75}%, ${Math.random() * 15 + 25}%)`);

    // min and max for x and y to add some padding to the plot
    let xValues = data.map(d => d.x);
    let yValues = data.map(d => d.y);
    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);
    let xPadding = (xMax - xMin) * 0.1;
    let yPadding = (yMax - yMin) * 0.1;

    option = {
        xAxis: {
            show: false,
            min: xMin - xPadding,
            max: xMax + xPadding,
        },
        yAxis: {
            show: false,
            min: yMin - yPadding,
            max: yMax + yPadding,
        },
        grid: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        },
        series: [{
            type: 'scatter',
            data: data.map(d => [d.x, d.y, d.cluster, d.name]),
            symbolSize: 0.4 * fontSize,
            itemStyle: {
                color: function (params) {
                    return colors[params.data[2]];
                },
            },
        }],
        tooltip: {
            formatter: function (params) {
                return "<strong>Chapter: </strong>" + params.data[3] + "<br/>" + "<strong>Cluster ID: </strong>" + params.data[2];
            },
            textStyle: {
                overflow: 'break',
            },
        },
        dataZoom: [
            {
                type: 'slider',
                show: true,
                filterMode: 'none',
                xAxisIndex: [0],
                bottom: '0%',
                start: 0,
                end: 100,
            },
            {
                type: 'slider',
                show: true,
                filterMode: 'none',
                yAxisIndex: [0],
                right: '0%',
                start: 0,
                end: 100,
            },
            {
                type: 'inside',
                filterMode: 'none',
                xAxisIndex: [0],
                start: 0,
                end: 100,
            },
            {
                type: 'inside',
                filterMode: 'none',
                yAxisIndex: [0],
                start: 0,
                end: 100,
            },
        ],
    };

    option && umapChart.setOption(option);

    umapChart.on('dataZoom', function (params) {
        let zoomScale = (params.batch ? params.batch[0].end - params.batch[0].start : params.end - params.start) / 100;

        let newSymbolSize = 0.35 * fontSize / zoomScale;
        umapChart.setOption({
            series: [{
                symbolSize: newSymbolSize,
            }]
        });
    });
}

window.onresize = function() {
    const chartDom = document.getElementById('chart');
    const umapChart = echarts.getInstanceByDom(chartDom);
    umapChart.resize();
}

window.onload = async function() {
    const UMAP_DATA = await fetch("./aob_leiden_almost_final.json")
        .then(response => response.json())
        .then(data => data);

    updateUMAP(UMAP_DATA);


    // Remove all iframe elements in the page
    // Some extensions inject iframes into the page that shift the layout (I'm looking at you, Zotero)
    setTimeout(() => {
        let iframes = document.querySelectorAll('iframe');
        for (let i=0; i<iframes.length; i++) {
            iframes[i].remove();
        }
    }, 1500);
}