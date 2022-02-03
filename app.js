/*jslint node: true */
/*jshint esnext: true */
'use strict';

/**
 * Module dependencies.
 */
import app from './config.js';
import { client, repoName } from './prismic-configuration.js';
import * as prismicH from '@prismicio/helpers';
import asyncHandler from './utils/async-handler.js';

const route = app();
const PORT = route.get('port');

route.listen(PORT, () => {
  process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);
});

// Middleware to enables Previews
const prismicAutoPreviewsMiddleware = (req, _res, next) => {
  client.enableAutoPreviewsFromReq(req);
  next();
};
route.use(prismicAutoPreviewsMiddleware);

// Middleware to connect to inject prismic context
route.use((req, res, next) => {
  res.locals.ctx = {
    prismicH,
    repoName,
  };
  next();
});

// Route for Previews
route.get(
  '/preview',
  asyncHandler(async (req, res, next) => {
    const redirectUrl = await client.resolvePreviewURL({ defaultURL: '/' });
    res.redirect(302, redirectUrl);
  })
);

// Query the site layout with every route
route.get(
  '*',
  asyncHandler(async (req, res, next) => {
    const menuContent = await client.getSingle('menu');
    res.locals.menuContent = menuContent;
    next();
  })
);

// Route for homepage
route.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const homePageContent = await client.getSingle('homepage');
    res.render('HomePage', { homePageContent });
  })
);

// Route for page
route.get(
  '/:uid',
  asyncHandler(async (req, res, next) => {
    const uid = req.params.uid;
    const pageContent = await client.getByUID('page', uid);
    res.render('page', { pageContent });
  })
);

// 404 route for anything else
route.get('*', async (req, res, next) => {
  res.status(404).render('./error_handlers/404');
});
