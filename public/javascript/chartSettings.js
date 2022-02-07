/**
 * Constructor for chart settings. Easier to modify when these are in a separate file.
 * @constructor
 */

function ChartSettings() {
    this.data = {
        labels: [],
        datasets: []
    };


    this.options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        lineTension: 0.4,
        elements: {
            point: {
                radius: 0
            }
        },
        scales: {
            y: {
                ticks: {
                    autoSkip: true
                },

                type: 'linear',
                display: true,
                position: 'left',
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
                    display: false
                }
            }
        }
    };
}