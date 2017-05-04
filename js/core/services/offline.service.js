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
        .service('offline', offlineService);

    /**
     * @ngdoc service
     * @name jwShowcase.core.offlineService
     *
     * @requires $http
     * @requires $q
     * @requires jwShowcase.config
     */
    offlineService.$inject = ['$rootScope'];
    function offlineService ($rootScope) {

        var self = this;

        this.offlineMediaIds = [];

        this.hasSupport = 'caches' in window;

        this.isOffline = !navigator.onLine;

        this.updateConnectionState = updateConnectionState;

        this.downloadItem = function (item) {

            var urls = getUrlsFromItem(item);

            if (!urls.length) {
                return Promise.reject();
            }

            return openCacheForItem(item).then(function (cache) {
                return cache.match(urls).then(function (cacheItem) {
                    if (cacheItem) {
                        return cacheItem;
                    }

                    var promises = urls.map(function (url) {
                        return window.fetch(url).then(function (response) {
                            return cache.put(url, response);
                        });
                    });

                    return Promise.all(promises)
                        .then(function () {
                            self.offlineMediaIds.push(item.mediaid);
                            $rootScope.$apply();
                        });
                });
            });
        };

        this.removeDownloadedItem = function (item) {

            var name = 'jw-showcase-video-' + item.mediaid;

            return window.caches.has(name)
                .then(function (hasCache) {

                    if (hasCache) {
                        return window.caches.delete(name).then(function () {
                            var index = self.offlineMediaIds.indexOf(item.mediaid);
                            if (index > -1) {
                                self.offlineMediaIds.splice(item.mediaid, 1);
                                $rootScope.$apply();
                            }
                        });
                    }

                    return false;
                });
        };

        this.hasDownloadedItem = function (item) {

            return self.offlineMediaIds.indexOf(item.mediaid) !== -1;
            // return window.caches.has('jw-showcase-video-' + item.mediaid);
        };

        this.prefetchPlayer = function (version) {

            self.send({
                type:    'prefetchPlayer',
                version: version
            });
        };

        this.prefetchConfig = function (config) {

            config = angular.copy(config);

            if (config.bannerImage) {
                config.bannerImage = config.bannerImage.toString();
            }

            self.send({
                type:   'prefetchConfig',
                config: config
            });
        };

        this.send = function (data) {

            if (self.hasSupport) {
                navigator.serviceWorker.ready.then(function (registered) {
                    if (registered.active) {
                        registered.active.postMessage(JSON.stringify(data));
                    }
                });
            }
        };

        function openCacheForItem (item) {

            return window.caches.open('jw-showcase-video-' + item.mediaid);
        }

        function getUrlsFromItem (item) {

            var urls   = [],
                source = item.sources.find(function (source) {
                    return source.type === 'video/mp4' && source.width <= 720;
                });

            if (!source) {
                return [];
            }

            urls.push(source.file);

            if (item.image) {
                urls.push(item.image.replace('720', '1920'));
            }

            urls.push('https://cdn.jwplayer.com/strips/' + item.mediaid + '-120.jpg');

            if (item.tracks) {
                urls = urls.concat(item.tracks.map(function (track) {
                    return track.file;
                }));
            }

            return urls;
        }

        function updateConnectionState () {

            if (navigator.onLine) {
                document.body.classList.remove('jw-flag-offline');
                self.isOffline = false;
            }
            else {
                document.body.classList.add('jw-flag-offline');
                self.isOffline = true;
            }
        }

        updateConnectionState();

        if (this.hasSupport) {

            window.caches.keys().then(function (keyList) {
                keyList.map(function (key) {
                    var matches = key.match(/jw-showcase-video-(.*)/);

                    if (matches && matches[1]) {
                        self.offlineMediaIds.push(matches[1]);
                    }
                });

                $rootScope.$applyAsync();
            });

            window.addEventListener('online', function () {
                updateConnectionState();
                $rootScope.$applyAsync();
            });

            window.addEventListener('offline', function () {
                updateConnectionState();
                $rootScope.$applyAsync();
            });
        }
    }

}());
