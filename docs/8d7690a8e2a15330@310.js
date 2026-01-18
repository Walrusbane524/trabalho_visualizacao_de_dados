function _1(md){return(
md`# Vendas de mídias físicas de jogos ao longo dos anos`
)}

function _world(d3){return(
d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
)}

function _sales(FileAttachment){return(
FileAttachment("final_videogame_sales@5.csv")
  .csv({typed: true})
  .then(function (data) {
    return data.map(d => {
      const yearStr = String(d.Year_of_Release).substring(0, 4);
      const yearInt = parseInt(yearStr, 10);
      
      d.Year_of_Release = isNaN(yearInt) ? null : yearInt;
      return d;
    });
  })
)}

function _total_sales_by_dev_country(FileAttachment){return(
FileAttachment("sales_by_dev_country.csv").csv({typed: true})
)}

function _salesByCountry(selectedCountry,sales)
{
  if (!selectedCountry) return sales; 
  return sales.filter(d => d["Developer/Publisher country"] === selectedCountry);
}


function _salesByYear(selectedYear,salesByCountry)
{
  const selection = selectedYear;
  if (!selection || !selection.Year_of_Release || selection.Year_of_Release.length === 0) {
    return salesByCountry;
  }

  const targetYear = selection.Year_of_Release[0];

  return salesByCountry.filter(d => d.Year_of_Release === targetYear);
}


function _7(md){return(
md`## Gráfico 1
Gráfico de linhas das vendas de cada console ao longo dos anos`
)}

function _selectedYear(selectedCountry,vl,salesByCountry,width,Event){return(
(async () => {
  const currentTitle = selectedCountry 
    ? `Game sales from ${selectedCountry} games` 
    : 'Game sales';

  const wrapper = document.createElement("div");
  wrapper.value = null;

  const chartElement = await vl.markBar()
    .title(currentTitle)
    .data(salesByCountry)
    
    .transform(
       vl.filter("datum.Year_of_Release != null")
    )

    .encode(
      vl.y().sum('Global_Sales').title('Copies Sold (Millions)'),
      vl.x().fieldO('Year_of_Release').title('Year'), 
      
      vl.opacity()
        .if(vl.selectPoint("year_brush").encodings("x"), vl.value(1))
        .value(0.3) 
    )
    .params(
      vl.selectPoint("year_brush").encodings("x")
    )
    .width(width * 0.95)
    .height(width * 0.95 * 0.25)
    .render();

  wrapper.appendChild(chartElement);

  const view = chartElement.value;
  
  view.addSignalListener("year_brush", (name, value) => {
    wrapper.value = value;
    wrapper.dispatchEvent(new Event("input", {bubbles: true}));
  });

  return wrapper;
})()
)}

function _debug(selectedYear){return(
selectedYear
)}

function _10(md){return(
md`## Gráfico 2
Gráfico de pizza dos gêneros de jogos que mais venderam que saíram do país selecionado no período selecionado`
)}

function _genrePieChart(selectedYear,selectedCountry,vl,salesByYear,width)
{
  const yearLabel = selectedYear?.Year_of_Release?.[0];
  
  const currentTitle = selectedCountry
    ? (yearLabel ? `Genre Market Share: ${selectedCountry} - ${yearLabel}` : `Genre Market Share: ${selectedCountry}`)
    : (yearLabel ? `Genre Market Share: Global - ${yearLabel}` : 'Genre Market Share: Global');

  const base = vl.data(salesByYear)
    .transform(
      vl.groupby("Genre").aggregate(vl.sum("Global_Sales").as("Sales_Pre")),
      vl.window(vl.rank().as("rank")).sort([
        { field: "Sales_Pre", order: "descending" }
      ]),
      vl.calculate("datum.rank <= 5 ? datum.Genre : 'Others'").as("Genre_Final"),
      vl.groupby("Genre_Final").aggregate(vl.sum("Sales_Pre").as("Total_Sales")),
      vl.joinaggregate([{op: "sum", field: "Total_Sales", as: "Grand_Total"}]),
      vl.calculate("datum.Total_Sales / datum.Grand_Total").as("Percentage"),
      vl.calculate("datum.Genre_Final === 'Others' ? 0 : datum.Total_Sales").as("Order_Value")
    );

  const arcs = vl.markArc({outerRadius: 120, innerRadius: 80})
    .encode(
      vl.theta().fieldQ("Total_Sales").stack(true),
      
      vl.color()
        .fieldN("Genre_Final")
        .title("Genre")
        .condition({test: "datum.Genre_Final === 'Others'", value: "#d3d3d3"}) 
        .scale({scheme: "tableau10"}),

      vl.order().fieldQ("Order_Value").sort("descending"),
      
      vl.tooltip([
        {field: "Genre_Final", type: "nominal", title: "Genre"},
        {field: "Total_Sales", format: ".1f", title: "Sales (M)"},
        {field: "Percentage", format: ".1%", title: "Share"} 
      ])
    );

  const labels = vl.markText({radius: 140})
    .transform(
      vl.filter("datum.Percentage > 0.02") 
    )
    .encode(
      vl.theta().fieldQ("Total_Sales").stack(true),
      
      vl.order().fieldQ("Order_Value").sort("descending"),
      
      vl.text().fieldN("Genre_Final"),
      vl.color().value("black")
    );

  return base
    .layer(arcs, labels)
    .title(currentTitle)
    .width(width * 0.4)
    .height(width * 0.4 * 0.5)
    .render();
}


