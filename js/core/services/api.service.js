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
        .decorator('$httpBackend', $httpBackendDecorator)
        .service('api', apiService);

    /**
     * @ngdoc service
     * @name jwShowcase.core.api
     *
     * @requires $http
     * @requires $q
     * @requires jwShowcase.config
     */
    apiService.$inject = ['$http', '$q', 'config'];
    function apiService ($http, $q, config) {

        /**
         * @ngdoc method
         * @name jwShowcase.core.api#getFeed
         * @methodOf jwShowcase.core.api
         *
         * @param {string} feedId Id of the feed
         * @description
         * Get feed from jw platform
         *
         * @resolves {jwShowcase.core.feed}
         * @returns {Promise} Promise which will be resolved when the request is completed.
         */
        this.getFeed = function (feedId) {

            // reject when feedId is empty or no string
            if (!angular.isString(feedId) || feedId === '') {
                return $q.reject(new Error('feedId is not given or not a string'));
            }

            return getFeed(config.contentService + '/feed.json?feed_id=' + feedId);
        };

        /**
         * @ngdoc method
         * @name jwShowcase.core.api#getSearchFeed
         * @methodOf jwShowcase.core.api
         *
         * @param {string} searchPlaylist Search playlist
         * @param {string} phrase Search phrase
         * @description
         * Get search feed from jw platform with given search phrase
         *
         * @resolves {jwShowcase.core.feed}
         * @returns {Promise} Promise which be resolved when the request is completed.
         */
        this.getSearchFeed = function (searchPlaylist, phrase) {

            // reject when searchPlaylist is missing
            if (!searchPlaylist) {
                return $q.reject(new Error('searchPlaylist is missing'));
            }

            // reject when feedId is empty or no string
            if (!angular.isString(phrase) || phrase === '') {
                return $q.reject(new Error('search phrase is not given or not a string'));
            }

            phrase = encodeURIComponent(phrase);

            return getFeed(config.contentService + '/feed.json?feed_id=' + searchPlaylist + '&search=' + phrase);
        };

        /**
         * @ngdoc method
         * @name jwShowcase.core.api#getRecommendationsFeed
         * @methodOf jwShowcase.core.api
         *
         * @param {string} recommendationsPlaylist Recommendations playlist
         * @param {string} mediaId Id of item to get related items
         * @description
         * Get recommendations feed from jw platform with given mediaId
         *
         * @resolves {jwShowcase.core.feed}
         * @returns {Promise} Promise which be resolved when the request is completed.
         */
        this.getRecommendationsFeed = function (recommendationsPlaylist, mediaId) {

            // reject when recommendationsPlaylist is missing
            if (!recommendationsPlaylist) {
                return $q.reject(new Error('recommendationsPlaylist is missing'));
            }

            // reject when mediaId is empty or no string
            if (!angular.isString(mediaId) || mediaId === '') {
                return $q.reject(new Error('search phrase is not given or not a string'));
            }

            return getFeed(config.contentService + '/feed.json?feed_id=' + recommendationsPlaylist +
                '&related_media_id=' + mediaId);
        };

        /**
         * @ngdoc method
         * @name jwShowcase.core.api#getPlayer
         * @methodOf jwShowcase.core.api
         *
         * @param {string} playerId Id of the player
         * @description
         * Get JW Player library from jw platform by including the library in the DOM
         *
         * @resolves
         * @returns {Promise} Promise which be resolved when the library is loaded.
         */
        this.getPlayer = function (playerId) {

            var defer  = $q.defer(),
                script = document.createElement('script');

            script.type = 'text/javascript';

            script.onload = function () {
                defer.resolve();
            };

            script.onerror = function () {
                defer.reject(new Error('Player with id `' + playerId + '` could not been loaded'));
            };

            script.src = config.contentService + '/libraries/' + playerId + '.js';
            document.head.appendChild(script);

            return defer.promise;
        };

        /**
         * Get feed from the given URL.
         *
         * @param {string} url
         * @returns {Promise}
         */
        function getFeed (url) {

            return $http.get(url)
                .then(getFeedCompleted, getFeedFailed);

            function getFeedCompleted (response) {

                var feed = response.data;

                // the search feed can return an empty playlist, so we can show "No results for ..."
                if (feed && 'SEARCH' === feed.kind) {
                    feed.playlist = feed.playlist || [];
                }

                if (!feed || !angular.isArray(feed.playlist)) {
                    return getFeedFailed(response);
                }

                feed.playlist = feed.playlist
                    .map(function (item, index) {

                        if (!item.feedId) {
                            item.feedid = feed.feedid;
                        }

                        item.$key = index + item.mediaid;

                        return item;
                    })
                    .map(fixItemUrls);

                return feed;
            }

            function getFeedFailed (response) {

                var message = 'Failed to get feed from `' + url + '`';

                if (404 === response.status) {
                    message = 'Feed with url `' + url + '` does not exist';
                }

                return $q.reject(new Error(message));
            }
        }

        /**
         * Fix urls in item and sources
         *
         * @param {jwShowcase.core.item} [item]
         * @returns {jwShowcase.core.item}
         */
        function fixItemUrls (item) {

            if (!angular.isObject(item)) {
                return item;
            }

            item.image = fixUrl(item.image);

            if (angular.isArray(item.sources)) {
                item.sources = item.sources.map(function (source) {
                    source.file = fixUrl(source.file);
                    return source;
                });
            }

            if (angular.isArray(item.tracks)) {
                item.tracks = item.tracks.map(function (track) {
                    track.file = fixUrl(track.file);
                    return track;
                });
            }

            return item;
        }

        /**
         * Fix url by replacing '//' with 'https://'
         *
         * @param {string} [url]
         * @returns {*}
         */
        function fixUrl (url) {

            if (angular.isString(url) && 0 === url.indexOf('//')) {
                return 'https://' + url.substr(2);
            }

            return url;
        }
    }

    /**
     * @name jwShowcase.core.feed
     * @type Object
     * @property {string}               description    Feed description
     * @property {string}               feedid         Feed id
     * @property {string}               kind           Feed kind
     * @property {jwShowcase.core.item[]}      playlist       Feed playlist
     * @property {string}               title          Feed title
     */

    /**
     * @name jwShowcase.core.item
     * @type Object
     * @property {string[]}             custom          Custom parameters
     * @property {string}               description     Video description
     * @property {string}               image           Video poster image
     * @property {string}               link            Link
     * @property {string}               mediaid         Video id
     * @property {string}               feedid          Feed id (set by apiService)
     * @property {number}               pubdate         Publication date timestamp
     * @property {Object[]}             sources         Video sources
     * @property {string}               tags            Tags
     * @property {string}               title           Video title
     * @property {Object[]}             tracks          Tracks
     * @property {number}               [lastWatched]   Last watched timestamp
     * @property {number}               [progress]      Watch progress percentage
     */

    /**
     * $httpBackendDecorator
     *
     * This decorator will add crossdomain request support for IE9 using XDomainRequest.
     */
    $httpBackendDecorator.$inject = ['$delegate', '$browser'];
    function $httpBackendDecorator ($delegate, $browser) {

        if (!window.XDomainRequest) {
            return $delegate;
        }

        return function (method, url, post, callback, headers, timeout) {

            var location = window.location,
                hostname = location.hostname + (location.port ? ':' + location.port : '');

            url = url.replace('./', 'http://' + hostname + $browser.baseHref());

            if (!/^https?:\/\/([^\?\/]+)/.test(url) || RegExp.$1 === hostname) {
                return $delegate.apply(this, arguments);
            }

            method = method.toUpperCase();
            method = method !== 'GET' ? 'POST' : 'GET';

            //force same protocol
            url = url.replace(/^https?:/, location.protocol);

            doXdrRequest(url, method, timeout, callback);
        };

        /**
         * Do actual XDR request
         *
         * @param {string} url
         * @param {string} method
         * @param {number} timeout
         * @param {function} callback
         */
        function doXdrRequest (url, method, timeout, callback) {

            var xdr        = new window.XDomainRequest();
            xdr.timeout    = timeout || 15000;
            xdr.onprogress = angular.noop;

            xdr.ontimeout = xdr.onerror = function () {
                callback(-1, null, null, '');
            };

            xdr.onload = function () {
                callback(200, xdr.responseText, '', 'OK');
            };

            xdr.open(method, url);
            xdr.send();
        }
    }

}());
