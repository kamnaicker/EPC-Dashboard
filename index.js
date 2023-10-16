import { parseExcelData } from './File.js';

document.addEventListener("DOMContentLoaded", function () {
  // Code to run when the DOM is ready
  const portfolioSelector = document.getElementById("portfolio-selector");

  portfolioSelector.addEventListener("change", function () {
    const selectedOption = portfolioSelector.value;
    handleFile(selectedOption);
  });
});

// Public Variables
var selectedOption = "All Portfolios"; // Set a default value
var parsedData = null;
var pieChartData = null;
var options;

// Set Key of this Array to Portfolio type
var portToGrade = {};

const container = document.getElementById('container');
container.addEventListener('click', function (event) {
  if (event.target.id === 'extractDataButton') {
    handleFile(selectedOption);
  }
});

// Function to handle file input and extract data
function handleFile(selectedOption) {
  const fileInput = document.getElementById("fileInput");
  // Assuming only one file is being selected
  const selectedFile = fileInput.files[0];

  if (selectedFile) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const data = e.target.result;
      parsedData = parseExcelData(data);

      const tableColumns = [
        'Building Name',
        'Location',  // Use Province for Location
        'Certificate Number',
        'Grade',  // Use Building Rating for Grade
        'Building Energy Performance (BEP) kWh/sqm.annum',
        '2021 Benchmark',
        'Net Floor Area',  // Use Unadjusted NFA (m2) for Net Floor Area
        'Distribution per Energy Source',  // Use this format for Distribution per Energy Source
      ];
    
      // After you've processed the data and calculated the target reduction:
      const tableBody = document.querySelector('#data-table tbody');
      tableBody.innerHTML = ''; // Clear existing rows
      
      parsedData.forEach((data, index) => {
        // Map the data to the table columns
        const rowData = tableColumns.map((columnName) => {
          if (columnName === 'Building Name') {
            return data['Building Name'];
          } else if (columnName === 'Location') {
            return data['Province'];
          } else if (columnName === 'Certificate Number') {
            return index + 1; // Adding 1 to make it 1-based index
          } else if (columnName === 'Grade') {
            return data['Building Rating'];
          } else if (columnName === 'Building Energy Performance (BEP) kWh/sqm.annum') {
            return data['Building Energy Performance (BEP) kWh/sqm.annum'];
          } else if (columnName === '2021 Benchmark') {
            return data['Benchmark'];
          } else if (columnName === 'Net Floor Area') {
            return data['Unadjusted NFA (m2)'];
          } else if (columnName === 'Distribution per Energy Source') {
            const distribution = {
              grid: '50%',
              diesel: '20%',
              gas: '20%',
              solar: '10%',
            };
          
            // Convert the distribution object into a formatted string
            const distributionString = Object.keys(distribution)
              .map(key => `${key}: ${distribution[key]}`)
              .join(', ');
          
            return distributionString;
          }
        });
    
        // Calculate target reduction (kWh) and target reduction (%)
        const bep = parseFloat(data['Building Energy Performance (BEP) kWh/sqm.annum']);
        const benchmark = parseFloat(data['Benchmark']);
        const targetReductionKWh = bep > benchmark ? (bep - benchmark) : 'N/A';
        const targetReductionPercentage = bep > benchmark ? ((bep - benchmark) / benchmark * 100).toFixed(2) + '%' : 'N/A';
        
        rowData.push(targetReductionKWh);
        rowData.push(targetReductionPercentage);

        console.log(rowData);
        
        // Insert the row into the table
        const newRow = tableBody.insertRow();
        rowData.forEach((cellData) => {
          const newCell = newRow.insertCell();
          newCell.textContent = cellData;
        });
      });

      let buildingsForPortfolio;
      if (selectedOption === 'All Portfolios') {
        // Filter data for Portfolio A and Portfolio B
        const buildingsForPortfolioA = parsedData.filter(item => item['Building Owner'] === 'Portfolio A');
        const buildingsForPortfolioB = parsedData.filter(item => item['Building Owner'] === 'Portfolio B');
        const buildingsForPortfolioAll = parsedData.filter(item => item['Building Owner'] === 'Portfolio A' || item['Building Owner'] === 'Portfolio B');;
        // Calculate the average BEP for Portfolio A and Portfolio B
        const averageBEPPortfolioA = calculateAverageBEP(buildingsForPortfolioA);
        const averageBEPPortfolioB = calculateAverageBEP(buildingsForPortfolioB);
        const averageBEPPortfolioAll = calculateAverageBEP(buildingsForPortfolioAll);
      
        Highcharts.chart('dashboard-col-1', {
          chart: {
            type: 'bar',
          },
          title: {
            text: 'Average BEP for All Portfolios',
            style: {
              color: 'white',
              fontSize: '16px', // Adjust the font size
            },
          },
          tooltip: {
            formatter: function () {
              return this.series.name + ': <b>' + this.point.y.toFixed(1) + '%</b>'; // Customize the format as needed
            },
            style: {
              color: 'white',
            }
          },
          xAxis: {
            categories: [],
            style: {
              color: 'white',
            },
          },
          yAxis: {
            title: {
              text: 'Avg.BEP Value',
              style: {
                color: 'white',
                fontSize: '12px', // Adjust the font size
              },
            },
          },
          plotOptions: {
            series: {
              dataLabels: {
                format: '{series.name}',
                style: {
                  color: 'white',
                  fontSize: '12px', // Adjust the font size
                },
              },
            },
          },
          series: [
            {
              name: 'Portfolio A',
              data: [averageBEPPortfolioA],
            },
            {
              name: 'Portfolio B',
              data: [averageBEPPortfolioB],
            },
            {
              name: 'All Portfolios',
              data: [averageBEPPortfolioAll],
            },
          ],
        });
      } else {
        // Filter data for the selected portfolio
        buildingsForPortfolio = parsedData.filter(item => item['Building Owner'] === selectedOption);
        
        const averageBEPPortfolio = calculateAverageBEP(buildingsForPortfolio);

        Highcharts.chart('dashboard-col-1', {
          chart: {
            type: 'bar',
          },
          title: {
            text: 'Average BEP ' + selectedOption,
            style: {
              color: 'white!important',
              fontSize: '16px', // Adjust the font size
            },
          },
          xAxis: {
            categories: ['BEP'],
            labels: {
              style: {
                color: 'white!important',
                fontSize: '12px', // Adjust the font size
              },
            },
          },
          yAxis: {
            title: {
              text: 'Avg.BEP Value',
              style: {
                color: 'white!important',
                fontSize: '12px', // Adjust the font size
              },
            },
          },
          plotOptions: {
            series: {
              dataLabels: {
                style: {
                  color: 'white!important',
                  fontSize: '12px', // Adjust the font size
                },
              },
            },
          },
          series: [
            {
              name: 'Average BEP',              
              data: [averageBEPPortfolio],
            },
          ]
        });
      }

      function calculateAverageBEP(data) {
        const bepValues = data.map(item => parseFloat(item['Building Energy Performance (BEP) kWh/sqm.annum']));
        
        let totalBEP = 0;
        
        for (let i = 0; i < bepValues.length; i++) {
          totalBEP += bepValues[i];
        }
        
        return totalBEP / bepValues.length;
      }

      if (selectedOption === 'All Portfolios') {
        // If 'All Portfolios' is selected, create data for all buildings
        const uniqueRatings = [...new Set(parsedData.map(item => item['Building Rating']))];

        pieChartData = uniqueRatings.map(rating => {
          const buildingsWithRating = parsedData.filter(item => item['Building Rating'] === rating);
          return {
            name: 'Grade ' + rating,
            y: buildingsWithRating.length,
          };
        });
      } else {
        // Filter data for the selected portfolio
        const buildingsForPortfolio = parsedData.filter(item => item['Building Owner'] === selectedOption);

        const uniqueRatings = [...new Set(buildingsForPortfolio.map(item => item['Building Rating']))];

        pieChartData = uniqueRatings.map((rating) => {
          const buildingsWithRating = parsedData.filter(item => item['Building Rating'] === rating);
          return {
            name: 'Grade ' + rating,
            y: buildingsWithRating.length           
          };
        });
      }

      const updatedChartOptions = pieChartData;

      const charts = Highcharts.charts;

      if (charts[0] != null) {
        charts[0].destroy();
      }
      // Create a new configuration for the Pie chart
      Highcharts.chart('dashboard-col-2', {
        chart: {
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          type: 'pie',
        },
        labels: {
          style: {
            color: 'white',
          },
        },
        title: {
          text: 'Grade Proportion: '+ selectedOption,
          align: 'center',
          style: {
            color: 'white',
          }
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
          style: {
            color: 'white',
          }
        },
        accessibility: {
          point: {
            valueSuffix: '%',
          },
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              format:'<b>{point.name}</b>: {point.percentage:.1f} %'
            },
          },
        },
        series: [
          {
            name: 'Proportion',
            data: updatedChartOptions,
          },
        ],
      });
    };

    reader.readAsArrayBuffer(selectedFile);
  } else {
    alert("Please select a file.");
  }
}