function _12(md){return(
md`## Gráfico 3`
)}

function _scatterScoreVsSales(selectedYear,selectedCountry,vl,salesByYear,width)
{
  const yearLabel = selectedYear?.Year_of_Release?.[0];
  const currentTitle = selectedCountry
    ? (yearLabel ? `Top 100 Games - User Score vs Sales: ${selectedCountry} (${yearLabel})` : `Top 100 Games - User Score vs Sales: ${selectedCountry}`)
    : (yearLabel ? `Top 100 Games - User Score vs Sales: Global (${yearLabel})` : 'Top 100 Games - User Score vs Sales: Global');

  const points = vl.markPoint({filled: true, opacity: 0.7, size: 50})
    .encode(
      vl.x().fieldQ("User_Score")
        .title("User Score (0-10)")
        .scale({domain: [0, 10]}), 
      
      vl.y().fieldQ("Global_Sales").title("Copies Sold (Millions)"),
      
      vl.color().fieldN("Genre").title("Genre"), 

      vl.tooltip([
        {field: "Name", title: "Game"},
        {field: "rank", title: "Rank"},
        {field: "User_Score", title: "Score"},
        {field: "Global_Sales", title: "Sales (M)"},
        {field: "Genre", title: "Genre"},
        {field: "Year_of_Release", title: "Year"}
      ])
    );

  const trendLine = vl.markLine({color: "red", size: 3, strokeDash: [5, 5]})
    .transform(
      vl.regression("Global_Sales").on("User_Score")
    )
    .encode(
      vl.x().fieldQ("User_Score"),
      vl.y().fieldQ("Global_Sales")
    );

  return vl.layer(points, trendLine)
    .data(salesByYear) 
    .transform(
      vl.filter("datum.User_Score != null && datum.Global_Sales > 0"),
      vl.window(vl.rank().as("rank")).sort([
        { field: "Global_Sales", order: "descending" }
      ]),
      vl.filter("datum.rank <= 100")
    )
    .title(currentTitle)
    .width(width * 0.37) 
    .height(width * 0.37 * 0.5)
    .render();
}


function _14(md){return(
md`# Gráfico 4`
)}

