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

        function FeedModel (feedId, title) {

            var eventListeners = [];

            this.feedid = feedId;

            this.title = title || '';

            this.playlist = [];

            this.findItem = function (mediaId) {

                return this.playlist.find(function (item) {
                    return item.mediaid === mediaId;
                });
            };

            this.on = function (name, callback) {

                eventListeners.push({
                    name:     name,
                    callback: callback
                });
            };

            this.off = function (name, callback) {

                var index = eventListeners.indexOf(function (listener) {
                    return name === listener.name && callback === listener.callback;
                });

                if (-1 !== index) {
                    eventListeners.splice(index, 1);
                }
            };

            this.fire = function (name) {

                var args = Array.prototype.slice.call(arguments, 1);

                eventListeners
                    .filter(function (listener) {
                        return name === listener.name;
                    })
                    .forEach(function (listener) {
                        listener.callback.apply(null, args);
                    });
            };
        }

        return FeedModel;
    }

}());