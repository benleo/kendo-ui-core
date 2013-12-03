(function() {
    var dataviz = kendo.dataviz,
        Box2D = dataviz.Box2D,
        categoriesCount = dataviz.categoriesCount,
        chartBox = new Box2D(0, 0, 800, 600),
        candlestickChart,
        root,
        view,
        firstPoint,
        TOLERANCE = 1;

    function setupCandlestickChart(plotArea, options) {
        view = new ViewStub();

        candlestickChart = new dataviz.CandlestickChart(plotArea, options);

        root = new dataviz.RootElement();
        root.append(candlestickChart);

        candlestickChart.reflow();
        candlestickChart.getViewElements(view);

        firstPoint = candlestickChart.points[0];
    }

    function stubPlotArea(getCategorySlot, getValueSlot, options) {
        return new function() {
            this.categoryAxis = this.primaryCategoryAxis = {
                getSlot: getCategorySlot,
                options: {
                    axisCrossingValue: 0,
                    categories: options.categoryAxis.categories
                }
            };

            this.valueAxis = {
                getSlot: getValueSlot,
                options: {
                    axisCrossingValue: 0
                }
            };

            this.namedCategoryAxes = { };
            this.namedValueAxes = {};

            this.seriesCategoryAxis = function(series) {
                return series.categoryAxis ?
                    this.namedCategoryAxes[series.categoryAxis] : this.primaryCategoryAxis;
            };

            this.options = options;
        };
    }

    var series = { data: [[2,4,1,3]], type: "candlestick" },
        VALUE_AXIS_MAX = 4,
        CATEGORY_AXIS_Y = 2;

    var plotArea = stubPlotArea(
        function(categoryIndex) {
            return new Box2D(categoryIndex, CATEGORY_AXIS_Y,
                             categoryIndex + 1, CATEGORY_AXIS_Y);
        },
        function(value) {
            var value = typeof value === "undefined" ? 0 : value,
                valueY = VALUE_AXIS_MAX - value,
                slotTop = Math.min(CATEGORY_AXIS_Y, valueY),
                slotBottom = Math.max(CATEGORY_AXIS_Y, valueY);

            return new Box2D(0, slotTop, 0, slotBottom);
        }, {
            categoryAxis: {
                categories: ["A", "B"]
            }
        }
    );

    // ------------------------------------------------------------
    module("Candlestick Chart", {
        setup: function() {
            setupCandlestickChart(plotArea, { series: [ series ] });
        }
    });

    test("creates points for candlestickChart data points", function() {
        equal(candlestickChart.points.length, series.data.length);
    });

    test("removes the series points if the visible is set to false", function() {
        var chart =createChart({
            seriesDefaults: {
                type: "candlestick"
            },
            series: [{
                data: [[2,4,1,3]],
                visible: false
            },{
                data: [[2,4,1,3]]
            }]
        });

        var points = chart._plotArea.charts[0].points;

        ok(points.length === 1);
        destroyChart();
    });

    test("creates empty points for null values", function() {
        setupCandlestickChart(plotArea, { series: [{
            data: [[2,4,1,3], null], type: "candlestick"
        }]});
        equal(candlestickChart.points[1], undefined);
    });

    test("creates empty points for undefined values", function() {
        setupCandlestickChart(plotArea, { series: [{
            data: [[2,4,1,3], undefined], type: "candlestick"
        }]});
        equal(candlestickChart.points[1], undefined);
    });

    test("creates empty points for partially undefined values", function() {
        setupCandlestickChart(plotArea, { series: [{
            data: [[2,4,1,3], [0, 1, undefined, 2]], type: "candlestick"
        }]});
        equal(candlestickChart.points[1], undefined);
    });

    test("empty points are not collapsed", function() {
        setupCandlestickChart(plotArea, { series: [{
            data: [[2,4,1,3], null, [2, 4, 1, 3]], type: "candlestick"
        }]});
        equal(candlestickChart.points[2].box.x1, 2);
    });

    test("reports minimum series value for default axis", function() {
        deepEqual(candlestickChart.valueAxisRanges[undefined].min, series.data[0][2]);
    });

    test("reports maximum series value for default axis", function() {
        deepEqual(candlestickChart.valueAxisRanges[undefined].max, series.data[0][1]);
    });

    test("reports number of categories", function() {
        setupCandlestickChart(plotArea, { series: [ series ]});
        equal(categoriesCount(candlestickChart.options.series), series.data.length);
    });

    test("sets point owner", function() {
        ok(candlestickChart.points[0].owner === candlestickChart);
    });

    test("sets point series", function() {
        ok(candlestickChart.points[0].series === series);
    });

    test("sets point series index", function() {
        ok(candlestickChart.points[0].seriesIx === 0);
    });

    test("sets point category", function() {
        equal(candlestickChart.points[0].category, "A");
    });

    test("sets point dataItem", function() {
        equal(typeof candlestickChart.points[0].dataItem, "object");
    });

    // ------------------------------------------------------------
    module("Candlestick Chart / Rendering", {
        setup: function() {
            setupCandlestickChart(plotArea, {
                series: [ $.extend({
                    line: {
                        width: 4,
                        color: "lineColor",
                        opacity: 0.5,
                        dashType: "dot"
                    },
                    color: "rectColor",
                    border: {
                        color: "borderColor",
                        width: 2,
                        opacity: 0.2,
                        dashType: "dot"
                    }
                },
                series)]
            });
        }
    });

    test("sets line width", function() {
        equal(view.log.path[0].style.strokeWidth, 4);
    });

    test("sets line color", function() {
        equal(view.log.path[0].style.stroke, "lineColor");
    });

    test("sets line opacity", function() {
        equal(view.log.path[0].style.strokeOpacity, 0.5);
    });

    test("sets line dashType", function() {
        equal(view.log.path[0].style.dashType, "dot");
    });

    test("sets rect border", function() {
        equal(view.log.rect[0].style.strokeWidth, 2);
        equal(view.log.rect[0].style.stroke, "borderColor");
        equal(view.log.rect[0].style.strokeOpacity, 0.2);
        equal(view.log.rect[0].style.dashType, "dot");
    });

    test("sets rect color(open < close)", function() {
        equal(view.log.rect[0].style.fill, "rectColor");
    });

    test("sets rect down body color(open > close)", function() {
        setupCandlestickChart(plotArea, {
            series: [{
                type: "candlestick",
                data: [[3,4,1,2]],
                downColor: "downColor"
            }]
        });

        equal(view.log.rect[0].style.fill, "downColor");
    });

    test("sets rect default color if down color is null or empty(open > close)", function() {
        setupCandlestickChart(plotArea, {
            series: [{
                type: "candlestick",
                data: [[3,4,1,2]],
                color: "color",
                downColor: ""
            }]
        });

        equal(view.log.rect[0].style.fill, "color");
    });

    test("overlay rect has same model id as its segment", function() {
        equal(view.log.rect[1].style.data.modelId, candlestickChart.points[0].options.modelId);
    });

    test("renders chart group", function() {
        equal(view.log.group.length, 1);
    });

    test("sets group animation", function() {
        equal(view.log.group[0].options.animation.type, "clip");
    });

    // ------------------------------------------------------------
    module("Candlestick Chart / Rendering / Highlight", {
        setup: function() {
            setupCandlestickChart(plotArea, {
                series: [series]
            });
        }
    });

    test("highlightOverlay renders default border width", function() {
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.strokeWidth, 1);
    });

    test("highlightOverlay renders custom border width", function() {
        firstPoint.options.highlight.border.width = 2;
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.strokeWidth, 2);
    });

    test("highlightOverlay renders default border color (computed)", function() {
        firstPoint.options.color = "#ffffff";
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.stroke, "#cccccc");
    });

    test("highlightOverlay renders custom border color", function() {
        firstPoint.options.border.color = "red";
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.stroke, "red");
    });

    test("highlightOverlay renders default border opacity", function() {
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.strokeOpacity, 1);
    });

    test("highlightOverlay renders custom border opacity", function() {
        firstPoint.options.highlight.border.opacity = 0.5;
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.strokeOpacity, 0.5);
    });

    test("highlightOverlay renders default border width", function() {
        var rect = firstPoint.highlightOverlay(view).children[0];

        equal(rect.options.strokeWidth, 1);
    });

    test("highlightOverlay renders custom line width", function() {
        firstPoint.options.highlight.line.width = 2;
        var line = firstPoint.highlightOverlay(view).children[1];

        equal(line.options.strokeWidth, 2);
    });

    test("highlightOverlay renders default line color (computed)", function() {
        firstPoint.options.color = "#ffffff";
        var line = firstPoint.highlightOverlay(view).children[1];

        equal(line.options.stroke, "#cccccc");
    });

    test("highlightOverlay renders custom line color", function() {
        firstPoint.options.highlight.line.color = "red";
        var line = firstPoint.highlightOverlay(view).children[1];

        equal(line.options.stroke, "red");
    });

    test("highlightOverlay renders default line opacity", function() {
        var line = firstPoint.highlightOverlay(view).children[1];

        equal(line.options.strokeOpacity, 1);
    });

    test("highlightOverlay renders custom line opacity", function() {
        firstPoint.options.highlight.line.opacity = 0.5;
        var line = firstPoint.highlightOverlay(view).children[1];

        equal(line.options.strokeOpacity, 0.5);
    });

})();