function _scatterCriticVsSales(selectedYear,selectedCountry,vl,salesByYear,width)
{
  const yearLabel = selectedYear?.Year_of_Release?.[0];
  const currentTitle = selectedCountry
    ? (yearLabel ? `Top 100 Games - Critic Score vs Sales: ${selectedCountry} (${yearLabel})` : `Top 100 Games - Critic Score vs Sales: ${selectedCountry}`)
    : (yearLabel ? `Top 100 Games - Critic Score vs Sales: Global (${yearLabel})` : 'Top 100 Games - Critic Score vs Sales: Global');

  const points = vl.markPoint({filled: true, opacity: 0.7, size: 50})
    .encode(
      vl.x().fieldQ("Critic_Score")
        .title("Critic Score (0-100)")
        .scale({domain: [0, 100]}),
      
      vl.y().fieldQ("Global_Sales").title("Sales (Millions)"),
      
      vl.color().fieldN("Genre").title("Genre"), 

      vl.tooltip([
        {field: "Name", title: "Game"},
        {field: "rank", title: "Rank"},
        {field: "Critic_Score", title: "Critic Score"},
        {field: "Global_Sales", title: "Copies Sold (M)"},
        {field: "Genre", title: "Genre"},
        {field: "Year_of_Release", title: "Year"}
      ])
    );

  const trendLine = vl.markLine({color: "black", size: 3, strokeDash: [5, 5]})
    .transform(
      vl.regression("Global_Sales").on("Critic_Score")
    )
    .encode(
      vl.x().fieldQ("Critic_Score"),
      vl.y().fieldQ("Global_Sales")
    );

  return vl.layer(points, trendLine)
    .data(salesByYear) 
    .transform(
      vl.filter("datum.Critic_Score != null && datum.Global_Sales > 0"),
      vl.window(vl.rank().as("rank")).sort([
        { field: "Global_Sales", order: "descending" }
      ]),

      vl.filter("datum.rank <= 100")
    )
    .title(currentTitle)
    .width(width * 0.37) 
    .height(width * 0.37 * 0.5)
    .render();
}


function _16(md){return(
md`## Gráfico 4?
Gráfico de barras dos top10 jogos mais vendidos da seleção`
)}

function _topGamesChart(selectedYear,selectedCountry,vl,salesByYear,width)
{
  const yearLabel = selectedYear?.Year_of_Release?.[0];
  const context = selectedCountry 
    ? (yearLabel ? `${selectedCountry} in ${yearLabel}` : selectedCountry)
    : (yearLabel ? `Global in ${yearLabel}` : 'Global');
    
  const currentTitle = `Top 10 Best-Selling Games: ${context}`;

  return vl.markBar()
    .data(salesByYear)
    .title(currentTitle)
    .transform(
      {
        window: [{op: "rank", as: "rank"}],
        sort: [{field: "Global_Sales", order: "descending"}]
      },
      {filter: "datum.rank <= 10"}
    )
    .encode(
      vl.x().fieldQ("Global_Sales").title("Copies Sold (Millions)"),
      vl.y().fieldN("Name")
        .sort("-x")
        .title(null), // Remove título do eixo Y para economizar espaço
      
      vl.color().fieldN("Platform").title("Platform").scale({scheme: "tableau20"}),
      
      vl.tooltip([
        {field: "Name", title: "Game"},
        {field: "Platform", title: "Platform"},
        {field: "Publisher", title: "Publisher"},
        {field: "Global_Sales", title: "Sales (M)", format: ".1f"},
        {field: "Year_of_Release", title: "Year"}
      ])
    )
    
    .width(width * 0.45)
    .height(width * 0.45 * 0.5)
    .autosize({type: 'fit', contains: 'padding'})
    .render();
}


function _18(md){return(
md`## Gráfico especial 1
Mapa com setas que mostra os países de origem cujos jogos mais venderam em uma região. Se não for possível mostrar as setas, só mostrar um mapa de cores com os países de origem cujos jogos mais venderam globalmente já conta.`
)}


function _selectedCountry(total_sales_by_dev_country,topojson,world,d3,Event, width)
{
  const height = width / 1.6;

  const dataMap = new Map(total_sales_by_dev_country.map(d => [d["Country"], d["Copies Sold"]]));
  
  let countries = topojson.feature(world, world.objects.countries);
  countries.features = countries.features.filter(d => d.properties.name !== "Antarctica");

  const projection = d3.geoMercator()
      .fitSize([width, height], countries);
      
  const path = d3.geoPath(projection);

  const color = d3.scaleSequentialLog(
      d3.extent(total_sales_by_dev_country, d => d["Copies Sold"]), 
      d3.interpolateBlues 
  );

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")
      .property("value", null); 

  const g = svg.append("g");

  function updateVisuals(selection) {
     paths
      .attr("fill", d => {
        if (selection === d.properties.name) return "orange";
        const value = dataMap.get(d.properties.name);
        return value ? color(value) : "#eee"; 
      })
      .attr("stroke", d => selection === d.properties.name ? "black" : "white")
      .attr("stroke-width", d => selection === d.properties.name ? 1.5 : 0.5);
  }

  const paths = g.selectAll("path")
    .data(countries.features)
    .join("path")
      .attr("cursor", "pointer")
      .attr("d", path)
      .on("click", (event, d) => {
        const node = svg.node();
        const current = node.value;
        const next = current === d.properties.name ? null : d.properties.name;
        node.value = next;
        updateVisuals(next);
        node.dispatchEvent(new Event("input", {bubbles: true}));
      });

  updateVisuals(null);

  paths.append("title")
      .text(d => {
        const value = dataMap.get(d.properties.name);
        return `${d.properties.name}\n${value ? d3.format(",.1f")(value) + "M copies" : "No Data"}`;
      });

  svg.append("path")
      .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path);

  svg.node().value = null;
  svg.node().dispatchEvent(new Event("input", {bubbles: true}));
  
  return svg.node();
}


