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
        .module('jwShowcase.video')
        .controller('VideoController', VideoController);

    /**
     * @ngdoc controller
     * @name jwShowcase.video.controller:VideoController
     *
     * @requires $scope
     * @requires $state
     * @requires $stateParams
     * @requires $timeout
     * @requires jwShowcase.core.dataStore
     * @requires jwShowcase.core.popup
     * @requires jwShowcase.core.watchProgress
     * @requires jwShowcase.core.watchlist
     * @requires jwShowcase.core.seo
     * @requires jwShowcase.core.userSettings
     * @requires jwShowcase.core.utils
     * @requires jwShowcase.core.player
     * @requires jwShowcase.core.platform
     * @requires jwShowcase.core.serviceWorker
     * @requires jwShowcase.config
     */
    VideoController.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'dataStore', 'popup', 'watchProgress',
        'watchlist', 'seo', 'userSettings', 'utils', 'player', 'platform', 'serviceWorker', 'config', 'feed', 'item',
        'recommendations'];
    function VideoController ($scope, $state, $stateParams, $timeout, dataStore, popup,
                              watchProgress, watchlist, seo, userSettings, utils, player, platform, serviceWorker,
                              config, feed, item, recommendations) {

        var vm                   = this,
            lastPos              = 0,
            resumed              = false,
            started              = false,
            requestQualityChange = false,
            startTime            = null,
            playlist             = [],
            levels,
            watchProgressItem,
            loadingTimeout;

        /**
         * Current playing item
         * @type {jwShowcase.core.item}
         */
        vm.item = item;

        /**
         * Config
         * @type {jwShowcase.config}
         */
        vm.config = config;

        /**
         * Loading flag
         * @type {boolean}
         */
        vm.loading = true;

        /**
         * Feed which is being used as playlist for the player.
         * @type {jwShowcase.core.feed}
         */
        vm.activeFeed = null;

        /**
         * Title of feed
         * @type {string}
         */
        vm.activeFeedTitle = 'Next Up';

        /**
         * Is true when the right rail is enabled.
         * @type {boolean}
         */
        vm.enableRail = config.options.rightRail.enabled;

        vm.onComplete     = onComplete;
        vm.onFirstFrame   = onFirstFrame;
        vm.onTime         = onTime;
        vm.onPlaylistItem = onPlaylistItem;
        vm.onLevels       = onLevels;
        vm.onReady        = onReady;
        vm.onError        = onError;
        vm.onSetupError   = onSetupError;
        vm.onAdImpression = onAdImpression;

        vm.cardClickHandler = cardClickHandler;

        activate();

        ////////////////////////

        /**
         * Initialize controller.
         */
        function activate () {

            updateFeeds();

            playlist = generatePlaylist(vm.activeFeed, item);

            vm.playerSettings = {
                width:          '100%',
                height:         '100%',
                aspectratio:    '16:9',
                ph:             4,
                autostart:      $state.params.autoStart,
                playlist:       playlist,
                related:        false,
                preload:        'metadata',
                sharing:        false,
                visualplaylist: false,
                cast:           {},
                analytics:      {
                    bi: config.id
                }
            };

            if ($state.params.startTime) {
                startTime = $state.params.startTime;
            }

            if (angular.isDefined(config.options.cast)) {
                vm.playerSettings.cast = config.options.cast;
            }

            if (!navigator.onLine) {
                vm.playerSettings.advertising = false;
            }

            if (!window.jwplayer.defaults.skin) {
                vm.playerSettings.skin = 'jw-showcase';
            }

            if (!!window.cordova) {
                vm.playerSettings.analytics.sdkplatform = platform.isAndroid ? 1 : 2;
                vm.playerSettings.cast                  = false;
            }

            $scope.$watch(function () {
                return userSettings.settings.conserveBandwidth;
            }, conserveBandwidthChangeHandler);

            $scope.$watch(function () {
                return serviceWorker.isOnline();
            }, function () {
                var state = player.getState();
                if (state !== 'playing' && state !== 'paused') {
                    playlist = generatePlaylist(vm.activeFeed, vm.item);
                    player.load(playlist);
                    update();
                }
            });

            loadingTimeout = $timeout(function () {
                vm.loading = false;
            }, 2000);

            update();
        }

        /**
         * Update feeds
         */
        function updateFeeds () {

            // set activeFeed pointer to the recommendations feed when useRecommendationPlaylist is true and
            // recommendations exists
            if (config.options.useRecommendationPlaylist && recommendations) {
                vm.activeFeed      = recommendations;
                vm.activeFeedTitle = 'Related Videos';
            }
            else {
                vm.activeFeed = feed;
            }
        }

        /**
         * Update controller
         */
        function update () {
            watchProgressItem = watchProgress.getItem(vm.item);
        }

        function updateStateSilently () {

            var stateParams = $state.params;

            stateParams.mediaId = $stateParams.mediaId = vm.item.mediaid;
            stateParams.feedId = $stateParams.feedId = vm.item.feedid;
            stateParams.slug = $stateParams.slug = vm.item.$slug;

            $state.$current.locals.globals.item = vm.item;

            $state
                .go('root.video', {
                    feedId:  vm.item.feedid,
                    mediaId: vm.item.mediaid,
                    slug:    vm.item.$slug
                }, {
                    notify: false
                })
                .then(function () {
                    seo.update();
                });
        }

        /**
         * Generate playlist from feed and current item
         *
         * @param {jwShowcase.core.feed}      feed    Feed
         * @param {jwShowcase.core.item}      item    Current item
         *
         * @returns {Object} Playlist item
         */
        function generatePlaylist (feed, item) {

            var playlistIndex = feed.playlist.findIndex(byMediaId(item.mediaid)),
                isAndroid4    = platform.isAndroid && platform.platformVersion < 5,
                playlistCopy  = angular.copy(feed.playlist),
                playlistItem, sources;

            if (serviceWorker.isSupported()) {
                playlistCopy = playlistCopy.filter(function (item) {
                    return serviceWorker.isOnline() || serviceWorker.hasDownloadedItem(item);
                });
            }

            playlistCopy = playlistCopy
                .slice(playlistIndex)
                .concat(playlistCopy.slice(0, playlistIndex));

            return playlistCopy.map(function (current) {

                // make a copy of the playlist item, we don't want to override the original
                playlistItem = angular.extend({}, current);

                sources = current.sources.filter(function (source) {

                    if (serviceWorker.isSupported() && !navigator.onLine) {
                        return source.type === 'video/mp4' && source.width <= 720;
                    }

                    // filter out HLS streams for Android 4
                    if (isAndroid4 && 'application/vnd.apple.mpegurl' === source.type) {
                        return false;
                    }

                    return 'application/dash+xml' !== source.type;
                });

                if (serviceWorker.isSupported() && !navigator.onLine) {
                    sources.splice(1);
                }

                return angular.extend(playlistItem, {
                    image:   utils.replaceImageSize(current.image, 1920),
                    sources: sources,
                    tracks:  current.tracks
                });
            });
        }

        /**
         * Handle conserveBandwidth setting change
         *
         * @param {boolean} value
         */
        function conserveBandwidthChangeHandler (value) {

            var levelsLength,
                toQuality = 0;

            // nothing to do
            if (!levels) {
                return;
            }

            levelsLength = levels.length;

            if (true === value) {
                toQuality = levelsLength > 2 ? levelsLength - 2 : levelsLength;
            }

            requestQualityChange = toQuality;
        }

        /**
         * Handle ready event
         *
         * @param {Object} event
         */
        function onReady (event) {

            // Disabled because it scrolls down to the player
            // if (config.options.enablePlayerAutoFocus && angular.isFunction(this.getContainer)) {
            //     this.getContainer().focus();
            // }

            if (!vm.playerSettings.autostart) {
                vm.loading = false;
                $timeout.cancel(loadingTimeout);
            }
        }

        /**
         * Handle error event
         *
         * @param {Object} event
         */
        function onError (event) {

            vm.loading = false;
            $timeout.cancel(loadingTimeout);
        }

        /**
         * Handle setup error event
         */
        function onSetupError () {

            popup
                .show({
                    controller:  'ConfirmController as vm',
                    templateUrl: 'views/core/popups/confirm.html',
                    resolve:     {
                        message: 'Something went wrong while loading the video, try again?'
                    }
                })
                .then(function (result) {

                    if (true === result) {
                        $state.reload();
                    }
                });

            vm.loading = false;
            $timeout.cancel(loadingTimeout);
        }

        /**
         * Handle playlist item event
         *
         * @param {Object} event
         */
        function onPlaylistItem (event) {

            var playlistItem = playlist[event.index],
                newItem;

            if (!angular.isNumber(event.index) || !playlistItem) {
                return;
            }

            newItem = dataStore.getItem(playlistItem.mediaid, playlistItem.feedid);

            // return if item doesn't exist or its the same item
            if (!newItem || newItem.mediaid === vm.item.mediaid) {
                return;
            }

            vm.item = newItem;

            updateStateSilently();
            update();
        }

        /**
         * Handle firstFrame event
         */
        function onFirstFrame () {

            var levelsLength;

            if (vm.loading) {
                vm.loading = false;
            }

            started = true;

            if (!levels) {
                return;
            }

            levelsLength = levels.length;

            // hd turned off
            // set quality to last lowest level
            if (true === userSettings.settings.conserveBandwidth) {
                player.setCurrentQuality(levelsLength > 2 ? levelsLength - 2 : levelsLength);
            }
        }

        /**
         * Handle levels event
         *
         * @param event
         */
        function onLevels (event) {

            levels = event.levels;
        }

        /**
         * Handle complete event
         */
        function onComplete () {

            watchProgress.removeItem(vm.item);
        }

        /**
         * Handle time event
         *
         * @param event
         */
        function onTime (event) {

            var position = Math.round(event.position);

            if (false !== requestQualityChange) {
                player.setCurrentQuality(requestQualityChange);
                requestQualityChange = false;
            }

            performConditionalSeek();

            // watchProgress is disabled
            if (false === userSettings.settings.continueWatching || false === config.options.enableContinueWatching) {
                return;
            }

            // resume watch progress fail over when duration was 0 on the play or firstFrame event

            if (true === started && false === resumed && !!watchProgressItem) {
                resumeWatchProgress(event.duration);
                return;
            }

            // occasionally the onTime event fires before the onPlay or onFirstFrame event.
            // so we have to prevent updating the watchProgress before the video has started

            if (false === started || !vm.item.feedid || lastPos === position) {
                return;
            }

            lastPos = position;

            handleWatchProgress(position, event.duration);
        }

        function performConditionalSeek () {
            if (startTime) {
                player.seek(startTime);

                startTime = null;
            }
        }

        /**
         * Handle time event
         *
         * @param event
         */
        function onAdImpression (event) {

            vm.loading = false;
            $timeout.cancel(loadingTimeout);
        }

        /**
         * Resume video playback at last saved position from watchProgress
         *
         * @param {Number} duration
         */
        function resumeWatchProgress (duration) {

            var toWatchProgress = watchProgressItem ? watchProgressItem.progress : 0;

            if (toWatchProgress > 0 && duration > 0) {
                player.seek(toWatchProgress * duration);
                resumed = true;
            }
        }

        /**
         * Saves or removes watchProgress
         *
         * @param {number} position
         * @param {number} duration
         */
        function handleWatchProgress (position, duration) {

            var progress      = position / duration,
                minPosition   = Math.min(10, duration * watchProgress.MIN_PROGRESS),
                maxPosition   = Math.max(duration - 10, duration * watchProgress.MAX_PROGRESS),
                betweenMinMax = position >= minPosition && position < maxPosition;

            if (angular.isNumber(progress) && betweenMinMax && !watchlist.hasItem(vm.item)) {
                watchProgress.saveItem(vm.item, progress);
                return;
            }

            if (watchProgress.hasItem(vm.item)) {
                watchProgress.removeItem(vm.item, progress);
            }
        }

        /**
         * @ngdoc method
         * @name jwShowcase.video.VideoController#cardClickHandler
         * @methodOf jwShowcase.video.VideoController
         *
         * @description
         * Handle click event on the card.
         *
         * @param {jwShowcase.core.item}    newItem         Clicked item
         * @param {boolean}                 clickedOnPlay   Did the user clicked on the play button
         */
        function cardClickHandler (newItem, clickedOnPlay) {

            var playlistIndex = playlist.findIndex(byMediaId(newItem.mediaid));

            // same item
            if (vm.item.mediaid === newItem.mediaid) {
                return;
            }

            if (playlistIndex === -1) {

                return $state.go('root.video', {
                    feedId:    newItem.feedid,
                    mediaId:   newItem.mediaid,
                    slug:      newItem.$slug,
                    autoStart: clickedOnPlay
                });
            }

            // update current item and set playlistItem
            vm.item = angular.extend({}, newItem);

            playlistIndex = playlist.findIndex(byMediaId(vm.item.mediaid));
            player.playlistItem(playlistIndex);

            updateStateSilently();
            update();

            window.TweenLite.to(document.scrollingElement || document.body, 0.3, {
                scrollTop: 0
            });
        }

        /**
         * @param {string} mediaId
         * @returns {Function}
         */
        function byMediaId (mediaId) {

            return function (cursor) {
                return cursor.mediaid === mediaId;
            };
        }
    }

}());
