app.get('/api/getlayer/:layer/:query.svg', async (req, res) => {
    console.log("Endpoint hit");
    const { layer, query } = req.params;
    console.log('Request Parameters:', req.params);

    const WFS_URL = `${config.geoserverurl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${config.workspacename}:${layer}&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(query)}`;
    console.log('WFS URL:', WFS_URL);

    try {
        const response = await axios.get(WFS_URL);
        if (response.status !== 200) {
            console.error('Error fetching WFS data:', response.statusText);
            res.type('text/plain');
            res.status(500).send('Error fetching WFS data');
            return;
        }

        const geojsonData = response.data;
        if (!geojsonData || !geojsonData.features) {
            console.error('Invalid GeoJSON data:', geojsonData);
            res.type('text/plain');
            res.status(500).send('Invalid GeoJSON data');
            return;
        }

        const options = { viewportSize: { width: 256, height: 256 } };
        const converter = new GeoJSON2SVG(options);
        const paths = converter.convert(geojsonData);

        // Ensure paths is an array and convert to string if necessary
        let svg = '';
        if (Array.isArray(paths)) {
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${paths.join(' ')}</svg>`;
        } else if (typeof paths === 'string') {
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${paths}</svg>`;
        } else {
            console.error('Unexpected SVG output:', paths);
            res.type('text/plain');
            res.status(500).send('Invalid SVG generated');
            return;
        }

        if (!svg.trim().startsWith('<svg')) {
            console.error('Invalid SVG generated:', svg);
            res.type('text/plain');
            res.status(500).send('Invalid SVG generated');
            return;
        }

        fs.writeFile('generated_svg.svg', svg, function (err) {
            if (err) throw err;
            console.log('SVG saved to generated_svg.svg');
        });

        console.log('Generated SVG:', svg);

        res.type('image/svg+xml');
        res.send(svg);
    } catch (error) {
        console.error('Error fetching WFS data:', error);
        res.type('text/plain');
        res.status(500).send('Error fetching WFS data');
    }
});