function _20(selectedCountry){return(
selectedCountry
)}

function _21(md){return(
md`## Gráfico especial 2
Chord diagram das desenvolvedoras/publishers do país selecionado e para quais regiões venderam`
)}

function _chart(selectedYear,selectedCountry,data,d3,groupTicks, width)
{
  const yearLabel = selectedYear?.Year_of_Release?.[0];

  const currentTitle = selectedCountry
    ? (yearLabel ? `Game sales distribution: ${selectedCountry} (${yearLabel})` : `Game sales distribution: ${selectedCountry}`)
    : (yearLabel ? `Game sales distribution: Global (${yearLabel})` : 'Game sales distribution');
  
  const height = Math.min(width, 600); 
  
  const {names, colors} = data;
  
  const outerRadius = Math.min(width, height) * 0.5 - 0.1 * width;
  const innerRadius = outerRadius - 10;
  
  const formatValue = x => `${d3.format(",.1f")(x)}M`; 
  
  const tickStep = d3.tickStep(0, d3.sum(data.flat()), 100);

  const chord = d3.chord()
      .padAngle(10 / innerRadius)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

  const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  const ribbon = d3.ribbon()
      .radius(innerRadius - 1)
      .padAngle(1 / innerRadius);

  const color = data.colors 
      ? d3.scaleOrdinal(names, data.colors) 
      : d3.scaleOrdinal(names, d3.schemeCategory10);

  // --- MUDANÇA 3: O ViewBox usa width e height reais ---
  // Isso centraliza o gráfico num canvas de tamanho adequado
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "width: 100%; height: auto; font: 9.5px sans-serif;"); // Aumentei fonte para 12px para leitura melhor
  
  svg.append("text")
      .attr("x", 0)
      .attr("y", -height / 2 + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text(currentTitle);

  const chords = chord(data);

  const group = svg.append("g")
    .selectAll()
    .data(chords.groups)
    .join("g");

  group.append("path")
      .attr("fill", d => color(names[d.index]))
      .attr("d", arc);

  group.append("title")
      .text(d => `${names[d.index]}\n${formatValue(d.value)}`);

  const groupTick = group.append("g")
    .selectAll()
    .data(d => groupTicks(d, tickStep))
    .join("g")
      .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

  groupTick.append("line")
      .attr("stroke", "currentColor")
      .attr("x2", 6);

  groupTick.append("text")
      .attr("x", 8)
      .attr("dy", "0.35em")
      .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
      .text(d => formatValue(d.value));

  group.select("text")
      .attr("font-weight", "bold")
      .text(function(d) {
        return this.getAttribute("text-anchor") === "end"
            ? `↑ ${names[d.index]}`
            : `${names[d.index]} ↓`;
      });

  svg.append("g")
      .attr("fill-opacity", 0.8)
    .selectAll("path")
    .data(chords)
    .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("fill", d => color(names[d.source.index]))
      .attr("d", ribbon)
    .append("title")
      .text(d => `${formatValue(d.target.value)} ${names[d.source.index]} → ${names[d.target.index]}`);

  return svg.node();
}


function _groupTicks(d3){return(
function groupTicks(d, step) {
  const k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, d.value, step).map(value => {
    return {value: value, angle: value * k + d.startAngle};
  });
}
)}

