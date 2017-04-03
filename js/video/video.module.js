/**
 * Copyright 2015 Longtail Ad Solutions Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 **/

(function () {

    /**
     * @ngdoc overview
     * @name jwShowcase.video
     *
     * @description
     * Video module
     */
    angular
        .module('jwShowcase.video', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider', 'seoProvider'];
    function config ($stateProvider, $urlRouterProvider, seoProvider) {

        $urlRouterProvider
            .when('/list/:feedId/video', '/list/:feedId');

        $stateProvider
            .state('root.video', {
                url:         '/list/:feedId/video/:mediaId/:slug',
                controller:  'VideoController as vm',
                templateUrl: 'views/video/video.html',
                resolve:     {
                    feed: resolveFeed,
                    item: resolveItem
                },
                params:      {
                    autoStart: false,
                    slug:      {
                        value:  null,
                        squash: true
                    }
                },
                scrollTop:   0
            });

        seoProvider
            .state('root.video', ['$state', 'config', 'item', 'utils', function ($state, config, item, utils) {

                var canonical = $state.href('root.video', {slug: item.$slug}, {absolute: true});

                return {
                    title:       item.title + ' - ' + config.siteName,
                    description: item.description,
                    image:       item.image,
                    canonical:   canonical,
                    schema:      {
                        '@context':   'http://schema.org/',
                        '@type':      'VideoObject',
                        '@id':        canonical,
                        name:         item.title,
                        description:  item.description,
                        duration:     utils.secondsToISO8601(item.duration, true),
                        thumbnailUrl: item.image,
                        uploadDate:   utils.secondsToISO8601(item.pubdate)
                    }
                };
            }]);

        /////////////////

        resolveFeed.$inject = ['$stateParams', '$q', 'dataStore', 'preload'];
        function resolveFeed ($stateParams, $q, dataStore) {

            var feed = dataStore.getFeed($stateParams.feedId);

            // if the feed is loading wait for the promise to resolve.
            if (feed.loading) {
                return feed.promise;
            }

            return feed || $q.reject();
        }

        resolveItem.$inject = ['$stateParams', '$q', 'feed'];
        function resolveItem ($stateParams, $q, feed) {
            return feed.findItem($stateParams.mediaId) || $q.reject();
        }
    }

}());
