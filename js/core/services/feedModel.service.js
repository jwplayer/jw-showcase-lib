/**
 * Copyright 2017 Longtail Ad Solutions Inc.
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
        .factory('FeedModel', feedModelFactory);

    /**
     * @ngdoc service
     * @name jwShowcase.core.FeedModel
     */
    feedModelFactory.$inject = [];
    function feedModelFactory () {

        function FeedModel (feedId, title, navigable) {

            this.feedid = feedId;

            this.title = title || '';

            this.playlist = [];

            this.navigable = navigable || true;

            this.loading = false;

            this.error = false;

            /**
             * Find item inside this feed
             * @param {string} mediaId
             */
            this.findItem = function (mediaId) {

                return this.playlist.find(function (item) {
                    return item.mediaid === mediaId;
                });
            };

            /**
             * Make a copy of the current FeedModel
             * @returns {FeedModel}
             */
            this.clone = function () {

                var clone = new FeedModel(this.feedid, this.title);
                clone.playlist = this.playlist.slice(0);
                return clone;
            };
        }

        return FeedModel;
    }

}());