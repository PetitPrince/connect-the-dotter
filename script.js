document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const symbolSelect = document.getElementById('symbol');
    const labelTypeSelect = document.getElementById('labelType');
    const fontSizeInput = document.getElementById('fontSize');
    const backgroundImageInput = document.getElementById('backgroundImageInput');
    const toggleBackgroundButton = document.getElementById('toggleBackground');
    const addSeriesButton = document.getElementById('addSeries');
    const removeSeriesButton = document.getElementById('removeSeries');
    const clearCanvasButton = document.getElementById('clearCanvas');
    const exportJsonButton = document.getElementById('exportJson');
    const importJsonButton = document.getElementById('importJson');
    const importJsonFile = document.getElementById('importJsonFile');
    const exportSvgButton = document.getElementById('exportSvg');
    const jsonOutput = document.getElementById('jsonOutput');
    const pointList = document.getElementById('pointList');
    const toggleLinesButton = document.getElementById('toggleLines');

    let points = [];
    let seriesCount = 1; // Number of series
    let currentSeries = 0;
    let backgroundImage = null;
    let backgroundImageVisible = true;
    let bkg_img_newWidth = canvas.width;
    let bkg_img_newHeight = canvas.height;
    let bkg_img_offsetX = 0;
    let bkg_img_offsetY = 0;



    function drawCanvas(offsetX = 0, offsetY = 0, width = canvas.width, height = canvas.height) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage && backgroundImageVisible) {
            ctx.drawImage(backgroundImage, offsetX, offsetY, width, height);
        }
        points.forEach(point => {
            drawPoint(point.x, point.y, point.symbol, point.text, point.fontSize);
        });
        if (toggleLinesButton.checked) {
            drawLines();
        }
    }

    function drawAllPoints(offsetX = 0, offsetY = 0, width = canvas.width, height = canvas.height) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage && backgroundImageVisible) {
            ctx.drawImage(backgroundImage, offsetX, offsetY, width, height);
        }
        points.forEach(point => {
            const series = document.querySelectorAll('.series h3 input')[point.series];
            if (series != undefined && series.checked) {
                drawPoint(point.x, point.y, point.symbol, point.label, point.fontSize);
            }
        });
    }

    toggleLinesButton.addEventListener('click', () => {
        drawCanvas();
    });

    function drawPoint(x, y, symbol, label, fontSize) {
        ctx.beginPath();
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(label, x + 10, y - 10);

        switch (symbol) {
            case 'circle':
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'star':
                drawStar(x, y, 5, 10, 5);
                ctx.fill();
                break;
            case 'triangle':
                drawTriangle(x, y, 10);
                ctx.fill();
                break;
            default:
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
        }
        if (toggleLinesButton.checked) { // Only draw lines if the toggleLinesButton is checked
            drawLines();
        }
    }

    function drawLines() {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }

    function drawTriangle(cx, cy, size) {
        const height = size * (Math.sqrt(3) / 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy - height / 2);
        ctx.lineTo(cx - size / 2, cy + height / 2);
        ctx.lineTo(cx + size / 2, cy + height / 2);
        ctx.closePath();
    }

    function getNextLabel(index, type) {
        switch (type) {
            case 'numeric':
                return (index + 1).toString();
            case 'alpha':
                return String.fromCharCode(97 + index);
            case 'roman':
                return toRoman(index + 1);
            default:
                return (index + 1).toString();
        }
    }

    function toRoman(num) {
        const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
        let roman = '';
        for (let i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    }

    function updatePointList() {
        pointList.innerHTML = '';
        const seriesMap = new Map();
        points.forEach(point => {
            if (!seriesMap.has(point.series)) {
                seriesMap.set(point.series, []);
            }
            seriesMap.get(point.series).push(point);
        });

        seriesMap.forEach((seriesPoints, series) => {
            const seriesDiv = document.createElement('div');
            seriesDiv.className = 'series';
            const seriesTitle = document.createElement('h3');
            seriesTitle.textContent = `Series ${series + 1}`;
            const seriesToggle = document.createElement('input');
            seriesToggle.type = 'checkbox';
            seriesToggle.checked = true;
            seriesToggle.addEventListener('change', () => {
                drawAllPoints(bkg_img_offsetX, bkg_img_offsetY, bkg_img_newWidth, bkg_img_newHeight);
            });
            seriesTitle.appendChild(seriesToggle);
            seriesDiv.appendChild(seriesTitle);

            seriesPoints.forEach((point, index) => {
                const pointDiv = document.createElement('div');
                pointDiv.textContent = `(${point.x.toFixed(0)}, ${point.y.toFixed(0)}) - ${point.label}`;
                pointDiv.draggable = true;
                pointDiv.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index);
                    e.dataTransfer.setData('series', series);
                });
                seriesDiv.appendChild(pointDiv);
            });

            pointList.appendChild(seriesDiv);
        });
    }



    clearCanvasButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        points = [];
        updatePointList();
    });

    exportJsonButton.addEventListener('click', () => {
        let jsontext = JSON.stringify(points, null, 2);
        jsonOutput.value = jsontext;
        const blob = new Blob([jsontext], { type: 'text/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'connect-the-dots.json';
        link.click();

    });

    exportSvgButton.addEventListener('click', () => {
        const svg = generateSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'connect-the-dots.svg';
        link.click();
    });

    importJsonButton.addEventListener('click', () => {
        importJsonFile.click();
    });

    importJsonFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const importedPoints = JSON.parse(e.target.result);
            points = importedPoints;
            seriesCount = Math.max(...points.map(p => p.series)) + 1;
            currentSeries = seriesCount - 1;
            drawAllPoints(bkg_img_offsetX, bkg_img_offsetY, bkg_img_newWidth, bkg_img_newHeight);
            updatePointList();
        };
        reader.readAsText(file);
    });

    backgroundImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                let newWidth, newHeight, offsetX, offsetY;

                if (img.width > img.height) {
                    newWidth = canvas.width;
                    newHeight = newWidth / aspectRatio;
                    offsetX = 0;
                    offsetY = (canvas.height - newHeight) / 2;

                    bkg_img_newWidth = newWidth;
                    bkg_img_newHeight = newHeight;
                    bkg_img_offsetX = offsetX;
                    bkg_img_offsetY = offsetY;

                } else {
                    newHeight = canvas.height;
                    newWidth = newHeight * aspectRatio;
                    offsetY = 0;
                    offsetX = (canvas.width - newWidth) / 2;
                    bkg_img_newWidth = newWidth;
                    bkg_img_newHeight = newHeight;
                    bkg_img_offsetX = offsetX;
                    bkg_img_offsetY = offsetY;

                }

                backgroundImage = img;
                drawCanvas(offsetX, offsetY, newWidth, newHeight);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    toggleBackgroundButton.addEventListener('click', () => {
        backgroundImageVisible = !backgroundImageVisible;
        drawAllPoints(bkg_img_offsetX, bkg_img_offsetY, bkg_img_newWidth, bkg_img_newHeight);
    });

    addSeriesButton.addEventListener('click', () => {
        seriesCount++;
        currentSeries = seriesCount - 1;
        updatePointList();
    });

    removeSeriesButton.addEventListener('click', () => {
        if (seriesCount > 0) {
            points = points.filter(point => point.series !== currentSeries);
            seriesCount--;
            currentSeries = seriesCount - 1;
            updatePointList();
            drawAllPoints(bkg_img_offsetX, bkg_img_offsetY, bkg_img_newWidth, bkg_img_newHeight);
        }
    });


    // canvas.addEventListener('click', (event) => {
    //     const rect = canvas.getBoundingClientRect();
    //     const x = event.clientX - rect.left;
    //     const y = event.clientY - rect.top;
    // });

    ////

    let isDragging = false;
    let draggedIndex = -1;

    canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if the mouse is over a point
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (Math.hypot(point.x - x, point.y - y) < 10) {
                isDragging = true;
                draggedIndex = i;
                break;
            }
        }
        if (!isDragging) {
            const symbol = symbolSelect.value;
            const labelType = labelTypeSelect.value;
            const fontSize = parseInt(fontSizeInput.value, 10);
            const label = getNextLabel(points.filter(p => p.series === currentSeries).length, labelType);
            points.push({ x, y, symbol, label, fontSize, series: currentSeries });
            drawAllPoints(bkg_img_offsetX, bkg_img_offsetY, bkg_img_newWidth, bkg_img_newHeight);
            updatePointList();

        }
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            points[draggedIndex].x = x;
            points[draggedIndex].y = y;
            drawAllPoints(bkg_img_offsetX, bkg_img_offsetY, bkg_img_newWidth, bkg_img_newHeight);
            updatePointList();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        draggedIndex = -1;
    });


    function generateSVG() {
        const svgParts = [
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="800" height="600">'
        ];

        const seriesMap = new Map();
        points.forEach(point => {
            if (!seriesMap.has(point.series)) {
                seriesMap.set(point.series, []);
            }
            seriesMap.get(point.series).push(point);
        });

        seriesMap.forEach((seriesPoints, series) => {
            svgParts.push(`<g id="series${series + 1}">`);
            seriesPoints.forEach(point => {
                const symbolSvg = getSymbolSvg(point.symbol, point.x, point.y);
                svgParts.push(symbolSvg);
                svgParts.push(`<text x="${point.x + 10}" y="${point.y - 10}" font-size="${point.fontSize}px" fill="black">${point.label}</text>`);
            });
            svgParts.push('</g>');
        });

        svgParts.push('</svg>');
        return svgParts.join('\n');
    }

    function getSymbolSvg(symbol, x, y) {
        switch (symbol) {
            case 'circle':
                return `<circle cx="${x}" cy="${y}" r="5" fill="black" />`;
            case 'star':
                return getStarSvg(x, y, 5, 10, 5);
            case 'triangle':
                return getTriangleSvg(x, y, 10);
            default:
                return `<circle cx="${x}" cy="${y}" r="5" fill="black" />`;
        }
    }

    function getStarSvg(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        let path = `M${cx},${cy - outerRadius}`;

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            path += ` L${x},${y}`;
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            path += ` L${x},${y}`;
            rot += step;
        }
        path += ` L${cx},${cy - outerRadius}`;
        return `<path d="${path} Z" fill="black" />`;
    }

    function getTriangleSvg(cx, cy, size) {
        const height = size * (Math.sqrt(3) / 2);
        return `<path d="M${cx},${cy - height / 2} L${cx - size / 2},${cy + height / 2} L${cx + size / 2},${cy + height / 2} Z" fill="black" />`;
    }
});