const { ComponentRegistry } = Dashboards,
  HTMLComponent = ComponentRegistry.types.HTML,
  AST = Highcharts.AST;

class CustomHTML extends HTMLComponent {
  constructor(cell, options) {
    super(cell, options);
    this.type = 'CustomHTML';
    this.getCustomHTML();
    return this;
  }

  getCustomHTML() {
    const options = this.options;
    if (options.id) {
      const customHTML = document.getElementById(options.id).outerHTML;
      this.options.elements = new AST(customHTML).nodes;
    } else if (options.html) {
      this.options.elements = new AST(options.html).nodes;
    }
  }
}

ComponentRegistry.registerComponent('CustomHTML', CustomHTML);

// Create a Highcharts Dashboard
var Dashboard = Dashboards.board('container', {
  gui: {
    layouts: [
      {
        id: 'layout-1',
        rows: [
          {
            cells: [
              {
                id: 'dashboard-col-0',
              },
            ],
          },
          {
            cells: [
              {
                id: 'dashboard-col-1',
              },
              {
                id: 'dashboard-col-2',
              },
            ],
          },
        ],
      },
    ],
  },
  editMode: {
    enabled: true,
    contextMenu: {
      enabled: true,
      items: ['editMode'],
    },
  },
  components: [
    {
      type: 'CustomHTML',
      cell: 'dashboard-col-0',
      html: `
        <div id="EPCDataContainer">
          <div class="InfoPane">
            <h1>EPC Data</h1>
          </div>
          <div class="portfolios">
            <select id="portfolio-selector">
              <option value="All Portfolios">All Portfolios</option>
              <option value="Portfolio A">Portfolio A</option>
              <option value="Portfolio B">Portfolio B</option>
            </select>
          </div>
          <div class="FileHandler">
          <label for="fileInput" class="custom-button">Choose File</label>
          <input type="file" id="fileInput" accept=".xlsx" style="display: none;" />
            <button id="extractDataButton"  class="custom-button">Extract Data</button>
          </div>
          <div id="table-container">
          <table id="data-table" class="table">
            <thead>
              <tr>
                <th>Building Name</th>
                <th>Location</th>
                <th>Certificate Number</th>
                <th>Grade</th>
                <th>Building Energy Performance</th>
                <th>2021 Benchmark</th>
                <th>Net Floor Area</th>
                <th>% Distribution per Energy Source</th>
                <th>Target Reduction (kWh)</th>
                <th>Target Reduction (%)</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        </div>
        
      `,
    },
    {
      cell: 'dashboard-col-1',
      type: 'Highcharts',
      chartOptions: {
        chart: {
          type: 'bar',
        },
        title: {
          text: 'No Data Provided',
        },
        xAxis: {
          categories: ['BEP', 'sa'],
        },
        yAxis: {
          title: {
            text: 'Avg.BEP Value',
          },
        },
        series: [
          {
            name: 'Average BEP',
            data: [0],
          },
        ],
      },
    },
    {
      cell: 'dashboard-col-2',
      type: 'Highcharts',
      chartOptions: {
        chart: {
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          type: 'pie',
        },
        labels: {
          style: {
            color: 'white',
          },
        },
        title: {
          text: 'No Data Provided',
          align: 'center',
        },
        tooltip: {
          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
        },
        accessibility: {
          point: {
            valueSuffix: '%',
          },
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            },
          },
        },
        series: [
          {
            name: 'Proportion',
            data: [
              {
                name: 'Default',
                y: 0,
              },
            ],
          },
        ],
      },
    },
  ],
});

