;(function(exports) {
  //var data = addToCalendar.generateCalendars({title:"this is the title of my event", start: new Date(), duration: 90});
  //console.log(data);

  var tmdb = {
    key: 'api_key=d53664a6df0a653bf72589aa5275e342',
    base: 'https://api.themoviedb.org/3', // /movie/550?';
    pop: '/discover/movie?sort_by=popularity.desc',
    future: '/discover/movie?primary_release_date.gte=' + (new Date()).toISOString().substring(0, 10),
    configuration: '/configuration',
    upcoming: '/movie/upcoming',
    search: '/search/movie',
    
    // can or should be loaded from configuration end point
    imageBaseUrl: '',
    imageSize: 'w185',
  }

  var app;

  function getJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
  };

  function tmdbUrl(subUrl) {
    if (subUrl.indexOf('?') >= 0) {
      return tmdb.base + subUrl + '&' + tmdb.key;
    } else {
      return tmdb.base + subUrl + '?' + tmdb.key;
    }
  }

  function getParams() {
    var urlParams = {};
    var match;
    var pl     = /\+/g;  // Regex for replacing addition symbol with a space
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
    var query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query)) {
      urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
  }

  function getData(subUrl) {
    return new Promise(function(resolve, reject) {
      var url = tmdbUrl(subUrl);
      fetch(url).then(response => {
        response.json().then(data => {
          resolve(data);
          //data: data,
          //status: response.status
        }).catch(reason => {
          reject(reason);
        });
      }).catch(reason => {
        reject(reason);
      });
      //.then(res => {
      //  console.log("Done with fetch", res.status, res.data.title);
      //}));
    });
  
    /*getJSON(url,
      function(err, data) {
        if (err !== null) {
          console.log('Something went wrong: ' + err);
        } else {
          console.log('Your query count: ' + data);
          app.movies = data.results;
        }
        app.message = "";
      });*/
  }

  function tmdbImageUrl(path) {
    // "poster_path": "/5Kg76ldv7VxeX9YlcQXiowHgdX6.jpg",
    // End goal: https://image.tmdb.org/t/p/w500/8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg
    return tmdb.imageBaseUrl + tmdb.imageSize + path;
  }

  function sortByReleaseDate(data) {
    return data.sort(function(a, b){
      var nameA = a.release_date.toLowerCase();
      var nameB = b.release_date.toLowerCase()
      if (nameA < nameB) //sort string ascending
        return 1;
      if (nameA > nameB)
        return -1;
      return 0;
    });
  }

  function processMovies(movies) {
    for (var i = 0; i < movies.length; i++) {
      var movie = movies[i];
      if (movie.release_date) {
        var releaseDate = new Date(movie.release_date);
        var eventInfo = {
          title:movie.title,
          start: releaseDate,
          description: "Movie release date made using https://ubershmekel.github.io/movie2cal/",
          allday: true,
        };
        //movie.calendarLinks = addToCalendar({data:eventInfo}).innerHTML;
        movie.calendarLinks = addToCalendar.generateCalendars({data: eventInfo});
      }
    }
    app.movies = app.movies.concat(movies);
    // sorting out here because the pagination sorting doesn't seem to work.
    app.movies = sortByReleaseDate(app.movies);
    if (app.movies.length == 0) {
      app.message = "No movies found :(";
    } else {
      app.message = "";
    }
  }

  function getNewReleases() {
    var showMoviesUrl = tmdb.future;
    // Example: https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=d53664a6df0a653bf72589aa5275e342
    getData(showMoviesUrl).then(data => {
      processMovies(data.results);
    })
    .then(() => {
      getData(showMoviesUrl + '&page=2')
      .then(data => {
        processMovies(data.results);
      });
    });
  }

  function initTmdb() {
    return getData(tmdb.configuration).then(configData => {
      tmdb.imageBaseUrl = configData.images.secure_base_url; // "https://image.tmdb.org/t/p/"
      // still sizes = 0: "w92" 1: "w185" 2: "w300" 3: "original"
    })
  }

  function getSearchResults(query) {
    app.search = query;
    console.log("searching for", query);
    getData(tmdb.search + '?query=' + query)
    .then(data => {
      processMovies(data.results);
    });
  }

  function initVueApp() {
    app = new Vue({
      el: '#app',
      data: {
        message: 'Loading movies',
        movies: [],
        search: "",
      },
      methods: {
        tmdbImageUrl: tmdbImageUrl,
      },
    });
  }

  function main(event) {
    initVueApp();

    initTmdb().then(() => {
      var params = getParams();
      if (params.q && params.q.length > 0) {
        getSearchResults(params.q);
      } else {
        getNewReleases();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", main);

})(this);