function _data(d3,salesByYear)
{
  const regionMap = {
    "NA_Sales": "North America",
    "EU_Sales": "Europe",
    "JP_Sales": "Japan",
    "Other_Sales": "Other"
  };
  const regionKeys = Object.keys(regionMap);
  const regionNames = Object.values(regionMap);
  
  const devSales = d3.rollup(salesByYear, v => ({
      NA_Sales: d3.sum(v, d => d.NA_Sales),
      EU_Sales: d3.sum(v, d => d.EU_Sales),
      JP_Sales: d3.sum(v, d => d.JP_Sales),
      Other_Sales: d3.sum(v, d => d.Other_Sales),
      Total: d3.sum(v, d => d.Global_Sales)
    }), d => d.Developer);

  const topDevs = Array.from(devSales, ([name, values]) => ({name, ...values}))
    .sort((a, b) => b.Total - a.Total)
    .slice(0, 10);

  const devNames = topDevs.map(d => d.name);
  
  const names = [...devNames, ...regionNames];
  
  const indexMap = new Map(names.map((name, i) => [name, i]));
  
  const matrix = Array.from({length: names.length}, () => new Array(names.length).fill(0));

  topDevs.forEach(dev => {
    const sourceIndex = indexMap.get(dev.name);
    
    regionKeys.forEach(key => {
      const targetName = regionMap[key];
      const targetIndex = indexMap.get(targetName);
      const value = dev[key];

      matrix[sourceIndex][targetIndex] = value;
      matrix[targetIndex][sourceIndex] = value; 
    });
  });

  const colors = [
    ...d3.schemeTableau10.slice(0, d3.min([10, names.length - 4])), 
    "#333", "#555", "#777", "#999" 
  ];
  
  return Object.assign(matrix, {names, colors});
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["sales_by_dev_country.csv", {url: new URL("./files/a21c10f012f914b19beb0b51bf3e1f8ecf26daeeb6322a9685fc52e79c15f02d9ef159c8a9b384ba82c8a8126c651772ff1d8bd0e9d6330e616b8700ff2cfa32.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["final_videogame_sales@5.csv", {url: new URL("./files/ab029e6e7b4ce1987b9dacf3828caaff152541709d47c7ae03f1f1e7821b0153de23cd220e40c443b89703b9a0a1c17270630e00b832d03b0ac84f41960d14ae.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("world")).define("world", ["d3"], _world);
  main.variable(observer("sales")).define("sales", ["FileAttachment"], _sales);
  main.variable(observer("total_sales_by_dev_country")).define("total_sales_by_dev_country", ["FileAttachment"], _total_sales_by_dev_country);
  main.variable(observer("salesByCountry")).define("salesByCountry", ["selectedCountry","sales"], _salesByCountry);
  main.variable(observer("salesByYear")).define("salesByYear", ["selectedYear","salesByCountry"], _salesByYear);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("viewof selectedYear")).define("viewof selectedYear", ["selectedCountry","vl","salesByCountry","width","Event"], _selectedYear);
  main.variable(observer("selectedYear")).define("selectedYear", ["Generators", "viewof selectedYear"], (G, _) => G.input(_));
  main.variable(observer("debug")).define("debug", ["selectedYear"], _debug);
  main.variable(observer()).define(["md"], _10);
  main.variable(observer("genrePieChart")).define("genrePieChart", ["selectedYear","selectedCountry","vl","salesByYear","width"], _genrePieChart);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("scatterScoreVsSales")).define("scatterScoreVsSales", ["selectedYear","selectedCountry","vl","salesByYear","width"], _scatterScoreVsSales);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer("scatterCriticVsSales")).define("scatterCriticVsSales", ["selectedYear","selectedCountry","vl","salesByYear","width"], _scatterCriticVsSales);
  main.variable(observer()).define(["md"], _16);
  main.variable(observer("topGamesChart")).define("topGamesChart", ["selectedYear","selectedCountry","vl","salesByYear","width"], _topGamesChart);
  main.variable(observer()).define(["md"], _18);
  main.variable(observer("viewof selectedCountry")).define("viewof selectedCountry", ["total_sales_by_dev_country","topojson","world","d3","Event", "width"], _selectedCountry);
  main.variable(observer("selectedCountry")).define("selectedCountry", ["Generators", "viewof selectedCountry"], (G, _) => G.input(_));
  main.variable(observer()).define(["selectedCountry"], _20);
  main.variable(observer()).define(["md"], _21);
  main.variable(observer("chart")).define("chart", ["selectedYear","selectedCountry","data","d3","groupTicks", "width"], _chart);
  main.variable(observer("groupTicks")).define("groupTicks", ["d3"], _groupTicks);
  main.variable(observer("data")).define("data", ["d3","salesByYear"], _data);
  return main;
}