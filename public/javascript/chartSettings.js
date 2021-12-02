/**
 * Constructor for chart settings. Easier to modify when these are in a separate file.
 * @constructor
 */

function ChartSettings() {
    this.data = {
        labels: [],
        datasets: [{
            spanGaps: true,
            label: "",
            backgroundColor: "rgba(255,99,132,0.2)",
            borderColor: "rgba(255,99,132,1)",
            borderWidth: 2,
            hoverBackgroundColor: "rgba(255,99,132,0.4)",
            hoverBorderColor: "rgba(255,99,132,1)",
            data: []
        }]
    };

    this.options = {
        animation: false,
        scales: {
            y: {
                min: 0,
                max: 45,
                stacked: true,
                grid: {
                    display: true,
                    color: "rgba(255,99,132,0.2)"
                }
            },
            x: {
                ticks: {
                    autoSkip: false,
                },
                grid: {
                    display: true
                }
            }
        }
    };
}