(function() {
    var dataviz = kendo.dataviz,
        Box2D = dataviz.Box2D,
        categoriesCount = dataviz.categoriesCount,
        chartBox = new Box2D(0, 0, 800, 600),
        candlestickChart,
        root,
        view,
        firstPoint,
        TOLERANCE = 1;

    var candlestickChart,
        MARGIN = PADDING = BORDER = 5,
        candlestick;

    function stubPlotArea(getCategorySlot, getValueSlot, options) {
        return new function() {
            this.categoryAxis = this.primaryCategoryAxis = {
                getSlot: getCategorySlot,
                options: {
                    axisCrossingValue: 0,
                    categories: options.categoryAxis.categories
                }
            };

            this.valueAxis = {
                getSlot: getValueSlot,
                options: {
                    axisCrossingValue: 0
                }
            };

            this.namedCategoryAxes = { };
            this.namedValueAxes = {};

            this.seriesCategoryAxis = function(series) {
                return series.categoryAxis ?
                    this.namedCategoryAxes[series.categoryAxis] : this.primaryCategoryAxis;
            };

            this.options = options;
        };
    }

    var plotArea = stubPlotArea(
        function(categoryIndex) {
            return new Box2D();
        },
        function(value) {
            return new Box2D();
        },
        {
            categoryAxis: { }
        }
    );

    function createCandlestickChart(options) {
        candlestickChart = new dataviz.CandlestickChart(plotArea, {
            series: [$.extend({
                name: "candlestickSeries",
                data: [[1,4,2,3]],
                border: {
                    opacity: 0.5,
                    dashType: "dot",
                },
                line: {
                    dashType: "dot",
                    color: "red",
                    opacity: 0.7,
                    width: 0.2
                },
                color: "#f00",
                opacity: 0.2,
                type: "candlestick"
            }, options)]
        });
        candlestick = candlestickChart.points[0];
    }

    // ------------------------------------------------------------
    module("Candlestick Chart / Configuration", {
        setup: function() {
            createCandlestickChart();
        }
    });

    test("applies series color to point", function() {
        equal(candlestick.options.color, "#f00");
    });

    test("applies opacity to point", function() {
        equal(candlestick.options.opacity, 0.2);
    });

    test("applies border color to point", function() {
        createCandlestickChart({ border: { color: "point-border" } });
        equal(candlestick.options.border.color, "point-border");
    });

    test("applies dashType", function() {
        equal(candlestick.options.border.dashType, "dot");
    });

    test("applies line dashType", function() {
        equal(candlestick.options.line.dashType, "dot");
    });

    test("applies line color", function() {
        equal(candlestick.options.line.color, "red");
    });

    test("applies line width", function() {
        equal(candlestick.options.line.width, 0.2);
    });

    test("applies line opacity", function() {
        equal(candlestick.options.line.opacity, 0.7);
    });

    test("applies color function", function() {
        createCandlestickChart({
            color: function(bubble) { return "#f00" }
        });

        equal(candlestick.options.color, "#f00");
    });

    test("color fn argument contains value", 1, function() {
        createCandlestickChart({
            color: function(c) { equal(c.value.open, 1); }
        });
    });

    test("color fn argument contains dataItem", 1, function() {
        createCandlestickChart({
            color: function(c) {
                deepEqual(c.dataItem, [1,4,2,3]);
            }
        });
    });

    test("color fn argument contains series", 1, function() {
        createCandlestickChart({
            color: function(c) { equal(c.series.name, "candlestickSeries"); }
        });
    });

})();

