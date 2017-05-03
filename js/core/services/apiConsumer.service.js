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

    angular
        .module('jwShowcase.core')
        .service('apiConsumer', apiConsumerService);

    /**
     * @ngdoc service
     * @name jwShowcase.core.apiConsumer
     *
     * @requires $q
     * @requires jwShowcase.config
     * @required jwShowcase.core.api
     * @required jwShowcase.core.dataStore
     */
    apiConsumerService.$inject = ['$q', 'config', 'api', 'dataStore', 'FeedModel'];
    function apiConsumerService ($q, config, api, dataStore, FeedModel) {

        var self = this;

        /**
         * @ngdoc method
         * @name jwShowcase.core.apiConsumer#populateFeedModel
         * @methodOf jwShowcase.core.apiConsumer
         *
         * @returns {Promise} A promise which will be resolved after the api request is finished.
         */
        this.populateFeedModel = function (feed, type) {

            var customOptions = ['backgroundColor', 'featured', 'cols', 'enableText', 'enablePreview'],
                promise;

            if (!feed.feedid) {
                return $q.reject(new Error('feedid is not defined'));
            }

            feed.loading = true;

            if (type === 'recommendations') {

                promise = api.getRecommendationsFeed(feed.feedid, feed.relatedMediaId)
                    .then(function (data) {
                        data.playlist = dataStore.getItems().filter(function (item) {
                            return data.playlist.findIndex(byMediaId(item.mediaid)) !== -1;
                        });
                        return data;
                    });
            }
            else {
                feed.playlist = [];
                promise       = api.getFeed(feed.feedid);
            }

            feed.promise = promise.then(function (data) {

                angular.merge(feed, data);
                setCustomOptions(feed);

                feed.loading = false;

                return feed;
            });

            feed.promise.catch(function (error) {

                feed.error     = error;
                feed.loading   = false;
                feed.navigable = false;

                return feed;
            });

            return feed.promise;

            /**
             * Set custom `showcase.*` options from the feed response
             */
            function setCustomOptions () {

                var value;

                angular.forEach(customOptions, function (key) {

                    value = feed['showcase.' + key];

                    if (!angular.isDefined(value)) {
                        return;
                    }

                    // convert to boolean
                    if (value === 'true' || value === 'false') {
                        feed[key] = value === 'true';
                        return;
                    }

                    // convert to object
                    if (angular.isString(value) && '{' === value[0]) {
                        try {
                            feed[key] = JSON.parse(value);
                        }
                        catch (e) {
                            console.log('Error while parsing JSON from feed custom option: ' + e.message);
                        }
                        return;
                    }

                    feed[key] = value;
                });
            }
        };

        /**
         * @ngdoc method
         * @name jwShowcase.core.apiConsumer#getSearchFeed
         * @methodOf jwShowcase.core.apiConsumer
         *
         * @description
         * Get search feed from the {@link jwShowcase.core.api api} and store it in the
         * {@link jwShowcase.core.dataStore dataStore}. Items not known by JW Showcase will be filtered out.
         *
         * @returns {Promise} A promise which will be resolved after the api request is finished.
         */
        this.getSearchFeed = function (searchPhrase) {

            var promise;

            // empty searchPhrase
            if (!searchPhrase) {
                dataStore.searchFeed.playlist = [];
                return $q.resolve();
            }

            promise = api.getSearchFeed(config.searchPlaylist, searchPhrase);

            promise
                .then(function (response) {

                    var allItems = dataStore.getItems();

                    dataStore.searchFeed.playlist = allItems.filter(function (item) {
                        return response.playlist.findIndex(byMediaId(item.mediaid)) !== -1;
                    });
                }, function (e) {
                    console.log(e.message);
                });

            return promise;
        };

        /**
         * @ngdoc method
         * @name jwShowcase.core.apiConsumer#loadFeedsFromConfig
         * @methodOf jwShowcase.core.apiConsumer
         *
         * @description
         * Load all feeds from the config file.
         *
         * @returns {Promise} A promise which will be resolved after the api request is finished.
         */
        this.loadFeedsFromConfig = function () {

            var promise,
                feedPromises = [];

            if (!angular.isArray(config.content)) {
                return $q.resolve([]);
            }

            dataStore.feeds = config.content.map(function (content) {

                var model;

                if (content.playlistId === dataStore.watchProgressFeed.feedid) {
                    model = dataStore.watchProgressFeed;
                }

                if (content.playlistId === dataStore.watchlistFeed.feedid) {
                    model = dataStore.watchlistFeed;
                }

                if (!model) {

                    model   = new FeedModel(content.playlistId);
                    promise = self
                        .populateFeedModel(model)
                        .then(null, function (error) {

                            // show error, but resolve so we can wait for all feeds to be loaded
                            console.error(error);
                            return $q.resolve();
                        });

                    feedPromises.push(promise);
                }

                angular.extend(model, content);

                return model;
            });

            return $q.all(feedPromises);
        };

        /**
         * @param mediaId
         * @returns {Function}
         */
        function byMediaId (mediaId) {

            return function (item) {
                return item.mediaid === mediaId;
            };
        }
    }

}());
