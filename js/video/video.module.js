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

        var videoState = {
            controller:  'VideoController as vm',
            templateUrl: 'views/video/video.html',
            resolve:     {
                feed:            resolveFeed,
                item:            resolveItem,
                recommendations: resolveRecommendations
            },
            params:      {
                autoStart: false,
                slug:      {
                    value:  null,
                    squash: true
                }
            },
            scrollTop:   0
        };

        $urlRouterProvider
            .when('/list/:feedId/video', '/list/:feedId');

        $stateProvider
            .state('root.video', angular.extend({
                url: '/list/:feedId/video/:mediaId/:slug'
            }, videoState))
            .state('root.videoFromSearch', angular.extend({
                url: '/search/:query/video/:mediaId/:slug'
            }, videoState));

        seoProvider
            .state('root.video', generateSeoState('root.video'))
            .state('root.videoFromSearch', generateSeoState('root.videoFromSearch'));

        /////////////////

        resolveFeed.$inject = ['$stateParams', '$q', 'dataStore', 'apiConsumer', 'bootstrap'];
        function resolveFeed ($stateParams, $q, dataStore, apiConsumer) {

            if ($stateParams.query) {
                return apiConsumer.getSearchFeed($stateParams.query);
            }

            var feed = dataStore.getFeed($stateParams.feedId);

            if (!feed) {
                return $q.reject();
            }

            return feed.promise.then(function (res) {
                return res.clone();
            });
        }

        resolveItem.$inject = ['$stateParams', '$q', 'feed'];
        function resolveItem ($stateParams, $q, feed) {
            return feed.findItem($stateParams.mediaId) || $q.reject();
        }

        resolveRecommendations.$inject = ['$stateParams', 'config', 'apiConsumer', 'FeedModel', 'item'];
        function resolveRecommendations ($stateParams, config, apiConsumer, FeedModel, item) {

            if (!config.recommendationsPlaylist) {
                return;
            }

            var recommendationsFeed = new FeedModel(config.recommendationsPlaylist, 'Related Videos', false);

            recommendationsFeed.relatedMediaId = $stateParams.mediaId;

            return apiConsumer.populateFeedModel(recommendationsFeed, 'recommendations').then(function () {
                recommendationsFeed.playlist.unshift(item);
                return recommendationsFeed;
            }).catch(function () {
                // when this recommendations request fails, don't prevent the video page from loading
                return undefined;
            });
        }

        function generateSeoState (stateName) {

            return ['$state', 'config', 'item', 'utils', function ($state, config, item, utils) {
                var canonical = $state.href(stateName, {slug: item.$slug}, {absolute: true});

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
            }];
        }
    }

}());