(function() {
    var dataviz = kendo.dataviz,
        Box2D = dataviz.Box2D,
        categoriesCount = dataviz.categoriesCount,
        chartBox = new Box2D(0, 0, 800, 600),
        candlestickChart,
        root,
        view,
        firstPoint,
        TOLERANCE = 1;

    var Candlestick = dataviz.Candlestick,
        point,
        box,
        label,
        root,
        VALUE = {
            open: 2,
            high: 4,
            low: 1,
            close: 3

        },
        TOOLTIP_OFFSET = 5,
        CATEGORY = "A",
        SERIES_NAME = "series";

    function createPoint(options) {
        point = new Candlestick(VALUE,
            $.extend(true, {
                labels: { font: SANS12 }
            }, options)
        );

        point.category = CATEGORY;
        point.dataItem = { value: VALUE };
        point.series = { name: SERIES_NAME };

        point.owner = {
            formatPointValue: function(point, tooltipFormat) {
                return kendo.dataviz.autoFormat(tooltipFormat, point.value);
            },
            seriesValueAxis: function(series) {
                return {
                    getSlot: function(a,b) {
                        return new Box2D();
                    }
                };
            }
        }

        box = new Box2D(0, 0, 100, 100);
        point.reflow(box);

        root = new dataviz.RootElement();
        root.append(point);
    }

    // ------------------------------------------------------------
    module("Candlestick", {
        setup: function() {
            createPoint();
        }
    });

    test("is discoverable", function() {
        ok(point.options.modelId);
    });

    test("sets point border width", function() {
        createPoint({ border: { width: 4 } });
        equal(point.options.border.width, 4);
    });

    test("sets point opacity", function() {
        createPoint({ opacity: 0.5 });
        deepEqual(point.options.opacity, 0.5);
    });

    test("sets point id", function() {
        ok(point.options.id.length > 0);
    });

    test("point has same model id", function() {
        view = new ViewStub();

        point.getViewElements(view);
        equal(view.log.rect[1].style.data.modelId, point.options.modelId);
    });

    test("tooltipAnchor is at top right of point", function() {
        var anchor = point.tooltipAnchor(10, 10);
        deepEqual([anchor.x, anchor.y],
             [point.box.x2 + TOOLTIP_OFFSET, point.box.y1 + TOOLTIP_OFFSET], TOLERANCE)
    });

})();

