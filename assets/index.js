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
        return -1 
      if (nameA > nameB)
        return 1
      return 0;
    });
  }

  function processMovies(movies) {
    for (var i = 0; i < movies.length; i++) {
      var movie = movies[i];
      var releaseDate = new Date(movie.release_date);
      //var calendarLinks = addToCalendar.generateCalendars({data: {title:movie.title, start: releaseDate, allday: true}});
      var eventInfo = {
        title:movie.title,
        start: releaseDate,
        description: "Movie release date",
        allday: true,
      };
      var calendarLinks = addToCalendar({data:eventInfo});
      movie.calendarLinks = calendarLinks.innerHTML;
    }
    return movies;
  }

  function main(event) {
    app = new Vue({
      el: '#app',
      data: {
        message: 'Loading movies',
        movies: [],
      },
      methods: {
        tmdbImageUrl: tmdbImageUrl,
      },
    });
    
    getData(tmdb.configuration).then(configData => {
      //console.log("data");
      //console.log(data);

      tmdb.imageBaseUrl = configData.images.secure_base_url; // "https://image.tmdb.org/t/p/"


      // still sizes = 0: "w92" 1: "w185" 2: "w300" 3: "original"
    }).then(_ => {
      var showMoviesUrl = tmdb.future;
      // Example: https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=d53664a6df0a653bf72589aa5275e342
      getData(showMoviesUrl).then(data => {
        var movies = processMovies(data.results);
        app.movies = movies;
        // sorting out here because the pagination sorting doesn't seem to work.
        app.movies = sortByReleaseDate(app.movies);
        app.message = "";
      })
      .then(_ => {
        getData(showMoviesUrl + '&page=2')
        .then(data => {
          var movies = processMovies(data.results);
          app.movies = app.movies.concat(movies);
          app.movies = sortByReleaseDate(app.movies);
          app.message = "";
        });
      })
      ;
    });
  };

  document.addEventListener("DOMContentLoaded", main);

})(this);