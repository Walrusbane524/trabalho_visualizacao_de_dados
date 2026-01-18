import {Runtime, Library, Inspector} from "./runtime.js";
import define from "./8d7690a8e2a15330@310.js"; 

const library = new Library();

library.width = function() {
  return new library.Generators.observe(notify => {
    let width;
    
    function measuredWidth() {
      const container = document.querySelector("#map-container");
      return container ? container.clientWidth : window.innerWidth;
    }

    function changed() {
      const w = measuredWidth();
      if (w !== width) {
        width = w;
        notify(width);
      }
    }

    window.addEventListener("resize", changed);
    
    changed();
    
    return () => window.removeEventListener("resize", changed);
  });
};

const runtime = new Runtime(library);

const main = runtime.module(define, name => {

  if (name === "viewof selectedCountry") {
    return new Inspector(document.querySelector("#map-container"));
  }

  if (name === "genrePieChart") {
    return new Inspector(document.querySelector("#pie-chart-container"));
  }

  if (name === "scatterScoreVsSales") {
    return new Inspector(document.querySelector("#scatter-user-container"));
  }

  if (name === "scatterCriticVsSales") {
    return new Inspector(document.querySelector("#scatter-critic-container"));
  }

  if (name === "viewof selectedYear") {
    return new Inspector(document.querySelector("#year-filter-container"));
  }

  if (name === "chart") {
    return new Inspector(document.querySelector("#ribbon-chart-container"));
  }

  if (name === "topGamesChart") {
    return new Inspector(document.querySelector("#top-games-container"));
  }

  return null;
});