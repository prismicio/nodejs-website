
/**
 * Module dependencies.
 */
var prismic = require('prismic-nodejs');
var app = require('./config');
var configuration = require('./prismic-configuration');
var PORT = app.get('port');

// Returns a Promise
function api(req, res) {
  // So we can use this information in the views
  res.locals.ctx = {
    endpoint: configuration.apiEndpoint,
    linkResolver: configuration.linkResolver
  };
  return prismic.api(configuration.apiEndpoint, {
    accessToken: configuration.accessToken,
    req: req
  });
}

// Error handling
function handleError(err, req, res) {
  if (err.status == 404) {
    res.status(404).send("404 not found");
  } else {
    res.status(500).send("Error 500: " + err.message);
  }
}

app.listen(PORT, function() {
  console.log('Express server listening on port ' + PORT);
});

// Route used when integrating the preview functionality
app.route('/preview').get(function(req, res) {
  api(req, res).then(function(api) {
    return prismic.preview(api, configuration.linkResolver, req, res);
  }).catch(function(err) {
    handleError(err, req, res);
  });
});

// Route for pages
app.route('/:uid').get(function(req, res) {
  var uid = req.params.uid;
  api(req, res).then(function(api) {
    api.getByUID("page", uid).then(function(pageContent) {
      api.getByUID("menu", "main-nav").then(function(menuContent) {
        res.render('page', {
          pageContent: pageContent,
          menuContent: menuContent
        });
      }).catch(function(err) {
        handleError(err, req, res);
      });
    }).catch(function(err) {
      handleError(err, req, res);
    });
  });
});

// Route for the homepage
app.route('/').get(function(req, res){
  api(req, res).then(function(api) {
    api.getByUID("homepage", "homepage").then(function(pageContent) {
      api.getByUID("menu", "main-nav").then(function(menuContent) {
        res.render('homepage', {
          pageContent: pageContent,
          menuContent: menuContent
        });
      }).catch(function(err) {
        handleError(err, req, res);
      });
    }).catch(function(err) {
      handleError(err, req, res);
    });
  });
});

