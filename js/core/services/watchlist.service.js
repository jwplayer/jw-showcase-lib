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

    var LOCAL_STORAGE_KEY = 'jwshowcase.watchlist';

    angular
        .module('jwShowcase.core')
        .service('watchlist', watchlist);

    /**
     * @ngdoc service
     * @name jwShowcase.core.watchlist
     *
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.session
     * @requires jwShowcase.core.serviceWorker
     */
    watchlist.$inject = ['dataStore', 'session', 'serviceWorker'];
    function watchlist (dataStore, session, serviceWorker) {

        this.addItem    = addItem;
        this.hasItem    = hasItem;
        this.removeItem = removeItem;
        this.restore    = restore;
        this.persist    = persist;
        this.clearAll   = clearAll;

        activate();

        ////////////////

        function activate() {
            session.watch(LOCAL_STORAGE_KEY, function(data) {
                dataStore.watchlistFeed.playlist = [];

                enhanceItems(data);
            }, true);
        }

        /**
         * @param {jwShowcase.core.item} item
         * @description
         * Find index of given item in watchlist
         *
         * @private
         * @returns {number}
         */
        function findItemIndex (item) {

            var playlist = dataStore.watchlistFeed.playlist;

            return playlist.findIndex(function (current) {
                return item.mediaid === current.mediaid;
            });
        }

        /**
         * @ngdoc property
         * @name jwShowcase.core.watchlist#addItem
         * @propertyOf jwShowcase.core.watchlist
         *
         * @param {jwShowcase.core.item} item
         * @param {boolean} [download=true]
         *
         * @description
         * Add given item to watchlist
         */
        function addItem (item, download, skipPersist) {

            var index = findItemIndex(item),
                clone;

            download = angular.isDefined(download) ? download : true;

            if (index === -1) {
                clone         = angular.extend({}, item);
                clone.$feedid = clone.$feedid || clone.feedid;
                clone.feedid  = dataStore.watchlistFeed.feedid;

                dataStore.watchlistFeed.playlist.unshift(clone);
                if (!skipPersist) {
                    persist();
                }

                if (download && serviceWorker.isSupported()) {
                    return serviceWorker.downloadItem(item);
                }
            }
        }

        /**
         * @ngdoc property
         * @name jwShowcase.core.watchlist#removeItem
         * @propertyOf jwShowcase.core.watchlist
         *
         * @param {jwShowcase.core.item} item
         *
         * @description
         * Remove given item to watchlist
         */
        function removeItem (item) {

            var index = findItemIndex(item);

            if (index !== -1) {
                dataStore.watchlistFeed.playlist.splice(index, 1);
                persist();

                if (serviceWorker.isSupported()) {
                    serviceWorker.removeDownloadedItem(item);
                }
            }
        }

        /**
         * @ngdoc property
         * @name jwShowcase.core.watchlist#hasItem
         * @propertyOf jwShowcase.core.watchlist
         *
         * @param {jwShowcase.core.item} item
         *
         * @description
         * Returns true if the given item exists in the watchlist
         *
         * @returns {boolean}
         */
        function hasItem (item) {

            return findItemIndex(item) !== -1;
        }

        /**
         * @ngdoc property
         * @name jwShowcase.core.watchlist#persist
         * @propertyOf jwShowcase.core.watchlist
         *
         * @description
         * Persist watchlist to localStorage
         */
        function persist () {

            var playlist = dataStore.watchlistFeed.playlist,
                data     = playlist.map(function (item) {
                    return {
                        mediaid: item.mediaid,
                        feedid:  item.$feedid
                    };
                });

            session.save(LOCAL_STORAGE_KEY, data);
        }

        /**
         * @ngdoc property
         * @name jwShowcase.core.watchlist#clearAll
         * @propertyOf jwShowcase.core.watchlist
         *
         * @description
         * Clear watchlist and session
         */
        function clearAll () {

            if (serviceWorker.isSupported()) {
                angular.forEach(dataStore.watchlistFeed.playlist, function (item) {
                    serviceWorker.removeDownloadedItem(item);
                });
            }

            // empty playlist in dataStore
            dataStore.watchlistFeed.playlist = [];

            // clear data in session
            session.clear(LOCAL_STORAGE_KEY);
        }

        function enhanceItems (data, skipPersist) {

            if (!data) {
                return;
            }

            return data.map(function (keys) {
                var item = dataStore.getItem(keys.mediaid, keys.feedid);

                if (!item) {
                    return;
                }

                item.feedid = dataStore.watchlistFeed.feedid;
                item.$feedid = keys.feedid;

                addItem(item, false, true);
            });
        }


        /**
         * @ngdoc property
         * @name jwShowcase.core.watchlist#restore
         * @propertyOf jwShowcase.core.watchlist
         *
         * @description
         * Restores watchlist from session
         */
        function restore () {

            return session.load(LOCAL_STORAGE_KEY, []).then(function (data) {
                enhanceItems(data);
            });
        }
    }

}());
