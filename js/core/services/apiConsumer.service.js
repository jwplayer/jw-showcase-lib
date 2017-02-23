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
    apiConsumerService.$inject = ['$q', 'config', 'api', 'dataStore'];
    function apiConsumerService ($q, config, api, dataStore) {

        var self = this;

        /**
         * @ngdoc property
         *
         * @type {boolean}
         */
        this.searching = false;

        /**
         * @ngdoc method
         * @name jwShowcase.core.apiConsumer#populateFeedModel
         * @methodOf jwShowcase.core.apiConsumer
         *
         * @returns {Promise} A promise which will be resolved after the api request is finished.
         */
        this.populateFeedModel = function (feed, type) {

            var promise;

            if (feed && feed.feedid) {

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
                    promise = api.getFeed(feed.feedid);
                }

                feed.promise = promise.then(function (data) {

                    angular.merge(feed, data);
                    feed.loading = false;

                    return feed;
                });

                feed.promise.catch(function (error) {

                    feed.error = error;
                    feed.loading = false;
                    feed.navigable = false;

                    return feed;
                });

                return feed.promise;
            }

            return $q.reject(new Error('feedid is not defined'));
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

            // already searching
            if (true === self.searching) {
                $q.reject();
            }

            // empty searchPhrase
            if (!self.searchPhrase) {
                dataStore.searchFeed.playlist = [];
            }

            self.searching = true;

            promise = api.getSearchFeed(config.searchPlaylist, searchPhrase);

            promise
                .then(function (response) {

                    var allItems = dataStore.getItems();

                    dataStore.searchFeed.playlist = allItems.filter(function (item) {
                        return response.playlist.findIndex(byMediaId(item.mediaid)) !== -1;
                    });
                })
                .finally(function () {
                    self.searching = false;
                });

            return promise;
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