(function() {
    var dataviz = kendo.dataviz,
        Box2D = dataviz.Box2D,
        categoriesCount = dataviz.categoriesCount,
        chartBox = new Box2D(0, 0, 800, 600),
        candlestickChart,
        root,
        view,
        firstPoint,
        TOLERANCE = 1;

    var data = [{
            open: 2,
            high: 4,
            low: 1,
            close: 3,
            color: "color",
            downColor: "downColor"
        }],
        point;

    function createBubbleChart(candlestickSeries) {
        var chart = createChart({
            dataSource: {
                data: data
            },
            series: [kendo.deepExtend({
                type: "candlestick"
            }, candlestickSeries)]
        });

        point = chart._plotArea.charts[0].points[0];
    }

    // ------------------------------------------------------------
    module("Candlestick Chart / Data Binding / Data Source", {
        teardown: function() {
            destroyChart();
        }
    });

    test("binds to 4-element array", function() {
        createBubbleChart({
            data: [[2, 4, 0, 3]]
        });

        deepEqual(point.value, { open: 2, high: 4, low: 0, close: 3 });
    });

    test("binds open, high, low and close field", function() {
        createBubbleChart({
            openField: "open",
            highField: "high",
            lowField: "low",
            closeField: "close"
        });

        deepEqual(point.value, { open: 2, high: 4, low: 1, close: 3 });
    });

    test("binds color field", function() {
        createBubbleChart({
            openField: "open",
            highField: "high",
            lowField: "low",
            closeField: "close",
            colorField: "color"
        });

        deepEqual(point.options.color, "color");
    });

    test("binds downColor field", function() {
        var chart = createChart({
            dataSource: {
                data: [{ open: 3, high: 4, low: 1, close: 2, color: "color", downColor: "downColor" }]
            },
            series: [{
                type: "candlestick",
                openField: "open",
                highField: "high",
                lowField: "low",
                closeField: "close",
                baseField: "downColor"
            }]
        });

        point = chart._plotArea.charts[0].points[0];

        deepEqual(point.options.color, "downColor");
    });

})();
